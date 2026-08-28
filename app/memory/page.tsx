import { redirect } from 'next/navigation'
import { AlertTriangle, RotateCcw, Trash2, CornerDownRight } from 'lucide-react'
import { getOwnerAddress } from '@/lib/session.ts'
import { listMemory } from '@/app/actions/memory'
import { AppShell } from '@/components/AppShell'
import { MemoryHeader } from '@/components/MemoryHeader'
import { ForgetButton } from '@/components/ForgetButton'

export const dynamic = 'force-dynamic'

type Row = { date: string; kind: string; claim: string; distance: number }

function toRows(facts: { text: string; distance: number }[]): Row[] {
  return facts.map((f) => {
    const [date, kind, body] = f.text.split('|').map((p) => p.trim())
    return {
      date: date ?? '',
      kind: kind ?? 'fact',
      claim: (body ?? f.text).split(' - SUPERSEDES:')[0].trim(),
      distance: f.distance,
    }
  })
}

const KIND_COLOR: Record<string, string> = {
  misconception: 'var(--destructive)',
  weakness: 'var(--reward)',
  error_pattern: 'var(--reward)',
  mastery: 'var(--primary)',
  goal: 'var(--primary)',
  clearance: 'var(--primary)',
  preference: 'var(--muted-foreground)',
}

export default async function MemoryPage() {
  const address = await getOwnerAddress()
  if (!address) redirect('/signin')

  const empty = { active: [], superseded: [], retracted: [] }
  const { profile, feedback } = await listMemory().catch(() => ({ profile: empty, feedback: empty }))

  const active = [...toRows(profile.active), ...toRows(feedback.active)]
  const superseded = [...toRows(profile.superseded), ...toRows(feedback.superseded)]
  const retracted = [...toRows(profile.retracted), ...toRows(feedback.retracted)]

  return (
    <AppShell>
      <div className="flex min-h-screen flex-col">
        <MemoryHeader address={address} active="/memory" />

        <div className="mx-auto w-full max-w-5xl px-4 py-8 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Your learning record</h1>
              <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
                Everything the tutor can recall about you, and nothing it can&apos;t. Every entry is
                dated, so a newer fact always beats an older one.
              </p>
            </div>
            <dl className="flex gap-7 pb-1">
              <div>
                <dd className="font-mono text-2xl tabular-nums">{active.length}</dd>
                <dt className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Active</dt>
              </div>
              <div>
                <dd className="font-mono text-2xl tabular-nums text-reward">{superseded.length}</dd>
                <dt className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Superseded</dt>
              </div>
              <div>
                <dd className="font-mono text-2xl tabular-nums text-destructive">{retracted.length}</dd>
                <dt className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Retracted</dt>
              </div>
            </dl>
          </div>

          {/* the ledger */}
          <div className="mt-7 overflow-hidden rounded-xl border">
            <div className="grid grid-cols-[104px_120px_minmax(0,1fr)_88px_76px] gap-4 border-b bg-muted/40 px-4 py-2.5">
              {['Date', 'Kind', 'Fact', 'Distance', ''].map((h, i) => (
                <span key={i} className="text-[10px] uppercase tracking-wider text-muted-foreground">{h}</span>
              ))}
            </div>

            {active.length === 0 && superseded.length === 0 && retracted.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                Nothing stored yet. Work through a question with the tutor and it will appear here.
              </p>
            ) : (
              <>
                {active.map((r, i) => (
                  <div
                    key={`${r.date}-${r.claim}-${i}`}
                    className="grid grid-cols-[104px_120px_minmax(0,1fr)_88px_76px] items-center gap-4 border-b px-4 py-3.5 last:border-b-0"
                  >
                    <span className="font-mono text-xs text-muted-foreground">{r.date}</span>
                    <span
                      className="font-mono text-[10px] uppercase tracking-wider"
                      style={{ color: KIND_COLOR[r.kind] ?? 'var(--muted-foreground)' }}
                    >
                      {r.kind.replace(/_/g, ' ')}
                    </span>
                    <span className="min-w-0 break-words text-[13px]">{r.claim}</span>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {r.distance.toFixed(3)}
                    </span>
                    <ForgetButton claim={r.claim} />
                  </div>
                ))}

                {superseded.map((r, i) => (
                  <div key={`s-${r.date}-${r.claim}-${i}`} className="flex items-center gap-3 px-4 py-2.5 pl-[124px]">
                    <CornerDownRight className="size-3.5 shrink-0 text-reward" />
                    <span className="text-[13px] text-muted-foreground line-through">{r.claim}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{r.date} · superseded</span>
                  </div>
                ))}

                {retracted.map((r, i) => (
                  <div key={`r-${r.date}-${r.claim}-${i}`} className="flex items-center gap-3 px-4 py-2.5 pl-[124px]">
                    <Trash2 className="size-3.5 shrink-0 text-destructive" />
                    <span className="text-[13px] text-muted-foreground line-through">{r.claim}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {r.date} · retracted, never read again
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <section className="rounded-xl border border-reward/50 bg-reward/5 px-5 py-4">
              <h2 className="mb-2.5 flex items-center gap-2.5 text-sm font-medium">
                <AlertTriangle className="size-4 text-reward" />
                About forgetting
              </h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Forgetting writes a retraction that outranks the fact, so nothing can recall it
                again — not this app, not any agent holding your key. It is not deletion: there is
                no delete in Walrus Memory. The encrypted entry stays on Walrus, under keys only
                you hold, until its storage period expires. We won&apos;t pretend otherwise.
              </p>
            </section>

            <section className="rounded-xl border border-destructive/40 px-5 py-4">
              <h2 className="mb-2.5 flex items-center gap-2.5 text-sm font-medium">
                <RotateCcw className="size-4 text-destructive" />
                Revoke app access
              </h2>
              <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                Removes this app&apos;s delegate key from your account onchain, without asking the
                app. Only you can undo it. Be clear on what it does: revocation is forward-only.
                The key stops reading anything saved after you revoke it — but entries already
                saved stay readable to that key until they are re-encrypted. If you need those
                closed off too, retract them above.
              </p>
              <button
                type="button"
                className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/10"
              >
                Revoke delegate key
              </button>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
