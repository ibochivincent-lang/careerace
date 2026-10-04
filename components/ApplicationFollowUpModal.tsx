'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Mail,
  Copy,
  Check,
  Sparkles,
  Clock,
  Send,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Lightbulb
} from 'lucide-react'
import { toast } from 'sonner'

function LinkedInIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
    </svg>
  )
}

interface ApplicationFollowUpModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobTitle: string
  company: string
  appliedDate?: string
  candidateName?: string
  contactName?: string
  onMarkSent?: () => void
}

export function ApplicationFollowUpModal({
  open,
  onOpenChange,
  jobTitle,
  company,
  appliedDate = '7 days ago',
  candidateName = 'Vincent Lang',
  contactName = '',
  onMarkSent,
}: ApplicationFollowUpModalProps) {
  const [activeTab, setActiveTab] = useState<'linkedin' | 'email'>('linkedin')
  const [isLoading, setIsLoading] = useState(false)
  const [followUpData, setFollowUpData] = useState<{
    linkedinMessage: string
    emailSubject: string
    emailBody: string
    actionTip?: string
  } | null>(null)

  const [copiedLinkedin, setCopiedLinkedin] = useState(false)
  const [copiedEmailBody, setCopiedEmailBody] = useState(false)
  const [copiedEmailSubject, setCopiedEmailSubject] = useState(false)

  // Fetch or generate follow-up messages on open
  useEffect(() => {
    if (!open || !jobTitle || !company) return

    setIsLoading(true)
    fetch('/api/followup/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobTitle,
        company,
        appliedDate,
        candidateName,
        contactName,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.followUp) {
          setFollowUpData(data.followUp)
        }
      })
      .catch(() => {
        // Fallback default (clean human copy, zero AI slop)
        setFollowUpData({
          linkedinMessage: `Hi ${contactName || 'there'}, following up on my application for the ${jobTitle} position at ${company}. My verified technical background and engineering track record match your opening. Let me know if you would like to review my verified portfolio or connect this week. Best, ${candidateName}.`,
          emailSubject: `Application Follow-up: ${jobTitle} – ${candidateName}`,
          emailBody: `Dear ${contactName || 'Hiring Team at ' + company},\n\nI am following up on my application for the ${jobTitle} role at ${company}, submitted on ${appliedDate}.\n\nGiven ${company}'s current technical roadmap and focus on high-availability engineering, my background in resilient systems and verifiable execution directly addresses the demands of this position.\n\nI would be glad to share any additional details or credential records whenever convenient. Thank you for your time, and I look forward to your update.\n\nBest regards,\n${candidateName}`,
          actionTip: "Best sent on Tuesday or Wednesday morning between 8:30 AM - 10:30 AM in the recipient's local time zone.",
        })
      })
      .finally(() => setIsLoading(false))
  }, [open, jobTitle, company, appliedDate, candidateName, contactName])

  function handleCopy(text: string, type: 'linkedin' | 'emailBody' | 'emailSubject') {
    navigator.clipboard.writeText(text)
    if (type === 'linkedin') {
      setCopiedLinkedin(true)
      setTimeout(() => setCopiedLinkedin(false), 2000)
    } else if (type === 'emailBody') {
      setCopiedEmailBody(true)
      setTimeout(() => setCopiedEmailBody(false), 2000)
    } else if (type === 'emailSubject') {
      setCopiedEmailSubject(true)
      setTimeout(() => setCopiedEmailSubject(false), 2000)
    }
    toast.success('Copied to clipboard!')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden border border-border/80 bg-card rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="p-6 bg-muted/30 border-b border-border/70 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <Sparkles className="w-4 h-4" />
              <span>Autonomous Follow-Up Scheduler</span>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
              7-Day Cadence
            </Badge>
          </div>

          <DialogTitle className="text-base font-bold text-foreground">
            Follow up with {company}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Role: <span className="font-semibold text-foreground">{jobTitle}</span> · Applied {appliedDate}
          </DialogDescription>
        </div>

        {/* Channel Switcher with accessible 44px min touch targets */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-muted/60 border border-border/80 w-fit text-xs" role="tablist" aria-label="Communication channel">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'linkedin'}
              onClick={() => setActiveTab('linkedin')}
              className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg font-semibold transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                activeTab === 'linkedin'
                  ? 'bg-background text-foreground shadow-xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LinkedInIcon className="w-4 h-4 text-[#0A66C2]" />
              <span>LinkedIn InMail / DM</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'email'}
              onClick={() => setActiveTab('email')}
              className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg font-semibold transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                activeTab === 'email'
                  ? 'bg-background text-foreground shadow-xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Mail className="w-4 h-4 text-emerald-500" />
              <span>Executive Email</span>
            </button>
          </div>
        </div>

        {/* Message Content */}
        <div className="p-6 space-y-4">
          {isLoading ? (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
              <p className="text-xs text-muted-foreground">
                Crafting targeted, high-converting follow-up message using Gemini...
              </p>
            </div>
          ) : followUpData ? (
            <>
              {activeTab === 'linkedin' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Target Length: &lt; 350 chars (Recommended for high response rate)</span>
                    <span className="font-mono text-[11px]">{followUpData.linkedinMessage.length} characters</span>
                  </div>

                  <div className="p-4 rounded-xl border border-border/80 bg-muted/20 text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans relative group">
                    {followUpData.linkedinMessage}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(followUpData.linkedinMessage, 'linkedin')}
                      className="gap-2 text-xs h-8 border-border"
                    >
                      {copiedLinkedin ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLinkedin ? 'Copied LinkedIn Message' : 'Copy Message'}</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Subject Line */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Subject Line
                    </label>
                    <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/80 bg-muted/20 text-xs font-semibold text-foreground">
                      <span className="truncate">{followUpData.emailSubject}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(followUpData.emailSubject, 'emailSubject')}
                        className="text-muted-foreground hover:text-foreground p-1 shrink-0 ml-2"
                        title="Copy Subject Line"
                      >
                        {copiedEmailSubject ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Email Body */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Email Body
                    </label>
                    <div className="p-4 rounded-xl border border-border/80 bg-muted/20 text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans max-h-56 overflow-y-auto">
                      {followUpData.emailBody}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(followUpData.emailBody, 'emailBody')}
                      className="gap-2 text-xs h-8 border-border"
                    >
                      {copiedEmailBody ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedEmailBody ? 'Copied Email Body' : 'Copy Email Body'}</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Recruiter Strategy Tip */}
              {followUpData.actionTip && (
                <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs flex items-start gap-2 text-amber-800 dark:text-amber-300">
                  <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">{followUpData.actionTip}</span>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-muted/30 border-t border-border/70 flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground"
          >
            Close
          </Button>

          <Button
            size="sm"
            onClick={() => {
              if (onMarkSent) onMarkSent()
              onOpenChange(false)
              toast.success(`Follow-up recorded for ${company}!`)
            }}
            className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold h-8 px-4"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mark Follow-up as Sent</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
