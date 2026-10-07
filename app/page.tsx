'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
  ShieldCheck, ArrowRight, ExternalLink, Globe, MessageSquare
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
      {/* ── Ambient Radial Glow Top Lighting ── */}
      <div className="absolute top-0 left-0 right-0 h-[700px] pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {/* Luminous emerald glow radial gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12),rgba(5,150,105,0.03),transparent_70%)] blur-2xl pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-emerald-500/10 rounded-full blur-[110px] pointer-events-none" />
      </div>

      {/* ── Clean Sticky Header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 whitespace-nowrap">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center bg-card border border-border/70 shadow-sm p-1 shrink-0">
              <img src="/careerace_logo.png" alt="Career Ace Logo" className="w-full h-full object-contain dark:invert" />
            </div>
            <span className="font-bold text-base sm:text-lg whitespace-nowrap">Career Ace</span>
          </div>

          <nav className="hidden md:flex items-center gap-5 text-sm text-muted-foreground font-medium">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#architecture" className="hover:text-foreground transition-colors">Architecture</a>
            <a href="#roadmap" className="hover:text-foreground transition-colors">Roadmap</a>
            <a href="/pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
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
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <Button size="sm" onClick={() => router.push('/dashboard')} className="hidden sm:inline-flex bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold gap-1.5 shadow-sm">
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
      <div id="features" className="pt-6 sm:pt-14 mt-4 sm:mt-8">
        <ChatdeckFeatures />
      </div>

      {/* ── Sovereign Architecture & Systems ──────────────────────────── */}
      <section id="architecture" className="max-w-7xl mx-auto px-4 py-12 scroll-mt-20">

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
