'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, MessageSquare, Sparkles, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function InterviewRoomPage() {
  const router = useRouter()
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  const sampleQuestion = {
    title: "Fullstack TypeScript Engineer @ Vercel Partner Agency",
    question: "Can you describe a challenging technical problem you solved using React and TypeScript at your previous role?"
  }

  function handleEvaluateAnswer() {
    if (!answer.trim()) return
    setFeedback(
      `Strong answer structure! You effectively identified the situation and technical bottlenecks. To maximize impact, highlight the quantitative result (e.g., 'reduced API response latency by 35%') early in your response.`
    )
  }

  return (
    <div className="min-h-screen bg-background p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.push('/application_board')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Post-Application Interview Room</h1>
          <p className="text-sm text-muted-foreground">Practice role-specific STAR+R questions tailored to your submitted applications.</p>
        </div>
      </div>

      <Card className="p-6 mb-6">
        <Badge variant="secondary" className="mb-3">Active Job Simulation</Badge>
        <h2 className="text-xl font-bold mb-2">{sampleQuestion.title}</h2>
        <p className="text-lg font-medium text-primary mb-4 p-4 bg-primary/5 rounded-lg border">
          "{sampleQuestion.question}"
        </p>

        <div className="space-y-4">
          <textarea
            className="w-full h-36 p-4 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Type your STAR+R answer (Situation, Task, Action, Result, Reflection)..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />

          <div className="flex justify-end">
            <Button onClick={handleEvaluateAnswer} disabled={!answer.trim()}>
              Evaluate Answer <Send className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </Card>

      {feedback && (
        <Card className="p-6 border-2 border-primary/30 bg-primary/5 animate-fade-in">
          <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> AI Interview Coach Feedback
          </h3>
          <p className="text-sm leading-relaxed">{feedback}</p>
        </Card>
      )}
    </div>
  )
}
