"use client"

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { motion } from 'motion/react'
import {
  Upload,
  Bot,
  Sparkles,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  Download,
  Briefcase
} from 'lucide-react'

/* ─────────────────────────────────────────────────────────────────────────────
   Animated Interactive Visual 1: Floating PDF Upload
   ───────────────────────────────────────────────────────────────────────────── */
function UploadVisual({ play = true }: { play?: boolean }) {
  return (
    <div className="relative w-full h-44 rounded-xl bg-muted/30 border border-emerald-500/20 overflow-hidden flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
      <motion.div
        animate={play ? { y: [-4, 4, -4] } : { y: 0 }}
        transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
        className="relative flex flex-col items-center"
      >
        <img
          src="/pdf.png"
          alt="PDF Resume"
          className="w-16 h-16 object-contain drop-shadow-[0_8px_16px_rgba(16,185,129,0.25)]"
        />
        <div className="mt-2.5 px-3 py-1 rounded-full bg-background border border-emerald-500/30 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Resume_Senior_Engineer.pdf</span>
        </div>
      </motion.div>
      <div className="mt-2 text-[10px] text-muted-foreground font-mono">
        Structure · Metrics · ATS Keywords parsed
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Animated Interactive Visual 2: Live Agent Chat Typing Simulation
   ───────────────────────────────────────────────────────────────────────────── */
const TYPED_PROMPT = "Make my resume sharper"
const CHAR_INTERVAL_MS = 42

function AgentVisual({ play = true }: { play?: boolean }) {
  const [cycle, setCycle] = useState(0)
  const [phase, setPhase] = useState<'typing' | 'sent' | 'thinking' | 'reply'>('typing')
  const [charCount, setCharCount] = useState(0)

  useEffect(() => {
    if (!play) return
    setPhase('typing')
    setCharCount(0)

    const timers: NodeJS.Timeout[] = []
    const startDelay = 400

    for (let i = 1; i <= TYPED_PROMPT.length; i++) {
      timers.push(setTimeout(() => setCharCount(i), startDelay + i * CHAR_INTERVAL_MS))
    }

    const sentTime = startDelay + TYPED_PROMPT.length * CHAR_INTERVAL_MS + 400
    const thinkingTime = sentTime + 450
    const replyTime = thinkingTime + 1200
    const nextCycleTime = replyTime + 2800

    timers.push(setTimeout(() => setPhase('sent'), sentTime))
    timers.push(setTimeout(() => setPhase('thinking'), thinkingTime))
    timers.push(setTimeout(() => setPhase('reply'), replyTime))
    timers.push(setTimeout(() => setCycle((c) => c + 1), nextCycleTime))

    return () => timers.forEach(clearTimeout)
  }, [play, cycle])

  return (
    <div className="relative w-full h-44 rounded-xl bg-muted/30 border border-emerald-500/20 overflow-hidden flex flex-col justify-between p-3.5 text-xs font-sans">
      <div className="space-y-2">
        {/* User sent bubble */}
        {(phase === 'sent' || phase === 'thinking' || phase === 'reply') && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="self-end ml-auto max-w-[85%] px-3 py-1.5 rounded-xl rounded-br-xs bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[11.5px] font-medium shadow-xs"
          >
            {TYPED_PROMPT}
          </motion.div>
        )}

        {/* Agent Thinking state */}
        {phase === 'thinking' && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="animate-pulse">Polishing…</span>
          </motion.div>
        )}

        {/* Agent Reply state */}
        {phase === 'reply' && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="max-w-[94%] p-2 rounded-xl rounded-bl-xs bg-background border border-border shadow-xs text-[11.5px] text-foreground leading-snug"
          >
            <p className="inline">Tightened your bullets for impact.</p>
            <span className="inline-flex items-center ml-2 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-[10px]">
              +3 edits
            </span>
          </motion.div>
        )}
      </div>

      {/* Simulated input bar */}
      <div className="mt-auto pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground bg-background/50 px-2 py-1.5 rounded-lg border">
        <span className="flex items-center">
          {phase === 'typing' ? (
            <>
              <span className="text-foreground font-medium">{TYPED_PROMPT.slice(0, charCount)}</span>
              <span className="w-1 h-3.5 bg-emerald-500 ml-0.5 animate-pulse" />
            </>
          ) : (
            <span className="text-muted-foreground/60">Ask for an edit…</span>
          )}
        </span>
        <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0">
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Animated Interactive Visual 3: Export & Tailor with Clicking Cursor
   ───────────────────────────────────────────────────────────────────────────── */
function TailorVisual({ play = true }: { play?: boolean }) {
  const [isExported, setIsExported] = useState(false)
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    if (!play) return
    setIsExported(false)
    const clickTimer = setTimeout(() => setIsExported(true), 1900)
    const resetTimer = setTimeout(() => setCycle((c) => c + 1), 4800)
    return () => {
      clearTimeout(clickTimer)
      clearTimeout(resetTimer)
    }
  }, [play, cycle])

  return (
    <div className="relative w-full h-44 rounded-xl bg-muted/30 border border-emerald-500/20 overflow-hidden flex flex-col items-center justify-center p-4">
      <div className="space-y-3 flex flex-col items-center">
        {/* Animated Export Button */}
        <motion.div
          animate={isExported ? { scale: [1, 0.94, 1.02, 1] } : { scale: 1 }}
          transition={{ duration: 0.35 }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all ${
            isExported
              ? 'bg-emerald-600 text-white shadow-emerald-600/25'
              : 'bg-background border border-border text-foreground hover:bg-muted/50'
          }`}
        >
          {isExported ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Tailored &amp; Exported</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 text-emerald-500" />
              <span>Polish, Tailor &amp; Export</span>
            </>
          )}
        </motion.div>

        {/* Live Badges */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            98% ATS Match
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted border text-muted-foreground">
            Cover Letter Ready
          </span>
        </div>
      </div>

      {/* Animated Mouse Cursor */}
      <motion.svg
        animate={
          isExported
            ? { x: [20, 0, 0], y: [24, -8, -8], opacity: [0, 1, 0] }
            : { x: [20, 0], y: [24, -8], opacity: [0, 1] }
        }
        transition={{ duration: 1.8, ease: "easeOut" }}
        className="absolute top-1/2 left-1/2 w-5 h-5 text-emerald-500 drop-shadow-md pointer-events-none"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M4 0l16 12.279-6.951 1.17 4.325 8.817-3.596 1.734-4.35-8.879-5.428 5.432z" />
      </motion.svg>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main Chatdeck Features Component
   ───────────────────────────────────────────────────────────────────────────── */
export function ChatdeckFeatures() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  const steps = [
    {
      number: "01",
      title: "Upload your resume.",
      description: "Drop in your current PDF, DOCX, or JSON Resume. Career Ace reads the structure, detects quantified metrics, and pinpoints ATS keyword gaps in seconds.",
      badge: "Universal Parser",
      visual: <UploadVisual play={true} />
    },
    {
      number: "02",
      title: "Talk with our agent.",
      description: "Ask for rewrites, tone shifts, or sharper positioning while you stay in control. Powered by Walrus Memory, Career Ace remembers your past milestones across all sessions.",
      badge: "Walrus Sovereign Memory",
      visual: <AgentVisual play={true} />
    },
    {
      number: "03",
      title: "Polish, tailor, and apply.",
      description: "Jobs are curated to you, tailored to job description, cover letters written from your resume and the job post.",
      badge: "Workday & Taleo Ready",
      visual: <TailorVisual play={true} />
    }
  ]

  const faqs = [
    {
      q: "How does Career Ace guarantee 100% ATS compliance?",
      a: "Career Ace uses an OpenXML .docx compiler and the official JSON Resume Schema v1.0.0. Our output is single-column, table-free, and respects standardized typography and heading semantics. It has been tested against Workday, Taleo, Greenhouse, Lever, and iCIMS parsers."
    },
    {
      q: "What makes Walrus Sovereign Memory different from normal AI apps?",
      a: "Traditional career apps store your private career history on centralized databases where they can sell or lock your data. Career Ace encrypts all candidate milestones using client-side AES-256-GCM tied to your Google zkLogin Sui address and stores it as content-addressed Walrus blobs. You hold the only cryptographic keys."
    },
    {
      q: "How does the autonomous Job Harvester work?",
      a: "Our background crawler monitors 9 verified remote, hybrid, and onsite networks (including Arbeitnow, Jobicy v2, Remotive, and WeWorkRemotely). New postings are evaluated against your sovereign resume and scored from 1 to 10 for skill alignment and salary bracket."
    },
    {
      q: "Can I generate automated, customized cover letters?",
      a: "Yes. Career Ace correlates your verified achievements with the specific requirements of the job posting, extracting real metrics (e.g. '2M+ RPS latency reduction') directly from your resume into compelling problem-solving narratives without inventing fake experience."
    },
    {
      q: "Is there any cost to get started?",
      a: "Zero. Career Ace provides free ATS resume auditing, sovereign profile extraction, Google zkLogin authentication, and full DOCX / JSON Resume exports with no credit card required."
    }
  ]

  return (
    <div className="space-y-24 py-12">
      {/* ── HOW IT WORKS SECTION ── */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 scroll-mt-24">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <Badge variant="outline" className="px-3.5 py-1 text-xs font-semibold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
            Streamlined 3-Step Flow
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            How it works.
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
            Upload, polish, and export a role-ready resume and tailored application in 15 seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.12, duration: 0.5 }}
              className="p-6 rounded-2xl border border-emerald-500/20 bg-card/60 backdrop-blur shadow-lg hover:border-emerald-500/40 hover:shadow-emerald-500/5 transition-all flex flex-col justify-between space-y-5"
            >
              {/* Interactive Visual Animation at the top of the card */}
              <div>{step.visual}</div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                    {step.badge}
                  </Badge>
                  <span className="font-mono text-xs font-bold text-muted-foreground/50">
                    {step.number}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-foreground">
                  {step.title}
                </h3>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="pt-2 border-t border-border/40 flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 gap-1.5">
                <span>Learn more</span> <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── SHOWCASE: CURATED JOBS + TAILORED COVER LETTERS ── */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left: Curated Jobs Showcase */}
          <div className="p-8 rounded-2xl border border-emerald-500/20 bg-card/50 shadow-xl space-y-6">
            <div className="space-y-2">
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-xs">
                Real-Time Opportunities
              </Badge>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Jobs are curated to you, tailored to job description.
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Career Ace evaluates active job feeds across the web and computes your exact ATS fit score before you even apply.
              </p>
            </div>

            {/* Mock Job Rows */}
            <div className="space-y-3">
              {[
                { title: 'Senior Infrastructure Engineer', company: 'Stripe', location: 'United States · Remote', match: '96% Fit', color: 'text-emerald-500 bg-emerald-500/10' },
                { title: 'Fullstack Distributed Systems Engineer', company: 'Mysten Labs', location: 'Global · Remote', match: '94% Fit', color: 'text-emerald-500 bg-emerald-500/10' },
                { title: 'Software Engineer (Machine Learning)', company: 'Affirm', location: 'San Francisco, CA', match: '88% Fit', color: 'text-emerald-500 bg-emerald-500/10' },
              ].map((job) => (
                <div key={job.title} className="p-3.5 rounded-xl border border-border/70 bg-background/80 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-bold text-foreground">
                      {job.company.slice(0, 1)}
                    </div>
                    <div>
                      <span className="font-semibold text-foreground block">{job.title}</span>
                      <span className="text-muted-foreground">{job.company} · {job.location}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={`font-mono text-xs ${job.color} border-transparent`}>
                    {job.match}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Automated Cover Letters Showcase */}
          <div className="p-8 rounded-2xl border border-emerald-500/20 bg-card/50 shadow-xl space-y-6">
            <div className="space-y-2">
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-xs">
                Instant Cover Letter Studio
              </Badge>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Cover letters written from your resume and the job post.
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Your real wins, in the company's own language. Edit it, regenerate with a different problem-solving angle, and export.
              </p>
            </div>

            {/* Letter Preview Mockup */}
            <div className="p-5 rounded-xl border border-border/80 bg-background shadow-inner space-y-4 text-xs relative">
              <div className="flex flex-wrap items-center gap-2 pb-3 border-b">
                <Badge variant="secondary" className="text-xs">Google</Badge>
                <Badge variant="secondary" className="text-xs">Staff Engineer, Infrastructure</Badge>
                <Badge variant="outline" className="text-xs text-muted-foreground font-mono">Alex_Chen_Resume.pdf</Badge>
              </div>

              {/* Floating Metric Callout */}
              <div className="inline-block p-2 rounded-lg bg-emerald-600 text-white text-xs font-medium shadow-md shadow-emerald-600/30">
                Pulls real metrics directly from your resume.
              </div>

              <div className="space-y-2 text-muted-foreground text-xs leading-relaxed">
                <p className="font-semibold text-foreground">Dear Google Infrastructure Hiring Team,</p>
                <p>
                  I build the high-throughput systems this role owns. At Stripe, I designed distributed backend services that handle high-volume event streams, and led the team that cut payment p99 latency by 45ms for enterprise tier accounts.
                </p>
                <p>
                  Your posting asks for production-grade Go, distributed consensus, and Kubernetes at planetary scale. That has been my day job for four years…
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ACCORDION SECTION ── */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <Badge variant="outline" className="px-3.5 py-1 text-xs font-semibold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
            Frequently Asked Questions
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Everything you need to know.
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx
            return (
              <div
                key={faq.q}
                className="rounded-xl border border-border/80 bg-card overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left font-bold text-sm sm:text-base flex items-center justify-between gap-4 hover:bg-muted/40 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-emerald-500 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
