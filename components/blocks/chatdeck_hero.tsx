"use client"

import { useState, useEffect } from 'react'
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
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
}

const CATCHY_PROMPTS = [
  "Are you not tired of always filling out applications late?",
  "Are you not tired of rewriting CVs with zero memory?",
  "Are you not tired of missing top job opportunities late?",
  "Are you not tired of losing your tailored cover letters?",
]

export function ChatdeckHero({ onStart }: { onStart?: () => void }) {
  const [promptIndex, setPromptIndex] = useState(0)
  const [typedText, setTypedText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const currentPrompt = CATCHY_PROMPTS[promptIndex]
    let timeout: NodeJS.Timeout

    if (!isDeleting && typedText === currentPrompt) {
      // Pause after typing full sentence
      timeout = setTimeout(() => setIsDeleting(true), 2400)
    } else if (isDeleting && typedText === '') {
      // Switch to next prompt after deleting
      setIsDeleting(false)
      setPromptIndex((prev) => (prev + 1) % CATCHY_PROMPTS.length)
      timeout = setTimeout(() => {}, 300)
    } else {
      // Typing or deleting characters
      const speed = isDeleting ? 24 : 42
      timeout = setTimeout(() => {
        setTypedText(
          isDeleting
            ? currentPrompt.slice(0, typedText.length - 1)
            : currentPrompt.slice(0, typedText.length + 1)
        )
      }, speed)
    }

    return () => clearTimeout(timeout)
  }, [typedText, isDeleting, promptIndex])

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="py-10 md:py-16 space-y-10 relative"
    >
      {/* ── Ambient Radial Glow Background ── */}
      <div
        className="absolute inset-0 -top-20 pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.14),rgba(5,150,105,0.04),transparent_70%)] blur-[100px] pointer-events-none" />
      </div>

      <div className="relative z-10 space-y-7">
        {/* ── Top Pill Badge ── */}
        <motion.div className="flex items-center justify-center" variants={fadeUpVariants}>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shadow-xs backdrop-blur border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Autonomous AI Career Agent · Powered by Walrus Sovereign Memory</span>
          </div>
        </motion.div>

        {/* ── Catchy Animated Typewriter Eyebrow ── */}
        <motion.div className="flex items-center justify-center min-h-[40px]" variants={fadeUpVariants}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-card/80 border border-emerald-500/30 text-foreground text-xs sm:text-sm md:text-base font-semibold shadow-sm backdrop-blur max-w-2xl text-center">
            <span className="text-emerald-500 text-sm">💬</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">
              "{typedText}"
            </span>
            <span className="inline-block w-0.5 h-4 sm:h-5 bg-emerald-500 animate-pulse ml-0.5" />
          </div>
        </motion.div>

        {/* ── Hero Headline & Value Prop ── */}
        <div className="text-center max-w-3xl mx-auto space-y-3.5">
          <motion.h1
            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]"
            variants={fadeUpVariants}
          >
            Never apply late again. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 bg-clip-text text-transparent">
              The Autonomous AI Agent for your career.
            </span>
          </motion.h1>

          <motion.p
            className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed"
            variants={fadeUpVariants}
          >
            CareerAce remembers your milestones in sovereign Walrus memory, sharpens your CV for ATS with the Google XYZ formula, and dispatches tailored applications before deadlines close.
          </motion.p>

          {/* ── Action Buttons ── */}
          <motion.div
            className="pt-2 flex flex-wrap items-center justify-center gap-3"
            variants={fadeUpVariants}
          >
            <Button
              size="default"
              onClick={onStart}
              className="h-10 px-6 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition-all text-xs sm:text-sm gap-2 cursor-pointer"
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
              className="h-10 px-5 rounded-xl font-semibold border-emerald-500/30 hover:bg-emerald-500/10 text-foreground text-xs sm:text-sm cursor-pointer"
            >
              How it works
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
