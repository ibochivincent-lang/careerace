'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getClientSessionAddress, signOutClient } from '@/lib/client_auth'
import { ShieldCheck, Settings, LogOut, Copy, Check, ArrowRight, Globe, ExternalLink, User } from 'lucide-react'

function short(address: string) {
  if (!address) return ''
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address
}

interface AccountChipProps {
  address?: string | null
  className?: string
}

export function AccountChip({ address: propAddress, className }: AccountChipProps) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [currentAddress, setCurrentAddress] = useState<string | null>(propAddress || null)
  const [username, setUsername] = useState<string | null>(null)
  const [suinsDomain, setSuinsDomain] = useState<string | null>(null)

  // Resolve session address from prop, client cache or API
  useEffect(() => {
    function resolveSession() {
      const active = propAddress || getClientSessionAddress()
      if (active) {
        setCurrentAddress(active)
      } else {
        fetch('/api/auth/session')
          .then((res) => res.json())
          .then((data) => {
            if (data.authenticated && data.address) {
              setCurrentAddress(data.address)
            } else {
              setCurrentAddress(null)
            }
          })
          .catch(() => {})
      }

      // Check stored candidate name (ignoring any stale 0x hex values)
      const storedName = localStorage.getItem('careerace_candidate_name')
      if (storedName && storedName.trim() && !storedName.startsWith('0x')) {
        setUsername(storedName.trim())
      } else {
        // Fallback to profile parsed name if available
        try {
          const profileRaw = localStorage.getItem('careerace_sovereign_profile') || localStorage.getItem('careerace_parsed_profile')
          if (profileRaw) {
            const parsed = JSON.parse(profileRaw)
            if (parsed.applicant_name && typeof parsed.applicant_name === 'string' && !parsed.applicant_name.startsWith('0x')) {
              setUsername(parsed.applicant_name.trim())
              localStorage.setItem('careerace_candidate_name', parsed.applicant_name.trim())
            }
          }
        } catch {}
      }

      // Check stored SuiNS domain passport
      const storedDomain = localStorage.getItem('careerace_suins_domain')
      if (storedDomain && storedDomain.trim()) {
        setSuinsDomain(storedDomain.trim())
      }
    }

    resolveSession()

    // Listen for cross-tab, component auth changes, or SuiNS claim
    window.addEventListener('careerace_auth_changed', resolveSession)
    window.addEventListener('careerace_suins_changed', resolveSession)
    window.addEventListener('storage', resolveSession)

    return () => {
      window.removeEventListener('careerace_auth_changed', resolveSession)
      window.removeEventListener('careerace_suins_changed', resolveSession)
      window.removeEventListener('storage', resolveSession)
    }
  }, [propAddress])

  // Fetch verified username once address is confirmed
  useEffect(() => {
    if (!currentAddress) return
    fetch('/api/candidate/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.username && typeof data.username === 'string' && !data.username.startsWith('0x')) {
          setUsername(data.username.trim())
          localStorage.setItem('careerace_candidate_name', data.username.trim())
        }
      })
      .catch(() => {})
  }, [currentAddress])

  async function handleSignOut() {
    setBusy(true)
    try {
      await signOutClient('/signin')
    } catch {
      setBusy(false)
    }
  }

  function handleCopyAddress() {
    if (!currentAddress) return
    navigator.clipboard.writeText(currentAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Compute best human-friendly display name (strictly avoiding 0x hex addresses)
  const resolvedName = (username && username.trim() && !username.startsWith('0x'))
    ? username.trim()
    : (() => {
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('careerace_candidate_name')
          if (stored && stored.trim() && !stored.startsWith('0x')) {
            return stored.trim()
          }
          try {
            const raw = localStorage.getItem('careerace_sovereign_profile') || localStorage.getItem('careerace_parsed_profile')
            if (raw) {
              const p = JSON.parse(raw)
              if (p.applicant_name && typeof p.applicant_name === 'string' && !p.applicant_name.startsWith('0x')) {
                return p.applicant_name.trim()
              }
            }
          } catch {}
        }
        return null
      })()

  if (!currentAddress) {
    return (
      <Link
        href="/signin"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-xs"
      >
        <span>Sign In</span>
        <ArrowRight className="w-3 h-3" />
      </Link>
    )
  }

  const initial = resolvedName ? resolvedName[0].toUpperCase() : 'U'

  return (
    <div className={`relative ${className || ''}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-border/80 bg-card/90 p-1 sm:py-1.5 sm:pl-2 sm:pr-3.5 transition-all hover:bg-accent hover:border-primary/40 shadow-xs cursor-pointer shrink-0"
        title="View Sovereign Sui Passport & Identity"
      >
        <span aria-hidden className="size-7 sm:size-6 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0">
          {initial}
        </span>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-left">
          {/* Display Name */}
          <span className="font-semibold text-foreground tracking-tight max-w-[120px] lg:max-w-[160px] truncate">
            {resolvedName || (suinsDomain ? suinsDomain : short(currentAddress))}
          </span>

          {/* SuiNS Handle or Short Address */}
          {suinsDomain ? (
            <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-1">
              <Globe className="w-2.5 h-2.5" />
              <span>{suinsDomain}</span>
            </span>
          ) : (
            <span className="font-mono text-[10px] text-muted-foreground">
              ({short(currentAddress)})
            </span>
          )}
        </div>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 overflow-hidden rounded-2xl border border-border/80 bg-popover shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
            {/* Header: Verified Sovereign Passport */}
            <div className="border-b border-border/70 p-4 bg-muted/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Sui Sovereign Passport</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-1.5 py-0.5 rounded border border-border/60 hover:bg-background cursor-pointer"
                  title="Copy address"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Candidate Identity Card */}
              <div className="p-3 rounded-xl bg-background border border-border/70 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-foreground truncate">
                      {resolvedName || 'Decentralized Candidate'}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      Sui zkLogin Verified
                    </p>
                  </div>
                </div>

                {suinsDomain && (
                  <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground text-[11px]">SuiNS Domain:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {suinsDomain}
                    </span>
                  </div>
                )}

                <div className="pt-1.5 text-[10px] font-mono text-muted-foreground break-all select-all">
                  {currentAddress}
                </div>
              </div>
            </div>

            {/* Menu Links */}
            <div className="p-1.5 space-y-0.5">
              {suinsDomain && (
                <a
                  href={`/p/${suinsDomain}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Public Recruiter Passport</span>
                  </div>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              )}

              <a
                href={`https://suiscan.xyz/testnet/account/${currentAddress}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-foreground rounded-lg hover:bg-accent transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>View on Suiscan Explorer</span>
                </div>
              </a>

              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-foreground rounded-lg hover:bg-accent transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Account &amp; Career Vault Settings</span>
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={busy}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold text-destructive rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-50 text-left cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{busy ? 'Signing out…' : 'Sign Out / Disconnect'}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
