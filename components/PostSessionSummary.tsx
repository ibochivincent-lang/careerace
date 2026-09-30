'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { CheckCircle2, MessageSquare, Brain, RotateCcw, LayoutDashboard } from 'lucide-react'
import type { Session } from '@/lib/types'
import { SUBJECTS_INFO } from '@/lib/mock_data'

interface PostSessionSummaryProps {
  session: Session
  open: boolean
  onDashboard: () => void
  onNewSession: () => void
}

export function PostSessionSummary({
  session,
  open,
  onDashboard,
  onNewSession,
}: PostSessionSummaryProps) {
  const subjectInfo = SUBJECTS_INFO[session.subject]
  const messageCount = session.messages.length
  const userMessages = session.messages.filter(m => m.role === 'user')

  const durationMs = session.endTime
    ? new Date(session.endTime).getTime() - new Date(session.startTime).getTime()
    : 0
  const durationMin = Math.max(1, Math.round(durationMs / 60000))

  // Confidence breakdown
  const confidenceCounts = { high: 0, medium: 0, low: 0, guessing: 0 }
  userMessages.forEach(m => {
    if (m.confidenceLevel) confidenceCounts[m.confidenceLevel]++
  })
  const totalWithConf = userMessages.length || 1
  const confidenceScore = Math.round(
    ((confidenceCounts.high * 1.0 + confidenceCounts.medium * 0.6 + confidenceCounts.low * 0.3) / totalWithConf) * 100
  )

  // Hedge rate
  const hedgeMessages = userMessages.filter(m => m.hedgeWords && m.hedgeWords.length > 0)
  const hedgeRate = Math.round((hedgeMessages.length / totalWithConf) * 100)

  const startDate = new Date(session.startTime).toLocaleString('en-NG', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-md" onInteractOutside={e => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center text-primary">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base">Session Complete</DialogTitle>
              <p className="text-xs text-muted-foreground">{startDate}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Subject + duration */}
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-muted/50">
          <span className="text-2xl">{subjectInfo.icon}</span>
          <div>
            <p className="font-semibold text-sm">{subjectInfo.name}</p>
            <p className="text-xs text-muted-foreground">{durationMin} min · {messageCount} messages</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
            <p className="text-2xl font-bold">{userMessages.length}</p>
            <p className="text-xs text-muted-foreground">responses given</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <Brain className="w-3.5 h-3.5" />
            </div>
            <p className="text-2xl font-bold">{durationMin}</p>
            <p className="text-xs text-muted-foreground">minutes studied</p>
          </div>
        </div>

        {/* Confidence score */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Session Confidence</span>
            <span className="font-bold text-primary">{confidenceScore}%</span>
          </div>
          <Progress value={confidenceScore} className="h-2" />
        </div>

        {/* Confidence breakdown */}
        {userMessages.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {confidenceCounts.high > 0 && (
              <Badge variant="high">{confidenceCounts.high} high confidence</Badge>
            )}
            {confidenceCounts.medium > 0 && (
              <Badge variant="medium">{confidenceCounts.medium} medium</Badge>
            )}
            {confidenceCounts.low > 0 && (
              <Badge variant="low">{confidenceCounts.low} uncertain</Badge>
            )}
            {confidenceCounts.guessing > 0 && (
              <Badge variant="guessing">{confidenceCounts.guessing} guessing</Badge>
            )}
          </div>
        )}

        {/* Hedge insight */}
        {hedgeRate > 40 && (
          <div className="rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900 p-3">
            <p className="text-xs font-medium text-orange-800 dark:text-orange-300">
              You hedged on {hedgeRate}% of responses — that signals uncertainty.
              Next session: explain your reasoning before picking an option.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onNewSession} className="flex-1">
            <RotateCcw className="w-4 h-4" />
            New session
          </Button>
          <Button onClick={onDashboard} className="flex-1">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
