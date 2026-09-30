'use client'

import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { ArrowRight } from 'lucide-react'
import { cn } from './ui/utils'
import type { Subject } from '@/lib/types'
import { SUBJECTS_INFO } from '@/lib/mock_data'

interface SubjectCardProps {
  subject: Subject
  topicCount: number
  dueTopics: number
  onClick: () => void
}

const SUBJECT_ACCENTS: Record<Subject, { border: string; bg: string; iconBg: string }> = {
  biology:     { border: 'border-l-emerald-400',  bg: 'hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20',  iconBg: 'bg-emerald-100 dark:bg-emerald-900/40'  },
  chemistry:   { border: 'border-l-blue-400',     bg: 'hover:bg-blue-50/50 dark:hover:bg-blue-950/20',        iconBg: 'bg-blue-100 dark:bg-blue-900/40'         },
  physics:     { border: 'border-l-purple-400',   bg: 'hover:bg-purple-50/50 dark:hover:bg-purple-950/20',    iconBg: 'bg-purple-100 dark:bg-purple-900/40'     },
  mathematics: { border: 'border-l-orange-400',   bg: 'hover:bg-orange-50/50 dark:hover:bg-orange-950/20',   iconBg: 'bg-orange-100 dark:bg-orange-900/40'     },
  english:     { border: 'border-l-pink-400',     bg: 'hover:bg-pink-50/50 dark:hover:bg-pink-950/20',        iconBg: 'bg-pink-100 dark:bg-pink-900/40'         },
  economics:   { border: 'border-l-yellow-400',   bg: 'hover:bg-yellow-50/50 dark:hover:bg-yellow-950/20',   iconBg: 'bg-yellow-100 dark:bg-yellow-900/40'     },
}

export function SubjectCard({ subject, topicCount, dueTopics, onClick }: SubjectCardProps) {
  const info = SUBJECTS_INFO[subject]
  const accent = SUBJECT_ACCENTS[subject]

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      className={cn(
        'p-5 cursor-pointer transition-all duration-200 border-l-4 group',
        'hover:shadow-md hover:-translate-y-0.5',
        accent.border,
        accent.bg
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0', accent.iconBg)}>
            {info.icon}
          </div>
          <div>
            <h3 className="font-semibold text-sm">{info.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {topicCount} topic{topicCount !== 1 ? 's' : ''} tracked
            </p>
          </div>
        </div>

        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
      </div>

      {dueTopics > 0 && (
        <div className="mt-3 pt-3 border-t border-border/40">
          <Badge variant="due" className="gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            {dueTopics} due for review
          </Badge>
        </div>
      )}
    </Card>
  )
}
