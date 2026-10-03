"use client"

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'motion/react'
import {
  Upload,
  Bot,
  Sparkles,
  FileText,
  Briefcase,
  Layers,
  Database,
  Lock,
  Fingerprint,
  Cpu,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Zap,
  Building2,
  FileCheck
} from 'lucide-react'

export function ChatdeckFeatures() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  const steps = [
    {
      number: "01",
      title: "Upload your resume.",
      description: "Drop in your current PDF, DOCX, or JSON Resume. Career Ace reads the structure, detects quantified metrics, and pinpoints ATS keyword gaps in seconds.",
      icon: <Upload className="w-6 h-6 text-emerald-500" />,
      badge: "Universal Parser"
    },
    {
      number: "02",
      title: "Talk with our agent.",
      description: "Ask for rewrites, tone shifts, or sharper positioning while you stay in control. Powered by Walrus Memory, Career Ace remembers your past milestones across all sessions.",
      icon: <Bot className="w-6 h-6 text-emerald-500" />,
      badge: "Walrus Sovereign Memory"
    },
    {
      number: "03",
      title: "Polish, tailor, and export.",
      description: "Review Google XYZ AI rewrites, tune your application for any job description, and export a 100% ATS-compliant Word (.docx), JSON Resume, or PDF.",
      icon: <FileCheck className="w-6 h-6 text-emerald-500" />,
      badge: "Workday & Taleo Ready"
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
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <Badge variant="outline" className="px-3.5 py-1 text-xs font-semibold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
            Streamlined 3-Step Flow
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            How it works.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            Upload, polish, and export a role-ready resume and tailored application in 15 seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15, duration: 0.5 }}
              className="p-8 rounded-2xl border border-emerald-500/20 bg-card/60 backdrop-blur shadow-lg relative group hover:border-emerald-500/40 hover:shadow-emerald-500/5 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    {step.icon}
                  </div>
                  <span className="font-mono text-2xl font-black text-muted-foreground/30">
                    {step.number}
                  </span>
                </div>

                <Badge variant="secondary" className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-500/10">
                  {step.badge}
                </Badge>

                <h3 className="text-xl font-bold text-foreground">
                  {step.title}
                </h3>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/60 flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 gap-1.5 group-hover:translate-x-1 transition-transform">
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
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Jobs are curated to you, tailored to job description.
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
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
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Cover letters written from your resume and the job post.
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your real wins, in the company's own language. Edit it, regenerate with a different problem-solving angle, and export.
              </p>
            </div>

            {/* Letter Preview Mockup */}
            <div className="p-5 rounded-xl border border-border/80 bg-background shadow-inner space-y-4 text-xs relative">
              <div className="flex flex-wrap items-center gap-2 pb-3 border-b">
                <Badge variant="secondary" className="text-[10px]">Google</Badge>
                <Badge variant="secondary" className="text-[10px]">Staff Engineer, Infrastructure</Badge>
                <Badge variant="outline" className="text-[10px] text-muted-foreground font-mono">Alex_Chen_Resume.pdf</Badge>
              </div>

              {/* Floating Metric Callout */}
              <div className="inline-block p-2 rounded-lg bg-emerald-600 text-white text-[11px] font-medium shadow-md shadow-emerald-600/30">
                Pulls the 2M+ RPS metric from your resume.
              </div>

              <div className="space-y-2 text-muted-foreground text-[11px] leading-relaxed">
                <p className="font-semibold text-foreground">Dear Google Infrastructure Hiring Team,</p>
                <p>
                  I build the high-throughput systems this role owns. At Stripe, I designed distributed backend services that handle <strong>2M+ requests per second</strong>, and led the team that cut payment p99 latency by 45ms for enterprise tier accounts.
                </p>
                <p>
                  Your posting asks for production-grade Go, distributed consensus, and Kubernetes at planetary scale. That has been my day job for four years...
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ACCORDION SECTION ── */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <Badge variant="outline" className="px-3.5 py-1 text-xs font-semibold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
            Frequently Asked Questions
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
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
