'use client'

import { useState, Suspense } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Database,
  Menu,
  X,
  Mail,
  Target,
  Award,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  ShieldCheck
} from 'lucide-react'
import { cn } from './ui/utils'
import { signOutClient, getClientSessionAddress } from '@/lib/client_auth'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const PRIMARY_NAV: NavItem[] = [
  { label: 'Overview', href: '/dashboard?tab=overview', icon: LayoutDashboard },
  { label: 'Resumes', href: '/dashboard?tab=resumes', icon: FileText },
  { label: 'Jobs', href: '/application_board', icon: Briefcase },
  { label: 'Vault', href: '/memory', icon: Database },
]

const MORE_NAV: NavItem[] = [
  { label: 'Cover Letters', href: '/cover_letter', icon: Mail },
  { label: 'Interview Room', href: '/interview_room', icon: Target },
  { label: 'Accomplishments', href: '/progress', icon: Award },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Settings & Identity', href: '/settings', icon: Settings },
]

function MobileNavContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams?.get('tab') || 'overview'
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  function isItemActive(href: string): boolean {
    if (href.startsWith('/dashboard?tab=')) {
      const tab = href.split('tab=')[1]
      return pathname === '/dashboard' && currentTab === tab
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  async function handleSignOut() {
    setBusy(true)
    try {
      await signOutClient('/signin')
    } catch {
      setBusy(false)
    }
  }

  const sessionAddress = getClientSessionAddress()

  return (
    <>
      {/* Bottom Sticky Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border/80 md:hidden pb-[env(safe-area-inset-bottom,0px)]"
        aria-label="Mobile navigation"
      >
        <div className="grid grid-cols-5 h-16 items-center px-1">
          {PRIMARY_NAV.map(({ label, href, icon: Icon }) => {
            const active = isItemActive(href)
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setDrawerOpen(false)
                  router.push(href)
                }}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-1 px-1 h-full min-h-[44px] transition-colors relative',
                  active
                    ? 'text-primary font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className={cn('w-5 h-5 shrink-0 transition-transform', active && 'scale-110')} />
                <span className="text-[10px] tracking-tight leading-none">{label}</span>
                {active && (
                  <span className="absolute top-1 w-6 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            )
          })}

          {/* More Drawer Toggle */}
          <button
            type="button"
            onClick={() => setDrawerOpen((v) => !v)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-1 px-1 h-full min-h-[44px] transition-colors relative',
              drawerOpen || MORE_NAV.some((m) => isItemActive(m.href))
                ? 'text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-label="More navigation options"
            aria-expanded={drawerOpen}
          >
            {drawerOpen ? (
              <X className="w-5 h-5 shrink-0" />
            ) : (
              <Menu className="w-5 h-5 shrink-0" />
            )}
            <span className="text-[10px] tracking-tight leading-none">More</span>
            {MORE_NAV.some((m) => isItemActive(m.href)) && (
              <span className="absolute top-1.5 right-3 w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </button>
        </div>
      </nav>

      {/* Slide-Up Navigation Sheet / Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Sheet Drawer */}
          <div className="fixed bottom-0 left-0 right-0 max-h-[82vh] overflow-y-auto bg-card border-t border-border/90 rounded-t-3xl shadow-2xl p-5 pb-24 z-50 animate-in slide-in-from-bottom duration-200">
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between pb-3 border-b border-border/70">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-card border border-border/70 p-0.5 flex items-center justify-center">
                  <img src="/careerace_logo.png" alt="Career Ace Logo" className="w-full h-full object-contain dark:invert" />
                </div>
                <h3 className="font-bold text-sm tracking-tight">Career Ace Workspace</h3>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu Links */}
            <div className="py-3 space-y-1">
              {MORE_NAV.map(({ label, href, icon: Icon }) => {
                const active = isItemActive(href)
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setDrawerOpen(false)
                      router.push(href)
                    }}
                    className={cn(
                      'w-full flex items-center justify-between p-3 rounded-xl text-xs font-medium transition-all text-left min-h-[44px]',
                      active
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'text-foreground hover:bg-muted/70'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('p-1.5 rounded-lg', active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')}>
                        <Icon className="w-4 h-4 shrink-0" />
                      </div>
                      <span>{label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                  </button>
                )
              })}
            </div>

            {/* Account & Signout Block */}
            <div className="pt-3 border-t border-border/70 space-y-3">
              {sessionAddress && (
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    <span>Connected Identity</span>
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground break-all">
                    {sessionAddress}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleSignOut}
                disabled={busy}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-semibold text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors min-h-[44px] disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                <span>{busy ? 'Signing out…' : 'Sign Out / Switch Account'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function MobileNav() {
  return (
    <Suspense fallback={<nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border/80 md:hidden h-16" />}>
      <MobileNavContent />
    </Suspense>
  )
}

