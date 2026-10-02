import { redirect } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { getOwnerAddress } from '@/lib/session.ts'
import { recallProfile, recallFeedback, resolveConflicts, claimsOfKind } from '@/lib/memory_contract.ts'
import { rankCoaches } from '@/lib/coaches.ts'
import { AppShell } from '@/components/AppShell'
import { MemoryHeader } from '@/components/MemoryHeader'
import { cn } from '@/components/ui/utils'

export const dynamic = 'force-dynamic'

export default async function CoachesPage() {
  const address = await getOwnerAddress()
  if (!address) redirect('/signin')

  const [profile, feedback] = await Promise.all([
    recallProfile(address, 'skills, target roles and technical areas').catch(() => []),
    recallFeedback(address, 'interview coaching and feedback').catch(() => []),
  ])

  const p = resolveConflicts(profile).active
  const f = resolveConflicts(feedback).active
  const ranked = rankCoaches(
    [...claimsOfKind(p, 'skill'), ...claimsOfKind(p, 'target_role'), ...claimsOfKind(p, 'weakness'), ...claimsOfKind(p, 'misconception')],
    [...claimsOfKind(f, 'interview_feedback'), ...claimsOfKind(f, 'error_pattern')],
  )
  const anyMatch = ranked.some((c) => c.score > 0)

  return (
    <AppShell>
      <div className="flex min-h-screen flex-col">
        <MemoryHeader address={address} active="/coaches" />

        <div className="mx-auto w-full max-w-4xl px-4 py-8 lg:px-10">
          <h1 className="text-3xl font-bold tracking-tight">Executive &amp; Technical Coaches</h1>
          <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
            {anyMatch
              ? 'Ranked from what your Career Ace copilot remembers — not from a search box you filled in. Stored on Walrus and owned by you.'
              : 'Unranked. Your career vault has no stored skill targets or coaching records yet, or access was revoked.'}
          </p>

          <ol className="mt-7 flex flex-col gap-3">
            {ranked.map((c, i) => (
              <li
                key={c.slug}
                className={cn(
                  'flex items-stretch gap-5 rounded-xl border px-5 py-5',
                  c.score > 0 ? 'border-primary/40 bg-secondary/40' : 'bg-card',
                )}
              >
                <div className="flex w-10 shrink-0 flex-col items-center gap-2.5">
                  <span className={cn('font-mono text-xl tabular-nums', c.score > 0 ? 'text-primary' : 'text-muted-foreground')}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span aria-hidden className="w-px flex-1 bg-border" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-xl font-semibold tracking-tight">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.role}</span>
                  </div>
                  <p className={cn('mt-2 text-[13px]', c.score > 0 ? 'text-muted-foreground' : 'text-muted-foreground/70')}>
                    {c.reason}
                  </p>
                </div>

                <div className="flex items-center">
                  <span
                    className={cn(
                      'rounded-lg px-4 py-2 text-[13px]',
                      c.score > 0 ? 'bg-primary text-primary-foreground' : 'border text-muted-foreground',
                    )}
                  >
                    Book
                  </span>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-6 flex items-start gap-3 rounded-xl border border-dashed px-5 py-4 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-px size-4 shrink-0" />
            Your record was never sent to these coaches. Ranking happens on your side, from memory
            you own.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
