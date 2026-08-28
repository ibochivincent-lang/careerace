import Link from 'next/link'
import { AccountChip } from './AccountChip'
import { ApiKeysMenu } from './ApiKeysMenu'
import { cn } from './ui/utils'

const TABS = [
  { href: '/tutor', label: 'Tutor' },
  { href: '/memory', label: 'Memory' },
  { href: '/coaches', label: 'Coaches' },
]

/**
 * Header for the memory-backed half of the app. The address is passed down
 * from the server component that already resolved it, so nothing here has to
 * trust the client for identity.
 */
export function MemoryHeader({ address, active }: { address: string; active: string }) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 border-b bg-background/90 px-4 py-3 backdrop-blur">
      <nav className="flex items-center gap-1 rounded-full border p-1 text-[13px]">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={t.href === active ? 'page' : undefined}
            className={cn(
              'rounded-full px-3 py-1 transition-colors',
              t.href === active ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <ApiKeysMenu />
        <AccountChip address={address} />
      </div>
    </header>
  )
}
