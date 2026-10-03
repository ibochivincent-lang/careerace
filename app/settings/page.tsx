'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AppShell } from '@/components/AppShell'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  User,
  ShieldCheck,
  Database,
  Trash2,
  Download,
  Key,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Copy,
  Check,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { saveProviderKey } from '@/app/actions/keys'

export default function SettingsPage() {
  const router = useRouter()
  const [candidateName, setCandidateName] = useState('')
  const [targetTitle, setTargetTitle] = useState('')
  const [sessionAddress, setSessionAddress] = useState<string | null>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [geminiKey, setGeminiKey] = useState('')
  const [groqKey, setGroqKey] = useState('')
  const [openRouterKey, setOpenRouterKey] = useState('')
  const [isSavingAiKeys, setIsSavingAiKeys] = useState(false)
  const [hasCopiedAddress, setHasCopiedAddress] = useState(false)

  useEffect(() => {
    // Load local profile settings
    const storedName = localStorage.getItem('careerace_candidate_name') || ''
    const storedTitle = localStorage.getItem('careerace_target_title') || ''
    const storedProfile = localStorage.getItem('careerace_sovereign_profile') || localStorage.getItem('careerace_parsed_profile')

    let cleanName = storedName
    let cleanTitle = storedTitle

    if (storedProfile) {
      try {
        const parsed = JSON.parse(storedProfile)
        if (parsed.name && !parsed.name.startsWith('0x') && parsed.name.toLowerCase() !== 'candidate') {
          cleanName = parsed.name
        }
        if (parsed.targetRole && !cleanTitle) {
          cleanTitle = parsed.targetRole
        }
      } catch {}
    }

    // Never let candidateName be a raw 0x... address
    if (cleanName.startsWith('0x')) {
      cleanName = ''
    }

    setCandidateName(cleanName)
    setTargetTitle(cleanTitle)

    // Load stored AI keys
    const storedGemini = localStorage.getItem('careerace_gemini_key') || ''
    const storedGroq = localStorage.getItem('careerace_groq_key') || ''
    const storedOpenRouter = localStorage.getItem('careerace_openrouter_key') || ''
    setGeminiKey(storedGemini)
    setGroqKey(storedGroq)
    setOpenRouterKey(storedOpenRouter)

    // Load zkLogin session
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.address) {
          setSessionAddress(data.address)
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingSession(false))
  }, [])

  function handleSaveProfile() {
    localStorage.setItem('careerace_candidate_name', candidateName.trim())
    localStorage.setItem('careerace_target_title', targetTitle.trim())
    toast.success('Candidate profile preferences saved.')
  }

  async function handleSaveAiKeys() {
    setIsSavingAiKeys(true)
    try {
      localStorage.setItem('careerace_gemini_key', geminiKey.trim())
      localStorage.setItem('careerace_groq_key', groqKey.trim())
      localStorage.setItem('careerace_openrouter_key', openRouterKey.trim())

      if (sessionAddress) {
        if (geminiKey.trim()) await saveProviderKey('google', geminiKey.trim()).catch(() => {})
        if (groqKey.trim()) await saveProviderKey('groq', groqKey.trim()).catch(() => {})
        if (openRouterKey.trim()) await saveProviderKey('openrouter', openRouterKey.trim()).catch(() => {})
      }
      toast.success('Free AI model API keys saved securely.')
    } catch {
      toast.error('Failed to save API keys.')
    } finally {
      setIsSavingAiKeys(false)
    }
  }

  function handleExportVault() {
    const backupData = {
      candidate_name: candidateName,
      target_title: targetTitle,
      sui_address: sessionAddress,
      parsed_profile: localStorage.getItem('careerace_parsed_profile'),
      exported_at: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `careerace_vault_export_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Career Vault exported successfully.')
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setSessionAddress(null)
      toast.success('Disconnected zkLogin session.')
      router.push('/')
    } catch {
      toast.error('Failed to log out.')
    }
  }

  function handleClearCache() {
    localStorage.removeItem('careerace_parsed_profile')
    localStorage.removeItem('careerace_candidate_name')
    localStorage.removeItem('careerace_target_title')
    setShowClearConfirm(false)
    setCandidateName('')
    setTargetTitle('')
    toast.success('Local browser profile cache cleared.')
  }

  return (
    <AppShell>
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sovereign Settings & Identity</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your decentralized Sui zkLogin credentials, Walrus vault configuration, and local profile data.
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* zkLogin Wallet Card */}
        <Card className="p-6 space-y-4 border-l-4 border-l-primary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-base">Sui zkLogin Authentication</h2>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {sessionAddress ? 'Authenticated' : 'Guest'}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Your identity is secured by zero-knowledge proofs deriving an ephemeral Sui keypair from your Google OAuth JWT.
            No centralized server ever receives your private signing keys or unencrypted credentials.
          </p>

          {sessionAddress ? (
            <div className="space-y-3 pt-2">
              <div className="rounded-lg border bg-muted/30 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-mono uppercase text-muted-foreground block mb-0.5">Sui zkLogin Address</span>
                  <span className="font-mono text-xs font-semibold select-all break-all text-foreground">{sessionAddress}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(sessionAddress)
                      setHasCopiedAddress(true)
                      toast.success('Sui address copied to clipboard')
                      setTimeout(() => setHasCopiedAddress(false), 2000)
                    }}
                    className="h-7 text-xs gap-1 px-2.5"
                  >
                    {hasCopiedAddress ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </>
                    )}
                  </Button>
                  <a
                    href={`https://suiscan.xyz/testnet/account/${sessionAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary flex items-center gap-1 hover:underline whitespace-nowrap px-2"
                  >
                    Suiscan <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs gap-1.5 text-destructive hover:bg-destructive/10">
                  <LogOut className="w-3.5 h-3.5" /> Disconnect zkLogin
                </Button>
              </div>
            </div>
          ) : (
            <div className="pt-2">
              <Button size="sm" onClick={() => router.push('/signin?callbackUrl=/settings')} className="text-xs gap-2">
                Connect with Google zkLogin
              </Button>
            </div>
          )}
        </Card>

        {/* Candidate Profile Preferences */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2 border-b pb-3">
            <User className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-base">Candidate Profile Information</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="candidate-name" className="text-xs font-medium text-foreground block">
                Full Name
              </label>
              <input
                id="candidate-name"
                type="text"
                value={candidateName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCandidateName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="target-title" className="text-xs font-medium text-foreground block">
                Primary Target Role
              </label>
              <input
                id="target-title"
                type="text"
                value={targetTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetTitle(e.target.value)}
                placeholder="e.g. Staff Fullstack Engineer"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button size="sm" onClick={handleSaveProfile} className="text-xs">
              Save Preferences
            </Button>
          </div>
        </Card>

        {/* Free AI Models & API Keys Configuration */}
        <Card className="p-6 space-y-6 border-l-4 border-l-purple-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <h2 className="font-bold text-base">Free AI Models & API Keys</h2>
            </div>
            <Badge variant="outline" className="font-mono text-[11px] w-fit border-purple-500/40 text-purple-600 dark:text-purple-400">
              Zero-Cost Intelligence Engine
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Power your autonomous Career Ace Copilot, CV ATS parsing, Cover Letter tailoring, and STAR+R interview coach
            with 100% free-tier AI models. Keys are sealed client-side with AES-256-GCM and never logged in cleartext.
          </p>

          <div className="space-y-4">
            {/* Google Gemini */}
            <div className="rounded-lg border p-4 bg-card/40 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-foreground">Google Gemini 2.0 Flash / 1.5 Flash</span>
                  <Badge variant="secondary" className="text-[10px] font-mono py-0">15 RPM · 1M TPM · Free</Badge>
                </div>
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary flex items-center gap-1 hover:underline"
                >
                  Get Free Gemini Key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                id="gemini-key"
                type="password"
                value={geminiKey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy... (Paste Google AI Studio Key)"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <p className="text-[11px] text-muted-foreground">
                Fastest response speed and largest context window. Ideal for full CV analysis and real-time chat.
              </p>
            </div>

            {/* Groq Cloud */}
            <div className="rounded-lg border p-4 bg-card/40 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-foreground">Groq Cloud (Llama 3.3 70B Versatile)</span>
                  <Badge variant="secondary" className="text-[10px] font-mono py-0">30 RPM · ~300 T/s · Free</Badge>
                </div>
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary flex items-center gap-1 hover:underline"
                >
                  Get Free Groq Key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                id="groq-key"
                type="password"
                value={groqKey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGroqKey(e.target.value)}
                placeholder="gsk_... (Paste Groq Cloud Key)"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <p className="text-[11px] text-muted-foreground">
                Near-instantaneous token generation. Ideal for quick interview coaching turns and rapid bullet polishing.
              </p>
            </div>

            {/* OpenRouter */}
            <div className="rounded-lg border p-4 bg-card/40 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-foreground">OpenRouter (DeepSeek R1 & Qwen 2.5)</span>
                  <Badge variant="secondary" className="text-[10px] font-mono py-0">:free Open Models</Badge>
                </div>
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary flex items-center gap-1 hover:underline"
                >
                  Get Free OpenRouter Key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                id="openrouter-key"
                type="password"
                value={openRouterKey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOpenRouterKey(e.target.value)}
                placeholder="sk-or-v1-... (Paste OpenRouter Key)"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <p className="text-[11px] text-muted-foreground">
                Access free reasoning models such as DeepSeek R1 free tier and Qwen 2.5 Coder.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Keys remain private to your browser session and are never shared.</span>
            </div>
            <Button size="sm" onClick={handleSaveAiKeys} disabled={isSavingAiKeys} className="text-xs gap-1.5 shrink-0">
              {isSavingAiKeys ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> Save AI Model Keys
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Walrus Decentralized Storage Configuration */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Database className="w-4 h-4 text-emerald-500" />
            <h2 className="font-bold text-base">Walrus Protocol Storage</h2>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            All resume uploads, tailored cover letters, and STAR+R interview assessments are client-side encrypted
            using AES-256-GCM and stored across decentralized storage nodes on Walrus Testnet.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 text-xs">
            <div className="rounded-lg border p-3 bg-card/40">
              <span className="text-muted-foreground block text-[11px]">Publisher Endpoint</span>
              <span className="font-mono text-xs font-semibold">https://publisher.walrus-testnet.walrus.space</span>
            </div>
            <div className="rounded-lg border p-3 bg-card/40">
              <span className="text-muted-foreground block text-[11px]">Default Storage Duration</span>
              <span className="font-mono text-xs font-semibold">5 Epochs (~15 Days on Testnet)</span>
            </div>
          </div>
        </Card>

        {/* Data Management & Export */}
        <Card className="p-6 space-y-4 border-destructive/20">
          <div className="flex items-center gap-2 border-b pb-3">
            <Key className="w-4 h-4 text-amber-500" />
            <h2 className="font-bold text-base">Data Sovereignty & Local Cache</h2>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Export a full JSON backup of your local candidate profile and session settings, or clear locally cached
            CV extracts from this browser.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={handleExportVault} className="text-xs gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export Career Vault (JSON)
            </Button>

            {showClearConfirm ? (
              <div className="flex items-center gap-2">
                <Button variant="destructive" size="sm" onClick={handleClearCache} className="text-xs">
                  Confirm Clear Cache
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowClearConfirm(false)} className="text-xs">
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClearConfirm(true)}
                className="text-xs gap-1.5 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Local Cache
              </Button>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
