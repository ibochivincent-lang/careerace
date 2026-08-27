'use client'

import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { EmptyState } from './EmptyState'
import { CheckCircle2, Clock } from 'lucide-react'
import { SUBJECTS_INFO } from '@/lib/mock-data'
import type { TopicRecord } from '@/lib/types'
import { cn } from './ui/utils'

interface TopicReviewQueueProps {
  topicRecords: Record<string, TopicRecord>
  className?: string
}

function urgencyLabel(days: number): { label: string; variant: 'overdue' | 'due' | 'completed' } {
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, variant: 'overdue' }
  if (days === 0) return { label: 'Due today', variant: 'due' }
  return { label: `In ${days}d`, variant: 'completed' }
}

export function TopicReviewQueue({ topicRecords, className }: TopicReviewQueueProps) {
  const router = useRouter()
  const now = new Date()

  const queue = Object.values(topicRecords)
    .map(record => {
      const reviewDate = new Date(record.nextReviewAt)
      const daysUntil = Math.ceil((reviewDate.getTime() - now.getTime()) / 86_400_000)
      return { record, daysUntil }
    })
    .filter(({ daysUntil }) => daysUntil <= 1)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5)

  if (queue.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle2 className="w-6 h-6" />}
        title="All caught up"
        description="No topics are due for review right now. Check back tomorrow."
        className={className}
      />
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {queue.map(({ record, daysUntil }) => {
        const info = SUBJECTS_INFO[record.subject]
        const { label, variant } = urgencyLabel(daysUntil)
        const confPct = Math.round(record.confidenceScore * 100)

        return (
          <div
            key={record.topic}
            className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:shadow-sm transition-shadow"
          >
            <span className="text-xl flex-shrink-0">{info.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium truncate">{record.topic}</p>
                <Badge variant={variant} className="text-[10px] flex-shrink-0">{label}</Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      confPct >= 70 ? 'bg-primary' : confPct >= 40 ? 'bg-orange-400' : 'bg-destructive'
                    )}
                    style={{ width: `${confPct}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">{confPct}%</span>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="flex-shrink-0 h-7 text-xs"
              onClick={() => router.push(`/session/new?subject=${record.subject}`)}
            >
              Review
            </Button>
          </div>
        )
      })}
    </div>
  )
}
