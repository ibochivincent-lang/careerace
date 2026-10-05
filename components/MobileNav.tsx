'use client'

import { useState, Suspense } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Menu,
  X,
  Mail,
  Target,
  Compass,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  ShieldCheck
} from 'lucide-react'
import { cn } from './ui/utils'
import { signOutClient, getClientSessionAddress } from '@/lib/client_auth'
import { ComingSoonModal, type ComingSoonFeature } from './ComingSoonModal'

interface NavItem {
  label: string
  href?: string
  comingSoon?: ComingSoonFeature
  icon: React.ComponentType<{ className?: string }>
}

const PRIMARY_NAV: NavItem[] = [
  { label: 'Overview', href: '/dashboard?tab=overview', icon: LayoutDashboard },
  { label: 'Resumes', href: '/dashboard?tab=resumes', icon: FileText },
  { label: 'Cover Letters', href: '/cover_letter', icon: Mail },
  { label: 'Jobs', href: '/application_board', icon: Briefcase },
]

const MORE_NAV: NavItem[] = [
  { label: 'Interview Room', comingSoon: 'interview_room', icon: Target },
  { label: 'Career Pathway', comingSoon: 'career_pathway', icon: Compass },
  {
    label: 'LinkedIn Outreach',
    comingSoon: 'linkedin',
    icon: () => (
      <svg className="w-4 h-4 shrink-0 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
      </svg>
    ),
  },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Settings & Vault', href: '/settings', icon: Settings },
]

function MobileNavContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams?.get('tab') || 'overview'
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [comingSoonFeature, setComingSoonFeature] = useState<ComingSoonFeature | null>(null)

  function isItemActive(href?: string): boolean {
    if (!href) return false
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
                  if (href) router.push(href)
                }}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-1 px-1 h-full min-h-[44px] transition-colors relative cursor-pointer',
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
              'flex flex-col items-center justify-center gap-1 py-1 px-1 h-full min-h-[44px] transition-colors relative cursor-pointer',
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
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu Links */}
            <div className="py-3 space-y-1">
              {MORE_NAV.map(({ label, href, comingSoon, icon: Icon }) => {
                const active = isItemActive(href)
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setDrawerOpen(false)
                      if (comingSoon) {
                        setComingSoonFeature(comingSoon)
                      } else if (href) {
                        router.push(href)
                      }
                    }}
                    className={cn(
                      'w-full flex items-center justify-between p-3 rounded-xl text-xs font-medium transition-all text-left min-h-[44px] cursor-pointer',
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
                    {comingSoon ? (
                      <span className="text-[10px] font-mono uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded">Soon</span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                    )}
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
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-semibold text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors min-h-[44px] disabled:opacity-50 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{busy ? 'Signing out…' : 'Sign Out / Switch Account'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coming Soon Modal */}
      <ComingSoonModal
        open={comingSoonFeature !== null}
        onOpenChange={(open) => !open && setComingSoonFeature(null)}
        feature={comingSoonFeature}
      />
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
