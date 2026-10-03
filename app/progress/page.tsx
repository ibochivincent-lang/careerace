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
  Bell,
  Phone,
  Mail,
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

interface VideoDemoItem {
  title: string
  url: string
  platform: 'loom' | 'youtube' | 'vimeo' | 'other'
}

interface AccomplishmentsData {
  address: string | null
  skills: string[]
  targetRoles: string[]
  experience: WorkExperienceItem[]
  certifications: string[]
  videos: VideoDemoItem[]
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
    videos: [
      { title: 'Fullstack Microservices Architecture Walkthrough', url: 'https://youtube.com/watch?v=sample1', platform: 'youtube' },
      { title: 'Decentralized Walrus Blob Indexer Demo', url: 'https://loom.com/share/sample2', platform: 'loom' },
    ],
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
  const [newVideoTitle, setNewVideoTitle] = useState('')
  const [newVideoUrl, setNewVideoUrl] = useState('')

  // Reminders state
  const [remindersEnabled, setRemindersEnabled] = useState(true)
  const [reminderChannel, setReminderChannel] = useState<'email' | 'phone'>('email')
  const [reminderDestination, setReminderDestination] = useState('')

  useEffect(() => {
    loadAccomplishments()
    const savedReminder = localStorage.getItem('careerace_reminder_pref')
    if (savedReminder) {
      try {
        const pref = JSON.parse(savedReminder)
        if (typeof pref.enabled === 'boolean') setRemindersEnabled(pref.enabled)
        if (pref.channel === 'phone' || pref.channel === 'email') setReminderChannel(pref.channel)
        if (pref.destination) setReminderDestination(pref.destination)
      } catch {}
    }
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

      const localCv = localStorage.getItem('careerace_parsed_profile')
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

  function handleAddVideo() {
    if (!newVideoTitle.trim() || !newVideoUrl.trim()) return
    let platform: 'loom' | 'youtube' | 'vimeo' | 'other' = 'other'
    const lower = newVideoUrl.toLowerCase()
    if (lower.includes('youtube') || lower.includes('youtu.be')) platform = 'youtube'
    else if (lower.includes('loom.com')) platform = 'loom'
    else if (lower.includes('vimeo')) platform = 'vimeo'

    const newItem: VideoDemoItem = {
      title: newVideoTitle.trim(),
      url: newVideoUrl.trim(),
      platform
    }
    const updated = [...(data.videos || []), newItem]
    setData(prev => ({ ...prev, videos: updated }))
    setNewVideoTitle('')
    setNewVideoUrl('')
    toast.success(`Video demonstration "${newItem.title}" added to verified accomplishments.`)
  }

  function handleRemoveVideo(index: number) {
    const updated = (data.videos || []).filter((_, i) => i !== index)
    setData(prev => ({ ...prev, videos: updated }))
    toast.info('Removed video demonstration.')
  }

  function handleSaveReminders() {
    const pref = {
      enabled: remindersEnabled,
      channel: reminderChannel,
      destination: reminderDestination.trim(),
      updatedAt: new Date().toISOString()
    }
    localStorage.setItem('careerace_reminder_pref', JSON.stringify(pref))
    toast.success(`Reminders configured for ${reminderChannel === 'phone' ? 'Phone SMS/Push' : 'Email'}.`)
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

        {/* ── PROJECT VIDEO DEMONSTRATIONS & ELEVATOR PITCHES ── */}
        <Card className="p-6 border border-border/80 shadow-sm rounded-2xl bg-card space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="font-bold text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" /> Project Video Demonstrations &amp; Elevator Pitches
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Attach video walkthroughs (YouTube, Loom, Vimeo) proving your technical execution to recruiters and engineering leads.
              </p>
            </div>
            <Badge variant="secondary" className="font-mono text-xs">
              {(data.videos || []).length} Verified
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(data.videos || []).map((video, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-border/70 bg-background/60 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] uppercase font-mono text-emerald-600 border-emerald-500/30">
                      {video.platform}
                    </Badge>
                    <button
                      onClick={() => handleRemoveVideo(idx)}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      &times;
                    </button>
                  </div>
                  <h4 className="font-bold text-sm text-foreground mt-2">{video.title}</h4>
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 mt-1 truncate"
                  >
                    <span>{video.url}</span>
                    <ArrowRight className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Add Video Form */}
          <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              placeholder="Demo Title (e.g. Distributed Database Architecture Walkthrough)"
              value={newVideoTitle}
              onChange={(e) => setNewVideoTitle(e.target.value)}
              className="flex-1 text-xs rounded-lg border bg-background px-3 py-2 w-full"
            />
            <input
              type="url"
              placeholder="Video URL (YouTube, Loom, Vimeo)"
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              className="flex-1 text-xs rounded-lg border bg-background px-3 py-2 w-full"
            />
            <Button
              size="sm"
              onClick={handleAddVideo}
              className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 w-full sm:w-auto"
            >
              <Plus className="w-3.5 h-3.5" /> Add Video Demo
            </Button>
          </div>
        </Card>

        {/* Identifying Career Pathways & Upskilling Roadmap */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Career Pathways */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="font-bold text-base flex items-center gap-2">
                  <Compass className="w-4 h-4 text-primary" /> Career Pathways
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Optimal career trajectory tailored to your current capabilities and goals.
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                High Growth
              </Badge>
            </div>

            <div className="space-y-4 pt-2">
              <div className="rounded-xl border bg-card/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Phase 1: Senior Practitioner</span>
                  <Badge variant="secondary" className="text-[10px]">Current Stage</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Focus on end-to-end fullstack development, performance optimization, and robust distributed caching.
                </p>
                <div className="flex items-center gap-2 text-[11px] font-mono text-primary">
                  <span>Target: Senior Fullstack Engineer</span>
                  <span>&rarr;</span>
                  <span>Comp: $140k - $190k</span>
                </div>
              </div>

              <div className="rounded-xl border bg-card/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Phase 2: Staff / Lead Architect</span>
                  <Badge variant="outline" className="text-[10px] text-violet-500 border-violet-500/30">Next Horizon</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Drive architectural strategy, cross-team reliability, high-throughput storage systems, and technical mentorship.
                </p>
                <div className="flex items-center gap-2 text-[11px] font-mono text-violet-500">
                  <span>Target: Staff Systems Architect</span>
                  <span>&rarr;</span>
                  <span>Comp: $210k - $280k</span>
                </div>
              </div>

              <div className="rounded-xl border bg-card/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Phase 3: Principal / VP of Engineering</span>
                  <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">Long-Term Target</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Define technology vision, engineering culture, security posture, and executive organization strategy.
                </p>
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
                  High-leverage technical areas and certifications to accelerate your trajectory.
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500">
                Action Items
              </Badge>
            </div>

            <div className="space-y-3.5 pt-2">
              <div className="p-3.5 rounded-lg border bg-card/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground">Distributed Systems &amp; Resilient Caching</span>
                  <Badge variant="secondary" className="text-[10px]">Priority: High</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Master event-driven microservices, partition tolerance, idempotency tokens, and sub-millisecond query caches.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border bg-card/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground">Smart Contract &amp; Sovereign Storage Integration</span>
                  <Badge variant="secondary" className="text-[10px]">Priority: High</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Deepen expertise in Sui Move contract programming, Walrus blob lifecycle, and zero-knowledge zkLogin protocols.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border bg-card/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground">AI Copilot &amp; Agent Tool Calling</span>
                  <Badge variant="secondary" className="text-[10px]">Priority: Medium</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Integrate LLM function calling, vector embeddings, and real-time streaming interfaces into production frontends.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border bg-card/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground">Cloud Reliability &amp; Observability</span>
                  <Badge variant="secondary" className="text-[10px]">Priority: Medium</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Implement distributed tracing with OpenTelemetry, proactive alerting, and automated canary deployment rollouts.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Reminders & Notifications Preferences */}
        <Card className="p-6 border bg-card/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Application &amp; Interview Reminders</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Receive proactive alerts for interview practice rounds, status updates, and newly matched roles.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRemindersEnabled(!remindersEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  remindersEnabled ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    remindersEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-xs font-medium text-foreground">
                {remindersEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          {remindersEnabled && (
            <div className="mt-5 grid sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Reminder Channel</label>
                <div className="flex rounded-md border p-1 bg-muted/30">
                  <button
                    type="button"
                    onClick={() => setReminderChannel('email')}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-md font-medium transition-colors ${
                      reminderChannel === 'email' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" /> Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setReminderChannel('phone')}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-md font-medium transition-colors ${
                      reminderChannel === 'phone' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" /> Phone Notification
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">
                  {reminderChannel === 'phone' ? 'Phone Number (SMS / Alerts)' : 'Notification Email Address'}
                </label>
                <input
                  type={reminderChannel === 'phone' ? 'tel' : 'email'}
                  placeholder={reminderChannel === 'phone' ? '+1 (555) 000-0000' : 'candidate@example.com'}
                  value={reminderDestination}
                  onChange={(e) => setReminderDestination(e.target.value)}
                  className="w-full text-xs rounded-md border bg-background px-3 py-2"
                />
              </div>

              <div>
                <Button size="sm" onClick={handleSaveReminders} className="w-full text-xs">
                  Save Notification Preferences
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  )
}
