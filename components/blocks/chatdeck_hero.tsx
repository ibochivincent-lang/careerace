"use client"

import { Button } from '@/components/ui/button'
import { motion, type Variants } from "motion/react"
import {
  Sparkles,
  ArrowRight
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="py-12 md:py-16 space-y-12 relative"
    >
      {/* ── Ambient Radial Glow Background ── */}
      <div
        className="absolute inset-0 -top-20 pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* Luminous emerald glow radial gradient */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.14),rgba(5,150,105,0.04),transparent_70%)] blur-[100px] pointer-events-none" />
      </div>

      <div className="relative z-10 space-y-8">
        {/* ── Top Pill Badge (borderless) ── */}
        <motion.div className="flex items-center justify-center" variants={fadeUpVariants}>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shadow-xs backdrop-blur">
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
    </motion.div>
  )
}
