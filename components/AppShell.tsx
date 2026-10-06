'use client'

import React from 'react'
import Link from 'next/link'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { AccountChip } from './AccountChip'
import { ThemeToggle } from './ThemeToggle'
import { SidebarProvider, useSidebar } from './SidebarContext'
import { cn } from './ui/utils'

interface AppShellProps {
  children: React.ReactNode
}

function ShellContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <Sidebar />

      {/* Main Content Pane */}
      <div
        className={cn(
          'flex-1 min-w-0 transition-all duration-300 pb-20 md:pb-0 flex flex-col',
          collapsed ? 'md:ml-16' : 'md:ml-60'
        )}
      >
        {/* Mobile Sticky Top Header with Brand, ThemeToggle, and AccountChip - Guaranteed Single Line */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 border-b border-border/80 bg-background/95 backdrop-blur-md px-3 sm:px-4 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0 whitespace-nowrap">
            <div className="w-7 h-7 rounded-lg bg-card border border-border/70 shadow-xs flex items-center justify-center p-1 shrink-0">
              <img src="/careerace_logo.png" alt="Career Ace Logo" className="w-full h-full object-contain dark:invert" />
            </div>
            <span className="font-bold text-sm tracking-tight text-foreground whitespace-nowrap">Career Ace</span>
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
            <AccountChip />
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  )
}

export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider>
      <ShellContent>{children}</ShellContent>
    </SidebarProvider>
  )
}
