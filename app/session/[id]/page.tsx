'use client'

import { useState, useEffect, useRef, use, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ChatMessage } from '@/components/ChatMessage'
import { DemoInfoDialog } from '@/components/DemoInfoDialog'
import { QuestionCard } from '@/components/QuestionCard'
import { PostSessionSummary } from '@/components/PostSessionSummary'
import { ArrowLeft, Send, Mic, Camera, XCircle, MessageSquare } from 'lucide-react'
import {
  getCognitiveMap,
  saveCognitiveMap,
  getCurrentSession,
  saveCurrentSession,
  getSessions,
  saveSessions,
  updateStreakOnStudy,
  getDailyGoal,
  updateDailyGoal,
  addNotification,
} from '@/lib/storage'
import { generateSocraticResponse, analyzeUserResponse } from '@/lib/socratic-engine'
import { SAMPLE_QUESTIONS, SUBJECTS_INFO } from '@/lib/mock-data'
import type { Session as SessionType, Message, Subject, InputModality, CognitiveMap, ErrorType } from '@/lib/types'
import { toast } from 'sonner'

interface PageProps {
  params: Promise<{ id: string }>
}

// ─── Cognitive map update after a session ────────────────────────────────────

function updateCognitiveMap(session: SessionType, map: CognitiveMap): CognitiveMap {
  const userMessages = session.messages.filter(m => m.role === 'user')
  if (!userMessages.length) return map

  // Find topic from question bank
  const subjectQuestions = SAMPLE_QUESTIONS[session.subject] ?? []
  const matched = subjectQuestions.find(q => q.question === session.currentQuestion)
  const topic = matched?.topic ?? `${SUBJECTS_INFO[session.subject].name} General`

  // Confidence score from message analysis
  const levels = userMessages.map(m => m.confidenceLevel).filter(Boolean)
  const highCount     = levels.filter(c => c === 'high').length
  const mediumCount   = levels.filter(c => c === 'medium').length
  const lowCount      = levels.filter(c => c === 'low').length
  const guessingCount = levels.filter(c => c === 'guessing').length
  const total = levels.length || 1

  const newConfidence = (highCount * 1.0 + mediumCount * 0.6 + lowCount * 0.3 + guessingCount * 0.1) / total

  // Hedge word rate
  const totalHedges = userMessages.reduce((s, m) => s + (m.hedgeWords?.length ?? 0), 0)
  const hedgeRate   = totalHedges / userMessages.length

  // Infer error types from patterns
  const newErrors: ErrorType[] = []
  if (guessingCount > 0)  newErrors.push('recall_gap')
  if (lowCount > mediumCount + highCount) newErrors.push('conceptual_misconception')
  if (hedgeRate > 0.5)    newErrors.push('distractor_susceptibility')

  // Spaced repetition: days until next review
  const daysNext = newConfidence >= 0.75 ? 7 : newConfidence >= 0.5 ? 3 : 1
  const nextReviewAt = new Date(Date.now() + daysNext * 86_400_000).toISOString()

  const existing = map.topicRecords[topic]
  const updatedRecord = {
    topic,
    subject: session.subject,
    errorTypes: newErrors.length ? newErrors : (existing?.errorTypes ?? []),
    confidenceScore: existing
      ? existing.confidenceScore * 0.65 + newConfidence * 0.35
      : newConfidence,
    lastSeenAt: new Date().toISOString(),
    nextReviewAt,
    attemptCount:  (existing?.attemptCount  ?? 0) + userMessages.length,
    correctCount:  (existing?.correctCount  ?? 0) + highCount,
    hedgeWordRate: hedgeRate,
  }

  const updatedRecords = { ...map.topicRecords, [topic]: updatedRecord }

  // Re-rank priority topics (lowest confidence first)
  const priorityTopics = Object.values(updatedRecords)
    .sort((a, b) => a.confidenceScore - b.confidenceScore)
    .slice(0, 6)
    .map(r => r.topic)

  // Overall calibration = average confidence
  const scores = Object.values(updatedRecords).map(r => r.confidenceScore)
  const overallConfidenceCalibration = scores.reduce((s, v) => s + v, 0) / scores.length

  // Dominant error type
  const errorFreq: Record<string, number> = {}
  for (const rec of Object.values(updatedRecords)) {
    for (const err of rec.errorTypes) {
      errorFreq[err] = (errorFreq[err] ?? 0) + 1
    }
  }
  const dominantErrorType = (Object.entries(errorFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null) as ErrorType | null

  return {
    ...map,
    topicRecords: updatedRecords,
    priorityTopics,
    overallConfidenceCalibration,
    dominantErrorType,
    updatedAt: new Date().toISOString(),
  }
}

// ─────────────────────────────────────────────────────────────────────────────

function SessionContent({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const subject = searchParams.get('subject') as Subject | null

  const [session,       setSession]       = useState<SessionType | null>(null)
  const [currentOptions,setCurrentOptions]= useState<string[]>([])
  const [inputText,     setInputText]     = useState('')
  const [inputModality, setInputModality] = useState<InputModality>('text')
  const [isProcessing,  setIsProcessing]  = useState(false)
  const [isReadOnly,    setIsReadOnly]    = useState(false)
  const [showSummary,   setShowSummary]   = useState(false)
  const [endedSession,  setEndedSession]  = useState<SessionType | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef    = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (id === 'new') {
      const selectedSubject = (subject || 'biology') as Subject
      const questions = SAMPLE_QUESTIONS[selectedSubject]
      const randomQuestion = questions[Math.floor(Math.random() * questions.length)]

      const newSession: SessionType = {
        id: `session_${Date.now()}`,
        subject: selectedSubject,
        startTime: new Date().toISOString(),
        messages: [],
        currentQuestion: randomQuestion.question,
        questionsAttempted: 0,
      }

      const initialMessage: Message = {
        role: 'assistant',
        content: randomQuestion.question,
        timestamp: new Date().toISOString(),
      }

      newSession.messages.push(initialMessage)
      setCurrentOptions(randomQuestion.options)
      setSession(newSession)
      saveCurrentSession(newSession)
    } else {
      const current = getCurrentSession()
      if (current && current.id === id) {
        setSession(current)
      } else {
        const allSessions = getSessions()
        const found = allSessions.find(s => s.id === id)
        if (found) {
          setSession(found)
          setIsReadOnly(!!found.endTime)
        } else {
          router.push('/dashboard')
        }
      }
    }
  }, [id, subject, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session?.messages])

  const handleSendMessage = async () => {
    if (!inputText.trim() || !session || isProcessing || isReadOnly) return

    setIsProcessing(true)

    const analysis = analyzeUserResponse(inputText)

    const userMessage: Message = {
      role: 'user',
      content: inputText,
      timestamp: new Date().toISOString(),
      confidenceLevel: analysis.confidenceLevel,
      hedgeWords: analysis.hedgeWords,
    }

    const updatedSession: SessionType = {
      ...session,
      messages: [...session.messages, userMessage],
      questionsAttempted: session.questionsAttempted + 1,
    }

    setSession(updatedSession)
    setInputText('')

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    setTimeout(() => {
      const cognitiveMap = getCognitiveMap()
      const { content } = generateSocraticResponse(
        inputText,
        updatedSession.messages,
        cognitiveMap,
        session.currentQuestion
      )

      const assistantMessage: Message = {
        role: 'assistant',
        content,
        timestamp: new Date().toISOString(),
      }

      const finalSession: SessionType = {
        ...updatedSession,
        messages: [...updatedSession.messages, assistantMessage],
      }

      setSession(finalSession)
      saveCurrentSession(finalSession)
      setIsProcessing(false)
    }, 800 + Math.random() * 800)
  }

  const handleEndSession = () => {
    if (!session) return

    const endTime = new Date().toISOString()
    const durationMin = Math.round(
      (new Date(endTime).getTime() - new Date(session.startTime).getTime()) / 60_000
    )

    const ended: SessionType = { ...session, endTime }

    // Save session
    saveSessions([ended, ...getSessions()])
    saveCurrentSession(null)

    // Update cognitive map
    const map = getCognitiveMap()
    const updatedMap = updateCognitiveMap(ended, map)
    updatedMap.sessionCount += 1
    saveCognitiveMap(updatedMap)

    // Update streak
    const newStreak = updateStreakOnStudy()

    // Update daily goal
    const currentGoal = getDailyGoal()
    updateDailyGoal({
      completedSessions: currentGoal.completedSessions + 1,
      completedMinutes:  currentGoal.completedMinutes + durationMin,
    })

    // Fire notification if streak milestone
    if (newStreak > 0 && newStreak % 7 === 0) {
      addNotification({
        type: 'streak',
        title: `${newStreak}-day streak!`,
        body: `Incredible consistency — you've studied ${newStreak} days in a row.`,
      })
    }

    setEndedSession(ended)
    setShowSummary(true)
  }

  const handleSimulateVoice = () => {
    const next: InputModality = inputModality === 'voice' ? 'text' : 'voice'
    setInputModality(next)
    toast.info(next === 'voice' ? 'Voice mode active (simulated)' : 'Switched to text input')
  }

  const handleSimulateCamera = () => {
    const next: InputModality = inputModality === 'voice_with_camera' ? 'text' : 'voice_with_camera'
    setInputModality(next)
    toast.info(next === 'voice_with_camera' ? 'Camera mode active (simulated)' : 'Camera disabled')
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center animate-pulse">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm">Loading session…</p>
        </div>
      </div>
    )
  }

  const subjectInfo = SUBJECTS_INFO[session.subject]
  const userMessages = session.messages.filter(m => m.role === 'user')

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ height: '100dvh' }}>
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="bg-background border-b flex-shrink-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/dashboard')}
                aria-label="Back to dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-xl">{subjectInfo.icon}</span>
                <div>
                  <h1 className="font-semibold text-sm leading-tight">
                    {subjectInfo.name}
                    {isReadOnly && <span className="ml-1.5 text-muted-foreground font-normal">(read-only)</span>}
                  </h1>
                  <p className="text-[10px] text-muted-foreground">
                    {session.messages.length} messages
                    {userMessages.length > 0 && ` · ${userMessages.length} responses`}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {inputModality !== 'text' && (
                <Badge
                  variant={inputModality === 'voice' ? 'brand' : 'secondary'}
                  className="text-[10px] hidden sm:flex"
                >
                  {inputModality === 'voice'
                    ? <><Mic className="w-2.5 h-2.5" /> Voice</>
                    : <><Camera className="w-2.5 h-2.5" /> Cam + Voice</>}
                </Badge>
              )}
              <DemoInfoDialog />
              {!isReadOnly && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleEndSession}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">End session</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Pinned question card ─────────────────────────────── */}
      {session.currentQuestion && (
        <div className="border-b flex-shrink-0 bg-background">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <QuestionCard
              question={session.currentQuestion}
              options={currentOptions}
              subject={subjectInfo.name}
              questionNumber={session.questionsAttempted + 1}
            />
          </div>
        </div>
      )}

      {/* ── Socratic method banner ───────────────────────────── */}
      {!isReadOnly && (
        <div className="bg-brand-50 dark:bg-brand-500/5 border-b border-brand-100 dark:border-brand-500/20 flex-shrink-0">
          <div className="max-w-3xl mx-auto px-4 py-2">
            <p className="text-xs text-primary font-medium">
              Don't just pick an option — explain your reasoning. The AI will guide you to the answer.
            </p>
          </div>
        </div>
      )}

      {/* ── Messages ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-5">
          {session.messages.slice(session.currentQuestion ? 1 : 0).map((message, i) => (
            <ChatMessage key={i} message={message} />
          ))}

          {isProcessing && (
            <div className="flex gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[10px] font-bold">EA</span>
              </div>
              <div className="bg-muted/70 rounded-2xl rounded-tl-sm border border-border/40 px-4 py-3">
                <div className="flex gap-1.5 items-center">
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full bounce-dot" />
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full bounce-dot" />
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full bounce-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Input area ─────────────────────────────────────────── */}
      {!isReadOnly && (
        <div className="bg-background border-t flex-shrink-0">
          <div className="max-w-3xl mx-auto px-4 py-3">
            {inputModality !== 'text' && (
              <div className="mb-2 flex gap-2">
                {inputModality === 'voice' && (
                  <Badge variant="brand" className="gap-1.5">
                    <Mic className="w-3 h-3 animate-pulse" />
                    Voice mode active (simulated)
                  </Badge>
                )}
                {inputModality === 'voice_with_camera' && (
                  <Badge variant="secondary" className="gap-1.5">
                    <Camera className="w-3 h-3" />
                    Camera + Voice active (simulated)
                  </Badge>
                )}
              </div>
            )}

            <div className="flex gap-2 items-end">
              <Button
                variant={inputModality === 'voice' || inputModality === 'voice_with_camera' ? 'default' : 'outline'}
                size="icon"
                onClick={handleSimulateVoice}
                className="flex-shrink-0 h-10 w-10"
                aria-label="Toggle voice input"
              >
                <Mic className="w-4 h-4" />
              </Button>

              <Button
                variant={inputModality === 'voice_with_camera' ? 'default' : 'outline'}
                size="icon"
                onClick={handleSimulateCamera}
                className="flex-shrink-0 h-10 w-10"
                aria-label="Toggle camera for handwritten working"
              >
                <Camera className="w-4 h-4" />
              </Button>

              <Textarea
                ref={textareaRef}
                value={inputText}
                onChange={e => {
                  setInputText(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                placeholder={
                  inputModality !== 'text'
                    ? 'Speak your response (simulated)…'
                    : 'Explain your reasoning — don\'t just pick an option…'
                }
                className="flex-1 min-h-[42px] max-h-[160px] resize-none rounded-xl"
                disabled={isProcessing}
                rows={1}
              />

              <Button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isProcessing}
                size="icon"
                className="flex-shrink-0 h-10 w-10"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}

      {/* Read-only footer */}
      {isReadOnly && (
        <div className="bg-muted/30 border-t py-4 flex-shrink-0">
          <div className="max-w-3xl mx-auto px-4 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              This session ended on{' '}
              {session.endTime
                ? new Date(session.endTime).toLocaleString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : '—'}
            </p>
            <Button onClick={() => router.push('/session/new')} size="sm">
              Start new session
            </Button>
          </div>
        </div>
      )}

      {endedSession && (
        <PostSessionSummary
          session={endedSession}
          open={showSummary}
          onDashboard={() => router.push('/dashboard')}
          onNewSession={() => router.push('/session/new')}
        />
      )}
    </div>
  )
}

export default function SessionPage({ params }: PageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-lg bg-brand-gradient animate-pulse" />
      </div>
    }>
      <SessionContent params={params} />
    </Suspense>
  )
}

