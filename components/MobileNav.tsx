'use client'

import { useRouter, usePathname } from 'next/navigation'
import { cn } from './ui/utils'

const navItems = [
  { label: 'Overview',     href: '/dashboard?tab=overview' },
  { label: 'Resumes',      href: '/dashboard?tab=resumes' },
  { label: 'Job Board',    href: '/application_board' },
  { label: 'Vault',        href: '/memory' },
  { label: 'Interview',    href: '/interview_room' },
]

function isActive(href: string, pathname: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname.startsWith(href.split('?')[0])
}

export function MobileNav() {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-5 h-14">
        {navItems.map(({ label, href }) => {
          const active = isActive(href, pathname)

          return (
            <button
              key={label}
              onClick={() => router.push(href)}
              className={cn(
                'relative flex items-center justify-center text-[11px] font-medium transition-colors px-1 text-center',
                active
                  ? 'text-primary font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
            >
              <span>{label}</span>
              {active && (
                <span className="absolute bottom-1 w-6 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
