import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Brain, Check } from 'lucide-react'
import { getOwnerAddress } from '@/lib/session.ts'
import { SignIn } from '@/components/SignIn'

export const dynamic = 'force-dynamic'

const PROMISES = [
  'Upload your CV once. It builds your private candidate vault on Walrus.',
  'Encrypted to your own Sui address via zkLogin, zero centralized data leaks.',
  'Autonomous job harvesting, fit score evaluation, and STAR+R interview preparation.',
]

export default async function SignInPage() {
  let address: string | null = null
  try {
    address = await getOwnerAddress()
  } catch (err) {
    console.warn('[signin] Session check warning:', err)
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="flex flex-col justify-between border-r bg-sidebar px-10 py-10 lg:px-14">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground font-bold">
            <Brain className="size-4 text-primary-foreground" />
          </span>
          <span className="text-lg font-bold">Career Ace</span>
        </Link>

        <div className="py-12">
          <h1 className="max-w-[14ch] text-4xl font-bold leading-[1.05] tracking-tight lg:text-5xl">
            Autonomous AI <em className="italic text-primary">Career Copilot</em>.
          </h1>
          <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-muted-foreground">
            Universal job harvester, candidate fit scoring (1–10), tailored CVs & cover letters, and post-application STAR+R interview coaching.
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
        <SignIn initialAddress={address} />
      </div>
    </div>
  )
}
