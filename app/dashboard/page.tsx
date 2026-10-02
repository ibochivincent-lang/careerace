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

export default function DashboardPage() {
  const router = useRouter()
  const [sessionAddress, setSessionAddress] = useState<string | null>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(true)

  // Candidate CV File Attachment state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [parsedProfile, setParsedProfile] = useState<any>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [cvText, setCvText] = useState('')
  const [showHighlights, setShowHighlights] = useState(false)

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
      content: 'Hello! I am Career Ace, your autonomous AI career copilot by IboTV. Upload your CV below or paste it into the vault to get instant role matching, tailored CV impact points, and mock interview prep.'
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

  useEffect(() => {
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
        {/* ── Top Workspace Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight">Career Ace Workspace</h1>
              <Badge variant="outline" className="text-xs">by IboTV</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Private candidate cockpit: AI Copilot, CV Attachment Vault, and Universal Job Harvester.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <AccountChip address={sessionAddress} />
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push('/application_board')}
              className="text-xs"
            >
              Applications
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push('/interview_room')}
              className="text-xs"
            >
              Interview Room
            </Button>
          </div>
        </div>

        {/* ── Sovereign Vault Identity Banner ── */}
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
                {sessionAddress.slice(0, 10)}...{sessionAddress.slice(-6)} (SEAL-Encrypted under your Google ID)
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

        {/* Free Model Info Strip */}
        <div className="flex items-center justify-between p-3.5 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <span>Powered by Free & Open-Source LLMs (DeepSeek R1 / Qwen 2.5 / Ollama Local)</span>
          </div>
          <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">Zero Paid API Key Required</Badge>
        </div>

        {/* ── 1. ACTIVE AI CAREER COPILOT CHATBOT ── */}
        <div id="copilot" className="scroll-mt-24">
          <Card className="p-6 border-2 shadow-lg bg-card flex flex-col h-[560px]">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">Career Ace AI Copilot</h3>
                  <p className="text-xs text-muted-foreground">Autonomous Job Matching, CV Bullet Polishing & Interview Coaching</p>
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
                    <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                      AI
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
                  <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                    AI
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
                  onClick={() => handleSendMessage("Analyze my uploaded CV and tell me my strongest roles")}
                  className="text-xs px-2.5 py-1 rounded-full border bg-background hover:bg-accent text-muted-foreground transition-colors"
                >
                  Analyze my top roles
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage("How can I tailor my CV bullets to get higher match scores?")}
                  className="text-xs px-2.5 py-1 rounded-full border bg-background hover:bg-accent text-muted-foreground transition-colors"
                >
                  Improve CV match score
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage("Give me a STAR+R interview question for fullstack engineering")}
                  className="text-xs px-2.5 py-1 rounded-full border bg-background hover:bg-accent text-muted-foreground transition-colors"
                >
                  Mock interview question
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

        {/* ── Interactive Candidate CV Showcase & Highlight Panel (Expandable) ── */}
        {parsedProfile && showHighlights && (
          <div id="cv-highlights" className="scroll-mt-24">
            <Card className="p-8 border-2 border-primary/20 shadow-md bg-card/40">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-6 mb-6 gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">
                        {parsedProfile.applicant_name || 'Candidate Profile'}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                        {parsedProfile.contact_email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" /> {parsedProfile.contact_email}
                          </span>
                        )}
                        {parsedProfile.contact_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" /> {parsedProfile.contact_phone}
                          </span>
                        )}
                        {parsedProfile.years_of_experience && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5" /> {parsedProfile.years_of_experience} Years Exp
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="px-3 py-1 font-mono text-xs">
                    Walrus Memory Ready
                  </Badge>
                </div>
              </div>

              {/* Editable Target Roles */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target Roles</h4>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Add role (e.g. Lead Architect)..."
                      value={newRoleInput}
                      onChange={(e) => setNewRoleInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddRole()
                      }}
                      className="text-xs px-2.5 py-1 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary w-48"
                    />
                    <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={handleAddRole}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {parsedProfile.target_roles?.map((role: string, idx: number) => (
                    <Badge key={idx} variant="default" className="text-xs px-3 py-1 flex items-center gap-1.5">
                      {role}
                      <button
                        type="button"
                        onClick={() => handleRemoveRole(role)}
                        className="hover:opacity-75 focus:outline-none"
                        title="Remove role"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Editable Skills Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Core Technical & Domain Skills ({parsedProfile.skills?.length || 0})
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Add custom skill..."
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddSkill()
                      }}
                      className="text-xs px-2.5 py-1 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary w-40"
                    />
                    <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={handleAddSkill}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {parsedProfile.skills?.map((skill: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs px-2.5 py-1 bg-background flex items-center gap-1.5">
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-muted-foreground hover:text-foreground focus:outline-none"
                        title="Remove skill"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Academic History & Degrees */}
              <div className="mb-8">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary" /> Academic History & Degrees ({parsedProfile.academic_history?.length || 0})
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Institution (e.g. Stanford)..."
                      value={newInstInput}
                      onChange={(e) => setNewInstInput(e.target.value)}
                      className="text-xs px-2.5 py-1 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary w-40"
                    />
                    <input
                      type="text"
                      placeholder="Degree (e.g. B.S. in CS)..."
                      value={newDegreeInput}
                      onChange={(e) => setNewDegreeInput(e.target.value)}
                      className="text-xs px-2.5 py-1 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary w-36"
                    />
                    <input
                      type="text"
                      placeholder="Year (e.g. 2020)..."
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
                  {parsedProfile.academic_history?.map((edu: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-lg border bg-background/50 flex items-start justify-between">
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
                        className="text-muted-foreground hover:text-destructive transition-colors ml-2"
                        title="Remove education entry"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {(!parsedProfile.academic_history || parsedProfile.academic_history.length === 0) && (
                    <p className="text-xs text-muted-foreground italic col-span-2">
                      No academic history detected. Add your institution and degree using the fields above.
                    </p>
                  )}
                </div>
              </div>

              {/* Verified Work Experience */}
              <div className="mb-8">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" /> Verified Work Experience ({parsedProfile.work_experience?.length || 0})
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Role (e.g. Senior Engineer)..."
                      value={newExpRole}
                      onChange={(e) => setNewExpRole(e.target.value)}
                      className="text-xs px-2.5 py-1 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary w-36"
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
                      placeholder="Duration (e.g. 2021 - 2024)..."
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
                  {parsedProfile.work_experience?.map((exp: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-lg border bg-background/50">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-sm text-foreground">
                          {exp.role} @ {exp.company}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{exp.duration}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExperience(idx)}
                            className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                            title="Remove experience entry"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1 mt-2">
                        {exp.highlights?.map((h: string, hIdx: number) => (
                          <li key={hIdx} className="leading-relaxed">{h}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {(!parsedProfile.work_experience || parsedProfile.work_experience.length === 0) && (
                    <p className="text-xs text-muted-foreground italic">
                      No work experience detected. Add your roles and company details above.
                    </p>
                  )}
                </div>
              </div>

              {/* Certifications & Professional Licenses */}
              <div className="mb-8">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" /> Professional Certifications & Credentials ({parsedProfile.certifications?.length || 0})
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Add certification (e.g. AWS Solutions Architect)..."
                      value={newCertInput}
                      onChange={(e) => setNewCertInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddCertification()
                      }}
                      className="text-xs px-2.5 py-1 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary w-60"
                    />
                    <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={handleAddCertification}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {parsedProfile.certifications?.map((cert: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-xs px-3 py-1 flex items-center gap-1.5">
                      {cert}
                      <button
                        type="button"
                        onClick={() => handleRemoveCertification(cert)}
                        className="text-muted-foreground hover:text-foreground focus:outline-none"
                        title="Remove certification"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {(!parsedProfile.certifications || parsedProfile.certifications.length === 0) && (
                    <p className="text-xs text-muted-foreground italic">
                      No certifications listed. Add relevant credentials above.
                    </p>
                  )}
                </div>
              </div>

              {/* Custom Career Highlights & Achievements */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Custom Achievements & Key Metrics ({parsedProfile.custom_achievements?.length || 0})
                  </h4>
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
                  {parsedProfile.custom_achievements?.map((ach: string, idx: number) => (
                    <div key={idx} className="flex items-start justify-between p-3 rounded-lg border bg-background/50 text-xs">
                      <span className="leading-relaxed">{ach}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAchievement(idx)}
                        className="text-muted-foreground hover:text-destructive transition-colors ml-2"
                        title="Remove achievement"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ── 2. UNIVERSAL JOB HARVESTER & FIT SCORER BOX ── */}
        <div id="jobs" className="scroll-mt-24">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Universal Job Harvester</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Aggregates live remote listings across Remotive, WeWorkRemotely, Jobicy, RemoteOK, Himalayas, Nodesk, FreshRemote, Jobberman, and Google Jobs.
              </p>
            </div>
            <Button variant="outline" onClick={handleHarvest} disabled={isHarvesting} className="gap-2">
              <Search className="w-4 h-4" /> {isHarvesting ? 'Scanning All Feeds...' : 'Refresh Listings'}
            </Button>
          </div>

          {harvestedJobs.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <p className="text-muted-foreground mb-4">No harvested jobs loaded yet. Click below to aggregate verified public job feeds.</p>
              <Button onClick={handleHarvest} disabled={isHarvesting} className="gap-2">
                <Search className="w-4 h-4" />
                {isHarvesting ? 'Scanning All 9 Feeds...' : 'Scan Live Feeds'}
              </Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {harvestedJobs.map((job, idx) => {
                const evalData = evaluationResults[job.job_id]
                const isEvaluating = evaluatingJobId === job.job_id

                return (
                  <Card key={idx} className="p-6 transition-all hover:shadow-md flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-lg">{job.title}</h3>
                          <p className="text-sm text-muted-foreground">{job.company} • {job.location}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="secondary" className="capitalize">{job.job_type || 'Remote'}</Badge>
                          {evalData && (
                            <Badge variant={evalData.evaluation.fit_score >= 6 ? "default" : "destructive"}>
                              Score: {evalData.evaluation.fit_score}/10
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-sm line-clamp-3 mb-4 text-muted-foreground">{job.description}</p>

                      {evalData && (
                        <div className="mb-4 p-3 rounded-md bg-secondary/30 text-xs space-y-1">
                          <div className="font-semibold text-foreground">
                            {evalData.application.track === "track_a_auto_apply" ? "Track A: Auto-Apply Ready" : "Track B: Manual Review Queue"}
                          </div>
                          <div className="text-muted-foreground">{evalData.evaluation.match_reason}</div>
                          {evalData.tailored_package && (
                            <div className="text-primary font-medium mt-1">
                              Cover letter & tailored CV generated and logged.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t text-xs flex flex-wrap items-center justify-between gap-2">
                      <span className="text-muted-foreground">Source: {job.source}</span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEvaluateJob(job)}
                          disabled={isEvaluating}
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1" />
                          {isEvaluating ? 'Scoring...' : evalData ? 'Re-Score' : 'Score Fit'}
                        </Button>
                        <a
                          href={job.apply_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        >
                          Apply Direct <ChevronRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
