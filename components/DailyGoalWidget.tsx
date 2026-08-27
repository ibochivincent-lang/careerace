'use client'

import { useState, useEffect } from 'react'
import { getDailyGoal } from '@/lib/storage'
import { Target } from 'lucide-react'
import { cn } from './ui/utils'

interface DailyGoalWidgetProps {
  className?: string
}

export function DailyGoalWidget({ className }: DailyGoalWidgetProps) {
  const [goal, setGoal] = useState(getDailyGoal())

  useEffect(() => {
    setGoal(getDailyGoal())
  }, [])

  const sessionPct  = Math.min((goal.completedSessions / goal.targetSessions) * 100, 100)
  const minutesPct  = Math.min((goal.completedMinutes / goal.targetMinutes) * 100, 100)
  const done        = goal.completedSessions >= goal.targetSessions

  return (
    <div className={cn('rounded-xl border bg-card p-4', className)}>
      <div className="flex items-center gap-2 mb-3">
        <div className={cn(
          'w-7 h-7 rounded-lg flex items-center justify-center',
          done ? 'bg-primary text-primary-foreground' : 'bg-brand-50 dark:bg-brand-500/10 text-primary'
        )}>
          <Target className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Today's Goal</h3>
          {done && <span className="text-[10px] text-primary font-medium">Completed!</span>}
        </div>
        <span className="text-[10px] text-muted-foreground">
          {new Date().toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })}
        </span>
      </div>

      <div className="space-y-2.5">
        {/* Sessions progress */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Sessions</span>
            <span className="font-medium">{goal.completedSessions} / {goal.targetSessions}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${sessionPct}%` }}
            />
          </div>
        </div>

        {/* Minutes progress */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Study time</span>
            <span className="font-medium">{goal.completedMinutes} / {goal.targetMinutes} min</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-500/70 transition-all duration-500"
              style={{ width: `${minutesPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
