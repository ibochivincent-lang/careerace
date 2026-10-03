'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ChatdeckFooter } from '@/components/blocks/chatdeck_footer'
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Database,
  Lock,
  Zap,
  HelpCircle
} from 'lucide-react'

export default function PricingPage() {
  const router = useRouter()

  const tiers = [
    {
      name: 'Candidate Starter',
      price: '$0',
      period: 'forever',
      description: 'Everything you need to audit your resume and establish your private Walrus Sovereign Memory vault.',
      badge: 'Free Forever',
      features: [
        'Complete ATS Resume Audit & Scoring',
        'Sovereign Walrus Vault Storage (AES-256-GCM)',
        'Google zkLogin Identity Isolation',
        'Standard OpenXML .docx & JSON Resume Export',
        'Basic Autonomous AI Career Copilot'
      ],
      cta: 'Get Started Free',
      highlighted: false,
      buttonVariant: 'outline' as const
    },
    {
      name: 'Career Pro',
      price: 'Free',
      period: 'during Walrus hackathon',
      description: 'Continuous autonomous career copilot with real-time job harvesting and multi-session Walrus memory.',
      badge: 'Most Popular',
      features: [
        'Unlimited AI Bullet Rewrites (Google XYZ Formula)',
        'Real-Time Job Harvester across 9 Verified Networks',
        'Automated Tailored Cover Letter Studio',
        'Persistent Cross-Session Walrus Memory & Provenance',
        'Interactive AI Mock Interviewer with STAR+R Coaching',
        'Automatic ATS Compliance X-Ray Inspection'
      ],
      cta: 'Get Started',
      highlighted: true,
      buttonVariant: 'default' as const
    }
  ]

  const faqs = [
    {
      q: 'Is Career Ace really free to start?',
      a: 'Yes. You can immediately upload your resume, audit ATS keywords, store your encrypted milestones in Walrus Memory, and export compliant documents with zero fees.'
    },
    {
      q: 'How does Walrus Memory protect my data?',
      a: 'Your career records are encrypted client-side using AES-256-GCM keys derived from your Sui address before being stored on Walrus decentralized storage. No corporate entity or recruiter can read your raw data without your explicit cryptographic authorization.'
    },
    {
      q: 'Can I export my resume to Word (.docx) and PDF?',
      a: 'Yes. Career Ace compiles your verified experience into single-column, table-free OpenXML .docx documents and standardized JSON Resumes that parse with 100% fidelity on Workday, Taleo, Greenhouse, and Lever.'
    }
  ]

  return (
    <div className="min-h-screen bg-background overflow-x-hidden flex flex-col justify-between relative">
      {/* ── Background Emerald Crystal Artwork ── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute inset-0 bg-cover bg-top bg-no-repeat opacity-80 dark:opacity-30 transition-opacity duration-700"
          style={{
            backgroundImage: "url('/hero-bg-green.webp')",
            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 60%, rgba(0,0,0,0) 98%)",
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 60%, rgba(0,0,0,0) 98%)"
          }}
        />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      </div>

      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div
            onClick={() => router.push('/')}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-card border border-border/70 shadow-sm p-1">
              <img src="/careerace_logo.png" alt="Career Ace Logo" className="w-full h-full object-contain dark:invert" />
            </div>
            <span className="font-bold text-lg">Career Ace</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground font-medium">
            <a href="/#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="/#walrus" className="hover:text-foreground transition-colors">Walrus</a>
            <a href="/#walrus-memory" className="hover:text-foreground transition-colors">Walrus Memory</a>
            <span className="text-foreground font-semibold">Pricing</span>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              size="sm"
              onClick={() => router.push('/signin?callbackUrl=/dashboard')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 shadow-sm"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main Pricing Content ── */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-16 sm:py-20 w-full space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="outline" className="px-3.5 py-1 text-xs font-semibold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
            Transparent Sovereign Access
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Simple, honest pricing.
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
            Take full ownership of your career history with decentralized Walrus storage and autonomous AI coaching.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={`p-8 rounded-2xl flex flex-col justify-between bg-card relative ${
                tier.highlighted
                  ? 'border-2 border-emerald-500 shadow-xl'
                  : 'border border-border/80 shadow-sm'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                  {tier.badge}
                </div>
              )}

              <div className="space-y-4">
                <Badge variant={tier.highlighted ? 'outline' : 'secondary'} className="text-xs">
                  {tier.name}
                </Badge>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold text-foreground">{tier.price}</span>
                  <span className="text-xs text-muted-foreground">/ {tier.period}</span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {tier.description}
                </p>

                <div className="pt-4 space-y-2.5 text-xs text-muted-foreground border-t border-border/60">
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                variant={tier.buttonVariant}
                onClick={() => router.push('/signin?callbackUrl=/dashboard')}
                className={`mt-8 w-full text-xs font-semibold h-10 ${
                  tier.highlighted
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25'
                    : 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                }`}
              >
                {tier.cta} <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Card>
          ))}
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto pt-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Frequently Asked Questions</h2>
            <p className="text-xs text-muted-foreground">Clear answers regarding sovereignty, storage, and privacy.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.q} className="p-5 rounded-xl border border-border/70 bg-card/60 space-y-1.5 text-xs">
                <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-emerald-500" />
                  {faq.q}
                </h3>
                <p className="text-muted-foreground leading-relaxed pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <ChatdeckFooter />
    </div>
  )
}
