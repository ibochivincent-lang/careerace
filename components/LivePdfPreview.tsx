"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Download,
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
  Check,
  Copy,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { ParsedCv } from "@/lib/cv_parser";

interface LivePdfPreviewProps {
  profile: ParsedCv | null;
  tailoredText?: string;
  sourceFile?: File | null;
  tailorRole?: string;
  tailorCompany?: string;
  atsScore?: number | null;
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
  onCommitWalrusVersion,
  isSavingVersion = false,
}: LivePdfPreviewProps) {
  const [activeView, setActiveView] = useState<"ats_live" | "uploaded_source">("ats_live");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [sourcePdfUrl, setSourcePdfUrl] = useState<string | null>(null);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingJson, setIsExportingJson] = useState(false);

  const printContainerRef = useRef<HTMLDivElement>(null);

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

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${profile?.applicant_name || "Resume"}_ATS_Optimized</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm 12mm 15mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #111827;
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
            h1 { font-size: 20pt; margin: 0 0 4pt 0; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; }
            .contact-line { font-size: 9pt; color: #4B5563; margin-bottom: 12pt; border-bottom: 1.5pt solid #111827; padding-bottom: 6pt; }
            .section-title { font-size: 10.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; border-bottom: 1pt solid #cbd5e1; margin-top: 10pt; margin-bottom: 5pt; padding-bottom: 2pt; }
            .job-header { display: flex; justify-content: space-between; font-size: 9.5pt; font-weight: 700; margin-top: 6pt; margin-bottom: 1pt; }
            .job-sub { display: flex; justify-content: space-between; font-size: 8.5pt; color: #4b5563; margin-bottom: 3pt; font-style: italic; }
            ul { margin: 2pt 0 6pt 14pt; padding: 0; }
            li { font-size: 8.5pt; line-height: 1.35; margin-bottom: 2pt; color: #1f2937; }
            .skills-text { font-size: 8.5pt; line-height: 1.4; color: #1f2937; }
            .summary-text { font-size: 8.5pt; line-height: 1.4; color: #1f2937; margin-bottom: 6pt; }
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

  async function handleExportDocx() {
    if (!profile) return;
    setIsExportingDocx(true);
    const toastId = toast.loading("Generating ATS-compliant Word document...");
    try {
      const res = await fetch("/api/resume/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          format: "docx",
        }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(profile.applicant_name || "Resume").replace(/\s+/g, "_")}_ATS_Optimized.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("ATS Resume .docx downloaded!", { id: toastId });
    } catch {
      toast.error("Failed to generate .docx file", { id: toastId });
    } finally {
      setIsExportingDocx(false);
    }
  }

  async function handleExportJson() {
    if (!profile) return;
    setIsExportingJson(true);
    try {
      const res = await fetch("/api/resume/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          format: "json",
        }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(profile.applicant_name || "Resume").replace(/\s+/g, "_")}_JSON_Resume.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Standard JSON Resume exported!");
    } catch {
      toast.error("Failed to export JSON Resume");
    } finally {
      setIsExportingJson(false);
    }
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border bg-card/40">
        <FileText className="w-12 h-12 text-muted-foreground/40 mb-3" />
        <h4 className="text-sm font-semibold text-foreground">Live PDF Preview Generator</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Upload your resume or paste a job description to see your live, ATS-verified PDF document render instantly.
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
      ? `Results-focused professional with deep expertise in ${(profile.skills || []).slice(0, 6).join(", ")}. Proven track record of architecting reliable systems, delivering measurable impact, and driving organizational success.`
      : "");

  return (
    <div
      className={`flex flex-col rounded-2xl border border-border/80 bg-card shadow-sm transition-all overflow-hidden ${
        isFullscreen ? "fixed inset-4 z-50 bg-background/95 backdrop-blur-md shadow-2xl" : "w-full"
      }`}
    >
      {/* ── TOP PREVIEW TOOLBAR ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/70 bg-muted/30 flex-wrap gap-2">
        <div className="flex items-center gap-2">
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
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Zoom */}
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

          {/* Export PDF Button */}
          <Button
            size="sm"
            onClick={handlePrintPdf}
            className="h-7 px-2.5 text-xs font-semibold gap-1.5 bg-foreground text-background hover:bg-foreground/90 rounded-lg shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save PDF
          </Button>

          {/* Download Word (.docx) */}
          <Button
            size="sm"
            variant="outline"
            disabled={isExportingDocx}
            onClick={handleExportDocx}
            className="h-7 px-2.5 text-xs gap-1.5 rounded-lg border-border"
            title="Download ATS-formatted Microsoft Word .docx"
          >
            <Download className="w-3.5 h-3.5" />
            .docx
          </Button>

          {/* Export JSON Resume */}
          <Button
            size="sm"
            variant="ghost"
            disabled={isExportingJson}
            onClick={handleExportJson}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            title="Export standardized JSON Resume schema"
          >
            JSON
          </Button>

          {/* One-Click Walrus Versioning Trigger */}
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

      {/* ── PREVIEW CANVAS BODY ── */}
      <div className="flex-1 bg-muted/40 p-4 md:p-8 overflow-auto flex justify-center items-start min-h-[560px] max-h-[750px]">
        {activeView === "uploaded_source" && sourcePdfUrl ? (
          <div className="w-full h-full min-h-[600px] rounded-xl overflow-hidden border border-border shadow-md bg-background">
            <iframe
              src={`${sourcePdfUrl}#view=FitH`}
              className="w-full h-full min-h-[620px] border-none"
              title="Uploaded Source PDF"
            />
          </div>
        ) : (
          /* ATS LIVE VECTOR DOCUMENT SHEET (A4 / Letter Standard) */
          <div
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: "top center",
              transition: "transform 0.15s ease-out",
            }}
            className="w-full max-w-[800px] bg-white text-slate-900 rounded-sm shadow-2xl border border-slate-300 p-8 md:p-12 transition-all font-sans select-text print:shadow-none print:border-none print:p-0"
          >
            <div ref={printContainerRef} className="space-y-5 text-left">
              {/* Header: Name and Target Role */}
              <div className="text-center pb-3 border-b-2 border-slate-900">
                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 m-0">
                  {applicantName}
                </h1>
                {tailorRole && (
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mt-1">
                    {tailorRole} {tailorCompany ? `· ${tailorCompany}` : ""}
                  </p>
                )}
                {contactParts.length > 0 && (
                  <p className="text-[11px] text-slate-600 mt-2 flex flex-wrap items-center justify-center gap-2">
                    {contactParts.map((item, idx) => (
                      <span key={idx} className="flex items-center gap-1.5">
                        {idx > 0 && <span className="text-slate-400">|</span>}
                        {item}
                      </span>
                    ))}
                  </p>
                )}
              </div>

              {/* Professional Summary */}
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

              {/* Core Competencies / Technical Skills */}
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

              {/* Work Experience */}
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
                          <span className="font-medium text-slate-600 text-[11px]">{exp.duration}</span>
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

              {/* Education Section */}
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
                        <span className="text-slate-500 text-[11px] font-medium">{edu.graduation_year}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications (if present) */}
              {profile.certifications && profile.certifications.length > 0 && (
                <div className="space-y-1.5">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 m-0">
                    Certifications &amp; Accreditations
                  </h2>
                  <p className="text-xs text-slate-800">
                    {profile.certifications.join(" • ")}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER STATUS BAR ── */}
      <div className="px-4 py-2 bg-muted/20 border-t border-border/70 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-emerald-500" />
          ATS Verified Layout · Single Column · Machine Readable
        </span>
        <span>
          {profile.work_experience?.length || 0} Positions · {profile.skills?.length || 0} Skills Anchored
        </span>
      </div>
    </div>
  );
}
