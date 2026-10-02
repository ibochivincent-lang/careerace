'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import {
  Bell, CheckCheck, X, BookOpen, Zap, Calendar, TrendingUp, Brain, Clock
} from 'lucide-react'
import {
  getStoredNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
  type AppNotification,
} from '@/lib/storage'
import { cn } from '@/components/ui/utils'

const TYPE_STYLES: Record<AppNotification['type'], string> = {
  review_due: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300',
  streak:     'bg-reward-100 text-reward-600 dark:bg-reward-500/20 dark:text-reward-400',
  exam_soon:  'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
  achievement:'bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300',
  tip:        'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300',
  reminder:   'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300',
}

const TYPE_ICONS: Record<AppNotification['type'], React.ReactNode> = {
  review_due:  <BookOpen className="w-4 h-4" />,
  streak:      <Zap className="w-4 h-4" />,
  exam_soon:   <Calendar className="w-4 h-4" />,
  achievement: <TrendingUp className="w-4 h-4" />,
  tip:         <Brain className="w-4 h-4" />,
  reminder:    <Clock className="w-4 h-4" />,
}

function buildDynamicNotifications(): AppNotification[] {
  const out: AppNotification[] = []
  try {
    const now = new Date()

    // 1. Profile / Target role check
    const rawProfile = typeof window !== 'undefined' ? localStorage.getItem('careerace_parsed_profile') : null
    if (rawProfile) {
      try {
        const parsed = JSON.parse(rawProfile)
        const primaryRole = parsed.target_roles?.[0] || 'Software Engineer'
        out.push({
          id: 'dyn-job-match',
          type: 'achievement',
          title: `Job matches ready for ${primaryRole}`,
          body: `Universal Harvester found new verified openings matching your ${parsed.skills?.slice(0, 3).join(', ') || 'core'} skillset.`,
          createdAt: now.toISOString(),
          read: false,
        })
      } catch {}
    }

    // 2. STAR+R Interview Room Coach alert
    out.push({
      id: 'dyn-star-prep',
      type: 'tip',
      title: 'STAR+R Interview Readiness',
      body: 'Practice your Situation, Task, Action, Result, and Reflection responses with AI feedback in the Interview Room.',
      createdAt: new Date(Date.now() - 3600_000).toISOString(),
      read: true,
    })

    // 3. Welcome / Sovereign Vault status
    out.push({
      id: 'dyn-welcome',
      type: 'achievement',
      title: 'Welcome to Career Ace AI',
      body: 'Your encrypted career vault on Walrus is initialized. Upload your CV to extract and tailor impact metrics.',
      createdAt: now.toISOString(),
      read: false,
    })
  } catch {}
  return out
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins < 1)  return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24)return `${hours}h ago`
  return `${days}d ago`
}

export default function NotificationsPage() {
  const router = useRouter()
  const [stored, setStored]   = useState<AppNotification[]>([])
  const [dynamic, setDynamic] = useState<AppNotification[]>([])

  useEffect(() => {
    setStored(getStoredNotifications())
    setDynamic(buildDynamicNotifications())
  }, [])

  // Merge: dynamic notifications first, then stored ones
  const all = [
    ...dynamic,
    ...stored.filter(s => !dynamic.find(d => d.id === s.id)),
  ]

  const unread = all.filter(n => !n.read).length

  const handleMarkAll = () => {
    markAllNotificationsRead()
    setStored(getStoredNotifications())
    setDynamic(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleDismiss = (id: string) => {
    if (id.startsWith('dyn-')) {
      setDynamic(prev => prev.filter(n => n.id !== id))
    } else {
      dismissNotification(id)
      setStored(getStoredNotifications())
    }
  }

  const handleRead = (id: string) => {
    if (id.startsWith('dyn-')) {
      setDynamic(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } else {
      markNotificationRead(id)
      setStored(getStoredNotifications())
    }
  }

  return (
    <AppShell>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h1 className="font-semibold text-sm">Notifications</h1>
            {unread > 0 && (
              <Badge variant="brand" className="text-[10px] px-1.5">{unread}</Badge>
            )}
          </div>
          {unread > 0 && (
            <button
              onClick={handleMarkAll}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {all.length === 0 ? (
          <EmptyState
            icon={<Bell className="w-8 h-8" />}
            title="All caught up"
            description="You have no notifications. Stay active with your job searches and interview prep to receive updates here."
          />
        ) : (
          <div className="space-y-2">
            {all.map(n => (
              <Card
                key={n.id}
                className={cn(
                  'p-4 transition-colors cursor-pointer',
                  !n.read && 'border-primary/20 bg-brand-50/30 dark:bg-brand-500/5'
                )}
                onClick={() => handleRead(n.id)}
              >
                <div className="flex gap-3">
                  <div className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                    TYPE_STYLES[n.type]
                  )}>
                    {TYPE_ICONS[n.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm leading-snug', !n.read ? 'font-semibold' : 'font-medium')}>
                        {n.title}
                      </p>
                      <button
                        onClick={e => { e.stopPropagation(); handleDismiss(n.id) }}
                        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Dismiss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.body}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1.5">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Reminder section */}
        <Card className="mt-6 p-4 bg-muted/30">
          <h3 className="text-sm font-semibold mb-2">Browser Reminders</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Allow browser notifications to get career alerts and interview reminders even when Career Ace is closed.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              if ('Notification' in window) {
                const perm = await Notification.requestPermission()
                if (perm === 'granted') {
                  new Notification('Career Ace Alerts Enabled', {
                    body: 'You\'ll receive career opportunities and interview reminders here.',
                    icon: '/favicon.ico',
                  })
                }
              }
            }}
          >
            <Bell className="w-3.5 h-3.5" />
            Enable reminders
          </Button>
        </Card>
      </div>
    </AppShell>
  )
}
