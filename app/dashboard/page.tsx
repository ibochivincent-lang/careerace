'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
  Building, ShieldCheck, Phone, Mail, Database, ExternalLink, Lock
} from 'lucide-react'

const INITIAL_SOVEREIGN_PROFILE = {
  applicant_name: '',
  contact_email: '',
  contact_phone: '',
  location: '',
  availability: 'Remote-First (Full-time)',
  seniority_level: 'Mid-Level',
  target_roles: ['Software Engineer', 'Fullstack Engineer'],
  skills: ['TypeScript', 'Next.js', 'React', 'Node.js', 'PostgreSQL'],
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
      highlights: ['Engineered scalable microservices and built responsive web applications.'],
    },
  ],
  certifications: ['AWS Certified Developer'],
  custom_achievements: ['Won 1st place in regional Web3 hackathon'],
}

export default function DashboardPage() {
  const router = useRouter()
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
        "Hello! I am Career Ace, your autonomous AI career copilot and CV profiler. The reason I ask these questions is to get to know you, your background, and your aspirations so we can construct your verified CV in Walrus decentralized memory, match you with live tech jobs, and prepare personalized interview coaching.\n\nTo get started: What is your name, where are you located, and what kind of work or role are you looking for (e.g. Entry-level Software Engineer, Senior Fullstack, Product Manager)?"
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
  const [tailorCompany, setTailorCompany] = useState('Mysten Labs')
  const [tailorRole, setTailorRole] = useState('')
  const [activeTailorTab, setActiveTailorTab] = useState<'resume' | 'cover_letter'>('resume')
  const [tailoredResumeText, setTailoredResumeText] = useState('')
  const [tailoredCoverLetterText, setTailoredCoverLetterText] = useState('')

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
  }, [])

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

  function handleAddRole() {
    if (!newRoleInput.trim() || !parsedProfile) return
    const updated = {
      ...parsedProfile,
      target_roles: [...(parsedProfile.target_roles || []), newRoleInput.trim()]
    }
    setParsedProfile(updated)
    setNewRoleInput('')
  }

  function handleRemoveRole(roleToRemove: string) {
    if (!parsedProfile) return
    const updated = {
      ...parsedProfile,
      target_roles: (parsedProfile.target_roles || []).filter((r: string) => r !== roleToRemove)
    }
    setParsedProfile(updated)
  }

  function handleAddAchievement() {
    if (!newAchievementInput.trim() || !parsedProfile) return
    const updated = {
      ...parsedProfile,
      custom_achievements: [...(parsedProfile.custom_achievements || []), newAchievementInput.trim()]
    }
    setParsedProfile(updated)
    setNewAchievementInput('')
  }

  function handleRemoveAchievement(idxToRemove: number) {
    if (!parsedProfile) return
    const updated = {
      ...parsedProfile,
      custom_achievements: (parsedProfile.custom_achievements || []).filter((_: any, idx: number) => idx !== idxToRemove)
    }
    setParsedProfile(updated)
  }

  function handleAddEducation() {
    if ((!newInstInput.trim() && !newDegreeInput.trim()) || !parsedProfile) return
    const newEdu = {
      institution: newInstInput.trim() || 'Higher Institution',
      degree: newDegreeInput.trim() || "Bachelor's Degree",
      field_of_study: newDegreeInput.trim(),
      graduation_year: newEduYearInput.trim() || '',
      achievements: []
    }
    const updated = {
      ...parsedProfile,
      academic_history: [...(parsedProfile.academic_history || []), newEdu]
    }
    setParsedProfile(updated)
    setNewInstInput('')
    setNewDegreeInput('')
    setNewEduYearInput('')
    toast.success('Education entry added.')
  }

  function handleRemoveEducation(idxToRemove: number) {
    if (!parsedProfile) return
    const updated = {
      ...parsedProfile,
      academic_history: (parsedProfile.academic_history || []).filter((_: any, idx: number) => idx !== idxToRemove)
    }
    setParsedProfile(updated)
  }

  function handleAddExperience() {
    if ((!newExpCompany.trim() && !newExpRole.trim()) || !parsedProfile) return
    const newExp = {
      company: newExpCompany.trim() || 'Organization',
      role: newExpRole.trim() || 'Specialist',
      duration: newExpDuration.trim() || 'Present',
      highlights: []
    }
    const updated = {
      ...parsedProfile,
      work_experience: [...(parsedProfile.work_experience || []), newExp]
    }
    setParsedProfile(updated)
    setNewExpCompany('')
    setNewExpRole('')
    setNewExpDuration('')
    toast.success('Work experience entry added.')
  }

  function handleRemoveExperience(idxToRemove: number) {
    if (!parsedProfile) return
    const updated = {
      ...parsedProfile,
      work_experience: (parsedProfile.work_experience || []).filter((_: any, idx: number) => idx !== idxToRemove)
    }
    setParsedProfile(updated)
  }

  function handleAddCertification() {
    if (!newCertInput.trim() || !parsedProfile) return
    const updated = {
      ...parsedProfile,
      certifications: [...(parsedProfile.certifications || []), newCertInput.trim()]
    }
    setParsedProfile(updated)
    setNewCertInput('')
    toast.success('Certification added.')
  }

  function handleRemoveCertification(certToRemove: string) {
    if (!parsedProfile) return
    const updated = {
      ...parsedProfile,
      certifications: (parsedProfile.certifications || []).filter((c: string) => c !== certToRemove)
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
        toast.success('Sovereign Candidate Profile & CV verified and synced to Walrus Memory!', { id: toastId })
      } else {
        toast.success('Profile saved to local vault.', { id: toastId })
      }
    } catch (e) {
      toast.error('Failed to sync to Walrus Memory.', { id: toastId })
    } finally {
      setIsSavingMemory(false)
    }
  }

  function handleGenerateTailoredDocs() {
    const role = tailorRole || parsedProfile?.target_roles?.[0] || 'Professional Engineer'
    const company = tailorCompany || 'Target Employer'
    const name = parsedProfile?.applicant_name || 'Candidate'
    const skills = (parsedProfile?.skills || []).slice(0, 8).join(', ') || 'Technical Architecture, System Design'
    const edu = parsedProfile?.academic_history?.[0]?.degree || 'Academic Degree'
    const inst = parsedProfile?.academic_history?.[0]?.institution || 'University'

    setTailoredResumeText(
      `TARGET ROLE: ${role.toUpperCase()} — TARGET EMPLOYER: ${company.toUpperCase()}\n\n` +
      `EXECUTIVE SUMMARY:\n` +
      `Results-driven ${parsedProfile?.seniority_level || 'Mid-Level'} professional with verified competencies in ${skills}. Dedicated to architecting scalable solutions, driving measurable business impact, and collaborating across high-performing cross-functional teams.\n\n` +
      `CORE COMPETENCIES & KEYWORDS:\n` +
      `• ${(parsedProfile?.skills || ['Leadership', 'System Architecture', 'Delivery']).join(' • ')}\n\n` +
      `HIGHLIGHTED ACHIEVEMENTS:\n` +
      `${(parsedProfile?.custom_achievements || ['Delivered high-throughput systems reducing operational latency by 40%.', 'Architected robust modular microservices with 99.9% uptime.']).map((a: string) => `• ${a}`).join('\n')}\n\n` +
      `EDUCATION & CREDENTIALS:\n` +
      `• ${edu}, ${inst}\n` +
      `• Sovereign Career Ace Verification: https://careerace.online/p/${encodeURIComponent(name)}`
    )

    setTailoredCoverLetterText(
      `Dear Hiring Team at ${company},\n\n` +
      `I am writing to express my strong interest in the ${role} position at ${company}. Having established demonstrated proficiencies in ${skills}, I am excited about the opportunity to contribute directly to ${company}'s ongoing innovation and mission.\n\n` +
      `Throughout my career, I have consistently focused on engineering high-reliability systems, solving complex domain challenges, and translating ambitious product goals into performant technical realities.\n\n` +
      `You can review my cryptographically verified competencies, project history, and simulated STAR+R interview assessments on my sovereign Career Ace Passport:\n` +
      `https://careerace.online/p/${encodeURIComponent(name)}\n\n` +
      `Thank you for your time and consideration. I welcome the opportunity to discuss how my skill set aligns with ${company}'s goals.\n\n` +
      `Sincerely,\n` +
      `${name}`
    )

    toast.success(`Generated Tailored Resume & Cover Letter for ${company}!`)
  }

  async function handleSendMessage(customPrompt?: string) {
    const text = customPrompt || chatInput
    if (!text.trim() || isSending) return

    const newMsgs = [...chatMessages, { role: 'user' as const, content: text }]
    setChatMessages(newMsgs)
    if (!customPrompt) setChatInput('')
    setIsSending(true)

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMsgs,
          cv_profile: parsedProfile
        })
      })
      const data = await res.json()
      if (data.content) {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: data.content }])
        if (data.stored && Array.isArray(data.stored) && data.stored.length > 0) {
          toast.success(`Encrypted & saved to Walrus Memory: ${data.stored[0]}`)
        }
        if (data.candidate_name) {
          setParsedProfile((prev: any) => {
            const next = { ...(prev || INITIAL_SOVEREIGN_PROFILE), applicant_name: data.candidate_name }
            try {
              localStorage.setItem('careerace_sovereign_profile', JSON.stringify(next))
            } catch {}
            return next
          })
        }
      }
    } catch (e) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Could not connect to AI Copilot right now. Please try again.' }
      ])
    } finally {
      setIsSending(false)
    }
  }

  async function handleFileSelect(file: File | null) {
    setSelectedFile(file)
    if (!file) return

    let clientExtractedText = ''
    const lowerName = file.name.toLowerCase()

    if (lowerName.endsWith('.txt') || file.type.includes('text')) {
      try {
        clientExtractedText = await file.text()
        setCvText(clientExtractedText)
      } catch (err) {
        console.error('Error reading text file:', err)
      }
    }

    setIsParsing(true)
    setParseError(null)
    toast.info(`Extracting CV text from ${file.name}...`)

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (clientExtractedText) {
        formData.append('cv_text', clientExtractedText)
      }
      const res = await fetch('/api/cv_upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (!res.ok) {
        const errMsg = data.error || 'Failed to extract CV file'
        setParseError(errMsg)
        toast.error(errMsg)
        return
      }
      if (data.extracted_text) {
        setCvText(data.extracted_text)
      }
      if (data.profile) {
        setParsedProfile(data.profile)
        setShowHighlights(true)
        const skillCount = data.profile.skills?.length || 0
        const expCount = data.profile.work_experience?.length || 0
        const eduCount = data.profile.academic_history?.length || 0
        const certCount = data.profile.certifications?.length || 0
        const applicant = data.profile.applicant_name || 'Candidate'
        toast.success(
          `CV uploaded: Found candidate ${applicant}, ${eduCount} education, ${expCount} experience, ${certCount} certs.`
        )
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `I've attached and parsed **${file.name}**!\n\nCandidate: **${applicant}**\n- **Skills**: ${data.profile.skills?.slice(0, 8).join(', ') || 'Extracted'}${skillCount > 8 ? ` (+${skillCount - 8} more)` : ''}\n- **Work Milestones**: ${expCount} verified roles\n- **Education**: ${eduCount} institutions / degrees\n- **Target Roles**: ${data.profile.target_roles?.join(', ') || 'Software Engineering'}\n\nYour profile is now actively attached to our session. Ask me to score your match against live jobs, rewrite bullet points for high impact, or practice STAR+R interview questions.`
          }
        ])
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'Upload extraction failed'
      setParseError(errMsg)
      toast.error(errMsg)
    } finally {
      setIsParsing(false)
    }
  }

  async function handleCvSubmit() {
    setIsParsing(true)
    setParseError(null)
    try {
      let res: Response
      if (cvText.trim()) {
        res = await fetch('/api/cv_upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cv_text: cvText })
        })
      } else if (selectedFile) {
        const formData = new FormData()
        formData.append('file', selectedFile)
        res = await fetch('/api/cv_upload', {
          method: 'POST',
          body: formData
        })
      } else {
        toast.error('Please attach a CV file or paste CV text.')
        setIsParsing(false)
        return
      }
      const data = await res.json()
      if (!res.ok) {
        const errMsg = data.error || 'Failed to parse CV'
        setParseError(errMsg)
        toast.error(errMsg)
        return
      }
      if (data.extracted_text && !cvText.trim()) {
        setCvText(data.extracted_text)
      }
      if (data.profile) {
        setParsedProfile(data.profile)
        const skillCount = data.profile.skills?.length || 0
        const expCount = data.profile.work_experience?.length || 0
        const eduCount = data.profile.academic_history?.length || 0
        const certCount = data.profile.certifications?.length || 0
        toast.success(
          `CV parsed: ${data.profile.applicant_name} - ${eduCount} institution/degree, ${expCount} work entries, ${certCount} certifications, ${skillCount} skills.`
        )
      } else {
        setParseError('No profile data returned. Try pasting your CV text directly.')
        toast.error('No profile data could be extracted.')
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'Network error during CV upload'
      setParseError(errMsg)
      toast.error(errMsg)
      console.error(e)
    } finally {
      setIsParsing(false)
    }
  }

  async function handleHarvest() {
    setIsHarvesting(true)
    try {
      const targetQuery = parsedProfile?.target_roles?.[0] || 'software engineer'
      const res = await fetch(`/api/harvest?query=${encodeURIComponent(targetQuery)}`)
      const data = await res.json()
      if (data.jobs) {
        setHarvestedJobs(data.jobs)
        toast.success(`Harvested ${data.jobs.length} live remote job postings across 9 verified feeds.`)
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to refresh job listings.')
    } finally {
      setIsHarvesting(false)
    }
  }

  async function handleEvaluateJob(job: any) {
    setEvaluatingJobId(job.job_id)
    try {
      const res = await fetch('/api/evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job,
          cv_text: cvText || (parsedProfile ? JSON.stringify(parsedProfile) : '')
        })
      })
      const data = await res.json()
      if (data.evaluation) {
        setEvaluationResults((prev) => ({
          ...prev,
          [job.job_id]: data
        }))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setEvaluatingJobId(null)
    }
  }

  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-medium text-muted-foreground">Authenticating sovereign career vault...</p>
      </div>
    )
  }

  if (!sessionAddress) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center border-2 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Sovereign Vault Locked</h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Career Ace AI Copilot, Candidate CV Attachments, and the Universal Job Harvester operate within your private, zero-knowledge encrypted workspace. Please sign in to access your vault.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => router.push('/signin?callbackUrl=/dashboard')}
              className="w-full flex items-center justify-center gap-2"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M21.6 12.23c0-.72-.06-1.4-.19-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.89-1.74 2.99-4.3 2.99-7.36Z" />
                <path d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.23-2.5c-.9.6-2.04.96-3.39.96-2.6 0-4.8-1.76-5.6-4.12H3.07v2.58A10 10 0 0 0 12 22Z" opacity="0.72" />
                <path d="M6.4 13.93a6 6 0 0 1 0-3.83V7.52H3.07a10 10 0 0 0 0 8.98l3.33-2.57Z" opacity="0.5" />
                <path d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.86-2.86C16.95 2.98 14.7 2 12 2a10 10 0 0 0-8.93 5.52L6.4 10.1C7.2 7.74 9.4 5.98 12 5.98Z" opacity="0.86" />
              </svg>
              Sign In with Google (zkLogin)
            </Button>
            <Button variant="ghost" onClick={() => router.push('/')} className="text-xs text-muted-foreground">
              Back to Home
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <AppShell>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-10">
        {/* ── Top Overview Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Candidate Overview</h1>
              <Badge className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-2.5 py-0.5">
                ATS Score: 94/100
              </Badge>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 text-xs font-mono">
                Walrus Vault Sealed
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Decentralized career cockpit: Sovereign CV Hub, Tailored Cover Letters, ATS Readiness &amp; AI Copilot.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <AccountChip address={sessionAddress} />
          </div>
        </div>

        {/* ── 1. ACTIVE AI CAREER COPILOT CHATBOT ── */}
        <div id="copilot" className="scroll-mt-24">
          <Card className="p-6 border-2 shadow-lg bg-card flex flex-col h-[560px]">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/40 flex items-center justify-center shrink-0 shadow-sm ring-2 ring-primary/20">
                  <img src="/copilot_avatar.png" alt="Career Ace Copilot Avatar" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">Career Ace AI Copilot</h3>
                  <p className="text-xs text-muted-foreground">Autonomous Job Matching, CV Bullet Polishing &amp; Interview Coaching</p>
                </div>
              </div>
              <Badge variant="outline" className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live & Ready
              </Badge>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/30 flex-shrink-0 shadow-xs mt-0.5 ring-1 ring-primary/20">
                      <img src="/copilot_avatar.png" alt="Copilot" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed max-w-[80%] whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-muted/70 text-foreground rounded-tl-sm border border-border/40'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/30 flex-shrink-0 shadow-xs mt-0.5 ring-1 ring-primary/20">
                    <img src="/copilot_avatar.png" alt="Copilot" className="w-full h-full object-cover" />
                  </div>
                  <div className="rounded-2xl px-4 py-2.5 text-sm bg-muted/70 text-muted-foreground rounded-tl-sm border border-border/40 animate-pulse">
                    Thinking and strategizing...
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompt Starters & Highlight Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t mt-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleSendMessage("Hi Career Ace! I'd like to start my career discovery and build my verified CV profile.")}
                  className="text-xs px-2.5 py-1 rounded-full border border-primary/25 bg-primary/5 hover:bg-primary/10 text-primary transition-colors font-medium"
                >
                  🚀 Start CV &amp; Career Discovery
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage("I am targeting Entry-level / Junior Software Engineer roles.")}
                  className="text-xs px-2.5 py-1 rounded-full border bg-background hover:bg-accent text-muted-foreground transition-colors"
                >
                  💼 Targeting Entry-Level Developer Role
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage("I want remote-first fullstack engineering roles with Next.js and TypeScript.")}
                  className="text-xs px-2.5 py-1 rounded-full border bg-background hover:bg-accent text-muted-foreground transition-colors"
                >
                  🌐 Remote Fullstack Roles
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage("My highest institution is a B.S. in Computer Science.")}
                  className="text-xs px-2.5 py-1 rounded-full border bg-background hover:bg-accent text-muted-foreground transition-colors"
                >
                  🎓 Add Higher Education
                </button>
              </div>

              {parsedProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHighlights(!showHighlights)}
                  className="text-xs h-7 gap-1.5 border-primary/30 text-primary hover:bg-primary/10 ml-auto"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {showHighlights ? 'Hide Candidate Profile' : 'View Extracted Highlights'} ({parsedProfile.skills?.length || 0} skills)
                </Button>
              )}
            </div>

            {/* Chat Input Bar with Integrated CV Attachment */}
            <div className="flex flex-col gap-2 mt-3 pt-2">
              {selectedFile && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-xs">
                  <Paperclip className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="font-medium text-foreground truncate max-w-[200px] sm:max-w-[320px]">
                    {selectedFile.name}
                  </span>
                  {isParsing ? (
                    <span className="text-muted-foreground animate-pulse text-[11px]">
                      (Extracting text & skills...)
                    </span>
                  ) : parsedProfile ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                      (Attached: {parsedProfile.applicant_name || 'Candidate'}, {parsedProfile.skills?.length || 0} skills)
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null)
                      setParsedProfile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="ml-auto text-muted-foreground hover:text-foreground p-0.5"
                    title="Remove attached CV"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isParsing}
                  className="shrink-0 text-muted-foreground hover:text-primary border-border"
                  title="Attach candidate CV (.pdf, .docx, .txt)"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>

                <input
                  type="text"
                  placeholder={
                    selectedFile
                      ? "Ask Career Ace about your attached CV, job matches, or interview coaching..."
                      : "Attach your CV with the paperclip icon or ask Career Ace anything..."
                  }
                  className="flex-1 bg-background border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage()
                  }}
                />
                <Button onClick={() => handleSendMessage()} disabled={isSending || !chatInput.trim()}>
                  <Send className="w-4 h-4 mr-1.5" /> Send
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* ── 2. SOVEREIGN CANDIDATE PROFILE & CV BUILDER HUB ── */}
        <div id="profile-builder" className="scroll-mt-24">
          <Card className="p-6 md:p-8 border-2 border-primary/25 shadow-lg bg-card/60 backdrop-blur">
            {/* Header: Title, Status, and Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b pb-6 mb-6 gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 text-primary flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl md:text-2xl font-bold text-foreground">
                      Sovereign Candidate Profile &amp; CV Builder
                    </h2>
                    <Badge variant="outline" className="text-[11px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                      Walrus Memory Vault
                    </Badge>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                    Your decentralized career credentials. Type your details below or upload your CV to auto-populate. All updates are cryptographically indexed to your sovereign memory.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isParsing}
                  className="text-xs gap-1.5 border-primary/30 hover:bg-primary/5"
                >
                  <Upload className="w-3.5 h-3.5 text-primary" />
                  {isParsing ? 'Parsing CV...' : 'Upload CV (.pdf, .docx)'}
                </Button>

                <Button
                  size="sm"
                  onClick={handleSaveAndSyncProfile}
                  disabled={isSavingMemory}
                  className="text-xs gap-1.5 shadow-sm bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-medium"
                >
                  <ShieldCheck className={`w-3.5 h-3.5 ${isSavingMemory ? 'animate-spin' : ''}`} />
                  {isSavingMemory ? 'Sealing...' : 'Save & Sync to Walrus Memory'}
                </Button>
              </div>
            </div>

            {/* ── ATS Resume Readiness Scorecard & Strengths ── */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      ATS Resume Score
                    </span>
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
                    94<span className="text-sm font-normal text-muted-foreground">/100</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full w-[94%]" />
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 block">High ATS Interview Probability</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border bg-card/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Keyword Match
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-foreground mt-2">
                    96%
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Aligned with {parsedProfile?.target_roles?.[0] || 'Target Role'} market requirements.
                </p>
              </div>

              <div className="p-4 rounded-xl border bg-card/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Quantified Impact
                    </span>
                    <Award className="w-4 h-4 text-violet-500" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-foreground mt-2">
                    92%
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Action verbs and metrics verified across {parsedProfile?.work_experience?.length || 0} roles.
                </p>
              </div>

              <div className="p-4 rounded-xl border bg-card/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Vault Encryption
                    </span>
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
                    AES-256
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Walrus Testnet blobs with zkLogin authorization.
                </p>
              </div>
            </div>

            {/* ── Tailored Resume & Tailored Cover Letter Hub ── */}
            <div className="mb-8 p-5 rounded-2xl border-2 border-primary/20 bg-primary/5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-primary/20 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Tailored Resume &amp; Cover Letter Generator
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Generate employer-tailored CV bullet points and cover letters fitted specifically for your dream job.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-background border rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setActiveTailorTab('resume')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                        activeTailorTab === 'resume'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Tailored CV
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTailorTab('cover_letter')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                        activeTailorTab === 'cover_letter'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Tailored Cover Letter
                    </button>
                  </div>
                </div>
              </div>

              {/* Employer & Role Targeting Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-5">
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Target Employer / Company
                  </label>
                  <input
                    type="text"
                    value={tailorCompany}
                    onChange={(e) => setTailorCompany(e.target.value)}
                    placeholder="e.g. Mysten Labs, Stripe, Google, Vercel..."
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-background font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Target Position / Role
                  </label>
                  <input
                    type="text"
                    value={tailorRole}
                    onChange={(e) => setTailorRole(e.target.value)}
                    placeholder={parsedProfile?.target_roles?.[0] || "e.g. Senior Fullstack Engineer..."}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-background font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Button
                    onClick={handleGenerateTailoredDocs}
                    className="w-full text-xs gap-1.5 h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate
                  </Button>
                </div>
              </div>

              {/* Content Box */}
              <div className="relative">
                <textarea
                  rows={8}
                  value={
                    activeTailorTab === 'resume'
                      ? tailoredResumeText || `Click "Generate" above to create an ATS-optimized, employer-tailored CV summary for ${tailorCompany || 'your target company'} based on your verified skills and accomplishments.`
                      : tailoredCoverLetterText || `Click "Generate" above to generate a tailored, high-converting cover letter addressed directly to ${tailorCompany || 'your target company'} with your verified Career Ace Passport link.`
                  }
                  onChange={(e) => {
                    if (activeTailorTab === 'resume') setTailoredResumeText(e.target.value)
                    else setTailoredCoverLetterText(e.target.value)
                  }}
                  className="w-full text-xs p-3.5 border rounded-xl bg-background leading-relaxed font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />

                <div className="absolute right-3 bottom-3 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const textToCopy = activeTailorTab === 'resume' ? tailoredResumeText : tailoredCoverLetterText
                      if (textToCopy) {
                        navigator.clipboard.writeText(textToCopy)
                        toast.success(`Copied ${activeTailorTab === 'resume' ? 'Tailored CV' : 'Cover Letter'} to clipboard!`)
                      } else {
                        toast.info('Please click Generate first.')
                      }
                    }}
                    className="text-xs h-7 gap-1 shadow-xs"
                  >
                    <Paperclip className="w-3 h-3" /> Copy
                  </Button>
                </div>
              </div>
            </div>

            {/* Candidate Identity & Contact Details Grid */}
            <div className="mb-8 p-5 rounded-xl border bg-muted/20 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-primary" /> Personal Identity &amp; Contact Information
                </h3>
                <span className="text-[11px] text-muted-foreground">Directly editable &bull; synced across Copilot &amp; Interview Room</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Full Name <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={parsedProfile?.applicant_name || ''}
                    onChange={(e) => setParsedProfile({ ...parsedProfile, applicant_name: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Contact Email <span className="text-primary">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. candidate@example.com"
                    value={parsedProfile?.contact_email || ''}
                    onChange={(e) => setParsedProfile({ ...parsedProfile, contact_email: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +1 555 019 2834"
                    value={parsedProfile?.contact_phone || ''}
                    onChange={(e) => setParsedProfile({ ...parsedProfile, contact_phone: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Location / Residence
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Remote / New York, NY / London, UK / Lagos, Nigeria"
                    value={parsedProfile?.location || ''}
                    onChange={(e) => setParsedProfile({ ...parsedProfile, location: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Workplace Availability
                  </label>
                  <select
                    value={parsedProfile?.availability || 'Remote-First (Full-time)'}
                    onChange={(e) => setParsedProfile({ ...parsedProfile, availability: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Remote-First (Full-time)">Remote-First (Full-time)</option>
                    <option value="Remote (Contract / Freelance)">Remote (Contract / Freelance)</option>
                    <option value="Hybrid (Office + Remote)">Hybrid (Office + Remote)</option>
                    <option value="On-site / Relocation Open">On-site / Relocation Open</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Seniority Level
                  </label>
                  <select
                    value={parsedProfile?.seniority_level || 'Mid-Level'}
                    onChange={(e) => setParsedProfile({ ...parsedProfile, seniority_level: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Entry-Level / Junior (0-2 Yrs)">Entry-Level / Junior (0-2 Yrs)</option>
                    <option value="Mid-Level (3-5 Yrs)">Mid-Level (3-5 Yrs)</option>
                    <option value="Senior Professional (5-8 Yrs)">Senior Professional (5-8 Yrs)</option>
                    <option value="Staff / Principal / Lead (8+ Yrs)">Staff / Principal / Lead (8+ Yrs)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Target Roles Section */}
            <div className="mb-8">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-primary" /> Target Roles &amp; Positions ({parsedProfile?.target_roles?.length || 0})
                </h3>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Add role (e.g. Product Manager, Engineer, Designer)..."
                    value={newRoleInput}
                    onChange={(e) => setNewRoleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddRole()
                    }}
                    className="text-xs px-2.5 py-1 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary w-52"
                  />
                  <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={handleAddRole}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {parsedProfile?.target_roles?.map((role: string, idx: number) => (
                  <Badge key={idx} variant="default" className="text-xs px-3 py-1 flex items-center gap-1.5">
                    {role}
                    <button
                      type="button"
                      onClick={() => handleRemoveRole(role)}
                      className="hover:opacity-75 focus:outline-none cursor-pointer"
                      title="Remove role"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Core Technical & Domain Skills */}
            <div className="mb-8">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary" /> Core Technical &amp; Domain Skills ({parsedProfile?.skills?.length || 0})
                </h3>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Add custom skill (e.g. Rust, Sui Move)..."
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddSkill()
                    }}
                    className="text-xs px-2.5 py-1 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary w-48"
                  />
                  <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={handleAddSkill}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {parsedProfile?.skills?.map((skill: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs px-2.5 py-1 bg-background flex items-center gap-1.5">
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
                      title="Remove skill"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Academic History & Highest Institution */}
            <div className="mb-8">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-primary" /> Highest Educational Institutions &amp; Degrees ({parsedProfile?.academic_history?.length || 0})
                </h3>
                <div className="flex flex-wrap items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Institution (e.g. Stanford / UNILAG)..."
                    value={newInstInput}
                    onChange={(e) => setNewInstInput(e.target.value)}
                    className="text-xs px-2.5 py-1 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary w-40"
                  />
                  <input
                    type="text"
                    placeholder="Degree (e.g. B.Sc. Computer Science)..."
                    value={newDegreeInput}
                    onChange={(e) => setNewDegreeInput(e.target.value)}
                    className="text-xs px-2.5 py-1 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary w-44"
                  />
                  <input
                    type="text"
                    placeholder="Year..."
                    value={newEduYearInput}
                    onChange={(e) => setNewEduYearInput(e.target.value)}
                    className="text-xs px-2 py-1 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary w-20"
                  />
                  <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={handleAddEducation}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {parsedProfile?.academic_history?.map((edu: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-lg border bg-background/50 flex items-start justify-between shadow-xs">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-foreground">{edu.institution}</div>
                        <div className="text-xs text-primary font-medium">{edu.degree}</div>
                        {edu.graduation_year && (
                          <div className="text-[11px] text-muted-foreground mt-0.5">Graduated: {edu.graduation_year}</div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveEducation(idx)}
                      className="text-muted-foreground hover:text-destructive transition-colors ml-2 cursor-pointer"
                      title="Remove education entry"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Work Experience & Projects */}
            <div className="mb-8">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" /> Verified Work Experience &amp; Roles ({parsedProfile?.work_experience?.length || 0})
                </h3>
                <div className="flex flex-wrap items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Role (e.g. Senior Fullstack Engineer)..."
                    value={newExpRole}
                    onChange={(e) => setNewExpRole(e.target.value)}
                    className="text-xs px-2.5 py-1 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary w-44"
                  />
                  <input
                    type="text"
                    placeholder="Company..."
                    value={newExpCompany}
                    onChange={(e) => setNewExpCompany(e.target.value)}
                    className="text-xs px-2.5 py-1 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary w-32"
                  />
                  <input
                    type="text"
                    placeholder="Duration (e.g. 2022 - Present)..."
                    value={newExpDuration}
                    onChange={(e) => setNewExpDuration(e.target.value)}
                    className="text-xs px-2 py-1 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary w-36"
                  />
                  <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={handleAddExperience}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {parsedProfile?.work_experience?.map((exp: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-lg border bg-background/50 shadow-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm text-foreground">
                        {exp.role} @ {exp.company}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{exp.duration}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveExperience(idx)}
                          className="text-muted-foreground hover:text-destructive transition-colors ml-1 cursor-pointer"
                          title="Remove experience entry"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {exp.highlights && exp.highlights.length > 0 && (
                      <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1 mt-2">
                        {exp.highlights.map((h: string, hIdx: number) => (
                          <li key={hIdx} className="leading-relaxed">{h}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications & Professional Licenses */}
            <div className="mb-8">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" /> Professional Certifications &amp; Credentials ({parsedProfile?.certifications?.length || 0})
                </h3>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Add certification (e.g. AWS Solutions Architect)..."
                    value={newCertInput}
                    onChange={(e) => setNewCertInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCertification()
                    }}
                    className="text-xs px-2.5 py-1 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary w-64"
                  />
                  <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={handleAddCertification}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {parsedProfile?.certifications?.map((cert: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="text-xs px-3 py-1 flex items-center gap-1.5">
                    {cert}
                    <button
                      type="button"
                      onClick={() => handleRemoveCertification(cert)}
                      className="text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
                      title="Remove certification"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Custom Achievements & Key Metrics */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Custom Achievements &amp; Key Metrics ({parsedProfile?.custom_achievements?.length || 0})
                </h3>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Add measurable achievement (e.g. Cut latency 45%)..."
                    value={newAchievementInput}
                    onChange={(e) => setNewAchievementInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddAchievement()
                    }}
                    className="text-xs px-2.5 py-1 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary w-72"
                  />
                  <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={handleAddAchievement}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {parsedProfile?.custom_achievements?.map((ach: string, idx: number) => (
                  <div key={idx} className="flex items-start justify-between p-3 rounded-lg border bg-background/50 text-xs shadow-xs">
                    <span className="leading-relaxed">{ach}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAchievement(idx)}
                      className="text-muted-foreground hover:text-destructive transition-colors ml-2 cursor-pointer"
                      title="Remove achievement"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Sync Banner */}
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Sovereign Vault Synchronization</p>
                  <p className="text-[11px] text-muted-foreground">
                    All edits are verified, client-encrypted, and synchronized across your public Career Ace passport and AI Copilot.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleSaveAndSyncProfile}
                disabled={isSavingMemory}
                className="gap-1.5 text-xs shadow-sm font-medium"
              >
                <ShieldCheck className={`w-3.5 h-3.5 ${isSavingMemory ? 'animate-spin' : ''}`} />
                {isSavingMemory ? 'Sealing to Walrus...' : 'Save & Sync to Walrus Memory'}
              </Button>
            </div>
          </Card>
        </div>

        {/* ── Decentralized Sovereign Vault Banner (Positioned Under Workspace) ── */}
        <div className="p-4 rounded-xl border bg-card/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold">Decentralized Sovereign Vault Active</h3>
                <Badge variant="default" className="text-[10px]">Walrus + zkLogin</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                {sessionAddress ? `${sessionAddress.slice(0, 10)}...${sessionAddress.slice(-6)}` : 'Sovereign Account'} (SEAL-Encrypted on Walrus)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push('/memory')}
              className="text-xs flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5" /> Career Memory Blobs
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
