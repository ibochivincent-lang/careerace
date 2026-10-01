'use client'

import { useEffect, useState } from 'react'
import { initiateGoogleZkLogin, completeGoogleZkLogin } from '@/lib/zklogin'

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
const CONFIGURED = Boolean(GOOGLE_CLIENT_ID)

function redirectUrl() {
  if (typeof window === 'undefined') {
    const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://careerace.vercel.app'
    return `${origin}/signin`
  }
  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || window.location.origin
  return `${origin}/signin`
}

/**
 * Native Sui zkLogin Sign-In Component.
 * Powered 100% by open-source @mysten/sui zero-knowledge proofs.
 * Zero monthly middleware subscription fees ($0 forever).
 */
export function SignIn({ initialAddress }: { initialAddress?: string | null }) {
  const [busy, setBusy] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentAddress, setCurrentAddress] = useState<string | null>(initialAddress ?? null)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('mode') === 'signup') {
      setMode('signup')
    }
  }, [])

  // Detect OAuth redirect callback from Google in URL hash (#id_token=... or #error=...)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const hash = window.location.hash
    if (!hash) return

    const params = new URLSearchParams(hash.replace(/^#/, ''))

    // Google returns an error fragment (e.g. access_denied, invalid_request)
    const oauthError = params.get('error')
    if (oauthError) {
      const desc = params.get('error_description') ?? oauthError
      setError(`Google sign-in error: ${decodeURIComponent(desc.replace(/\+/g, ' '))}`)
      window.history.replaceState(null, '', window.location.pathname)
      return
    }

    const jwt = params.get('id_token')
    if (!jwt) return

    async function handleAuthCallback(idToken: string) {
      setBusy(true)
      setStatusMessage('Generating Sui zero-knowledge proof…')
      setError(null)

      try {
        const { address } = await completeGoogleZkLogin(idToken)
        setCurrentAddress(address)
        setStatusMessage('Authentication successful! Opening workspace…')

        // Clean up hash from address bar without reloading
        window.history.replaceState(null, '', window.location.pathname)

        const searchParams = new URLSearchParams(window.location.search)
        const destination = searchParams.get('callbackUrl') || '/#copilot'
        window.location.href = destination
      } catch (err) {
        console.error('[zklogin] Callback completion error:', err)
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to complete zero-knowledge sign-in.'
        )
      } finally {
        setBusy(false)
      }
    }

    handleAuthCallback(jwt)
  }, [])

  async function handleSignOut() {
    setBusy(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setCurrentAddress(null)
    } catch (e) {
      console.error('Logout error:', e)
    } finally {
      setBusy(false)
    }
  }

  async function signIn() {
    setBusy(true)
    setError(null)
    setStatusMessage('Connecting to Google & preparing Sui cryptographic key…')

    try {
      if (!GOOGLE_CLIENT_ID) {
        throw new Error(
          'Missing Google Client ID. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment.'
        )
      }

      await initiateGoogleZkLogin(GOOGLE_CLIENT_ID, redirectUrl())
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sign-in initiation failed'
      setError(msg)
      setBusy(false)
      setStatusMessage(null)
    }
  }

  if (currentAddress) {
    return (
      <div className="w-full max-w-md">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Account Active</p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight">Already Connected</h2>
        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
          Your sovereign career vault is active and encrypted under Sui address:
        </p>
        <div className="mt-4 p-3 rounded-lg border bg-muted/50 font-mono text-xs break-all">
          {currentAddress}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <a
            href="/#copilot"
            className="flex h-12 w-full items-center justify-center rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Go to Career Ace Workspace
          </a>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={busy}
            className="flex h-11 w-full items-center justify-center rounded-xl border py-2.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            {busy ? 'Signing out...' : 'Sign Out / Switch Account'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      {/* Sign In vs Sign Up Tabs */}
      <div className="flex border-b border-border/70 mb-6 gap-6">
        <button
          type="button"
          onClick={() => setMode('signin')}
          className={`pb-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            mode === 'signin'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={`pb-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            mode === 'signup'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Sign Up
        </button>
      </div>

      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight">
        {mode === 'signup' ? 'Create your sovereign vault.' : 'Sign in to your vault.'}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {mode === 'signup'
          ? 'Connect with Google to instantiate your encrypted candidate vault on Walrus & Sui. Zero seed phrases, zero gas fees.'
          : 'Access your saved CV attachments, Universal Job Harvester, and AI Copilot under your zero-knowledge key.'}
      </p>

      <button
        type="button"
        onClick={signIn}
        disabled={busy || !CONFIGURED}
        className="mt-6 flex h-13 w-full items-center justify-center gap-2.5 rounded-xl bg-primary py-3.5 text-[15px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? (
          <div className="flex items-center gap-2">
            <svg className="size-4 animate-spin text-current" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>{statusMessage || 'Processing…'}</span>
          </div>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M21.6 12.23c0-.72-.06-1.4-.19-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.89-1.74 2.99-4.3 2.99-7.36Z" />
              <path d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.23-2.5c-.9.6-2.04.96-3.39.96-2.6 0-4.8-1.76-5.6-4.12H3.07v2.58A10 10 0 0 0 12 22Z" opacity="0.72" />
              <path d="M6.4 13.93a6 6 0 0 1 0-3.83V7.52H3.07a10 10 0 0 0 0 8.98l3.33-2.57Z" opacity="0.5" />
              <path d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.86-2.86C16.95 2.98 14.7 2 12 2a10 10 0 0 0-8.93 5.52L6.4 10.1C7.2 7.74 9.4 5.98 12 5.98Z" opacity="0.86" />
            </svg>
            <span>{mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}</span>
          </>
        )}
      </button>

      {!CONFIGURED && (
        <p className="mt-4 rounded-lg border border-reward/50 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          Sign-in needs <code className="font-mono text-foreground">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>.
        </p>
      )}

      {error && (
        <div role="alert" className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          <p className="font-medium">{error}</p>
          {(error.toLowerCase().includes('redirect') ||
            error.toLowerCase().includes('oauth') ||
            error.toLowerCase().includes('google') ||
            error.toLowerCase().includes('client id')) && (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              This app sends{' '}
              <code className="font-mono break-all text-foreground">{redirectUrl()}</code> as its
              redirect URI. Ensure it is listed in Authorized Redirect URIs in your Google Cloud Console.
            </p>
          )}
        </div>
      )}

      <p className="mt-7 border-t pt-5 text-[11px] leading-relaxed text-muted-foreground">
        Autonomous career guidance & job matching. Your candidate profile and accomplishments are encrypted before
        leaving this device, and stored in decentralized Walrus Memory under your native Sui zkLogin key.
      </p>

      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <a href="/privacy" className="hover:text-foreground underline underline-offset-4">Privacy Policy</a>
        <span>&bull;</span>
        <a href="/terms" className="hover:text-foreground underline underline-offset-4">Terms of Service</a>
      </div>
    </div>
  )
}
