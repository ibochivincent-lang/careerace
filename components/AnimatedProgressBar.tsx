'use client'

import React from 'react'
import { motion } from 'motion/react'

interface AnimatedProgressBarProps {
  label: string
  value: number
  colorClass?: string
  delay?: number
}

export function AnimatedProgressBar({
  label,
  value,
  colorClass = 'bg-emerald-500',
  delay = 0
}: AnimatedProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value || 0))

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-foreground">{label}</span>
        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
          {clampedValue}%
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay }}
          className={`h-full rounded-full ${colorClass}`}
        />
      </div>
    </div>
  )
}
