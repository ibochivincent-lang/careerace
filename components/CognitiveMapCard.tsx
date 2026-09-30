import { Card } from './ui/card'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import type { TopicRecord } from '@/lib/types'
import { SUBJECTS_INFO } from '@/lib/mock_data'

interface CognitiveMapCardProps {
  topicRecord: TopicRecord
}

const ERROR_LABELS: Record<string, string> = {
  conceptual_misconception: 'Wrong concept',
  procedural_error:         'Method error',
  unit_confusion:           'Unit mix-up',
  sign_error:               'Sign error',
  formula_misapplication:   'Wrong formula',
  distractor_susceptibility:'Trap-prone',
  language_barrier:         'Language gap',
  recall_gap:               'Memory gap',
}

export function CognitiveMapCard({ topicRecord }: CognitiveMapCardProps) {
  const isOverdue = new Date(topicRecord.nextReviewAt) < new Date()
  const confidencePercent = Math.round(topicRecord.confidenceScore * 100)
  const successRate = topicRecord.attemptCount > 0
    ? Math.round((topicRecord.correctCount / topicRecord.attemptCount) * 100)
    : 0
  const subjectInfo = SUBJECTS_INFO[topicRecord.subject]

  return (
    <Card className="p-4 hover:shadow-sm transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{subjectInfo.icon}</span>
          <div>
            <h4 className="font-semibold text-sm leading-tight">{topicRecord.topic}</h4>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">{subjectInfo.name}</p>
          </div>
        </div>
        {isOverdue && <Badge variant="overdue">Overdue</Badge>}
      </div>

      {/* Progress bars */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-muted-foreground">Confidence</span>
            <span className="text-xs font-semibold text-primary">{confidencePercent}%</span>
          </div>
          <Progress value={confidencePercent} className="h-1.5" />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-muted-foreground">Success rate</span>
            <span className="text-xs font-semibold">{successRate}%</span>
          </div>
          <Progress value={successRate} className="h-1.5" />
        </div>
      </div>

      {/* Error types */}
      {topicRecord.errorTypes.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mt-3">
          {topicRecord.errorTypes.map((error, i) => (
            <Badge key={i} variant="muted" className="text-[10px]">
              {ERROR_LABELS[error] ?? error.replace(/_/g, ' ')}
            </Badge>
          ))}
        </div>
      )}

      {/* Footer stats */}
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
        <div>
          <span className="block text-[10px] uppercase tracking-wide">Attempts</span>
          <span className="font-semibold text-foreground">{topicRecord.attemptCount}</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-wide">Correct</span>
          <span className="font-semibold text-foreground">
            {topicRecord.correctCount}/{topicRecord.attemptCount}
          </span>
        </div>
      </div>
    </Card>
  )
}
