'use client'

import { useState, Suspense } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Settings,
  Database,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  Briefcase,
  Target,
  Sparkles,
  Compass,
  Bell,
  FileText,
  Mail,
  Cpu,
} from 'lucide-react'
import { cn } from './ui/utils'
import { ThemeToggle } from './ThemeToggle'
import { useSidebar } from './SidebarContext'
import { ComingSoonModal, type ComingSoonFeature } from './ComingSoonModal'

function SidebarContent() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams?.get('tab') || 'overview'
  const { collapsed, toggle } = useSidebar()
  const [comingSoonFeature, setComingSoonFeature] = useState<ComingSoonFeature | null>(null)

  const MAIN_NAV = [
    { label: 'Overview', href: '/dashboard?tab=overview', icon: LayoutDashboard, active: pathname === '/dashboard' && currentTab === 'overview' },
    { label: 'Resume', href: '/dashboard?tab=resumes', icon: FileText, active: pathname === '/dashboard' && (currentTab === 'resumes' || currentTab === 'tailored') },
    { label: 'Cover Letters', href: '/cover_letter', icon: Mail, active: pathname.startsWith('/cover_letter') || (pathname === '/dashboard' && currentTab === 'cover_letters') },
    { label: 'Job Board', href: '/application_board', icon: Briefcase, active: pathname.startsWith('/application_board') },
  ]

  const PROFILE_NAV = [
    {
      label: 'LinkedIn',
      onClick: () => setComingSoonFeature('linkedin'),
      icon: () => (
        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
        </svg>
      ),
      active: false
    },
  ]

  const TOOLS_NAV = [
    {
      label: 'Interview Room',
      onClick: () => setComingSoonFeature('interview_room'),
      icon: Target,
      active: false,
    },
    {
      label: 'Career Pathway',
      onClick: () => setComingSoonFeature('career_pathway'),
      icon: Compass,
      active: false,
    },
    {
      label: 'Notifications',
      href: '/notifications',
      icon: Bell,
      active: pathname.startsWith('/notifications')
    },
    {
      label: 'System Design',
      href: '/architecture',
      icon: Cpu,
      active: pathname === '/architecture'
    },
  ]

  const ACCOUNT_NAV = [
    { label: 'Settings & Vault', href: '/settings', icon: Settings, active: pathname === '/settings' },
  ]

  return (
    <>
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
            className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-card border border-border/70 shadow-sm flex items-center justify-center flex-shrink-0 p-1">
              <img src="/careerace_logo.png" alt="Career Ace Logo" className="w-full h-full object-contain dark:invert" />
            </div>
            {!collapsed && (
              <div>
                <span className="font-bold text-sm leading-none block text-sidebar-foreground">Career Ace</span>
                <span className="text-xs text-muted-foreground leading-none">AI Copilot</span>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={toggle}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'p-1.5 rounded-lg text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors cursor-pointer',
              collapsed && 'mt-1'
            )}
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-2 space-y-4 overflow-y-auto">
          {/* Main Workspace Navigation */}
          <div className="space-y-1">
            {MAIN_NAV.map(({ label, href, icon: Icon, active }) => (
              <button
                key={label}
                onClick={() => router.push(href)}
                title={collapsed ? label : undefined}
                className={cn(
                  'w-full flex items-center rounded-lg text-sm font-medium transition-colors text-left relative cursor-pointer',
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
                {collapsed && active && (
                  <span className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>

          {/* Profiles Section (LinkedIn with Coming Soon) */}
          <div className="space-y-1 pt-2 border-t border-sidebar-border/60">
            {!collapsed && (
              <div className="px-3 pb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                Profiles
              </div>
            )}
            {PROFILE_NAV.map(({ label, onClick, icon: Icon, active }) => (
              <button
                key={label}
                onClick={onClick}
                title={collapsed ? label : undefined}
                className={cn(
                  'w-full flex items-center rounded-lg text-sm font-medium transition-colors text-left relative cursor-pointer',
                  collapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2',
                  active
                    ? 'bg-sidebar-accent text-sidebar-primary font-semibold'
                    : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon />
                  {!collapsed && (
                    <div className="flex items-center justify-between w-full pr-1">
                      <span className="truncate">{label}</span>
                      <span className="text-[9px] font-mono uppercase bg-muted/80 text-muted-foreground px-1.5 py-0.5 rounded">Soon</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Tools & Progression */}
          <div className="space-y-1 pt-2 border-t border-sidebar-border/60">
            {!collapsed && (
              <div className="px-3 pb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                Progression
              </div>
            )}
            {TOOLS_NAV.map((item) => {
              const Icon = item.icon
              const isComingSoon = 'onClick' in item && Boolean(item.onClick)
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    if (isComingSoon && item.onClick) {
                      item.onClick()
                    } else if ('href' in item && item.href) {
                      router.push(item.href)
                    }
                  }}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'w-full flex items-center rounded-lg text-sm font-medium transition-colors text-left relative cursor-pointer',
                    collapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2',
                    item.active
                      ? 'bg-sidebar-accent text-sidebar-primary font-semibold'
                      : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  )}
                  aria-current={item.active ? 'page' : undefined}
                >
                  <div className="flex items-center gap-2.5 min-w-0 w-full">
                    <Icon className={cn('w-4 h-4 shrink-0', item.active ? 'text-primary' : 'text-muted-foreground')} />
                    {!collapsed && (
                      <div className="flex items-center justify-between flex-1 pr-1">
                        <span className="truncate">{item.label}</span>
                        {isComingSoon && (
                          <span className="text-[9px] font-mono uppercase bg-muted/80 text-muted-foreground px-1.5 py-0.5 rounded">Soon</span>
                        )}
                      </div>
                    )}
                  </div>
                  {!collapsed && item.active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Account Section */}
          <div className="space-y-1 pt-2 border-t border-sidebar-border/60">
            {!collapsed && (
              <div className="px-3 pb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                Account &amp; Vault
              </div>
            )}
            {ACCOUNT_NAV.map(({ label, href, icon: Icon, active }) => (
              <button
                key={label}
                onClick={() => router.push(href)}
                title={collapsed ? label : undefined}
                className={cn(
                  'w-full flex items-center rounded-lg text-sm font-medium transition-colors text-left relative cursor-pointer',
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
              </button>
            ))}
          </div>
        </nav>

        {/* Footer / Account / Theme */}
        <div className="p-3 border-t border-sidebar-border flex-shrink-0 space-y-2">
          {/* Theme Toggle */}
          <div className={cn('flex items-center', collapsed ? 'justify-center' : 'justify-between px-1')}>
            {!collapsed && <span className="text-xs text-muted-foreground font-medium">Theme Mode</span>}
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Global Coming Soon Dialog */}
      <ComingSoonModal
        open={comingSoonFeature !== null}
        onOpenChange={(open) => !open && setComingSoonFeature(null)}
        feature={comingSoonFeature}
      />
    </>
  )
}

export function Sidebar() {
  return (
    <Suspense fallback={<aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 bg-sidebar border-r border-sidebar-border z-30 w-60" />}>
      <SidebarContent />
    </Suspense>
  )
}
