'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AppShell } from '@/components/AppShell'
import {
  TrendingUp,
  Award,
  ShieldCheck,
  Briefcase,
  Target,
  Database,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'

interface AccomplishmentsData {
  address: string | null
  skillsCount: number
  targetRolesCount: number
  experienceCount: number
  applicationsCount: number
  interviewsCount: number
  skills: string[]
  targetRoles: string[]
  recentFeedback: string[]
  isLoading: boolean
}

export default function ProgressPage() {
  const router = useRouter()
  const [data, setData] = useState<AccomplishmentsData>({
    address: null,
    skillsCount: 0,
    targetRolesCount: 0,
    experienceCount: 0,
    applicationsCount: 0,
    interviewsCount: 0,
    skills: [],
    targetRoles: [],
    recentFeedback: [],
    isLoading: true
  })

  async function loadAccomplishments() {
    setData(prev => ({ ...prev, isLoading: true }))
    try {
      // 1. Session check
      const sessRes = await fetch('/api/auth/session')
      const sessData = await sessRes.json()
      const address = sessData.authenticated ? sessData.address : null

      // 2. Applications check
      const appsRes = await fetch('/api/applications')
      const appsData = await appsRes.json()
      const appsCount = Array.isArray(appsData.applications) ? appsData.applications.length : 0

      // 3. Fallback extraction from local profile if guest
      let localSkills: string[] = []
      let localRoles: string[] = []
      let localExpCount = 0
      const localCv = localStorage.getItem('careerace_parsed_profile')
      if (localCv) {
        try {
          const parsed = JSON.parse(localCv)
          if (Array.isArray(parsed.skills)) localSkills = parsed.skills
          if (Array.isArray(parsed.target_roles)) localRoles = parsed.target_roles
          if (Array.isArray(parsed.work_experience)) localExpCount = parsed.work_experience.length
        } catch {}
      }

      setData({
        address,
        skillsCount: localSkills.length,
        targetRolesCount: localRoles.length,
        experienceCount: localExpCount,
        applicationsCount: appsCount,
        interviewsCount: 0,
        skills: localSkills,
        targetRoles: localRoles,
        recentFeedback: [],
        isLoading: false
      })
    } catch (err) {
      console.error(err)
      setData(prev => ({ ...prev, isLoading: false }))
    }
  }

  useEffect(() => {
    loadAccomplishments()
  }, [])

  return (
    <AppShell>
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Career Accomplishments & Metrics</h1>
              <Badge variant="outline" className="font-mono text-[10px]">
                Sovereign Proofs
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Verifiable candidate credentials, indexed technical skills, and mock interview performance records.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAccomplishments}
              disabled={data.isLoading}
              className="gap-2 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${data.isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => router.push('/memory')}
              className="gap-2 text-xs"
            >
              <Database className="w-3.5 h-3.5" />
              Open Career Vault
            </Button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-5 border-l-4 border-l-primary">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Verified Skills</span>
              <Award className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold font-mono">{data.skillsCount}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Indexed to Career Vault</p>
          </Card>

          <Card className="p-5 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Applications</span>
              <Briefcase className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono">{data.applicationsCount}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Track A & Track B routed</p>
          </Card>

          <Card className="p-5 border-l-4 border-l-violet-500">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Target Roles</span>
              <Target className="w-4 h-4 text-violet-500" />
            </div>
            <div className="text-2xl font-bold font-mono">{data.targetRolesCount}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Aligned career paths</p>
          </Card>

          <Card className="p-5 border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Storage Protocol</span>
              <ShieldCheck className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-xs">AES-256-GCM</div>
            <p className="text-[11px] text-muted-foreground mt-1">Walrus Testnet Blobs</p>
          </Card>
        </div>

        {/* Detailed Sections */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Skills Breakdown */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-bold text-base flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" /> Verified Technical Proficiencies
              </h2>
              <Badge variant="secondary" className="font-mono text-xs">{data.skills.length}</Badge>
            </div>

            {data.skills.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-lg space-y-2">
                <p>No skills indexed yet.</p>
                <p>Upload your CV on the Job Engine or record skills in the Career Vault to build your verified accomplishments.</p>
                <Button size="sm" variant="outline" onClick={() => router.push('/')} className="text-xs mt-2">
                  Upload CV
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.skills.map((skill, i) => (
                  <Badge key={i} variant="outline" className="px-3 py-1 font-mono text-xs border-primary/20 bg-primary/5">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </Card>

          {/* Target Roles & Next Steps */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-bold text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-violet-500" /> Target Engineering Roles
              </h2>
              <Badge variant="secondary" className="font-mono text-xs">{data.targetRoles.length}</Badge>
            </div>

            {data.targetRoles.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-lg space-y-2">
                <p>No target roles specified yet.</p>
                <p>Specify your preferred roles in the Career Vault or during CV extraction to unlock auto-matched feeds.</p>
                <Button size="sm" variant="outline" onClick={() => router.push('/memory')} className="text-xs mt-2">
                  Set Target Roles
                </Button>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {data.targetRoles.map((role, i) => (
                  <li key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card/50 text-xs">
                    <span className="font-semibold">{role}</span>
                    <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/20">
                      Active Target
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Sovereign Protocol Proof Card */}
        <Card className="p-6 border bg-gradient-to-br from-card to-card/50">
          <h3 className="text-sm font-bold flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Decentralized Ownership & Cryptographic Integrity
          </h3>
          <p className="text-xs leading-relaxed text-muted-foreground max-w-3xl">
            Career Ace replaces centralized corporate databases with sovereign Sui zkLogin and encrypted Walrus storage.
            Every accomplishment, CV revision, and interview evaluation is signed with zero-knowledge proofs and persisted as
            encrypted blobs. You retain irrevocable control to inspect, export, or tombstone any claim at any time.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-mono text-muted-foreground">
            <span>Identity: {data.address ? `${data.address.slice(0, 10)}...${data.address.slice(-6)}` : 'Guest'}</span>
            <span>Cipher: AES-256-GCM / PBKDF2</span>
            <span>Network: Sui Testnet & Walrus Testnet</span>
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
