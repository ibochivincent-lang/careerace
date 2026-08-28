import { ShieldCheck } from 'lucide-react'
import { cn } from './ui/utils'

export type RailFact = {
  date: string
  kind: 'misconception' | 'mastery' | 'weakness' | 'goal' | 'error_pattern' | 'preference' | 'clearance' | 'fact'
  claim: string
  superseded?: boolean
}

/**
 * The rail is the differentiating move: a chatbot has no reason to show what it
 * knows about you, a memory agent has every reason.
 */
const DOT: Record<string, string> = {
  misconception: 'var(--destructive)',
  weakness: 'var(--reward)',
  error_pattern: 'var(--reward)',
  mastery: 'var(--primary)',
  goal: 'var(--primary)',
  clearance: 'var(--primary)',
  preference: 'var(--muted-foreground)',
  fact: 'var(--muted-foreground)',
}

export function MemoryRail({ facts }: { facts: RailFact[] }) {
  const active = facts.filter((f) => !f.superseded)

  return (
    <aside className="hidden lg:flex flex-col gap-4 border-l bg-sidebar px-5 py-7">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          What it knows
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">{active.length}</span>
      </div>

      {facts.length === 0 ? (
        <p className="rounded-xl border border-dashed px-3 py-5 text-center text-xs leading-relaxed text-muted-foreground">
          Nothing yet. Tell it which exam you are sitting, or get one wrong, and it will appear here.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {facts.map((f, i) => (
            <li
              key={`${f.date}-${f.claim}-${i}`}
              className={cn('rounded-xl border bg-card px-3 py-2.5', f.superseded && 'opacity-55')}
            >
              <div className="mb-1.5 flex items-center gap-1.5">
                <span aria-hidden className="size-[5px] rounded-full" style={{ background: DOT[f.kind] ?? DOT.fact }} />
                <span
                  className="font-mono text-[9.5px] uppercase tracking-wider"
                  style={{ color: f.superseded ? 'var(--reward)' : DOT[f.kind] ?? DOT.fact }}
                >
                  {f.superseded ? 'superseded' : f.kind.replace(/_/g, ' ')}
                </span>
              </div>
              <p className={cn('text-[13px] leading-snug', f.superseded && 'text-muted-foreground line-through')}>
                {f.claim}
              </p>
              <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">{f.date}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="flex-1" />

      <div className="rounded-xl border p-3">
        <div className="mb-1.5 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">You own this record</span>
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Encrypted to your own address. This app is a delegate you can revoke.
        </p>
      </div>
    </aside>
  )
}
