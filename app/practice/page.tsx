'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AppShell } from '@/components/AppShell'
import { Brain, ChevronRight, RotateCcw, CheckCircle2, XCircle, Trophy } from 'lucide-react'
import { PRACTICE_QUESTIONS, SUBJECTS_INFO } from '@/lib/mock-data'
import type { Subject } from '@/lib/types'
import { cn } from '@/components/ui/utils'

const ALL_SUBJECTS: Subject[] = ['biology', 'chemistry', 'physics', 'mathematics', 'english', 'economics']

type Phase = 'select' | 'question' | 'revealed' | 'done'

interface QuizState {
  subject: Subject
  questions: typeof PRACTICE_QUESTIONS['biology']
  currentIndex: number
  selectedOption: number | null
  score: number
  answers: boolean[]
}

const SUBJECT_COLORS: Record<Subject, string> = {
  biology:     'border-green-400 bg-green-50 dark:bg-green-950/20',
  chemistry:   'border-blue-400 bg-blue-50 dark:bg-blue-950/20',
  physics:     'border-purple-400 bg-purple-50 dark:bg-purple-950/20',
  mathematics: 'border-orange-400 bg-orange-50 dark:bg-orange-950/20',
  english:     'border-pink-400 bg-pink-50 dark:bg-pink-950/20',
  economics:   'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20',
}

