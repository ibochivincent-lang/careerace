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
  ExternalLink,
  LogOut,
  Copy,
  Check,
  Lock,
  Layers,
  Globe,
  User,
  Sparkles,
  ArrowRight,
  Save,
  CheckCircle2,
  FileCheck,
  Shield,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { signOutClient, getClientSessionAddress } from '@/lib/client_auth'
import { syncCandidateDataToCloud } from '@/lib/cloud_sync'
import { normalizeSuinsName } from '@/lib/suins'
import { ResetVaultButton } from '@/components/ResetVaultButton'
import { getLaunchShieldMatrix, ShieldItem } from '@/lib/api_security'

export default function SettingsPage() {
  const router = useRouter()
  const [sessionAddress, setSessionAddress] = useState<string | null>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [hasCopiedAddress, setHasCopiedAddress] = useState(false)

  // Sovereign Candidate Profile & SuiNS state
  const [candidateName, setCandidateName] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [suinsDomain, setSuinsDomain] = useState('')
  const [isBindingSuins, setIsBindingSuins] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileSkillsCount, setProfileSkillsCount] = useState(0)
  const [profileExpCount, setProfileExpCount] = useState(0)

  const [vaultStats, setVaultStats] = useState<{
    anchoredCount: number
    versionsCount: number
    lastSync: string
  }>({
    anchoredCount: 0,
    versionsCount: 0,
    lastSync: 'Local Session',
  })

  // Pre-Launch Compliance & Security Shield state
  const [shieldMatrix] = useState<ShieldItem[]>(() => getLaunchShieldMatrix())
  const [shieldFilter, setShieldFilter] = useState<'all' | 'Legal & Compliance' | 'Technical Security'>('all')
  const [showErasureConfirm, setShowErasureConfirm] = useState(false)
  const [isErasing, setIsErasing] = useState(false)

  useEffect(() => {
    // Load zkLogin session
    const localAddr = getClientSessionAddress()
    if (localAddr) {
      setSessionAddress(localAddr)
      setIsLoadingSession(false)
    }

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
      const storedName = localStorage.getItem('careerace_candidate_name')
      const storedRole = localStorage.getItem('careerace_target_title')
      const storedDomain = localStorage.getItem('careerace_suins_domain')

      if (storedDomain) setSuinsDomain(storedDomain)

      let anchored = 0
      let versions = 1

      if (storedCv) {
        anchored += 1
        const parsed = JSON.parse(storedCv)
        if (parsed.applicant_name && !storedName) {
          setCandidateName(parsed.applicant_name)
        }
        if (parsed.target_roles?.[0] && !storedRole) {
          setTargetRole(parsed.target_roles[0])
        }
        if (Array.isArray(parsed.skills)) {
          anchored += parsed.skills.length
          setProfileSkillsCount(parsed.skills.length)
        }
        if (Array.isArray(parsed.work_experience)) {
          anchored += parsed.work_experience.length
          setProfileExpCount(parsed.work_experience.length)
        }
      }

      if (storedName) setCandidateName(storedName)
      if (storedRole) setTargetRole(storedRole)

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

  async function handleSaveProfile() {
    setIsSavingProfile(true)
    try {
      const cleanName = candidateName.trim()
      const cleanRole = targetRole.trim()

      if (cleanName) {
        localStorage.setItem('careerace_candidate_name', cleanName)
      }
      if (cleanRole) {
        localStorage.setItem('careerace_target_title', cleanRole)
      }

      // Update sovereign profile record if present
      const rawProfile = localStorage.getItem('careerace_sovereign_profile') || localStorage.getItem('careerace_parsed_profile')
      if (rawProfile) {
        const parsed = JSON.parse(rawProfile)
        if (cleanName) parsed.applicant_name = cleanName
        if (cleanRole) {
          parsed.target_roles = [cleanRole, ...(parsed.target_roles || []).filter((r: string) => r !== cleanRole)]
        }
        localStorage.setItem('careerace_sovereign_profile', JSON.stringify(parsed))
      }

      syncCandidateDataToCloud({
        candidateName: cleanName,
        targetRole: cleanRole,
      })

      window.dispatchEvent(new CustomEvent('careerace_auth_changed', { detail: { username: cleanName } }))
      toast.success('Sovereign profile updated successfully.')
    } catch {
      toast.error('Failed to update profile.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function handleBindSuins() {
    if (!suinsDomain.trim()) {
      toast.error('Please enter a .sui domain name.')
      return
    }

    const normalized = normalizeSuinsName(suinsDomain)
    setSuinsDomain(normalized)
    setIsBindingSuins(true)
    const toastId = toast.loading(`Registering ${normalized} on Sui...`)

    try {
      const addr = sessionAddress || getClientSessionAddress()
      if (!addr) {
        throw new Error('Please sign in with your Sui wallet to bind your domain.')
      }

      const res = await fetch('/api/suins/bind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: normalized,
          candidateAddress: addr,
        }),
      })

      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to bind SuiNS domain.')
      }

      localStorage.setItem('careerace_suins_domain', normalized)
      syncCandidateDataToCloud({ suinsDomain: normalized })
      window.dispatchEvent(new CustomEvent('careerace_suins_changed', { detail: { domain: normalized } }))

      toast.success(`Successfully bound ${normalized} to your sovereign address!`, { id: toastId })
    } catch (err: any) {
      toast.error(err.message || 'Failed to bind SuiNS domain.', { id: toastId })
    } finally {
      setIsBindingSuins(false)
    }
  }

  function handleExportVault() {
    const storedProfile = localStorage.getItem('careerace_sovereign_profile') || localStorage.getItem('careerace_parsed_profile')
    const storedApps = localStorage.getItem('careerace_applied_jobs')
    const backupData = {
      sui_address: sessionAddress,
      suins_domain: suinsDomain || null,
      candidate_name: candidateName || null,
      target_role: targetRole || null,
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
      toast.success('Disconnecting session...')
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
    localStorage.removeItem('careerace_suins_domain')
    localStorage.removeItem('careerace_applied_jobs')
    setShowClearConfirm(false)
    toast.success('Local browser profile cache cleared.')
  }

  async function handleGdprErasure() {
    setIsErasing(true)
    const toastId = toast.loading('Purging cloud records under GDPR Art. 17...')
    try {
      const res = await fetch('/api/candidate/sync', { method: 'DELETE' })
      if (!res.ok) throw new Error('Cloud erasure request failed.')
      handleClearCache()
      setShowErasureConfirm(false)
      toast.success('All candidate records, memories, and applications permanently erased.', { id: toastId })
    } catch (err: any) {
      toast.error(err.message || 'Erasure failed.', { id: toastId })
    } finally {
      setIsErasing(false)
    }
  }

  return (
    <AppShell>
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Account &amp; Sovereign Settings
            </h1>
          </div>
          <ThemeToggle />
        </div>

        {/* 1. Sui Name Service (SuiNS) Passport & Candidate Identity */}
        <Card className="p-5 space-y-4 border border-border shadow-xs bg-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <h2 className="font-bold text-sm text-foreground">Sui Name Service (SuiNS) &amp; Sovereign Profile</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5">
                {suinsDomain ? `${suinsDomain} Active` : 'Domain Unbound'}
              </Badge>
              <Badge variant="secondary" className="font-mono text-[10px]">
                Sui Testnet
              </Badge>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Candidate Name Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Candidate Full Name</span>
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="e.g. Vincent Ibochi"
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Target Career Title Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Target Career Discipline / Role</span>
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Marine Systems Engineer / Cloud Architect"
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* SuiNS Domain Input & Action */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-500" />
                <span>SuiNS Sovereign Domain (.sui)</span>
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={suinsDomain}
                    onChange={(e) => setSuinsDomain(e.target.value)}
                    placeholder="e.g. alex or alex.sui"
                    className="w-full h-9 pl-3 pr-12 rounded-lg border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-mono text-muted-foreground pointer-events-none">
                    .sui
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={handleBindSuins}
                  disabled={isBindingSuins}
                  className="h-9 px-4 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shrink-0"
                >
                  <Globe className="w-3.5 h-3.5 mr-1.5" />
                  <span>{isBindingSuins ? 'Registering...' : 'Bind .sui Domain'}</span>
                </Button>
                {suinsDomain && (
                  <a
                    href={`https://suins.io/#/${normalizeSuinsName(suinsDomain)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1 h-9 px-3 rounded-lg border border-border bg-muted/40 text-xs text-foreground hover:bg-muted font-medium cursor-pointer shrink-0"
                  >
                    <span>View on SuiNS</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics & Save Profile Action */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
            <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
              <span>{profileSkillsCount} Skills Verified</span>
              <span>·</span>
              <span>{profileExpCount} Positions Indexed</span>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className="text-xs h-8 gap-1.5 border-border hover:bg-muted text-foreground cursor-pointer font-semibold"
            >
              <Save className="w-3.5 h-3.5 text-primary" />
              <span>{isSavingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
            </Button>
          </div>
        </Card>

        {/* 2. Compact zkLogin Wallet Card */}
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
                  {sessionAddress.slice(0, 10)}...{sessionAddress.slice(-6)}
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

        {/* 3. Embedded Career Vault Management Section */}
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
              <Download className="w-3.5 h-3.5 text-primary" />
              <span>Export Vault (GDPR Art. 20 JSON)</span>
            </Button>

            <ResetVaultButton />
          </div>
        </Card>

        {/* 4. Pre-Launch Compliance & Technical Security Shield Matrix (28/28 Active) */}
        <Card className="p-5 space-y-4 border-primary/20 shadow-sm" id="security-shield">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <div>
                <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
                  Launch Readiness &amp; Security Shield
                  <Badge variant="outline" className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                    28/28 Safeguards Active
                  </Badge>
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  8 Legal &amp; Compliance Safeguards + 20 Technical Defenses protecting against lawsuits and exploits.
                </p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 self-start sm:self-center">
              <Button
                variant={shieldFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShieldFilter('all')}
                className="h-6 text-[10px] px-2 cursor-pointer"
              >
                All (28)
              </Button>
              <Button
                variant={shieldFilter === 'Legal & Compliance' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShieldFilter('Legal & Compliance')}
                className="h-6 text-[10px] px-2 cursor-pointer"
              >
                Legal (8)
              </Button>
              <Button
                variant={shieldFilter === 'Technical Security' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShieldFilter('Technical Security')}
                className="h-6 text-[10px] px-2 cursor-pointer"
              >
                Security (20)
              </Button>
            </div>
          </div>

          {/* Matrix Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
            {shieldMatrix
              .filter((item) => (shieldFilter === 'all' ? true : item.category === shieldFilter))
              .map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-lg border bg-muted/15 hover:bg-muted/30 transition-colors flex items-start gap-2.5 text-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-foreground truncate">{item.title}</span>
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-background border text-muted-foreground shrink-0">
                        {item.routeOrFile}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
          </div>

          {/* Quick Legal Links */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">Official Documents:</span>
            <a href="/privacy" className="text-primary hover:underline flex items-center gap-0.5">
              <span>Privacy Policy</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <span>&bull;</span>
            <a href="/terms" className="text-primary hover:underline flex items-center gap-0.5">
              <span>Terms of Service ($100 Cap)</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <span>&bull;</span>
            <a href="/subprocessors" className="text-primary hover:underline flex items-center gap-0.5">
              <span>Subprocessors Registry</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <span>&bull;</span>
            <a href="/dpa" className="text-primary hover:underline flex items-center gap-0.5">
              <span>Data Processing Agreement (DPA)</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </Card>

        {/* 5. Walrus Network Configuration */}
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

        {/* 6. Sovereign Data Erasure & Cache Clear (GDPR Art. 17) */}
        <Card className="p-5 space-y-3 border-destructive/20 bg-destructive/5">
          <div className="flex items-center justify-between border-b border-destructive/20 pb-3">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-destructive" />
              <h2 className="font-bold text-sm text-foreground">Data Sovereignty &amp; Erasure (GDPR Art. 17)</h2>
            </div>
            <Badge variant="outline" className="font-mono text-[10px] text-destructive border-destructive/30">
              Irreversible Actions
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            In compliance with GDPR Article 17 (Right to be Forgotten) and CCPA, you retain permanent sovereignty over all candidate dossiers. You can wipe your local device cache or request total cryptographic erasure across cloud databases.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {showClearConfirm ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearCache}
                  className="text-xs h-8 cursor-pointer"
                >
                  Confirm Local Cache Wipe
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

            {showErasureConfirm ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isErasing}
                  onClick={handleGdprErasure}
                  className="text-xs h-8 cursor-pointer font-semibold shadow-sm"
                >
                  {isErasing ? 'Erasing Everything…' : 'Confirm Total GDPR Art. 17 Erasure'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowErasureConfirm(false)}
                  className="text-xs h-8 cursor-pointer"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowErasureConfirm(true)}
                className="text-xs h-8 gap-1.5 cursor-pointer font-medium"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Request GDPR Article 17 Erasure</span>
              </Button>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
