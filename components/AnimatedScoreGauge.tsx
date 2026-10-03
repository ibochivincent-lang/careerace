'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'

interface AnimatedScoreGaugeProps {
  score: number // 0 to 100
  size?: number // default 100
  strokeWidth?: number // default 8
  className?: string
}

export function AnimatedScoreGauge({
  score,
  size = 100,
  strokeWidth = 8,
  className = ''
}: AnimatedScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0)

  // Circle geometry
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clampedScore = Math.max(0, Math.min(100, score || 0))
  const targetOffset = circumference - (clampedScore / 100) * circumference

  useEffect(() => {
    let start = 0
    const duration = 1200
    const startTime = performance.now()

    function step(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentVal = Math.round(easeOut * clampedScore)
      setDisplayScore(currentVal)

      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        setDisplayScore(clampedScore)
      }
    }

    requestAnimationFrame(step)
  }, [clampedScore])

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Subtle radial emerald background glow */}
      <div className="absolute inset-2 rounded-full bg-emerald-500/10 blur-sm pointer-events-none" />

      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/40 dark:text-muted/30"
        />

        {/* Animated Progress Track */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#emeraldGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: targetOffset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          strokeLinecap="round"
        />

        {/* Gradient Definition */}
        <defs>
          <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center Score Text */}
      <div className="absolute flex flex-col items-center justify-center leading-none select-none">
        <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          {displayScore}
        </span>
        <span className="text-xs text-muted-foreground font-mono mt-0.5">
          / 100
        </span>
      </div>
    </div>
  )
}
