import { cn } from './ui/utils'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Brain } from 'lucide-react'
import type { Message, ConfidenceLevel } from '@/lib/types'

interface ChatMessageProps {
  message: Message
}

const CONFIDENCE_BADGE: Record<ConfidenceLevel, { variant: 'high' | 'medium' | 'low' | 'guessing'; label: string }> = {
  high:     { variant: 'high',     label: 'High confidence'   },
  medium:   { variant: 'medium',   label: 'Some uncertainty'  },
  low:      { variant: 'low',      label: 'Uncertain'         },
  guessing: { variant: 'guessing', label: 'Guessing'          },
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const conf = message.confidenceLevel ? CONFIDENCE_BADGE[message.confidenceLevel] : null

  return (
    <div
      className={cn(
        'flex gap-3 mb-5 animate-slide-up',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <Avatar size="sm" className="flex-shrink-0 mt-0.5">
        {isUser ? (
          <AvatarFallback className="bg-blue-500 text-white font-bold text-[10px]">
            YOU
          </AvatarFallback>
        ) : (
          <AvatarFallback className="bg-brand-gradient">
            <Brain className="w-4 h-4 text-white" />
          </AvatarFallback>
        )}
      </Avatar>

      <div className={cn('flex flex-col max-w-[78%]', isUser ? 'items-end' : 'items-start')}>
        {/* Sender label */}
        <span className="text-[10px] font-medium text-muted-foreground mb-1 px-1">
          {isUser ? 'You' : 'Career Ace AI'}
        </span>

        {/* Bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-muted/70 dark:bg-muted/40 text-foreground rounded-tl-sm border border-border/40'
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>

          {/* Hedge words on user messages */}
          {isUser && message.hedgeWords && message.hedgeWords.length > 0 && (
            <div className="mt-2 pt-2 border-t border-primary-foreground/20">
              <p className="text-[11px] text-primary-foreground/70">
                Hedging detected: <span className="italic">{message.hedgeWords.join(', ')}</span>
              </p>
            </div>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-1 px-1 flex-wrap">
          <span className="text-[10px] text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString('en-NG', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {conf && isUser && (
            <Badge variant={conf.variant} className="text-[10px] py-0 px-1.5 h-4">
              {conf.label}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
