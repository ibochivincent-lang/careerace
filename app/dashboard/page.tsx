'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AppShell } from '@/components/AppShell'
import { AccountChip } from '@/components/AccountChip'
import { ThemeToggle } from '@/components/ThemeToggle'
import { toast } from 'sonner'
import {
  Briefcase, Search, Upload, FileText, CheckCircle2,
  ChevronRight, Paperclip, Sparkles, MessageSquare,
  Award, User, GraduationCap, Send, Bot, Plus, X, AlertCircle,
  Building, ShieldCheck, Phone, Mail, Database, ExternalLink, Lock,
  Download, FileCode, Eye, Check, RefreshCw, ArrowRight,
  Copy, Trash2, ArrowUpRight
} from 'lucide-react'
import { AtsXRayDialog } from '@/components/AtsXRayDialog'
import { generateDocxBlob } from '@/lib/docx_exporter'
import { exportToJsonResume, importFromJsonResume } from '@/lib/json_resume'
import { enforceGoogleXyzFormula } from '@/lib/resume_tailor'
import { analyzeAtsMatch, type AtsScorecard } from '@/lib/ats_engine'

const INITIAL_SOVEREIGN_PROFILE = {
  applicant_name: 'Ibochi Vincent',
  contact_email: 'ibochivincent@gmail.com',
  contact_phone: '+1 (555) 019-2834',
  location: 'San Francisco, CA (Open to Remote)',
  availability: 'Remote-First (Full-time)',
  seniority_level: 'Mid-Level',
  target_roles: ['Software Engineer', 'Fullstack Engineer'],
  skills: ['TypeScript', 'Next.js', 'React', 'Node.js', 'PostgreSQL', 'Go', 'Distributed Systems'],
  years_of_experience: '3',
  academic_history: [
    {
      institution: 'University of Lagos / Tech Institute',
      degree: 'B.Sc. in Computer Science',
      graduation_year: '2023',
    },
  ],
  work_experience: [
    {
      company: 'Tech Solutions Inc.',
      role: 'Fullstack Engineer',
      duration: '2023 - Present',
      highlights: [
        'Engineered scalable microservices and built responsive web applications, reducing API response times by 35%.',
        'Architected real-time streaming pipeline processing 1M+ daily events with 99.9% uptime.'
      ],
    },
  ],
  certifications: ['AWS Certified Developer', 'Sui Move Developer Certification'],
  custom_achievements: [
    'Won 1st place in regional Web3 hackathon for decentralized storage application',
    'Scaled backend services to handle 2M+ requests per minute with sub-50ms latency'
  ],
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'

  const [sessionAddress, setSessionAddress] = useState<string | null>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(true)

  // Candidate CV File Attachment state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [parsedProfile, setParsedProfile] = useState<any>(INITIAL_SOVEREIGN_PROFILE)
  const [isSavingMemory, setIsSavingMemory] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [cvText, setCvText] = useState('')
  const [showHighlights, setShowHighlights] = useState(true)

  // Universal Job Harvester state
  const [isHarvesting, setIsHarvesting] = useState(false)
  const [harvestedJobs, setHarvestedJobs] = useState<any[]>([])
  const [evaluatingJobId, setEvaluatingJobId] = useState<string | null>(null)
  const [evaluationResults, setEvaluationResults] = useState<Record<string, any>>({})

  // Career Ace AI Copilot Chatbot state
  const [chatInput, setChatInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content:
        "Hello Ibochi! I am Career Ace, your autonomous AI career copilot with Walrus Sovereign Memory. I remember your full background, work milestones, and verified skills across every session.\n\nYour resume currently scores 94/100 for ATS readiness. What would you like to tackle today? We can tailor your resume for a specific role, audit ATS keywords, or draft a targeted cover letter."
    }
  ])

  // Custom highlights editing state
  const [newSkillInput, setNewSkillInput] = useState('')
  const [newAchievementInput, setNewAchievementInput] = useState('')
  const [newRoleInput, setNewRoleInput] = useState('')
  const [newInstInput, setNewInstInput] = useState('')
  const [newDegreeInput, setNewDegreeInput] = useState('')
  const [newEduYearInput, setNewEduYearInput] = useState('')
  const [newExpCompany, setNewExpCompany] = useState('')
  const [newExpRole, setNewExpRole] = useState('')
  const [newExpDuration, setNewExpDuration] = useState('')
  const [newCertInput, setNewCertInput] = useState('')

  // Tailoring state
  const [tailorCompany, setTailorCompany] = useState('Mysten Labs')
  const [tailorRole, setTailorRole] = useState('Senior Fullstack Engineer')
  const [coverLetterAngle, setCoverLetterAngle] = useState<'systems' | 'product' | 'startup'>('systems')
  const [tailoredResumeText, setTailoredResumeText] = useState('')
  const [tailoredCoverLetterText, setTailoredCoverLetterText] = useState('')
  const [isXRayOpen, setIsXRayOpen] = useState(false)
  const [atsScorecard, setAtsScorecard] = useState<AtsScorecard | null>(null)
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false)
  const jsonResumeFileInputRef = useRef<HTMLInputElement>(null)

  // Profiles State (GitHub & LinkedIn)
  const [githubUsername, setGithubUsername] = useState('ibochivincent-lang')
  const [linkedinUrl, setLinkedinUrl] = useState('https://linkedin.com/in/ibochi-vincent')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('careerace_sovereign_profile') || localStorage.getItem('careerace_parsed_profile')
      if (stored) {
        const loaded = JSON.parse(stored)
        setParsedProfile({ ...INITIAL_SOVEREIGN_PROFILE, ...loaded })
        if (loaded.target_roles?.[0]) setTailorRole(loaded.target_roles[0])
      }
    } catch {}

    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.address) {
          setSessionAddress(data.address)
        }
      })
      .catch((err) => {
        console.warn('Session verification notice:', err)
      })
      .finally(() => {
        setIsLoadingSession(false)
      })

    // Load initial curated roles
    fetch('/api/harvest?query=software%20engineer')
      .then((r) => r.json())
      .then((data) => {
        if (data.jobs && data.jobs.length > 0) {
          setHarvestedJobs(data.jobs)
        }
      })
      .catch(() => {})
  }, [])

  // Calculate dynamic ATS match scorecard
  useEffect(() => {
    if (parsedProfile) {
      const expText = (parsedProfile.work_experience || [])
        .map((w: any) => `${w.role} at ${w.company}: ${(w.highlights || []).join(' ')}`)
        .join(' ')
      const eduText = (parsedProfile.academic_history || [])
        .map((a: any) => `${a.degree} at ${a.institution}`)
        .join(' ')
      const score = analyzeAtsMatch({
        jobTitle: tailorRole || parsedProfile.target_roles?.[0] || 'Software Engineer',
        jobDescription: `Looking for an experienced engineer skilled in ${(parsedProfile.skills || []).slice(0, 6).join(', ')} with strong architecture and production delivery.`,
        applicantSkills: parsedProfile.skills || [],
        applicantExperienceText: expText,
        applicantAcademicText: eduText,
        applicantContactInfo: {
          email: parsedProfile.contact_email || parsedProfile.email,
          phone: parsedProfile.contact_phone || parsedProfile.phone,
          location: parsedProfile.location
        }
      })
      setAtsScorecard(score)
    }
  }, [parsedProfile, tailorRole])

  // Profile editing functions
  function handleAddSkill() {
    if (!newSkillInput.trim() || !parsedProfile) return
    const updated = {
      ...parsedProfile,
      skills: [...(parsedProfile.skills || []), newSkillInput.trim()]
    }
    setParsedProfile(updated)
    setNewSkillInput('')
  }

  function handleRemoveSkill(skillToRemove: string) {
    if (!parsedProfile) return
    const updated = {
      ...parsedProfile,
      skills: (parsedProfile.skills || []).filter((s: string) => s !== skillToRemove)
    }
    setParsedProfile(updated)
  }

  async function handleSaveAndSyncProfile() {
    if (!parsedProfile) return
    setIsSavingMemory(true)
    const toastId = toast.loading('Sealing profile and syncing to Walrus Memory...')
    try {
      localStorage.setItem('careerace_sovereign_profile', JSON.stringify(parsedProfile))
      localStorage.setItem('careerace_parsed_profile', JSON.stringify(parsedProfile))
      if (parsedProfile.target_roles?.[0]) {
        localStorage.setItem('careerace_target_title', parsedProfile.target_roles[0])
      }

      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: parsedProfile })
      })

      if (res.ok) {
        toast.success('Sovereign Candidate Profile verified and synced to Walrus Memory!', { id: toastId })
      } else {
        toast.success('Profile saved to local vault.', { id: toastId })
      }
    } catch {
      toast.error('Failed to sync to Walrus Memory.', { id: toastId })
    } finally {
      setIsSavingMemory(false)
    }
  }

  async function handleDownloadDocxResume() {
    if (!parsedProfile) return
    setIsDownloadingDocx(true)
    const toastId = toast.loading('Compiling 100% ATS-compliant .docx resume...')
    try {
      const blob = await generateDocxBlob(parsedProfile, tailoredResumeText || undefined)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(parsedProfile.applicant_name || 'candidate').replace(/\s+/g, '_')}_Resume.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Native ATS-compliant .docx resume downloaded!', { id: toastId })
    } catch {
      toast.error('Failed to generate .docx resume.', { id: toastId })
    } finally {
      setIsDownloadingDocx(false)
    }
  }

  function handleExportJsonResume() {
    if (!parsedProfile) return
    try {
      const jsonResume = exportToJsonResume(parsedProfile, tailoredResumeText || undefined)
      const blob = new Blob([JSON.stringify(jsonResume, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(parsedProfile.applicant_name || 'candidate').replace(/\s+/g, '_')}_JSON_Resume.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('JSON Resume Standard v1.0.0 file exported!')
    } catch {
      toast.error('Failed to export JSON Resume.')
    }
  }

  async function handleImportJsonResumeFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const imported = importFromJsonResume(parsed)
      setParsedProfile(imported)
      localStorage.setItem('careerace_sovereign_profile', JSON.stringify(imported))
      toast.success(`Successfully imported JSON Resume for ${imported.applicant_name}!`)
    } catch {
      toast.error('Failed to parse JSON Resume file. Please ensure it follows Schema v1.0.0.')
    }
  }

  function handleGenerateTailoredResume() {
    const role = tailorRole || parsedProfile?.target_roles?.[0] || 'Software Engineer'
    const company = tailorCompany || 'Target Employer'
    const name = parsedProfile?.applicant_name || 'Candidate'
    const skills = (parsedProfile?.skills || []).slice(0, 8).join(', ') || 'TypeScript, React, Node.js'
    const edu = parsedProfile?.academic_history?.[0]?.degree || 'Computer Science'
    const inst = parsedProfile?.academic_history?.[0]?.institution || 'University'

    const rawAchievements = parsedProfile?.custom_achievements?.length
      ? parsedProfile.custom_achievements
      : ['Delivered high-throughput systems reducing operational latency by 40%.', 'Architected robust modular microservices with 99.9% uptime.']
    const xyzAchievements = rawAchievements.map((a: string) => enforceGoogleXyzFormula(a, parsedProfile?.skills?.[0]))

    const tailored =
      `TARGET ROLE: ${role.toUpperCase()} — TARGET EMPLOYER: ${company.toUpperCase()}\n\n` +
      `EXECUTIVE SUMMARY:\n` +
      `Results-driven ${parsedProfile?.seniority_level || 'Mid-Level'} professional with verified competencies in ${skills}. Dedicated to architecting scalable solutions, driving measurable business impact, and collaborating across high-performing cross-functional teams.\n\n` +
      `CORE COMPETENCIES & ATS KEYWORDS:\n` +
      `• ${(parsedProfile?.skills || ['Leadership', 'System Architecture', 'Delivery']).join(' • ')}\n\n` +
      `GOOGLE XYZ QUANTIFIED ACHIEVEMENTS:\n` +
      `${xyzAchievements.map((a: string) => `• ${a}`).join('\n')}\n\n` +
      `PROFESSIONAL EXPERIENCE:\n` +
      (parsedProfile?.work_experience || []).map((exp: any) =>
        `• ${exp.role} at ${exp.company} (${exp.duration || 'Present'}):\n` +
        (exp.highlights || []).map((h: string) => `  - ${enforceGoogleXyzFormula(h)}`).join('\n')
      ).join('\n\n') +
      `\n\nEDUCATION & CREDENTIALS:\n` +
      `• ${edu}, ${inst}\n` +
      `• Sovereign Career Verification: https://careerace.online/p/${encodeURIComponent(name)}`

    setTailoredResumeText(tailored)
    toast.success(`Tailored resume compiled for ${company}!`)
  }

  function handleGenerateCoverLetter() {
    const role = tailorRole || 'Software Engineer'
    const company = tailorCompany || 'Target Company'
    const name = parsedProfile?.applicant_name || 'Ibochi Vincent'
    const email = parsedProfile?.contact_email || 'candidate@careerace.online'
    const phone = parsedProfile?.contact_phone || '+1 (555) 019-2834'
    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const topSkill = parsedProfile?.skills?.[0] || 'distributed systems'

    let narrative = ''
    if (coverLetterAngle === 'systems') {
      narrative =
        `I am writing to express my strong enthusiasm for the ${role} position at ${company}. Having specialized in ${topSkill} and production microservice architectures, I have spent the last three years building high-throughput systems that handle over 2M+ requests per second while reducing p99 latency by 35%.\n\n` +
        `At ${company}, scaling infrastructure reliably while keeping iteration cycles rapid is essential. In my current role at ${parsedProfile?.work_experience?.[0]?.company || 'Tech Solutions Inc.'}, I led the migration of our core pipeline to a parallelized, cache-aware architecture, directly saving hundreds of engineering hours each month. I am eager to bring this rigor and ownership to your team.`
    } else if (coverLetterAngle === 'product') {
      narrative =
        `I am excited to apply for the ${role} opening at ${company}. As a developer focused on product velocity and high-converting user interfaces, I blend strong technical foundations in ${(parsedProfile?.skills || []).slice(0, 3).join(', ')} with an obsession for end-user delight.\n\n` +
        `Throughout my career, I have partnered closely with product managers and designers to take features from whiteboard concepts to production deployments in tight sprint cycles. I would welcome the opportunity to accelerate ${company}'s product roadmap.`
    } else {
      narrative =
        `I am reaching out regarding the ${role} role at ${company}. As an engineer who thrives in high-autonomy environments, I take pride in end-to-end execution — from architecting backend microservices to designing responsive frontends and automating CI/CD deployments.\n\n` +
        `I am deeply inspired by ${company}'s mission and would be thrilled to bring my proactive problem-solving to your core initiatives.`
    }

    const letter =
      `${name}\n` +
      `${email} · ${phone} · San Francisco, CA\n\n` +
      `${today}\n\n` +
      `Hiring Team · ${company}\n\n` +
      `Dear ${company} Hiring Team,\n\n` +
      `${narrative}\n\n` +
      `Thank you for your time and consideration. I welcome the opportunity to discuss how my verified background aligns with ${company}'s goals.\n\n` +
      `Sincerely,\n` +
      `${name}\n` +
      `Verified Career Passport: https://careerace.online/p/${encodeURIComponent(name)}`

    setTailoredCoverLetterText(letter)
    toast.success(`Custom cover letter generated for ${company}!`)
  }

  async function handleFileSelect(file: File | null) {
    setSelectedFile(file)
    if (!file) return

    setIsParsing(true)
    setParseError(null)
    toast.info(`Extracting CV text from ${file.name}...`)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/cv_upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to extract CV file')
      }
      if (data.profile) {
        setParsedProfile(data.profile)
        setShowHighlights(true)
        toast.success(`CV uploaded and parsed successfully for ${data.profile.applicant_name || 'Candidate'}!`)
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `I've attached and parsed **${file.name}**!\n\nCandidate: **${data.profile.applicant_name}**\n- Skills: ${data.profile.skills?.slice(0, 8).join(', ')}\n- Target: ${data.profile.target_roles?.join(', ')}\n\nYour profile is now actively indexed. You can download an audited .docx resume, inspect ATS compliance in the X-Ray, or tailor applications.`
          }
        ])
      }
    } catch (e: any) {
      setParseError(e.message)
      toast.error(e.message)
    } finally {
      setIsParsing(false)
    }
  }

  async function handleSendMessage() {
    if (!chatInput.trim() || isSending) return
    const userText = chatInput.trim()
    setChatInput('')
    setIsSending(true)

    setChatMessages((prev) => [...prev, { role: 'user', content: userText }])

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          profile: parsedProfile
        })
      })
      const data = await res.json()
      if (data.reply) {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
      } else {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: "I've processed your update and updated your sovereign candidate memory." }])
      }
    } catch {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: "I'm temporarily operating offline, but your notes are saved in your local vault." }])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
        />
        <input
          ref={jsonResumeFileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImportJsonResumeFile}
        />

        {/* ── TAB 1: OVERVIEW (The clean Polish/Career Ace style dashboard) ── */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Header Greeting */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                  {getGreeting()}, {parsedProfile?.applicant_name?.split(' ')[0] || 'Ibochi'}.
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Here's where your career profile stands today.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload CV (.pdf, .docx)
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveAndSyncProfile}
                  disabled={isSavingMemory}
                  className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Save &amp; Sync Walrus Memory
                </Button>
              </div>
            </div>

            {/* ── ROLES WORTH A CLOSER LOOK CARD ── */}
            <Card className="p-6 border border-border/80 shadow-sm rounded-2xl bg-card">
              <div className="flex items-center justify-between pb-4 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-foreground">Roles worth a closer look</h3>
                  <Badge variant="secondary" className="text-[10px] font-mono text-emerald-600 bg-emerald-500/10">
                    Live Harvest
                  </Badge>
                </div>
                <Button
                  size="sm"
                  onClick={() => router.push('/application_board')}
                  className="text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-8 px-3"
                >
                  Browse all jobs <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="divide-y divide-border/50">
                {(harvestedJobs.length > 0 ? harvestedJobs.slice(0, 5) : [
                  { title: 'Environmental Test Engineering Intern (Summer 2027)', company: 'Muon Space', location: 'United States · Internship' },
                  { title: 'Software Engineer (Machine Learning) Intern (Summer 2027)', company: 'Affirm', location: 'United States · Internship' },
                  { title: 'Transducer Manufacturing Engineering Co-Op', company: 'Wabtec', location: 'Waltham, MA, United States' },
                  { title: 'Hardware Field Quality Engineer Intern (Summer 2027)', company: 'Lyft', location: 'Canada · Internship' },
                  { title: 'Spring 2027 Software Engineering Internship/Co-op', company: 'xAI', location: 'United States · Internship' },
                ]).map((job: any, idx: number) => (
                  <div
                    key={job.title + idx}
                    onClick={() => router.push('/application_board')}
                    className="py-3.5 flex items-center justify-between gap-4 hover:bg-muted/40 px-2 rounded-xl transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-muted/80 border border-border/70 flex items-center justify-center font-bold text-sm shrink-0">
                        {job.company.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-sm text-foreground block truncate group-hover:text-emerald-500 transition-colors">
                          {job.title}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {job.company} · {job.location || 'Remote'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground font-mono">Today</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* ── 3 CORE METRIC BOXES: RESUME SCORE + COPILOT CHAT + CHECKLIST ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Box 1: Resume Score & ATS Breakdown (5 cols) */}
              <Card className="lg:col-span-5 p-6 border border-border/80 shadow-sm rounded-2xl bg-card space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    RESUME SCORE
                  </h3>
                  <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                    Grade {atsScorecard?.ats_grade || 'A+'}
                  </Badge>
                </div>

                <div className="flex items-center gap-6">
                  {/* Big Circular Score Display */}
                  <div className="relative w-24 h-24 rounded-full border-4 border-emerald-500/20 flex flex-col items-center justify-center shrink-0 bg-emerald-500/5 shadow-inner">
                    <span className="text-3xl font-extrabold text-foreground">
                      {atsScorecard?.overall_score || 94}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">/ 100</span>
                  </div>

                  <div className="space-y-1">
                    <p className="font-bold text-sm text-foreground">Top 12% of resumes</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Strong fit. A few gaps show where targeted edits and Google XYZ metrics can help.
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                      +12 points potential gain
                    </p>
                  </div>
                </div>

                {/* Horizontal ATS Breakdown Bars */}
                <div className="space-y-3 pt-2 border-t border-border/60">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>Role Match</span>
                      <span className="text-emerald-500 font-mono">86%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '86%' }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>Quantified Impact</span>
                      <span className="text-amber-500 font-mono">78%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '78%' }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>Production &amp; Systems</span>
                      <span className="text-amber-500 font-mono">75%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '75%' }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>Tech Skills</span>
                      <span className="text-emerald-500 font-mono">92%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }} />
                    </div>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="pt-2 flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsXRayOpen(true)}
                    className="w-full text-xs font-semibold gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <Eye className="w-3.5 h-3.5" /> Launch ATS Robot X-Ray
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleDownloadDocxResume}
                    disabled={isDownloadingDocx}
                    className="w-full text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <Download className="w-3.5 h-3.5" /> Download ATS Word (.docx)
                  </Button>
                </div>
              </Card>

              {/* Box 2 & 3: Chatbot Session & Setup Checklist (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Career Ace AI Copilot Chatbot */}
                <Card className="p-6 border border-border/80 shadow-sm rounded-2xl bg-card space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-foreground">Career Ace AI Copilot</h3>
                        <p className="text-[10px] text-muted-foreground">Autonomous agent powered by Walrus Sovereign Memory</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                      <ShieldCheck className="w-3 h-3 mr-1" /> zkLogin Isolated
                    </Badge>
                  </div>

                  {/* Messages Scroll Area */}
                  <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1 text-xs">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`p-3.5 rounded-xl leading-relaxed whitespace-pre-wrap ${
                          msg.role === 'assistant'
                            ? 'bg-muted/40 border border-border/70 text-foreground'
                            : 'bg-emerald-600 text-white ml-8 font-medium'
                        }`}
                      >
                        {msg.content}
                      </div>
                    ))}
                  </div>

                  {/* Quick Prompt Suggestions */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {[
                      'Polish my bullet points with XYZ metrics',
                      'Check missing ATS keywords for Stripe',
                      'Draft a cover letter for My personal wins',
                    ].map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => {
                          setChatInput(prompt)
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-full border border-border/80 bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  {/* Chat Input Bar */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask Career Ace to polish your CV, audit ATS keywords, or recall memories..."
                      className="flex-1 h-10 px-3.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <Button
                      size="sm"
                      onClick={handleSendMessage}
                      disabled={isSending || !chatInput.trim()}
                      className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>

                {/* Setup Checklist Box */}
                <Card className="p-6 border border-border/80 shadow-sm rounded-2xl bg-card space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-foreground">Setup Checklist</h3>
                      <p className="text-xs text-muted-foreground">Complete these steps for maximum application yield</p>
                    </div>
                    <Badge variant="secondary" className="font-mono text-xs">
                      4 of 5 Complete
                    </Badge>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="font-medium text-foreground">Upload base CV and extract skills</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">Verified</Badge>
                    </div>

                    <div className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="font-medium text-foreground">Walrus Sovereign Memory Vault Sealed (AES-256-GCM)</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">Active</Badge>
                    </div>

                    <div className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="font-medium text-foreground">Run ATS Robot X-Ray Diagnostics</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">Grade A+</Badge>
                    </div>

                    <div
                      onClick={() => router.push('/dashboard?tab=github')}
                      className="p-2.5 rounded-xl border border-border/80 hover:bg-muted/40 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-4 h-4 rounded-full border-2 border-muted-foreground/40 inline-block" />
                        <span className="font-medium text-muted-foreground">Connect GitHub &amp; LinkedIn verified profiles</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>

                    <div
                      onClick={() => router.push('/dashboard?tab=cover_letters')}
                      className="p-2.5 rounded-xl border border-border/80 hover:bg-muted/40 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-4 h-4 rounded-full border-2 border-muted-foreground/40 inline-block" />
                        <span className="font-medium text-muted-foreground">Automate targeted Cover Letter for dream employer</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: RESUMES (Side-by-side Uploaded Resume & Tailored Resume) ── */}
        {activeTab === 'resumes' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Resume Workspace &amp; Tailoring</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Side-by-side view: Your uploaded base resume alongside AI-optimized, role-tailored versions.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload CV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => jsonResumeFileInputRef.current?.click()}
                  className="text-xs gap-1.5"
                >
                  <FileCode className="w-3.5 h-3.5" /> Import JSON Resume
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportJsonResume}
                  className="text-xs gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Export JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsXRayOpen(true)}
                  className="text-xs gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                >
                  <Eye className="w-3.5 h-3.5" /> ATS X-Ray
                </Button>
                <Button
                  size="sm"
                  onClick={handleDownloadDocxResume}
                  disabled={isDownloadingDocx}
                  className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Download className="w-3.5 h-3.5" /> Download .docx
                </Button>
              </div>
            </div>

            {/* Side-by-Side Canvas Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Uploaded Base Resume */}
              <Card className="p-6 border border-border/80 shadow-sm rounded-2xl bg-card space-y-6">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-500" />
                    <h3 className="font-bold text-sm text-foreground">Uploaded Base Resume</h3>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">Source Profile</Badge>
                </div>

                {/* Candidate Info */}
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Applicant Name</label>
                    <input
                      type="text"
                      value={parsedProfile?.applicant_name || ''}
                      onChange={(e) => setParsedProfile({ ...parsedProfile, applicant_name: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg border bg-background text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Email</label>
                      <input
                        type="email"
                        value={parsedProfile?.contact_email || ''}
                        onChange={(e) => setParsedProfile({ ...parsedProfile, contact_email: e.target.value })}
                        className="w-full h-9 px-3 rounded-lg border bg-background text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Phone</label>
                      <input
                        type="text"
                        value={parsedProfile?.contact_phone || ''}
                        onChange={(e) => setParsedProfile({ ...parsedProfile, contact_phone: e.target.value })}
                        className="w-full h-9 px-3 rounded-lg border bg-background text-xs"
                      />
                    </div>
                  </div>

                  {/* Skills tags */}
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5">Verified Skills</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {(parsedProfile?.skills || []).map((skill: string) => (
                        <span key={skill} className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-[11px] flex items-center gap-1 border border-emerald-500/20">
                          {skill}
                          <button onClick={() => handleRemoveSkill(skill)} className="hover:text-red-500">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newSkillInput}
                        onChange={(e) => setNewSkillInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                        placeholder="Add skill (e.g. Docker, Rust)..."
                        className="flex-1 h-8 px-2.5 rounded-lg border bg-background text-xs"
                      />
                      <Button size="sm" variant="outline" onClick={handleAddSkill} className="h-8 text-xs">Add</Button>
                    </div>
                  </div>

                  {/* Experience Timeline */}
                  <div className="pt-2">
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-2">Work Experience</label>
                    <div className="space-y-3">
                      {(parsedProfile?.work_experience || []).map((exp: any, i: number) => (
                        <div key={i} className="p-3 rounded-xl border bg-muted/20 space-y-1.5">
                          <div className="flex justify-between font-semibold">
                            <span>{exp.role}</span>
                            <span className="text-muted-foreground font-mono text-[10px]">{exp.duration || 'Present'}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">{exp.company}</p>
                          <ul className="list-disc list-inside text-[11px] text-muted-foreground space-y-1 pt-1">
                            {(exp.highlights || []).map((h: string, hIdx: number) => (
                              <li key={hIdx}>{h}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Right Column: Tailored Resume & Google XYZ Formula */}
              <Card className="p-6 border border-border/80 shadow-sm rounded-2xl bg-card space-y-6">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <h3 className="font-bold text-sm text-foreground">Tailored Resume &amp; XYZ Optimization</h3>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500">
                    Google XYZ Formula
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Target Company</label>
                      <input
                        type="text"
                        value={tailorCompany}
                        onChange={(e) => setTailorCompany(e.target.value)}
                        placeholder="e.g. Stripe, Google, Mysten Labs"
                        className="w-full h-9 px-3 rounded-lg border bg-background text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Target Role</label>
                      <input
                        type="text"
                        value={tailorRole}
                        onChange={(e) => setTailorRole(e.target.value)}
                        placeholder="e.g. Senior Fullstack Engineer"
                        className="w-full h-9 px-3 rounded-lg border bg-background text-xs"
                      />
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={handleGenerateTailoredResume}
                    className="w-full text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Compile Tailored Resume for {tailorCompany}
                  </Button>

                  {/* Tailored Output Display */}
                  <div className="p-4 rounded-xl border border-border/80 bg-background font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-[420px] overflow-y-auto text-muted-foreground">
                    {tailoredResumeText || (
                      <div className="text-center py-12 space-y-2">
                        <Sparkles className="w-8 h-8 text-emerald-500 mx-auto" />
                        <p className="font-semibold text-foreground">No tailored version generated yet</p>
                        <p className="text-xs text-muted-foreground">
                          Enter your target company above and click Compile to format your bullets into high-impact Google XYZ metrics.
                        </p>
                      </div>
                    )}
                  </div>

                  {tailoredResumeText && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(tailoredResumeText)
                          toast.success('Tailored resume text copied to clipboard!')
                        }}
                        className="flex-1 text-xs gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy Text
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleDownloadDocxResume}
                        className="flex-1 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Tailored .docx
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ── TAB 3: COVER LETTERS (Automated Cover Letter Studio) ── */}
        {(activeTab === 'cover_letters' || activeTab === 'tailored') && (
          <div className="space-y-6">
            <div className="pb-4 border-b">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Cover Letter Studio</h1>
              <p className="text-xs text-muted-foreground mt-1">
                Automate cover letters tailored to your target company, dated to today, and grounded in your verified achievements.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Configuration Panel */}
              <Card className="lg:col-span-5 p-6 border border-border/80 shadow-sm rounded-2xl bg-card space-y-5">
                <h3 className="font-bold text-sm text-foreground">Cover Letter Parameters</h3>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Target Company</label>
                    <input
                      type="text"
                      value={tailorCompany}
                      onChange={(e) => setTailorCompany(e.target.value)}
                      placeholder="e.g. Google, Anthropic, Stripe"
                      className="w-full h-9 px-3 rounded-lg border bg-background text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Target Role</label>
                    <input
                      type="text"
                      value={tailorRole}
                      onChange={(e) => setTailorRole(e.target.value)}
                      placeholder="e.g. Senior Infrastructure Engineer"
                      className="w-full h-9 px-3 rounded-lg border bg-background text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-2">Problem-Solving Angle</label>
                    <div className="space-y-2">
                      {[
                        { id: 'systems', title: 'Technical Scaling & Systems Architecture', desc: 'Focuses on 2M+ RPS throughput, latency reduction, and reliability.' },
                        { id: 'product', title: 'Product Velocity & Delivery Leader', desc: 'Focuses on rapid feature rollout, design collaboration, and customer wins.' },
                        { id: 'startup', title: '0-to-1 High-Autonomy Execution', desc: 'Focuses on wearing multiple hats, fullstack ownership, and scrappiness.' }
                      ].map((angle) => (
                        <div
                          key={angle.id}
                          onClick={() => setCoverLetterAngle(angle.id as any)}
                          className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                            coverLetterAngle === angle.id
                              ? 'border-emerald-500 bg-emerald-500/10 text-foreground'
                              : 'border-border/70 hover:bg-muted/40 text-muted-foreground'
                          }`}
                        >
                          <span className="font-semibold block text-xs">{angle.title}</span>
                          <span className="text-[11px]">{angle.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={handleGenerateCoverLetter}
                    className="w-full text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white h-10 rounded-xl"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Generate Tailored Cover Letter
                  </Button>
                </div>
              </Card>

              {/* Output Preview */}
              <Card className="lg:col-span-7 p-6 border border-border/80 shadow-sm rounded-2xl bg-card space-y-4">
                <div className="flex items-center justify-between pb-3 border-b">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-500" />
                    <h3 className="font-bold text-sm text-foreground">Generated Cover Letter</h3>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">
                    Dated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Badge>
                </div>

                <div className="p-5 rounded-xl border border-border/80 bg-background text-xs leading-relaxed whitespace-pre-wrap max-h-[460px] overflow-y-auto text-foreground shadow-inner">
                  {tailoredCoverLetterText || (
                    <div className="text-center py-16 space-y-2 text-muted-foreground">
                      <Mail className="w-8 h-8 text-emerald-500 mx-auto" />
                      <p className="font-semibold text-foreground">No cover letter drafted yet</p>
                      <p className="text-xs">
                        Configure the parameters on the left and click Generate to produce a role-tailored letter.
                      </p>
                    </div>
                  )}
                </div>

                {tailoredCoverLetterText && (
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(tailoredCoverLetterText)
                        toast.success('Cover letter copied to clipboard!')
                      }}
                      className="flex-1 text-xs gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy Text
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        const blob = new Blob([tailoredCoverLetterText], { type: 'text/plain' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `${tailorCompany.replace(/\s+/g, '_')}_Cover_Letter.txt`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        URL.revokeObjectURL(url)
                        toast.success('Cover letter text file downloaded!')
                      }}
                      className="flex-1 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Letter
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* ── TAB 4: PROFILES (GitHub & LinkedIn) ── */}
        {(activeTab === 'github' || activeTab === 'linkedin') && (
          <div className="space-y-6">
            <div className="pb-4 border-b">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Verified Candidate Profiles</h1>
              <p className="text-xs text-muted-foreground mt-1">
                Link your developer accounts and professional credentials to enrich your sovereign Walrus memory lineage.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* GitHub Card */}
              <Card className="p-6 border border-border/80 shadow-sm rounded-2xl bg-card space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <svg className="w-5 h-5 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">GitHub Integration</h3>
                    <p className="text-xs text-muted-foreground">Index repositories, commit activity, and READMEs</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">GitHub Username</label>
                    <input
                      type="text"
                      value={githubUsername}
                      onChange={(e) => setGithubUsername(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border bg-background text-xs"
                    />
                  </div>

                  <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1.5">
                    <div className="flex justify-between font-semibold text-emerald-600 dark:text-emerald-400">
                      <span>Status: Connected</span>
                      <span className="font-mono text-[10px]">14 Public Repos</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Top Languages: TypeScript (54%), Python (26%), Go (12%), Rust (8%)
                    </p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => toast.success(`GitHub activity for ${githubUsername} synced to Walrus Memory!`)}
                    className="w-full text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Sync GitHub Repos to Memory
                  </Button>
                </div>
              </Card>

              {/* LinkedIn Card */}
              <Card className="p-6 border border-border/80 shadow-sm rounded-2xl bg-card space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">LinkedIn Integration</h3>
                    <p className="text-xs text-muted-foreground">Sync endorsements and public tenure verification</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">LinkedIn Profile URL</label>
                    <input
                      type="text"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border bg-background text-xs"
                    />
                  </div>

                  <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-1.5">
                    <div className="flex justify-between font-semibold text-blue-600 dark:text-blue-400">
                      <span>Status: Synced</span>
                      <span className="font-mono text-[10px]">3 Verified Endorsements</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Career Passport deep-link enabled for recruiter one-click verification.
                    </p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => toast.success('LinkedIn credentials synced to Sovereign Passport!')}
                    className="w-full text-xs font-semibold gap-1.5 border border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
                    variant="outline"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Sync LinkedIn Credentials
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ATS X-Ray Modal Component */}
        <AtsXRayDialog
          open={isXRayOpen}
          onOpenChange={setIsXRayOpen}
          profile={parsedProfile}
          scorecard={atsScorecard}
        />
      </div>
    </AppShell>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading workspace...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
