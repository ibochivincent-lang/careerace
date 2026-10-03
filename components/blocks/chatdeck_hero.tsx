"use client"

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HeroVideoDialog } from "@/components/ui/hero_video_dialog"
import { motion, type Variants } from "motion/react"
import {
  Sparkles,
  ArrowRight,
  Check,
  X,
  MessageSquare,
  FileText,
  Briefcase,
  Layers,
  Database,
  ShieldCheck,
  Zap,
  Play
} from 'lucide-react'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
}

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
}

export function ChatdeckHero({ onStart }: { onStart?: () => void }) {
  const [acceptedEdits, setAcceptedEdits] = useState<Record<number, boolean>>({ 1: true, 2: true })

  const activeRevisionsCount = Object.values(acceptedEdits).filter(Boolean).length

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="py-12 md:py-16 space-y-12 relative"
    >
      {/* ── Polish-Inspired Emerald Crystal Background ── */}
      <div
        className="absolute inset-0 -top-20 pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 bg-cover bg-top bg-no-repeat opacity-95 dark:opacity-45 transition-opacity duration-700"
          style={{
            backgroundImage: "url('/hero-bg-green.webp')",
            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 70%, rgba(0,0,0,0) 98%)",
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 70%, rgba(0,0,0,0) 98%)"
          }}
        />
        {/* Luminous emerald glow radial gradient */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.18),rgba(5,150,105,0.06),transparent_70%)] blur-[100px] pointer-events-none" />
      </div>

      <div className="relative z-10 space-y-8">
        {/* ── Top Pill Badge ── */}
        <motion.div className="flex items-center justify-center" variants={fadeUpVariants}>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shadow-xs backdrop-blur">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Autonomous AI Career Agent · Powered by Walrus Sovereign Memory</span>
          </div>
        </motion.div>

        {/* ── Hero Headline & Value Prop ── */}
        <div className="text-center max-w-3xl mx-auto space-y-3.5">
          <motion.h1
            className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]"
            variants={fadeUpVariants}
          >
            The Autonomous AI Agent <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 bg-clip-text text-transparent">
              for your career.
            </span>
          </motion.h1>

          <motion.p
            className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed"
            variants={fadeUpVariants}
          >
            Upload your resume, sharpen it for ATS with Google XYZ formula, remember your entire journey across sessions with Walrus Memory, and explore fresh jobs curated to you.
          </motion.p>

          {/* ── Action Buttons ── */}
          <motion.div
            className="pt-2 flex flex-wrap items-center justify-center gap-3"
            variants={fadeUpVariants}
          >
            <Button
              size="default"
              onClick={onStart}
              className="h-10 px-6 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition-all text-xs sm:text-sm gap-2"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Button>

            <Button
              size="default"
              variant="outline"
              onClick={() => {
                const el = document.getElementById('how-it-works')
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="h-10 px-5 rounded-xl font-semibold border-emerald-500/30 hover:bg-emerald-500/10 text-foreground text-xs sm:text-sm"
            >
              How it works
            </Button>
          </motion.div>
        </div>
      </div>

      {/* ── Spot for the Video Demo ── */}
      <motion.div className="relative max-w-4xl mx-auto pt-4" variants={fadeUpVariants}>
        <div className="p-2 sm:p-3 rounded-2xl border-2 border-emerald-500/20 bg-card/60 backdrop-blur shadow-2xl shadow-emerald-500/5">
          <HeroVideoDialog
            className="block dark:hidden"
            animationStyle="top-in-bottom-out"
            videoSrc="https://www.youtube.com/embed/qh3NGpYRG3I?si=4rb-zSdDkVK9qxxb"
            thumbnailSrc="https://startup-template-sage.vercel.app/hero-light.png"
            thumbnailAlt="Career Ace Interactive Demo Video"
          />
          <HeroVideoDialog
            className="hidden dark:block"
            animationStyle="top-in-bottom-out"
            videoSrc="https://www.youtube.com/embed/qh3NGpYRG3I?si=4rb-zSdDkVK9qxxb"
            thumbnailSrc="https://startup-template-sage.vercel.app/hero-dark.png"
            thumbnailAlt="Career Ace Interactive Demo Video"
          />
        </div>
      </motion.div>

      {/* ── Clean Interactive Mockup: Resume Diff + Copilot Chat ── */}
      <motion.div className="max-w-6xl mx-auto pt-6" variants={fadeUpVariants}>
        <div className="rounded-2xl border border-emerald-500/25 bg-card shadow-2xl overflow-hidden">
          {/* Mockup Window Header */}
          <div className="px-4 py-3 border-b border-border/80 bg-muted/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-3 text-xs font-mono text-muted-foreground">careerace.online/dashboard</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 text-xs">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Sovereign Vault Sealed
              </Badge>
            </div>
          </div>

          {/* 3-Column Cockpit Mockup */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
            {/* Left Mini Sidebar */}
            <div className="hidden md:flex lg:col-span-3 flex-col border-r border-border/70 p-3 bg-muted/20 space-y-4">
              <div className="flex items-center gap-2 px-2 py-1">
                <div className="w-7 h-7 rounded-md bg-emerald-600/10 border border-emerald-500/30 flex items-center justify-center p-1">
                  <img src="/careerace_logo.png" alt="Career Ace" className="w-full h-full object-contain dark:invert" />
                </div>
                <span className="font-bold text-sm">Career Ace</span>
                <Badge variant="secondary" className="ml-auto text-xs text-emerald-600 bg-emerald-500/10">PREMIUM</Badge>
              </div>

              <div className="space-y-1 text-xs">
                <div className="px-2.5 py-1.5 rounded-lg text-muted-foreground flex items-center gap-2 hover:bg-muted/60">
                  <Layers className="w-4 h-4" /> Overview
                </div>
                <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Resumes
                </div>
                <div className="px-2.5 py-1.5 rounded-lg text-muted-foreground flex items-center gap-2 hover:bg-muted/60">
                  <Sparkles className="w-4 h-4" /> Tailor
                </div>
                <div className="px-2.5 py-1.5 rounded-lg text-muted-foreground flex items-center gap-2 hover:bg-muted/60">
                  <Briefcase className="w-4 h-4" /> Job Board
                </div>
              </div>

              <div className="pt-2 border-t border-border/50 text-xs space-y-1">
                <span className="px-2 uppercase font-bold text-muted-foreground text-xs">PROFILES</span>
                <div className="px-2 py-1 rounded text-muted-foreground flex items-center justify-between">
                  <span>GitHub</span>
                  <span className="text-xs text-emerald-500 font-mono">Connected</span>
                </div>
                <div className="px-2 py-1 rounded text-muted-foreground flex items-center justify-between">
                  <span>LinkedIn</span>
                  <span className="text-xs text-emerald-500 font-mono">Synced</span>
                </div>
              </div>
            </div>

            {/* Middle Resume Diff Canvas */}
            <div className="lg:col-span-6 p-4 sm:p-6 bg-card flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <h3 className="text-xl font-bold text-foreground">Ryan Park</h3>
                  <p className="text-xs text-muted-foreground">
                    ryan@park.dev · +1 (415) 482-3910 · Austin, TX · GitHub · LinkedIn
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <span>EXPERIENCE</span>
                    <span className="text-xs text-emerald-500 font-mono font-semibold">ATS Grade A+ (94%)</span>
                  </div>

                  {/* Experience Block */}
                  <div className="p-4 rounded-xl border border-border/70 bg-background/50 space-y-3 text-xs">
                    <div className="flex items-center justify-between font-semibold text-sm">
                      <span className="text-foreground">Software Engineer II · Stripe</span>
                      <span className="text-muted-foreground font-mono text-xs">Jan 2024 · Present</span>
                    </div>

                    {/* Diff Item 1 */}
                    <div className="space-y-2 pt-1">
                      <div className="p-2.5 rounded-lg bg-red-500/10 text-red-700 dark:text-red-400 line-through text-xs leading-relaxed border border-red-500/10">
                        Designed and shipped distributed infrastructure improvements to Stripe's internal developer platform, reducing build times.
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs leading-relaxed border border-emerald-500/20 font-medium">
                        Designed and shipped distributed data pipeline infrastructure improvements to Stripe's internal developer tooling platform, reducing median batch processing times by ~40% across 10,000+ daily active engineers.
                      </div>
                      <div className="flex items-center gap-2 pt-0.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setAcceptedEdits(prev => ({ ...prev, 1: true }))}
                          className="h-7 px-2.5 text-xs font-semibold text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setAcceptedEdits(prev => ({ ...prev, 1: false }))}
                          className="h-7 px-2.5 text-xs text-red-600 hover:bg-red-500/10"
                        >
                          <X className="w-3.5 h-3.5 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>

                    {/* Diff Item 2 */}
                    <div className="space-y-2 pt-2 border-t border-border/50">
                      <div className="p-2.5 rounded-lg bg-red-500/10 text-red-700 dark:text-red-400 line-through text-xs leading-relaxed border border-red-500/10">
                        Led a cross-functional initiative to migrate a legacy monorepo CI pipeline to a parallelized architecture.
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs leading-relaxed border border-emerald-500/20 font-medium">
                        Led a cross-functional initiative to migrate a legacy monorepo CI pipeline to a parallelized, cache-aware orchestration architecture, cutting p99 data pipeline latency from 18 min to under 7 min.
                      </div>
                      <div className="flex items-center gap-2 pt-0.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setAcceptedEdits(prev => ({ ...prev, 2: true }))}
                          className="h-7 px-2.5 text-xs font-semibold text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setAcceptedEdits(prev => ({ ...prev, 2: false }))}
                          className="h-7 px-2.5 text-xs text-red-600 hover:bg-red-500/10"
                        >
                          <X className="w-3.5 h-3.5 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Bottom Toolbar */}
              <div className="mt-4 p-2.5 rounded-xl bg-muted/70 border border-border/70 flex items-center justify-between text-xs">
                <span className="font-mono text-muted-foreground text-xs">{activeRevisionsCount} of 2 revisions active</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAcceptedEdits({ 1: false, 2: false })}
                    className="h-7 text-xs"
                  >
                    Undo all
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setAcceptedEdits({ 1: true, 2: true })}
                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                  >
                    Keep all edits
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Career Ace AI Agent Chat */}
            <div className="lg:col-span-3 border-t lg:border-t-0 lg:border-l border-border/70 p-4 bg-muted/10 flex flex-col justify-between space-y-3">
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block text-foreground">Career Ace AI</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Walrus Memory Active
                    </span>
                  </div>
                </div>

                {/* Assistant Chat Bubble */}
                <div className="p-3.5 rounded-xl bg-background border border-border/80 text-xs space-y-2 shadow-sm">
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400">Hi Candidate</p>
                  <p className="text-muted-foreground leading-relaxed text-xs">
                    I'm Career Ace, your autonomous career agent. Your resume scored <strong className="text-foreground">85/100</strong> for ATS with high-impact wins ahead.
                  </p>
                  <p className="text-muted-foreground leading-relaxed text-xs">
                    I found 4 high-impact fixes focused on measurable metrics and Google XYZ formula for your target role.
                  </p>
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                    ↑ 4 quantified edits applied
                  </div>
                </div>

                {/* Target Job Pill */}
                <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground block">Tailoring for:</span>
                  <span>Senior Infrastructure Engineer · Stripe</span>
                </div>
              </div>

              {/* Quick Prompt Suggestion Chips */}
              <div className="space-y-1.5 pt-2">
                <button
                  type="button"
                  className="w-full text-left p-2 rounded-lg border bg-background/60 hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-between"
                >
                  <span>Add data volume metrics</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
                </button>
                <button
                  type="button"
                  className="w-full text-left p-2 rounded-lg border bg-background/60 hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-between"
                >
                  <span>Highlight distributed systems</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
