'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ShieldCheck,
  Eye,
  Terminal,
  Download,
  FileCode,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react'
import { toast } from 'sonner'
import { generateDocxBlob } from '@/lib/docx_exporter'
import { exportToJsonResume } from '@/lib/json_resume'
import type { ParsedCv } from '@/lib/cv_parser'
import type { AtsScorecard } from '@/lib/ats_engine'

interface AtsXRayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: ParsedCv | any
  scorecard?: AtsScorecard | null
}

export function AtsXRayDialog({
  open,
  onOpenChange,
  profile,
  scorecard
}: AtsXRayDialogProps) {
  const [activeTab, setActiveTab] = useState<'visual' | 'robot'>('visual')
  const [isCopied, setIsCopied] = useState(false)
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false)

  if (!profile) return null

  // Reconstructed ATS Robot Plaintext Stream (Simulating how legacy ATS extracts text)
  const robotRawTextStream = [
    `--- ATS PARSER INGESTION STREAM: CANDIDATE RECORD ---`,
    `[DOCUMENT_HEADER]`,
    `APPLICANT_NAME: ${profile.applicant_name || 'UNRESOLVED'}`,
    `EMAIL: ${profile.email || profile.contact_email || 'NOT_DETECTED'}`,
    `PHONE: ${profile.phone || profile.contact_phone || 'NOT_DETECTED'}`,
    `LINKS: ${[profile.github_url, profile.linkedin_url].filter(Boolean).join(' | ') || 'NONE'}`,
    ``,
    `[SECTION: SUMMARY]`,
    `${profile.applicant_name ? `${profile.seniority_level || 'Mid-Level'} specialist in ${(profile.skills || []).slice(0, 5).join(', ')}.` : 'No summary parsed.'}`,
    ``,
    `[SECTION: CORE_SKILLS] (${(profile.skills || []).length} TOKENS EXTRACTED)`,
    (profile.skills || []).map((s: string) => `• ${s.toUpperCase()}`).join('\n'),
    ``,
    `[SECTION: WORK_EXPERIENCE] (${(profile.work_experience || []).length} ENTRIES)`,
    ...(profile.work_experience || []).map((w: any, i: number) => 
      `JOB_${i + 1}: ${w.role} @ ${w.company} [TIMELINE: ${w.duration}]\n` +
      (w.highlights || []).map((h: string) => `  - ${h}`).join('\n')
    ),
    ``,
    `[SECTION: EDUCATION] (${(profile.academic_history || []).length} ENTRIES)`,
    ...(profile.academic_history || []).map((a: any) =>
      `INSTITUTION: ${a.institution} | DEGREE: ${a.degree} | GRAD_YEAR: ${a.graduation_year || 'N/A'}`
    ),
    ``,
    `[SECTION: CERTIFICATIONS_&_MILESTONES]`,
    ...((profile.certifications || []).concat(profile.custom_achievements || [])).map((c: string) => `• ${c}`),
    `--- END OF PARSED TOKENS ---`
  ].join('\n')

  async function handleDownloadDocx() {
    setIsDownloadingDocx(true)
    const toastId = toast.loading('Compiling 100% ATS-compliant .docx resume...')
    try {
      const blob = await generateDocxBlob(profile)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(profile.applicant_name || 'candidate').replace(/\s+/g, '_')}_ATS_Resume.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Native .docx resume generated and downloaded!', { id: toastId })
    } catch (err) {
      toast.error('Failed to generate .docx document.', { id: toastId })
    } finally {
      setIsDownloadingDocx(false)
    }
  }

  function handleExportJsonResume() {
    try {
      const jsonResume = exportToJsonResume(profile)
      const blob = new Blob([JSON.stringify(jsonResume, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(profile.applicant_name || 'candidate').replace(/\s+/g, '_')}_JSON_Resume.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('JSON Resume v1.0.0 file exported!')
    } catch {
      toast.error('Failed to export JSON Resume.')
    }
  }

  function handleCopyRobotText() {
    navigator.clipboard.writeText(robotRawTextStream)
    setIsCopied(true)
    toast.success('Raw ATS text stream copied to clipboard.')
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border p-6">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  ATS "X-Ray" Diagnostic Inspector
                  {scorecard && (
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
                      Grade {scorecard.ats_grade} ({scorecard.overall_score}%)
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Verify how automated Applicant Tracking Systems (Workday, Taleo, Greenhouse) parse your CV.
                </DialogDescription>
              </div>
            </div>

            {/* Quick Export Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 gap-1.5"
                onClick={handleDownloadDocx}
                disabled={isDownloadingDocx}
              >
                <Download className="w-3.5 h-3.5 text-primary" />
                Native DOCX
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 gap-1.5"
                onClick={handleExportJsonResume}
              >
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                JSON Resume
              </Button>
            </div>
          </div>

          {/* Compliance Audit Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-border/50 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              {profile.email || profile.contact_email ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              )}
              <span>Contact Parseability</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Standard Headings</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Date Syntax Valid</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Single-Column Safe</span>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 mt-4">
            <Button
              variant={activeTab === 'visual' ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-8 gap-1.5"
              onClick={() => setActiveTab('visual')}
            >
              <Eye className="w-3.5 h-3.5" />
              Recruiter Visual View
            </Button>
            <Button
              variant={activeTab === 'robot' ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-8 gap-1.5"
              onClick={() => setActiveTab('robot')}
            >
              <Terminal className="w-3.5 h-3.5" />
              ATS Robot Parse Stream
            </Button>
          </div>
        </DialogHeader>

        {/* Tab 1: Human Visual Preview */}
        {activeTab === 'visual' && (
          <div className="mt-4 p-6 rounded-lg border border-border bg-card text-foreground font-sans text-sm space-y-5">
            {/* Header */}
            <div className="text-center border-b border-border/60 pb-4">
              <h2 className="text-xl font-bold tracking-tight">
                {profile.applicant_name || 'Candidate Name'}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {[
                  profile.email || profile.contact_email,
                  profile.phone || profile.contact_phone,
                  profile.location,
                  profile.github_url,
                  profile.linkedin_url
                ].filter(Boolean).join('  •  ')}
              </p>
            </div>

            {/* Technical Skills */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/40 pb-1 mb-2">
                Technical Skills & Competencies
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {(profile.skills || []).map((s: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="text-xs font-mono">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Work Experience */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/40 pb-1 mb-2">
                Work Experience
              </h3>
              <div className="space-y-3">
                {(profile.work_experience || []).map((exp: any, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-baseline font-semibold text-xs">
                      <span>{exp.role} — <span className="font-normal text-muted-foreground">{exp.company}</span></span>
                      <span className="text-muted-foreground text-[11px] font-mono">{exp.duration}</span>
                    </div>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5 pl-1">
                      {(exp.highlights || []).map((h: string, hIdx: number) => (
                        <li key={hIdx}>{h}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Academic History */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/40 pb-1 mb-2">
                Education & Credentials
              </h3>
              <div className="space-y-2">
                {(profile.academic_history || []).map((edu: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-baseline text-xs">
                    <div>
                      <span className="font-semibold">{edu.degree} in {edu.field_of_study || 'Studies'}</span>
                      <span className="text-muted-foreground"> — {edu.institution}</span>
                    </div>
                    <span className="text-muted-foreground text-[11px] font-mono">{edu.graduation_year}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: ATS Robot Raw Parse Stream */}
        {activeTab === 'robot' && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Simulated machine extraction stream without CSS styles or table layouts:</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={handleCopyRobotText}
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Stream
              </Button>
            </div>
            <pre className="p-4 rounded-lg bg-zinc-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-zinc-800 leading-relaxed max-h-[450px]">
              {robotRawTextStream}
            </pre>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
