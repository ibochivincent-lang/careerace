'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import {
  Bell, CheckCheck, X, BookOpen, Zap, Calendar, TrendingUp, Brain, Clock, Mail, Phone
} from 'lucide-react'
import { toast } from 'sonner'
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
  reminder:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
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

  // Application & Interview Reminders State
  const [remindersEnabled, setRemindersEnabled] = useState(true)
  const [reminderChannel, setReminderChannel] = useState<'email' | 'phone'>('email')
  const [reminderDestination, setReminderDestination] = useState('')

  useEffect(() => {
    setStored(getStoredNotifications())
    setDynamic(buildDynamicNotifications())

    try {
      const storedPref = localStorage.getItem('careerace_reminder_pref')
      if (storedPref) {
        const p = JSON.parse(storedPref)
        setRemindersEnabled(p.enabled ?? true)
        setReminderChannel(p.channel ?? 'email')
        setReminderDestination(p.destination ?? '')
      }
    } catch {}
  }, [])

  function handleSaveReminders() {
    const pref = {
      enabled: remindersEnabled,
      channel: reminderChannel,
      destination: reminderDestination.trim(),
      updatedAt: new Date().toISOString()
    }
    localStorage.setItem('careerace_reminder_pref', JSON.stringify(pref))
    toast.success(`Reminders configured for ${reminderChannel === 'phone' ? 'Phone SMS/Push' : 'Email'}.`)
  }

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

        {/* Application & Interview Reminders Card */}
        <Card className="mt-8 p-6 border bg-card/80 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Application &amp; Interview Reminders</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Receive proactive alerts for interview practice rounds, status updates, and newly matched roles.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRemindersEnabled(!remindersEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  remindersEnabled ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    remindersEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-xs font-medium text-foreground">
                {remindersEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          {remindersEnabled && (
            <div className="space-y-4 pt-1">
              <div className="grid sm:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">Reminder Channel</label>
                  <div className="flex rounded-md border p-1 bg-muted/30">
                    <button
                      type="button"
                      onClick={() => setReminderChannel('email')}
                      className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-md font-medium transition-colors ${
                        reminderChannel === 'email' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" /> Email
                    </button>
                    <button
                      type="button"
                      onClick={() => setReminderChannel('phone')}
                      className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-md font-medium transition-colors ${
                        reminderChannel === 'phone' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5" /> Phone / Push
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">
                    {reminderChannel === 'phone' ? 'Phone Number (SMS / Alerts)' : 'Notification Email Address'}
                  </label>
                  <input
                    type={reminderChannel === 'phone' ? 'tel' : 'email'}
                    placeholder={reminderChannel === 'phone' ? '+1 (555) 000-0000' : 'candidate@example.com'}
                    value={reminderDestination}
                    onChange={(e) => setReminderDestination(e.target.value)}
                    className="w-full text-xs rounded-md border bg-background px-3 py-2"
                  />
                </div>

                <div>
                  <Button size="sm" onClick={handleSaveReminders} className="w-full text-xs font-semibold">
                    Save Notification Preferences
                  </Button>
                </div>
              </div>

              {/* Browser Push Permission Toggle */}
              <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20 p-3.5 rounded-xl">
                <div>
                  <span className="text-xs font-semibold text-foreground">Direct Browser Notifications</span>
                  <p className="text-[11px] text-muted-foreground">
                    Enable browser notification push to get immediate popups for scheduled interview sessions.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs shrink-0"
                  onClick={async () => {
                    if ('Notification' in window) {
                      const perm = await Notification.requestPermission()
                      if (perm === 'granted') {
                        new Notification('Career Ace Alerts Enabled', {
                          body: 'You will receive career opportunities and interview reminders here.',
                          icon: '/favicon.ico',
                        })
                        toast.success('Browser notifications permitted!')
                      } else {
                        toast.error('Browser notification permission was denied.')
                      }
                    }
                  }}
                >
                  <Bell className="w-3.5 h-3.5 mr-1.5" />
                  Enable Browser Push
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  )
}
