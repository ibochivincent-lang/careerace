"use client"

import { cn } from "@/lib/utils"
import {
  BookOpen,
  Clock,
  MessageCircle,
  Puzzle,
  Users,
  Zap,
} from "lucide-react"
import { motion } from "motion/react"

export function ChatdeckFeatures() {
  const features = [
    {
      title: "Trained On Your Candidate Vault",
      description:
        "Career Ace extracts skills, work experience, and academic history from your uploaded CV, persisting encrypted entries on Walrus Memory.",
      icon: <BookOpen className="w-6 h-6" />,
    },
    {
      title: "Continuous 24/7 Job Harvester",
      description:
        "Scrapes Remote, Onsite, and Hybrid postings across global and regional job boards, deduplicating and filtering stale listings.",
      icon: <Clock className="w-6 h-6" />,
    },
    {
      title: "Candidate Fit Match Scoring",
      description:
        "Evaluates job description requirements against candidate experience, assigning a 1 to 10 fit score before applying.",
      icon: <MessageCircle className="w-6 h-6" />,
    },
    {
      title: "Automated CV & Cover Letter Tailoring",
      description:
        "Formats and aligns CV bullets to job requirements without inventing fake metrics, and drafts evidence-grounded cover letters.",
      icon: <Zap className="w-6 h-6" />,
    },
    {
      title: "Dual-Track Application Dispatch",
      description:
        "Auto-submits high match direct applications (Track A) while placing complex ATS portals in your Manual Review Queue (Track B).",
      icon: <Puzzle className="w-6 h-6" />,
    },
    {
      title: "Post-Application Interview Coaching",
      description:
        "Simulates role-specific technical and behavioral mock interviews with structured STAR+R feedback once applications are sent.",
      icon: <Users className="w-6 h-6" />,
    },
  ]

  return (
    <div id="features" className="max-w-7xl mx-auto py-16 px-4">
      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-neutral-800 dark:text-neutral-100">
          Why Choose Career Ace?
        </h2>
        <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto">
          Experience autonomous job application assistance powered by decentralized memory and AI that matches your real work history.
        </p>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 relative z-10">
        {features.map((feature, index) => (
          <Feature key={feature.title} {...feature} index={index} />
        ))}
      </div>
    </div>
  )
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string
  description: string
  icon: React.ReactNode
  index: number
}) => {
  return (
    <motion.div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature dark:border-neutral-800 border-neutral-200",
        (index === 0 || index === 3) && "lg:border-l dark:border-neutral-800 border-neutral-200",
        index < 3 && "lg:border-b dark:border-neutral-800 border-neutral-200"
      )}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        duration: 0.5,
        delay: index * 0.15,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {index < 3 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
      )}
      {index >= 3 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-neutral-600 dark:text-neutral-400 group-hover/feature:text-primary transition duration-200">
        {icon}
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-r-full bg-neutral-300 dark:bg-neutral-700 group-hover/feature:bg-primary transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-neutral-800 dark:text-neutral-100">
          {title}
        </span>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-xs relative z-10 px-10">
        {description}
      </p>
    </motion.div>
  )
}
