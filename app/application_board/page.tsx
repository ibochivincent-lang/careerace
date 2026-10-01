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
  Database
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
        <div className="grid md:grid-cols-2 gap-8">
          {/* Track A Column */}
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
                  onClick={() => router.push('/')}
                  className="text-xs gap-1.5"
                >
                  Go to Job Engine <ArrowRight className="w-3 h-3" />
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

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t mt-4">
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
                          variant="ghost"
                          onClick={() => router.push(`/interview_room?role=${encodeURIComponent(app.title)}&company=${encodeURIComponent(app.company)}`)}
                          className="h-7 text-xs px-2 text-primary hover:bg-primary/10 gap-1"
                        >
                          Practice STAR+R <Target className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Track B Column */}
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

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
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
        </div>
      </div>
    </AppShell>
  )
}
