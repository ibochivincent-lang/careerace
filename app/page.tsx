'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  Brain, BookOpen, TrendingUp, Zap, ChevronRight,
  MessageSquare, CheckCircle2, Shield, Users
} from 'lucide-react'

// Static animated chat demo
const DEMO_EXCHANGE = [
  { role: 'ai',   text: 'A car of mass 1000 kg accelerates from rest to 20 m/s in 10 s.\nWhat is the net force acting on the car?\n\nA. 20,000 N\nB. 2,000 N\nC. 200 N\nD. 100 N' },
  { role: 'user', text: 'I think it\'s A — 20,000 N? Maybe because force = mass × velocity?' },
  { role: 'ai',   text: 'You said "I think" — let\'s unpack that uncertainty. What exactly does Newton\'s Second Law say? Force equals mass times what?' },
  { role: 'user', text: 'Oh — force equals mass times acceleration, not velocity!' },
  { role: 'ai',   text: 'Exactly. So now calculate the acceleration first. How fast is the car changing speed over those 10 seconds?' },
]

export default function WelcomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky Header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <Brain className="w-8 h-8 text-black dark:text-white" />
            </div>
            <span className="font-bold text-lg">ExamAce</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#exams" className="hover:text-foreground transition-colors">Exams</a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
              Sign in
            </Button>
            <Button size="sm" onClick={() => router.push('/dashboard')}>
              Get started
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div className="animate-slide-up">
            <Badge variant="brand" className="mb-5 gap-1.5">
              Built for JAMB · WAEC · NECO · Post-UTME
            </Badge>

            <h1 className="text-5xl font-bold leading-tight tracking-tight mb-5">
              Pass your exams.<br />
              <span className="text-primary">Don't just memorise.</span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
              ExamAce is the AI tutor that never gives you the answer.
              It asks questions that force you to <em>understand</em> — the exact way JAMB tests you.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="text-base px-7" onClick={() => router.push('/dashboard')}>
                Start studying free <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="lg" className="text-base" onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
              }}>
                See how it works
              </Button>
            </div>

            <div className="flex items-center gap-5 mt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Free to use
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                No signup required to try
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Nigerian curriculum
              </div>
            </div>
          </div>

          {/* Right — demo chat */}
          <div className="animate-slide-up delay-150">
            <div className="rounded-2xl border shadow-xl overflow-hidden bg-card">
              {/* Chrome bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/40">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <Badge variant="brand" className="text-[10px]">
                    <Zap className="w-2.5 h-2.5" /> Socratic AI · Physics Session
                  </Badge>
                </div>
              </div>

              {/* Messages */}
              <div className="p-4 space-y-3 max-h-80 overflow-hidden">
                {DEMO_EXCHANGE.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    style={{ animationDelay: `${i * 300}ms` }}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5 ${
                      msg.role === 'ai'
                        ? 'bg-brand-gradient text-white'
                        : 'bg-blue-500 text-white'
                    }`}>
                      {msg.role === 'ai' ? <Brain className="w-3 h-3" /> : 'U'}
                    </div>
                    <div className={`rounded-xl px-3 py-2 text-xs leading-relaxed max-w-[80%] whitespace-pre-line ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/70 text-foreground border border-border/40'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-4 pb-4">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-input-background border text-xs text-muted-foreground">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Type your reasoning...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Exam targets ─────────────────────────────────────── */}
      <section id="exams" className="border-y bg-muted/30 py-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-10">
            <span className="text-sm text-muted-foreground">Preparing students for:</span>
            {['JAMB / UTME', 'WAEC SSCE', 'NECO', 'Post-UTME'].map(exam => (
              <span key={exam} className="font-semibold text-sm text-foreground/80">{exam}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">Why ExamAce works</Badge>
          <h2 className="text-3xl font-bold">Built around how you actually learn</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Most apps give you answers. ExamAce builds the understanding you need to derive answers yourself under exam pressure.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <BookOpen className="w-5 h-5" />,
              color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300',
              title: 'Socratic Method',
              body: 'Never reveals the answer. Asks precisely targeted questions that expose the gap in your reasoning — the same cognitive skill JAMB tests.',
            },
            {
              icon: <Brain className="w-5 h-5" />,
              color: 'bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300',
              title: 'Cognitive Mapping',
              body: 'Tracks your misconceptions, confidence calibration, and error patterns per topic. Shows you exactly what to study and when.',
            },
            {
              icon: <TrendingUp className="w-5 h-5" />,
              color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300',
              title: 'Spaced Repetition',
              body: 'Reviews topics at the optimal interval based on your performance. You stop wasting time on what you know.',
            },
            {
              icon: <Zap className="w-5 h-5" />,
              color: 'bg-reward-100 text-reward-600 dark:bg-reward-500/20 dark:text-reward-400',
              title: 'JAMB Trap Taxonomy',
              body: 'Understands how JAMB constructs distractor options. Trains you to identify and resist trap answers — the #1 source of lost marks.',
            },
            {
              icon: <Shield className="w-5 h-5" />,
              color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300',
              title: 'Confidence Calibration',
              body: 'Detects hedge language ("I think", "maybe", "abi") to measure your true certainty. Corrects overconfidence before the exam does.',
            },
            {
              icon: <Users className="w-5 h-5" />,
              color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-300',
              title: 'Group Study (Coming)',
              body: 'Study in groups where the AI facilitates a shared Socratic session. Compare reasoning, compete, and learn together.',
            },
          ].map((f, i) => (
            <Card key={i} className="p-6 hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                {f.icon}
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ── JAMB Trap Taxonomy showcase ───────────────────────── */}
      <section className="bg-muted/30 border-y py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <Badge variant="destructive" className="mb-4">The JAMB Trap Problem</Badge>
            <h2 className="text-3xl font-bold">70% of wrong answers are from traps, not ignorance</h2>
            <p className="text-muted-foreground mt-3">
              JAMB deliberately constructs options to catch students who memorise without understanding.
              ExamAce trains you to see through them.
            </p>
          </div>

          <Card className="overflow-hidden">
            <div className="p-6 border-b">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Sample JAMB Physics question</p>
              <p className="font-medium mb-4">
                A car of mass 1000 kg accelerates from rest to 20 m/s in 10 seconds. What is the net force acting on the car?
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  { opt: 'A', text: '20,000 N', trap: true,  label: 'Trap — uses velocity instead of acceleration' },
                  { opt: 'B', text: '2,000 N',  trap: false, label: 'Correct — F = 1000 × (20÷10) = 2,000 N' },
                  { opt: 'C', text: '200 N',    trap: true,  label: 'Trap — drops a zero' },
                  { opt: 'D', text: '100 N',    trap: true,  label: 'Trap — divides mass by time' },
                ].map(o => (
                  <div
                    key={o.opt}
                    className={`flex items-start gap-2 p-2.5 rounded-lg text-xs border ${
                      o.trap
                        ? 'border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800'
                        : 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800'
                    }`}
                  >
                    <span className={`font-bold ${o.trap ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{o.opt}.</span>
                    <div>
                      <span className="font-semibold">{o.text}</span>
                      <p className={`mt-0.5 ${o.trap ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {o.trap ? '⚠ ' : '✓ '}{o.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-brand-50 dark:bg-brand-500/5">
              <p className="text-sm text-primary font-medium">
                ExamAce doesn't tell you the answer. It asks: "What does Newton's Second Law say force equals?" — making you derive it yourself, so you can never be trapped again.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Three steps to exam mastery</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Pick a subject and start', body: 'Choose Biology, Chemistry, Physics, Maths, English, or Economics. ExamAce picks a real exam-style question.' },
            { step: '02', title: 'Reason out loud — be wrong', body: 'Don\'t just pick an option. Explain your reasoning. The AI detects your confidence, identifies your specific misconception, and asks the question that breaks it.' },
            { step: '03', title: 'Your cognitive map grows', body: 'Every session updates your topic confidence map, error patterns, and review schedule. You always know exactly what to study next.' },
          ].map((s, i) => (
            <div key={i} className="relative">
              <div className="text-6xl font-black text-muted-foreground/20 mb-4 leading-none">{s.step}</div>
              <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="bg-brand-gradient py-20">
        <div className="max-w-2xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Your exam is closer than you think.</h2>
          <p className="text-white/80 text-lg mb-8">
            Every day you study with ExamAce, you're building the understanding that memorisation can't give you.
          </p>
          <Button
            size="lg"
            className="bg-background text-primary hover:bg-background/90 text-base px-8 font-semibold"
            onClick={() => router.push('/dashboard')}
          >
            Start your first session — it's free
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center">
              <Brain className="w-4.5 h-4.5 text-black dark:text-white" />
            </div>
            <span className="font-semibold text-foreground">ExamAce</span>
            <span>- Socratic AI for Nigerian students</span>
          </div>
          <div className="flex gap-4">
            <span>JAMB</span>
            <span>WAEC</span>
            <span>NECO</span>
            <span>Post-UTME</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
