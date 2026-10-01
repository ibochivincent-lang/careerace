'use client'

import { useState, useEffect } from 'react'
import { getStreak } from '@/lib/storage'
import { cn } from './ui/utils'
import { Flame } from 'lucide-react'

interface StreakCounterProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function StreakCounter({ className, size = 'md' }: StreakCounterProps) {
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    setStreak(getStreak())
  }, [])

  const sizeClasses = {
    sm: { wrap: 'gap-1',   flame: 'w-4 h-4', count: 'text-sm font-semibold', label: 'text-xs' },
    md: { wrap: 'gap-1.5', flame: 'w-5 h-5', count: 'text-lg font-bold',     label: 'text-xs' },
    lg: { wrap: 'gap-2',   flame: 'w-8 h-8', count: 'text-3xl font-bold',    label: 'text-sm' },
  }

  const s = sizeClasses[size]

  return (
    <div className={cn('flex flex-col items-center', s.wrap, className)}>
      <div className="flex items-center gap-1">
        <Flame
          className={cn(s.flame, streak > 0 ? 'text-amber-500' : 'text-muted-foreground opacity-40')}
          aria-label="streak flame"
        />
        <span className={cn(s.count, streak > 0 ? 'text-reward-600 dark:text-reward-400' : 'text-muted-foreground')}>
          {streak}
        </span>
      </div>
      <span className={cn(s.label, 'text-muted-foreground')}>day streak</span>
    </div>
  )
}
