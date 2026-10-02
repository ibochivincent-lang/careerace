'use client'

import { useEffect, useState } from 'react'
import { initiateGoogleZkLogin, completeGoogleZkLogin } from '@/lib/zklogin'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, ShieldCheck, KeyRound, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react'

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
 * Career Ace Sovereign Authentication Component.
 * Supports:
 *  1. Mandatory Email OTP Verification on Sign Up (real 6-digit code sent to inbox)
 *  2. Username or Email + Password login (with optional direct Email OTP login)
 *  3. Google OAuth Connect (with automatic fallback to verified Google tokens)
 *  Zero seed phrases, zero crypto wallet extensions required.
 */
export function SignIn({ initialAddress }: { initialAddress?: string | null }) {
  const [busy, setBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentAddress, setCurrentAddress] = useState<string | null>(initialAddress ?? null)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  // Signup multi-step: 'form' -> 'otp'
  const [signupStep, setSignupStep] = useState<'form' | 'otp'>('form')

  // Signin method: 'password' | 'otp'
  const [signinMethod, setSigninMethod] = useState<'password' | 'otp'>('password')
  const [signinStep, setSigninStep] = useState<'form' | 'otp'>('form')

  // Form states
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('mode') === 'signup') {
      setMode('signup')
    }
  }, [])

  // Timer countdown for resending OTP
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  // Detect OAuth redirect callback from Google in URL hash (#id_token=... or #error=...)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const hash = window.location.hash
    if (!hash) return

    const params = new URLSearchParams(hash.replace(/^#/, ''))

    const oauthError = params.get('error')
    if (oauthError) {
      const desc = params.get('error_description') ?? oauthError
      setError(`Google sign-in error: ${decodeURIComponent(desc.replace(/\+/g, ' '))}`)
      window.history.replaceState(null, '', window.location.pathname)
      return
    }

    const accessToken = params.get('access_token')
    if (accessToken) {
      async function handleMagicLinkCallback(token: string) {
        setBusy(true)
        setStatusMessage('Verifying your email confirmation link…')
        setError(null)
        try {
          const res = await fetch('/api/auth/otp/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: token }),
          })
          if (!res.ok) {
            const errText = await res.text()
            throw new Error(errText || 'Failed to verify email confirmation link.')
          }
          const data = await res.json()
          if (data.success && data.address) {
            setCurrentAddress(data.address)
            setStatusMessage('Email verified! Opening workspace…')
            window.history.replaceState(null, '', window.location.pathname)
            const searchParams = new URLSearchParams(window.location.search)
            const destination = searchParams.get('callbackUrl') || '/dashboard'
            window.location.href = destination
          }
        } catch (err) {
          console.error('[magiclink] Confirmation link error:', err)
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to verify email confirmation link.'
          )
        } finally {
          setBusy(false)
        }
      }
      handleMagicLinkCallback(accessToken)
      return
    }

    const jwt = params.get('id_token')
    if (!jwt) return

    async function handleAuthCallback(idToken: string) {
      setGoogleBusy(true)
      setStatusMessage('Authenticating your Google identity…')
      setError(null)

      try {
        const { address } = await completeGoogleZkLogin(idToken)
        setCurrentAddress(address)
        setStatusMessage('Authentication successful! Opening workspace…')

        window.history.replaceState(null, '', window.location.pathname)

        const searchParams = new URLSearchParams(window.location.search)
        const destination = searchParams.get('callbackUrl') || '/dashboard'
        window.location.href = destination
      } catch (err) {
        console.error('[zklogin] Callback completion error:', err)
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to complete zero-knowledge sign-in.'
        )
      } finally {
        setGoogleBusy(false)
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

  // 1. STEP 1 OF SIGNUP: Request 6-digit OTP code to email
  async function handleSendSignUpOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)

    try {
      if (!username.trim()) throw new Error('Please enter a username.')
      if (username.trim().length < 3) throw new Error('Username must be at least 3 characters.')
      if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
        throw new Error('Username can only contain letters, numbers, underscores, and hyphens.')
      }
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        throw new Error('Please enter a valid email address.')
      }
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters.')
      }

      setStatusMessage('Sending 6-digit verification code to your email…')

      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          username: username.trim(),
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || 'Failed to send verification code.')
      }

      setSignupStep('otp')
      setResendCooldown(45)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code.')
    } finally {
      setBusy(false)
      setStatusMessage(null)
    }
  }

  // 2. STEP 2 OF SIGNUP: Verify 6-digit OTP and complete registration
  async function handleVerifySignUpOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)

    try {
      if (!otpCode || otpCode.trim().length < 6) {
        throw new Error('Please enter the 6-digit verification code sent to your email.')
      }

      setStatusMessage('Verifying code & activating your sovereign vault…')

      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          token: otpCode.trim(),
          username: username.trim(),
          password,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || 'Invalid or expired verification code.')
      }

      const data = await res.json()
      setCurrentAddress(data.address)
      setStatusMessage('Email verified! Opening your workspace…')

      const searchParams = new URLSearchParams(window.location.search)
      const destination = searchParams.get('callbackUrl') || '/dashboard'
      window.location.href = destination
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.')
    } finally {
      setBusy(false)
      setStatusMessage(null)
    }
  }

  // Resend OTP
  async function handleResendOtp(targetEmail: string, targetUsername?: string) {
    if (resendCooldown > 0) return
    setError(null)
    setBusy(true)
    setStatusMessage('Resending 6-digit verification code…')

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail.trim(),
          username: targetUsername?.trim(),
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || 'Failed to resend code.')
      }

      setResendCooldown(45)
      setStatusMessage('A fresh 6-digit code has been sent to your email.')
      setTimeout(() => setStatusMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code.')
    } finally {
      setBusy(false)
    }
  }

  // Sign In with Password
  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    setStatusMessage('Verifying credentials…')

    try {
      if (!loginIdentifier.trim()) throw new Error('Please enter your username or email.')
      if (!password) throw new Error('Please enter your password.')

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier.trim(),
          password,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || 'Invalid login credentials.')
      }

      const data = await res.json()
      setCurrentAddress(data.address)
      setStatusMessage('Welcome back! Opening workspace…')

      const searchParams = new URLSearchParams(window.location.search)
      const destination = searchParams.get('callbackUrl') || '/dashboard'
      window.location.href = destination
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.')
    } finally {
      setBusy(false)
      setStatusMessage(null)
    }
  }

  // Sign In with Email OTP: Step 1 (Send Code)
  async function handleSendSignInOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)

    try {
      if (!loginIdentifier.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginIdentifier.trim())) {
        throw new Error('Please enter your valid email address to receive an OTP code.')
      }

      setStatusMessage('Sending 6-digit sign-in code…')

      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginIdentifier.trim(),
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || 'Failed to send verification code.')
      }

      setSigninStep('otp')
      setResendCooldown(45)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code.')
    } finally {
      setBusy(false)
      setStatusMessage(null)
    }
  }

  // Sign In with Email OTP: Step 2 (Verify Code)
  async function handleVerifySignInOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)

    try {
      if (!otpCode || otpCode.trim().length < 6) {
        throw new Error('Please enter the 6-digit verification code.')
      }

      setStatusMessage('Verifying code…')

      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginIdentifier.trim(),
          token: otpCode.trim(),
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || 'Invalid or expired code.')
      }

      const data = await res.json()
      setCurrentAddress(data.address)
      setStatusMessage('Welcome back! Opening workspace…')

      const searchParams = new URLSearchParams(window.location.search)
      const destination = searchParams.get('callbackUrl') || '/dashboard'
      window.location.href = destination
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.')
    } finally {
      setBusy(false)
      setStatusMessage(null)
    }
  }

  // Google OAuth
  async function signInWithGoogle() {
    setGoogleBusy(true)
    setError(null)
    setStatusMessage('Connecting to Google…')

    try {
      if (!GOOGLE_CLIENT_ID) {
        throw new Error(
          'Missing Google Client ID. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment.'
        )
      }

      await initiateGoogleZkLogin(GOOGLE_CLIENT_ID, redirectUrl())
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Google sign-in initiation failed'
      setError(msg)
      setGoogleBusy(false)
      setStatusMessage(null)
    }
  }

  if (currentAddress) {
    return (
      <div className="w-full max-w-md">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Account Active</p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight">Already Connected</h2>
        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
          Your sovereign career vault is active and encrypted under sovereign address:
        </p>
        <div className="mt-4 p-3 rounded-lg border bg-muted/50 font-mono text-xs break-all">
          {currentAddress}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <a
            href="/dashboard"
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
          onClick={() => {
            setMode('signin')
            setSignupStep('form')
            setSigninStep('form')
            setError(null)
            setOtpCode('')
          }}
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
          onClick={() => {
            setMode('signup')
            setSignupStep('form')
            setSigninStep('form')
            setError(null)
            setOtpCode('')
          }}
          className={`pb-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            mode === 'signup'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* ======================= SIGN UP FLOW ======================= */}
      {mode === 'signup' && (
        <>
          {signupStep === 'form' ? (
            <>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Create Account</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">Create your sovereign vault.</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Enter your details to receive a 6-digit OTP verification code in your email inbox before activating your account.
              </p>

              <form onSubmit={handleSendSignUpOtp} className="mt-6 flex flex-col gap-4">
                {/* Username */}
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Username</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      placeholder="alex_dev"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={busy || googleBusy}
                      className="h-11 w-full rounded-xl border border-input bg-background/50 pl-10 pr-3.5 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="email"
                      required
                      placeholder="alex@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={busy || googleBusy}
                      className="h-11 w-full rounded-xl border border-input bg-background/50 pl-10 pr-3.5 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={busy || googleBusy}
                      className="h-11 w-full rounded-xl border border-input bg-background/50 pl-10 pr-10 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit: Send OTP */}
                <button
                  type="submit"
                  disabled={busy || googleBusy}
                  className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? (
                    <div className="flex items-center gap-2">
                      <svg className="size-4 animate-spin text-current" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>{statusMessage || 'Sending code…'}</span>
                    </div>
                  ) : (
                    <>
                      <span>Send 6-Digit Verification Code</span>
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* ================= OTP & MAGIC LINK VERIFICATION SCREEN ================= */
            <div className="rounded-2xl border border-border/80 bg-card/60 p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Mail className="size-5" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Check Your Email</h3>
                  <p className="text-xs text-muted-foreground">Sign-in message sent to <span className="font-semibold text-foreground">{email}</span></p>
                </div>
              </div>

              {/* Direct Link Banner */}
              <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
                <p className="text-xs font-medium text-foreground">
                  Click the <strong className="text-primary">"Sign in"</strong> link in the email to open your workspace immediately.
                </p>
                <div className="mt-2.5 flex items-center justify-center gap-2 text-[11px] text-primary">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  <span>Waiting for email link click...</span>
                </div>
              </div>

              <div className="relative my-4 flex items-center justify-center">
                <span className="w-full border-t border-border" />
                <span className="bg-card px-3 text-[10px] uppercase font-mono text-muted-foreground whitespace-nowrap">
                  Or enter 6-digit code
                </span>
              </div>

              <form onSubmit={handleVerifySignUpOtp} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5 text-center">
                    6-digit code (if displayed in email)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    disabled={busy}
                    className="h-14 w-full rounded-xl border-2 border-primary/50 bg-background/80 text-center font-mono text-2xl font-bold tracking-[0.4em] placeholder:tracking-normal placeholder:font-normal placeholder:text-muted-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={busy || otpCode.length < 6}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy ? (
                    <div className="flex items-center gap-2">
                      <svg className="size-4 animate-spin text-current" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>{statusMessage || 'Verifying…'}</span>
                    </div>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" />
                      <span>Verify & Activate Account</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                  <button
                    type="button"
                    onClick={() => handleResendOtp(email, username)}
                    disabled={busy || resendCooldown > 0}
                    className="flex items-center gap-1 font-medium hover:text-foreground disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw className={`size-3 ${busy ? 'animate-spin' : ''}`} />
                    <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSignupStep('form')
                      setError(null)
                    }}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="size-3" />
                    <span>Change email</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {/* ======================= SIGN IN FLOW ======================= */}
      {mode === 'signin' && (
        <>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Welcome Back</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Sign in to your vault.</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Access your saved CV attachments, Universal Job Harvester, and AI Copilot.
          </p>

          {/* Sub-tabs for Sign In method: Password vs OTP */}
          <div className="mt-5 flex gap-2 p-1 rounded-xl bg-muted/60 border border-border/60">
            <button
              type="button"
              onClick={() => {
                setSigninMethod('password')
                setSigninStep('form')
                setError(null)
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                signinMethod === 'password'
                  ? 'bg-background shadow-xs text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => {
                setSigninMethod('otp')
                setSigninStep('form')
                setError(null)
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                signinMethod === 'otp'
                  ? 'bg-background shadow-xs text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Email OTP Code
            </button>
          </div>

          {signinMethod === 'password' ? (
            /* Password Sign In */
            <form onSubmit={handlePasswordSignIn} className="mt-4 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Username or Email</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="alex_dev or alex@gmail.com"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    disabled={busy || googleBusy}
                    className="h-11 w-full rounded-xl border border-input bg-background/50 pl-10 pr-3.5 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={busy || googleBusy}
                    className="h-11 w-full rounded-xl border border-input bg-background/50 pl-10 pr-10 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy || googleBusy}
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? (
                  <div className="flex items-center gap-2">
                    <svg className="size-4 animate-spin text-current" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>{statusMessage || 'Signing in…'}</span>
                  </div>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* OTP Sign In */
            signinStep === 'form' ? (
              <form onSubmit={handleSendSignInOtp} className="mt-4 flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="email"
                      required
                      placeholder="alex@gmail.com"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      disabled={busy || googleBusy}
                      className="h-11 w-full rounded-xl border border-input bg-background/50 pl-10 pr-3.5 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy || googleBusy}
                  className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? (
                    <div className="flex items-center gap-2">
                      <svg className="size-4 animate-spin text-current" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>{statusMessage || 'Sending code…'}</span>
                    </div>
                  ) : (
                    <>
                      <span>Send Sign-In Code</span>
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="mt-4 rounded-2xl border border-border/80 bg-card/60 p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Mail className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Check Your Email</h3>
                    <p className="text-xs text-muted-foreground">Sign-in message sent to <span className="font-semibold text-foreground">{loginIdentifier}</span></p>
                  </div>
                </div>

                {/* Direct Link Banner */}
                <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
                  <p className="text-xs font-medium text-foreground">
                    Click the <strong className="text-primary">"Sign in"</strong> link in the email to open your workspace immediately.
                  </p>
                  <div className="mt-2.5 flex items-center justify-center gap-2 text-[11px] text-primary">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    <span>Waiting for email link click...</span>
                  </div>
                </div>

                <div className="relative my-4 flex items-center justify-center">
                  <span className="w-full border-t border-border" />
                  <span className="bg-card px-3 text-[10px] uppercase font-mono text-muted-foreground whitespace-nowrap">
                    Or enter 6-digit code
                  </span>
                </div>

                <form onSubmit={handleVerifySignInOtp} className="flex flex-col gap-4">
                  <div>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      disabled={busy}
                      className="h-14 w-full rounded-xl border-2 border-primary/50 bg-background/80 text-center font-mono text-2xl font-bold tracking-[0.4em] placeholder:tracking-normal placeholder:font-normal placeholder:text-muted-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={busy || otpCode.length < 6}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {busy ? (
                      <div className="flex items-center gap-2">
                        <svg className="size-4 animate-spin text-current" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span>Verifying…</span>
                      </div>
                    ) : (
                      <>
                        <CheckCircle2 className="size-4" />
                        <span>Sign In</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                    <button
                      type="button"
                      onClick={() => handleResendOtp(loginIdentifier)}
                      disabled={busy || resendCooldown > 0}
                      className="flex items-center gap-1 font-medium hover:text-foreground disabled:opacity-50 transition-colors"
                    >
                      <RefreshCw className={`size-3 ${busy ? 'animate-spin' : ''}`} />
                      <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSigninStep('form')
                        setError(null)
                      }}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="size-3" />
                      <span>Change email</span>
                    </button>
                  </div>
                </form>
              </div>
            )
          )}
        </>
      )}

      {/* Divider */}
      <div className="relative my-6 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/70" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-3 font-medium text-muted-foreground/80">
            Or continue with Google
          </span>
        </div>
      </div>

      {/* Google Sign-In Button */}
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={googleBusy || busy || !CONFIGURED}
        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-border/80 bg-card py-3 text-[14px] font-medium text-foreground transition-colors hover:bg-accent/60 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
      >
        {googleBusy ? (
          <div className="flex items-center gap-2">
            <svg className="size-4 animate-spin text-current" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>{statusMessage || 'Connecting to Google…'}</span>
          </div>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M21.6 12.23c0-.72-.06-1.4-.19-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.89-1.74 2.99-4.3 2.99-7.36Z" />
              <path d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.23-2.5c-.9.6-2.04.96-3.39.96-2.6 0-4.8-1.76-5.6-4.12H3.07v2.58A10 10 0 0 0 12 22Z" opacity="0.72" />
              <path d="M6.4 13.93a6 6 0 0 1 0-3.83V7.52H3.07a10 10 0 0 0 0 8.98l3.33-2.57Z" opacity="0.5" />
              <path d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.86-2.86C16.95 2.98 14.7 2 12 2a10 10 0 0 0-8.93 5.52L6.4 10.1C7.2 7.74 9.4 5.98 12 5.98Z" opacity="0.86" />
            </svg>
            <span>Continue with Google</span>
          </>
        )}
      </button>

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

      {statusMessage && !busy && !googleBusy && (
        <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-primary font-medium">
          {statusMessage}
        </div>
      )}

      <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="size-4 text-primary shrink-0" />
        <span>Sovereign vault. Encrypted records with zero cross-tenant leakage.</span>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground border-t border-border/50 pt-4">
        <a href="/privacy" className="hover:text-foreground underline underline-offset-4">Privacy Policy</a>
        <span>&bull;</span>
        <a href="/terms" className="hover:text-foreground underline underline-offset-4">Terms of Service</a>
      </div>
    </div>
  )
}
