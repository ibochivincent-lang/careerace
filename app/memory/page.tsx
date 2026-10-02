import { redirect } from 'next/navigation'
import { AlertTriangle, RotateCcw, Trash2, CornerDownRight } from 'lucide-react'
import { getOwnerAddress } from '@/lib/session.ts'
import { listMemory } from '@/app/actions/memory'
import { AppShell } from '@/components/AppShell'
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
  experience: 'var(--primary)',
  education: '#38bdf8',
  skill: '#34d399',
  target_role: '#a78bfa',
  tailored_cv: '#f472b6',
  application: '#fbbf24',
  interview_feedback: 'var(--reward)',
  preference: 'var(--muted-foreground)',
  clearance: '#94a3b8',
  // legacy fallbacks
  misconception: 'var(--destructive)',
  weakness: 'var(--reward)',
  error_pattern: 'var(--reward)',
  mastery: 'var(--primary)',
  goal: '#a78bfa',
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
        <div className="mx-auto w-full max-w-5xl px-4 py-8 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  Walrus Memory
                </span>
                <span className="font-mono text-xs text-muted-foreground">careerace:profile</span>
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">Your Sovereign Career Vault</h1>
              <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-muted-foreground">
                Verified work history, competencies, tailored CV versions, and STAR+R interview coach records
                persisted on Walrus decentralized storage. Every entry is cryptographically sealed under your Sui zkLogin identity.
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
          <div className="mt-7 overflow-hidden rounded-xl border bg-card">
            <div className="grid grid-cols-[104px_140px_minmax(0,1fr)_88px_76px] gap-4 border-b bg-muted/40 px-4 py-2.5">
              {['Date', 'Kind', 'Career Record', 'Distance', ''].map((h, i) => (
                <span key={i} className="text-[10px] uppercase tracking-wider text-muted-foreground">{h}</span>
              ))}
            </div>

            {active.length === 0 && superseded.length === 0 && retracted.length === 0 ? (
              <div className="px-4 py-14 text-center">
                <p className="text-sm font-medium">Nothing stored in your Career Vault yet.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Upload your CV on the Job Engine or practice in the Interview Room to index your verified credentials on Walrus.
                </p>
              </div>
            ) : (
              <>
                {active.map((r, i) => (
                  <div
                    key={`${r.date}-${r.claim}-${i}`}
                    className="grid grid-cols-[104px_140px_minmax(0,1fr)_88px_76px] items-center gap-4 border-b px-4 py-3.5 last:border-b-0"
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
                About Sovereign Retractions
              </h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Forgetting writes an onchain retraction tombstone that outranks the fact, ensuring nothing can recall it
                again — not this app, not any external AI agent holding your delegate key. It is not deletion: there is
                no delete in Walrus Memory. The encrypted entry stays on Walrus, under keys only
                you hold, until its storage period expires.
              </p>
            </section>

            <section className="rounded-xl border border-destructive/40 px-5 py-4">
              <h2 className="mb-2.5 flex items-center gap-2.5 text-sm font-medium">
                <RotateCcw className="size-4 text-destructive" />
                Revoke App Access
              </h2>
              <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                Removes this app&apos;s delegate key from your Sui account onchain. Revocation is forward-only:
                the key stops reading anything saved after you revoke it, while previously saved entries remain readable
                to that key until re-encrypted. If you need older entries closed off, retract them above.
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
