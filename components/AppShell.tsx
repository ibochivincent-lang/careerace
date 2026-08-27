import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      {/* Offset for fixed sidebar on desktop */}
      <div className="flex-1 min-w-0 md:ml-60 pb-16 md:pb-0">
        {children}
      </div>
      <MobileNav />
    </div>
  )
}
