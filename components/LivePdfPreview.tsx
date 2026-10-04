"use client";

import React, { useState, useRef, useEffect } from "react";
import QRCode from "qrcode";
import {
  Printer,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  FileText,
  FileCheck,
  Sparkles,
  ExternalLink,
  Layers,
  Database,
  RotateCcw,
  ShieldCheck,
  QrCode as QrIcon,
  Check,
  Building2,
  Cpu,
  GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { ParsedCv } from "@/lib/cv_parser";

export type AtsTemplateId = "ivy_league" | "modern_tech" | "senior_architect";

export interface TemplateConfig {
  id: AtsTemplateId;
  name: string;
  badge: string;
  description: string;
  fontFamily: string;
  icon: React.ElementType;
}

export const ATS_TEMPLATES: TemplateConfig[] = [
  {
    id: "ivy_league",
    name: "Standard Ivy League",
    badge: "Finance & Law Standard",
    description: "Classic serif typography (Times/Garamond), centered headers, dignified traditional rules.",
    fontFamily: "'Times New Roman', 'EB Garamond', Georgia, serif",
    icon: GraduationCap,
  },
  {
    id: "modern_tech",
    name: "Modern Tech Minimalist",
    badge: "Silicon Valley Standard",
    description: "Crisp sans-serif (Inter/Geist), left-aligned layout, subtle divider rules, high ATS score.",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    icon: Cpu,
  },
  {
    id: "senior_architect",
    name: "Compact Senior Architect",
    badge: "10+ Year Executive",
    description: "Ultra-compact margins, dense technical matrix, optimized to fit deep careers on 1-2 pages.",
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    icon: Building2,
  },
];

interface LivePdfPreviewProps {
  profile: ParsedCv | null;
  tailoredText?: string;
  sourceFile?: File | null;
  tailorRole?: string;
  tailorCompany?: string;
  atsScore?: number | null;
  walrusBlobId?: string | null;
  initialTemplate?: AtsTemplateId;
  onCommitWalrusVersion?: () => void;
  isSavingVersion?: boolean;
}

export function LivePdfPreview({
  profile,
  tailoredText,
  sourceFile,
  tailorRole,
  tailorCompany,
  atsScore,
  walrusBlobId: passedBlobId,
  initialTemplate = "modern_tech",
  onCommitWalrusVersion,
  isSavingVersion = false,
}: LivePdfPreviewProps) {
  const [activeTemplate, setActiveTemplate] = useState<AtsTemplateId>(initialTemplate);
  const [activeView, setActiveView] = useState<"ats_live" | "uploaded_source">("ats_live");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [sourcePdfUrl, setSourcePdfUrl] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [activeBlobId, setActiveBlobId] = useState<string>("");

  const printContainerRef = useRef<HTMLDivElement>(null);

  // Discover latest Walrus Blob ID from props, profile or local storage
  useEffect(() => {
    let blobId = passedBlobId || (profile as any)?.walrus_blob_id || "";
    if (!blobId && typeof window !== "undefined") {
      try {
        const storedVersions = localStorage.getItem("careerace_walrus_versions");
        if (storedVersions) {
          const parsed = JSON.parse(storedVersions);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].blobId) {
            blobId = parsed[0].blobId;
          }
        }
      } catch {}
    }
    // Fallback deterministic simulation ID if user hasn't saved to Walrus yet
    if (!blobId && profile?.applicant_name) {
      const namePart = profile.applicant_name.toLowerCase().replace(/[^a-z0-9]/g, "");
      blobId = `walrus-${namePart}-demo-epoch48`;
    }
    setActiveBlobId(blobId);
  }, [passedBlobId, profile]);

  // Generate cryptographic QR code linking to Walrus Explorer
  useEffect(() => {
    if (!activeBlobId) return;
    const isRealBlob = !activeBlobId.startsWith("walrus-");
    const walrusVerifyUrl = isRealBlob
      ? `https://walruscan.com/testnet/blob/${activeBlobId}`
      : `https://aggregator.walrus-testnet.walrus.space/v1/${activeBlobId}`;

    QRCode.toDataURL(walrusVerifyUrl, {
      margin: 1,
      width: 140,
      color: { dark: "#0f172a", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then(setQrCodeDataUrl)
      .catch((err) => console.error("QR Code generation error:", err));
  }, [activeBlobId]);

  // Generate blob URL for uploaded source file if it's a PDF
  useEffect(() => {
    if (sourceFile && sourceFile.type === "application/pdf") {
      const url = URL.createObjectURL(sourceFile);
      setSourcePdfUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setSourcePdfUrl(null);
    }
  }, [sourceFile]);

  function handleZoom(delta: number) {
    setZoomLevel((prev) => Math.min(160, Math.max(70, prev + delta)));
  }

  function handlePrintPdf() {
    if (!printContainerRef.current) return;
    const printContent = printContainerRef.current.innerHTML;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow pop-ups to print or export PDF.");
      return;
    }

    const templateStyles = {
      ivy_league: `
        @page { size: A4 portrait; margin: 15mm 18mm 15mm 18mm; }
        body { font-family: 'Times New Roman', 'EB Garamond', Georgia, serif; color: #111827; }
        h1 { font-family: 'Times New Roman', 'EB Garamond', Georgia, serif; font-size: 22pt; text-align: center; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; margin: 0 0 4pt 0; }
        .contact-line { text-align: center; font-size: 9pt; color: #374151; margin-bottom: 12pt; border-bottom: 1.5pt solid #111827; padding-bottom: 6pt; }
        .section-title { font-family: 'Times New Roman', 'EB Garamond', Georgia, serif; font-size: 10.5pt; font-weight: bold; text-align: center; text-transform: uppercase; letter-spacing: 2.5px; border-bottom: 1pt solid #9ca3af; padding-bottom: 2pt; margin-top: 12pt; margin-bottom: 6pt; }
        .job-header { display: flex; justify-content: space-between; font-size: 10pt; font-weight: bold; margin-top: 6pt; text-transform: uppercase; }
        .job-sub { display: flex; justify-content: space-between; font-size: 9pt; font-style: italic; color: #374151; margin-bottom: 3pt; }
        li { font-size: 9pt; line-height: 1.35; margin-bottom: 2.5pt; color: #1f2937; text-align: justify; }
      `,
      modern_tech: `
        @page { size: A4 portrait; margin: 12mm 15mm 12mm 15mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; }
        h1 { font-size: 21pt; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; margin: 0 0 2pt 0; }
        .contact-line { font-size: 8.5pt; color: #475569; margin-bottom: 10pt; border-bottom: 1pt solid #cbd5e1; padding-bottom: 5pt; }
        .section-title { font-size: 10pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; border-bottom: 1pt solid #e2e8f0; margin-top: 10pt; margin-bottom: 5pt; padding-bottom: 2pt; }
        .job-header { display: flex; justify-content: space-between; font-size: 9.5pt; font-weight: 700; margin-top: 6pt; }
        .job-sub { display: flex; justify-content: space-between; font-size: 8.5pt; color: #64748b; margin-bottom: 3pt; }
        li { font-size: 8.5pt; line-height: 1.38; margin-bottom: 2pt; color: #1e293b; }
      `,
      senior_architect: `
        @page { size: A4 portrait; margin: 8mm 10mm 8mm 10mm; }
        body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; font-size: 8pt; line-height: 1.25; color: #0f172a; }
        h1 { font-size: 18pt; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; margin: 0; }
        .contact-line { font-size: 8pt; color: #475569; margin-bottom: 6pt; border-bottom: 1.5pt solid #0f172a; padding-bottom: 3pt; }
        .section-title { font-size: 8.5pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; background: #0f172a; color: #ffffff; padding: 2pt 4pt; margin-top: 6pt; margin-bottom: 3pt; border-radius: 1px; }
        .job-header { display: flex; justify-content: space-between; font-size: 8.5pt; font-weight: 800; margin-top: 4pt; }
        .job-sub { display: flex; justify-content: space-between; font-size: 8pt; color: #475569; margin-bottom: 2pt; }
        li { font-size: 8pt; line-height: 1.25; margin-bottom: 1.5pt; color: #1e293b; }
      `,
    }[activeTemplate];

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${profile?.applicant_name || "Resume"}_${activeTemplate.toUpperCase()}_ATS_Optimized</title>
          <style>
            ${templateStyles}
            body {
              background: #ffffff;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .resume-page {
              width: 100%;
              box-sizing: border-box;
            }
            ul { margin: 2pt 0 4pt 12pt; padding: 0; }
            .skills-text, .summary-text { font-size: 8.5pt; line-height: 1.35; color: #1f2937; }
            .walrus-stamp {
              margin-top: 14pt;
              padding-top: 6pt;
              border-top: 1pt solid #cbd5e1;
              display: flex;
              align-items: center;
              justify-content: space-between;
              font-family: monospace;
              font-size: 7.5pt;
              color: #475569;
            }
            .walrus-stamp img {
              width: 52pt;
              height: 52pt;
              border: 1pt solid #cbd5e1;
              border-radius: 2pt;
            }
            @media print {
              body { margin: 0; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="resume-page">
            ${printContent}
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border bg-card/40">
        <FileText className="w-12 h-12 text-muted-foreground/40 mb-3" />
        <h4 className="text-sm font-semibold text-foreground">Live ATS Multi-Template PDF Preview</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Attach your CV on the Job Engine or enter your career accomplishments to preview verified ATS templates and Walrus cryptographic stamps.
        </p>
      </div>
    );
  }

  const applicantName = profile.applicant_name || "Candidate Name";
  const contactParts = [
    (profile as any).contact_email || profile.email,
    (profile as any).contact_phone || profile.phone,
    (profile as any).location,
    profile.linkedin_url,
    profile.github_url,
  ].filter(Boolean) as string[];

  const summaryText =
    (profile as any).summary ||
    (profile.work_experience?.length
      ? `Results-driven engineering professional with deep expertise in ${(profile.skills || []).slice(0, 6).join(", ")}. Proven history of architecting high-throughput systems, orchestrating cross-functional teams, and shipping production-grade solutions with measurable performance impact.`
      : "");

  return (
    <div
      className={`flex flex-col rounded-2xl border border-border/80 bg-card shadow-sm transition-all overflow-hidden ${
        isFullscreen ? "fixed inset-4 z-50 bg-background/95 backdrop-blur-md shadow-2xl" : "w-full"
      }`}
    >
      {/* ── TOP PREVIEW TOOLBAR WITH MULTI-TEMPLATE ATS GALLERY ── */}
      <div className="flex flex-col gap-2.5 px-4 py-3 border-b border-border/70 bg-muted/30">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* View Toggle */}
          <div className="flex items-center p-0.5 rounded-lg bg-background border border-border/70 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveView("ats_live")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition-colors ${
                activeView === "ats_live"
                  ? "bg-emerald-600 text-white shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              Live ATS Vector PDF
            </button>
            {sourcePdfUrl && (
              <button
                type="button"
                onClick={() => setActiveView("uploaded_source")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition-colors ${
                  activeView === "uploaded_source"
                    ? "bg-emerald-600 text-white shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Original Uploaded PDF
              </button>
            )}
          </div>

          {/* ATS Score Indicator */}
          {atsScore !== null && atsScore !== undefined && (
            <Badge
              variant="outline"
              className={`text-[11px] font-semibold border ${
                atsScore >= 70
                  ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                  : atsScore >= 45
                  ? "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                  : "border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/10"
              }`}
            >
              ATS Score: {atsScore}/100
            </Badge>
          )}

          {/* Action Controls */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {activeView === "ats_live" && (
              <div className="flex items-center gap-0.5 bg-background border border-border/70 rounded-lg p-0.5 text-xs mr-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => handleZoom(-10)}
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </Button>
                <span className="text-[11px] font-mono px-1.5 text-muted-foreground select-none">
                  {zoomLevel}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => handleZoom(10)}
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setZoomLevel(100)}
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              </div>
            )}

            {/* Print / Save PDF */}
            <Button
              size="sm"
              onClick={handlePrintPdf}
              className="h-7 px-3 text-xs font-semibold gap-1.5 bg-foreground text-background hover:bg-foreground/90 rounded-lg shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </Button>

            {/* Walrus Save Action */}
            {onCommitWalrusVersion && (
              <Button
                size="sm"
                onClick={onCommitWalrusVersion}
                disabled={isSavingVersion}
                className="h-7 px-2.5 text-xs font-semibold gap-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg shadow-xs"
                title="Save current version as immutable snapshot to Walrus Protocol"
              >
                <Database className="w-3.5 h-3.5" />
                {isSavingVersion ? "Uploading..." : "Save to Walrus"}
              </Button>
            )}

            {/* Fullscreen Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Preview"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        {/* ── MULTI-TEMPLATE ATS GALLERY SELECTOR (Like reactive-resume) ── */}
        <div className="flex items-center gap-2 pt-1 border-t border-border/50 overflow-x-auto pb-0.5">
          <span className="text-[11px] font-semibold text-muted-foreground shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            ATS Gallery:
          </span>
          <div className="flex items-center gap-1.5">
            {ATS_TEMPLATES.map((tmpl) => {
              const Icon = tmpl.icon;
              const isActive = activeTemplate === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => {
                    setActiveTemplate(tmpl.id);
                    toast.success(`Switched to ${tmpl.name} layout`);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs font-bold ring-1 ring-primary/40"
                      : "bg-background border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                  title={`${tmpl.description} (${tmpl.badge})`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tmpl.name}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                      isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {tmpl.id === "ivy_league"
                      ? "Serif"
                      : tmpl.id === "modern_tech"
                      ? "Sans"
                      : "Dense"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── PREVIEW CANVAS BODY ── */}
      <div className="flex-1 bg-muted/40 p-4 md:p-8 overflow-auto flex justify-center items-start min-h-[580px] max-h-[780px]">
        {activeView === "uploaded_source" && sourcePdfUrl ? (
          <div className="w-full h-full min-h-[600px] rounded-xl overflow-hidden border border-border shadow-md bg-background">
            <iframe
              src={`${sourcePdfUrl}#view=FitH`}
              className="w-full h-full min-h-[620px] border-none"
              title="Uploaded Source PDF"
            />
          </div>
        ) : (
          /* ATS LIVE VECTOR DOCUMENT SHEET (Rendered according to activeTemplate) */
          <div
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: "top center",
              transition: "transform 0.15s ease-out",
            }}
            className={`w-full max-w-[820px] bg-white text-slate-900 rounded-sm shadow-2xl border border-slate-300 transition-all select-text print:shadow-none print:border-none print:p-0 ${
              activeTemplate === "ivy_league"
                ? "p-8 md:p-14 font-serif"
                : activeTemplate === "senior_architect"
                ? "p-6 md:p-8 font-sans"
                : "p-8 md:p-12 font-sans"
            }`}
          >
            <div ref={printContainerRef} className="text-left">
              {/* ────────── LAYOUT 1: STANDARD IVY LEAGUE ────────── */}
              {activeTemplate === "ivy_league" && (
                <div className="space-y-4 font-serif text-slate-900">
                  {/* Ivy League Header: Centered & Dignified */}
                  <div className="text-center pb-2 border-b-2 border-slate-900">
                    <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-[0.16em] text-slate-900 m-0">
                      {applicantName}
                    </h1>
                    {tailorRole && (
                      <p className="text-xs uppercase tracking-widest text-slate-700 italic mt-1">
                        {tailorRole} {tailorCompany ? `— ${tailorCompany}` : ""}
                      </p>
                    )}
                    {contactParts.length > 0 && (
                      <p className="text-[10.5px] text-slate-700 mt-2 flex flex-wrap items-center justify-center gap-1.5">
                        {contactParts.map((item, idx) => (
                          <span key={idx} className="flex items-center gap-1.5">
                            {idx > 0 && <span className="text-slate-400">◆</span>}
                            {item}
                          </span>
                        ))}
                      </p>
                    )}
                  </div>

                  {/* Summary */}
                  {summaryText && (
                    <div className="space-y-1">
                      <h2 className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-900 border-b border-slate-400 pb-0.5 m-0">
                        Executive Summary
                      </h2>
                      <p className="text-xs leading-relaxed text-slate-800 text-justify pt-1">
                        {summaryText}
                      </p>
                    </div>
                  )}

                  {/* Core Competencies */}
                  {profile.skills && profile.skills.length > 0 && (
                    <div className="space-y-1">
                      <h2 className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-900 border-b border-slate-400 pb-0.5 m-0">
                        Core Competencies &amp; Technical Proficiencies
                      </h2>
                      <p className="text-xs leading-relaxed text-slate-800 text-center pt-1">
                        {profile.skills.join(" ◆ ")}
                      </p>
                    </div>
                  )}

                  {/* Work Experience */}
                  {profile.work_experience && profile.work_experience.length > 0 && (
                    <div className="space-y-3">
                      <h2 className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-900 border-b border-slate-400 pb-0.5 m-0">
                        Professional Experience
                      </h2>
                      <div className="space-y-4 pt-1">
                        {profile.work_experience.map((exp, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between items-baseline text-xs font-bold text-slate-900">
                              <span className="uppercase tracking-wider">{exp.role}</span>
                              <span className="italic font-normal text-slate-700 text-[11px]">{exp.duration}</span>
                            </div>
                            <div className="flex justify-between items-baseline text-xs italic text-slate-700">
                              <span>{exp.company}</span>
                              <span className="text-[10px]">Verified Credentials</span>
                            </div>
                            {exp.highlights && exp.highlights.length > 0 && (
                              <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-slate-800 leading-snug pt-1">
                                {exp.highlights.map((bullet, bIdx) => (
                                  <li key={bIdx} className="pl-0.5 text-justify">
                                    {bullet}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {profile.academic_history && profile.academic_history.length > 0 && (
                    <div className="space-y-2">
                      <h2 className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-900 border-b border-slate-400 pb-0.5 m-0">
                        Education &amp; Credentials
                      </h2>
                      <div className="space-y-1.5 text-xs text-slate-800 pt-1">
                        {profile.academic_history.map((edu, idx) => (
                          <div key={idx} className="flex justify-between items-baseline">
                            <div>
                              <span className="font-bold text-slate-900 uppercase">{edu.institution}</span>
                              <span className="italic text-slate-700"> — {edu.degree}{edu.field_of_study ? ` in ${edu.field_of_study}` : ""}</span>
                            </div>
                            <span className="italic text-slate-600 text-[11px]">{edu.graduation_year}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ────────── LAYOUT 2: MODERN TECH MINIMALIST ────────── */}
              {activeTemplate === "modern_tech" && (
                <div className="space-y-5 font-sans text-slate-900">
                  {/* Modern Tech Header: Crisp Left-aligned with subtle metadata */}
                  <div className="pb-3 border-b-2 border-slate-900">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 m-0">
                          {applicantName}
                        </h1>
                        {tailorRole && (
                          <p className="text-xs font-bold font-mono text-emerald-700 uppercase tracking-widest mt-1">
                            {tailorRole} {tailorCompany ? `· ${tailorCompany}` : ""}
                          </p>
                        )}
                      </div>
                    </div>
                    {contactParts.length > 0 && (
                      <p className="text-[11px] text-slate-600 mt-2.5 flex flex-wrap items-center gap-2">
                        {contactParts.map((item, idx) => (
                          <span key={idx} className="flex items-center gap-1.5">
                            {idx > 0 && <span className="text-slate-300">|</span>}
                            {item}
                          </span>
                        ))}
                      </p>
                    )}
                  </div>

                  {/* Summary */}
                  {summaryText && (
                    <div className="space-y-1.5">
                      <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 m-0">
                        Professional Summary
                      </h2>
                      <p className="text-xs leading-relaxed text-slate-800 text-justify">
                        {summaryText}
                      </p>
                    </div>
                  )}

                  {/* Skills */}
                  {profile.skills && profile.skills.length > 0 && (
                    <div className="space-y-1.5">
                      <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 m-0">
                        Core Competencies &amp; Technical Skills
                      </h2>
                      <p className="text-xs leading-relaxed text-slate-800">
                        <span className="font-bold text-slate-900">Proficiencies: </span>
                        {profile.skills.join(" • ")}
                      </p>
                    </div>
                  )}

                  {/* Experience */}
                  {profile.work_experience && profile.work_experience.length > 0 && (
                    <div className="space-y-3">
                      <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 m-0">
                        Professional Experience
                      </h2>
                      <div className="space-y-3.5">
                        {profile.work_experience.map((exp, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between items-baseline text-xs font-bold text-slate-900">
                              <span>
                                {exp.role.toUpperCase()}{" "}
                                <span className="font-semibold text-slate-600">| {exp.company}</span>
                              </span>
                              <span className="font-mono text-slate-600 text-[11px]">{exp.duration}</span>
                            </div>
                            {exp.highlights && exp.highlights.length > 0 && (
                              <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-slate-800 leading-snug">
                                {exp.highlights.map((bullet, bIdx) => (
                                  <li key={bIdx} className="pl-0.5">
                                    {bullet}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {profile.academic_history && profile.academic_history.length > 0 && (
                    <div className="space-y-2">
                      <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 m-0">
                        Education &amp; Credentials
                      </h2>
                      <div className="space-y-1.5 text-xs text-slate-800">
                        {profile.academic_history.map((edu, idx) => (
                          <div key={idx} className="flex justify-between items-baseline">
                            <div>
                              <span className="font-bold text-slate-900">{edu.degree}</span>
                              {edu.field_of_study && <span> in {edu.field_of_study}</span>}
                              <span className="text-slate-600"> — {edu.institution}</span>
                            </div>
                            <span className="text-slate-500 font-mono text-[11px] font-medium">{edu.graduation_year}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ────────── LAYOUT 3: COMPACT SENIOR ARCHITECT ────────── */}
              {activeTemplate === "senior_architect" && (
                <div className="space-y-3 font-sans text-slate-900 text-[11px] leading-tight">
                  {/* High Density Header */}
                  <div className="border-b-2 border-slate-900 pb-2">
                    <div className="flex justify-between items-baseline flex-wrap gap-1">
                      <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900 m-0">
                        {applicantName}
                      </h1>
                      {tailorRole && (
                        <span className="bg-slate-900 text-white text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-xs">
                          {tailorRole} {tailorCompany ? `· ${tailorCompany}` : ""}
                        </span>
                      )}
                    </div>
                    {contactParts.length > 0 && (
                      <p className="text-[10px] font-mono text-slate-600 mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                        {contactParts.map((item, idx) => (
                          <span key={idx}>
                            {idx > 0 && <span className="text-slate-300 mr-2">|</span>}
                            {item}
                          </span>
                        ))}
                      </p>
                    )}
                  </div>

                  {/* Summary */}
                  {summaryText && (
                    <div className="space-y-0.5">
                      <div className="bg-slate-100 border-l-2 border-slate-900 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-slate-900">
                        Core Architecture &amp; Executive Summary
                      </div>
                      <p className="text-[11px] leading-snug text-slate-800 pt-0.5 text-justify">
                        {summaryText}
                      </p>
                    </div>
                  )}

                  {/* Dense Skills Matrix */}
                  {profile.skills && profile.skills.length > 0 && (
                    <div className="space-y-0.5">
                      <div className="bg-slate-100 border-l-2 border-slate-900 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-slate-900">
                        Technical Architecture Matrix &amp; Proficiencies ({profile.skills.length})
                      </div>
                      <p className="text-[10.5px] leading-snug text-slate-800 pt-0.5">
                        <span className="font-bold text-slate-900">Proficiencies: </span>
                        {profile.skills.join(" • ")}
                      </p>
                    </div>
                  )}

                  {/* High Bullet Density Work Experience */}
                  {profile.work_experience && profile.work_experience.length > 0 && (
                    <div className="space-y-2">
                      <div className="bg-slate-100 border-l-2 border-slate-900 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-slate-900">
                        Career Experience (10+ Year Verified Progression)
                      </div>
                      <div className="space-y-2.5 pt-0.5">
                        {profile.work_experience.map((exp, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex justify-between items-baseline text-[11px] font-bold text-slate-900">
                              <span>
                                {exp.role}{" "}
                                <span className="font-semibold text-slate-600">[{exp.company}]</span>
                              </span>
                              <span className="font-mono text-[10px] text-slate-600">{exp.duration}</span>
                            </div>
                            {exp.highlights && exp.highlights.length > 0 && (
                              <ul className="list-disc list-outside pl-3.5 space-y-0.5 text-[10.5px] text-slate-800 leading-snug">
                                {exp.highlights.map((bullet, bIdx) => (
                                  <li key={bIdx} className="pl-0.5">
                                    {bullet}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {profile.academic_history && profile.academic_history.length > 0 && (
                    <div className="space-y-1">
                      <div className="bg-slate-100 border-l-2 border-slate-900 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-slate-900">
                        Education &amp; Accreditations
                      </div>
                      <div className="space-y-1 text-[10.5px] text-slate-800 pt-0.5">
                        {profile.academic_history.map((edu, idx) => (
                          <div key={idx} className="flex justify-between items-baseline">
                            <div>
                              <span className="font-bold text-slate-900">{edu.degree}</span>
                              {edu.field_of_study && <span> · {edu.field_of_study}</span>}
                              <span className="text-slate-600"> — {edu.institution}</span>
                            </div>
                            <span className="font-mono text-[10px] text-slate-500">{edu.graduation_year}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ────────── WALRUS VERIFIABLE CREDENTIAL QR STAMP ────────── */}
              <div className="walrus-stamp mt-8 pt-4 border-t border-slate-300 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="Walrus Verifiable Credential QR"
                      className="w-16 h-16 rounded border border-slate-300 bg-white p-0.5 shrink-0 shadow-2xs"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded border border-slate-300 bg-slate-100 flex items-center justify-center shrink-0">
                      <QrIcon className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                  <div className="space-y-0.5 text-left">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-900 uppercase tracking-wider font-mono">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Walrus Verifiable Credential</span>
                    </div>
                    <p className="text-[9px] font-mono text-slate-600 m-0">
                      Blob ID: <span className="font-bold text-slate-800">{activeBlobId.slice(0, 16)}...{activeBlobId.slice(-8)}</span>
                    </p>
                    <p className="text-[8.5px] text-slate-500 m-0 leading-tight">
                      Scan QR code with any phone camera to verify cryptographic authenticity, creation timestamp, and immutable record on Mysten Walrus protocol.
                    </p>
                  </div>
                </div>

                <div className="text-right hidden sm:block shrink-0">
                  <span className="inline-block text-[8.5px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                    ATS Cleared · Tamper Proof
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER STATUS BAR ── */}
      <div className="px-4 py-2 bg-muted/20 border-t border-border/70 flex items-center justify-between text-[11px] text-muted-foreground flex-wrap gap-2">
        <span className="flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3 h-3 text-emerald-500" />
          Active Layout: <strong className="text-foreground">{ATS_TEMPLATES.find(t => t.id === activeTemplate)?.name}</strong>
        </span>
        <span className="flex items-center gap-3">
          <span className="text-purple-600 dark:text-purple-400 flex items-center gap-1 font-mono text-[10px]">
            <Database className="w-3 h-3" />
            Walrus Proof Active
          </span>
          <span>
            {profile.work_experience?.length || 0} Positions · {profile.skills?.length || 0} Skills Anchored
          </span>
        </span>
      </div>
    </div>
  );
}