export default function PracticePage() {
  const router = useRouter()
  const [phase, setPhase]     = useState<Phase>('select')
  const [quiz,  setQuiz]      = useState<QuizState | null>(null)
  const [timer, setTimer]     = useState(0)
  const [timerActive, setTimerActive] = useState(false)

  // Timer
  useEffect(() => {
    if (!timerActive) return
    const interval = setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [timerActive])

  const startQuiz = (subject: Subject) => {
    const questions = [...PRACTICE_QUESTIONS[subject]].sort(() => Math.random() - 0.5)
    setQuiz({
      subject,
      questions,
      currentIndex: 0,
      selectedOption: null,
      score: 0,
      answers: [],
    })
    setTimer(0)
    setTimerActive(true)
    setPhase('question')
  }

  const selectOption = (index: number) => {
    if (!quiz || phase === 'revealed') return
    setQuiz(prev => prev ? { ...prev, selectedOption: index } : prev)
  }

  const revealAnswer = () => {
    if (!quiz || quiz.selectedOption === null) return
    setTimerActive(false)
    setPhase('revealed')
  }

  const nextQuestion = () => {
    if (!quiz) return
    const correct = quiz.selectedOption === quiz.questions[quiz.currentIndex].correctIndex
    const newAnswers = [...quiz.answers, correct]
    const nextIndex = quiz.currentIndex + 1

    if (nextIndex >= quiz.questions.length) {
      setQuiz(prev => prev ? {
        ...prev,
        answers: newAnswers,
        score: newAnswers.filter(Boolean).length,
      } : prev)
      setPhase('done')
      return
    }

    setQuiz(prev => prev ? {
      ...prev,
      currentIndex: nextIndex,
      selectedOption: null,
      answers: newAnswers,
      score: newAnswers.filter(Boolean).length,
    } : prev)
    setTimer(0)
    setTimerActive(true)
    setPhase('question')
  }

  const restart = () => {
    setPhase('select')
    setQuiz(null)
    setTimer(0)
    setTimerActive(false)
  }

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  // ── Subject selector ──────────────────────────────────────────────────────
  if (phase === 'select') {
    return (
      <AppShell>
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-brand-gradient flex items-center justify-center md:hidden">
              <Brain className="w-3.5 h-3.5 text-white" />
            </div>
            <h1 className="font-semibold text-sm">Practice Mode</h1>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-1">Choose a subject</h2>
            <p className="text-muted-foreground text-sm">
              Test yourself with MCQ questions. Select an answer, then reveal to see the explanation.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ALL_SUBJECTS.map(subject => {
              const info = PRACTICE_QUESTIONS[subject]
              const subjectInfo = SUBJECTS_INFO[subject]
              return (
                <button
                  key={subject}
                  onClick={() => startQuiz(subject)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-5 rounded-2xl border-2 text-left transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0',
                    SUBJECT_COLORS[subject]
                  )}
                >
                  <span className="text-3xl">{subjectInfo.icon}</span>
                  <div>
                    <p className="font-semibold text-sm">{subjectInfo.name}</p>
                    <p className="text-xs text-muted-foreground">{info.length} questions</p>
                  </div>
                </button>
              )
            })}
          </div>

          <Card className="p-4 bg-brand-50/50 dark:bg-brand-500/5 border-brand-200 dark:border-brand-500/20">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-primary">How practice mode works:</span> Each question has 4 options. Select your answer, then click "Reveal Answer" to see if you were right — with a full explanation of the correct reasoning.
            </p>
          </Card>
        </div>
      </AppShell>
    )
  }

  // ── Done screen ──────────────────────────────────────────────────────────
  if (phase === 'done' && quiz) {
    const total   = quiz.questions.length
    const correct = quiz.answers.filter(Boolean).length
    const pct     = Math.round((correct / total) * 100)

    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-4 py-12 flex flex-col items-center gap-6 text-center">
          <div className="w-20 h-20 rounded-full bg-brand-gradient flex items-center justify-center">
            <Trophy className="w-10 h-10 text-white" />
          </div>

          <div>
            <h2 className="text-2xl font-bold">{pct}% Score</h2>
            <p className="text-muted-foreground mt-1">
              {correct} out of {total} correct · {SUBJECTS_INFO[quiz.subject].name}
            </p>
          </div>

          <Card className="w-full p-4 space-y-2">
            {quiz.questions.map((q, i) => (
              <div key={i} className="flex items-start gap-3 text-left">
                {quiz.answers[i]
                  ? <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  : <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />}
                <p className="text-xs text-muted-foreground leading-relaxed">{q.topic}</p>
              </div>
            ))}
          </Card>

          <div className="flex gap-3 w-full">
            <Button variant="outline" className="flex-1" onClick={restart}>
              <RotateCcw className="w-4 h-4" />
              Try again
            </Button>
            <Button className="flex-1" onClick={() => router.push('/dashboard')}>
              Dashboard
            </Button>
          </div>
        </div>
      </AppShell>
    )
  }

  // ── Question screen ──────────────────────────────────────────────────────
  if (!quiz) return null
  const q          = quiz.questions[quiz.currentIndex]
  const isRevealed = phase === 'revealed'
  const isCorrect  = quiz.selectedOption === q.correctIndex

  return (
    <AppShell>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">{SUBJECTS_INFO[quiz.subject].icon}</span>
            <div>
              <h1 className="font-semibold text-sm">{SUBJECTS_INFO[quiz.subject].name} Practice</h1>
              <p className="text-[10px] text-muted-foreground">
                Q{quiz.currentIndex + 1} / {quiz.questions.length} · Score: {quiz.score}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="muted" className="font-mono text-xs tabular-nums">
              {formatTime(timer)}
            </Badge>
            <button onClick={restart} className="text-muted-foreground hover:text-foreground transition-colors">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${((quiz.currentIndex) / quiz.questions.length) * 100}%` }}
        />
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Topic badge */}
        <Badge variant="secondary" className="text-xs">{q.topic}</Badge>

        {/* Question */}
        <Card className="p-5">
          <p className="text-base font-medium leading-relaxed">{q.question}</p>
        </Card>

        {/* Options */}
        <div className="space-y-2.5">
          {q.options.map((option, i) => {
            const isSelected = quiz.selectedOption === i
            const isRight    = i === q.correctIndex

            let optionClass = 'border-border bg-card hover:border-primary/50 hover:bg-muted/40'
            if (isRevealed) {
              if (isRight) {
                optionClass = 'border-green-500 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200'
              } else if (isSelected && !isRight) {
                optionClass = 'border-destructive bg-red-50 dark:bg-red-950/30 text-destructive'
              } else {
                optionClass = 'border-border bg-card opacity-50'
              }
            } else if (isSelected) {
              optionClass = 'border-primary bg-brand-50 dark:bg-brand-500/10'
            }

            return (
              <button
                key={i}
                onClick={() => selectOption(i)}
                disabled={isRevealed}
                className={cn(
                  'w-full text-left p-4 rounded-xl border-2 text-sm font-medium transition-all',
                  optionClass
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0',
                    isRevealed && isRight ? 'border-green-500 bg-green-500 text-white' :
                    isRevealed && isSelected ? 'border-destructive bg-destructive text-white' :
                    isSelected ? 'border-primary bg-primary text-white' : 'border-border'
                  )}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {option}
                </div>
              </button>
            )
          })}
        </div>

        {/* Reveal / explanation */}
        {!isRevealed ? (
          <Button
            className="w-full"
            onClick={revealAnswer}
            disabled={quiz.selectedOption === null}
          >
            Reveal Answer
          </Button>
        ) : (
          <div className="space-y-4">
            {/* Result banner */}
            <div className={cn(
              'flex items-center gap-3 p-4 rounded-xl border',
              isCorrect
                ? 'border-green-300 bg-green-50 dark:bg-green-950/20'
                : 'border-red-300 bg-red-50 dark:bg-red-950/20'
            )}>
              {isCorrect
                ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                : <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
              <p className={cn(
                'text-sm font-semibold',
                isCorrect ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
              )}>
                {isCorrect ? 'Correct!' : 'Not quite — here\'s why:'}
              </p>
            </div>

            {/* Explanation */}
            <Card className="p-4 bg-muted/40">
              <p className="text-xs font-semibold text-primary mb-1.5">Explanation</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{q.explanation}</p>
            </Card>

            <Button className="w-full" onClick={nextQuestion}>
              {quiz.currentIndex + 1 >= quiz.questions.length ? 'See Results' : 'Next Question'}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  )
}
