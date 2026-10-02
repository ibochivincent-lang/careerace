'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AppShell } from '@/components/AppShell'
import {
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Briefcase,
  Target,
  ShieldCheck,
  ArrowRight,
  Database,
  Send,
  Wand2,
  Copy,
  Check,
  Bookmark,
  FileText,
  Sparkles,
  X,
  Download
} from 'lucide-react'
import { toast } from 'sonner'

interface ApplicationItem {
  id: string
  title: string
  company: string
  apply_url: string
  fit_score: number
  track: 'track_a_auto_apply' | 'track_b_manual_queue'
  status: 'Applied' | 'Manual Required'
  flag_reason?: string
  processed_at: string
}

export default function ApplicationBoardPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<ApplicationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sessionAddress, setSessionAddress] = useState<string | null>(null)
  const [isHarvesting, setIsHarvesting] = useState(false)

  async function loadApplications() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/applications')
      const data = await res.json()
      if (data.authenticated && data.address) {
        setSessionAddress(data.address)
      }
      if (Array.isArray(data.applications)) {
        setApplications(data.applications)
      }
    } catch (err) {
      console.error('Failed to load applications:', err)
      toast.error('Could not fetch applications from Career Vault.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadApplications()
  }, [])

  async function handleQuickEvaluateLiveFeed() {
    setIsHarvesting(true)
    toast.info('Fetching live remote jobs from verified feeds...')
    try {
      const harvestRes = await fetch('/api/harvest?query=software%20engineer')
      const harvestData = await harvestRes.json()
      if (!harvestData.jobs || harvestData.jobs.length === 0) {
        toast.error('No live jobs found in current feeds.')
        return
      }

      const sampleJob = harvestData.jobs[0]
      toast.info(`Evaluating live posting: "${sampleJob.title}" at ${sampleJob.company}...`)

      const evalRes = await fetch('/api/evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job: sampleJob,
          cv_text: 'Experienced Fullstack TypeScript & Rust engineer proficient in Next.js, Sui Move, distributed systems, and Walrus storage integration.'
        })
      })
      const evalData = await evalRes.json()

      if (evalData.application) {
        toast.success(`Evaluated and routed "${evalData.application.title}" (${evalData.application.track === 'track_a_auto_apply' ? 'Track A' : 'Track B'}).`)
        await loadApplications()
      }
    } catch (err) {
      console.error(err)
      toast.error('Live evaluation encountered an error.')
    } finally {
      setIsHarvesting(false)
    }
  }

  const [trackFilter, setTrackFilter] = useState<'all' | 'track_a' | 'track_b'>('all')

  // Dispatch Modal State (Track A)
  const [dispatchApp, setDispatchApp] = useState<ApplicationItem | null>(null)
  const [recruiterEmail, setRecruiterEmail] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [isDispatching, setIsDispatching] = useState(false)

  // ATS Quick-Fill Kit Modal State (Track B)
  const [atsApp, setAtsApp] = useState<ApplicationItem | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [atsProfile, setAtsProfile] = useState<{
    name: string
    email: string
    phone: string
    role: string
    linkedin: string
    github: string
    skills: string[]
  }>({
    name: '',
    email: '',
    phone: '',
    role: '',
    linkedin: '',
    github: '',
    skills: [],
  })

  useEffect(() => {
    // Sync candidate profile for ATS Quick-Fill
    fetch('/api/candidate/me')
      .then(res => res.json())
      .then(data => {
        const storedName = localStorage.getItem('careerace_candidate_name') || ''
        const storedRole = localStorage.getItem('careerace_target_title') || ''
        const storedEmail = localStorage.getItem('careerace_candidate_email') || ''
        const storedPhone = localStorage.getItem('careerace_candidate_phone') || ''
        const storedLinkedin = localStorage.getItem('careerace_candidate_linkedin') || ''
        const storedGithub = localStorage.getItem('careerace_candidate_github') || ''

        setAtsProfile({
          name: data?.username || storedName || 'Candidate',
          email: data?.email || storedEmail || '',
          phone: data?.phone || storedPhone || '',
          role: data?.primaryRole || storedRole || 'Software Engineer',
          linkedin: storedLinkedin || '',
          github: storedGithub || '',
          skills: data?.skills || ['Full Stack Development', 'TypeScript', 'Next.js', 'Distributed Systems'],
        })
      })
      .catch(() => {})
  }, [])

  function openDispatchModal(app: ApplicationItem) {
    const candidateName = atsProfile.name || localStorage.getItem('careerace_candidate_name') || 'Candidate'
    const cleanCompany = app.company.toLowerCase().replace(/[^a-z0-9]/g, '')
    setDispatchApp(app)
    setRecruiterEmail(`careers@${cleanCompany || 'company'}.com`)
    setCoverLetter(
      `Dear Hiring Team at ${app.company},\n\nI am writing to express my strong interest in the ${app.title} position. With verified competencies evaluated through Career Ace, I am excited to apply my background in modern web engineering and high-throughput systems to your team.\n\nYou can review my cryptographically verified profile, code repositories, and STAR+R interview results on my Career Ace Passport: https://careerace.vercel.app/p/${encodeURIComponent(candidateName)}\n\nBest regards,\n${candidateName}`
    )
  }

  async function handleSendDispatch() {
    if (!dispatchApp) return
    setIsDispatching(true)
    const toastId = toast.loading(`Dispatching application to ${dispatchApp.company}...`)
    try {
      const zapierWebhook = localStorage.getItem('careerace_zapier_webhook') || undefined
      const candidateName = localStorage.getItem('careerace_candidate_name') || 'Candidate'

      const res = await fetch('/api/applications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: dispatchApp.id,
          title: dispatchApp.title,
          company: dispatchApp.company,
          apply_url: dispatchApp.apply_url,
          fit_score: dispatchApp.fit_score,
          recruiter_email: recruiterEmail,
          cover_letter: coverLetter,
          candidate_name: candidateName,
          zapier_webhook_url: zapierWebhook,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message || `Dispatched to ${dispatchApp.company}!`, { id: toastId })
        setDispatchApp(null)
        await loadApplications()
      } else {
        toast.error(data.error || 'Dispatch encountered an issue.', { id: toastId })
      }
    } catch {
      toast.error('Network error dispatching application.', { id: toastId })
    } finally {
      setIsDispatching(false)
    }
  }

  function openAtsKitModal(app: ApplicationItem) {
    const storedName = localStorage.getItem('careerace_candidate_name') || 'Candidate'
    const storedCv = localStorage.getItem('careerace_parsed_profile')
    let skills = ['TypeScript', 'React', 'Node.js', 'Next.js']
    if (storedCv) {
      try {
        const parsed = JSON.parse(storedCv)
        if (Array.isArray(parsed.skills)) skills = parsed.skills
      } catch {}
    }

    setAtsProfile({
      name: storedName,
      email: 'candidate@example.com',
      phone: '+1 (555) 000-0000',
      role: app.title,
      linkedin: 'https://linkedin.com/in/candidate',
      github: 'https://github.com/candidate',
      skills,
    })
    setAtsApp(app)
  }

  function copyField(fieldName: string, text: string) {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    toast.success(`Copied ${fieldName} to clipboard!`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const trackAApps = applications.filter(a => a.status === 'Applied' || a.track === 'track_a_auto_apply')
  const trackBApps = applications.filter(a => a.status === 'Manual Required' || a.track === 'track_b_manual_queue')

  return (
    <AppShell>
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Application Tracker Board</h1>
              <Badge variant="outline" className="font-mono text-[10px]">
                Dual-Track Engine
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Autonomous dual-track routing: Track A direct auto-submission vs Track B manual review queue.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadApplications}
              disabled={isLoading}
              className="gap-2 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Sync Vault
            </Button>
            <Button
              size="sm"
              onClick={() => router.push('/interview_room')}
              className="gap-2 text-xs"
            >
              <Target className="w-3.5 h-3.5" />
              Interview Room
            </Button>
          </div>
        </div>

        {/* 4 Interactive Overview Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card
            onClick={() => setTrackFilter(trackFilter === 'track_a' ? 'all' : 'track_a')}
            className={`p-4 cursor-pointer transition-all border-l-4 border-l-emerald-500 hover:shadow-md ${
              trackFilter === 'track_a' ? 'ring-2 ring-emerald-500 bg-emerald-500/5' : ''
            }`}
          >
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">Works Auto-Applied</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-500">{trackAApps.length}</div>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
              <span>Track A Direct</span>
              <span className="text-primary text-[10px] font-medium">{trackFilter === 'track_a' ? 'Showing' : 'Click to view'}</span>
            </p>
          </Card>

          <Card
            onClick={() => setTrackFilter(trackFilter === 'track_b' ? 'all' : 'track_b')}
            className={`p-4 cursor-pointer transition-all border-l-4 border-l-amber-500 hover:shadow-md ${
              trackFilter === 'track_b' ? 'ring-2 ring-amber-500 bg-amber-500/5' : ''
            }`}
          >
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">Track Manual Review</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-500">{trackBApps.length}</div>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
              <span>Track B Queue</span>
              <span className="text-primary text-[10px] font-medium">{trackFilter === 'track_b' ? 'Showing' : 'Click to view'}</span>
            </p>
          </Card>

          <Card
            onClick={handleQuickEvaluateLiveFeed}
            className="p-4 cursor-pointer transition-all border-l-4 border-l-primary hover:shadow-md hover:border-primary"
          >
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">Jobs Available</span>
              <Briefcase className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">Live Feeds</div>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
              <span>{isHarvesting ? 'Harvesting...' : 'Remote tech roles'}</span>
              <span className="text-primary text-[10px] font-medium">Evaluate &rarr;</span>
            </p>
          </Card>

          <Card
            onClick={() => router.push('/interview_room')}
            className="p-4 cursor-pointer transition-all border-l-4 border-l-violet-500 hover:shadow-md hover:border-violet-500"
          >
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">Interview Room</span>
              <Target className="w-4 h-4 text-violet-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">STAR+R Prep</div>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
              <span>Practice Ready</span>
              <span className="text-primary text-[10px] font-medium">Enter room &rarr;</span>
            </p>
          </Card>
        </div>

        {/* Filter Reset pill if active */}
        {trackFilter !== 'all' && (
          <div className="flex items-center justify-between text-xs bg-muted/40 p-2.5 rounded-lg border">
            <span className="text-muted-foreground">
              Filtering by: <strong className="text-foreground">{trackFilter === 'track_a' ? 'Track A (Auto-Applied)' : 'Track B (Manual Review Queue)'}</strong>
            </span>
            <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setTrackFilter('all')}>
              Show All Applications
            </Button>
          </div>
        )}

        {/* Status Banner */}
        <div className="rounded-xl border bg-card/60 backdrop-blur p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {sessionAddress
                  ? `Sovereign Candidate Vault Connected: ${sessionAddress.slice(0, 8)}...${sessionAddress.slice(-6)}`
                  : 'Candidate Vault: Guest Mode (Connect Google zkLogin to persist on Sui & Walrus)'}
              </p>
              <p className="text-muted-foreground mt-0.5">
                All evaluations and submission milestones are verified and indexed to decentralized Walrus blobs.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleQuickEvaluateLiveFeed}
            disabled={isHarvesting}
            className="gap-1.5 text-xs whitespace-nowrap"
          >
            <Briefcase className="w-3.5 h-3.5" />
            {isHarvesting ? 'Evaluating...' : 'Evaluate Live Job Feed'}
          </Button>
        </div>

        {/* Dual-Track Columns */}
        <div className={`grid gap-8 ${trackFilter === 'all' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Track A Column */}
          {(trackFilter === 'all' || trackFilter === 'track_a') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-lg font-bold">Track A: Auto-Applied</h2>
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  {trackAApps.length}
                </Badge>
              </div>

            {isLoading ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-xs text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
                Querying Walrus decentralized storage...
              </div>
            ) : trackAApps.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center space-y-3">
                <p className="text-sm font-semibold">No Auto-Applied Applications Yet</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  When a harvested tech role scores 6/10 or higher with a direct email or API endpoint, Career Ace auto-generates your tailored materials and records the submission.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push('/dashboard#jobs')}
                  className="text-xs gap-1.5"
                >
                  Go to Job Harvester <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {trackAApps.map((app) => (
                  <Card key={app.id} className="p-5 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-sm leading-snug">{app.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{app.company}</p>
                      </div>
                      <Badge variant="outline" className="font-mono text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                        Fit: {app.fit_score}/10
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-3 border-t mt-4 gap-2">
                      <span className="font-mono text-[11px]">Submitted {app.processed_at}</span>
                      <div className="flex items-center gap-2">
                        {app.apply_url && (
                          <a
                            href={app.apply_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary flex items-center gap-1 hover:underline text-xs"
                          >
                            Listing <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <Button
                          size="sm"
                          onClick={() => openDispatchModal(app)}
                          className="h-7 text-xs px-2.5 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          <Send className="w-3 h-3" /> Auto-Dispatch
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/interview_room?role=${encodeURIComponent(app.title)}&company=${encodeURIComponent(app.company)}`)}
                          className="h-7 text-xs px-2 text-primary hover:bg-primary/10 gap-1"
                        >
                          Prep STAR+R <Target className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Track B Column */}
          {(trackFilter === 'all' || trackFilter === 'track_b') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h2 className="text-lg font-bold">Track B: Manual Review Queue</h2>
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  {trackBApps.length}
                </Badge>
              </div>

              {isLoading ? (
                <div className="rounded-xl border border-dashed p-8 text-center text-xs text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
                  Querying Walrus decentralized storage...
                </div>
              ) : trackBApps.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center space-y-3">
                  <p className="text-sm font-semibold">Queue Clean — 0 Pending Manual Reviews</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Roles that require complex ATS multi-step authentication (such as Workday or LinkedIn Easy Apply) or have lower candidate alignment are safely queued here for human sign-off.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleQuickEvaluateLiveFeed}
                    disabled={isHarvesting}
                    className="text-xs gap-1.5"
                  >
                    Harvest & Evaluate Live Jobs
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {trackBApps.map((app) => (
                    <Card key={app.id} className="p-5 border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-sm leading-snug">{app.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{app.company}</p>
                        </div>
                        <Badge variant="outline" className="font-mono text-xs text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10">
                          Fit: {app.fit_score}/10
                        </Badge>
                      </div>

                      <p className="text-xs text-amber-600 dark:text-amber-400 my-2 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                        Action Required: {app.flag_reason || 'Requires manual submission via employer ATS portal.'}
                      </p>

                      <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-3 border-t gap-2">
                        <span className="font-mono text-[11px]">{app.processed_at}</span>
                        <div className="flex items-center gap-2">
                          {app.apply_url && (
                            <a
                              href={app.apply_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary flex items-center gap-1 hover:underline text-xs"
                            >
                              Open Portal <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openAtsKitModal(app)}
                            className="h-7 text-xs px-2.5 gap-1.5 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                          >
                            <Wand2 className="w-3 h-3 text-amber-500" /> ATS Quick-Fill
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/interview_room?role=${encodeURIComponent(app.title)}&company=${encodeURIComponent(app.company)}`)}
                            className="h-7 text-xs px-2 text-primary hover:bg-primary/10 gap-1"
                          >
                            Prep STAR+R <Target className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Auto-Dispatch Modal (Track A) */}
        {dispatchApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-card border rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-500" /> Autonomous Application Dispatch
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {dispatchApp.title} &bull; <strong className="text-foreground">{dispatchApp.company}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDispatchApp(null)}
                  className="text-muted-foreground hover:text-foreground text-lg leading-none"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Recruiter / Intake Email</label>
                  <input
                    type="email"
                    value={recruiterEmail}
                    onChange={(e) => setRecruiterEmail(e.target.value)}
                    placeholder="careers@company.com"
                    className="w-full rounded-md border bg-background px-3 py-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Tailored Cover Letter &amp; Verified Passport Link</label>
                  <textarea
                    rows={6}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-xs leading-relaxed"
                  />
                </div>

                <div className="p-3 rounded-lg border bg-muted/30 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">
                    Zapier Action: <strong>{typeof window !== 'undefined' && localStorage.getItem('careerace_zapier_webhook') ? 'Linked via Webhook (Auto-Mail / Notion)' : 'Sovereign Career Vault Recording'}</strong>
                  </span>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 text-[10px]">
                    Ready
                  </Badge>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="ghost" size="sm" onClick={() => setDispatchApp(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSendDispatch}
                  disabled={isDispatching}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Send className={`w-3.5 h-3.5 ${isDispatching ? 'animate-spin' : ''}`} />
                  {isDispatching ? 'Dispatching...' : 'Dispatch Application'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ATS Quick-Fill Kit Modal (Track B) */}
        {atsApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-card border rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-amber-500" /> ATS Quick-Fill Copilot Kit
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    1-Click copy &amp; browser autofill for Greenhouse, Lever &amp; Workday portals.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAtsApp(null)}
                  className="text-muted-foreground hover:text-foreground text-lg leading-none"
                >
                  &times;
                </button>
              </div>

              {/* 1-Click Browser Bookmarklet & Extension Card */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Instant Browser Autofill Bookmarklet
                  </span>
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">No install required</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Drag the button below to your Bookmarks Bar. When you are on any Greenhouse, Lever, or Workday application page, click it to auto-fill all form inputs automatically!
                </p>
                <div className="pt-1 flex flex-wrap gap-2 items-center">
                  <a
                    href={`javascript:(function(){var p={name:"${atsProfile.name}",first_name:"${atsProfile.name.split(' ')[0]}",last_name:"${atsProfile.name.split(' ').slice(1).join(' ') || 'Candidate'}",email:"${atsProfile.email}",phone:"${atsProfile.phone}",linkedin:"${atsProfile.linkedin}",github:"${atsProfile.github}",portfolio:"https://careerace.vercel.app/p/${encodeURIComponent(atsProfile.name)}"};document.querySelectorAll('input,textarea').forEach(function(i){var n=((i.name||'')+' '+(i.id||'')+' '+(i.placeholder||'')).toLowerCase();function s(v){if(v&&!i.value){i.value=v;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));}}if(n.includes('first'))s(p.first_name);else if(n.includes('last'))s(p.last_name);else if(n.includes('name'))s(p.name);else if(n.includes('email')||i.type==='email')s(p.email);else if(n.includes('phone')||n.includes('tel'))s(p.phone);else if(n.includes('linkedin'))s(p.linkedin);else if(n.includes('github')||n.includes('git'))s(p.github);else if(n.includes('website')||n.includes('portfolio')||n.includes('url'))s(p.portfolio);});alert('Career Ace ATS Copilot: Form fields filled successfully!');})();`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:bg-primary/90 cursor-grab"
                    title="Drag me to your Bookmarks Bar!"
                  >
                    <Bookmark className="w-3.5 h-3.5" /> Drag: Fill with Career Ace
                  </a>
                  <a
                    href="/extension/manifest.json"
                    target="_blank"
                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground underline ml-2"
                  >
                    View Chrome Extension files <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Individual 1-Click Copy Fields */}
              <div className="space-y-2 text-xs">
                <span className="font-semibold text-foreground text-xs block">Or Click Any Field to Copy Directly:</span>
                <div className="grid sm:grid-cols-2 gap-2">
                  {[
                    { label: 'Full Name', value: atsProfile.name },
                    { label: 'Email Address', value: atsProfile.email },
                    { label: 'Phone Number', value: atsProfile.phone },
                    { label: 'LinkedIn Profile', value: atsProfile.linkedin },
                    { label: 'GitHub Profile', value: atsProfile.github },
                    { label: 'Verified Passport URL', value: `https://careerace.vercel.app/p/${encodeURIComponent(atsProfile.name)}` },
                  ].map((f) => (
                    <div
                      key={f.label}
                      onClick={() => copyField(f.label, f.value)}
                      className="p-2.5 rounded-lg border bg-card/60 hover:bg-muted/40 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="overflow-hidden mr-2">
                        <span className="text-[10px] text-muted-foreground block">{f.label}</span>
                        <span className="font-mono text-xs font-semibold truncate block">{f.value}</span>
                      </div>
                      <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0">
                        {copiedField === f.label ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-semibold text-foreground">Matched Skills (Keywords Comma-Separated)</span>
                    <button
                      type="button"
                      onClick={() => copyField('Keywords', atsProfile.skills.join(', '))}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy Keywords
                    </button>
                  </div>
                  <div className="p-2.5 rounded-md border bg-muted/20 font-mono text-[11px] text-muted-foreground">
                    {atsProfile.skills.join(', ')}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                {atsApp.apply_url && (
                  <a
                    href={atsApp.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium"
                  >
                    Open Employer ATS Portal <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <Button variant="ghost" size="sm" onClick={() => setAtsApp(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
