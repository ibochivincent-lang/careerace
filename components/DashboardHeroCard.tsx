'use client'

import { useState, useEffect } from 'react'
import { Card } from './ui/card'
import { Progress } from './ui/progress'
import { StreakCounter } from './StreakCounter'
import { ExamCountdownHero } from './ExamCountdown'
import { Button } from './ui/button'
import { PlayCircle } from 'lucide-react'
import { cn } from './ui/utils'

interface DashboardHeroCardProps {
  calibration: number
  sessionCount: number
  onStartSession: () => void
  className?: string
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getMotivation(calibration: number, sessionCount: number): string {
  if (sessionCount === 0) return 'Your journey to exam success starts now.'
  if (calibration >= 0.8) return 'Excellent calibration. Keep pushing — the exam is yours.'
  if (calibration >= 0.6) return 'You\'re building strong foundations. Stay consistent.'
  if (calibration >= 0.4) return 'Great progress. Each session makes you sharper.'
  return 'Every session counts. You\'re getting there.'
}

export function DashboardHeroCard({
  calibration,
  sessionCount,
  onStartSession,
  className,
}: DashboardHeroCardProps) {
  const [name, setName] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('examace_user_name')
    if (stored) setName(stored)
  }, [])

  const greeting = getGreeting()
  const motivation = getMotivation(calibration, sessionCount)
  const calPercent = Math.round(calibration * 100)

  // Current date
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-NG', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Card className={cn('overflow-hidden border-0 shadow-sm', className)}>
      <div className="bg-primary p-6 text-white">
        {/* Top row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-white/70 text-sm">{dateStr}</p>
            <h2 className="text-xl font-bold mt-0.5">
              {greeting}{name ? `, ${name}` : ''}!
            </h2>
            <p className="text-white/80 text-sm mt-1 leading-snug max-w-xs">
              {motivation}
            </p>
          </div>

          {/* CTA */}
          <Button
            onClick={onStartSession}
            className="bg-white text-primary hover:bg-white/90 font-semibold flex-shrink-0 shadow-sm"
            size="sm"
          >
            <PlayCircle className="w-4 h-4" />
            Study now
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/20">
          {/* Streak */}
          <div className="text-center">
            <StreakCounter size="md" className="text-white [&_span]:text-white [&_.text-muted-foreground]:text-white [&_.text-reward-600]:text-white" />
          </div>

          {/* Exam countdown */}
          <div className="text-center">
            <ExamCountdownHero className="[&_p]:text-white [&_.text-muted-foreground]:text-white [&_.text-3xl]:text-white" />
          </div>

          {/* Sessions */}
          <div className="text-center">
            <p className="text-3xl font-bold text-white">{sessionCount}</p>
            <p className="text-xs text-white mt-0.5">sessions</p>
          </div>
        </div>
      </div>

      {/* Calibration bar — below gradient */}
      <div className="px-6 py-4 bg-card">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium">Confidence Calibration</span>
          <span className="font-bold text-primary">{calPercent}%</span>
        </div>
        <Progress value={calPercent} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1.5">
          How well your confidence matches your actual performance
        </p>
      </div>
    </Card>
  )
}
