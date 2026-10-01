'use client'

import { useState, useEffect } from 'react'
import { CalendarDays, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from './ui/utils'

interface ExamCountdownProps {
  examName?: string
  className?: string
}

function getDaysLeft(dateStr: string | null): number | null {
  if (!dateStr) return null
  const exam = new Date(dateStr)
  const now = new Date()
  const diff = Math.ceil((exam.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

function getUrgencyStyle(days: number | null) {
  if (days === null) return { color: 'text-muted-foreground', bg: 'bg-muted', label: 'No exam set' }
  if (days < 0)   return { color: 'text-muted-foreground', bg: 'bg-muted',        label: 'Exam passed' }
  if (days <= 14) return { color: 'text-red-600 dark:text-red-400',          bg: 'bg-red-50 dark:bg-red-950/40',       label: 'Critical zone!' }
  if (days <= 30) return { color: 'text-orange-600 dark:text-orange-400',    bg: 'bg-orange-50 dark:bg-orange-950/40', label: 'Final stretch' }
  if (days <= 60) return { color: 'text-reward-600 dark:text-reward-400',    bg: 'bg-reward-50 dark:bg-reward-500/10', label: 'Building momentum' }
  return           { color: 'text-primary',                 bg: 'bg-brand-50 dark:bg-brand-500/10',   label: 'On track' }
}

export function ExamCountdown({ examName, className }: ExamCountdownProps) {
  const [daysLeft, setDaysLeft] = useState<number | null>(null)
  const [storedExam, setStoredExam] = useState<string>('')

  useEffect(() => {
    const date = localStorage.getItem('examace_exam_date')
    const name = localStorage.getItem('examace_exam_name') || 'JAMB'
    setStoredExam(name)
    setDaysLeft(getDaysLeft(date))
  }, [])

  const urgency = getUrgencyStyle(daysLeft)
  const displayName = examName || storedExam || 'JAMB'

  if (daysLeft === null) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
        <CalendarDays className="w-4 h-4" />
        <span>Set your exam date</span>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium', urgency.bg, urgency.color, className)}>
      {daysLeft <= 14 ? (
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      ) : daysLeft < 0 ? (
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
      ) : (
        <CalendarDays className="w-4 h-4 flex-shrink-0" />
      )}
      <span>
        {daysLeft < 0
          ? `${displayName} passed`
          : daysLeft === 0
          ? `${displayName} is TODAY`
          : `${daysLeft}d to ${displayName}`}
      </span>
    </div>
  )
}

// Larger variant for hero card
export function ExamCountdownHero({ className }: { className?: string }) {
  const [daysLeft, setDaysLeft] = useState<number | null>(null)
  const [examName, setExamName] = useState('JAMB')

  useEffect(() => {
    const date = localStorage.getItem('examace_exam_date')
    const name = localStorage.getItem('examace_exam_name') || 'JAMB'
    setExamName(name)
    setDaysLeft(getDaysLeft(date))
  }, [])

  const urgency = getUrgencyStyle(daysLeft)

  if (daysLeft === null) {
    return (
      <div className={cn('text-center', className)}>
        <p className="text-2xl font-bold text-muted-foreground">—</p>
        <p className="text-xs text-muted-foreground mt-0.5">Set exam date</p>
      </div>
    )
  }

  return (
    <div className={cn('text-center', className)}>
      <p className={cn('text-3xl font-bold', urgency.color)}>
        {daysLeft < 0 ? 'Done' : daysLeft}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">
        {daysLeft < 0 ? 'Exam done' : `days to ${examName}`}
      </p>
    </div>
  )
}
