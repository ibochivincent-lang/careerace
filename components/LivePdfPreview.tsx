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
  Layers,
  Database,
  RotateCcw,
  ShieldCheck,
  QrCode as QrIcon,
  Check,
  Building2,
  Cpu,
  GraduationCap,
  Plus,
  Trash2,
  X,
  Anchor,
  Edit3,
  CheckCircle2,
  Briefcase,
  History,
  ExternalLink,
  Eye,
  Globe,
  Award,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BulletWithActionVerbs } from "@/components/BulletWithActionVerbs";
import { ProofAttachmentModal } from "@/components/ProofAttachmentModal";
import type { ParsedCv } from "@/lib/cv_parser";
import type { ProofAttachment } from "@/lib/heuristic_cv_parser";
import type { WalrusResumeVersionItem } from "@/components/WalrusVersionDrawer";
import { PdfJsViewer } from "@/components/PdfJsViewer";
import { generateDocxBlob } from "@/lib/docx_exporter";

export function isMaritimeCandidate(profile: ParsedCv | null, tailorRole?: string): boolean {
  if (!profile) return false;
  const combined = [
    tailorRole || "",
    ...(profile.target_roles || []),
    ...(profile.skills || []),
    ...(profile.certifications || []),
    ...(profile.work_experience?.map(w => `${w.role} ${w.company} ${(w.highlights || []).join(" ")}`) || []),
    ...(profile.academic_history?.map(a => `${a.degree} ${a.field_of_study} ${a.institution}`) || []),
  ].join(" ").toLowerCase();

  return /\b(marine|maritime|naval|vessel|captain|deck\s+officer|chief\s+engineer|seafarer|seaman|ship|oicew|propulsion|offshore|subsea|stcw|solas|marpol)\b/i.test(combined);
}

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
  walrusVersions?: WalrusResumeVersionItem[];
  initialTemplate?: AtsTemplateId;
  onCommitWalrusVersion?: () => void;
  onOpenWalrusHistory?: () => void;
  isSavingVersion?: boolean;
  isParsing?: boolean;
  onUpdateProfile?: (updated: Partial<ParsedCv>) => void;
  highlightedBulletKey?: string | null;
}

