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
  Plus,
  Trash2,
  Compass,
  BookOpen,
  ArrowRight,
  Layers,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'

interface WorkExperienceItem {
  role: string
  company: string
  duration?: string
}

interface AccomplishmentsData {
  address: string | null
  skills: string[]
  targetRoles: string[]
  experience: WorkExperienceItem[]
  certifications: string[]
  applicationsCount: number
  isLoading: boolean
}

export default function ProgressPage() {
  const router = useRouter()
  const [data, setData] = useState<AccomplishmentsData>({
    address: null,
    skills: [],
    targetRoles: [],
    experience: [],
    certifications: [],
    applicationsCount: 0,
    isLoading: true
  })

  // Form states for adding items
  const [newSkill, setNewSkill] = useState('')
  const [newTargetRole, setNewTargetRole] = useState('')
  const [newCert, setNewCert] = useState('')
  const [newExpRole, setNewExpRole] = useState('')
  const [newExpCompany, setNewExpCompany] = useState('')
  const [newExpDuration, setNewExpDuration] = useState('')

  useEffect(() => {
    loadAccomplishments()
  }, [])

  async function loadAccomplishments() {
    setData(prev => ({ ...prev, isLoading: true }))
    try {
      const sessRes = await fetch('/api/auth/session')
      const sessData = await sessRes.json()
      const address = sessData.authenticated ? sessData.address : null

      const appsRes = await fetch('/api/applications')
      const appsData = await appsRes.json()
      const appsCount = Array.isArray(appsData.applications) ? appsData.applications.length : 0

      let localSkills: string[] = []
      let localRoles: string[] = []
      let localExp: WorkExperienceItem[] = []
      let localCerts: string[] = []

      const localCv = localStorage.getItem('careerace_sovereign_profile') || localStorage.getItem('careerace_parsed_profile')
      if (localCv) {
        try {
          const parsed = JSON.parse(localCv)
          if (Array.isArray(parsed.skills) && parsed.skills.length > 0) localSkills = parsed.skills
          if (Array.isArray(parsed.target_roles) && parsed.target_roles.length > 0) localRoles = parsed.target_roles
          if (Array.isArray(parsed.work_experience) && parsed.work_experience.length > 0) localExp = parsed.work_experience
          if (Array.isArray(parsed.certifications) && parsed.certifications.length > 0) localCerts = parsed.certifications
        } catch {}
      }

      setData(prev => ({
        ...prev,
        address,
        skills: localSkills,
        targetRoles: localRoles,
        experience: localExp,
        certifications: localCerts,
        applicationsCount: appsCount,
        isLoading: false
      }))
    } catch (err) {
      console.error(err)
      setData(prev => ({ ...prev, isLoading: false }))
    }
  }

  function persistToLocalStorage(updates: Partial<AccomplishmentsData>) {
    const localCv = localStorage.getItem('careerace_parsed_profile')
    let current: any = {}
    if (localCv) {
      try {
        current = JSON.parse(localCv)
      } catch {}
    }
    const merged = {
      ...current,
      skills: updates.skills !== undefined ? updates.skills : data.skills,
      target_roles: updates.targetRoles !== undefined ? updates.targetRoles : data.targetRoles,
      work_experience: updates.experience !== undefined ? updates.experience : data.experience,
      certifications: updates.certifications !== undefined ? updates.certifications : data.certifications,
    }
    localStorage.setItem('careerace_parsed_profile', JSON.stringify(merged))
  }

  function handleAddSkill() {
    if (!newSkill.trim()) return
    const updated = Array.from(new Set([...data.skills, newSkill.trim()]))
    setData(prev => ({ ...prev, skills: updated }))
    persistToLocalStorage({ skills: updated })
    setNewSkill('')
    toast.success(`Skill "${newSkill.trim()}" added to verified accomplishments.`)
  }

  function handleRemoveSkill(skillToRemove: string) {
    const updated = data.skills.filter(s => s !== skillToRemove)
    setData(prev => ({ ...prev, skills: updated }))
    persistToLocalStorage({ skills: updated })
    toast.info(`Removed skill "${skillToRemove}".`)
  }

  function handleAddTargetRole() {
    if (!newTargetRole.trim()) return
    const updated = Array.from(new Set([...data.targetRoles, newTargetRole.trim()]))
    setData(prev => ({ ...prev, targetRoles: updated }))
    persistToLocalStorage({ targetRoles: updated })
    setNewTargetRole('')
    toast.success(`Target role "${newTargetRole.trim()}" added.`)
  }

  function handleRemoveTargetRole(roleToRemove: string) {
    const updated = data.targetRoles.filter(r => r !== roleToRemove)
    setData(prev => ({ ...prev, targetRoles: updated }))
    persistToLocalStorage({ targetRoles: updated })
    toast.info(`Removed target role "${roleToRemove}".`)
  }

  function handleAddExperience() {
    if (!newExpRole.trim() || !newExpCompany.trim()) {
      toast.error('Please enter both role and company.')
      return
    }
    const newEntry: WorkExperienceItem = {
      role: newExpRole.trim(),
      company: newExpCompany.trim(),
      duration: newExpDuration.trim() || 'Recent'
    }
    const updated = [newEntry, ...data.experience]
    setData(prev => ({ ...prev, experience: updated }))
    persistToLocalStorage({ experience: updated })
    setNewExpRole('')
    setNewExpCompany('')
    setNewExpDuration('')
    toast.success(`Added experience at ${newEntry.company}.`)
  }

  function handleRemoveExperience(index: number) {
    const updated = data.experience.filter((_, i) => i !== index)
    setData(prev => ({ ...prev, experience: updated }))
    persistToLocalStorage({ experience: updated })
    toast.info('Removed work experience record.')
  }

  function handleAddCertification() {
    if (!newCert.trim()) return
    const updated = Array.from(new Set([...data.certifications, newCert.trim()]))
    setData(prev => ({ ...prev, certifications: updated }))
    persistToLocalStorage({ certifications: updated })
    setNewCert('')
    toast.success(`Added certification "${newCert.trim()}".`)
  }

  function handleRemoveCertification(certToRemove: string) {
    const updated = data.certifications.filter(c => c !== certToRemove)
    setData(prev => ({ ...prev, certifications: updated }))
    persistToLocalStorage({ certifications: updated })
    toast.info(`Removed certification "${certToRemove}".`)
  }

  return (
    <AppShell>
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Accomplishments & Career Pathways</h1>
              <Badge variant="outline" className="font-mono text-[10px]">
                Sovereign Proofs
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Verifiable career credentials, work history, target roles, pathways, and upskilling roadmaps.
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
              onClick={() => router.push('/interview_room')}
              className="gap-2 text-xs"
            >
              <Target className="w-3.5 h-3.5" />
              Practice STAR+R
            </Button>
          </div>
        </div>

        {/* 4 Top Metric Cards (Clean, No Emojis) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-5 border-l-4 border-l-primary shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">Verified Skills</span>
              <Award className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold font-mono">{data.skills.length}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Indexed proficiencies</p>
          </Card>

          <Card className="p-5 border-l-4 border-l-emerald-500 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">Applications</span>
              <Briefcase className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono">{data.applicationsCount}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Dual-track submissions</p>
          </Card>

          <Card className="p-5 border-l-4 border-l-violet-500 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">Target Roles</span>
              <Target className="w-4 h-4 text-violet-500" />
            </div>
            <div className="text-2xl font-bold font-mono">{data.targetRoles.length}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Aligned career goals</p>
          </Card>

          <Card className="p-5 border-l-4 border-l-amber-500 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">Storage Protocol</span>
              <ShieldCheck className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-bold font-mono">AES-256-GCM</div>
            <p className="text-[11px] text-muted-foreground mt-1">Walrus Testnet Blobs</p>
          </Card>
        </div>

        {/* Interactive Management: Work Experience, Target Roles, Skills & Certs */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Work Experience */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" /> Work Experience
              </h2>
              <Badge variant="secondary" className="font-mono text-xs">{data.experience.length}</Badge>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="Role (e.g. Senior Frontend Engineer)"
                value={newExpRole}
                onChange={(e) => setNewExpRole(e.target.value)}
                className="w-full text-xs rounded-md border bg-background px-3 py-1.5"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Company"
                  value={newExpCompany}
                  onChange={(e) => setNewExpCompany(e.target.value)}
                  className="w-2/3 text-xs rounded-md border bg-background px-3 py-1.5"
                />
                <input
                  type="text"
                  placeholder="Duration"
                  value={newExpDuration}
                  onChange={(e) => setNewExpDuration(e.target.value)}
                  className="w-1/3 text-xs rounded-md border bg-background px-3 py-1.5"
                />
              </div>
              <Button size="sm" variant="outline" onClick={handleAddExperience} className="w-full text-xs gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add Experience
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pt-2">
              {data.experience.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No experience records added.</p>
              ) : (
                data.experience.map((exp, i) => (
                  <div key={i} className="flex items-start justify-between p-2.5 rounded-lg border bg-card/50 text-xs">
                    <div>
                      <div className="font-semibold text-foreground">{exp.role}</div>
                      <div className="text-[11px] text-muted-foreground">{exp.company} &bull; {exp.duration || 'Recent'}</div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveExperience(i)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Target Roles */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-violet-500" /> Target Roles
              </h2>
              <Badge variant="secondary" className="font-mono text-xs">{data.targetRoles.length}</Badge>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Role (e.g. Staff Fullstack Engineer)"
                value={newTargetRole}
                onChange={(e) => setNewTargetRole(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTargetRole()}
                className="flex-1 text-xs rounded-md border bg-background px-3 py-1.5"
              />
              <Button size="sm" variant="outline" onClick={handleAddTargetRole} className="text-xs">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pt-2">
              {data.targetRoles.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No target roles specified.</p>
              ) : (
                data.targetRoles.map((role, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border bg-card/50 text-xs">
                    <span className="font-medium">{role}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveTargetRole(role)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Certifications & Skills */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" /> Skills &amp; Certifications
              </h2>
              <Badge variant="secondary" className="font-mono text-xs">{data.skills.length + data.certifications.length}</Badge>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Skill / Certification"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                className="flex-1 text-xs rounded-md border bg-background px-3 py-1.5"
              />
              <Button size="sm" variant="outline" onClick={handleAddSkill} className="text-xs">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto pt-2">
              {data.skills.length === 0 && data.certifications.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 w-full">No skills recorded.</p>
              ) : (
                <>
                  {data.skills.map((skill, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="px-2.5 py-1 text-[11px] font-mono border-primary/25 bg-primary/5 flex items-center gap-1.5"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-destructive text-muted-foreground"
                      >
                        &times;
                      </button>
                    </Badge>
                  ))}
                  {data.certifications.map((cert, i) => (
                    <Badge
                      key={`cert_${i}`}
                      variant="outline"
                      className="px-2.5 py-1 text-[11px] font-mono border-emerald-500/25 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"
                    >
                      <span>{cert}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCertification(cert)}
                        className="hover:text-destructive text-muted-foreground"
                      >
                        &times;
                      </button>
                    </Badge>
                  ))}
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Identifying Career Pathways & Upskilling Roadmap */}
        {(() => {
          const rawTargetRole = (data.targetRoles && data.targetRoles.length > 0)
            ? data.targetRoles[0]
            : 'Software Engineer'
          const baseRole = rawTargetRole.replace(/^(junior|associate|mid|senior|staff|lead|principal)\s+/i, '').trim() || rawTargetRole
          const primarySkills = (data.skills || []).slice(0, 4).join(', ') || 'core domain technologies'

          return (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Career Pathways — Dynamically Grounded in Target Role (No Emojis) */}
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h2 className="font-bold text-base flex items-center gap-2">
                      <Compass className="w-4 h-4 text-primary" /> Career Pathways
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Grounded in your target role: <span className="font-semibold text-foreground">{rawTargetRole}</span>
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                    Tailored Path
                  </Badge>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="rounded-xl border bg-card/60 p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Phase 1: Senior Practitioner</span>
                      <Badge variant="secondary" className="text-[10px]">Current Stage</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Lead direct execution, core system deliveries, and production reliability leveraging {primarySkills}.
                    </p>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-primary">
                      <span>Target: Senior {baseRole}</span>
                      <span>&rarr;</span>
                      <span>Comp: $135k - $185k</span>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-card/60 p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Phase 2: Staff / Technical Lead</span>
                      <Badge variant="outline" className="text-[10px] text-violet-500 border-violet-500/30">Next Horizon</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Drive cross-functional technical strategy, high-scale architecture, mentoring, and technical vision.
                    </p>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-violet-500">
                      <span>Target: Staff {baseRole}</span>
                      <span>&rarr;</span>
                      <span>Comp: $190k - $265k</span>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-card/60 p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Phase 3: Principal / Executive Leadership</span>
                      <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">Long-Term Target</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Set organizational technical standards, engineering culture, cross-team reliability, and executive roadmap.
                    </p>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-500">
                      <span>Target: Principal Architect / VP of Engineering</span>
                      <span>&rarr;</span>
                      <span>Comp: $270k - $360k</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Upskilling Roadmap */}
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h2 className="font-bold text-base flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-500" /> Upskilling Roadmap
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      High-leverage technical areas to accelerate your trajectory to {rawTargetRole}.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500">
                    Action Items
                  </Badge>
                </div>

                <div className="space-y-3.5 pt-2">
                  <div className="p-3.5 rounded-lg border bg-card/50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-foreground">High-Throughput Systems &amp; Resilient Architecture</span>
                      <Badge variant="secondary" className="text-[10px]">Priority: High</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Master microservices resilience, partition tolerance, sub-millisecond caching, and event-driven patterns.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg border bg-card/50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-foreground">Decentralized Storage &amp; Cryptographic Proofs</span>
                      <Badge variant="secondary" className="text-[10px]">Priority: High</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Deepen knowledge in Walrus decentralized blob storage, erasure coding, threshold encryption, and zkLogin.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg border bg-card/50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-foreground">AI Copilot &amp; Agent Tool Integration</span>
                      <Badge variant="secondary" className="text-[10px]">Priority: Medium</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Deploy LLM function calling, semantic vector recall, and production streaming pipelines.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg border bg-card/50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-foreground">Production Reliability &amp; Observability</span>
                      <Badge variant="secondary" className="text-[10px]">Priority: Medium</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Establish OpenTelemetry distributed tracing, synthetic user telemetry, and automated canary rollbacks.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )
        })()}
      </div>
    </AppShell>
  )
}
