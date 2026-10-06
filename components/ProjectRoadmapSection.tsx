'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  Compass,
  Video,
  TrendingUp,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  Send,
  Database,
} from 'lucide-react'

interface RoadmapMilestone {
  phase: string
  phaseNumber: string
  title: string
  status: 'shipped' | 'in_development' | 'upcoming'
  statusLabel: string
  eta: string
  summary: string
  highlights: string[]
  icon: any
}

const MILESTONES: RoadmapMilestone[] = [
  {
    phase: 'Phase 01',
    phaseNumber: '01',
    title: 'Core Foundations & Sovereign Vault Architecture',
    status: 'shipped',
    statusLabel: 'Shipped & Live',
    eta: 'Completed',
    summary: 'Decentralized Walrus Sovereign Memory vault with reverse-engineered ATS scoring and dual-track application outreach.',
    icon: Database,
    highlights: [
      'Encrypted client-side career vault on Walrus (@mysten/walrus)',
      'Google XYZ formula bullet refactoring and ATS scoring engine',
      'Dual-Track Email Outreach: Direct mailto link + Sovereign DKIM relay',
      'Anti-Spam 7-day cooldown tracking and RFC-5322 .eml audit receipts',
      'Zero mock data: real-time verified company crewing desks and API cascades',
    ],
  },
  {
    phase: 'Phase 02',
    phaseNumber: '02',
    title: 'Sub-2-Hour Autonomous Job Scanner & Smart Auto-Apply',
    status: 'in_development',
    statusLabel: 'Active Development',
    eta: 'Q2 2026',
    summary: 'Autonomous AI engine continuously scans specialized job feeds and prepares calibrated applications within 2 hours of a job being posted, awaiting your approval.',
    icon: Zap,
    highlights: [
      '24/7 autonomous scanning of specialized engineering, maritime, and tech feeds',
      'Sub-2-Hour Rapid Dispatch: Delivers candidate submissions within 2 hours of posting for maximum recruiter visibility',
      'Walrus Memory Credential Matcher: Automatically selects your best-fitting certifications, sea-time, and project proofs to convince recruiters',
      'Human-in-the-Loop Instant Approval: Receive an instant notification to review and approve tailored drafts before relay',
      'Daily application dispatch caps with automated executive summary reports sent to your personal inbox',
    ],
  },
  {
    phase: 'Phase 03',
    phaseNumber: '03',
    title: 'The Interview Simulation Room',
    status: 'upcoming',
    statusLabel: 'Upcoming Pipeline',
    eta: 'Q3 2026',
    summary: 'Interactive multimodal simulation room testing technical, behavioral, and high-stress operational questions with live AI feedback.',
    icon: Video,
    highlights: [
      'STAR+R Framework evaluation: Real-time scoring of Situation, Task, Action, Result, and Reflection',
      'Voice, audio, and video simulation: Stress-tested technical scenarios with role-specific questions',
      'Real-time metrics feedback: Identifies weak qualifiers, missing quantitative results, and filler phrases',
      'Recruiter simulator calibrated to rigorous maritime vessel standards and frontier tech hiring bars',
    ],
  },
  {
    phase: 'Phase 04',
    phaseNumber: '04',
    title: 'Autonomous Career Pathway Upgrade Engine',
    status: 'upcoming',
    statusLabel: 'Futuristic Horizon',
    eta: 'Q4 2026',
    summary: 'Proactive career advancement planner ensuring candidates never get trapped in a dead-end position or stagnant compensation band.',
    icon: TrendingUp,
    highlights: [
      'Step-by-step career progression maps (e.g. Engine Cadet → 3rd Engineer → Chief Engineer; Junior Developer → Systems Architect)',
      'Credential gap analysis: Identifies exact certifications or sea-time needed for the next rank',
      'Dynamic promotion readiness score based on verified milestones in your Walrus vault',
      'Compensation tariff benchmarking against verified industry union and international salary scales',
    ],
  },
]

export function ProjectRoadmapSection() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'shipped' | 'upcoming'>('all')

  const filteredMilestones = MILESTONES.filter((m) => {
    if (activeFilter === 'shipped') return m.status === 'shipped'
    if (activeFilter === 'upcoming') return m.status !== 'shipped'
    return true
  })

  return (
    <section id="roadmap" className="max-w-7xl mx-auto px-4 py-16 scroll-mt-20">
      <div className="space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3.5">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <Compass className="w-3.5 h-3.5" />
            <span>Product Roadmap &amp; Autonomous Frontiers</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Building the world&apos;s most capable autonomous career ecosystem.
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            From decentralized memory and instant batch applications to sub-2-hour autonomous job scanning and STAR+R interview simulations, here is our transparent roadmap.
          </p>

          {/* Filter Pills */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-muted/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              All Phases
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('shipped')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                activeFilter === 'shipped'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-muted/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              Shipped &amp; Live
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('upcoming')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                activeFilter === 'upcoming'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-muted/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              Upcoming Frontiers
            </button>
          </div>
        </div>

        {/* Roadmap Milestones Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredMilestones.map((milestone) => {
            const Icon = milestone.icon
            const isShipped = milestone.status === 'shipped'
            const isInDev = milestone.status === 'in_development'

            return (
              <Card
                key={milestone.phase}
                className={`p-6 sm:p-7 rounded-2xl border transition-all flex flex-col justify-between ${
                  isShipped
                    ? 'border-emerald-500/40 bg-emerald-500/[0.03] shadow-md'
                    : isInDev
                    ? 'border-teal-500/40 bg-teal-500/[0.02] shadow-md'
                    : 'border-border/80 bg-card/60'
                }`}
              >
                <div className="space-y-4">
                  {/* Top Badge Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isShipped
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : isInDev
                          ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-xs font-bold text-foreground">
                        {milestone.phase}
                      </span>
                    </div>

                    <Badge
                      variant={isShipped ? 'default' : 'outline'}
                      className={`text-[10px] font-mono ${
                        isShipped
                          ? 'bg-emerald-600 text-white'
                          : isInDev
                          ? 'border-teal-500/40 text-teal-600 dark:text-teal-400 bg-teal-500/10'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      {milestone.statusLabel} &bull; {milestone.eta}
                    </Badge>
                  </div>

                  {/* Title & Summary */}
                  <div className="space-y-1.5">
                    <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                      {milestone.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {milestone.summary}
                    </p>
                  </div>

                  {/* Highlights Checklist */}
                  <div className="pt-2 border-t border-border/50 space-y-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                      Core Deliverables
                    </span>
                    <ul className="space-y-1.5">
                      {milestone.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-foreground/90">
                          <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                            isShipped
                              ? 'text-emerald-500'
                              : isInDev
                              ? 'text-teal-500'
                              : 'text-muted-foreground'
                          }`} />
                          <span className="leading-snug">{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Footer Status Strip */}
                <div className="pt-4 mt-4 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="font-mono">Status: {milestone.statusLabel}</span>
                  {isShipped ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      Active in Production <CheckCircle2 className="w-3 h-3" />
                    </span>
                  ) : (
                    <span className="text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1">
                      Engineered with Walrus Memory <Clock className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
