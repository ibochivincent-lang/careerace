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
import { motion, AnimatePresence } from 'motion/react'
import {
  Briefcase, Search, Upload, FileText, CheckCircle2,
  ChevronRight, ChevronLeft, Paperclip, Sparkles, MessageSquare,
  Award, User, GraduationCap, Send, Bot, Plus, X, AlertCircle,
  Building, ShieldCheck, Phone, Mail, Database, ExternalLink, Lock,
  Download, FileCode, Eye, Check, RefreshCw, ArrowRight,
  Copy, Trash2, ArrowUpRight
} from 'lucide-react'
import { AnimatedScoreGauge } from '@/components/AnimatedScoreGauge'
import { AnimatedProgressBar } from '@/components/AnimatedProgressBar'
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
      duration: '2023 · Present',
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

  // Career Ace AI Copilot Chatbot state
  const [chatInput, setChatInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const chatMessagesEndRef = useRef<HTMLDivElement>(null)
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content:
        "Hello Ibochi! I am Career Ace, your autonomous AI career copilot with Walrus Sovereign Memory. I remember your full background, work milestones, and verified skills across every session.\n\nYour resume currently scores 94/100 for ATS readiness. What would you like to tackle today? We can tailor your resume for a specific role, audit ATS keywords, or draft a targeted cover letter."
    }
  ])

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

  // Resume Document Diff & Upload State
  const [resumeViewMode, setResumeViewMode] = useState<'editor' | 'upload'>('editor')
  const [acceptedEdits, setAcceptedEdits] = useState<Record<string, 'accepted' | 'rejected' | null>>({})

  // Auto-scroll chat on message change
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isSending])

  function handleAcceptEdit(id: string) {
    setAcceptedEdits(prev => ({ ...prev, [id]: 'accepted' }))
    toast.success('High-impact quantified edit accepted into your verified CV!')
  }

  function handleRejectEdit(id: string) {
    setAcceptedEdits(prev => ({ ...prev, [id]: 'rejected' }))
    toast.info('Edit dismissed and reverted to original wording.')
  }

  function handleDiscussEdit(topic: string) {
    const prompt = `Why should I change: "${topic}"? How does this increase my ATS score?`
    setChatInput(prompt)
    toast.info('Discuss prompt loaded into AI Copilot.')
  }

  function handleChipClick(chip: string) {
    setChatMessages(prev => [
      ...prev,
      { role: 'user', content: chip },
      {
        role: 'assistant',
        content: `I've analyzed your profile for "${chip}". I've tailored your resume bullets with verified production metrics and data volume specifications, boosting your ATS readiness score to 96/100.`
      }
    ])
    toast.success(`Applied suggestion: ${chip}`)
  }

  async function handleSendMessage() {
    if (!chatInput.trim() || isSending) return
    const text = chatInput.trim()
    setChatInput('')
    setChatMessages((prev) => [...prev, { role: 'user', content: text }])
    setIsSending(true)

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          profile: parsedProfile
        })
      })
      const data = await res.json()
      if (data.reply) {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `I've analyzed your request: "${text}". I have refreshed your candidate bullet points with verified production metrics to align with your target ATS score of 94/100.`
          }
        ])
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `I've incorporated your feedback into your resume metrics. Your quantified impact score has been refreshed.`
        }
      ])
    } finally {
      setIsSending(false)
    }
  }

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
        `I am reaching out regarding the ${role} role at ${company}. As an engineer who thrives in high-autonomy environments, I take pride in end-to-end execution, from architecting backend microservices to designing responsive frontends and automating CI/CD deployments.\n\n` +
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
            content: `I've attached and parsed **${file.name}**!\n\nCandidate: **${data.profile.applicant_name}**\n• Skills: ${data.profile.skills?.slice(0, 8).join(', ')}\n• Target: ${data.profile.target_roles?.join(', ')}\n\nYour profile is now actively indexed. You can download an audited .docx resume, inspect ATS compliance in the X-Ray, or tailor applications.`
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

  // Count active applied edits in diff studio
  const appliedCount = Object.values(acceptedEdits).filter(v => v === 'accepted').length

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

        {/* ── TAB 1: OVERVIEW ── */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Header Greeting */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
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
                  className="text-xs font-semibold gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 h-9"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload CV (.pdf, .docx)
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveAndSyncProfile}
                  disabled={isSavingMemory}
                  className="text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm h-9"
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
                  <Badge variant="secondary" className="text-xs font-mono text-emerald-600 bg-emerald-500/10">
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
                  <Badge variant="outline" className="text-xs font-semibold text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                    Grade {atsScorecard?.ats_grade || 'A+'}
                  </Badge>
                </div>

                <div className="flex items-center gap-6">
                  {/* Dynamic Animated Circular Score Gauge */}
                  <AnimatedScoreGauge
                    score={atsScorecard?.overall_score || 94}
                    size={96}
                    strokeWidth={8}
                  />

                  <div className="space-y-1">
                    <p className="font-bold text-sm text-foreground">Top 12% of resumes</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Strong fit. A few targeted improvements and Google XYZ metrics will elevate your candidate ranking.
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                      +12 points potential gain
                    </p>
                  </div>
                </div>

                {/* Animated Horizontal ATS Breakdown Bars */}
                <div className="space-y-3.5 pt-2 border-t border-border/60">
                  <AnimatedProgressBar
                    label="Role Match"
                    value={86}
                    colorClass="bg-emerald-500"
                    delay={0.1}
                  />
                  <AnimatedProgressBar
                    label="Quantified Impact"
                    value={78}
                    colorClass="bg-amber-500"
                    delay={0.2}
                  />
                  <AnimatedProgressBar
                    label="Production & Systems"
                    value={75}
                    colorClass="bg-amber-500"
                    delay={0.3}
                  />
                  <AnimatedProgressBar
                    label="Tech Skills"
                    value={92}
                    colorClass="bg-emerald-500"
                    delay={0.4}
                  />
                </div>

                {/* Direct Action Buttons */}
                <div className="pt-2 flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsXRayOpen(true)}
                    className="w-full text-xs font-semibold gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 h-9"
                  >
                    <Eye className="w-3.5 h-3.5" /> Launch ATS Robot X-Ray
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleDownloadDocxResume}
                    disabled={isDownloadingDocx}
                    className="w-full text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white h-9"
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
                        <p className="text-xs text-muted-foreground">Autonomous agent powered by Walrus Sovereign Memory</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" /> zkLogin Isolated
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
                    {isSending && (
                      <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 text-foreground flex items-center gap-2">
                        <Bot className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                        <span className="text-xs text-muted-foreground">Career Ace is analyzing your query...</span>
                        <span className="flex items-center gap-1 ml-auto">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                        </span>
                      </div>
                    )}
                    <div ref={chatMessagesEndRef} />
                  </div>

                  {/* Quick Prompt Suggestions */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {[
                      'Polish my bullet points with XYZ metrics',
                      'Check missing ATS keywords for Stripe',
                      'Draft a cover letter for my personal wins',
                    ].map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => {
                          setChatInput(prompt)
                        }}
                        className="text-xs px-2.5 py-1 rounded-full border border-border/80 bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
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
                      <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500/30">Verified</Badge>
                    </div>

                    <div className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="font-medium text-foreground">Walrus Sovereign Memory Vault Sealed (AES-256-GCM)</span>
                      </div>
                      <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500/30">Active</Badge>
                    </div>

                    <div className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="font-medium text-foreground">Run ATS Robot X-Ray Diagnostics</span>
                      </div>
                      <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500/30">Grade A+</Badge>
                    </div>

                    <div
                      onClick={() => router.push('/dashboard?tab=github')}
                      className="p-2.5 rounded-xl border border-border/80 hover:bg-muted/40 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-4 h-4 rounded-full border-2 border-muted-foreground/40 inline-block" />
                        <span className="font-medium text-muted-foreground">Connect GitHub and LinkedIn verified profiles</span>
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
          </motion.div>
        )}

        {/* ── TAB 2: RESUMES (Dual-Mode: Upload & Fit Resume vs Document Diff Studio) ── */}
        {activeTab === 'resumes' && (
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {/* VIEW MODE 1: UPLOAD & FIT RESUME */}
              {resumeViewMode === 'upload' ? (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-8"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Upload your resume</h1>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setResumeViewMode('editor')}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        View current draft <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Drop your file, choose an ATS-optimized template, and we'll fit your content into a clean editable resume.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Drag & Drop Zone */}
                    <div className="lg:col-span-7 space-y-4">
                      <Card
                        onClick={() => fileInputRef.current?.click()}
                        className="p-12 border-2 border-dashed border-border/80 hover:border-emerald-500/60 rounded-3xl bg-card hover:bg-muted/10 transition-all cursor-pointer flex flex-col items-center justify-center text-center group min-h-[300px]"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-muted/60 border border-border/80 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform text-muted-foreground group-hover:text-emerald-500">
                          <Upload className="w-7 h-7" />
                        </div>
                        <p className="text-base font-bold text-foreground mb-1">
                          {selectedFile ? selectedFile.name : 'Drag your resume here'}
                        </p>
                        <p className="text-xs text-muted-foreground mb-4">
                          or <span className="text-emerald-600 dark:text-emerald-400 font-semibold underline underline-offset-2">browse files</span>
                        </p>
                        <span className="text-xs font-mono text-muted-foreground/70 tracking-wider uppercase">
                          PDF · DOC · DOCX · Max 10 MB
                        </span>
                      </Card>

                      <div className="flex items-center gap-3">
                        <Button
                          size="lg"
                          onClick={() => {
                            if (selectedFile) {
                              handleFileSelect(selectedFile)
                            }
                            setResumeViewMode('editor')
                            toast.success('Resume fitted into clean ATS-ready draft!')
                          }}
                          className="flex-1 font-semibold text-xs gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-11"
                        >
                          <FileText className="w-4 h-4" /> Fit resume
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => setResumeViewMode('editor')}
                          className="text-xs font-semibold rounded-xl h-11 px-5"
                        >
                          Skip to editor
                        </Button>
                      </div>
                    </div>

                    {/* Right Column: WHAT HAPPENS NEXT Guide Card */}
                    <Card className="lg:col-span-5 p-7 border border-border/80 rounded-3xl bg-card space-y-6 shadow-sm">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        WHAT HAPPENS NEXT
                      </h3>

                      <div className="space-y-5 text-xs">
                        <div className="flex items-start gap-3.5">
                          <span className="w-6 h-6 rounded-full border border-border flex items-center justify-center shrink-0 font-bold text-xs text-muted-foreground">
                            1
                          </span>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground text-xs">Pick a template</span>
                              <span className="text-xs text-muted-foreground font-mono">you choose</span>
                            </div>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                              ATS-optimized layouts built for scanners.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3.5">
                          <span className="w-6 h-6 rounded-full border border-border flex items-center justify-center shrink-0 font-bold text-xs text-muted-foreground">
                            2
                          </span>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground text-xs">We fit your resume to it</span>
                              <span className="text-xs text-muted-foreground font-mono">~5 sec</span>
                            </div>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                              Your content reformatted, clean and structured.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3.5">
                          <span className="w-6 h-6 rounded-full border border-border flex items-center justify-center shrink-0 font-bold text-xs text-muted-foreground">
                            3
                          </span>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground text-xs">Review the draft</span>
                              <span className="text-xs text-muted-foreground font-mono">you review</span>
                            </div>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                              Check the parsed sections and diffs before scanning.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3.5">
                          <span className="w-6 h-6 rounded-full border border-border flex items-center justify-center shrink-0 font-bold text-xs text-muted-foreground">
                            4
                          </span>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground text-xs">Run ATS scan</span>
                              <span className="text-xs text-muted-foreground font-mono">on click</span>
                            </div>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                              Trigger score, breakdown, and AI rewrites.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-foreground text-background dark:bg-muted dark:text-foreground flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <p className="text-xs font-semibold leading-snug">
                          Your ATS-friendly draft is ready first. Scan it when you're ready.
                        </p>
                      </div>

                      <p className="text-xs text-muted-foreground text-center">
                        Never shared, sold, or used to train models. Sovereign Walrus encryption.
                      </p>
                    </Card>
                  </div>
                </motion.div>
              ) : (
                /* VIEW MODE 2: DOCUMENT DIFF STUDIO & AI COPILOT */
                <motion.div
                  key="editor"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  {/* Top Action Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setResumeViewMode('upload')}
                        className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8 px-2"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Switch resume
                      </Button>
                      <Badge variant="outline" className="text-xs font-semibold text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                        ATS Ready · 94/100
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsXRayOpen(true)}
                        className="text-xs gap-1.5 h-8 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      >
                        <Eye className="w-3.5 h-3.5" /> ATS X-Ray
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportJsonResume}
                        className="text-xs gap-1.5 h-8"
                      >
                        <FileCode className="w-3.5 h-3.5" /> JSON Resume
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadDocxResume}
                        disabled={isDownloadingDocx}
                        className="text-xs gap-1.5 h-8"
                      >
                        <Download className="w-3.5 h-3.5" /> Download .docx
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleDownloadDocxResume}
                        className="text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white h-8"
                      >
                        <Download className="w-3.5 h-3.5" /> Export PDF
                      </Button>
                    </div>
                  </div>

                  {/* 2-Column Canvas: Document on Left (8 cols), AI Copilot on Right (4 cols) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Clean Resume Paper Canvas */}
                    <Card className="lg:col-span-8 p-8 md:p-10 border border-border/80 shadow-md rounded-2xl bg-card space-y-6 font-sans">
                      {/* Header */}
                      <div className="border-b pb-5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                            {parsedProfile?.applicant_name || 'Ryan Park'}
                          </h2>
                          <button
                            onClick={() => {
                              const newName = prompt('Enter candidate name:', parsedProfile?.applicant_name || 'Ryan Park')
                              if (newName) setParsedProfile({ ...parsedProfile, applicant_name: newName })
                            }}
                            className="text-xs text-muted-foreground hover:text-emerald-500 font-medium"
                          >
                            Edit
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {parsedProfile?.contact_email || 'ryan@ryanpark.dev'} · {parsedProfile?.contact_phone || '+1 (415) 482-3910'} · Austin, TX · <span className="text-emerald-600 dark:text-emerald-400 font-medium">GitHub</span> · <span className="text-emerald-600 dark:text-emerald-400 font-medium">LinkedIn</span>
                        </p>
                      </div>

                      {/* Section: EXPERIENCE */}
                      <div className="space-y-5">
                        <div className="flex items-center gap-2 border-b pb-1">
                          <h3 className="text-xs font-extrabold tracking-wider uppercase text-foreground">EXPERIENCE</h3>
                          <span className="text-xs text-muted-foreground font-mono">5</span>
                        </div>

                        {/* Role 1 */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-baseline text-xs">
                            <span className="font-bold text-sm text-foreground">Content Creator · ryanpark.dev</span>
                            <span className="text-muted-foreground font-mono text-xs">Sept 2024 · Present</span>
                          </div>

                          {acceptedEdits['c1'] === 'accepted' ? (
                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-200">
                              Scaled technical brand to 200K+ followers by architecting automated content distribution pipelines and data-driven engagement strategies, leveraging full-stack design and video production expertise.
                            </div>
                          ) : acceptedEdits['c1'] === 'rejected' ? (
                            <p className="text-xs text-muted-foreground">
                              Grew to 200K+ followers across platforms in under a year, scaling entirely organically and leading all content strategy, production, and distribution solo, leveraging 6+ years of video editing and design experience.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-xs line-through text-red-600/80 dark:text-red-400/80 bg-red-500/5 p-2.5 rounded-lg border border-red-500/10 leading-relaxed">
                                Grew to 200K+ followers across platforms in under a year, scaling entirely organically and leading all content strategy, production, and distribution solo, leveraging 6+ years of video editing and design experience.
                              </p>
                              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                                <p className="text-xs text-emerald-800 dark:text-emerald-200 font-medium leading-relaxed">
                                  Scaled technical brand to 200K+ followers by architecting automated content distribution pipelines and data-driven engagement strategies, leveraging full-stack design and video production expertise.
                                </p>
                                <div className="flex items-center gap-2 pt-1">
                                  <Button size="sm" variant="ghost" onClick={() => handleDiscussEdit('Content Creator audience scale')} className="h-7 text-xs font-semibold gap-1 px-2.5">
                                    <MessageSquare className="w-3.5 h-3.5" /> Discuss
                                  </Button>
                                  <Button size="sm" onClick={() => handleAcceptEdit('c1')} className="h-7 text-xs font-semibold gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5">
                                    <Check className="w-3.5 h-3.5" /> Accept
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleRejectEdit('c1')} className="h-7 text-xs font-semibold text-red-500 hover:bg-red-500/10 px-2.5">
                                    <X className="w-3.5 h-3.5" /> Reject
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Role 2 */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-baseline text-xs">
                            <span className="font-bold text-sm text-foreground">Software Engineer II · Stripe</span>
                            <span className="text-muted-foreground font-mono text-xs">Jan 2025 · Present</span>
                          </div>

                          {acceptedEdits['c2'] === 'accepted' ? (
                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-200">
                              Designed and shipped distributed infrastructure improvements to Stripe's internal developer tooling platform, reducing median batch processing times by ~40% across 10,000+ daily active engineers and enabling real-time analytics.
                            </div>
                          ) : acceptedEdits['c2'] === 'rejected' ? (
                            <p className="text-xs text-muted-foreground">
                              Designed and shipped distributed infrastructure improvements to Stripe's internal developer tooling platform, reducing median build times by ~40% across 10,000+ daily active engineers.
                            </p>
                          ) : (
                            <div className="space-y-2 relative">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-foreground text-background dark:bg-muted text-xs font-semibold mb-1 shadow-sm">
                                <Sparkles className="w-3 h-3 text-emerald-400" /> Adds metric, scope, and technical ownership.
                              </div>
                              <p className="text-xs line-through text-red-600/80 dark:text-red-400/80 bg-red-500/5 p-2.5 rounded-lg border border-red-500/10 leading-relaxed">
                                Designed and shipped distributed infrastructure improvements to Stripe's internal developer tooling platform, reducing median build times by ~40% across 10,000+ daily active engineers.
                              </p>
                              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                                <p className="text-xs text-emerald-800 dark:text-emerald-200 font-medium leading-relaxed">
                                  Designed and shipped distributed infrastructure improvements to Stripe's internal developer tooling platform, reducing median batch processing times by ~40% across 10,000+ daily active engineers and enabling real-time analytics.
                                </p>
                                <div className="flex items-center gap-2 pt-1">
                                  <Button size="sm" variant="ghost" onClick={() => handleDiscussEdit('Stripe batch processing and latency')} className="h-7 text-xs font-semibold gap-1 px-2.5">
                                    <MessageSquare className="w-3.5 h-3.5" /> Discuss
                                  </Button>
                                  <Button size="sm" onClick={() => handleAcceptEdit('c2')} className="h-7 text-xs font-semibold gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5">
                                    <Check className="w-3.5 h-3.5" /> Accept
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleRejectEdit('c2')} className="h-7 text-xs font-semibold text-red-500 hover:bg-red-500/10 px-2.5">
                                    <X className="w-3.5 h-3.5" /> Reject
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Role 3 */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-baseline text-xs">
                            <span className="font-bold text-sm text-foreground">Software Engineering Intern · Figma</span>
                            <span className="text-muted-foreground font-mono text-xs">June 2024 · Sept 2024</span>
                          </div>

                          {acceptedEdits['c3'] === 'accepted' ? (
                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-200">
                              Built a TypeScript-based internal tooling layer for automated data pipeline provisioning and test orchestration, reducing QA cycle time by 35% for the developer infrastructure team, exposed via REST APIs.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-xs line-through text-red-600/80 dark:text-red-400/80 bg-red-500/5 p-2.5 rounded-lg border border-red-500/10 leading-relaxed">
                                Built a TypeScript-based internal tooling layer for automated workspace provisioning and test orchestration, reducing QA cycle time by 35% for the developer infrastructure team.
                              </p>
                              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                                <p className="text-xs text-emerald-800 dark:text-emerald-200 font-medium leading-relaxed">
                                  Built a TypeScript-based internal tooling layer for automated data pipeline provisioning and test orchestration, reducing QA cycle time by 35% for the developer infrastructure team, exposed via REST APIs.
                                </p>
                                <div className="flex items-center gap-2 pt-1">
                                  <Button size="sm" variant="ghost" onClick={() => handleDiscussEdit('Figma pipeline orchestration')} className="h-7 text-xs font-semibold gap-1 px-2.5">
                                    <MessageSquare className="w-3.5 h-3.5" /> Discuss
                                  </Button>
                                  <Button size="sm" onClick={() => handleAcceptEdit('c3')} className="h-7 text-xs font-semibold gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5">
                                    <Check className="w-3.5 h-3.5" /> Accept
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleRejectEdit('c3')} className="h-7 text-xs font-semibold text-red-500 hover:bg-red-500/10 px-2.5">
                                    <X className="w-3.5 h-3.5" /> Reject
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Section: PROJECTS */}
                      <div className="space-y-3 pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-extrabold tracking-wider uppercase text-foreground">PROJECTS</h3>
                          <span className="text-xs text-muted-foreground font-mono">1</span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-baseline text-xs">
                            <span className="font-bold text-sm text-foreground">Payments Reliability Dashboard</span>
                            <span className="text-muted-foreground font-mono text-xs">2024</span>
                          </div>
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-foreground text-background dark:bg-muted text-xs font-semibold shadow-sm">
                            <Sparkles className="w-3 h-3 text-emerald-400" /> Connects technical work to product value.
                          </div>
                          <p className="text-xs line-through text-red-600/80 dark:text-red-400/80 bg-red-500/5 p-2.5 rounded-lg border border-red-500/10 leading-relaxed">
                            Created a dashboard for reliability metrics.
                          </p>
                          <p className="text-xs text-emerald-800 dark:text-emerald-200 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 font-medium leading-relaxed">
                            Created a real-time reliability dashboard that surfaced payment failures 35% faster for on-call teams.
                          </p>
                        </div>
                      </div>

                      {/* Section: SKILLS */}
                      <div className="space-y-3 pt-3 border-t">
                        <h3 className="text-xs font-extrabold tracking-wider uppercase text-foreground">SKILLS</h3>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-foreground text-background dark:bg-muted text-xs font-semibold shadow-sm">
                          <Sparkles className="w-3 h-3 text-emerald-400" /> Groups skills around the target role.
                        </div>
                        <p className="text-xs line-through text-red-600/80 dark:text-red-400/80 bg-red-500/5 p-2.5 rounded-lg border border-red-500/10 leading-relaxed">
                          JavaScript, Python, SQL, AWS, Docker, React, Redis
                        </p>
                        <p className="text-xs text-emerald-800 dark:text-emerald-200 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 font-medium leading-relaxed">
                          Backend: Go, Python, TypeScript | Infra: Kubernetes, AWS | Data: PostgreSQL, Redis, gRPC
                        </p>
                      </div>
                    </Card>

                    {/* Right Column: Career Ace AI Copilot Panel */}
                    <div className="lg:col-span-4 space-y-4">
                      <Card className="p-5 border border-border/80 rounded-2xl bg-card space-y-4 shadow-sm">
                        <div className="flex items-center justify-between pb-3 border-b">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                              <Bot className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="font-bold text-xs text-foreground">Career Ace AI</h3>
                              <p className="text-xs text-muted-foreground">Sovereign resume editor</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500/30 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                            Live
                          </Badge>
                        </div>

                        {/* Chat Messages Stream */}
                        <div className="space-y-3 text-xs">
                          <div className="p-3.5 rounded-xl bg-muted/30 border border-border/70 space-y-2">
                            <p className="font-medium text-foreground">
                              Hi {parsedProfile?.applicant_name?.split(' ')[0] || 'Ryan'} 👋
                            </p>
                            <p className="text-muted-foreground leading-relaxed text-xs">
                              I'm Career Ace, your resume editor. Your resume scored <strong className="text-foreground">{atsScorecard?.overall_score || 94}/100</strong> for ATS readiness.
                            </p>
                            <p className="text-muted-foreground leading-relaxed text-xs">
                              I found 4 high-impact fixes focused on measurable metrics and quantified delivery.
                            </p>
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                              ↑ {appliedCount} of 4 edits applied
                            </span>
                          </div>

                          <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5" /> Pasted job description: Software Engineer
                            </p>
                            <p className="text-muted-foreground leading-relaxed text-xs">
                              I've added data pipeline and real-time streaming language to your Stripe and Figma bullets, boosting ATS readiness to 94%.
                            </p>
                          </div>
                        </div>

                        {/* Suggestion Chips */}
                        <div className="space-y-1.5 pt-2 border-t">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Suggestions</p>
                          <div className="space-y-1">
                            {[
                              'Add data volume metrics',
                              'Mention unit testing',
                              'Include data quality validation'
                            ].map((chip) => (
                              <button
                                key={chip}
                                onClick={() => handleChipClick(chip)}
                                className="w-full text-left text-xs p-2 rounded-lg border border-border/70 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-between group"
                              >
                                <span>{chip}</span>
                                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Chat Input */}
                        <div className="pt-2 flex items-center gap-2">
                          <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && chatInput.trim()) {
                                handleSendMessage()
                              }
                            }}
                            placeholder="Ask Career Ace for an edit..."
                            className="flex-1 h-9 px-3 rounded-xl border bg-background text-xs"
                          />
                          <Button
                            size="sm"
                            onClick={handleSendMessage}
                            disabled={!chatInput.trim() || isSending}
                            className="h-9 w-9 p-0 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shrink-0"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </Card>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── TAB 3: COVER LETTERS ── */}
        {(activeTab === 'cover_letters' || activeTab === 'tailored') && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
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
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Target Company</label>
                    <input
                      type="text"
                      value={tailorCompany}
                      onChange={(e) => setTailorCompany(e.target.value)}
                      placeholder="e.g. Google, Anthropic, Stripe"
                      className="w-full h-9 px-3 rounded-lg border bg-background text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Target Role</label>
                    <input
                      type="text"
                      value={tailorRole}
                      onChange={(e) => setTailorRole(e.target.value)}
                      placeholder="e.g. Senior Infrastructure Engineer"
                      className="w-full h-9 px-3 rounded-lg border bg-background text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-2">Problem-Solving Angle</label>
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
                          <span className="text-xs text-muted-foreground">{angle.desc}</span>
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
                  <Badge variant="outline" className="text-xs text-emerald-500 border-emerald-500/30">
                    Dated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Badge>
                </div>

                <div className="p-5 rounded-xl border border-border/80 bg-background text-xs leading-relaxed whitespace-pre-wrap max-h-[460px] overflow-y-auto text-foreground shadow-inner">
                  {tailoredCoverLetterText || (
                    <div className="text-center py-16 space-y-2 text-muted-foreground">
                      <Mail className="w-8 h-8 text-emerald-500 mx-auto" />
                      <p className="font-semibold text-foreground text-sm">No cover letter drafted yet</p>
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
          </motion.div>
        )}

        {/* ── TAB 4: PROFILES (GitHub & LinkedIn) ── */}
        {(activeTab === 'github' || activeTab === 'linkedin') && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
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
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">GitHub Username</label>
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
                      <span className="font-mono text-xs">14 Public Repos</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
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
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">LinkedIn Profile URL</label>
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
                      <span className="font-mono text-xs">3 Verified Endorsements</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
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
          </motion.div>
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
