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
import { WalrusCentralArchitectureChart } from '@/components/WalrusCentralArchitectureChart'
import { ProjectRoadmapSection } from '@/components/ProjectRoadmapSection'
import { FeedbackModal } from '@/components/FeedbackModal'
import {
  Sparkles, Database, Lock, Fingerprint, Cpu, Globe,
  ShieldCheck, ArrowRight, ExternalLink, Briefcase, MessageSquare, Compass
} from 'lucide-react'

export default function CareerAceLandingPage() {
  const router = useRouter()
  const [sessionAddress, setSessionAddress] = useState<string | null>(null)
  const [suinsDomain, setSuinsDomain] = useState<string | null>(null)
  const [feedbackOpen, setFeedbackOpen] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      const search = window.location.search
      if (hash.includes('access_token=') || hash.includes('id_token=') || search.includes('code=')) {
        router.push(`/signin${search}${hash}`)
        return
      }

      const storedDomain = localStorage.getItem('careerace_suins_domain')
      if (storedDomain) {
        setSuinsDomain(storedDomain)
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
    <div className="min-h-screen bg-background overflow-x-hidden relative">
      {/* ── Full-Width Polishme-Style Emerald Crystal Background ── */}
      <div className="absolute top-0 left-0 right-0 h-[850px] pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute inset-0 bg-cover bg-top bg-no-repeat opacity-95 dark:opacity-40 transition-opacity duration-700"
          style={{
            backgroundImage: "url('/hero-bg-green.webp')",
            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 60%, rgba(0,0,0,0) 98%)",
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 60%, rgba(0,0,0,0) 98%)"
          }}
        />
        {/* Luminous emerald glow radial gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.20),rgba(5,150,105,0.06),transparent_70%)] blur-2xl pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-emerald-500/15 rounded-full blur-[110px] pointer-events-none" />
      </div>

      {/* ── Clean Sticky Header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-card border border-border/70 shadow-sm p-1">
              <img src="/careerace_logo.png" alt="Career Ace Logo" className="w-full h-full object-contain dark:invert" />
            </div>
            <span className="font-bold text-lg">Career Ace</span>
          </div>

          <nav className="hidden md:flex items-center gap-5 text-sm text-muted-foreground font-medium">
            <a href="#about" className="hover:text-foreground transition-colors">About</a>
            <a href="#domains" className="hover:text-foreground transition-colors">Industries</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#architecture" className="hover:text-foreground transition-colors">Architecture</a>
            <a href="#roadmap" className="hover:text-foreground transition-colors">Roadmap</a>
            <a href="/pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFeedbackOpen(true)}
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8 px-2.5 hidden sm:flex cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
              <span>Feedback</span>
            </Button>

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
            <div className="flex items-center gap-2 font-medium flex-wrap">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Sovereign Vault Active:</span>
              <span className="font-mono text-muted-foreground">{sessionAddress.slice(0, 10)}...{sessionAddress.slice(-6)}</span>
              {suinsDomain && (
                <a
                  href={`/p/${suinsDomain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 transition-colors cursor-pointer"
                  title="View Public SuiNS Passport"
                >
                  <Globe className="w-2.5 h-2.5" />
                  <span>{suinsDomain}</span>
                  <ExternalLink className="w-2 h-2 opacity-70" />
                </a>
              )}
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

      {/* ── ABOUT & UNIVERSAL TECHNICAL DOMAINS SECTION ── */}
      <section id="about" className="max-w-7xl mx-auto px-4 py-16 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3.5">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <Briefcase className="w-3.5 h-3.5" />
            <span>About Career Ace &bull; Universal Technical Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Engineered for every high-stakes technical discipline.
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Career Ace is a universal autonomous career agent and decentralized career vault. We eliminate ATS opacity, platform lock-in, and generic AI slop across software, artificial intelligence, robotics, healthcare, and engineering.
          </p>
        </div>

        {/* Universal Technical Domains Grid with Tags */}
        <div id="domains" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Domain 1 */}
          <div className="p-5 rounded-2xl border border-border/80 bg-card/60 space-y-3.5 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-border text-foreground font-mono text-[10px]">
                  Sector 01
                </Badge>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  Universal
                </span>
              </div>
              <h3 className="font-bold text-base text-foreground">Software &amp; Distributed Cloud</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Calibrated for fullstack, backend systems, cloud architects, and site reliability engineers. Automatically benchmarks against Workday and Greenhouse schemas.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Distributed Systems', 'Kubernetes', 'Go / Rust', 'AWS / GCP', 'Microservices'].map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-md bg-muted/40 border border-border/60 text-[10px] text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Verified Employers</span>
              <span className="font-medium text-foreground">Stripe, AWS, Cloudflare</span>
            </div>
          </div>

          {/* Domain 2 */}
          <div className="p-5 rounded-2xl border border-border/80 bg-card/60 space-y-3.5 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-border text-foreground font-mono text-[10px]">
                  Sector 02
                </Badge>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  Frontier
                </span>
              </div>
              <h3 className="font-bold text-base text-foreground">AI, Machine Learning &amp; Robotics</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pulls research citations, model optimization metrics, CUDA kernel speedups, and autonomous robotics achievements directly into quantifiable STAR+R statements.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['PyTorch', 'LLM Fine-Tuning', 'ROS 2', 'CUDA Kernels', 'Computer Vision'].map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-md bg-muted/40 border border-border/60 text-[10px] text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Verified Employers</span>
              <span className="font-medium text-foreground">DeepMind, OpenAI, Boston Dynamics</span>
            </div>
          </div>

          {/* Domain 3 - Flagship Case Study */}
          <div className="p-5 rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/[0.03] space-y-3.5 flex flex-col justify-between relative shadow-lg shadow-emerald-500/5">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Badge className="bg-emerald-600 text-white font-mono text-[10px] font-bold">
                  Flagship Case Study
                </Badge>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  Regulated Rigor
                </span>
              </div>
              <h3 className="font-bold text-base text-foreground">Maritime &amp; Offshore Engineering</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Featured case study demonstrating Career Ace&apos;s ability to handle the world&apos;s strictest multi-credential standards: STCW licensures, physical discharge books, and sea-time audits.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['STCW BST', 'CoC Class 1-4', 'ENG1 Medical', 'Dynamic Positioning', 'BOSIET'].map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="pt-3 border-t border-emerald-500/20 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Verified Operators</span>
              <span className="font-semibold text-foreground">Maersk, ABS, Tidewater, DNV</span>
            </div>
          </div>

          {/* Domain 4 */}
          <div className="p-5 rounded-2xl border border-border/80 bg-card/60 space-y-3.5 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-border text-foreground font-mono text-[10px]">
                  Sector 03
                </Badge>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  Universal
                </span>
              </div>
              <h3 className="font-bold text-base text-foreground">Healthcare &amp; BioInformatics</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tailors clinical data workflows, HIPAA/FDA compliance histories, medical imaging pipelines, and genomics infrastructure with strict evidentiary precision.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Clinical Data', 'FDA / HIPAA', 'EHR Pipelines', 'Medical Devices', 'Biomedical AI'].map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-md bg-muted/40 border border-border/60 text-[10px] text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Verified Organizations</span>
              <span className="font-medium text-foreground">Epic, Roche, Illumina, Mayo Clinic</span>
            </div>
          </div>

          {/* Domain 5 */}
          <div className="p-5 rounded-2xl border border-border/80 bg-card/60 space-y-3.5 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-border text-foreground font-mono text-[10px]">
                  Sector 04
                </Badge>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  Universal
                </span>
              </div>
              <h3 className="font-bold text-base text-foreground">Industrial Automation &amp; Electrical</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Optimizes credentials for SCADA networks, PLC programming, power grid distribution, and heavy industrial automation across global manufacturing facilities.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['PLC / SCADA', 'IEEE Standards', 'Power Systems', 'Industrial IoT', 'Safety Sil 3'].map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-md bg-muted/40 border border-border/60 text-[10px] text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Verified Manufacturers</span>
              <span className="font-medium text-foreground">Siemens, ABB, Schneider, Rockwell</span>
            </div>
          </div>

          {/* Domain 6 */}
          <div className="p-5 rounded-2xl border border-border/80 bg-card/60 space-y-3.5 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-border text-foreground font-mono text-[10px]">
                  Sector 05
                </Badge>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  Universal
                </span>
              </div>
              <h3 className="font-bold text-base text-foreground">Cybersecurity &amp; Critical Infrastructure</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Structures incident response metrics, penetration test results, SOC 2 compliance milestones, and zero-trust identity architectures for security engineering roles.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Zero-Trust', 'SOC 2 Type II', 'Threat Hunting', 'CISSP', 'Cloud Security'].map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-md bg-muted/40 border border-border/60 text-[10px] text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Verified Leaders</span>
              <span className="font-medium text-foreground">CrowdStrike, Palo Alto, Cloudflare</span>
            </div>
          </div>

          {/* Domain 7 - Sector 06+ (And More...) */}
          <div className="p-5 rounded-2xl border-2 border-dashed border-emerald-500/30 bg-emerald-500/[0.02] space-y-3.5 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-mono text-[10px]">
                  Sector 06+ &bull; And More...
                </Badge>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  Global Matrix
                </span>
              </div>
              <h3 className="font-bold text-base text-foreground">Quantitative Finance, Energy &amp; Global Disciplines</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Extensible ATS calibration for quantitative trading, renewable energy engineering, supply chain logistics, avionics, and specialized technical professions worldwide.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['FinTech / Quant', 'Clean Energy / Wind', 'Supply Chain', 'Avionics', 'Civil Infrastructure'].map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-800 dark:text-emerald-300 font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Universal Coverage</span>
              <span className="font-medium text-foreground">Citadel, Vestas, Lockheed, Maersk Logistics</span>
            </div>
          </div>
        </div>

        {/* Case Study Callout Banner */}
        <div className="mt-8 p-5 sm:p-6 rounded-2xl border border-emerald-500/30 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wide text-emerald-600 dark:text-emerald-400">The Case Study Rationale</span>
              <span className="text-xs text-muted-foreground">&bull; Why Maritime / STCW?</span>
            </div>
            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
              Maritime engineering represents the most stringent international credential auditing standard in the world. If Career Ace can deterministically parse, verify, and tailor STCW marine licenses, physical discharge books, and non-standard CV layouts, it can master any software, cloud, or engineering standard with ease.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => router.push('/signin?callbackUrl=/dashboard')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shrink-0 cursor-pointer h-9 px-4"
          >
            Test Your Credentials
          </Button>
        </div>
      </section>

      {/* ── Sovereign Architecture & Walrus Memory ──────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {/* Free Model Info Badge */}
        <div className="mb-10 flex items-center justify-between p-3.5 rounded-xl bg-card border border-border/80 text-xs">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Powered by Free &amp; Open-Source LLMs (DeepSeek R1 / Qwen 2.5 / Ollama Local)
          </div>
          <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400">Zero Paid API Key Required</Badge>
        </div>

        {/* ── WALRUS DECENTRALIZED CAREER MEMORY & SOVEREIGN ARCHITECTURE ── */}
        <div id="walrus" className="scroll-mt-24">
          <div id="walrus-memory" className="mb-14 scroll-mt-24">
            <Card className="p-8 border border-border/80 shadow-md bg-card/60">
              <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Badge variant="outline" className="px-3 py-0.5 bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                    <Database className="w-3 h-3 mr-1" /> Walrus Memory Core
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Sui zkLogin + AES-256-GCM Encryption
                  </Badge>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Decentralized Career Memory: Sovereign Candidate Architecture
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Your career lineage belongs strictly to you. With Walrus Memory (<code className="font-mono text-xs">@mysten-incubation/memwal</code> + <code className="font-mono text-xs">@mysten/walrus</code>), Career Ace eliminates centralized platform silos, ensuring permanent availability, zero-knowledge privacy, and absolute user isolation.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button variant="outline" size="sm" onClick={() => router.push('/memory')} className="text-xs flex items-center gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 h-9">
                    <Database className="w-3.5 h-3.5" /> Memory Sandbox &amp; Vault
                  </Button>
                  <Button size="sm" onClick={() => router.push('/signin?callbackUrl=/dashboard')} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold gap-1.5 shadow-sm h-9">
                    Get Started <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* 4 Architectural Superpowers - Clean Monochrome Minimalism */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Feature 1 */}
                <div className="p-5 rounded-xl border border-border/70 bg-background/60 flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-muted border border-border/80 flex items-center justify-center mb-3 text-foreground">
                      <Database className="w-4 h-4 text-emerald-500" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1 text-foreground">Decentralized Blob Persistence</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Your CV and match lineage are stored as durable, content-addressed Walrus blobs permanently owned by you, free from centralized corporate paywalls.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t text-[11px] font-mono text-muted-foreground/70">
                    Stack: @mysten/walrus
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="p-5 rounded-xl border border-border/70 bg-background/60 flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-muted border border-border/80 flex items-center justify-center mb-3 text-foreground">
                      <Lock className="w-4 h-4 text-emerald-500" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1 text-foreground">Client-Side Vault Encryption</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Everything is encrypted with client-side AES-256-GCM keys tied to your authenticated Sui address before upload. Nobody can view raw data without your key.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t text-[11px] font-mono text-muted-foreground/70">
                    Stack: AES-256-GCM
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="p-5 rounded-xl border border-border/70 bg-background/60 flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-muted border border-border/80 flex items-center justify-center mb-3 text-foreground">
                      <Fingerprint className="w-4 h-4 text-emerald-500" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1 text-foreground">Deterministic User Uniqueness</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Candidates connect their Google account via Enoki zkLogin, deriving a mathematically unique, non-custodial Sui address with strict namespace isolation.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t text-[11px] font-mono text-muted-foreground/70">
                    Stack: @mysten/enoki zkLogin
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="p-5 rounded-xl border border-border/70 bg-background/60 flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-muted border border-border/80 flex items-center justify-center mb-3 text-foreground">
                      <Cpu className="w-4 h-4 text-emerald-500" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1 text-foreground">Cross-Agent Memory &amp; Provenance</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Autonomous career agents query candidate vector embeddings for skill verification without exposing raw PII, with persistent on-chain memory provenance.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t text-[11px] font-mono text-muted-foreground/70">
                    Stack: @mysten-incubation/memwal
                  </div>
                </div>
              </div>

              {/* Live Sovereignty Status Strip */}
              <div className="mt-8 p-3.5 rounded-xl border border-border/70 bg-muted/30 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Globe className="w-3.5 h-3.5" />
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

        {/* ── CENTRALIZED WALRUS SOVEREIGN MEMORY ARCHITECTURE CHART ── */}
        <WalrusCentralArchitectureChart />

        {/* ── PRODUCT ROADMAP & AUTONOMOUS FRONTIERS ── */}
        <ProjectRoadmapSection />

        {/* ── High-Impact Call to Action Banner ── */}
        <div className="p-8 md:p-10 rounded-2xl border border-border/80 bg-card/70 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                <ShieldCheck className="w-3 h-3 mr-1 text-emerald-500" /> Private Sovereign Cockpit
              </Badge>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Unlock Your Autonomous AI Copilot &amp; Encrypted CV Vault
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Connect to your personal workspace. Upload your CV to extract and edit verified achievements, converse with the autonomous AI career coach, and harvest jobs from 9 live networks with instant fit scoring.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <Button
              size="default"
              onClick={handleOpenWorkspace}
              className="w-full sm:w-auto text-xs font-semibold gap-2 shadow-sm bg-emerald-600 hover:bg-emerald-500 text-white h-10 px-5"
            >
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Chatdeck Footer ─────────────────────────────────────────────────── */}
      <ChatdeckFooter />

      {/* ── Global Header Feedback Modal ─────────────────────────────────────── */}
      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  )
}
