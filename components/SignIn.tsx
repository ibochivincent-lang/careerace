'use client'

import { useEffect, useRef, useState } from 'react'
// Enoki 0.6.x depends on @mysten/sui@1.33.0 and its SuiClient type is not
// compatible with the v2 line that @mysten-incubation/memwal requires. The
// alias pins the exact version enoki expects, so no cast is needed here.
import { SuiClient, getFullnodeUrl } from '@mysten/sui-enoki/client'
import { registerEnokiWallets, type EnokiWallet } from '@mysten/enoki'

/*
 * One network constant for the SuiClient, the wallet registration and the
 * `chain` argument below. Enoki's wallet validates `chain` against the list it
 * was registered with and throws "A valid Sui chain identifier was not
 * provided in the request" when it is missing or from another network — so
 * these three must never drift apart.
 */
const NETWORK = (process.env.NEXT_PUBLIC_SUI_NETWORK ?? 'testnet') as 'testnet' | 'mainnet'
const CHAIN = `sui:${NETWORK}` as const

const ENOKI_KEY = process.env.NEXT_PUBLIC_ENOKI_API_KEY
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

/**
 * Both are inlined at build time, so whether sign-in is configured is known
 * during render — it does not need an effect and a state flag to discover it.
 */
const CONFIGURED = Boolean(ENOKI_KEY && GOOGLE_CLIENT_ID)

/*
 * The redirect URI is pinned EXPLICITLY. Enoki's default is
 * `window.location.href.split("#")[0]` — the whole current URL — so the value
 * sent to Google changes with the port Next happened to bind, and with any
 * path or query string the user arrived on. Google matches `redirect_uri`
 * exactly against its registered list, so a drifting value fails with
 * `Error 400: redirect_uri_mismatch` and the app looks broken for reasons that
 * have nothing to do with the code.
 *
 * Reads `window` on purpose, so it is only ever called from the browser.
 */
function redirectUrl() {
  if (typeof window === 'undefined') {
    const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://careerace.vercel.app'
    return `${origin}/signin`
  }
  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || window.location.origin
  return `${origin}/signin`
}

/**
 * Enoki zkLogin sign-in. Uses `registerEnokiWallets` rather than `EnokiFlow` —
 * EnokiFlow is marked deprecated in @mysten/enoki 0.6.x. The wallet exposes the
 * wallet-standard `signPersonalMessage` feature, which is what proves address
 * ownership to our own server.
 */
export function SignIn() {
  /*
   * The wallet lives in a ref, not in state. Registering it is a browser-only
   * side effect and nothing in the markup depends on the handle itself, so
   * storing it as state would only buy an extra render.
   */
  const wallet = useRef<EnokiWallet | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!CONFIGURED) return

    const { wallets, unregister } = registerEnokiWallets({
      apiKey: ENOKI_KEY!,
      providers: { google: { clientId: GOOGLE_CLIENT_ID!, redirectUrl: redirectUrl() } },
      client: new SuiClient({ url: getFullnodeUrl(NETWORK) }),
      network: NETWORK,
    })
    wallet.current = wallets.google ?? null
    return unregister
  }, [])

  async function signIn() {
    const enoki = wallet.current
    if (!enoki) {
      setError('Sign-in is still starting up. Give it a second and try again.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const { accounts } = await enoki.features['standard:connect'].connect()
      const account = accounts[0]
      if (!account) throw new Error('No account returned')

      /*
       * Server issues the nonce, so a replayed signature is worthless.
       *
       * Read the status before the body. Calling .json() straight off the
       * response turns every server-side failure into "Unexpected end of JSON
       * input" — a parse error standing in for the real one, which is usually a
       * missing environment variable in the deployment.
       */
      const nonceRes = await fetch('/api/auth/nonce')
      const nonceBody = await nonceRes.text()
      if (!nonceRes.ok) {
        let detail = nonceBody.trim()
        try {
          detail = JSON.parse(nonceBody).error ?? detail
        } catch {
          // Not JSON — an empty body or an HTML error page. Say so plainly.
        }
        throw new Error(detail || `Sign-in service returned ${nonceRes.status}`)
      }
      const { message } = JSON.parse(nonceBody)

      /*
       * `chain` is required. The wallet-standard type marks it optional, but
       * Enoki validates it on every call and rejects an undefined value, so
       * omitting it fails at signing time with an error that reads like a
       * misconfigured OAuth client rather than a missing argument.
       */
      const { signature } = await enoki.features['sui:signPersonalMessage'].signPersonalMessage({
        message: new TextEncoder().encode(message),
        account,
        chain: CHAIN,
      })

      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ signature, address: account.address }),
      })
      if (!res.ok) throw new Error(await res.text())

      const searchParams = new URLSearchParams(window.location.search)
      const destination = searchParams.get('callbackUrl') || '/'
      window.location.href = destination
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Sign in</p>
      <h2 className="mt-3 text-2xl font-bold tracking-tight">No wallet, no seed phrase.</h2>
      <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
        Google sign-in creates your Sui address behind the scenes. You&apos;ll never see a gas prompt.
      </p>

      <button
        type="button"
        onClick={signIn}
        disabled={busy || !CONFIGURED}
        className="mt-7 flex h-13 w-full items-center justify-center gap-2.5 rounded-xl bg-primary py-3.5 text-[15px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M21.6 12.23c0-.72-.06-1.4-.19-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.89-1.74 2.99-4.3 2.99-7.36Z" />
          <path d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.23-2.5c-.9.6-2.04.96-3.39.96-2.6 0-4.8-1.76-5.6-4.12H3.07v2.58A10 10 0 0 0 12 22Z" opacity="0.72" />
          <path d="M6.4 13.93a6 6 0 0 1 0-3.83V7.52H3.07a10 10 0 0 0 0 8.98l3.33-2.57Z" opacity="0.5" />
          <path d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.86-2.86C16.95 2.98 14.7 2 12 2a10 10 0 0 0-8.93 5.52L6.4 10.1C7.2 7.74 9.4 5.98 12 5.98Z" opacity="0.86" />
        </svg>
        {busy ? 'Signing in…' : 'Continue with Google'}
      </button>

      {!CONFIGURED && (
        <p className="mt-4 rounded-lg border border-reward/50 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          Sign-in needs <code className="font-mono text-foreground">NEXT_PUBLIC_ENOKI_API_KEY</code> and{' '}
          <code className="font-mono text-foreground">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>. Set{' '}
          <code className="font-mono text-foreground">DEV_FAKE_ADDRESS</code> to try the memory flow without them.
        </p>
      )}

      {error && (
        <div role="alert" className="mt-4 rounded-lg border border-destructive/40 px-3 py-2.5 text-sm text-destructive">
          <p>{error}</p>
          {/*
            Google reports redirect_uri_mismatch on its own page, not back to
            us, so this never renders for that case — but the URI is the first
            thing you need either way, and reverse-engineering it from the SDK
            default is a waste of an afternoon.
          */}
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            This app sends{' '}
            <code className="font-mono break-all text-foreground">{redirectUrl()}</code> as its
            redirect URI. It must be registered verbatim in the Google OAuth client and in the Enoki portal.
          </p>
        </div>
      )}

      <p className="mt-7 border-t pt-5 text-[11px] leading-relaxed text-muted-foreground">
        Autonomous career guidance & job matching. Your candidate work experience and accomplishments are encrypted before
        leaving this device, and stored in decentralized Walrus Memory under your Sui zkLogin key.
      </p>
    </div>
  )
}
