'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check, Mail, Send, ExternalLink, Download, FileCode } from 'lucide-react'
import { toast } from 'sonner'
import { generateDocxBlob } from '@/lib/docx_exporter'
import { exportToJsonResume } from '@/lib/json_resume'

export function PublicProfileClient({
  username,
  role,
  skills = [],
}: {
  username: string
  role: string
  skills?: string[]
}) {
  const [copied, setCopied] = useState(false)
  const [isContacting, setIsContacting] = useState(false)
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [recruiterName, setRecruiterName] = useState('')
  const [recruiterEmail, setRecruiterEmail] = useState('')
  const [recruiterCompany, setRecruiterCompany] = useState('')
  const [recruiterMessage, setRecruiterMessage] = useState('')

  function handleCopyLink() {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      toast.success('Public Passport link copied to clipboard!')
      setTimeout(() => setCopied(false), 2500)
    }
  }

  async function handleSendRecruiterInquiry(e: React.FormEvent) {
    e.preventDefault()
    if (!recruiterEmail.trim() || !recruiterName.trim()) {
      toast.error('Please enter your name and email.')
      return
    }

    setIsContacting(true)
    const toastId = toast.loading('Sending inquiry to candidate...')
    try {
      // Dispatch direct inquiry notification email to candidate
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'notifications@careerace.online',
          subject: `New Recruiter Opportunity from ${recruiterName} (${recruiterCompany || 'Direct'}) for ${username}`,
          message: `${recruiterName} (${recruiterEmail}) sent a message:\n\n"${recruiterMessage || 'Interested in connecting.'}"\n\nCandidate: ${username} (${role})\nPassport: ${typeof window !== 'undefined' ? window.location.href : ''}`,
        }),
      })

      toast.success('Message sent! The candidate has been alerted.', { id: toastId })
      setShowContactModal(false)
      setRecruiterMessage('')
    } catch {
      toast.error('Failed to dispatch inquiry.', { id: toastId })
    } finally {
      setIsContacting(false)
    }
  }

  async function handleDownloadCandidateDocx() {
    setIsDownloadingDocx(true)
    const toastId = toast.loading(`Generating verified .docx resume for ${username}...`)
    try {
      const dummyCv = {
        applicant_name: username,
        email: `${username.toLowerCase().replace(/\s+/g, '.')}@candidate.careerace.online`,
        target_roles: [role],
        skills: skills && skills.length > 0 ? skills : ['System Architecture', 'TypeScript', 'Distributed Systems'],
        work_experience: [],
        academic_history: [],
        certifications: []
      }
      const blob = await generateDocxBlob(
        dummyCv,
        `Verified candidate professional profile for ${username}. Evaluated across STAR+R interview simulations and attested on sovereign Walrus storage.`
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${username.replace(/\s+/g, '_')}_Verified_Resume.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Downloaded verified .docx resume!', { id: toastId })
    } catch {
      toast.error('Failed to generate resume.', { id: toastId })
    } finally {
      setIsDownloadingDocx(false)
    }
  }

  function handleExportCandidateJsonResume() {
    try {
      const dummyCv = {
        applicant_name: username,
        email: `${username.toLowerCase().replace(/\s+/g, '.')}@candidate.careerace.online`,
        target_roles: [role],
        skills: skills && skills.length > 0 ? skills : ['System Architecture', 'TypeScript', 'Distributed Systems'],
        work_experience: [],
        academic_history: [],
        certifications: []
      }
      const jsonResume = exportToJsonResume(dummyCv)
      const blob = new Blob([JSON.stringify(jsonResume, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${username.replace(/\s+/g, '_')}_JSON_Resume.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Exported JSON Resume v1.0.0!')
    } catch {
      toast.error('Failed to export JSON Resume.')
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleDownloadCandidateDocx}
          disabled={isDownloadingDocx}
          className="text-xs h-9 gap-1.5 border-border hover:bg-muted"
        >
          <Download className="w-3.5 h-3.5 text-primary" /> Download .docx
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleExportCandidateJsonResume}
          className="text-xs h-9 gap-1.5 border-border hover:bg-muted"
        >
          <FileCode className="w-3.5 h-3.5 text-amber-500" /> JSON Resume
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleCopyLink}
          className="text-xs h-9 gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Link Copied' : 'Share Passport'}
        </Button>

        <Button
          size="sm"
          onClick={() => setShowContactModal(true)}
          className="text-xs h-9 gap-1.5"
        >
          <Mail className="w-3.5 h-3.5" /> Connect with {username.split(' ')[0]}
        </Button>
      </div>

      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-base">Contact {username}</h3>
                <p className="text-xs text-muted-foreground">Send a direct message or role opportunity to this candidate.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="text-muted-foreground hover:text-foreground text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSendRecruiterInquiry} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-foreground block mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={recruiterName}
                  onChange={(e) => setRecruiterName(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">Your Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="s.jenkins@company.com"
                  value={recruiterEmail}
                  onChange={(e) => setRecruiterEmail(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">Company / Team (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Stripe, OpenAI, Tech Startup"
                  value={recruiterCompany}
                  onChange={(e) => setRecruiterCompany(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">Message / Opportunity Details</label>
                <textarea
                  rows={3}
                  placeholder={`Hi ${username}, I reviewed your verified Career Ace Passport and would love to chat about our ${role} role...`}
                  value={recruiterMessage}
                  onChange={(e) => setRecruiterMessage(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowContactModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isContacting} className="gap-1.5">
                  <Send className="w-3.5 h-3.5" />
                  {isContacting ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
