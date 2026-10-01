'use client'

import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, Target, TrendingUp, Bell,
  Settings, Brain, Sparkles, Database, Briefcase
} from 'lucide-react'
import { cn } from './ui/utils'
import { ThemeToggle } from './ThemeToggle'
import { useState, useEffect } from 'react'

const NAV_ITEMS = [
  { label: 'Job Engine & CV',  href: '/',                  icon: Briefcase },
  { label: 'Applications',     href: '/application_board', icon: LayoutDashboard },
  { label: 'Interview Room',   href: '/interview_room',    icon: Target },
  { label: 'Career Vault',     href: '/memory',            icon: Database },
  { label: 'Career Coach',     href: '/tutor',             icon: Sparkles },
  { label: 'Accomplishments',  href: '/progress',          icon: TrendingUp },
  { label: 'Notifications',    href: '/notifications',     icon: Bell },
]

function isActive(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname.startsWith(href.split('?')[0])
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-60 bg-sidebar border-r border-sidebar-border z-30">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-sidebar-border flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-card border border-border/70 shadow-sm flex items-center justify-center flex-shrink-0 p-1">
          <img src="/careerace_logo.png" alt="Career Ace Logo" className="w-full h-full object-contain dark:invert" />
        </div>
        <div>
          <span className="font-bold text-sm leading-none block text-sidebar-foreground">Career Ace</span>
          <span className="text-[10px] text-muted-foreground leading-none">by IboTV</span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = isActive(href, pathname)
          return (
            <button
              key={label}
              onClick={() => router.push(href)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
                active
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', active && 'stroke-[2.5]')} />
              {label}
              {label === 'Notifications' && (
                <span className="ml-auto w-2 h-2 rounded-full bg-destructive" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="flex-shrink-0 border-t border-sidebar-border p-3 space-y-3">
        {/* Vault Status */}
        <div className="px-3 py-2 rounded-lg border bg-card/60 text-xs">
          <div className="flex items-center gap-2 text-primary font-medium">
            <Database className="w-3.5 h-3.5" />
            <span>Walrus Vault</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">Sui zkLogin & AES-256-GCM</p>
        </div>

        {/* Settings + theme */}
        <div className="flex items-center justify-between px-1">
          <button
            onClick={() => router.push('/settings')}
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors',
              pathname === '/settings' && 'bg-sidebar-accent text-sidebar-primary'
            )}
          >
            <Settings className="w-4 h-4" />
            <span className="text-xs font-medium">Settings</span>
          </button>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}
