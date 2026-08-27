'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, X, CheckCheck, BookOpen, Zap, Calendar, TrendingUp, Brain } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { cn } from './ui/utils'
import { getCognitiveMap } from '@/lib/storage'

interface Notification {
  id: string
  type: 'review_due' | 'streak' | 'exam_soon' | 'achievement' | 'tip'
  title: string
  body: string
  time: string
  read: boolean
  icon: 'book' | 'zap' | 'calendar' | 'trend' | 'brain'
}

const ICON_MAP = {
  book:     <BookOpen className="w-4 h-4" />,
  zap:      <Zap className="w-4 h-4" />,
  calendar: <Calendar className="w-4 h-4" />,
  trend:    <TrendingUp className="w-4 h-4" />,
  brain:    <Brain className="w-4 h-4" />,
}

const TYPE_STYLES: Record<Notification['type'], string> = {
  review_due:  'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300',
  streak:      'bg-reward-100 text-reward-600 dark:bg-reward-500/20 dark:text-reward-400',
  exam_soon:   'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
  achievement: 'bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300',
  tip:         'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300',
}

function buildNotifications(): Notification[] {
  const notifications: Notification[] = []

  try {
    const map = getCognitiveMap()
    const now = new Date()

    // Overdue topics
    const overdue = Object.values(map.topicRecords).filter(
      t => new Date(t.nextReviewAt) <= now
    )
    if (overdue.length > 0) {
      notifications.push({
        id: 'review-due',
        type: 'review_due',
        title: `${overdue.length} topic${overdue.length > 1 ? 's' : ''} due for review`,
        body: `${overdue.map(t => t.topic).slice(0, 2).join(', ')}${overdue.length > 2 ? ` +${overdue.length - 2} more` : ''} need attention.`,
        time: 'Now',
        read: false,
        icon: 'book',
      })
    }

    // Exam countdown
    const examDate = localStorage.getItem('examace_exam_date')
    const examName = localStorage.getItem('examace_exam_name') || 'JAMB'
    if (examDate) {
      const days = Math.ceil((new Date(examDate).getTime() - now.getTime()) / 86400000)
      if (days > 0 && days <= 30) {
        notifications.push({
          id: 'exam-soon',
          type: 'exam_soon',
          title: `${days} days to ${examName}`,
          body: days <= 14 ? 'Critical zone — focus on weak topics now.' : 'Keep up your daily sessions.',
          time: 'Today',
          read: false,
          icon: 'calendar',
        })
      }
    }

    // Dominant error tip
    if (map.dominantErrorType) {
      const tips: Record<string, string> = {
        conceptual_misconception: 'Your biggest pattern is misconceptions. Explain concepts out loud.',
        procedural_error:         'You often get the concept right but the steps wrong. Practice derivations.',
        unit_confusion:           'Units trip you up most. Always write units at each step.',
        sign_error:               'Sign errors are costing you marks. Slow down on sign checks.',
        recall_gap:               'You have recall gaps. Short daily reviews beat long cramming sessions.',
      }
      const tip = tips[map.dominantErrorType]
      if (tip) {
        notifications.push({
          id: 'tip-error',
          type: 'tip',
          title: 'Your study pattern insight',
          body: tip,
          time: 'Today',
          read: true,
          icon: 'brain',
        })
      }
    }

    // Achievement nudge
    if (map.sessionCount === 0) {
      notifications.push({
        id: 'first-session',
        type: 'achievement',
        title: 'Start your first session',
        body: 'Complete your first Socratic session to begin building your cognitive map.',
        time: 'Welcome',
        read: false,
        icon: 'zap',
      })
    }
  } catch {
    // fallback — no notifications
  }

  return notifications
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setNotifications(buildNotifications())
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const unread = notifications.filter(n => !n.read).length

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const dismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(v => !v)}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        className="relative"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive animate-pulse-glow" />
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border bg-popover shadow-xl z-50 animate-slide-down overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {unread > 0 && (
                <Badge variant="brand" className="text-[10px] px-1.5 py-0">
                  {unread}
                </Badge>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <CheckCheck className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                All caught up 🎉
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={cn(
                    'flex gap-3 px-4 py-3 border-b last:border-0 transition-colors hover:bg-muted/40',
                    !n.read && 'bg-brand-50/50 dark:bg-brand-500/5'
                  )}
                >
                  <div className={cn('mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', TYPE_STYLES[n.type])}>
                    {ICON_MAP[n.icon]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-xs font-medium leading-snug', !n.read && 'font-semibold')}>
                        {n.title}
                      </p>
                      <button
                        onClick={() => dismiss(n.id)}
                        className="text-muted-foreground hover:text-foreground flex-shrink-0"
                        aria-label="Dismiss"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.body}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">{n.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