export function LivePdfPreview({
  profile,
  tailoredText,
  sourceFile,
  tailorRole,
  tailorCompany,
  atsScore,
  walrusBlobId: passedBlobId,
  walrusVersions,
  initialTemplate = "modern_tech",
  onCommitWalrusVersion,
  onOpenWalrusHistory,
  isSavingVersion = false,
  isParsing = false,
  onUpdateProfile,
  highlightedBulletKey = null,
}: LivePdfPreviewProps) {
  const [activeTemplate, setActiveTemplate] = useState<AtsTemplateId>(initialTemplate);
  const [activeView, setActiveView] = useState<"ats_live" | "uploaded_source">("ats_live");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [sourcePdfUrl, setSourcePdfUrl] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [activeBlobId, setActiveBlobId] = useState<string>("");
  const [localHighlightedBulletKey, setLocalHighlightedBulletKey] = useState<string | null>(null);

  function triggerLocalBulletHighlight(key: string) {
    setLocalHighlightedBulletKey(key);
    setTimeout(() => setLocalHighlightedBulletKey(null), 3500);
  }
  const [newSkillInput, setNewSkillInput] = useState<string>("");
  const [newCertInput, setNewCertInput] = useState<string>("");
  const [showAddSkillInput, setShowAddSkillInput] = useState<boolean>(false);
  const [showAddCertInput, setShowAddCertInput] = useState<boolean>(false);
  const [showAddLeadershipSection, setShowAddLeadershipSection] = useState<boolean>(false);
  const [showAddConferencesSection, setShowAddConferencesSection] = useState<boolean>(false);

  const [proofModalConfig, setProofModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    category: "work" | "certificate" | "leadership" | "project" | "other";
    targetId?: string;
    existingProof?: ProofAttachment | null;
    onSave: (proof: ProofAttachment | null) => void;
  }>({
    isOpen: false,
    title: "",
    category: "work",
    onSave: () => {},
  });

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

  // Calibrate comfortable ATS print scale on mobile screens (< 640px)
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setZoomLevel(100);
    }
  }, []);

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

  // Profile Update Helpers
  function updateField(fields: Partial<ParsedCv>) {
    onUpdateProfile?.(fields);
  }

  function handleUpdateExperience(expIdx: number, field: string, value: any) {
    if (!profile?.work_experience) return;
    const copy = [...profile.work_experience];
    copy[expIdx] = { ...copy[expIdx], [field]: value };
    updateField({ work_experience: copy });
  }

  function handleAddExperience() {
    const exp = [
      ...(profile?.work_experience || []),
      {
        role: tailorRole || "Lead Systems Engineer",
        company: tailorCompany || "Engineering Operations",
        duration: "2023 - Present",
        highlights: [
          "Spearheaded critical technical deliverables resulting in 28% operational efficiency gains and zero system downtime.",
          "Orchestrated cross-disciplinary workflows while enforcing rigorous safety and ATS quality standards."
        ]
      }
    ];
    updateField({ work_experience: exp });
    toast.success("Added new position to resume");
  }

  function handleRemoveExperience(expIdx: number) {
    if (!profile?.work_experience) return;
    const exp = profile.work_experience.filter((_, idx) => idx !== expIdx);
    updateField({ work_experience: exp });
    toast.success("Removed position from resume");
  }

  function handleUpdateBullet(expIdx: number, bIdx: number, newBullet: string) {
    if (!profile?.work_experience) return;
    const copy = [...profile.work_experience];
    const highlights = [...(copy[expIdx].highlights || [])];
    highlights[bIdx] = newBullet;
    copy[expIdx] = { ...copy[expIdx], highlights };
    updateField({ work_experience: copy });
    triggerLocalBulletHighlight(`${expIdx}-${bIdx}`);
  }

  function handleAddBullet(expIdx: number) {
    if (!profile?.work_experience) return;
    const copy = [...profile.work_experience];
    const highlights = [
      ...(copy[expIdx].highlights || []),
      "Architected high-throughput operational framework optimizing mission-critical reliability."
    ];
    copy[expIdx] = { ...copy[expIdx], highlights };
    updateField({ work_experience: copy });
    toast.success("Added accomplishment bullet");
  }

  function handleDeleteBullet(expIdx: number, bIdx: number) {
    if (!profile?.work_experience) return;
    const copy = [...profile.work_experience];
    const highlights = (copy[expIdx].highlights || []).filter((_, idx) => idx !== bIdx);
    copy[expIdx] = { ...copy[expIdx], highlights };
    updateField({ work_experience: copy });
  }

  function handleAddSkill(skillToAdd?: string) {
    const s = (skillToAdd || newSkillInput).trim();
    if (!s) return;
    const currentSkills = profile?.skills || [];
    if (!currentSkills.map(x => x.toLowerCase()).includes(s.toLowerCase())) {
      updateField({ skills: [...currentSkills, s] });
      toast.success(`Added '${s}' to Core Skills`);
    }
    setNewSkillInput("");
    setShowAddSkillInput(false);
  }

  function handleRemoveSkill(sIdx: number) {
    if (!profile?.skills) return;
    const updated = profile.skills.filter((_, idx) => idx !== sIdx);
    updateField({ skills: updated });
  }

  function handleUpdateEducation(eduIdx: number, field: string, value: any) {
    if (!profile?.academic_history) return;
    const copy = [...profile.academic_history];
    copy[eduIdx] = { ...copy[eduIdx], [field]: value };
    updateField({ academic_history: copy });
  }

  function handleAddEducation() {
    const edu = [
      ...(profile?.academic_history || []),
      {
        institution: "Technical Institute / University",
        degree: "Bachelor of Science",
        field_of_study: "Marine / Mechanical Engineering",
        graduation_year: "2021",
        achievements: []
      }
    ];
    updateField({ academic_history: edu });
    toast.success("Added education credential");
  }

  function handleRemoveEducation(eduIdx: number) {
    if (!profile?.academic_history) return;
    const edu = profile.academic_history.filter((_, idx) => idx !== eduIdx);
    updateField({ academic_history: edu });
    toast.success("Removed education entry");
  }

  function handleAddCertification(certToAdd?: string) {
    const c = (certToAdd || newCertInput).trim();
    if (!c) return;
    const current = profile?.certifications || [];
    if (!current.includes(c)) {
      updateField({ certifications: [...current, c] });
      toast.success(`Added '${c}' certification`);
    }
    setNewCertInput("");
    setShowAddCertInput(false);
  }

  function handleRemoveCertification(cIdx: number) {
    if (!profile?.certifications) return;
    const updated = profile.certifications.filter((_, idx) => idx !== cIdx);
    updateField({ certifications: updated });
  }

  function handleUpdateLeadership(leadIdx: number, field: string, value: any) {
    if (!profile?.leadership) return;
    const copy = [...profile.leadership];
    copy[leadIdx] = { ...copy[leadIdx], [field]: value };
    updateField({ leadership: copy });
  }

  function handleAddLeadership() {
    const current = profile?.leadership || [];
    updateField({
      leadership: [
        ...current,
        {
          role: "Lead Volunteer / Coordinator",
          organization: "Professional Society / Community",
          duration: "2023 - Present",
          highlights: ["Led cross-functional initiatives and spearheaded outreach programs."],
        },
      ],
    });
    toast.success("Added leadership & volunteer entry");
  }

  function handleRemoveLeadership(leadIdx: number) {
    if (!profile?.leadership) return;
    const updated = profile.leadership.filter((_, idx) => idx !== leadIdx);
    updateField({ leadership: updated });
    toast.success("Removed leadership entry");
  }

  function handleAddConference() {
    const current = profile?.conferences || [];
    updateField({
      conferences: [
        ...current,
        {
          name: "Technical Symposium / Industry Conference",
          role_or_topic: "Delegate / Speaker",
          year: "2024",
          location: "Global",
        },
      ],
    });
    toast.success("Added conference & presentation entry");
  }

  function handleRemoveConference(confIdx: number) {
    if (!profile?.conferences) return;
    const updated = profile.conferences.filter((_, idx) => idx !== confIdx);
    updateField({ conferences: updated });
    toast.success("Removed conference entry");
  }

  // Generate pristine vector HTML for high-fidelity PDF printing
  function handlePrintPdf() {
    if (!profile) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow pop-ups to print or export PDF.");
      return;
    }

    const templateStyles = {
      ivy_league: `
        @page { size: A4 portrait; margin: 12mm 16mm 12mm 16mm; }
        body { font-family: 'Times New Roman', 'EB Garamond', Georgia, serif; color: #111827; background: #ffffff; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        h1 { font-family: 'Times New Roman', 'EB Garamond', Georgia, serif; font-size: 22pt; text-align: center; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; margin: 0 0 3pt 0; color: #0f172a; }
        .role-subtitle { text-align: center; font-size: 10pt; font-style: italic; text-transform: uppercase; letter-spacing: 1.5px; color: #334155; margin-bottom: 4pt; }
        .contact-line { text-align: center; font-size: 9pt; color: #374151; margin-bottom: 10pt; border-bottom: 1.5pt solid #111827; padding-bottom: 5pt; }
        .section-title { font-family: 'Times New Roman', 'EB Garamond', Georgia, serif; font-size: 10pt; font-weight: bold; text-align: center; text-transform: uppercase; letter-spacing: 2.5px; border-bottom: 1pt solid #9ca3af; padding-bottom: 2pt; margin-top: 10pt; margin-bottom: 5pt; }
        .job-header { display: flex; justify-content: space-between; font-size: 9.5pt; font-weight: bold; margin-top: 5pt; text-transform: uppercase; }
        .job-sub { display: flex; justify-content: space-between; font-size: 9pt; font-style: italic; color: #374151; margin-bottom: 2pt; }
        ul { margin: 2pt 0 4pt 14pt; padding: 0; }
        li { font-size: 9pt; line-height: 1.35; margin-bottom: 2pt; color: #1f2937; text-align: justify; }
        .skills-text, .summary-text { font-size: 9pt; line-height: 1.35; color: #1f2937; }
        .walrus-stamp { margin-top: 14pt; padding-top: 6pt; border-top: 1pt solid #cbd5e1; display: flex; align-items: center; justify-content: space-between; font-family: monospace; font-size: 7.5pt; color: #475569; }
        .walrus-stamp img { width: 50pt; height: 50pt; border: 1pt solid #cbd5e1; }
      `,
      modern_tech: `
        @page { size: A4 portrait; margin: 10mm 14mm 10mm 14mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #ffffff; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        h1 { font-size: 21pt; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; margin: 0 0 2pt 0; color: #0f172a; }
        .role-subtitle { font-size: 9pt; font-weight: 700; font-family: monospace; color: #047857; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3pt; }
        .contact-line { font-size: 8.5pt; color: #475569; margin-bottom: 8pt; border-bottom: 1pt solid #cbd5e1; padding-bottom: 4pt; }
        .section-title { font-size: 9.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; border-bottom: 1pt solid #e2e8f0; margin-top: 9pt; margin-bottom: 4pt; padding-bottom: 2pt; }
        .job-header { display: flex; justify-content: space-between; font-size: 9pt; font-weight: 700; margin-top: 5pt; }
        .job-sub { display: flex; justify-content: space-between; font-size: 8.5pt; color: #64748b; margin-bottom: 2pt; }
        ul { margin: 2pt 0 4pt 12pt; padding: 0; }
        li { font-size: 8.5pt; line-height: 1.38; margin-bottom: 2pt; color: #1e293b; }
        .skills-text, .summary-text { font-size: 8.5pt; line-height: 1.35; color: #1e293b; }
        .walrus-stamp { margin-top: 14pt; padding-top: 6pt; border-top: 1pt solid #cbd5e1; display: flex; align-items: center; justify-content: space-between; font-family: monospace; font-size: 7.5pt; color: #475569; }
        .walrus-stamp img { width: 50pt; height: 50pt; border: 1pt solid #cbd5e1; }
      `,
      senior_architect: `
        @page { size: A4 portrait; margin: 8mm 10mm 8mm 10mm; }
        body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; font-size: 8pt; line-height: 1.25; color: #0f172a; background: #ffffff; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        h1 { font-size: 18pt; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; margin: 0; }
        .role-subtitle { font-size: 8pt; font-weight: 800; font-family: monospace; color: #0f172a; text-transform: uppercase; margin-bottom: 2pt; }
        .contact-line { font-size: 7.5pt; color: #475569; margin-bottom: 5pt; border-bottom: 1.5pt solid #0f172a; padding-bottom: 2pt; }
        .section-title { font-size: 8.5pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; background: #0f172a; color: #ffffff; padding: 2pt 4pt; margin-top: 5pt; margin-bottom: 2pt; }
        .job-header { display: flex; justify-content: space-between; font-size: 8.5pt; font-weight: 800; margin-top: 3pt; }
        .job-sub { display: flex; justify-content: space-between; font-size: 7.5pt; color: #475569; margin-bottom: 1.5pt; }
        ul { margin: 1pt 0 3pt 10pt; padding: 0; }
        li { font-size: 8pt; line-height: 1.25; margin-bottom: 1.5pt; color: #1e293b; }
        .skills-text, .summary-text { font-size: 8pt; line-height: 1.25; color: #1e293b; }
        .walrus-stamp { margin-top: 10pt; padding-top: 4pt; border-top: 1pt solid #cbd5e1; display: flex; align-items: center; justify-content: space-between; font-family: monospace; font-size: 7pt; color: #475569; }
        .walrus-stamp img { width: 44pt; height: 44pt; border: 1pt solid #cbd5e1; }
      `,
    }[activeTemplate];

    const applicant = profile.applicant_name || "Applicant Name";
    const contactLine = [
      (profile as any).contact_email || profile.email,
      (profile as any).contact_phone || profile.phone,
      (profile as any).location,
      profile.linkedin_url,
      profile.github_url,
      profile.website_url,
    ].filter(Boolean).join("  •  ");

    const roleTitle = tailorRole || profile.target_roles?.[0] || "Systems Engineer";
    const cleanComp = (tailorCompany && tailorCompany.trim() !== "Target Organization" && tailorCompany.trim() !== "Not specified") ? tailorCompany.trim() : "";
    const roleWithCompany = cleanComp ? `${roleTitle} — ${cleanComp}` : roleTitle;

    const summary = (profile as any).summary ||
      (profile.work_experience?.length
        ? `Results-driven engineering professional with deep expertise in ${(profile.skills || []).slice(0, 6).join(", ")}. Proven history of architecting high-throughput systems, orchestrating cross-functional teams, and shipping production-grade solutions with measurable performance impact.`
        : "");

    const expHtml = (profile.work_experience || []).map(exp => {
      const cleanComp = (exp.company && !/^(?:organization|company|employer|client|target organization)$/i.test(exp.company.trim())) ? exp.company.trim() : "";
      return `
      <div style="margin-bottom: 6pt;">
        <div class="job-header">
          <span>${exp.role || "Professional"}</span>
          <span style="font-weight: normal; font-size: 8.5pt;">${exp.duration || ""}</span>
        </div>
        ${cleanComp ? `
        <div class="job-sub">
          <span>${cleanComp}</span>
          <span style="font-size: 7.5pt;">${exp.proofAttachment ? `✓ Proof Anchored on Walrus` : "Verified Record"}</span>
        </div>` : ""}
        ${exp.highlights && exp.highlights.length > 0 ? `
          <ul>
            ${exp.highlights.map(h => `<li>${h}</li>`).join("")}
          </ul>
        ` : ""}
      </div>
    `;}).join("");

    const eduHtml = (profile.academic_history || []).map(edu => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 3pt; font-size: 8.5pt;">
        <div>
          <strong>${edu.degree}</strong>${edu.field_of_study ? ` in ${edu.field_of_study}` : ""} — <em>${edu.institution}</em>
        </div>
        <span style="font-style: italic;">${edu.graduation_year}</span>
      </div>
    `).join("");

    const certsHtml = (profile.certifications || []).length > 0
      ? `<div style="font-size: 8.5pt; color: #1e293b; margin-top: 3pt;">${profile.certifications.join("  •  ")}</div>`
      : "";

    const leadershipHtml = (profile.leadership || []).map(lead => `
      <div style="margin-bottom: 5pt;">
        <div class="job-header">
          <span>${lead.role} — <em>${lead.organization}</em></span>
          <span style="font-weight: normal; font-size: 8.5pt;">${lead.duration || ""}</span>
        </div>
        ${lead.highlights && lead.highlights.length > 0 ? `
          <ul>
            ${lead.highlights.map(h => `<li>${h}</li>`).join("")}
          </ul>
        ` : ""}
      </div>
    `).join("");

    const conferencesHtml = (profile.conferences || []).map(conf => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 2.5pt; font-size: 8.5pt;">
        <div>
          <strong>${conf.name}</strong>${conf.role_or_topic ? ` — <em>${conf.role_or_topic}</em>` : ""}${conf.location ? ` (${conf.location})` : ""}
        </div>
        <span style="font-style: italic;">${conf.year || ""}</span>
      </div>
    `).join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${applicant.replace(/\s+/g, "_")}_${activeTemplate.toUpperCase()}_Resume</title>
          <style>
            ${templateStyles}
          </style>
        </head>
        <body>
          <div class="resume-sheet">
            <h1>${applicant}</h1>
            <div class="role-subtitle">${roleWithCompany}</div>
            <div class="contact-line">${contactLine}</div>

            ${summary ? `
              <div class="section-title">Professional Summary</div>
              <div class="summary-text">${summary}</div>
            ` : ""}

            ${(profile.skills || []).length > 0 ? `
              <div class="section-title">Core Competencies &amp; Technical Proficiencies</div>
              <div class="skills-text"><strong>Proficiencies:</strong> ${profile.skills.join("  •  ")}</div>
            ` : ""}

            ${expHtml ? `
              <div class="section-title">Professional Experience</div>
              <div>${expHtml}</div>
            ` : ""}

            ${eduHtml ? `
              <div class="section-title">Education &amp; Credentials</div>
              <div>${eduHtml}</div>
            ` : ""}

            ${certsHtml ? `
              <div class="section-title">Certifications &amp; Professional Licenses</div>
              <div>${certsHtml}</div>
            ` : ""}

            ${leadershipHtml ? `
              <div class="section-title">Leadership &amp; Community Service</div>
              <div>${leadershipHtml}</div>
            ` : ""}

            ${conferencesHtml ? `
              <div class="section-title">Conferences &amp; Presentations</div>
              <div>${conferencesHtml}</div>
            ` : ""}



            <div class="walrus-stamp">
              <div style="display: flex; align-items: center; gap: 8pt;">
                ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" alt="Walrus QR" />` : ""}
                <div>
                  <div style="font-weight: bold; text-transform: uppercase;">Walrus Verifiable Credential</div>
                  <div>Blob ID: ${activeBlobId ? `${activeBlobId.slice(0, 16)}...${activeBlobId.slice(-8)}` : "Verified On-chain"}</div>
                  <div style="font-size: 6.5pt; color: #64748b;">Cryptographically sealed &amp; anchored on Mysten Walrus Testnet</div>
                </div>
              </div>
              <div style="text-align: right;">
                <span style="border: 1pt solid #cbd5e1; padding: 2pt 4pt; border-radius: 2pt; font-weight: bold; color: #047857;">ATS CLEARED • TAMPER PROOF</span>
              </div>
            </div>
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

  async function handleDownloadDocx() {
    if (!profile) return;
    const toastId = toast.loading("Compiling 100% ATS-compliant Word (.docx)...");
    try {
      const blob = await generateDocxBlob(profile);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(profile.applicant_name || "Candidate").replace(/\s+/g, "_")}_Resume.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Downloaded Word (.docx) resume!", { id: toastId });
    } catch (err) {
      toast.error("Failed to compile Word (.docx) document", { id: toastId });
    }
  }

  if (!profile && isParsing) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-emerald-500/50 bg-emerald-500/5 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <h4 className="text-sm font-bold text-foreground">Reading & Formatting into Live ATS Canvas...</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Extracting candidate credentials, work achievements, and technical skills into the interactive editor.
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border bg-card/40">
        <FileText className="w-12 h-12 text-muted-foreground/40 mb-3" />
        <h4 className="text-sm font-semibold text-foreground">Live ATS Interactive Document Canvas</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Attach your CV to open the unified live editor canvas, optimize weak bullet verbs with 1-click power action verbs, and stamp your Walrus proof.
        </p>
      </div>
    );
  }

  const applicantName = profile.applicant_name || "Applicant Name";
  const contactEmail = (profile as any).contact_email || profile.email || "";
  const contactPhone = (profile as any).contact_phone || profile.phone || "";
  const contactLocation = (profile as any).location || "";
  const currentRole = tailorRole || profile.target_roles?.[0] || "Target Role";
  const cleanCompany = (tailorCompany && tailorCompany.trim() !== "Target Organization" && tailorCompany.trim() !== "Not specified") ? tailorCompany.trim() : "";

  const summaryText =
    (profile as any).summary ||
    (profile.work_experience?.length
      ? `Results-driven engineering professional with deep expertise in ${(profile.skills || []).slice(0, 6).join(", ")}. Proven history of architecting high-throughput systems, orchestrating cross-functional teams, and shipping production-grade solutions with measurable performance impact.`
      : "");

  const activeTemplateConfig = ATS_TEMPLATES.find(t => t.id === activeTemplate) || ATS_TEMPLATES[1];

  return (
    <div
      className={`flex flex-col rounded-2xl border border-border/80 bg-card shadow-sm transition-all overflow-hidden ${
        isFullscreen ? "fixed inset-4 z-50 bg-background/95 backdrop-blur-md shadow-2xl" : "w-full"
      }`}
    >
      {/* ── TOP UNIFIED TOOLBAR: COMPACT SINGLE-LINE (Editable ATS Canvas, Print/Save, Walrus Save, History) ── */}
      <div className="flex items-center justify-between px-2.5 sm:px-3.5 py-1.5 sm:py-2 border-b border-border/70 bg-muted/20 gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
        {/* Left: View Toggle */}
        <div className="flex items-center p-0.5 rounded-lg bg-background border border-border/70 text-xs font-medium shrink-0">
          <button
            type="button"
            onClick={() => setActiveView("ats_live")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors shrink-0 whitespace-nowrap ${
              activeView === "ats_live"
                ? "bg-emerald-600 text-white shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Editable ATS Canvas</span>
          </button>
          {sourcePdfUrl && (
            <button
              type="button"
              onClick={() => setActiveView("uploaded_source")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors shrink-0 whitespace-nowrap ${
                activeView === "uploaded_source"
                  ? "bg-emerald-600 text-white shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Original Uploaded PDF</span>
            </button>
          )}
        </div>

        {/* Right: Actions on the exact same line */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto whitespace-nowrap">
          {/* Print / Save PDF */}
          <Button
            size="sm"
            onClick={handlePrintPdf}
            className="h-7 px-2.5 text-xs font-semibold gap-1.5 bg-foreground text-background hover:bg-foreground/90 rounded-lg shadow-xs shrink-0 whitespace-nowrap cursor-pointer"
            title="Print or export as vector PDF"
          >
            <Printer className="w-3 h-3" />
            <span>Print / Save PDF</span>
          </Button>

          {/* Word (.docx) Export Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadDocx}
            className="h-7 px-2.5 text-xs font-semibold gap-1.5 border-border/80 text-foreground hover:bg-muted rounded-lg shadow-xs shrink-0 whitespace-nowrap cursor-pointer"
            title="Download as 100% ATS-compliant Microsoft Word (.docx)"
          >
            <FileText className="w-3 h-3 text-blue-500" />
            <span>Word (.docx)</span>
          </Button>

          {/* Walrus Save Action */}
          {onCommitWalrusVersion && (
            <Button
              size="sm"
              onClick={onCommitWalrusVersion}
              disabled={isSavingVersion}
              className="h-7 px-2.5 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-xs shrink-0 whitespace-nowrap cursor-pointer"
              title="Save current version as immutable snapshot to Walrus Protocol"
            >
              <Database className="w-3 h-3" />
              <span>{isSavingVersion ? "Saving..." : "Save to Walrus"}</span>
            </Button>
          )}

          {/* Walrus Version History On-Demand Modal Trigger */}
          {walrusVersions && walrusVersions.length > 0 && onOpenWalrusHistory && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenWalrusHistory}
              className="h-7 px-2.5 text-xs font-semibold gap-1.5 border-border/80 text-foreground hover:bg-muted rounded-lg shadow-xs shrink-0 whitespace-nowrap cursor-pointer"
              title="View immutable Walrus snapshots"
            >
              <History className="w-3 h-3 text-emerald-500" />
              <span>History ({walrusVersions.length})</span>
            </Button>
          )}

          {/* Fullscreen Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Preview"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* ── PREVIEW & EDITOR CANVAS BODY ── */}
      <div className="flex-1 bg-muted/40 p-1.5 sm:p-4 md:p-8 overflow-auto flex justify-center items-start min-h-[500px] sm:min-h-[700px]">
        {activeView === "uploaded_source" && sourcePdfUrl ? (
          <div className="w-full h-full min-h-[620px] rounded-xl overflow-hidden border border-border shadow-md bg-background">
            <PdfJsViewer
              file={sourceFile}
              url={sourcePdfUrl}
              title={sourceFile?.name || `${applicantName}_Source.pdf`}
              className="min-h-[620px]"
            />
          </div>
        ) : (
          /* UNIFIED ATS EDITABLE VECTOR DOCUMENT SHEET */
          <div
            style={
              zoomLevel !== 100
                ? {
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: "top center",
                    transition: "transform 0.15s ease-out",
                  }
                : undefined
            }
            className={`w-full max-w-[840px] bg-white text-slate-900 rounded-sm shadow-md sm:shadow-2xl border border-slate-300 transition-all select-text print:shadow-none print:border-none print:p-0 mx-auto ${
              activeTemplate === "ivy_league"
                ? "p-2.5 sm:p-8 md:p-14 font-serif"
                : activeTemplate === "senior_architect"
                ? "p-2 sm:p-6 md:p-8 font-sans"
                : "p-2.5 sm:p-8 md:p-12 font-sans"
            }`}
          >
            <div ref={printContainerRef} className="text-left space-y-3 sm:space-y-5">
              {/* ────────── CANDIDATE HEADER (Inline Editable) ────────── */}
              <div
                className={`pb-2 sm:pb-3 border-b-2 border-slate-900 ${
                  activeTemplate === "ivy_league" ? "text-center" : ""
                }`}
              >
                {/* Candidate Name Input */}
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => updateField({ applicant_name: e.target.value })}
                  placeholder="Full Candidate Name"
                  className={`w-full bg-transparent text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none transition-colors px-1 py-0.5 ${
                    activeTemplate === "ivy_league"
                      ? "text-lg sm:text-2xl md:text-3xl font-bold uppercase tracking-[0.12em] sm:tracking-[0.16em] text-center"
                      : activeTemplate === "senior_architect"
                      ? "text-base sm:text-xl md:text-2xl font-black uppercase tracking-tight text-left"
                      : "text-lg sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-left"
                  }`}
                />

                {/* Subtitle / Target Role */}
                <div
                  className={`flex items-center gap-2 mt-1 flex-wrap ${
                    activeTemplate === "ivy_league" ? "justify-center" : "justify-start"
                  }`}
                >
                  <input
                    type="text"
                    value={currentRole}
                    onChange={(e) => updateField({ target_roles: [e.target.value] })}
                    placeholder="e.g. Lead Systems Engineer"
                    className={`bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none transition-colors px-1 text-xs ${
                      activeTemplate === "ivy_league"
                        ? "uppercase tracking-widest text-slate-700 italic text-center"
                        : activeTemplate === "senior_architect"
                        ? "bg-slate-900 text-white font-mono font-bold uppercase px-2 py-0.5 rounded-xs"
                        : "font-bold font-mono text-emerald-700 uppercase tracking-widest"
                    }`}
                  />
                  {cleanCompany && (
                    <span className="text-xs text-slate-600 font-medium">
                      — {cleanCompany}
                    </span>
                  )}
                </div>

                {/* Contact Line (Email, Phone, Location & Links with Responsive Layout) */}
                <div
                  className={`grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2 sm:gap-x-3 sm:gap-y-1.5 mt-2.5 text-xs text-slate-700 ${
                    activeTemplate === "ivy_league" ? "sm:justify-center text-[12px]" : ""
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-slate-400 text-[10px] uppercase font-mono shrink-0">Email:</span>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => updateField({ email: e.target.value, contact_email: e.target.value } as any)}
                      placeholder="candidate.email@example.com"
                      className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none transition-colors px-1 text-xs text-slate-800 truncate"
                    />
                  </div>
                  <span className="text-slate-300 select-none hidden sm:inline">•</span>
                  <div className="flex items-center gap-1.5 min-w-0 sm:max-w-[210px] flex-1">
                    <span className="text-slate-400 text-[10px] uppercase font-mono shrink-0">Tel:</span>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => updateField({ phone: e.target.value, contact_phone: e.target.value } as any)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none transition-colors px-1 text-xs text-slate-800 truncate"
                    />
                  </div>
                  <span className="text-slate-300 select-none hidden sm:inline">•</span>
                  <div className="flex items-center gap-1.5 min-w-0 sm:max-w-[220px] flex-1">
                    <span className="text-slate-400 text-[10px] uppercase font-mono shrink-0">Loc:</span>
                    <input
                      type="text"
                      value={contactLocation}
                      onChange={(e) => updateField({ location: e.target.value } as any)}
                      placeholder="City, Country"
                      className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none transition-colors px-1 text-xs text-slate-800 truncate"
                    />
                  </div>

                  {/* LinkedIn & GitHub & Portfolio Row */}
                  <div className="w-full grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2 sm:gap-x-3 sm:gap-y-1 pt-1.5 text-[11px] text-slate-600 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="text-blue-600 font-bold text-[10px] font-mono shrink-0">in/</span>
                      <input
                        type="text"
                        value={profile.linkedin_url || ""}
                        onChange={(e) => updateField({ linkedin_url: e.target.value })}
                        placeholder="linkedin.com/in/username"
                        className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none transition-colors px-1 text-[11px] text-slate-700 truncate"
                      />
                    </div>
                    <span className="text-slate-300 select-none hidden sm:inline">•</span>
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="text-slate-800 font-bold text-[10px] font-mono shrink-0">gh/</span>
                      <input
                        type="text"
                        value={profile.github_url || ""}
                        onChange={(e) => updateField({ github_url: e.target.value })}
                        placeholder="github.com/username"
                        className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none transition-colors px-1 text-[11px] text-slate-700 truncate"
                      />
                    </div>
                    <span className="text-slate-300 select-none hidden sm:inline">•</span>
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="text-emerald-700 font-bold text-[10px] font-mono shrink-0">web/</span>
                      <input
                        type="text"
                        value={profile.website_url || ""}
                        onChange={(e) => updateField({ website_url: e.target.value })}
                        placeholder="portfolio or personal site"
                        className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none transition-colors px-1 text-[11px] text-slate-700 truncate"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ────────── PROFESSIONAL SUMMARY (Inline Editable) ────────── */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h2
                    className={
                      activeTemplate === "ivy_league"
                        ? "text-center w-full text-xs font-bold uppercase tracking-[0.2em] text-slate-900 border-b border-slate-400 pb-0.5 m-0"
                        : activeTemplate === "senior_architect"
                        ? "bg-slate-100 border-l-2 border-slate-900 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-slate-900 w-full"
                        : "text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 m-0 w-full"
                    }
                  >
                    Professional Summary
                  </h2>
                </div>
                <textarea
                  rows={3}
                  value={summaryText}
                  onChange={(e) => updateField({ summary: e.target.value } as any)}
                  placeholder="Enter a compelling 2-3 sentence executive summary..."
                  className={`w-full text-xs leading-relaxed bg-transparent text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none transition-colors p-1 rounded-sm resize-none ${
                    activeTemplate === "ivy_league" ? "font-serif text-justify" : "font-sans"
                  }`}
                />
              </div>

              {/* ────────── CORE COMPETENCIES & TECHNICAL SKILLS ────────── */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h2
                    className={
                      activeTemplate === "ivy_league"
                        ? "text-center w-full text-xs font-bold uppercase tracking-[0.2em] text-slate-900 border-b border-slate-400 pb-0.5 m-0"
                        : activeTemplate === "senior_architect"
                        ? "bg-slate-100 border-l-2 border-slate-900 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-slate-900 w-full"
                        : "text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 m-0 w-full"
                    }
                  >
                    Core Competencies &amp; Technical Skills ({profile.skills?.length || 0})
                  </h2>
                </div>

                {/* Skills Tags List with Instant Remove & Inline Add */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {(profile.skills || []).map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className="group/skill inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 hover:border-slate-400 transition-colors"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(sIdx)}
                        className="no-print text-slate-400 hover:text-red-500 opacity-30 group-skill/hover:opacity-100 transition-opacity ml-0.5"
                        title="Remove skill"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  {/* Inline Add Skill Input */}
                  {showAddSkillInput ? (
                    <div className="no-print inline-flex items-center gap-1">
                      <input
                        type="text"
                        autoFocus
                        value={newSkillInput}
                        onChange={(e) => setNewSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddSkill();
                          } else if (e.key === "Escape") {
                            setShowAddSkillInput(false);
                          }
                        }}
                        placeholder="Type skill & press Enter..."
                        className="h-6 px-2 text-xs border border-emerald-500 rounded bg-white text-slate-900 focus:outline-none"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAddSkill()}
                        className="h-6 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Add
                      </Button>
                      <button
                        type="button"
                        onClick={() => setShowAddSkillInput(false)}
                        className="text-slate-400 hover:text-slate-600 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddSkillInput(true)}
                      className="no-print inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border border-dashed border-slate-300 text-slate-600 hover:border-emerald-500 hover:text-emerald-700 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Add Skill
                    </button>
                  )}
                </div>
              </div>

              {/* ────────── WORK EXPERIENCE WITH INLINE ACTION VERBS ────────── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                  <h2
                    className={
                      activeTemplate === "ivy_league"
                        ? "text-center w-full text-xs font-bold uppercase tracking-[0.2em] text-slate-900 m-0"
                        : activeTemplate === "senior_architect"
                        ? "bg-slate-100 border-l-2 border-slate-900 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-slate-900 w-full"
                        : "text-xs font-black uppercase tracking-wider text-slate-900 m-0"
                    }
                  >
                    Professional Experience
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddExperience}
                    className="no-print text-xs text-emerald-700 hover:bg-emerald-50 h-7 px-2 gap-1 shrink-0 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Position
                  </Button>
                </div>

                {profile.work_experience && profile.work_experience.length > 0 ? (
                  <div className="space-y-4">
                    {profile.work_experience.map((exp, expIdx) => (
                      <div
                        key={expIdx}
                        className="group/pos space-y-1.5 p-3 rounded-lg border border-slate-200/80 hover:border-slate-300 bg-slate-50/40 relative transition-all"
                      >
                        {/* Delete Position Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveExperience(expIdx)}
                          className="no-print absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-20 group-hover/pos:opacity-100 transition-opacity p-1"
                          title="Delete this role position"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Position Header: Title, Company, Duration */}
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pr-6">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <input
                              type="text"
                              value={exp.role || ""}
                              onChange={(e) => handleUpdateExperience(expIdx, "role", e.target.value)}
                              placeholder="Job Title"
                              className="font-bold text-xs text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none px-1"
                            />
                            <span className="text-slate-400 text-xs">at</span>
                            <input
                              type="text"
                              value={(exp.company && !/^(?:organization|company)$/i.test(exp.company.trim())) ? exp.company : ""}
                              onChange={(e) => handleUpdateExperience(expIdx, "company", e.target.value)}
                              placeholder="Company Name"
                              className="font-semibold text-xs text-slate-700 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none px-1"
                            />
                          </div>
                          <input
                            type="text"
                            value={exp.duration || ""}
                            onChange={(e) => handleUpdateExperience(expIdx, "duration", e.target.value)}
                            placeholder="2022 - Present"
                            className="text-slate-500 text-xs font-mono bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none text-right px-1 max-w-[140px]"
                          />
                        </div>

                        {/* Bullets List with 1-Click Action Verb Optimization */}
                        <div className="space-y-1 pt-1">
                          {exp.highlights && exp.highlights.length > 0 ? (
                            exp.highlights.map((bullet, bIdx) => (
                              <BulletWithActionVerbs
                                key={bIdx}
                                bullet={bullet}
                                index={bIdx}
                                fontFamily={activeTemplateConfig.fontFamily}
                                targetRole={tailorRole || profile.target_roles?.[0]}
                                allKeywords={profile.skills || []}
                                isHighlighted={
                                  highlightedBulletKey === "all" ||
                                  highlightedBulletKey === `exp-${expIdx}` ||
                                  highlightedBulletKey === `${expIdx}-${bIdx}` ||
                                  localHighlightedBulletKey === `${expIdx}-${bIdx}`
                                }
                                onUpdate={(newBullet) => handleUpdateBullet(expIdx, bIdx, newBullet)}
                                onDelete={() => handleDeleteBullet(expIdx, bIdx)}
                              />
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 italic pl-3">No accomplishment bullets added yet.</p>
                          )}

                          {/* Add Bullet Button */}
                          <div className="no-print pt-1 pl-3 flex items-center justify-between flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleAddBullet(expIdx)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                            >
                              <Plus className="w-3 h-3" /> Add Accomplishment Bullet
                            </button>

                            {/* Walrus Proof of Experience Attachment */}
                            {exp.proofAttachment ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setProofModalConfig({
                                    isOpen: true,
                                    title: `Verified Proof: ${exp.role} at ${exp.company}`,
                                    category: "work",
                                    targetId: `exp-${expIdx}`,
                                    existingProof: exp.proofAttachment,
                                    onSave: (proof) => {
                                      const copy = [...(profile.work_experience || [])];
                                      copy[expIdx] = { ...copy[expIdx], proofAttachment: proof || undefined };
                                      updateField({ work_experience: copy });
                                    },
                                  })
                                }
                                className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs"
                                title="Click to view verified decentralized proof on Walrus"
                              >
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                <span>{exp.proofAttachment.title || "Walrus Proof Verified"}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setProofModalConfig({
                                    isOpen: true,
                                    title: `Attach Proof: ${exp.role} at ${exp.company}`,
                                    category: "work",
                                    targetId: `exp-${expIdx}`,
                                    existingProof: null,
                                    onSave: (proof) => {
                                      if (!proof) return;
                                      const copy = [...(profile.work_experience || [])];
                                      copy[expIdx] = { ...copy[expIdx], proofAttachment: proof };
                                      updateField({ work_experience: copy });
                                    },
                                  })
                                }
                                className="inline-flex items-center gap-1 text-[10.5px] font-medium text-slate-500 hover:text-emerald-600 transition-colors"
                                title="Attach certificate scan, sea-time slip, or Google Drive link"
                              >
                                <Database className="w-3 h-3 text-slate-400 group-hover:text-emerald-500" />
                                <span>+ Attach Proof (Walrus/Drive)</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center border border-dashed border-slate-300 rounded-lg">
                    <p className="text-xs text-slate-500">No work experience listed yet.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddExperience}
                      className="mt-2 text-xs gap-1 border-slate-300 text-slate-700"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Add Experience
                    </Button>
                  </div>
                )}
              </div>

              {/* ────────── EDUCATION & CREDENTIALS ────────── */}
              <div className="space-y-2 pt-2 border-t border-slate-300">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <h2
                    className={
                      activeTemplate === "ivy_league"
                        ? "text-center w-full text-xs font-bold uppercase tracking-[0.2em] text-slate-900 m-0"
                        : activeTemplate === "senior_architect"
                        ? "bg-slate-100 border-l-2 border-slate-900 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-slate-900 w-full"
                        : "text-xs font-black uppercase tracking-wider text-slate-900 m-0"
                    }
                  >
                    Education &amp; Credentials
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddEducation}
                    className="no-print text-xs text-emerald-700 hover:bg-emerald-50 h-7 px-2 gap-1 shrink-0 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Degree
                  </Button>
                </div>

                <div className="space-y-2">
                  {(profile.academic_history || []).map((edu, eduIdx) => (
                    <div
                      key={eduIdx}
                      className="group/edu flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 p-2 rounded hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 flex-wrap flex-1">
                        <input
                          type="text"
                          value={edu.degree || ""}
                          onChange={(e) => handleUpdateEducation(eduIdx, "degree", e.target.value)}
                          placeholder="Degree (e.g. B.S.)"
                          className="font-bold text-xs text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none px-1 max-w-[140px]"
                        />
                        <span className="text-slate-400 text-xs">in</span>
                        <input
                          type="text"
                          value={edu.field_of_study || ""}
                          onChange={(e) => handleUpdateEducation(eduIdx, "field_of_study", e.target.value)}
                          placeholder="Field of Study"
                          className="text-xs text-slate-700 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none px-1 max-w-[200px]"
                        />
                        <span className="text-slate-400 text-xs">—</span>
                        <input
                          type="text"
                          value={edu.institution || ""}
                          onChange={(e) => handleUpdateEducation(eduIdx, "institution", e.target.value)}
                          placeholder="Institution Name"
                          className="font-medium text-xs text-slate-700 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none px-1 flex-1"
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="text"
                          value={edu.graduation_year || ""}
                          onChange={(e) => handleUpdateEducation(eduIdx, "graduation_year", e.target.value)}
                          placeholder="Year"
                          className="text-slate-500 text-xs font-mono bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none text-right px-1 w-16"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveEducation(eduIdx)}
                          className="no-print text-slate-400 hover:text-red-500 opacity-20 group-hover/edu:opacity-100 transition-opacity p-0.5"
                          title="Remove degree"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── VISUAL A4 PAGE 1 / PAGE 2 FLOW GUIDE (Clean visual indicator) ── */}
              <div className="no-print relative my-6 py-2 flex items-center justify-center select-none">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-dashed border-slate-300" />
                </div>
                <div className="relative bg-slate-100 text-slate-600 text-[10px] font-mono font-bold px-3 py-0.5 rounded-full border border-slate-300 shadow-2xs flex items-center gap-1.5 uppercase tracking-wider">
                  <FileText className="w-3 h-3 text-emerald-600" />
                  <span>A4 Multi-Page Flow · Page 1 / Page 2 Break Guide</span>
                </div>
              </div>

              {/* ────────── CERTIFICATIONS & WALRUS MARITIME CREDENTIALS ────────── */}
              <div className="space-y-2 pt-2 border-t border-slate-300">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <h2
                    className={
                      activeTemplate === "ivy_league"
                        ? "text-center w-full text-xs font-bold uppercase tracking-[0.2em] text-slate-900 m-0"
                        : activeTemplate === "senior_architect"
                        ? "bg-slate-100 border-l-2 border-slate-900 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-slate-900 w-full"
                        : "text-xs font-black uppercase tracking-wider text-slate-900 m-0"
                    }
                  >
                    Certifications &amp; Professional Licenses ({profile.certifications?.length || 0})
                  </h2>

                  {/* Universal Certification & License Proof Attachment */}
                  <div className="no-print flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setProofModalConfig({
                          isOpen: true,
                          title: "Attach License or Certificate Proof",
                          category: "certificate",
                          targetId: `cert-global-${Date.now()}`,
                          existingProof: null,
                          onSave: (proof) => {
                            if (!proof) return;
                            const currentAtts = profile.attachments || [];
                            const certs = [...(profile.certifications || [])];
                            if (proof.title && !certs.includes(proof.title)) {
                              certs.push(proof.title);
                            }
                            updateField({
                              certifications: certs,
                              attachments: [...currentAtts, proof],
                            });
                            toast.success("Attached proof of certification!");
                          },
                        })
                      }
                      className="text-[11px] h-6 px-2 gap-1 border-border/80 text-foreground hover:bg-muted"
                      title="Attach Walrus scan, Google Drive link, or credential proof"
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Attach Proof (Walrus / Drive)</span>
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {(profile.certifications || []).map((cert, cIdx) => {
                    const certProof = (profile.attachments || []).find(
                      (a) =>
                        a.targetId === `cert-${cIdx}` ||
                        (a.title && a.title.toLowerCase() === cert.toLowerCase()) ||
                        (a.category === "certificate" && a.targetId === `cert-${cIdx}`)
                    );

                    return (
                      <span
                        key={cIdx}
                        className="group/cert inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                      >
                        <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{cert}</span>

                        {certProof ? (
                          <button
                            type="button"
                            onClick={() =>
                              setProofModalConfig({
                                isOpen: true,
                                title: `Verified Proof: ${cert}`,
                                category: "certificate",
                                targetId: `cert-${cIdx}`,
                                existingProof: certProof,
                                onSave: (updatedProof) => {
                                  let atts = [...(profile.attachments || [])].filter(
                                    (a) => a.targetId !== `cert-${cIdx}` && a.id !== certProof.id
                                  );
                                  if (updatedProof) atts.push(updatedProof);
                                  updateField({ attachments: atts });
                                },
                              })
                            }
                            className="no-print inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600/25 ml-1 transition-colors"
                            title="Click to view verified proof on Walrus or Drive"
                          >
                            <span>✓ Proof</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setProofModalConfig({
                                isOpen: true,
                                title: `Attach Proof: ${cert}`,
                                category: "certificate",
                                targetId: `cert-${cIdx}`,
                                existingProof: null,
                                onSave: (proof) => {
                                  if (!proof) return;
                                  const atts = [...(profile.attachments || [])];
                                  atts.push(proof);
                                  updateField({ attachments: atts });
                                  toast.success(`Attached proof to ${cert}!`);
                                },
                              })
                            }
                            className="no-print opacity-40 group-hover/cert:opacity-100 text-[9px] text-emerald-600 dark:text-emerald-400 hover:underline ml-1 transition-opacity"
                            title="Attach proof document or Walrus scan to this certification"
                          >
                            + Proof
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveCertification(cIdx)}
                          className="no-print text-emerald-500 hover:text-red-500 opacity-40 group-hover/cert:opacity-100 transition-opacity ml-0.5"
                          title="Remove certification"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}

                  {/* Inline Add Certification Input */}
                  {showAddCertInput ? (
                    <div className="no-print inline-flex items-center gap-1">
                      <input
                        type="text"
                        autoFocus
                        value={newCertInput}
                        onChange={(e) => setNewCertInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCertification();
                          } else if (e.key === "Escape") {
                            setShowAddCertInput(false);
                          }
                        }}
                        placeholder="e.g. PMP, CFA, AWS Solutions Architect..."
                        className="h-6 px-2 text-xs border border-emerald-500 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAddCertification()}
                        className="h-6 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Add
                      </Button>
                      <button
                        type="button"
                        onClick={() => setShowAddCertInput(false)}
                        className="text-slate-400 hover:text-slate-600 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddCertInput(true)}
                      className="no-print inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Add Certification
                    </button>
                  )}
                </div>
              </div>

              {/* ────────── LEADERSHIP & COMMUNITY SERVICE ────────── */}
              {((profile.leadership && profile.leadership.length > 0) || showAddLeadershipSection) && (
                <div className="space-y-3 pt-2 border-t border-slate-300">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <h2
                      className={
                        activeTemplate === "ivy_league"
                          ? "text-center w-full text-xs font-bold uppercase tracking-[0.2em] text-slate-900 m-0"
                          : activeTemplate === "senior_architect"
                          ? "bg-slate-100 border-l-2 border-slate-900 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-slate-900 w-full"
                          : "text-xs font-black uppercase tracking-wider text-slate-900 m-0"
                      }
                    >
                      Leadership &amp; Community Service ({profile.leadership?.length || 0})
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAddLeadership}
                      className="no-print text-xs text-emerald-700 hover:bg-emerald-50 h-7 px-2 gap-1 shrink-0 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Leadership
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {(profile.leadership || []).map((lead, lIdx) => (
                      <div
                        key={lIdx}
                        className="group/lead space-y-1 p-2.5 rounded-lg border border-slate-200/80 bg-slate-50/30 relative"
                      >
                        <button
                          type="button"
                          onClick={() => handleRemoveLeadership(lIdx)}
                          className="no-print absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-20 group-hover/lead:opacity-100 transition-opacity p-0.5"
                          title="Remove leadership position"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pr-6">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <input
                              type="text"
                              value={lead.role || ""}
                              onChange={(e) => handleUpdateLeadership(lIdx, "role", e.target.value)}
                              placeholder="Role / Title"
                              className="font-bold text-xs text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none px-1"
                            />
                            <span className="text-slate-400 text-xs">at</span>
                            <input
                              type="text"
                              value={lead.organization || ""}
                              onChange={(e) => handleUpdateLeadership(lIdx, "organization", e.target.value)}
                              placeholder="Organization / Initiative"
                              className="font-semibold text-xs text-slate-700 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none px-1"
                            />
                          </div>
                          <input
                            type="text"
                            value={lead.duration || ""}
                            onChange={(e) => handleUpdateLeadership(lIdx, "duration", e.target.value)}
                            placeholder="2023 - Present"
                            className="text-slate-500 text-xs font-mono bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none text-right px-1 w-28"
                          />
                        </div>

                        {lead.highlights && lead.highlights.length > 0 && (
                          <ul className="list-disc pl-4 space-y-0.5 text-xs text-slate-700 pt-1">
                            {lead.highlights.map((h, hIdx) => (
                              <li key={hIdx}>
                                <input
                                  type="text"
                                  value={h}
                                  onChange={(e) => {
                                    const newHighlights = [...(lead.highlights || [])];
                                    newHighlights[hIdx] = e.target.value;
                                    handleUpdateLeadership(lIdx, "highlights", newHighlights);
                                  }}
                                  className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none text-xs"
                                />
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Toggle to Add Leadership if not yet present */}
              {!profile.leadership?.length && !showAddLeadershipSection && (
                <div className="no-print pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddLeadershipSection(true);
                      handleAddLeadership();
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-emerald-700 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add Leadership &amp; Volunteer Section
                  </button>
                </div>
              )}

              {/* ────────── CONFERENCES & PRESENTATIONS ────────── */}
              {((profile.conferences && profile.conferences.length > 0) || showAddConferencesSection) && (
                <div className="space-y-2 pt-2 border-t border-slate-300">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <h2
                      className={
                        activeTemplate === "ivy_league"
                          ? "text-center w-full text-xs font-bold uppercase tracking-[0.2em] text-slate-900 m-0"
                          : activeTemplate === "senior_architect"
                          ? "bg-slate-100 border-l-2 border-slate-900 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-slate-900 w-full"
                          : "text-xs font-black uppercase tracking-wider text-slate-900 m-0"
                      }
                    >
                      Conferences, Seminars &amp; Keynotes ({profile.conferences?.length || 0})
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAddConference}
                      className="no-print text-xs text-emerald-700 hover:bg-emerald-50 h-7 px-2 gap-1 shrink-0 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Conference
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    {(profile.conferences || []).map((conf, cIdx) => (
                      <div
                        key={cIdx}
                        className="group/conf flex items-baseline justify-between gap-2 p-1.5 rounded hover:bg-slate-50 text-xs"
                      >
                        <div className="flex items-center gap-1.5 flex-wrap flex-1">
                          <span className="font-bold text-slate-900">{conf.name}</span>
                          {conf.role_or_topic && (
                            <span className="text-slate-600 italic">— {conf.role_or_topic}</span>
                          )}
                          {conf.location && (
                            <span className="text-slate-400 text-[11px]">({conf.location})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-slate-500 font-mono text-[11px]">{conf.year || ""}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveConference(cIdx)}
                            className="no-print text-slate-400 hover:text-red-500 opacity-20 group-hover/conf:opacity-100 transition-opacity p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Toggle to Add Conferences if not yet present */}
              {!profile.conferences?.length && !showAddConferencesSection && (
                <div className="no-print pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddConferencesSection(true);
                      handleAddConference();
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-emerald-700 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add Conferences &amp; Seminars Section
                  </button>
                </div>
              )}

              {/* ────────── SUPPORTING ATTACHMENTS & WALRUS PROOFS ────────── */}
              {profile.attachments && profile.attachments.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-300">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 m-0">
                    Verified Supporting Proofs &amp; Attachments ({profile.attachments.length})
                  </h2>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {profile.attachments.map((att, aIdx) => (
                      <a
                        key={aIdx}
                        href={att.previewUrl || att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-semibold">{att.title}</span>
                        <ExternalLink className="w-3 h-3 text-emerald-500" />
                      </a>
                    ))}
                  </div>
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
                      Blob ID: <span className="font-bold text-slate-800">{activeBlobId ? `${activeBlobId.slice(0, 16)}...${activeBlobId.slice(-8)}` : "Pending Walrus anchor"}</span>
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
          Active Layout: <strong className="text-foreground">{activeTemplateConfig.name}</strong>
        </span>
        <span className="flex items-center gap-3">
          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono text-[10px]">
            <Database className="w-3 h-3" />
            Walrus Proof Active
          </span>
          <span>
            {profile.work_experience?.length || 0} Positions · {profile.skills?.length || 0} Skills Anchored
          </span>
        </span>
      </div>

      {/* ── PROOF OF EXPERIENCE ATTACHMENT MODAL (Walrus & Drive) ── */}
      <ProofAttachmentModal
        isOpen={proofModalConfig.isOpen}
        onClose={() => setProofModalConfig((prev) => ({ ...prev, isOpen: false }))}
        title={proofModalConfig.title}
        category={proofModalConfig.category}
        targetId={proofModalConfig.targetId}
        existingProof={proofModalConfig.existingProof}
        onSaveProof={(proof) => {
          proofModalConfig.onSave(proof);
        }}
      />
    </div>
  );
}
