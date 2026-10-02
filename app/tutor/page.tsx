import { redirect } from 'next/navigation'
import { getOwnerAddress } from '@/lib/session.ts'
import { recallCareerProfile, recallCareerCoaching, resolveConflicts } from '@/lib/memory_contract.ts'
import { AppShell } from '@/components/AppShell'
import { MemoryHeader } from '@/components/MemoryHeader'
import { MemoryChat } from '@/components/MemoryChat'
import { MemoryRail, type RailFact } from '@/components/MemoryRail'

export const dynamic = 'force-dynamic'

function toRail(facts: { text: string }[], superseded = false): RailFact[] {
  return facts.map((f) => {
    const [date, kind, body] = f.text.split('|').map((p) => p.trim())
    return {
      date: date ?? '',
      kind: (kind ?? 'fact') as RailFact['kind'],
      claim: (body ?? f.text).split(' - SUPERSEDES:')[0].trim(),
      superseded,
    }
  })
}

export default async function TutorPage() {
  const address = await getOwnerAddress()
  if (!address) redirect('/signin')

  // One recall per page load, both namespaces in parallel — never per component.
  const [profile, feedback] = await Promise.all([
    recallCareerProfile(address).catch(() => []),
    recallCareerCoaching(address).catch(() => []),
  ])

  const p = resolveConflicts(profile)
  const f = resolveConflicts(feedback)
  const facts = [
    ...toRail(p.active),
    ...toRail(f.active),
    ...toRail([...p.superseded, ...f.superseded], true),
  ]

  return (
    <AppShell>
      <div className="flex min-h-screen flex-col">
        <MemoryHeader address={address} active="/tutor" />
        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_320px]">
          <MemoryChat />
          <MemoryRail facts={facts} />
        </div>
      </div>
    </AppShell>
  )
}
