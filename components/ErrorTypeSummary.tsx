'use client'

import { ERROR_TYPE_INFO } from '@/lib/mock_data'
import type { ErrorType, CognitiveMap } from '@/lib/types'
import { cn } from './ui/utils'

interface ErrorTypeSummaryProps {
  cognitiveMap: CognitiveMap
  className?: string
}

export function ErrorTypeSummary({ cognitiveMap, className }: ErrorTypeSummaryProps) {
  // Count occurrences of each error type across all topic records
  const errorCounts: Record<string, number> = {}

  for (const record of Object.values(cognitiveMap.topicRecords)) {
    for (const err of record.errorTypes) {
      errorCounts[err] = (errorCounts[err] ?? 0) + 1
    }
  }

  const sorted = (Object.keys(ERROR_TYPE_INFO) as ErrorType[])
    .map(key => ({ key, count: errorCounts[key] ?? 0, info: ERROR_TYPE_INFO[key] }))
    .filter(e => e.count > 0)
    .sort((a, b) => b.count - a.count)

  if (sorted.length === 0) return null

  const maxCount = sorted[0].count

  return (
    <div className={cn('space-y-3', className)}>
      {sorted.map(({ key, count, info }) => {
        const isDominant = key === cognitiveMap.dominantErrorType
        const pct = Math.round((count / maxCount) * 100)

        return (
          <div
            key={key}
            className={cn(
              'rounded-xl border p-4 transition-colors',
              isDominant
                ? 'border-orange-300 bg-orange-50/60 dark:border-orange-800 dark:bg-orange-950/20'
                : 'bg-card'
            )}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0 mt-0.5">{info.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-semibold">{info.label}</h4>
                  {isDominant && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-200 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 font-medium">
                      Most frequent
                    </span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground flex-shrink-0">
                    {count} topic{count !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Frequency bar */}
                <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-2 mb-2">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      isDominant ? 'bg-orange-400' : 'bg-primary'
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">{info.description}</p>
                <p className="text-xs font-medium text-primary mt-1.5 leading-relaxed">
                  Tip: {info.tip}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
