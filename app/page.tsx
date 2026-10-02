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
  Sparkles, Database, Lock, Fingerprint, Cpu, Globe, ExternalLink,
  ShieldCheck, ArrowRight, Bot, Paperclip, Search
} from 'lucide-react'

export default function CareerAceLandingPage() {
  const router = useRouter()
  const [sessionAddress, setSessionAddress] = useState<string | null>(null)

  useEffect(() => {
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
  }, [])

  function handleOpenWorkspace() {
    if (sessionAddress) {
      router.push('/dashboard')
    } else {
      router.push('/signin?callbackUrl=/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ── Chatdeck Sticky Header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-card border border-border/70 shadow-sm p-1">
              <img src="/careerace_logo.png" alt="Career Ace Logo" className="w-full h-full object-contain dark:invert" />
            </div>
            <span className="font-bold text-lg">Career Ace</span>
            <Badge variant="outline" className="text-xs hidden sm:inline-flex">by IboTV</Badge>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground font-medium">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#walrus-memory" className="hover:text-foreground transition-colors">Walrus Architecture</a>
            <button
              type="button"
              onClick={handleOpenWorkspace}
              className="hover:text-foreground transition-colors font-medium text-left"
            >
              Workspace
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button size="sm" variant="outline" onClick={() => router.push('/application_board')}>
              Applications
            </Button>
            {sessionAddress ? (
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => router.push('/dashboard')} className="text-xs font-semibold gap-1.5">
                  Open Dashboard <ArrowRight className="w-3.5 h-3.5" />
                </Button>
                <AccountChip address={sessionAddress} />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => router.push('/signin?mode=signin&callbackUrl=/dashboard')}
                  className="text-xs font-semibold"
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  onClick={() => router.push('/signin?mode=signup&callbackUrl=/dashboard')}
                  className="flex items-center gap-1.5 text-xs font-semibold"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M21.6 12.23c0-.72-.06-1.4-.19-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.89-1.74 2.99-4.3 2.99-7.36Z" />
                    <path d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.23-2.5c-.9.6-2.04.96-3.39.96-2.6 0-4.8-1.76-5.6-4.12H3.07v2.58A10 10 0 0 0 12 22Z" opacity="0.72" />
                    <path d="M6.4 13.93a6 6 0 0 1 0-3.83V7.52H3.07a10 10 0 0 0 0 8.98l3.33-2.57Z" opacity="0.5" />
                    <path d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.86-2.86C16.95 2.98 14.7 2 12 2a10 10 0 0 0-8.93 5.52L6.4 10.1C7.2 7.74 9.4 5.98 12 5.98Z" opacity="0.86" />
                  </svg>
                  Sign Up
                </Button>
              </div>
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

      {/* ── Chatdeck Hero Block ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4">
        <ChatdeckHero onStart={handleOpenWorkspace} />
      </div>

      {/* ── Chatdeck Features Section ────────────────────────────────────────── */}
      <div id="features">
        <ChatdeckFeatures />
      </div>

      {/* ── Sovereign Architecture & Workspace Invitation ───────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {/* Free Model Info Badge */}
        <div className="mb-12 flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="w-4 h-4 text-primary" /> Powered by Free &amp; Open-Source LLMs (DeepSeek R1 / Qwen 2.5 / Ollama Local)
          </div>
          <Badge variant="secondary">Zero Paid API Key Required</Badge>
        </div>

        {/* ── WALRUS DECENTRALIZED CAREER MEMORY & SOVEREIGN ARCHITECTURE ── */}
        <div id="walrus-memory" className="mb-16 scroll-mt-24">
          <Card className="p-8 border-2 shadow-lg bg-card/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="px-3 py-1 bg-primary/10 border-primary/30 text-primary text-xs font-semibold">
                    <Database className="w-3.5 h-3.5 mr-1" /> Walrus Memory Core
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Sui zkLogin + SEAL Cryptography
                  </Badge>
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight">
                  Decentralized Career Memory: Sovereign Candidate Architecture
                </h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-3xl leading-relaxed">
                  Your career lineage belongs strictly to you. With Walrus Memory (<code className="font-mono text-xs">@mysten-incubation/memwal</code> + <code className="font-mono text-xs">@mysten/walrus</code>), Career Ace eliminates centralized platform silos, ensuring permanent availability, zero-knowledge privacy, and absolute user isolation.
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2.5">
                {sessionAddress ? (
                  <Button variant="outline" size="sm" onClick={() => router.push('/application_board')} className="text-xs flex items-center gap-2">
                    <ExternalLink className="w-3.5 h-3.5" /> View Career Vault Blobs
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => router.push('/signin?callbackUrl=/dashboard')} className="text-xs flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M21.6 12.23c0-.72-.06-1.4-.19-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.89-1.74 2.99-4.3 2.99-7.36Z" />
                      <path d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.23-2.5c-.9.6-2.04.96-3.39.96-2.6 0-4.8-1.76-5.6-4.12H3.07v2.58A10 10 0 0 0 12 22Z" opacity="0.72" />
                      <path d="M6.4 13.93a6 6 0 0 1 0-3.83V7.52H3.07a10 10 0 0 0 0 8.98l3.33-2.57Z" opacity="0.5" />
                      <path d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.86-2.86C16.95 2.98 14.7 2 12 2a10 10 0 0 0-8.93 5.52L6.4 10.1C7.2 7.74 9.4 5.98 12 5.98Z" opacity="0.86" />
                    </svg>
                    Connect with Google (zkLogin)
                  </Button>
                )}
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
                  <h3 className="font-bold text-base mb-1.5">Threshold Privacy with SEAL</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Resumes contain private contact details, salaries, and sensitive achievements. Everything is client-side encrypted via Mysten SEAL threshold cryptography on Sui before upload. Nobody can view raw data without your key.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t text-[11px] font-mono text-muted-foreground">
                  Stack: @mysten/seal
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
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-foreground">Sovereign Candidate Network Status:</span>
                  <p className="text-xs text-muted-foreground">
                    Connected to Walrus Mainnet Aggregator &amp; Mysten SEAL Decryption Committees on Sui.
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

        {/* ── High-Impact Call to Action Banner ── */}
        <div className="p-8 md:p-12 rounded-2xl border-2 bg-card/60 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-primary" /> Private Sovereign Cockpit
              </Badge>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Unlock Your AI Copilot, Encrypted CV Vault &amp; Universal Job Harvester
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sign in with Google zkLogin to enter your personal workspace. Upload your CV to extract and edit verified achievements, converse with the autonomous AI career coach, and harvest jobs from 9 live networks with instant fit scoring.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <Button
              size="lg"
              onClick={handleOpenWorkspace}
              className="w-full sm:w-auto text-sm font-semibold gap-2 shadow-lg"
            >
              {sessionAddress ? 'Open Workspace Dashboard' : 'Sign In with Google'} <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Chatdeck Footer ─────────────────────────────────────────────────── */}
      <ChatdeckFooter />
    </div>
  )
}
