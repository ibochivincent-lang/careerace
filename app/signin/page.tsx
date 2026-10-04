import Link from 'next/link'
import { Check } from 'lucide-react'
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
      {/* Brand Hero Panel: On mobile, displayed below the form or streamlined */}
      <div className="order-2 lg:order-1 flex flex-col justify-between border-t lg:border-t-0 lg:border-r bg-sidebar px-6 py-8 sm:px-10 sm:py-10 lg:px-14">
        <Link href="/" className="hidden lg:flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-card border border-border/70 shadow-sm p-1">
            <img src="/careerace_logo.png" alt="Career Ace Logo" className="w-full h-full object-contain dark:invert" />
          </span>
          <span className="text-lg font-bold">Career Ace</span>
        </Link>

        <div className="py-6 lg:py-12">
          <h1 className="max-w-[14ch] text-2xl sm:text-3xl lg:text-5xl font-bold leading-[1.1] tracking-tight">
            Autonomous AI <em className="italic text-primary">Career Copilot</em>.
          </h1>
          <p className="mt-3 sm:mt-5 max-w-[46ch] text-sm sm:text-base leading-relaxed text-muted-foreground">
            Universal job harvester, candidate fit scoring (1–10), tailored CVs & cover letters, and post-application STAR+R interview coaching.
          </p>
        </div>

        <ul className="flex flex-col gap-3">
          {PROMISES.map((p) => (
            <li key={p} className="flex items-start gap-3">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="text-xs sm:text-[13px] text-muted-foreground">{p}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Main Authentication Form Panel: Placed front and center on mobile */}
      <div className="order-1 lg:order-2 flex flex-col justify-center px-4 py-8 sm:px-8 lg:px-16">
        <div className="lg:hidden flex items-center justify-between pb-6 mb-2 border-b border-border/60">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-card border border-border/70 shadow-xs flex items-center justify-center p-1">
              <img src="/careerace_logo.png" alt="Career Ace Logo" className="w-full h-full object-contain dark:invert" />
            </div>
            <span className="font-bold text-base tracking-tight">Career Ace</span>
          </Link>
          <span className="text-[10px] font-mono uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
            Sovereign Auth
          </span>
        </div>

        <SignIn initialAddress={address} />
      </div>
    </div>
  )
}
