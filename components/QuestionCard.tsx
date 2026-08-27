import { BookOpen } from 'lucide-react'
import { cn } from './ui/utils'

interface QuestionCardProps {
  question: string
  options?: string[]
  subject?: string
  questionNumber?: number
  className?: string
}

export function QuestionCard({
  question,
  options,
  subject,
  questionNumber,
  className,
}: QuestionCardProps) {
  return (
    <div className={cn(
      'rounded-xl border-2 border-primary/20 bg-brand-50/60 dark:bg-brand-500/5 dark:border-primary/30 p-4',
      className
    )}>
      {/* Label row */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5 text-primary">
          <BookOpen className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold uppercase tracking-wide">
            {questionNumber ? `Question ${questionNumber}` : 'Current Question'}
            {subject && ` · ${subject}`}
          </span>
        </div>
      </div>

      {/* Question text */}
      <p className="text-sm font-medium leading-relaxed text-foreground mb-3">
        {question}
      </p>

      {/* Options */}
      {options && options.length > 0 && (
        <div className="grid grid-cols-1 gap-1.5">
          {options.map((opt, i) => (
            <div
              key={i}
              className="flex items-start gap-2 px-3 py-2 rounded-lg bg-white dark:bg-card border border-border/60 text-sm"
            >
              <span className="font-semibold text-primary flex-shrink-0 w-4">
                {String.fromCharCode(65 + i)}.
              </span>
              <span className="text-foreground/90">{opt.replace(/^[A-D]\.\s*/, '')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
