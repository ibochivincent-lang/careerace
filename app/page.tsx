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
  ShieldCheck, ArrowRight
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

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground font-medium">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#walrus" className="hover:text-foreground transition-colors">Walrus</a>
            <a href="#walrus-memory" className="hover:text-foreground transition-colors">Walrus Memory</a>
            <a href="/pricing" className="hover:text-foreground transition-colors">Pricing</a>
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
    </div>
  )
}
