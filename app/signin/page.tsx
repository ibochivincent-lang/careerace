import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Brain, Check } from 'lucide-react'
import { getOwnerAddress } from '@/lib/session.ts'
import { SignIn } from '@/components/SignIn'

export const dynamic = 'force-dynamic'

const PROMISES = [
  'Explain your confusion once. It never asks again.',
  'Encrypted to your own Sui address, not our database.',
  'Revoke this app onchain and the tutor goes blind.',
]

export default async function SignInPage() {
  if (await getOwnerAddress()) redirect('/tutor')

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="flex flex-col justify-between border-r bg-sidebar px-10 py-10 lg:px-14">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-brand-gradient">
            <Brain className="size-4 text-white" />
          </span>
          <span className="text-lg font-bold">ExamAce</span>
        </Link>

        <div className="py-12">
          <h1 className="max-w-[14ch] text-4xl font-bold leading-[1.05] tracking-tight lg:text-5xl">
            Never explain the same mistake <em className="italic text-primary">twice</em>.
          </h1>
          <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-muted-foreground">
            A Socratic tutor that remembers where you went wrong across every session — and a
            record you own outright, not one we keep for you.
          </p>
        </div>

        <ul className="flex flex-col gap-3.5">
          {PROMISES.map((p) => (
            <li key={p} className="flex items-start gap-3">
              <Check className="mt-px size-4 shrink-0 text-primary" />
              <span className="text-[13px] text-muted-foreground">{p}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col justify-center px-8 py-12 lg:px-16">
        <SignIn />
      </div>
    </div>
  )
}
