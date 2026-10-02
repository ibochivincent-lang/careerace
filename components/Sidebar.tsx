'use client'

import { usePathname, useRouter } from 'next/navigation'
import {
  Settings,
  Database,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  Briefcase,
  Target,
  Sparkles,
  Award,
  Bell,
  CheckCircle2,
} from 'lucide-react'
import { cn } from './ui/utils'
import { ThemeToggle } from './ThemeToggle'
import { useSidebar } from './SidebarContext'

const NAV_ITEMS = [
  { label: 'Workspace',        href: '/dashboard',         icon: LayoutDashboard },
  { label: 'Applications',     href: '/application_board', icon: Briefcase },
  { label: 'Interview Room',   href: '/interview_room',    icon: Target },
  { label: 'Career Vault',     href: '/memory',            icon: Database },
  { label: 'AI Profiler & Chat', href: '/tutor',             icon: Sparkles },
  { label: 'Accomplishments',  href: '/progress',          icon: Award },
  { label: 'Notifications',    href: '/notifications',     icon: Bell },
]

function isActive(href: string, pathname: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname.startsWith(href.split('?')[0])
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { collapsed, toggle } = useSidebar()

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col fixed left-0 top-0 bottom-0 bg-sidebar border-r border-sidebar-border z-30 transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Header: Logo + Toggle */}
      <div
        className={cn(
          'flex items-center h-14 border-b border-sidebar-border flex-shrink-0 transition-all',
          collapsed ? 'justify-center px-2' : 'justify-between px-3.5'
        )}
      >
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2.5 text-left focus:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-card border border-border/70 shadow-sm flex items-center justify-center flex-shrink-0 p-1">
            <img src="/careerace_logo.png" alt="Career Ace Logo" className="w-full h-full object-contain dark:invert" />
          </div>
          {!collapsed && (
            <div>
              <span className="font-bold text-sm leading-none block text-sidebar-foreground">Career Ace</span>
              <span className="text-[10px] text-muted-foreground leading-none">AI Copilot</span>
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={toggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'p-1.5 rounded-lg text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors',
            collapsed && 'mt-1'
          )}
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = isActive(href, pathname)
          return (
            <button
              key={label}
              onClick={() => router.push(href)}
              title={collapsed ? label : undefined}
              className={cn(
                'w-full flex items-center rounded-lg text-sm font-medium transition-colors text-left relative',
                collapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2',
                active
                  ? 'bg-sidebar-accent text-sidebar-primary font-semibold'
                  : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground')} />
                {!collapsed && <span className="truncate">{label}</span>}
              </div>

              {!collapsed && active && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              )}
              {!collapsed && label === 'Notifications' && !active && (
                <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
              )}
              {collapsed && active && (
                <span className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="flex-shrink-0 border-t border-sidebar-border p-2.5 space-y-2">
        {/* Vault Status (only when expanded) */}
        {!collapsed && (
          <div className="px-3 py-2 rounded-lg border bg-card/60 text-xs">
            <div className="flex items-center gap-2 text-primary font-medium">
              <Database className="w-3.5 h-3.5" />
              <span>Walrus Vault</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Sui zkLogin &amp; AES-256-GCM</p>
          </div>
        )}

        {/* Settings + theme */}
        <div className={cn('flex items-center', collapsed ? 'flex-col gap-2' : 'justify-between px-1')}>
          <button
            onClick={() => router.push('/settings')}
            title="Settings"
            className={cn(
              'flex items-center gap-2 p-2 rounded-lg text-sm text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors',
              pathname === '/settings' && 'bg-sidebar-accent text-sidebar-primary'
            )}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="text-xs font-medium">Settings</span>}
          </button>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}
