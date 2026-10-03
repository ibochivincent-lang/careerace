'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AccountChip } from '@/components/AccountChip'
import { ChatdeckHero } from '@/components/blocks/chatdeck_hero'
import { ChatdeckFeatures } from '@/components/blocks/chatdeck_features'
import { ChatdeckFooter } from '@/components/blocks/chatdeck_footer'
import {
  Sparkles, Database, Lock, Fingerprint, Cpu, Globe,
  ShieldCheck, ArrowRight, CheckCircle2
} from 'lucide-react'

export default function CareerAceLandingPage() {
  const router = useRouter()
  const [sessionAddress, setSessionAddress] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      const search = window.location.search
      if (hash.includes('access_token=') || hash.includes('id_token=') || search.includes('code=')) {
        router.push(`/signin${search}${hash}`)
        return
      }
    }

    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.address) {
          setSessionAddress(data.address)
        }
      })
      .catch((err) => {
        console.warn('Session verification notice:', err)
      })
  }, [router])

  function handleOpenWorkspace() {
    if (sessionAddress) {
      router.push('/dashboard')
    } else {
      router.push('/signin?callbackUrl=/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ── Clean Sticky Header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-card border border-border/70 shadow-sm p-1">
              <img src="/careerace_logo.png" alt="Career Ace Logo" className="w-full h-full object-contain dark:invert" />
            </div>
            <span className="font-bold text-lg">Career Ace</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground font-medium">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#walrus" className="hover:text-foreground transition-colors">Walrus</a>
            <a href="#walrus-memory" className="hover:text-foreground transition-colors">Walrus Memory</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {sessionAddress ? (
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => router.push('/dashboard')} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold gap-1.5 shadow-sm">
                  Dashboard <ArrowRight className="w-3.5 h-3.5" />
                </Button>
                <AccountChip address={sessionAddress} />
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => router.push('/signin?callbackUrl=/dashboard')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 shadow-sm"
              >
                Get Started
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ── Authenticated Workspace Quick-Nav ─────────────────────────────── */}
      {sessionAddress && (
        <div className="bg-primary/5 border-b border-primary/20 py-2.5 px-4">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Sovereign Vault Active:</span>
              <span className="font-mono text-muted-foreground">{sessionAddress.slice(0, 10)}...{sessionAddress.slice(-6)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" className="h-7 text-xs gap-1.5" onClick={() => router.push('/dashboard')}>
                Open Dashboard Workspace <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Hero Block with Emerald Crystal Background ─────────────────────── */}
      <div className="max-w-7xl mx-auto px-4">
        <ChatdeckHero onStart={handleOpenWorkspace} />
      </div>

      {/* ── Features & How it Works Section ─────────────────────────────────── */}
      <div id="features">
        <ChatdeckFeatures />
      </div>

      {/* ── Sovereign Architecture & Walrus Memory ──────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {/* Free Model Info Badge */}
        <div className="mb-12 flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="w-4 h-4 text-primary" /> Powered by Free &amp; Open-Source LLMs (DeepSeek R1 / Qwen 2.5 / Ollama Local)
          </div>
          <Badge variant="secondary">Zero Paid API Key Required</Badge>
        </div>

        {/* ── WALRUS DECENTRALIZED CAREER MEMORY & SOVEREIGN ARCHITECTURE ── */}
        <div id="walrus" className="scroll-mt-24">
          <div id="walrus-memory" className="mb-16 scroll-mt-24">
            <Card className="p-8 border-2 shadow-lg bg-card/50">
              <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Badge variant="outline" className="px-3 py-1 bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                    <Database className="w-3.5 h-3.5 mr-1" /> Walrus Memory Core
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Sui zkLogin + AES-256-GCM Encryption
                  </Badge>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  Decentralized Career Memory: Sovereign Candidate Architecture
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your career lineage belongs strictly to you. With Walrus Memory (<code className="font-mono text-xs">@mysten-incubation/memwal</code> + <code className="font-mono text-xs">@mysten/walrus</code>), Career Ace eliminates centralized platform silos, ensuring permanent availability, zero-knowledge privacy, and absolute user isolation.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button variant="outline" size="sm" onClick={() => router.push('/memory')} className="text-xs flex items-center gap-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                    <Database className="w-3.5 h-3.5" /> Memory Sandbox &amp; Vault
                  </Button>
                  <Button size="sm" onClick={() => router.push('/signin?callbackUrl=/dashboard')} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold gap-1.5 shadow-sm">
                    Get Started <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* 4 Architectural Superpowers */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Feature 1 */}
                <div className="p-5 rounded-xl border bg-background/60 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
                      <Database className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base mb-1.5">Decentralized Blob Persistence</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Unlike LinkedIn or corporate applicant tracking systems that can delete or paywall your records, your CV and match lineage are stored as durable, content-addressed Walrus blobs permanently owned by you.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t text-[11px] font-mono text-muted-foreground">
                    Stack: @mysten/walrus
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="p-5 rounded-xl border bg-background/60 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                      <Lock className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base mb-1.5">Client-Side Vault Encryption</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Resumes contain private contact details, salaries, and sensitive achievements. Everything is encrypted using client-side AES-256-GCM keys tied to your authenticated Sui address before upload. Nobody can view raw data without your key.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t text-[11px] font-mono text-muted-foreground">
                    Stack: AES-256-GCM + @mysten/walrus
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="p-5 rounded-xl border bg-background/60 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center mb-3">
                      <Fingerprint className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base mb-1.5">Deterministic User Uniqueness</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Every candidate connects their Google account via Enoki zkLogin, deriving a mathematically unique, non-custodial Sui address. Vaults are strictly isolated under namespaces with zero cross-contamination.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t text-[11px] font-mono text-muted-foreground">
                    Stack: @mysten/enoki zkLogin
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="p-5 rounded-xl border bg-background/60 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base mb-1.5">Cross-Agent Memory &amp; Provenance</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      AI recruiting bots and mock interviewers query candidate vector embeddings for skill verification without exposing raw PII. Retractions stop facts from being recalled while preserving honest on-chain provenance.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t text-[11px] font-mono text-muted-foreground">
                    Stack: @mysten-incubation/memwal
                  </div>
                </div>
              </div>

              {/* Live Sovereignty Status Strip */}
              <div className="mt-8 p-4 rounded-xl border bg-muted/40 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground">Sovereign Candidate Network Status:</span>
                    <p className="text-xs text-muted-foreground">
                      Connected to Walrus Testnet Aggregator &amp; Sui Testnet with zero-knowledge zkLogin isolation.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-mono text-muted-foreground">
                    Vault ID: {sessionAddress ? `${sessionAddress.slice(0, 10)}...${sessionAddress.slice(-6)}` : 'Local Candidate Session'}
                  </span>
                  <Badge variant={sessionAddress ? 'default' : 'outline'} className="text-[10px]">
                    {sessionAddress ? 'zkLogin Secured' : 'Guest Mode'}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* ── PRICING SECTION ── */}
        <section id="pricing" className="mb-16 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <Badge variant="outline" className="px-3.5 py-1 text-xs font-semibold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
              Transparent Access
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Simple, transparent pricing.
            </h2>
            <p className="text-sm text-muted-foreground">
              Start free today with sovereign Walrus storage and full ATS auditing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <Card className="p-8 border rounded-2xl flex flex-col justify-between bg-card/60">
              <div className="space-y-4">
                <Badge variant="secondary" className="text-xs">Candidate Starter</Badge>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground">$0</span>
                  <span className="text-xs text-muted-foreground">/ forever</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Everything you need to audit your resume and protect your career records on decentralized storage.
                </p>
                <div className="pt-4 space-y-2.5 text-xs text-muted-foreground border-t">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Complete ATS Resume Audit &amp; Score</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Sovereign Walrus Vault Storage (AES-256)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Google zkLogin Identity Isolation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Standard OpenXML .docx &amp; JSON Export</span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                className="mt-8 w-full font-semibold text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                onClick={() => router.push('/signin?callbackUrl=/dashboard')}
              >
                Get Started Free
              </Button>
            </Card>

            {/* Pro Tier */}
            <Card className="p-8 border-2 border-emerald-500 rounded-2xl flex flex-col justify-between bg-card shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                Full AI Power
              </div>
              <div className="space-y-4">
                <Badge variant="outline" className="text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  Career Pro
                </Badge>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground">Free</span>
                  <span className="text-xs text-muted-foreground">/ during hackathon</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Continuous autonomous career copilot with real-time job harvesting and multi-session Walrus memory.
                </p>
                <div className="pt-4 space-y-2.5 text-xs text-muted-foreground border-t">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Unlimited AI Bullet Rewrites (Google XYZ)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Real-Time Job Harvester across 9 Networks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Automated Tailored Cover Letter Generator</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Cross-Session Autonomous Walrus Memory</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>AI Mock Interviewer with STAR+R Coaching</span>
                  </div>
                </div>
              </div>
              <Button
                className="mt-8 w-full font-semibold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25"
                onClick={() => router.push('/signin?callbackUrl=/dashboard')}
              >
                Get Started
              </Button>
            </Card>
          </div>
        </section>

        {/* ── High-Impact Call to Action Banner ── */}
        <div className="p-8 md:p-12 rounded-2xl border-2 bg-card/60 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Private Sovereign Cockpit
              </Badge>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Unlock Your AI Copilot, Encrypted CV Vault &amp; Universal Job Harvester
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Connect to your personal workspace. Upload your CV to extract and edit verified achievements, converse with the autonomous AI career coach, and harvest jobs from 9 live networks with instant fit scoring.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <Button
              size="lg"
              onClick={handleOpenWorkspace}
              className="w-full sm:w-auto text-sm font-semibold gap-2 shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Chatdeck Footer ─────────────────────────────────────────────────── */}
      <ChatdeckFooter />
    </div>
  )
}
