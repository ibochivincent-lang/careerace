'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AppShell } from '@/components/AppShell'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  Brain, User, Target, BookOpen,
  Calendar, Trash2, Moon, Bell, Info, Settings
} from 'lucide-react'
import { clearAllData } from '@/lib/storage'
import { toast } from 'sonner'
import type { ExamTarget, Subject } from '@/lib/types'
import { SUBJECTS_INFO } from '@/lib/mock-data'

const EXAM_TARGETS: { value: ExamTarget; label: string }[] = [
  { value: 'JAMB',      label: 'JAMB / UTME'  },
  { value: 'WAEC',      label: 'WAEC SSCE'    },
  { value: 'NECO',      label: 'NECO'         },
  { value: 'POST_UTME', label: 'Post-UTME'    },
]

const ALL_SUBJECTS: Subject[] = ['biology', 'chemistry', 'physics', 'mathematics', 'english', 'economics']

export default function SettingsPage() {
  const router = useRouter()

  const [name,       setName]       = useState('')
  const [examTarget, setExamTarget] = useState<ExamTarget>('JAMB')
  const [examDate,   setExamDate]   = useState('')
  const [subjects,   setSubjects]   = useState<Subject[]>([])
  const [notifPerm,  setNotifPerm]  = useState<NotificationPermission>('default')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    setName(localStorage.getItem('examace_user_name') ?? '')
    setExamTarget((localStorage.getItem('examace_exam_target') as ExamTarget) ?? 'JAMB')
    setExamDate(localStorage.getItem('examace_exam_date') ?? '')
    const stored = localStorage.getItem('examace_subjects')
    setSubjects(stored ? JSON.parse(stored) : ALL_SUBJECTS)
    if ('Notification' in window) setNotifPerm(Notification.permission)
  }, [])

  const saveProfile = () => {
    localStorage.setItem('examace_user_name',   name.trim() || 'Student')
    localStorage.setItem('examace_exam_target', examTarget)
    localStorage.setItem('examace_exam_name',   examTarget === 'POST_UTME' ? 'Post-UTME' : examTarget)
    localStorage.setItem('examace_subjects',    JSON.stringify(subjects))
    if (examDate) {
      localStorage.setItem('examace_exam_date', examDate)
    } else {
      localStorage.removeItem('examace_exam_date')
    }
    toast.success('Settings saved')
  }

  const toggleSubject = (s: Subject) => {
    setSubjects(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  const handleClearData = () => {
    clearAllData()
    localStorage.removeItem('examace_user_name')
    localStorage.removeItem('examace_exam_target')
    localStorage.removeItem('examace_exam_name')
    localStorage.removeItem('examace_exam_date')
    localStorage.removeItem('examace_subjects')
    localStorage.removeItem('examace_onboarding_done')
    toast.success('All data cleared. Starting fresh.')
    setShowDeleteConfirm(false)
    router.push('/dashboard')
  }

  const requestNotifications = async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications not supported in this browser')
      return
    }
    const perm = await Notification.requestPermission()
    setNotifPerm(perm)
    if (perm === 'granted') {
      toast.success('Notifications enabled!')
      new Notification('ExamAce', {
        body: 'Study reminders are now active. Keep that streak going!',
        icon: '/favicon.ico',
      })
    } else {
      toast.error('Notification permission denied')
    }
  }

  return (
    <AppShell>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-brand-gradient flex items-center justify-center md:hidden">
            <Brain className="w-3.5 h-3.5 text-white" />
          </div>
          <Settings className="w-4 h-4 text-primary hidden md:block" />
          <h1 className="font-semibold text-sm">Settings</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── Profile ───────────────────────────────────────── */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-primary">
              <User className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-sm">Profile</h2>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Display name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your first name"
              maxLength={40}
              className="w-full px-3 py-2.5 rounded-lg border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>
        </Card>

        {/* ── Exam target ───────────────────────────────────── */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-primary">
              <Target className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-sm">Exam Target</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {EXAM_TARGETS.map(t => (
              <button
                key={t.value}
                onClick={() => setExamTarget(t.value)}
                className={[
                  'px-3 py-2.5 rounded-lg border-2 text-sm font-medium text-left transition-all',
                  examTarget === t.value
                    ? 'border-primary bg-brand-50 dark:bg-brand-500/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-border/80',
                ].join(' ')}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Card>

        {/* ── Exam date ─────────────────────────────────────── */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-primary">
              <Calendar className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-sm">Exam Date</h2>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              When is your {examTarget === 'POST_UTME' ? 'Post-UTME' : examTarget} exam?
            </label>
            <input
              type="date"
              value={examDate}
              onChange={e => setExamDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2.5 rounded-lg border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
            {examDate && (
              <button
                onClick={() => setExamDate('')}
                className="text-xs text-muted-foreground hover:text-destructive mt-1.5 transition-colors"
              >
                Clear exam date
              </button>
            )}
          </div>
        </Card>

        {/* ── Subjects ──────────────────────────────────────── */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-primary">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-sm">Subjects</h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ALL_SUBJECTS.map(s => {
              const active = subjects.includes(s)
              const info = SUBJECTS_INFO[s]
              return (
                <button
                  key={s}
                  onClick={() => toggleSubject(s)}
                  className={[
                    'flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-medium transition-all',
                    active
                      ? 'border-primary bg-brand-50 dark:bg-brand-500/10 text-primary'
                      : 'border-border text-muted-foreground',
                  ].join(' ')}
                >
                  <span className="text-xl">{info.icon}</span>
                  {info.name}
                </button>
              )
            })}
          </div>
          {subjects.length === 0 && (
            <p className="text-xs text-destructive">Select at least one subject.</p>
          )}
        </Card>

        {/* ── Appearance ────────────────────────────────────── */}
        <Card className="p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-primary">
              <Moon className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-sm">Appearance</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Dark mode</p>
              <p className="text-xs text-muted-foreground mt-0.5">Switch between light and dark theme</p>
            </div>
            <ThemeToggle />
          </div>
        </Card>

        {/* ── Notifications ─────────────────────────────────── */}
        <Card className="p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-primary">
              <Bell className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-sm">Notifications</h2>
            {notifPerm === 'granted' && (
              <Badge variant="completed" className="text-[10px] ml-auto">Enabled</Badge>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enable browser notifications to receive study reminders, exam countdown alerts, and streak nudges — even when ExamAce is closed.
            </p>

            {notifPerm !== 'granted' && notifPerm !== 'denied' && (
              <Button size="sm" onClick={requestNotifications}>
                <Bell className="w-3.5 h-3.5" />
                Enable notifications
              </Button>
            )}

            {notifPerm === 'denied' && (
              <p className="text-xs text-destructive">
                Notifications are blocked. Enable them in your browser settings to receive reminders.
              </p>
            )}

            {notifPerm === 'granted' && (
              <div className="space-y-2 pt-1">
                {[
                  'Spaced repetition review reminders',
                  'Exam countdown alerts (7 days, 3 days, 1 day)',
                  'Daily study streak notifications',
                  'Weekly progress summary',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground py-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* ── About ────────────────────────────────────────── */}
        <Card className="p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-primary">
              <Info className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-sm">About ExamAce</h2>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Version</span>
              <span className="font-medium text-foreground">0.1.0 (Demo)</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span>AI Engine</span>
              <Badge variant="muted" className="text-[10px]">Simulated (Claude API — coming)</Badge>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span>Storage</span>
              <Badge variant="muted" className="text-[10px]">Local (Convex — coming)</Badge>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span>Auth</span>
              <Badge variant="muted" className="text-[10px]">None (Clerk — coming)</Badge>
            </div>
          </div>
        </Card>

        {/* ── Save button ──────────────────────────────────── */}
        <Button
          className="w-full"
          onClick={saveProfile}
          disabled={subjects.length === 0}
        >
          Save settings
        </Button>

        {/* ── Danger zone ──────────────────────────────────── */}
        <Card className="p-5 border-destructive/30">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-destructive">
              <Trash2 className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-sm text-destructive">Danger zone</h2>
          </div>

          {!showDeleteConfirm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Clear all data</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Wipes your cognitive map, sessions, and settings
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Clear
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-destructive">
                Are you sure? This cannot be undone.
              </p>
              <p className="text-xs text-muted-foreground">
                All your cognitive map data, session history, and settings will be permanently deleted.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={handleClearData}
                >
                  Yes, clear everything
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  )
}
