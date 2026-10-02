'use client'

import { useState, useEffect } from 'react'

function short(address: string) {
  if (!address) return ''
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address
}

export function AccountChip({ address }: { address: string }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    // 1. Check local storage cache
    const stored = localStorage.getItem('careerace_candidate_name')
    if (stored && stored.trim()) {
      setUsername(stored.trim())
    }

    // 2. Fetch official profile from server
    fetch('/api/candidate/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.username) {
          setUsername(data.username)
          localStorage.setItem('careerace_candidate_name', data.username)
        }
      })
      .catch(() => {})
  }, [address])

  async function signOut() {
    setBusy(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    localStorage.removeItem('careerace_session_address')
    window.location.href = '/'
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-border/80 bg-card/80 py-1.5 pl-2 pr-3.5 transition-all hover:bg-accent hover:border-primary/40 shadow-sm"
      >
        <span aria-hidden className="size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
          {username ? username[0].toUpperCase() : '✦'}
        </span>
        <div className="flex items-center gap-1.5 text-xs">
          {username && (
            <span className="font-semibold text-foreground tracking-tight max-w-[120px] truncate">
              {username}
            </span>
          )}
          <span className="font-mono text-[11px] text-muted-foreground">
            ({short(address)})
          </span>
        </div>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-64 overflow-hidden rounded-xl border border-border/80 bg-popover shadow-xl backdrop-blur-md">
          <div className="border-b border-border/70 px-4 py-3.5 bg-muted/30">
            <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Signed in as</p>
            {username && (
              <p className="mt-1 font-bold text-sm text-foreground">{username}</p>
            )}
            <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground/90">{address}</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            disabled={busy}
            className="w-full px-4 py-3 text-left text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            {busy ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  )
}
