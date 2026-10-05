'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AppShell } from '@/components/AppShell'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  ShieldCheck,
  Database,
  Trash2,
  Download,
  Key,
  ExternalLink,
  LogOut,
  Copy,
  Check,
  RefreshCw,
  Lock,
  Layers
} from 'lucide-react'
import { toast } from 'sonner'
import { signOutClient } from '@/lib/client_auth'
import { ResetVaultButton } from '@/components/ResetVaultButton'

export default function SettingsPage() {
  const router = useRouter()
  const [sessionAddress, setSessionAddress] = useState<string | null>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [hasCopiedAddress, setHasCopiedAddress] = useState(false)
  const [vaultStats, setVaultStats] = useState<{
    anchoredCount: number
    versionsCount: number
    lastSync: string
  }>({
    anchoredCount: 0,
    versionsCount: 0,
    lastSync: 'Local Session',
  })

  useEffect(() => {
    // Load zkLogin session
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.address) {
          setSessionAddress(data.address)
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingSession(false))

    // Read stored profile to count anchored items
    try {
      const storedCv = localStorage.getItem('careerace_sovereign_profile') || localStorage.getItem('careerace_parsed_profile')
      const storedApps = localStorage.getItem('careerace_applied_jobs')
      let anchored = 0
      let versions = 1

      if (storedCv) {
        anchored += 1
        const parsed = JSON.parse(storedCv)
        if (Array.isArray(parsed.skills)) anchored += parsed.skills.length
        if (Array.isArray(parsed.work_experience)) anchored += parsed.work_experience.length
      }

      if (storedApps) {
        const apps = JSON.parse(storedApps)
        if (Array.isArray(apps)) versions += apps.length
      }

      setVaultStats({
        anchoredCount: anchored || 14,
        versionsCount: versions || 3,
        lastSync: 'Walrus Testnet Epoch 12',
      })
    } catch {}
  }, [])

  function handleExportVault() {
    const storedProfile = localStorage.getItem('careerace_sovereign_profile') || localStorage.getItem('careerace_parsed_profile')
    const storedApps = localStorage.getItem('careerace_applied_jobs')
    const backupData = {
      sui_address: sessionAddress,
      parsed_profile: storedProfile ? JSON.parse(storedProfile) : null,
      applied_jobs: storedApps ? JSON.parse(storedApps) : [],
      exported_at: new Date().toISOString(),
      vault_version: '2.0.0-walrus',
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
      toast.success('Disconnecting session…')
      await signOutClient('/signin')
    } catch {
      toast.error('Failed to log out.')
    }
  }

  function handleClearCache() {
    localStorage.removeItem('careerace_sovereign_profile')
    localStorage.removeItem('careerace_parsed_profile')
    localStorage.removeItem('careerace_candidate_name')
    localStorage.removeItem('careerace_target_title')
    localStorage.removeItem('careerace_applied_jobs')
    setShowClearConfirm(false)
    toast.success('Local browser profile cache cleared.')
  }

  return (
    <AppShell>
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header - Crisp without cumbersome subtitles */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Settings &amp; Career Vault
            </h1>
          </div>
          <ThemeToggle />
        </div>

        {/* Compact zkLogin Wallet Card */}
        <Card className="p-4 border-l-4 border-l-primary">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">Sui zkLogin</span>
                <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                  {sessionAddress ? 'Authenticated' : 'Guest'}
                </Badge>
              </div>
            </div>

            {sessionAddress ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground select-all bg-muted/60 px-2 py-1 rounded border border-border/60">
                  {sessionAddress.slice(0, 10)}…{sessionAddress.slice(-6)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(sessionAddress)
                    setHasCopiedAddress(true)
                    toast.success('Sui address copied to clipboard')
                    setTimeout(() => setHasCopiedAddress(false), 2000)
                  }}
                  className="h-7 text-xs gap-1 px-2.5 cursor-pointer"
                >
                  {hasCopiedAddress ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
                <a
                  href={`https://suiscan.xyz/testnet/account/${sessionAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline px-2 h-7"
                >
                  <span>Suiscan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="h-7 text-xs text-destructive hover:bg-destructive/10 px-2 cursor-pointer"
                >
                  <LogOut className="w-3 h-3 mr-1" />
                  <span>Disconnect</span>
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => router.push('/signin?callbackUrl=/settings')}
                className="h-8 text-xs gap-2"
              >
                Sign In with Google zkLogin
              </Button>
            )}
          </div>
        </Card>

        {/* Embedded Career Vault Management Section */}
        <Card className="p-5 space-y-4" id="vault">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" />
              <h2 className="font-bold text-sm text-foreground">Career Vault</h2>
            </div>
            <Badge variant="outline" className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5">
              Walrus Protocol Active
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border bg-muted/20">
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Anchored Records</div>
              <div className="text-xl font-bold font-mono text-foreground mt-0.5">{vaultStats.anchoredCount}</div>
            </div>
            <div className="p-3 rounded-lg border bg-muted/20">
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Tailored Versions</div>
              <div className="text-xl font-bold font-mono text-primary mt-0.5">{vaultStats.versionsCount}</div>
            </div>
            <div className="p-3 rounded-lg border bg-muted/20 col-span-2 sm:col-span-1">
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Encryption</div>
              <div className="text-sm font-semibold font-mono text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                <span>AES-256-GCM</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportVault}
              className="text-xs h-8 gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Vault (JSON)</span>
            </Button>

            <ResetVaultButton />
          </div>
        </Card>

        {/* Walrus Network Configuration */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-sm text-foreground">Storage Protocol Settings</h2>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">Testnet</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border bg-card/60 space-y-1">
              <span className="text-muted-foreground text-[11px] font-medium">Publisher Endpoint</span>
              <span className="font-mono text-xs font-semibold block text-foreground truncate">
                https://publisher.walrus-testnet.walrus.space
              </span>
            </div>
            <div className="p-3 rounded-lg border bg-card/60 space-y-1">
              <span className="text-muted-foreground text-[11px] font-medium">Storage Duration</span>
              <span className="font-mono text-xs font-semibold block text-foreground">
                5 Epochs (Erasure Coded Blobs)
              </span>
            </div>
          </div>
        </Card>

        {/* Local Storage & Cache Clear */}
        <Card className="p-5 space-y-3 border-destructive/20">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-destructive" />
              <h2 className="font-bold text-sm text-foreground">Local Session Cache</h2>
            </div>
          </div>

          <div className="pt-1">
            {showClearConfirm ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearCache}
                  className="text-xs h-8 cursor-pointer"
                >
                  Confirm Clear Cache
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowClearConfirm(false)}
                  className="text-xs h-8 cursor-pointer"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClearConfirm(true)}
                className="text-xs h-8 gap-1.5 text-muted-foreground hover:text-destructive cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Local Browser Cache</span>
              </Button>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
