'use client'

import React from 'react'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { SidebarProvider, useSidebar } from './SidebarContext'
import { cn } from './ui/utils'

interface AppShellProps {
  children: React.ReactNode
}

function ShellContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      {/* Dynamic offset for desktop sidebar open/close */}
      <div
        className={cn(
          'flex-1 min-w-0 transition-all duration-300 pb-16 md:pb-0',
          collapsed ? 'md:ml-16' : 'md:ml-60'
        )}
      >
        {children}
      </div>
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
