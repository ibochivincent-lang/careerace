'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Zap, Clock } from 'lucide-react'
import { cn } from './ui/utils'

interface BannerData {
  type: 'critical' | 'warning' | 'steady' | 'early'
  icon: React.ReactNode
  message: string
  sub: string
  color: string
}

function getBannerData(days: number | null, sessionCount: number): BannerData | null {
  if (days === null) return null

  if (days <= 0) return null

  if (days <= 7) {
    return {
      type: 'critical',
      icon: <Zap className="w-4 h-4" />,
      message: `${days} day${days === 1 ? '' : 's'} to your exam — final push mode.`,
      sub: 'Focus only on priority topics and past paper questions today.',
      color: 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200',
    }
  }

  if (days <= 14) {
    return {
      type: 'warning',
      icon: <Clock className="w-4 h-4" />,
      message: `${days} days to go — critical revision window.`,
      sub: 'Aim for 2–3 sessions daily. Weak topics first, then reinforcement.',
      color: 'border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-200',
    }
  }

  if (days <= 30) {
    return {
      type: 'steady',
      icon: <Calendar className="w-4 h-4" />,
      message: `${days} days remaining — build your momentum now.`,
      sub: sessionCount < 5 ? 'You\'re just getting started — consistency is key this week.' : 'Keep your daily streak going. Every session builds your edge.',
      color: 'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-200',
    }
  }

  return null
}

export function SmartScheduleBanner({ sessionCount }: { sessionCount: number }) {
  const [days, setDays] = useState<number | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const dateStr = localStorage.getItem('examace_exam_date')
    if (dateStr) {
      const examDate = new Date(dateStr)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      examDate.setHours(0, 0, 0, 0)
      const diff = Math.ceil((examDate.getTime() - today.getTime()) / 86_400_000)
      setDays(diff)
    }

    const key = `examace_banner_dismissed_${new Date().toISOString().split('T')[0]}`
    setDismissed(localStorage.getItem(key) === 'true')
  }, [])

  const banner = getBannerData(days, sessionCount)
  if (!banner || dismissed) return null

  const dismiss = () => {
    const key = `examace_banner_dismissed_${new Date().toISOString().split('T')[0]}`
    localStorage.setItem(key, 'true')
    setDismissed(true)
  }

  return (
    <div className={cn(
      'flex items-start gap-3 p-3.5 rounded-xl border text-sm animate-slide-down',
      banner.color
    )}>
      <span className="mt-0.5 flex-shrink-0">{banner.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold leading-snug">{banner.message}</p>
        <p className="text-xs opacity-80 mt-0.5 leading-snug">{banner.sub}</p>
      </div>
      <button
        onClick={dismiss}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity mt-0.5"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
