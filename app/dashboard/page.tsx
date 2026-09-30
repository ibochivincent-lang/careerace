'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { SubjectCard } from '@/components/SubjectCard'
import { CognitiveMapCard } from '@/components/CognitiveMapCard'
import { DemoInfoDialog } from '@/components/DemoInfoDialog'
import { DashboardHeroCard } from '@/components/DashboardHeroCard'
import { SubjectRadarChart } from '@/components/SubjectRadarChart'
import { NotificationBell } from '@/components/NotificationBell'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AppShell } from '@/components/AppShell'
import { OnboardingWizard } from '@/components/OnboardingWizard'
import { EmptyState } from '@/components/EmptyState'
import { SmartScheduleBanner } from '@/components/SmartScheduleBanner'
import { DailyGoalWidget } from '@/components/DailyGoalWidget'
import { TopicReviewQueue } from '@/components/TopicReviewQueue'
import { Brain, Settings, BookOpen, Plus } from 'lucide-react'
import { getCognitiveMap, getSessions } from '@/lib/storage'
import type { Subject, ExamTarget } from '@/lib/types'
import { SUBJECTS_INFO } from '@/lib/mock_data'

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')

  const [cognitiveMap, setCognitiveMap] = useState(getCognitiveMap())
  const [sessions] = useState(getSessions())
  const [activeTab, setActiveTab] = useState(tabParam ?? 'subjects')
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    setCognitiveMap(getCognitiveMap())
    const done = localStorage.getItem('examace_onboarding_done')
    if (!done) setShowOnboarding(true)
  }, [])

  const subjects: Subject[] = ['biology', 'chemistry', 'physics', 'mathematics', 'english', 'economics']

  const subjectsWithTopics = subjects.map(subject => {
    const topics = Object.values(cognitiveMap.topicRecords).filter(t => t.subject === subject)
    const dueTopics = topics.filter(t => new Date(t.nextReviewAt) <= new Date()).length
    return { subject, topicCount: topics.length, dueTopics }
  }).filter(s => s.topicCount > 0)

  const priorityTopicRecords = cognitiveMap.priorityTopics
    .map(topic => cognitiveMap.topicRecords[topic])
    .filter(Boolean)
    .slice(0, 6)

  const radarData = subjects.map(subject => {
    const topics = Object.values(cognitiveMap.topicRecords).filter(t => t.subject === subject)
    const avg = topics.length
      ? topics.reduce((s, t) => s + t.confidenceScore, 0) / topics.length
      : 0
    return { subject, label: SUBJECTS_INFO[subject].name.slice(0, 4), score: avg, color: '#22c55e' }
  })

  const handleOnboardingComplete = (data: { name: string; examTarget: ExamTarget; subjects: Subject[] }) => {
    void data
    setShowOnboarding(false)
    setCognitiveMap(getCognitiveMap())
  }

  return (
    <AppShell>
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Mobile: show logo; Desktop: show page title */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center md:hidden">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div className="md:hidden">
              <span className="font-bold text-sm leading-none block">ExamAce</span>
              <span className="text-[10px] text-muted-foreground leading-none">Socratic AI Tutor</span>
            </div>
            <h1 className="font-semibold text-sm hidden md:block">Dashboard</h1>
          </div>

          <div className="flex items-center gap-1">
            <DemoInfoDialog />
            <NotificationBell />
            <ThemeToggle className="md:hidden" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/settings')}
              aria-label="Settings"
              className="md:hidden"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Context-aware exam banner */}
        <SmartScheduleBanner sessionCount={cognitiveMap.sessionCount} />

        {/* ── Hero card ───────────────────────────────────────── */}
        <DashboardHeroCard
          calibration={cognitiveMap.overallConfidenceCalibration}
          sessionCount={cognitiveMap.sessionCount}
          onStartSession={() => router.push('/session/new')}
        />

        {/* Daily goal + review queue */}
        <div className="grid md:grid-cols-2 gap-4">
          <DailyGoalWidget />
          <Card className="p-4">
            <h3 className="font-semibold text-sm mb-3">Due for Review</h3>
            <TopicReviewQueue topicRecords={cognitiveMap.topicRecords} />
          </Card>
        </div>

        {/* ── Tabs ────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="subjects"  className="flex-1 sm:flex-none">Subjects</TabsTrigger>
            <TabsTrigger value="progress"  className="flex-1 sm:flex-none">Progress</TabsTrigger>
            <TabsTrigger value="sessions"  className="flex-1 sm:flex-none">Sessions</TabsTrigger>
          </TabsList>

          {/* ── Subjects tab ─────────────────────────────────── */}
          <TabsContent value="subjects" className="mt-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Your Subjects</h2>
              <Button size="sm" onClick={() => router.push('/session/new')}>
                <Plus className="w-3.5 h-3.5" />
                New session
              </Button>
            </div>

            {subjectsWithTopics.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="w-7 h-7" />}
                title="No subjects yet"
                description="Start a session in any subject to begin building your cognitive map and track your progress."
                action={{ label: 'Start your first session', onClick: () => router.push('/session/new') }}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {subjectsWithTopics.map(({ subject, topicCount, dueTopics }) => (
                  <SubjectCard
                    key={subject}
                    subject={subject}
                    topicCount={topicCount}
                    dueTopics={dueTopics}
                    onClick={() => router.push(`/session/new?subject=${subject}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Progress tab ─────────────────────────────────── */}
          <TabsContent value="progress" className="mt-5 space-y-6">
            {priorityTopicRecords.length === 0 ? (
              <EmptyState
                icon={<Brain className="w-7 h-7" />}
                title="Your progress map will appear here"
                description="Complete sessions across subjects to see your confidence levels, error patterns, and which topics need the most attention."
                action={{ label: 'Start a session', onClick: () => router.push('/session/new') }}
              />
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="p-5">
                    <h3 className="font-semibold mb-4 text-sm">Subject Confidence Overview</h3>
                    <SubjectRadarChart subjects={radarData} size={220} className="mx-auto" />
                  </Card>

                  <Card className="p-5">
                    <h3 className="font-semibold mb-4 text-sm">Performance Summary</h3>
                    <div className="space-y-3">
                      {subjects.map(subject => {
                        const topics = Object.values(cognitiveMap.topicRecords).filter(t => t.subject === subject)
                        if (!topics.length) return null
                        const avg = Math.round(topics.reduce((s, t) => s + t.confidenceScore, 0) / topics.length * 100)
                        return (
                          <div key={subject} className="flex items-center gap-3">
                            <span className="text-lg w-7">{SUBJECTS_INFO[subject].icon}</span>
                            <div className="flex-1">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-muted-foreground">{SUBJECTS_INFO[subject].name}</span>
                                <span className="font-medium">{avg}%</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary transition-all"
                                  style={{ width: `${avg}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </Card>
                </div>

                {cognitiveMap.dominantErrorType && (
                  <Card className="p-4 border-l-4 border-l-orange-400 bg-orange-50/50 dark:bg-orange-950/20">
                    <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                      Dominant error pattern
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-400 mt-0.5 capitalize">
                      {cognitiveMap.dominantErrorType.replace(/_/g, ' ')} — this is your most common mistake type across all subjects.
                    </p>
                  </Card>
                )}

                <div>
                  <h3 className="font-semibold mb-3 text-sm">Priority Topics</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {priorityTopicRecords.map((record, i) => (
                      <CognitiveMapCard key={i} topicRecord={record} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* ── Sessions tab ─────────────────────────────────── */}
          <TabsContent value="sessions" className="mt-5 space-y-3">
            {sessions.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="w-7 h-7" />}
                title="No sessions yet"
                description="Your completed study sessions will appear here. Start your first session to begin your learning journey."
                action={{ label: 'Start learning', onClick: () => router.push('/session/new') }}
              />
            ) : (
              sessions.slice(0, 10).map(session => {
                const info = SUBJECTS_INFO[session.subject]
                const duration = session.endTime
                  ? Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000)
                  : null
                return (
                  <Card key={session.id} className="p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{info.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">{info.name}</h4>
                            {session.endTime && (
                              <Badge variant="completed" className="text-[10px]">Completed</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(session.startTime).toLocaleString('en-NG', {
                              month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                            {duration ? ` · ${duration} min` : ''}
                            {` · ${session.messages.length} messages`}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/session/${session.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  </Card>
                )
              })
            )}
          </TabsContent>
        </Tabs>
      </div>

      <OnboardingWizard
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
      />
    </AppShell>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-lg bg-brand-gradient animate-pulse" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
