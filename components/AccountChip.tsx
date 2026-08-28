'use client'

import { useState } from 'react'

function short(address: string) {
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address
}

export function AccountChip({ address }: { address: string }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function signOut() {
    setBusy(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 transition-colors hover:bg-accent"
      >
        <span aria-hidden className="size-5 rounded-full bg-brand-gradient" />
        <span className="font-mono text-[11px] text-muted-foreground">{short(address)}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-60 overflow-hidden rounded-xl border bg-popover shadow-xl">
          <div className="border-b px-3.5 py-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Signed in as</p>
            <p className="mt-1.5 break-all font-mono text-[11px] text-muted-foreground">{address}</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            disabled={busy}
            className="w-full px-3.5 py-2.5 text-left text-sm hover:bg-accent disabled:opacity-50"
          >
            {busy ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  )
}
