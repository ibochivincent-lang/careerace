// =============================================================================
// Career Ace — Local Storage Utilities
// =============================================================================

import type { Session } from './types.ts'
import { syncCandidateDataToCloud } from './cloud_sync.ts'

const STORAGE_KEYS = {
  SESSIONS:       'careerace_sessions',
  CURRENT_SESSION:'careerace_current_session',
  NOTIFICATIONS:  'careerace_notifications',
  STREAK:         'careerace_streak',
  STREAK_DATE:    'careerace_streak_date',
  DAILY_GOAL:     'careerace_daily_goal',
} as const

function triggerBackgroundCloudSync(): void {
  if (typeof window === 'undefined') return;
  try {
    const streak = getStreak();
    const streakDate = localStorage.getItem(STORAGE_KEYS.STREAK_DATE) || undefined;
    const dailyGoal = getDailyGoal();
    const sessions = getSessions();
    const notifications = getStoredNotifications();
    syncCandidateDataToCloud({
      learningStats: {
        streak,
        streakDate,
        dailyGoal,
        sessions,
        notifications,
      },
    });
  } catch {}
}

// ── Sessions ─────────────────────────────────────────────────────────────────

export function getSessions(): Session[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function saveSessions(sessions: Session[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions))
    triggerBackgroundCloudSync()
  } catch (e) {
    console.error('Failed to save sessions:', e)
  }
}

export function getCurrentSession(): Session | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function saveCurrentSession(session: Session | null): void {
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session))
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION)
    }
    triggerBackgroundCloudSync()
  } catch (e) {
    console.error('Failed to save current session:', e)
  }
}

// ── Streak ───────────────────────────────────────────────────────────────────

export function getStreak(): number {
  try {
    return parseInt(localStorage.getItem(STORAGE_KEYS.STREAK) ?? '0', 10) || 0
  } catch {
    return 0
  }
}

export function updateStreakOnStudy(): number {
  try {
    const today = new Date().toISOString().split('T')[0]
    const lastDate = localStorage.getItem(STORAGE_KEYS.STREAK_DATE)
    const current = getStreak()

    if (lastDate === today) return current // already studied today

    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0]
    const newStreak = lastDate === yesterday ? current + 1 : 1

    localStorage.setItem(STORAGE_KEYS.STREAK, String(newStreak))
    localStorage.setItem(STORAGE_KEYS.STREAK_DATE, today)
    triggerBackgroundCloudSync()
    return newStreak
  } catch {
    return 0
  }
}

// Returns dates (YYYY-MM-DD strings) where the user had a completed session
export function getStudyDates(): string[] {
  const sessions = getSessions()
  const dates = new Set<string>()
  for (const s of sessions) {
    if (s.endTime) {
      dates.add(new Date(s.startTime).toISOString().split('T')[0])
    }
  }
  return Array.from(dates)
}

// ── Notifications ────────────────────────────────────────────────────────────

export interface AppNotification {
  id: string
  type: 'review_due' | 'streak' | 'exam_soon' | 'achievement' | 'tip' | 'reminder'
  title: string
  body: string
  createdAt: string
  read: boolean
}

export function getStoredNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveStoredNotifications(notifications: AppNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications.slice(0, 50)))
    triggerBackgroundCloudSync()
  } catch {}
}

export function addNotification(notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): void {
  const existing = getStoredNotifications()
  saveStoredNotifications([
    { ...notification, id: `notif_${Date.now()}`, createdAt: new Date().toISOString(), read: false },
    ...existing,
  ])
}

export function markNotificationRead(id: string): void {
  saveStoredNotifications(
    getStoredNotifications().map(n => n.id === id ? { ...n, read: true } : n)
  )
}

export function markAllNotificationsRead(): void {
  saveStoredNotifications(getStoredNotifications().map(n => ({ ...n, read: true })))
}

export function dismissNotification(id: string): void {
  saveStoredNotifications(getStoredNotifications().filter(n => n.id !== id))
}

// ── Daily Goal ───────────────────────────────────────────────────────────────

export interface DailyGoal {
  date: string          // YYYY-MM-DD
  targetMinutes: number
  completedMinutes: number
  targetSessions: number
  completedSessions: number
}

export function getDailyGoal(): DailyGoal {
  try {
    const today = new Date().toISOString().split('T')[0]
    const raw = localStorage.getItem(STORAGE_KEYS.DAILY_GOAL)
    if (raw) {
      const parsed: DailyGoal = JSON.parse(raw)
      if (parsed.date === today) return parsed
    }
    // Fresh day
    return { date: today, targetMinutes: 30, completedMinutes: 0, targetSessions: 2, completedSessions: 0 }
  } catch {
    return { date: '', targetMinutes: 30, completedMinutes: 0, targetSessions: 2, completedSessions: 0 }
  }
}

export function updateDailyGoal(patch: Partial<Pick<DailyGoal, 'completedMinutes' | 'completedSessions'>>): void {
  try {
    const goal = getDailyGoal()
    const updated = { ...goal, ...patch }
    localStorage.setItem(STORAGE_KEYS.DAILY_GOAL, JSON.stringify(updated))
    triggerBackgroundCloudSync()
  } catch {}
}

// ── Clear All ────────────────────────────────────────────────────────────────

export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key))
}
