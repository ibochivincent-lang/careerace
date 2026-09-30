'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AppShell } from '@/components/AppShell'
import { SubjectRadarChart } from '@/components/SubjectRadarChart'
import { CognitiveMapCard } from '@/components/CognitiveMapCard'
import { ErrorTypeSummary } from '@/components/ErrorTypeSummary'
import { TopicReviewQueue } from '@/components/TopicReviewQueue'
import { EmptyState } from '@/components/EmptyState'
import { StreakCounter } from '@/components/StreakCounter'
import { TrendingUp, BookOpen, Calendar } from 'lucide-react'
import { getCognitiveMap, getSessions, getStudyDates } from '@/lib/storage'
import { SUBJECTS_INFO } from '@/lib/mock_data'
import type { Subject } from '@/lib/types'
import { cn } from '@/components/ui/utils'

const SUBJECTS: Subject[] = ['biology', 'chemistry', 'physics', 'mathematics', 'english', 'economics']

function buildCalendarDays(studyDates: string[]): { date: string; studied: boolean; isToday: boolean }[] {
  const dateSet = new Set(studyDates)
  const today = new Date()
  const days: { date: string; studied: boolean; isToday: boolean }[] = []

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    days.push({
      date: dateStr,
      studied: dateSet.has(dateStr),
      isToday: i === 0,
    })
  }
  return days
}

export default function ProgressPage() {
  const router = useRouter()
  const [cognitiveMap] = useState(() => getCognitiveMap())
  const [sessions]     = useState(() => getSessions())
  const [studyDates]   = useState(() => getStudyDates())
  const calendarDays   = buildCalendarDays(studyDates)
  const studiedCount   = calendarDays.filter(d => d.studied).length

  const hasData = Object.keys(cognitiveMap.topicRecords).length > 0

  const priorityTopics = cognitiveMap.priorityTopics
    .map(t => cognitiveMap.topicRecords[t])
    .filter(Boolean)

  const radarData = SUBJECTS.map(subject => {
    const topics = Object.values(cognitiveMap.topicRecords).filter(t => t.subject === subject)
    const avg = topics.length
      ? topics.reduce((s, t) => s + t.confidenceScore, 0) / topics.length
      : 0
    return { subject, label: SUBJECTS_INFO[subject].name.slice(0, 4), score: avg, color: '#22c55e' }
  })

  return (
    <AppShell>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h1 className="font-semibold text-sm">Progress</h1>
          </div>
          <Button size="sm" onClick={() => router.push('/session/new')}>
            <BookOpen className="w-3.5 h-3.5" />
            Study now
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* ── Stats row ─────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{cognitiveMap.sessionCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total sessions</p>
          </Card>
          <Card className="p-4 flex flex-col items-center justify-center">
            <StreakCounter size="sm" />
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{studiedCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Days studied (30d)</p>
          </Card>
        </div>

        {/* ── Study calendar ────────────────────────────────── */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Study Calendar — Last 30 Days</h2>
          </div>

          <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}>
            {calendarDays.map(({ date, studied, isToday }) => (
              <div
                key={date}
                title={date}
                className={cn(
                  'w-full aspect-square rounded-md transition-colors',
                  isToday && 'ring-2 ring-primary ring-offset-1',
                  studied
                    ? 'bg-primary'
                    : 'bg-muted'
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-muted" />
              No session
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-primary" />
              Studied
            </div>
          </div>
        </Card>

        {!hasData ? (
          <EmptyState
            icon={<TrendingUp className="w-8 h-8" />}
            title="No progress data yet"
            description="Complete study sessions to build your cognitive map and see your progress here."
            action={{ label: 'Start a session', onClick: () => router.push('/session/new') }}
          />
        ) : (
          <>
            {/* ── Radar + Subject breakdown ──────────────────── */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-5">
                <h2 className="font-semibold text-sm mb-4">Subject Overview</h2>
                <SubjectRadarChart subjects={radarData} size={220} className="mx-auto" />
              </Card>

              <Card className="p-5">
                <h2 className="font-semibold text-sm mb-4">Subject Breakdown</h2>
                <div className="space-y-3">
                  {SUBJECTS.map(subject => {
                    const topics = Object.values(cognitiveMap.topicRecords).filter(t => t.subject === subject)
                    if (!topics.length) return null
                    const avg = Math.round(topics.reduce((s, t) => s + t.confidenceScore, 0) / topics.length * 100)
                    const due = topics.filter(t => new Date(t.nextReviewAt) <= new Date()).length
                    return (
                      <div key={subject} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{SUBJECTS_INFO[subject].icon}</span>
                          <div className="flex-1">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">{SUBJECTS_INFO[subject].name}</span>
                              <div className="flex items-center gap-1.5">
                                {due > 0 && <Badge variant="overdue" className="text-[9px] px-1 py-0">{due} due</Badge>}
                                <span className="font-medium">{avg}%</span>
                              </div>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  avg >= 70 ? 'bg-primary' : avg >= 40 ? 'bg-orange-400' : 'bg-destructive'
                                )}
                                style={{ width: `${avg}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>

            {/* ── Review queue ──────────────────────────────── */}
            <div>
              <h2 className="font-semibold text-sm mb-3">Due for Review</h2>
              <TopicReviewQueue topicRecords={cognitiveMap.topicRecords} />
            </div>

            {/* ── Error type analysis ───────────────────────── */}
            {Object.keys(cognitiveMap.topicRecords).length > 0 && (
              <div>
                <h2 className="font-semibold text-sm mb-3">Error Pattern Analysis</h2>
                <ErrorTypeSummary cognitiveMap={cognitiveMap} />
              </div>
            )}

            {/* ── Priority topics ───────────────────────────── */}
            {priorityTopics.length > 0 && (
              <div>
                <h2 className="font-semibold text-sm mb-3">Priority Topics</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {priorityTopics.map((record, i) => (
                    <CognitiveMapCard key={i} topicRecord={record} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Recent sessions ───────────────────────────── */}
            {sessions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-sm">Recent Sessions</h2>
                  <button
                    onClick={() => router.push('/dashboard?tab=sessions')}
                    className="text-xs text-primary hover:underline"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-2">
                  {sessions.slice(0, 5).map(session => {
                    const info = SUBJECTS_INFO[session.subject]
                    const duration = session.endTime
                      ? Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60_000)
                      : null
                    return (
                      <Card key={session.id} className="p-3 flex items-center gap-3">
                        <span className="text-xl">{info.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{info.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(session.startTime).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                            {duration ? ` · ${duration} min` : ''}
                            {` · ${session.messages.length} messages`}
                          </p>
                        </div>
                        {session.endTime && <Badge variant="completed" className="text-[10px]">Done</Badge>}
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
