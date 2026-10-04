import { redirect } from 'next/navigation'
import { Database, ShieldCheck, Lock } from 'lucide-react'
import { getOwnerAddress } from '@/lib/session.ts'
import { listMemory } from '@/app/actions/memory'
import { AppShell } from '@/components/AppShell'
import { ResetVaultButton } from '@/components/ResetVaultButton'

export const dynamic = 'force-dynamic'

export default async function MemoryPage() {
  const address = await getOwnerAddress()
  if (!address) redirect('/signin')

  const empty = { active: [], superseded: [], retracted: [] }
  const { profile, feedback } = await listMemory().catch(() => ({ profile: empty, feedback: empty }))

  const activeCount = (profile.active?.length || 0) + (feedback.active?.length || 0)
  const supersededCount = (profile.superseded?.length || 0) + (feedback.superseded?.length || 0)
  const retractedCount = (profile.retracted?.length || 0) + (feedback.retracted?.length || 0)

  return (
    <AppShell>
      <div className="flex min-h-screen flex-col">
        <div className="mx-auto w-full max-w-4xl px-4 py-8 lg:px-8 space-y-8">
          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-6 pb-6 border-b border-border/80">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  Walrus Sovereign Protocol
                </span>
                <span className="font-mono text-xs text-muted-foreground">careerace:vault</span>
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                Your Sovereign Career Vault
              </h1>
              <p className="mt-2 max-w-[65ch] text-xs md:text-sm leading-relaxed text-muted-foreground">
                Verified work history, technical competencies, tailored CV versions, and interview performance records
                anchored to decentralized Walrus storage under your Sui zkLogin identity.
              </p>
            </div>

            <dl className="flex gap-6 pb-1">
              <div>
                <dd className="font-mono text-2xl font-bold tabular-nums text-foreground">{activeCount}</dd>
                <dt className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">Anchored</dt>
              </div>
              <div>
                <dd className="font-mono text-2xl font-bold tabular-nums text-emerald-500">{supersededCount}</dd>
                <dt className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">Versions</dt>
              </div>
              <div>
                <dd className="font-mono text-2xl font-bold tabular-nums text-destructive">{retractedCount}</dd>
                <dt className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">Retracted</dt>
              </div>
            </dl>
          </div>

          {/* Sovereign Vault Information Card */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-border/80 bg-card/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Client-Side Threshold Encryption</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All resume documents and sensitive career accomplishments are encrypted with AES-256-GCM before transmission. Only your sovereign key can unlock your records.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-border/80 bg-card/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Database className="w-4 h-4 text-emerald-500" />
                <span>Decentralized Walrus Availability</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Stored as high-reliability erasure-coded blobs across Mysten Labs Walrus storage nodes, guaranteeing data permanence and censorship resistance.
              </p>
            </div>
          </div>

          {/* Vault Management: Reset Vault Only */}
          <div className="pt-2">
            <ResetVaultButton />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
