"use client"

import { Badge } from '@/components/ui/badge'
import { HeroVideoDialog } from "@/components/ui/hero_video_dialog"
import { ShimmerButton } from "@/components/ui/shimmer_button"
import { motion, type Variants } from "motion/react"
import { Sparkles, ArrowRight } from 'lucide-react'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
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

const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
}

export function ChatdeckHero({ onStart }: { onStart?: () => void }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="py-12"
    >
      <motion.div className="flex items-center justify-center" variants={fadeUpVariants}>
        <Badge className="h-auto text-sm font-medium px-4 py-2" variant={'outline'}>
          <Sparkles className="w-4 h-4 mr-2 text-primary" /> Autonomous AI Career Copilot by IboTV
        </Badge>
      </motion.div>

      <div className="text-center mt-8">
        <motion.h1
          className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-6xl"
          variants={fadeUpVariants}
        >
          AI Job Agent for Your Career.
        </motion.h1>
        <motion.p
          className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400 max-w-3xl mx-auto"
          variants={fadeUpVariants}
        >
          Universal job search across Remote, Onsite, and Hybrid postings. Evaluates match fit scores (1–10), formats CV bullets, auto-applies with custom cover letters, and persists your history in Walrus Memory.
        </motion.p>
      </div>

      <motion.div
        className="my-8 flex items-center justify-center gap-x-4"
        variants={fadeUpVariants}
      >
        <ShimmerButton onClick={onStart}>
          <span className="flex items-center gap-2">
            Upload CV & Harvest Jobs <ArrowRight className="w-4 h-4" />
          </span>
        </ShimmerButton>
      </motion.div>

      <motion.div className="relative max-w-4xl mx-auto" variants={scaleInVariants}>
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
      </motion.div>
    </motion.div>
  )
}
