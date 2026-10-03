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

  useEffect(() => {
    // Load local profile settings
    const storedName = localStorage.getItem('careerace_candidate_name') || ''
    const storedTitle = localStorage.getItem('careerace_target_title') || ''
    setCandidateName(storedName)
    setTargetTitle(storedTitle)

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
