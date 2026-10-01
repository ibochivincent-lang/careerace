'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AppShell } from '@/components/AppShell'
import { MemoryHeader } from '@/components/MemoryHeader'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Briefcase,
  Layers,
  Award,
  RefreshCw,
} from 'lucide-react'

interface QuestionItem {
  question_id: string
  category: string
  question_text: string
  suggested_star_angle?: {
    situation: string
    task: string
    action: string
    result: string
    reflection: string
  }
}

interface EvaluationResult {
  overall_score: number
  dimensions: {
    situation: { score: number; feedback: string }
    task: { score: number; feedback: string }
    action: { score: number; feedback: string }
    result: { score: number; feedback: string }
    reflection: { score: number; feedback: string }
  }
  strengths: string[]
  improvements: string[]
  coach_critique: string
}

export default function InterviewRoomPage() {
  const router = useRouter()
  const [address, setAddress] = useState<string>('')
  const [targetRole, setTargetRole] = useState('Senior Fullstack Engineer')
  const [company, setCompany] = useState('Tech Systems')
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const [vaultSaved, setVaultSaved] = useState(false)

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.address) {
          setAddress(data.address)
        }
      })
      .catch(() => {})
  }, [])

  async function loadQuestions(roleToUse = targetRole, companyToUse = company) {
    setIsLoadingQuestions(true)
    setEvaluation(null)
    setVaultSaved(false)
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application: {
            job_id: `job_${Date.now()}`,
            title: roleToUse,
            company: companyToUse,
            apply_url: 'https://example.com/apply',
            fit_score: 9,
            track: 'track_a_auto_apply',
            status: 'Applied',
            processed_at: new Date().toISOString(),
          },
        }),
      })
      const data = await res.json()
      if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestions(data.questions)
        setSelectedQuestionIndex(0)
        setAnswer('')
        toast.success(`Generated ${data.questions.length} role-specific STAR+R questions.`)
      }
    } catch (e) {
      toast.error('Failed to load interview questions.')
    } finally {
      setIsLoadingQuestions(false)
    }
  }

  useEffect(() => {
    loadQuestions()
  }, [])

  async function handleEvaluateAnswer() {
    const currentQ = questions[selectedQuestionIndex]
    if (!currentQ || !answer.trim()) return

    setIsEvaluating(true)
    setVaultSaved(false)
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate_answer',
          question: currentQ.question_text,
          answer: answer.trim(),
          application: {
            title: targetRole,
            company,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Evaluation failed')
        return
      }
      if (data.evaluation) {
        setEvaluation(data.evaluation)
        setVaultSaved(true)
        toast.success(`Evaluation complete: ${data.evaluation.overall_score}/10`)
      }
    } catch (e) {
      toast.error('Failed to evaluate STAR+R answer.')
    } finally {
      setIsEvaluating(false)
    }
  }

  const activeQuestion = questions[selectedQuestionIndex]

  return (
    <AppShell>
      <div className="flex min-h-screen flex-col">
        <MemoryHeader address={address || '0x0000...0000'} active="/interview_room" />

        <div className="mx-auto w-full max-w-5xl px-4 py-8 lg:px-10">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => router.push('/application_board')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    STAR+R Framework
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">Walrus Memory Backed</span>
                </div>
                <h1 className="mt-1 text-3xl font-bold tracking-tight">Post-Application Interview Room</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Simulate high-stakes technical & behavioral interview rounds tailored to your submitted applications.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Target Role"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="h-9 rounded-md border bg-background px-3 text-xs"
              />
              <input
                type="text"
                placeholder="Company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="h-9 w-32 rounded-md border bg-background px-3 text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadQuestions(targetRole, company)}
                disabled={isLoadingQuestions}
              >
                <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isLoadingQuestions ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>
            </div>
          </div>

          {/* Question selection pills */}
          {questions.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {questions.map((q, idx) => (
                <button
                  key={q.question_id || idx}
                  type="button"
                  onClick={() => {
                    setSelectedQuestionIndex(idx)
                    setEvaluation(null)
                    setVaultSaved(false)
                  }}
                  className={`rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    selectedQuestionIndex === idx
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted/40'
                  }`}
                >
                  Question {idx + 1}: {q.category.toUpperCase()}
                </button>
              ))}
            </div>
          )}

          {activeQuestion && (
            <Card className="mb-6 border bg-card p-6">
              <div className="mb-3 flex items-center justify-between">
                <Badge variant="secondary" className="capitalize">
                  {activeQuestion.category} Simulation
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Target: {targetRole} @ {company}
                </span>
              </div>

              <h2 className="mb-4 text-xl font-bold leading-snug">{activeQuestion.question_text}</h2>

              {activeQuestion.suggested_star_angle && (
                <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4 text-xs">
                  <div className="mb-2 flex items-center gap-1.5 font-semibold text-primary">
                    <HelpCircle className="h-4 w-4" /> STAR+R Guidance Framework
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                    <div>
                      <span className="font-semibold text-foreground">Situation: </span>
                      <span className="text-muted-foreground">{activeQuestion.suggested_star_angle.situation}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Task: </span>
                      <span className="text-muted-foreground">{activeQuestion.suggested_star_angle.task}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Action: </span>
                      <span className="text-muted-foreground">{activeQuestion.suggested_star_angle.action}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Result: </span>
                      <span className="text-muted-foreground">{activeQuestion.suggested_star_angle.result}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">+Reflection: </span>
                      <span className="text-muted-foreground">{activeQuestion.suggested_star_angle.reflection}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <textarea
                  className="h-44 w-full rounded-md border bg-background p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Structure your answer using Situation, Task, Action, Result, and Reflection..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Word Count: {answer.trim() ? answer.trim().split(/\s+/).length : 0}</span>
                  </div>
                  <Button onClick={handleEvaluateAnswer} disabled={!answer.trim() || isEvaluating}>
                    {isEvaluating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Evaluating...
                      </>
                    ) : (
                      <>
                        Evaluate Answer <Send className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {evaluation && (
            <Card className="border border-primary/30 bg-primary/5 p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-primary/20 pb-4">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-bold">
                    <Sparkles className="h-5 w-5 text-primary" /> AI Interview Coach Evaluation
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {evaluation.coach_critique}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-mono text-3xl font-extrabold text-primary">
                      {evaluation.overall_score}<span className="text-lg text-muted-foreground">/10</span>
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Overall Score</div>
                  </div>
                  {vaultSaved && (
                    <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Saved to Career Vault
                    </Badge>
                  )}
                </div>
              </div>

              {/* STAR+R Dimensions Grid */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {Object.entries(evaluation.dimensions).map(([key, dim]) => (
                  <div key={key} className="rounded-lg border bg-card p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{key}</span>
                      <span className="font-mono text-sm font-bold text-primary">{dim.score}/10</span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{dim.feedback}</p>
                  </div>
                ))}
              </div>

              {/* Strengths & Improvements */}
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> Demonstrated Strengths
                  </h4>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {evaluation.strengths.map((str, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-500">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4" /> Coaching Recommendations
                  </h4>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {evaluation.improvements.map((imp, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-500">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  )
}
