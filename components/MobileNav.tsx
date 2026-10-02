'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Briefcase, LayoutDashboard, Target, Database, Sparkles } from 'lucide-react'
import { cn } from './ui/utils'

const navItems = [
  { label: 'Workspace',    href: '/dashboard',         icon: Briefcase },
  { label: 'Applications', href: '/application_board', icon: LayoutDashboard },
  { label: 'Interview',    href: '/interview_room',    icon: Target },
  { label: 'Vault',        href: '/memory',            icon: Database },
  { label: 'Coach',        href: '/tutor',             icon: Sparkles },
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
      <div className="grid grid-cols-5 h-16">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = isActive(href, pathname)

          return (
            <button
              key={label}
              onClick={() => router.push(href)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 text-[9px] font-medium transition-colors',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className={cn('w-5 h-5', active && 'stroke-[2.5]')} />
              <span>{label}</span>
              {active && (
                <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
