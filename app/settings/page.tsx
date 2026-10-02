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
  LogOut
} from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const router = useRouter()
  const [candidateName, setCandidateName] = useState('')
  const [targetTitle, setTargetTitle] = useState('')
  const [sessionAddress, setSessionAddress] = useState<string | null>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [zapierUrl, setZapierUrl] = useState('')
  const [isTestingZapier, setIsTestingZapier] = useState(false)

  useEffect(() => {
    // Load local profile settings
    const storedName = localStorage.getItem('careerace_candidate_name') || ''
    const storedTitle = localStorage.getItem('careerace_target_title') || ''
    const storedZapier = localStorage.getItem('careerace_zapier_webhook') || ''
    setCandidateName(storedName)
    setTargetTitle(storedTitle)
    setZapierUrl(storedZapier)

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

  function handleSaveZapierUrl() {
    if (!zapierUrl.trim()) {
      localStorage.removeItem('careerace_zapier_webhook')
      toast.info('Cleared Zapier webhook URL.')
      return
    }
    if (!zapierUrl.startsWith('http')) {
      toast.error('Please enter a valid HTTP/HTTPS webhook URL.')
      return
    }
    localStorage.setItem('careerace_zapier_webhook', zapierUrl.trim())
    toast.success('Zapier Webhook URL saved successfully.')
  }

  async function handleTestZapierPing() {
    if (!zapierUrl.trim()) {
      toast.error('Please enter a Zapier Webhook URL first.')
      return
    }
    setIsTestingZapier(true)
    const toastId = toast.loading('Sending test payload to Zapier...')
    try {
      const res = await fetch('/api/zapier/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'test_ping',
          webhook_url: zapierUrl.trim(),
          candidate: {
            username: candidateName || 'Candidate',
            target_role: targetTitle || 'Software Engineer',
          },
          data: {
            message: 'Hello from Career Ace Autonomous Copilot! This confirms end-to-end connectivity.',
            test_id: `test_${Date.now()}`,
          },
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message || 'Zapier received test event successfully!', { id: toastId })
      } else {
        toast.error(data.message || 'Zapier webhook returned an error.', { id: toastId })
      }
    } catch (err) {
      toast.error('Network error testing Zapier webhook.', { id: toastId })
    } finally {
      setIsTestingZapier(false)
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
              <div className="rounded-lg border bg-muted/30 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-mono uppercase text-muted-foreground block">Sui Address</span>
                  <span className="font-mono text-xs font-semibold select-all break-all">{sessionAddress}</span>
                </div>
                <a
                  href={`https://suiscan.xyz/testnet/account/${sessionAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary flex items-center gap-1 hover:underline whitespace-nowrap"
                >
                  Suiscan <ExternalLink className="w-3 h-3" />
                </a>
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

        {/* Zapier Automation Hub (6,000+ Connected Apps) */}
        <Card className="p-6 space-y-4 border-l-4 border-l-orange-500 shadow-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 font-bold text-xs">
                Z
              </div>
              <div>
                <h2 className="font-bold text-base">Zapier Automation Engine</h2>
                <p className="text-xs text-muted-foreground">
                  Connect Career Ace to 6,000+ apps for autonomous email dispatch, SMS alerts, and job tracking.
                </p>
              </div>
            </div>
            <Badge variant="outline" className={`font-mono text-xs ${zapierUrl ? 'border-orange-500/30 text-orange-600 bg-orange-500/10' : ''}`}>
              {zapierUrl ? 'Webhook Linked' : 'Not Connected'}
            </Badge>
          </div>

          <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
            <p>
              By connecting your personal <strong>Zapier Webhook</strong>, Career Ace can automatically send your tailored job applications via your own <strong>Gmail or Outlook</strong>, alert you via <strong>SMS or WhatsApp</strong> when high-match jobs are found, and record interview evaluations to <strong>Notion or Google Sheets</strong>.
            </p>

            <div className="space-y-1.5">
              <label htmlFor="zapier-url" className="text-xs font-semibold text-foreground block">
                Zapier Catch Hook URL
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="zapier-url"
                  type="url"
                  placeholder="https://hooks.zapier.com/hooks/catch/123456/abcdef/"
                  value={zapierUrl}
                  onChange={(e) => setZapierUrl(e.target.value)}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono"
                />
                <Button size="sm" onClick={handleSaveZapierUrl} className="text-xs whitespace-nowrap">
                  Save Webhook
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTestZapierPing}
                  disabled={isTestingZapier || !zapierUrl}
                  className="text-xs whitespace-nowrap gap-1.5 border-orange-500/30 text-orange-600 hover:bg-orange-500/10"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingZapier ? 'animate-spin' : ''}`} />
                  {isTestingZapier ? 'Sending...' : 'Test Connection'}
                </Button>
              </div>
            </div>

            {/* How It Works Guide */}
            <div className="rounded-lg border bg-muted/30 p-3.5 space-y-2 mt-2">
              <span className="font-semibold text-foreground text-xs block">How to set up in 2 minutes:</span>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-muted-foreground">
                <li>Go to <a href="https://zapier.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">zapier.com</a> and click <strong>Create Zap</strong>.</li>
                <li>Choose <strong>Webhooks by Zapier</strong> as Trigger and select <strong>Catch Hook</strong>.</li>
                <li>Copy your unique Webhook URL and paste it into the field above.</li>
                <li>Click <strong>Test Connection</strong> above so Zapier receives a live sample payload.</li>
                <li>In Zapier, add an Action: <em>Gmail &rarr; Send Email</em> or <em>Twilio &rarr; Send SMS</em> or <em>Notion &rarr; Create Database Item</em>!</li>
              </ol>
            </div>
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
