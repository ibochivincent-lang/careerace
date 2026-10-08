"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Download,
  Printer,
  Loader2,
  AlertCircle,
  FileText,
  Search,
  Check,
  Copy,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export interface PdfJsViewerProps {
  /** File object (from file input or drop) */
  file?: File | null;
  /** Direct URL or Blob URL to PDF */
  url?: string | null;
  /** Raw binary byte buffer */
  data?: Uint8Array | ArrayBuffer | null;
  /** Document title for display and download */
  title?: string;
  /** Initial zoom level (1 = 100%) */
  initialScale?: number;
  /** Optional callback fired when document is loaded */
  onLoadSuccess?: (numPages: number) => void;
  /** Custom container class */
  className?: string;
}

export function PdfJsViewer({
  file,
  url,
  data,
  title = "Document.pdf",
  initialScale = 1.15,
  onLoadSuccess,
  className = "",
}: PdfJsViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(initialScale);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"single" | "continuous">("single");
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);

  // 1. Resolve raw bytes or document source
  useEffect(() => {
    let isCancelled = false;

    async function loadBytes() {
      setIsLoading(true);
      setLoadError(null);

      try {
        if (data) {
          const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
          if (!isCancelled) setPdfBytes(bytes);
          return;
        }

        if (file) {
          const ab = await file.arrayBuffer();
          if (!isCancelled) setPdfBytes(new Uint8Array(ab));
          return;
        }

        if (url) {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP error ${res.status} fetching PDF`);
          const ab = await res.arrayBuffer();
          if (!isCancelled) setPdfBytes(new Uint8Array(ab));
          return;
        }

        if (!isCancelled) {
          setPdfBytes(null);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error("[PdfJsViewer] Error loading PDF source:", err);
          setLoadError(err.message || "Failed to load PDF source.");
          setIsLoading(false);
        }
      }
    }

    loadBytes();

    return () => {
      isCancelled = true;
    };
  }, [file, url, data]);

  // 2. Initialize Mozilla PDF.js document using local self-hosted worker
  useEffect(() => {
    let isCancelled = false;

    if (!pdfBytes || pdfBytes.length === 0) {
      setPdfDoc(null);
      setNumPages(0);
      return;
    }

    async function initPdfJs() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const pdfjs = await import("pdfjs-dist");

        if (typeof window !== "undefined") {
          // Self-hosted worker in public/pdfjs/
          pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
        }

        const loadingTask = pdfjs.getDocument({
          data: pdfBytes as any,
          cMapUrl: "/pdfjs/cmaps/",
          cMapPacked: true,
          standardFontDataUrl: "/pdfjs/standard_fonts/",
          useSystemFonts: true,
          disableFontFace: false,
        });

        const doc = await loadingTask.promise;

        if (!isCancelled) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setCurrentPage(1);
          setIsLoading(false);
          onLoadSuccess?.(doc.numPages);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error("[PdfJsViewer] PDF.js Document initialization error:", err);
          setLoadError(err.message || "Could not parse PDF with Mozilla PDF.js.");
          setIsLoading(false);
        }
      }
    }

    initPdfJs();

    return () => {
      isCancelled = true;
    };
  }, [pdfBytes, onLoadSuccess]);

  // 3. Render Current Page onto High-DPI Canvas
  const renderPage = useCallback(
    async (pageNumber: number) => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        // Cancel previous pending render task if still active
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {}
          renderTaskRef.current = null;
        }

        setIsRendering(true);
        const page = await pdfDoc.getPage(pageNumber);
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) return;

        // Viewport calculations with rotation
        const viewport = page.getViewport({ scale, rotation });
        const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

        // Set buffer dimensions for high DPI retina rendering
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);

        // Set CSS display dimensions
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const renderContext = {
          canvasContext: context,
          viewport,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
        };

        const task = page.render(renderContext);
        renderTaskRef.current = task;
        await task.promise;
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.warn("[PdfJsViewer] Page render notice:", err);
        }
      } finally {
        setIsRendering(false);
      }
    },
    [pdfDoc, scale, rotation]
  );

  useEffect(() => {
    if (pdfDoc && viewMode === "single") {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, scale, rotation, viewMode, renderPage]);

  // Navigation handlers
  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(numPages, prev + 1));
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(3.0, +(prev + 0.15).toFixed(2)));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(0.5, +(prev - 0.15).toFixed(2)));
  };

  const handleResetZoom = () => {
    setScale(1.15);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleFitWidth = () => {
    if (!containerRef.current || !pdfDoc) return;
    pdfDoc.getPage(currentPage).then((page: any) => {
      const naturalViewport = page.getViewport({ scale: 1.0, rotation });
      const containerWidth = containerRef.current?.clientWidth || 800;
      const targetScale = Math.max(0.5, (containerWidth - 64) / naturalViewport.width);
      setScale(+targetScale.toFixed(2));
    });
  };

  const handleDownload = () => {
    if (!pdfBytes) return;
    const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = title.endsWith(".pdf") ? title : `${title}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    toast.success("Downloaded PDF file");
  };

  const handlePrint = () => {
    if (!pdfBytes) return;
    const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);
    const printWindow = window.open(blobUrl, "_blank");
    if (printWindow) {
      printWindow.focus();
      printWindow.onload = () => printWindow.print();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col w-full h-full rounded-xl border border-border/80 bg-card overflow-hidden shadow-sm ${className}`}
    >
      {/* ── TOP MOZILLA PDF.JS TOOLBAR ── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/80 bg-muted/40 gap-2 overflow-x-auto whitespace-nowrap text-xs">
        {/* Left: Document Badge & Page Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant="outline"
            className="text-[10px] bg-background text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-mono py-0.5 px-2 flex items-center gap-1"
          >
            <FileText className="w-3 h-3" />
            <span>Mozilla PDF.js</span>
          </Badge>

          {numPages > 0 && (
            <div className="flex items-center gap-1 bg-background border border-border/80 rounded-lg p-0.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevPage}
                disabled={currentPage <= 1 || isRendering}
                className="h-6 w-6 rounded-md hover:bg-muted"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>

              <span className="text-[11px] font-medium px-1.5 tabular-nums text-foreground">
                {currentPage} / {numPages}
              </span>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextPage}
                disabled={currentPage >= numPages || isRendering}
                className="h-6 w-6 rounded-md hover:bg-muted"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Center: Zoom & View Controls */}
        <div className="flex items-center gap-1 bg-background border border-border/80 rounded-lg p-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            disabled={scale <= 0.5 || isRendering}
            className="h-6 w-6 rounded-md hover:bg-muted"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>

          <button
            type="button"
            onClick={handleResetZoom}
            className="text-[11px] font-mono px-1.5 text-muted-foreground hover:text-foreground transition-colors tabular-nums"
            title="Click to reset zoom to 100%"
          >
            {Math.round(scale * 100)}%
          </button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            disabled={scale >= 3.0 || isRendering}
            className="h-6 w-6 rounded-md hover:bg-muted"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>

          <div className="w-px h-3 bg-border mx-0.5" />

          <Button
            variant="ghost"
            size="icon"
            onClick={handleFitWidth}
            className="h-6 w-6 rounded-md hover:bg-muted"
            title="Fit to Width"
          >
            <Maximize2 className="w-3 h-3" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleRotate}
            className="h-6 w-6 rounded-md hover:bg-muted"
            title="Rotate 90° Clockwise"
          >
            <RotateCw className="w-3 h-3" />
          </Button>
        </div>

        {/* Right: Actions (Download & Print) */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrint}
            disabled={!pdfBytes}
            className="h-6 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
            title="Print Document"
          >
            <Printer className="w-3 h-3" />
            <span className="hidden sm:inline">Print</span>
          </Button>

          <Button
            size="sm"
            onClick={handleDownload}
            disabled={!pdfBytes}
            className="h-6 px-2.5 text-[11px] gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg shadow-2xs"
            title="Download PDF file"
          >
            <Download className="w-3 h-3" />
            <span>Download</span>
          </Button>
        </div>
      </div>

      {/* ── CANVAS VIEWPORT ── */}
      <div className="flex-1 overflow-auto bg-slate-900/95 dark:bg-black/90 p-3 sm:p-6 flex items-center justify-center min-h-[500px] relative select-text">
        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center text-center p-8 space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-200">Initializing Mozilla PDF.js Engine...</p>
              <p className="text-[11px] text-slate-400">Loading vector glyphs and document streams locally.</p>
            </div>
          </div>
        )}

        {/* Error Fallback */}
        {!isLoading && loadError && (
          <div className="flex flex-col items-center justify-center text-center p-8 space-y-3 max-w-md">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-foreground">Failed to render PDF</p>
              <p className="text-[11px] text-muted-foreground">{loadError}</p>
            </div>
            {pdfBytes && (
              <Button size="sm" onClick={handleDownload} className="text-xs h-7">
                Download PDF Directly
              </Button>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !loadError && !pdfDoc && (
          <div className="flex flex-col items-center justify-center text-center p-8 space-y-2 text-slate-400">
            <FileText className="w-8 h-8 opacity-40" />
            <p className="text-xs">No PDF document loaded</p>
          </div>
        )}

        {/* High-DPI HTML5 Canvas rendered by Mozilla PDF.js */}
        <canvas
          ref={canvasRef}
          className={`shadow-2xl rounded-xs bg-white transition-opacity duration-150 ${
            isLoading || loadError ? "hidden" : isRendering ? "opacity-75" : "opacity-100"
          }`}
          style={{
            maxWidth: "100%",
            display: isLoading || loadError ? "none" : "block",
          }}
        />
      </div>
    </div>
  );
}
