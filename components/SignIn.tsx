'use client'

import { useEffect, useState } from 'react'
import { initiateGoogleZkLogin, completeGoogleZkLogin } from '@/lib/zklogin'
import {
  Eye, EyeOff, Mail, Lock, User, ArrowRight, ShieldCheck,
  ArrowLeft, RefreshCw, CheckCircle2, KeyRound, RotateCcw
} from 'lucide-react'

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

function Spinner({ text }: { text?: string }) {
  return (
    <div className="flex items-center gap-2">
      <svg className="size-4 animate-spin text-current" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      <span>{text || 'Please wait\u2026'}</span>
    </div>
  )
}

type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset'
type SignupStep = 'form' | 'otp'
type SigninMethod = 'password' | 'otp'
type SigninStep = 'form' | 'otp'

/**
 * Career Ace Sovereign Authentication Component.
 * Handles: Sign Up (OTP), Sign In (password + OTP), Forgot Password,
 *           Reset Password (from email link), Google OAuth (zkLogin).
 */
export function SignIn({ initialAddress }: { initialAddress?: string | null }) {
  const [busy, setBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentAddress, setCurrentAddress] = useState<string | null>(initialAddress ?? null)

  const [mode, setMode] = useState<AuthMode>('signin')
  const [signupStep, setSignupStep] = useState<SignupStep>('form')
  const [signinMethod, setSigninMethod] = useState<SigninMethod>('password')
  const [signinStep, setSigninStep] = useState<SigninStep>('form')
  const [forgotSent, setForgotSent] = useState(false)

  const [resetAccessToken, setResetAccessToken] = useState('')
  const [resetRefreshToken, setResetRefreshToken] = useState('')

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('mode') === 'signup') setMode('signup')
    if (params.get('mode') === 'reset') setMode('reset')
  }, [])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash
    if (!hash) return
    const params = new URLSearchParams(hash.replace(/^#/, ''))

    const oauthError = params.get('error')
    if (oauthError) {
      const desc = params.get('error_description') ?? oauthError
      setError(`Sign-in error: ${decodeURIComponent(desc.replace(/\+/g, ' '))}`)
      window.history.replaceState(null, '', window.location.pathname)
      return
    }

    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const type = params.get('type')

    if (accessToken) {
      if (type === 'recovery') {
        setResetAccessToken(accessToken)
        setResetRefreshToken(refreshToken || '')
        setMode('reset')
        window.history.replaceState(null, '', `${window.location.pathname}?mode=reset`)
        return
      }
      if (type === 'email_change') {
        setStatusMessage('\u2705 Email address changed successfully!')
        window.history.replaceState(null, '', window.location.pathname)
        return
      }
      handleMagicLinkCallback(accessToken)
      return
    }

    const jwt = params.get('id_token')
    if (!jwt) return
    handleGoogleCallback(jwt)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleMagicLinkCallback(token: string) {
    setBusy(true)
    setStatusMessage('Verifying your email link\u2026')
    setError(null)
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: token }),
      })
      if (!res.ok) throw new Error((await res.text()) || 'Failed to verify email link.')
      const data = await res.json()
      if (data.success && data.address) {
        setCurrentAddress(data.address)
        setStatusMessage('Email verified! Opening workspace\u2026')
        window.history.replaceState(null, '', window.location.pathname)
        const sp = new URLSearchParams(window.location.search)
        window.location.href = sp.get('callbackUrl') || '/dashboard'
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify email link.')
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogleCallback(idToken: string) {
    setGoogleBusy(true)
    setStatusMessage('Authenticating your Google identity\u2026')
    setError(null)
    try {
      const { address } = await completeGoogleZkLogin(idToken)
      setCurrentAddress(address)
      setStatusMessage('Authentication successful! Opening workspace\u2026')
      window.history.replaceState(null, '', window.location.pathname)
      const sp = new URLSearchParams(window.location.search)
      window.location.href = sp.get('callbackUrl') || '/dashboard'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete Google sign-in.')
    } finally {
      setGoogleBusy(false)
    }
  }

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

  async function handleSendSignUpOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (!username.trim()) throw new Error('Please enter a username.')
      if (username.trim().length < 3) throw new Error('Username must be at least 3 characters.')
      if (!/^[a-zA-Z0-9_-]+$/.test(username.trim()))
        throw new Error('Username can only contain letters, numbers, underscores, and hyphens.')
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
        throw new Error('Please enter a valid email address.')
      if (!password || password.length < 8)
        throw new Error('Password must be at least 8 characters.')
      setStatusMessage('Sending verification code\u2026')
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), username: username.trim() }),
      })
      if (!res.ok) throw new Error((await res.text()) || 'Failed to send verification code.')
      setSignupStep('otp')
      setResendCooldown(45)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code.')
    } finally {
      setBusy(false)
      setStatusMessage(null)
    }
  }

  async function handleVerifySignUpOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (!otpCode || otpCode.trim().length < 6)
        throw new Error('Please enter the verification code from your email.')
      setStatusMessage('Verifying code & activating your account\u2026')
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), token: otpCode.trim(), username: username.trim(), password }),
      })
      if (!res.ok) throw new Error((await res.text()) || 'Invalid or expired verification code.')
      const data = await res.json()
      setCurrentAddress(data.address)
      setStatusMessage('Email verified! Opening workspace\u2026')
      const sp = new URLSearchParams(window.location.search)
      window.location.href = sp.get('callbackUrl') || '/dashboard'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.')
    } finally {
      setBusy(false)
      setStatusMessage(null)
    }
  }

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    setStatusMessage('Verifying credentials\u2026')
    try {
      if (!loginIdentifier.trim()) throw new Error('Please enter your username or email.')
      if (!password) throw new Error('Please enter your password.')
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginIdentifier.trim(), password }),
      })
      if (!res.ok) throw new Error((await res.text()) || 'Invalid login credentials.')
      const data = await res.json()
      setCurrentAddress(data.address)
      setStatusMessage('Welcome back! Opening workspace\u2026')
      const sp = new URLSearchParams(window.location.search)
      window.location.href = sp.get('callbackUrl') || '/dashboard'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.')
    } finally {
      setBusy(false)
      setStatusMessage(null)
    }
  }

  async function handleSendSignInOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (!loginIdentifier.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginIdentifier.trim()))
        throw new Error('Please enter a valid email address.')
      setStatusMessage('Sending sign-in code\u2026')
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginIdentifier.trim() }),
      })
      if (!res.ok) throw new Error((await res.text()) || 'Failed to send code.')
      setSigninStep('otp')
      setResendCooldown(45)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code.')
    } finally {
      setBusy(false)
      setStatusMessage(null)
    }
  }

  async function handleVerifySignInOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (!otpCode || otpCode.trim().length < 6)
        throw new Error('Please enter the verification code from your email.')
      setStatusMessage('Verifying code\u2026')
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginIdentifier.trim(), token: otpCode.trim() }),
      })
      if (!res.ok) throw new Error((await res.text()) || 'Invalid or expired code.')
      const data = await res.json()
      setCurrentAddress(data.address)
      setStatusMessage('Welcome back! Opening workspace\u2026')
      const sp = new URLSearchParams(window.location.search)
      window.location.href = sp.get('callbackUrl') || '/dashboard'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.')
    } finally {
      setBusy(false)
      setStatusMessage(null)
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (!forgotEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim()))
        throw new Error('Please enter a valid email address.')
      setStatusMessage('Sending password reset link\u2026')
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      })
      if (!res.ok) throw new Error((await res.text()) || 'Failed to send reset link.')
      setForgotSent(true)
      setResendCooldown(60)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset link.')
    } finally {
      setBusy(false)
      setStatusMessage(null)
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (!newPassword || newPassword.length < 8)
        throw new Error('Password must be at least 8 characters.')
      if (newPassword !== confirmPassword)
        throw new Error('Passwords do not match.')
      if (!resetAccessToken)
        throw new Error('Reset token missing. Please click the link in your email again.')
      setStatusMessage('Updating your password\u2026')
      const res = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: resetAccessToken, refresh_token: resetRefreshToken, newPassword }),
      })
      if (!res.ok) throw new Error((await res.text()) || 'Failed to update password.')
      setStatusMessage('\u2705 Password updated! Signing you in\u2026')
      setTimeout(() => {
        setMode('signin')
        setStatusMessage(null)
        setNewPassword('')
        setConfirmPassword('')
        setResetAccessToken('')
        setResetRefreshToken('')
      }, 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password.')
    } finally {
      setBusy(false)
    }
  }

  async function handleResendOtp(targetEmail: string, targetUsername?: string) {
    if (resendCooldown > 0) return
    setError(null)
    setBusy(true)
    setStatusMessage('Resending verification code\u2026')
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail.trim(), username: targetUsername?.trim() }),
      })
      if (!res.ok) throw new Error((await res.text()) || 'Failed to resend code.')
      setResendCooldown(45)
      setStatusMessage('A fresh code has been sent to your email.')
      setTimeout(() => setStatusMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code.')
    } finally {
      setBusy(false)
    }
  }

  async function signInWithGoogle() {
    setGoogleBusy(true)
    setError(null)
    setStatusMessage('Connecting to Google\u2026')
    try {
      if (!GOOGLE_CLIENT_ID) throw new Error('Missing Google Client ID. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID.')
      await initiateGoogleZkLogin(GOOGLE_CLIENT_ID, redirectUrl())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google sign-in initiation failed')
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
          Your career vault is active under:
        </p>
        <div className="mt-4 p-3 rounded-lg border bg-muted/50 font-mono text-xs break-all">{currentAddress}</div>
        <div className="mt-6 flex flex-col gap-3">
          <a href="/dashboard" className="flex h-12 w-full items-center justify-center rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
            Go to Career Ace Workspace
          </a>
          <button type="button" onClick={handleSignOut} disabled={busy}
            className="flex h-11 w-full items-center justify-center rounded-xl border py-2.5 text-sm font-medium hover:bg-accent transition-colors">
            {busy ? 'Signing out...' : 'Sign Out / Switch Account'}
          </button>
        </div>
      </div>
    )
  }

  const inputCls = "h-11 w-full rounded-xl border border-input bg-background/50 pl-10 pr-3.5 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors"
  const primaryBtn = "mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"

  function OtpVerifyBox({
    emailDisplay, onVerify, onResend, onBack, backLabel = 'Change email',
  }: {
    emailDisplay: string
    onVerify: (e: React.FormEvent) => void
    onResend: () => void
    onBack: () => void
    backLabel?: string
  }) {
    // Detect common email providers for direct open links
    const emailDomain = emailDisplay.split('@')[1]?.toLowerCase() || ''
    const emailLinks: Record<string, string> = {
      'gmail.com': 'https://mail.google.com',
      'googlemail.com': 'https://mail.google.com',
      'outlook.com': 'https://outlook.live.com/mail',
      'hotmail.com': 'https://outlook.live.com/mail',
      'yahoo.com': 'https://mail.yahoo.com',
      'icloud.com': 'https://www.icloud.com/mail',
      'me.com': 'https://www.icloud.com/mail',
      'protonmail.com': 'https://mail.proton.me',
      'proton.me': 'https://mail.proton.me',
    }
    const emailUrl = emailLinks[emailDomain] || `https://mail.${emailDomain}`

    return (
      <div className="rounded-2xl border border-border/80 bg-card/60 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Mail className="size-5" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-foreground">Check Your Email</h3>
            <p className="text-xs text-muted-foreground">Code sent to <span className="font-semibold text-foreground">{emailDisplay}</span></p>
          </div>
        </div>

        {/* Open Email Button */}
        <a
          href={emailUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-primary bg-primary/5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
        >
          <Mail className="size-4" />
          Open Email App
        </a>

        <div className="relative my-4 flex items-center justify-center">
          <span className="w-full border-t border-border" />
          <span className="bg-card px-3 text-[10px] uppercase font-mono text-muted-foreground whitespace-nowrap">Or enter verification code</span>
        </div>
        <form onSubmit={onVerify} className="flex flex-col gap-4">
          <input
            type="text" maxLength={10} placeholder="••••••••" value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} disabled={busy}
            className="h-14 w-full rounded-xl border-2 border-primary/50 bg-background/80 text-center font-mono text-2xl font-bold tracking-[0.25em] placeholder:tracking-normal placeholder:font-normal placeholder:text-muted-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
          />
          <button type="submit" disabled={busy || otpCode.length < 6}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
            {busy ? <Spinner text={statusMessage || 'Verifying…'} /> : <><CheckCircle2 className="size-4" /><span>Verify Code</span></>}
          </button>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
            <button type="button" onClick={onResend} disabled={busy || resendCooldown > 0}
              className="flex items-center gap-1 font-medium hover:text-foreground disabled:opacity-50 transition-colors">
              <RefreshCw className={`size-3 ${busy ? 'animate-spin' : ''}`} />
              <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}</span>
            </button>
            <button type="button" onClick={onBack}
              className="flex items-center gap-1 hover:text-foreground transition-colors">
              <ArrowLeft className="size-3" /><span>{backLabel}</span>
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">

      {(mode === 'signin' || mode === 'signup') && (
        <div className="flex border-b border-border/70 mb-6 gap-6">
          {(['signin', 'signup'] as const).map((m) => (
            <button key={m} type="button"
              onClick={() => { setMode(m); setSignupStep('form'); setSigninStep('form'); setError(null); setOtpCode('') }}
              className={`pb-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${mode === m ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              {m === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>
      )}

      {mode === 'forgot' && (
        <>
          <button type="button" onClick={() => { setMode('signin'); setForgotSent(false); setError(null) }}
            className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" />Back to Sign In
          </button>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Password Reset</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Forgot your password?</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Enter your email and we&apos;ll send a secure reset link to your inbox.
          </p>
          {forgotSent ? (
            <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
              <CheckCircle2 className="size-10 mx-auto text-primary mb-3" />
              <h3 className="font-semibold text-foreground">Reset link sent!</h3>
              <p className="mt-2 text-xs text-muted-foreground">
                Check your inbox at <strong>{forgotEmail}</strong> and click the link to set a new password.
              </p>
              <button type="button"
                onClick={() => { setForgotSent(false); handleForgotPassword({ preventDefault: () => {} } as React.FormEvent) }}
                disabled={busy || resendCooldown > 0}
                className="mt-4 flex items-center gap-1.5 mx-auto text-xs text-primary font-medium disabled:opacity-50">
                <RotateCcw className="size-3" />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend link'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="mt-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input type="email" required placeholder="alex@gmail.com" value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)} disabled={busy}
                    className={inputCls} />
                </div>
              </div>
              <button type="submit" disabled={busy} className={primaryBtn}>
                {busy ? <Spinner text={statusMessage || 'Sending reset link\u2026'} /> : <><span>Send Reset Link</span><ArrowRight className="size-4" /></>}
              </button>
            </form>
          )}
        </>
      )}

      {mode === 'reset' && (
        <>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Set New Password</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Choose a new password.</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Your reset link is valid. Enter and confirm your new password below.
          </p>
          {statusMessage && !busy && (
            <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-primary font-medium">{statusMessage}</div>
          )}
          <form onSubmit={handleUpdatePassword} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input type={showNewPassword ? 'text' : 'password'} required placeholder="••••••••"
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={busy}
                  className="h-11 w-full rounded-xl border border-input bg-background/50 pl-10 pr-10 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors" />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {newPassword && newPassword.length < 8 && (
                <p className="mt-1 text-xs text-destructive">Minimum 8 characters required</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input type={showNewPassword ? 'text' : 'password'} required placeholder="••••••••"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={busy}
                  className="h-11 w-full rounded-xl border border-input bg-background/50 pl-10 pr-3.5 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors" />
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="mt-1 text-xs text-destructive">Passwords do not match</p>
              )}
            </div>
            <button type="submit" disabled={busy || newPassword.length < 8 || newPassword !== confirmPassword}
              className={primaryBtn}>
              {busy ? <Spinner text={statusMessage || 'Updating password\u2026'} /> : <><KeyRound className="size-4" /><span>Set New Password</span></>}
            </button>
          </form>
        </>
      )}

      {mode === 'signup' && (
        <>
          {signupStep === 'form' ? (
            <>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Create Account</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">Create your sovereign vault.</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Enter your details to receive a verification code before activating your account.
              </p>
              <form onSubmit={handleSendSignUpOtp} className="mt-6 flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Username</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input type="text" required placeholder="alex_dev" value={username}
                      onChange={(e) => setUsername(e.target.value)} disabled={busy || googleBusy}
                      className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input type="email" required placeholder="alex@gmail.com" value={email}
                      onChange={(e) => setEmail(e.target.value)} disabled={busy || googleBusy}
                      className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input type={showPassword ? 'text' : 'password'} required placeholder="••••••••"
                      value={password} onChange={(e) => setPassword(e.target.value)} disabled={busy || googleBusy}
                      className="h-11 w-full rounded-xl border border-input bg-background/50 pl-10 pr-10 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={busy || googleBusy} className={primaryBtn}>
                  {busy ? <Spinner text={statusMessage || 'Sending code\u2026'} /> : <><span>Verification Code</span><ArrowRight className="size-4" /></>}
                </button>
              </form>
            </>
          ) : (
            <OtpVerifyBox
              emailDisplay={email}
              onVerify={handleVerifySignUpOtp}
              onResend={() => handleResendOtp(email, username)}
              onBack={() => { setSignupStep('form'); setError(null) }}
              backLabel="Change email"
            />
          )}
        </>
      )}

      {mode === 'signin' && (
        <>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Welcome Back</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Sign in to your vault.</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Access your CV attachments, Universal Job Harvester, and AI Copilot.
          </p>
          <form onSubmit={handlePasswordSignIn} className="mt-4 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Username or Email</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input type="text" required placeholder="alex_dev or alex@gmail.com" value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)} disabled={busy || googleBusy}
                  className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input type={showPassword ? 'text' : 'password'} required placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)} disabled={busy || googleBusy}
                  className="h-11 w-full rounded-xl border border-input bg-background/50 pl-10 pr-10 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="text-right -mt-2">
              <button type="button"
                onClick={() => { setMode('forgot'); setForgotEmail(loginIdentifier.includes('@') ? loginIdentifier : ''); setError(null) }}
                className="text-xs text-primary hover:underline underline-offset-2 transition-colors">
                Forgot password?
              </button>
            </div>
            <button type="submit" disabled={busy || googleBusy} className={primaryBtn}>
              {busy ? <Spinner text={statusMessage || 'Signing in…'} /> : <><span>Sign In</span><ArrowRight className="size-4" /></>}
            </button>
          </form>
        </>
      )}

      {(mode === 'signin' || (mode === 'signup' && signupStep === 'form')) && (
        <>
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/70" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 font-medium text-muted-foreground/80">Or continue with Google</span>
            </div>
          </div>
          <button type="button" onClick={signInWithGoogle} disabled={googleBusy || busy || !CONFIGURED}
            className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-border/80 bg-card py-3 text-[14px] font-medium text-foreground transition-colors hover:bg-accent/60 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm">
            {googleBusy ? <Spinner text={statusMessage || 'Connecting to Google\u2026'} /> : (
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
        </>
      )}

      {error && (
        <div role="alert" className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          <p className="font-medium">{error}</p>
          {(error.toLowerCase().includes('redirect') || error.toLowerCase().includes('oauth') || error.toLowerCase().includes('client id')) && (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              This app sends <code className="font-mono break-all text-foreground">{redirectUrl()}</code> as its redirect URI. Ensure it is listed in Authorized Redirect URIs in your Google Cloud Console.
            </p>
          )}
        </div>
      )}

      {statusMessage && !busy && !googleBusy && mode !== 'reset' && (
        <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-primary font-medium">{statusMessage}</div>
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
