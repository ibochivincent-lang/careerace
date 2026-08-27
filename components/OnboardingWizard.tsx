'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from './ui/dialog'
import { Button } from './ui/button'
import { Brain, ArrowRight, Check } from 'lucide-react'
import { cn } from './ui/utils'
import type { ExamTarget, Subject } from '@/lib/types'

interface OnboardingWizardProps {
  open: boolean
  onComplete: (data: { name: string; examTarget: ExamTarget; subjects: Subject[] }) => void
}

const EXAM_TARGETS: { value: ExamTarget; label: string; description: string; color: string }[] = [
  { value: 'JAMB',     label: 'JAMB',      description: 'Joint Admissions and Matriculation Board', color: 'border-blue-200 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' },
  { value: 'WAEC',     label: 'WAEC',      description: 'West African Examinations Council',         color: 'border-green-200 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300' },
  { value: 'NECO',     label: 'NECO',      description: 'National Examinations Council',             color: 'border-purple-200 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300' },
  { value: 'POST_UTME', label: 'Post-UTME', description: 'University post-admission screening',       color: 'border-orange-200 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300' },
]

const SUBJECTS: { value: Subject; label: string; icon: string }[] = [
  { value: 'biology',     label: 'Biology',     icon: '🧬' },
  { value: 'chemistry',   label: 'Chemistry',   icon: '⚗️' },
  { value: 'physics',     label: 'Physics',     icon: '⚡' },
  { value: 'mathematics', label: 'Mathematics', icon: '📐' },
  { value: 'english',     label: 'English',     icon: '📚' },
  { value: 'economics',   label: 'Economics',   icon: '💰' },
]

export function OnboardingWizard({ open, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [examTarget, setExamTarget] = useState<ExamTarget>('JAMB')
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>(['biology', 'chemistry', 'mathematics'])
  const [examDate, setExamDate] = useState('')

  const steps = ['Welcome', 'Exam Target', 'Subjects', 'Exam Date']

  const toggleSubject = (s: Subject) => {
    setSelectedSubjects(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  const handleComplete = () => {
    // Persist to localStorage (temporary until Convex is ready)
    localStorage.setItem('examace_user_name', name.trim() || 'Student')
    localStorage.setItem('examace_exam_target', examTarget)
    localStorage.setItem('examace_exam_name', examTarget === 'POST_UTME' ? 'Post-UTME' : examTarget)
    localStorage.setItem('examace_subjects', JSON.stringify(selectedSubjects))
    localStorage.setItem('examace_onboarding_done', 'true')
    if (examDate) {
      localStorage.setItem('examace_exam_date', examDate)
    }
    onComplete({ name: name.trim() || 'Student', examTarget, subjects: selectedSubjects })
  }

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-md p-0 overflow-hidden" onInteractOutside={e => e.preventDefault()}>
        {/* Progress bar */}
        <div className="flex gap-1 px-6 pt-5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 flex-1 rounded-full transition-all duration-300',
                i <= step ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>

        <div className="px-6 pt-4 pb-6">
          {/* Step 0: Welcome + Name */}
          {step === 0 && (
            <div className="animate-fade-in space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Welcome to ExamAce</h2>
                  <p className="text-sm text-muted-foreground">Let's set you up in 30 seconds</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">What should we call you?</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your first name"
                  className="w-full px-3 py-2.5 rounded-lg border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                  maxLength={40}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') setStep(1) }}
                />
              </div>

              <Button className="w-full" onClick={() => setStep(1)}>
                Let's go <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Step 1: Exam Target */}
          {step === 1 && (
            <div className="animate-fade-in space-y-4">
              <div>
                <h2 className="text-lg font-bold">Which exam are you preparing for?</h2>
                <p className="text-sm text-muted-foreground mt-0.5">ExamAce will tailor questions and traps for your target exam.</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {EXAM_TARGETS.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setExamTarget(t.value)}
                    className={cn(
                      'flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all',
                      examTarget === t.value
                        ? 'border-primary bg-brand-50 dark:bg-brand-500/10'
                        : 'border-border hover:border-border/80 bg-background'
                    )}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-bold text-sm">{t.label}</span>
                      {examTarget === t.value && (
                        <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground leading-tight">{t.description}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setStep(0)} className="flex-1">Back</Button>
                <Button onClick={() => setStep(2)} className="flex-1">
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Subjects */}
          {step === 2 && (
            <div className="animate-fade-in space-y-4">
              <div>
                <h2 className="text-lg font-bold">Which subjects are you studying?</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Select all that apply. You can change this later.</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {SUBJECTS.map(s => {
                  const selected = selectedSubjects.includes(s.value)
                  return (
                    <button
                      key={s.value}
                      onClick={() => toggleSubject(s.value)}
                      className={cn(
                        'flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-medium transition-all',
                        selected
                          ? 'border-primary bg-brand-50 dark:bg-brand-500/10 text-primary'
                          : 'border-border hover:border-border/80 text-muted-foreground'
                      )}
                    >
                      <span className="text-xl">{s.icon}</span>
                      {s.label}
                      {selected && (
                        <div className="w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {selectedSubjects.length === 0 && (
                <p className="text-xs text-destructive text-center">Select at least one subject.</p>
              )}

              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={selectedSubjects.length === 0}
                  className="flex-1"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Exam Date */}
          {step === 3 && (
            <div className="animate-fade-in space-y-5">
              <div>
                <h2 className="text-lg font-bold">When is your exam?</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  ExamAce will adjust your learning intensity as the date approaches.
                  You can skip this for now.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {examTarget === 'POST_UTME' ? 'Post-UTME' : examTarget} exam date
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={e => setExamDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2.5 rounded-lg border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                />
              </div>

              <div className="p-3 rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20">
                <p className="text-xs text-primary font-medium">
                  With an exam date set, ExamAce will:
                </p>
                <ul className="text-xs text-muted-foreground mt-1.5 space-y-0.5 list-disc list-inside">
                  <li>Show a daily countdown on your dashboard</li>
                  <li>Intensify review frequency inside 30 days</li>
                  <li>Prioritise your weakest topics automatically</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
                <Button onClick={handleComplete} className="flex-1">
                  <Check className="w-4 h-4" />
                  Start learning
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
