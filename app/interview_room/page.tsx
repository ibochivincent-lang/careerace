'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AppShell } from '@/components/AppShell'
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
  Building2,
  Compass,
  Database,
  Bell,
  Target
} from 'lucide-react'
import { ComingSoonModal } from '@/components/ComingSoonModal'

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Technical Questions',
  behavioral: 'Behavioral Questions',
  architecture: 'Architectural Questions',
  leadership: 'Leadership & Experiential Questions',
  walrus_recall: 'Walrus Memory Recall',
}

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
  const [recalledMemories, setRecalledMemories] = useState<Array<{
    date: string
    kind: string
    insight: string
    distance: number
  }>>([])
  const [showComingSoon, setShowComingSoon] = useState(true)

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.address) {
          setAddress(data.address)
        }
      })
      .catch(() => {})

    let role = 'Candidate Professional'
    let comp = 'Target Employer'
    const storedSovereign = localStorage.getItem('careerace_sovereign_profile')
    const storedTitle = localStorage.getItem('careerace_target_title')
    const storedCv = localStorage.getItem('careerace_parsed_profile')

    if (storedSovereign) {
      try {
        const parsed = JSON.parse(storedSovereign)
        if (parsed.target_roles?.[0]) role = parsed.target_roles[0]
      } catch {}
    } else if (storedTitle && storedTitle.trim()) {
      role = storedTitle.trim()
    } else if (storedCv) {
      try {
        const parsed = JSON.parse(storedCv)
        if (parsed.target_roles?.[0]) role = parsed.target_roles[0]
      } catch {}
    }
    setTargetRole(role)
    setCompany(comp)
    loadQuestions(role, comp)
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
            apply_url: '',
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
        if (data.recalled_memories && data.recalled_memories.length > 0) {
          setRecalledMemories(data.recalled_memories)
          toast.success(`Recalled ${data.recalled_memories.length} coaching insights from Walrus Memory!`)
        } else {
          toast.success(`Generated ${data.questions.length} role-specific STAR+R questions.`)
        }
      }
    } catch (e) {
      toast.error('Failed to load interview questions.')
    } finally {
      setIsLoadingQuestions(false)
    }
  }

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
        <div className="mx-auto w-full max-w-4xl px-4 py-8 lg:px-6">
          {/* Prominent Coming Soon Hero Banner */}
          <div className="mb-6 p-5 sm:p-6 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-background to-emerald-500/10 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-foreground">Interview Simulation Room</h2>
                    <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-[10px]">
                      Coming Soon · Under Calibration
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Real-time STAR+R autonomous practice simulator with multi-modal voice rubrics and maritime/cloud question banks.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={() => setShowComingSoon(true)}
                  className="text-xs h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5 mr-1.5" />
                  Notify Me
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/application_board')}
                  className="text-xs h-8 px-3 border-border hover:bg-muted cursor-pointer"
                >
                  Return to Job Board
                </Button>
              </div>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
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
                <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight">Interview Simulation Room</h1>
                <p className="mt-1 text-xs md:text-sm text-muted-foreground">
                  Simulate high-stakes technical, behavioral, architectural, and leadership rounds.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Target Role"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="h-9 rounded-md border bg-background px-3 text-xs w-36 sm:w-44"
              />
              <input
                type="text"
                placeholder="Company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="h-9 w-28 sm:w-32 rounded-md border bg-background px-3 text-xs"
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

          {/* Prominently Written Target Role & Company */}
          <div className="rounded-xl border border-primary/25 bg-card/60 backdrop-blur p-4 mb-6 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Interview Preparation Target</div>
                  <div className="text-base font-bold text-foreground">
                    {targetRole} <span className="text-muted-foreground font-normal">at</span> <span className="text-primary">{company}</span>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="border-primary/30 text-primary w-fit text-xs px-2.5 py-0.5">
                Role Simulation Active
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t text-xs">
              <span className="text-muted-foreground mr-1 text-[11px]">Quick Switch Target:</span>
              {['Mysten Labs', 'Stripe', 'Google', 'Vercel', 'Anthropic'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCompany(c)
                    loadQuestions(targetRole, c)
                  }}
                  className={`px-2 py-0.5 rounded-md border text-[11px] transition-colors cursor-pointer ${
                    company === c ? 'bg-primary text-primary-foreground border-primary font-medium' : 'bg-background hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Walrus Memory Cross-Session Recall Banner */}
          {recalledMemories.length > 0 && (
            <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-background to-blue-950/40 p-4 mb-6 backdrop-blur shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                  <Database className="w-4 h-4 animate-pulse" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                        Cross-Session Sovereign Memory Active
                      </span>
                      <Badge variant="outline" className="border-cyan-500/40 bg-cyan-500/10 text-cyan-300 text-[10px] py-0">
                        MemWal Recalled
                      </Badge>
                    </div>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {recalledMemories.length} historical feedback items recovered
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    CareerAce has recalled your previous coaching performance from your encrypted Walrus Memory vault. 
                    Your interview session now targets your verified growth areas instead of generic questions.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {recalledMemories.slice(0, 3).map((m, i) => (
                      <div key={i} className="rounded-md border border-cyan-500/20 bg-background/60 px-3 py-1.5 text-[11px] text-foreground max-w-md">
                        <span className="font-semibold text-cyan-400">{m.kind.replace('_', ' ')}: </span>
                        <span className="text-muted-foreground">{m.insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Question selection pills (Technical, Behavioral, Architectural, Leadership & Experiential) */}
          {questions.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {questions.map((q, idx) => {
                const label = CATEGORY_LABELS[q.category?.toLowerCase()] || q.category
                const isWalrusRecall = q.category?.toLowerCase() === 'walrus_recall' || q.question_id?.includes('walrus')
                return (
                  <button
                    key={q.question_id || idx}
                    type="button"
                    onClick={() => {
                      setSelectedQuestionIndex(idx)
                      setEvaluation(null)
                      setVaultSaved(false)
                    }}
                    className={`rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-all ${
                      selectedQuestionIndex === idx
                        ? isWalrusRecall 
                          ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-xs'
                          : 'border-primary bg-primary/15 text-primary shadow-xs'
                        : isWalrusRecall
                          ? 'border-cyan-500/40 bg-cyan-950/30 text-cyan-400 hover:bg-cyan-900/40'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          )}

          {activeQuestion && (
            <Card className="mb-6 border bg-card p-6">
              <div className="mb-3 flex items-center justify-between">
                <Badge 
                  variant="secondary" 
                  className={activeQuestion.category?.toLowerCase() === 'walrus_recall' || activeQuestion.question_id?.includes('walrus') ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300 capitalize' : 'capitalize'}
                >
                  {CATEGORY_LABELS[activeQuestion.category?.toLowerCase()] || activeQuestion.category}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Target: {targetRole} @ {company}
                </span>
              </div>

              {(activeQuestion.category?.toLowerCase() === 'walrus_recall' || activeQuestion.question_id?.includes('walrus')) && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-300">
                  <Sparkles className="h-4 w-4 shrink-0 text-cyan-400" />
                  <span>
                    <strong>Walrus Memory Targeted Focus:</strong> This question specifically challenges you on growth areas identified in past interview sessions stored in your decentralized memory vault.
                  </span>
                </div>
              )}

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

      <ComingSoonModal
        open={showComingSoon}
        onOpenChange={setShowComingSoon}
        feature="interview_room"
      />
    </AppShell>
  )
}
