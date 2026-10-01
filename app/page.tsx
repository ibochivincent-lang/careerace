'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AccountChip } from '@/components/AccountChip'
import { ChatdeckHero } from '@/components/blocks/chatdeck_hero'
import { ChatdeckFeatures } from '@/components/blocks/chatdeck_features'
import { ChatdeckFooter } from '@/components/blocks/chatdeck_footer'
import { toast } from 'sonner'
import {
  Briefcase, Search, Upload, FileText, CheckCircle2,
  ChevronRight, Paperclip, Sparkles, LogIn, MessageSquare,
  Award, User, GraduationCap, Send, Bot, Check, Edit3, Plus, X, AlertCircle,
  Building, ShieldCheck
} from 'lucide-react'

export default function CareerAcePage() {
  const router = useRouter()
  const [sessionAddress, setSessionAddress] = useState<string | null>(null)
  const [cvText, setCvText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [parsedProfile, setParsedProfile] = useState<any>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [isHarvesting, setIsHarvesting] = useState(false)
  const [harvestedJobs, setHarvestedJobs] = useState<any[]>([])

  const [evaluatingJobId, setEvaluatingJobId] = useState<string | null>(null)
  const [evaluationResults, setEvaluationResults] = useState<Record<string, any>>({})

  // Active AI Copilot Chatbot state
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Hello! I am Career Ace, your autonomous AI career copilot. Upload your CV or paste it above to get instant role matching, tailored CV impact points, and mock interview prep.'
    }
  ])

  // Editable custom skills and achievements
  const [newSkillInput, setNewSkillInput] = useState('')
  const [newAchievementInput, setNewAchievementInput] = useState('')
  const [newRoleInput, setNewRoleInput] = useState('')

  // Editable institutions, degrees, experiences, and certifications
  const [newInstInput, setNewInstInput] = useState('')
  const [newDegreeInput, setNewDegreeInput] = useState('')
  const [newEduYearInput, setNewEduYearInput] = useState('')

  const [newExpCompany, setNewExpCompany] = useState('')
  const [newExpRole, setNewExpRole] = useState('')
  const [newExpDuration, setNewExpDuration] = useState('')

  const [newCertInput, setNewCertInput] = useState('')

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

  const [chatInput, setChatInput] = useState('')
  const [isSending, setIsSending] = useState(false)

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
        { role: 'assistant', content: 'Could not connect right now. Please try again.' }
      ])
    } finally {
      setIsSending(false)
    }
  }

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.address) {
          setSessionAddress(data.address)
        }
      })
      .catch(() => {})
  }, [])

  /**
   * Automatically handle file selection:
   * 1. Read plaintext immediately if .txt
   * 2. Send file to /api/cv_upload to decompress & extract text
   * 3. Populate cvText in the textarea so user sees the extracted text right away
   * 4. Populate parsed profile with institution, degree, experience, certifications, and skills
   */
  async function handleFileSelect(file: File | null) {
    setSelectedFile(file)
    if (!file) return

    if (file.name.endsWith('.txt') || file.type.includes('text')) {
      try {
        const text = await file.text()
        setCvText(text)
      } catch (err) {
        console.error('Error reading text file:', err)
      }
    }

    setIsParsing(true)
    setParseError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
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
        const skillCount = data.profile.skills?.length || 0
        const expCount = data.profile.work_experience?.length || 0
        const eduCount = data.profile.academic_history?.length || 0
        const certCount = data.profile.certifications?.length || 0
        toast.success(
          `CV uploaded: Text displayed in box. Found ${eduCount} education/institution, ${expCount} experience, ${certCount} certs, ${skillCount} skills.`
        )
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
      if (selectedFile && !cvText.trim()) {
        const formData = new FormData()
        formData.append('file', selectedFile)
        res = await fetch('/api/cv_upload', {
          method: 'POST',
          body: formData
        })
      } else {
        res = await fetch('/api/cv_upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cv_text: cvText })
        })
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
          `CV parsed: ${eduCount} institution/degree, ${expCount} work entries, ${certCount} certifications, ${skillCount} skills.`
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
      const res = await fetch('/api/harvest?query=software%20engineer')
      const data = await res.json()
      if (data.jobs) {
        setHarvestedJobs(data.jobs)
      }
    } catch (e) {
      console.error(e)
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

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ── Chatdeck Sticky Header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary text-primary-foreground font-bold">
              <Briefcase className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg">Career Ace</span>
            <Badge variant="outline" className="text-xs hidden sm:inline-flex">by IboTV</Badge>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground font-medium">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#cv-upload" className="hover:text-foreground transition-colors">CV Showcase</a>
            <a href="#copilot" className="hover:text-foreground transition-colors">AI Copilot</a>
            <a href="#jobs" className="hover:text-foreground transition-colors">Job Matcher</a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button size="sm" variant="outline" onClick={() => router.push('/application_board')}>
              Applications
            </Button>
            {sessionAddress ? (
              <AccountChip address={sessionAddress} />
            ) : (
              <Button size="sm" onClick={() => router.push('/signin')}>
                <LogIn className="w-4 h-4 mr-1.5" /> Sign in with Google
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ── Chatdeck Hero Block ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4">
        <ChatdeckHero onStart={() => document.getElementById('cv-upload')?.scrollIntoView({ behavior: 'smooth' })} />
      </div>

      {/* ── Chatdeck Features Section ────────────────────────────────────────── */}
      <ChatdeckFeatures />

      {/* ── Interactive Workspace (File Upload Attachment & Harvester) ───────── */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {/* Free Model Info Badge */}
        <div className="mb-6 flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="w-4 h-4 text-primary" /> Powered by Free & Open-Source LLMs (DeepSeek R1 / Qwen 2.5 / Ollama Local)
          </div>
          <Badge variant="secondary">Zero Paid API Key Required</Badge>
        </div>

        {/* CV File Upload Attachment Box */}
        <div id="cv-upload" className="mb-16 scroll-mt-24">
          <Card className="p-8 border-2 shadow-lg">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Paperclip className="w-6 h-6 text-primary" /> Candidate CV File Attachment
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Attach your CV/Resume file (<code className="font-mono text-xs">.pdf</code>, <code className="font-mono text-xs">.docx</code>, <code className="font-mono text-xs">.txt</code>) or paste raw text below to ingest into your encrypted vault. Once uploaded, the extracted text will automatically display in the text box below.
            </p>

            {/* File Dropzone */}
            <div className="border-2 border-dashed rounded-lg p-6 mb-6 text-center hover:bg-primary/5 transition-colors cursor-pointer relative">
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              />
              <Upload className="w-8 h-8 text-primary mx-auto mb-2" />
              {selectedFile ? (
                <div>
                  <p className="text-sm font-medium text-primary">Attached File: {selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">File uploaded and text extracted below.</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Drag & drop your resume file here, or <span className="text-primary font-medium underline">browse files</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">
                CV / Resume Text (Extracted from file or pasted directly):
              </span>
              {cvText && (
                <span className="text-xs text-muted-foreground">
                  {cvText.length} characters loaded
                </span>
              )}
            </div>
            <textarea
              className="w-full h-40 p-4 rounded-lg border bg-background font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary mb-4 leading-relaxed"
              placeholder="Paste your CV text here or attach a file above to view extracted text..."
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
            />

            <div className="flex items-center justify-between">
              <Button onClick={handleCvSubmit} disabled={isParsing || (!selectedFile && !cvText.trim())}>
                {isParsing ? 'Extracting & Parsing Profile...' : 'Parse & Update Vault'}
              </Button>
              {parsedProfile && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Profile Ingested & Highlights Ready
                </div>
              )}
              {parseError && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 font-medium">
                  <AlertCircle className="w-4 h-4" /> {parseError}
                </div>
              )}
            </div>
            {isParsing && (
              <div className="mt-3 text-xs text-muted-foreground animate-pulse">
                Extracting CV content, detecting institution, degree, work experience, certifications, and skills...
              </div>
            )}
          </Card>

          {/* Interactive Candidate CV Showcase & Highlight Panel */}
          {parsedProfile && (
            <Card className="p-8 border-2 border-primary/20 bg-card/60 shadow-md mt-6 space-y-6">
              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-bold">{parsedProfile.applicant_name}</h3>
                    <Badge variant="outline">Verified Candidate</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {parsedProfile.email} {parsedProfile.github_url && `• ${parsedProfile.github_url}`}
                  </p>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-semibold mb-1">Target Roles:</div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {parsedProfile.target_roles?.map((role: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="px-2.5 py-1 text-xs font-semibold flex items-center gap-1">
                        {role}
                        <button
                          type="button"
                          onClick={() => handleRemoveRole(role)}
                          className="hover:text-destructive transition-colors ml-0.5"
                          title="Remove role"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="+ Add role..."
                        value={newRoleInput}
                        onChange={(e) => setNewRoleInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddRole()
                        }}
                        className="text-xs px-2 py-0.5 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary w-24"
                      />
                      <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={handleAddRole}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Key Profile Highlights (Institution, Degree, Experience, Certifications) ── */}
              <div className="p-5 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Core Candidate Highlights
                  </span>
                  <Badge variant="secondary" className="text-xs">Highlighted Key Details</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Highlight 1: Institution & Degree */}
                  <div className="p-3.5 rounded-lg border bg-background/90 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-1.5">
                      <GraduationCap className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Institution & Degree
                      </span>
                    </div>
                    {parsedProfile.academic_history && parsedProfile.academic_history.length > 0 ? (
                      <div>
                        <div className="font-bold text-sm text-foreground line-clamp-1">
                          {parsedProfile.academic_history[0].institution}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <Badge variant="outline" className="text-xs font-medium bg-primary/10 text-primary border-primary/30">
                            {parsedProfile.academic_history[0].degree}
                          </Badge>
                          {parsedProfile.academic_history[0].graduation_year && (
                            <span className="text-xs text-muted-foreground">
                              ({parsedProfile.academic_history[0].graduation_year})
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Add your institution / degree below</span>
                    )}
                  </div>

                  {/* Highlight 2: Work Experience */}
                  <div className="p-3.5 rounded-lg border bg-background/90 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Briefcase className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Work Experience
                      </span>
                    </div>
                    {parsedProfile.work_experience && parsedProfile.work_experience.length > 0 ? (
                      <div>
                        <div className="font-bold text-sm text-foreground line-clamp-1">
                          {parsedProfile.work_experience[0].role}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {parsedProfile.work_experience[0].company} • {parsedProfile.work_experience[0].duration || 'Verified'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Add your work experience below</span>
                    )}
                  </div>

                  {/* Highlight 3: Certifications */}
                  <div className="p-3.5 rounded-lg border bg-background/90 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Award className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Certifications & Licenses
                      </span>
                    </div>
                    {parsedProfile.certifications && parsedProfile.certifications.length > 0 ? (
                      <div>
                        <div className="font-bold text-sm text-foreground line-clamp-1">
                          {parsedProfile.certifications[0]}
                        </div>
                        <div className="text-xs text-primary font-medium mt-0.5">
                          {parsedProfile.certifications.length} verified credential{parsedProfile.certifications.length > 1 ? 's' : ''}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Add professional certifications below</span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Institution & Bachelor's Degree / Academic History Showcase ── */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary" /> Institution & Degree History ({parsedProfile.academic_history?.length || 0})
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Institution (e.g. University)..."
                      value={newInstInput}
                      onChange={(e) => setNewInstInput(e.target.value)}
                      className="text-xs px-2.5 py-1 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary w-40"
                    />
                    <input
                      type="text"
                      placeholder="Degree (e.g. Bachelor of Science)..."
                      value={newDegreeInput}
                      onChange={(e) => setNewDegreeInput(e.target.value)}
                      className="text-xs px-2.5 py-1 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary w-44"
                    />
                    <input
                      type="text"
                      placeholder="Year (e.g. 2022)..."
                      value={newEduYearInput}
                      onChange={(e) => setNewEduYearInput(e.target.value)}
                      className="text-xs px-2 py-1 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary w-24"
                    />
                    <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={handleAddEducation}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add
                    </Button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {parsedProfile.academic_history?.map((edu: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-lg border bg-background/50 text-xs relative group">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-semibold">
                              {edu.degree}
                            </Badge>
                            {edu.graduation_year && (
                              <span className="text-muted-foreground">Class of {edu.graduation_year}</span>
                            )}
                          </div>
                          <div className="font-bold text-sm text-foreground flex items-center gap-1.5 mt-1">
                            <Building className="w-3.5 h-3.5 text-primary" /> {edu.institution}
                          </div>
                          {edu.field_of_study && edu.field_of_study !== edu.degree && (
                            <div className="text-muted-foreground mt-0.5">Major / Field: {edu.field_of_study}</div>
                          )}
                          {edu.achievements && edu.achievements.length > 0 && (
                            <div className="mt-2 text-primary font-medium">{edu.achievements.join(' • ')}</div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveEducation(idx)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          title="Remove education entry"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!parsedProfile.academic_history || parsedProfile.academic_history.length === 0) && (
                    <p className="text-xs text-muted-foreground italic col-span-2">
                      No academic history detected. Add your institution and degree using the fields above.
                    </p>
                  )}
                </div>
              </div>

              {/* ── Verified Work Experience Showcase ── */}
              <div>
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

              {/* ── Certifications & Professional Licenses ── */}
              <div>
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
                    <Badge
                      key={idx}
                      variant="outline"
                      className="px-3 py-1.5 bg-amber-500/10 text-foreground border-amber-500/30 text-xs font-medium flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                      {cert}
                      <button
                        type="button"
                        onClick={() => handleRemoveCertification(cert)}
                        className="hover:text-destructive transition-colors ml-1"
                        title="Remove certification"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {(!parsedProfile.certifications || parsedProfile.certifications.length === 0) && (
                    <span className="text-xs text-muted-foreground italic">
                      No certifications listed. Add your credentials (AWS, Google, CompTIA, PMP, Cisco, etc.) above.
                    </span>
                  )}
                </div>
              </div>

              {/* ── Skills Highlights with Add / Remove Ability ── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> Highlighted Technical Skills ({parsedProfile.skills?.length || 0})
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Add custom skill (e.g. Next.js)..."
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddSkill()
                      }}
                      className="text-xs px-2.5 py-1 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary w-44"
                    />
                    <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={handleAddSkill}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {parsedProfile.skills?.map((skill: string, idx: number) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="px-3 py-1 bg-primary/10 text-primary border-primary/30 text-sm font-medium flex items-center gap-1.5"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-destructive transition-colors"
                        title="Remove skill"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {(!parsedProfile.skills || parsedProfile.skills.length === 0) && (
                    <span className="text-xs text-muted-foreground italic">No skills listed yet. Type above to add your core tech stack.</span>
                  )}
                </div>
              </div>

              {/* Custom Key Achievements & Projects */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" /> Key Achievements & Portfolio Highlights
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Add achievement or metric..."
                      value={newAchievementInput}
                      onChange={(e) => setNewAchievementInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddAchievement()
                      }}
                      className="text-xs px-2.5 py-1 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary w-56"
                    />
                    <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={handleAddAchievement}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {parsedProfile.custom_achievements?.map((ach: string, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border bg-background/50 text-xs">
                      <span className="font-medium text-foreground">{ach}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAchievement(idx)}
                        className="text-muted-foreground hover:text-destructive transition-colors ml-2"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {(!parsedProfile.custom_achievements || parsedProfile.custom_achievements.length === 0) && (
                    <p className="text-xs text-muted-foreground italic">
                      Add custom accomplishments, awards, or quantified milestones you want highlight in your applications.
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* ── Active AI Career Copilot Chatbot ──────────────────────────────── */}
        <div id="copilot" className="mb-16 scroll-mt-24">
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

            {/* Quick Prompt Starters */}
            <div className="flex flex-wrap gap-2 pt-3 border-t mt-3">
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

            {/* Chat Input Bar */}
            <div className="flex items-center gap-2 mt-3 pt-2">
              <input
                type="text"
                placeholder="Ask Career Ace anything about your job search, CV, or interview prep..."
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
          </Card>
        </div>

        {/* Job Harvester & Fit Scorer Box */}
        <div id="jobs" className="mb-16 scroll-mt-24">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold">Universal Job Harvester</h2>
              <p className="text-sm text-muted-foreground">Scans Remote, Onsite, and Hybrid listings matched against your candidate profile.</p>
            </div>
            <Button variant="outline" onClick={handleHarvest} disabled={isHarvesting}>
              <Search className="w-4 h-4 mr-2" /> {isHarvesting ? 'Scanning...' : 'Refresh Listings'}
            </Button>
          </div>

          {harvestedJobs.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <p className="text-muted-foreground mb-4">No harvested jobs loaded yet. Click 'Refresh Listings' to scan public job channels.</p>
              <Button onClick={handleHarvest} disabled={isHarvesting}>Run Harvester</Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {harvestedJobs.map((job, idx) => {
                const evalData = evaluationResults[job.job_id];
                const isEvaluating = evaluatingJobId === job.job_id;

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
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Chatdeck Footer ─────────────────────────────────────────────────── */}
      <ChatdeckFooter />
    </div>
  )
}
