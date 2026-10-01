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
  Building, ShieldCheck, Phone, Mail, Database, Lock, Fingerprint, Globe, Cpu, Layers, ExternalLink
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
      content: 'Hello! I am Career Ace, your autonomous AI career copilot. Upload your CV below or paste it into the vault to get instant role matching, tailored CV impact points, and mock interview prep.'
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
   * Client-side PDF text extraction using PDF.js loaded on-demand.
   * Runs directly in browser with 0 native server dependencies.
   */
  async function extractPdfTextInBrowser(file: File): Promise<string> {
    if (typeof window === 'undefined') throw new Error('Client-side only')

    // Dynamically inject PDF.js from Cloudflare CDN if not yet loaded
    if (!(window as any).pdfjsLib) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
        script.async = true
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Failed to load PDF script from CDN'))
        document.head.appendChild(script)
      })
    }

    const pdfjsLib = (window as any).pdfjsLib
    if (!pdfjsLib) throw new Error('PDF.js not available')

    if (!pdfjsLib.GlobalWorkerOptions?.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
    }

    const buffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) })
    const pdfDoc = await loadingTask.promise
    const pages: string[] = []

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum)
      const content = await page.getTextContent()
      const pageText = content.items
        .map((item: any) => (item.str !== undefined ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      if (pageText) {
        pages.push(pageText)
      }
    }

    const extracted = pages.join('\n\n').trim()
    if (!extracted || extracted.length < 10) {
      throw new Error('PDF contained insufficient readable text')
    }
    return extracted
  }

  /**
   * Automatically handle file selection:
   * 1. Read plaintext immediately if .txt
   * 2. Extract PDF text directly in browser via PDF.js so user sees text instantly in editor
   * 3. Send file and extracted text to /api/cv_upload to parse profile highlights
   * 4. Populate parsed profile with institution, degree, experience, certifications, and skills
   */
  async function handleFileSelect(file: File | null) {
    setSelectedFile(file)
    if (!file) return

    let clientExtractedText = ''
    const lowerName = file.name.toLowerCase()

    // Fast path 1: Plain text file
    if (lowerName.endsWith('.txt') || file.type.includes('text')) {
      try {
        clientExtractedText = await file.text()
        setCvText(clientExtractedText)
      } catch (err) {
        console.error('Error reading text file:', err)
      }
    }

    // Fast path 2: PDF file extracted directly in browser
    if (
      lowerName.endsWith('.pdf') ||
      file.type.includes('pdf') ||
      file.type === 'application/pdf'
    ) {
      try {
        toast.info('Extracting PDF text directly in browser...')
        clientExtractedText = await extractPdfTextInBrowser(file)
        if (clientExtractedText) {
          setCvText(clientExtractedText)
          toast.success('PDF text extracted into editor.')
        }
      } catch (pdfErr) {
        console.warn('Browser PDF extraction notice, delegating to server:', pdfErr)
      }
    }

    setIsParsing(true)
    setParseError(null)
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
        // Fallback: if client already has extracted text, try posting as raw text
        if (clientExtractedText) {
          const fallbackRes = await fetch('/api/cv_upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cv_text: clientExtractedText })
          })
          const fallbackData = await fallbackRes.json()
          if (fallbackRes.ok && fallbackData.profile) {
            setParsedProfile(fallbackData.profile)
            toast.success(`CV parsed: ${fallbackData.profile.applicant_name}`)
            return
          }
        }
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
          `CV uploaded: Text displayed in box. Found candidate ${data.profile.applicant_name}, ${eduCount} institution/degree, ${expCount} experience, ${certCount} certs.`
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
      const res = await fetch('/api/harvest?query=software%20engineer')
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

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ── Chatdeck Sticky Header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-card border border-border/70 shadow-sm p-1">
              <img src="/careerace_logo.png" alt="Career Ace Logo" className="w-full h-full object-contain dark:invert" />
            </div>
            <span className="font-bold text-lg">Career Ace</span>
            <Badge variant="outline" className="text-xs hidden sm:inline-flex">by IboTV</Badge>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground font-medium">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#copilot" className="hover:text-foreground transition-colors font-semibold text-primary">AI Copilot</a>
            <a href="#cv-upload" className="hover:text-foreground transition-colors">CV Showcase</a>
            <a href="#walrus-memory" className="hover:text-foreground transition-colors">Walrus Vault</a>
            <a href="#jobs" className="hover:text-foreground transition-colors">Job Matcher</a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button size="sm" variant="outline" onClick={() => router.push('/application_board')}>
              Applications
            </Button>
            {sessionAddress ? (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => document.getElementById('copilot')?.scrollIntoView({ behavior: 'smooth' })} className="hidden sm:flex text-xs font-medium">
                  Workspace
                </Button>
                <AccountChip address={sessionAddress} />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => router.push('/signin?mode=signin&callbackUrl=/#copilot')} className="text-xs font-semibold">
                  Sign In
                </Button>
                <Button size="sm" onClick={() => router.push('/signin?mode=signup&callbackUrl=/#copilot')} className="flex items-center gap-1.5 text-xs font-semibold">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M21.6 12.23c0-.72-.06-1.4-.19-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.89-1.74 2.99-4.3 2.99-7.36Z" />
                    <path d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.23-2.5c-.9.6-2.04.96-3.39.96-2.6 0-4.8-1.76-5.6-4.12H3.07v2.58A10 10 0 0 0 12 22Z" opacity="0.72" />
                    <path d="M6.4 13.93a6 6 0 0 1 0-3.83V7.52H3.07a10 10 0 0 0 0 8.98l3.33-2.57Z" opacity="0.5" />
                    <path d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.86-2.86C16.95 2.98 14.7 2 12 2a10 10 0 0 0-8.93 5.52L6.4 10.1C7.2 7.74 9.4 5.98 12 5.98Z" opacity="0.86" />
                  </svg>
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Authenticated Workspace Quick-Nav ─────────────────────────────── */}
      {sessionAddress && (
        <div className="bg-primary/5 border-b border-primary/20 py-2.5 px-4">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Sovereign Vault Connected:</span>
              <span className="font-mono text-muted-foreground">{sessionAddress.slice(0, 10)}...{sessionAddress.slice(-6)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => document.getElementById('copilot')?.scrollIntoView({ behavior: 'smooth' })}>
                AI Copilot
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => document.getElementById('cv-upload')?.scrollIntoView({ behavior: 'smooth' })}>
                Upload CV & Attachments
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => document.getElementById('jobs')?.scrollIntoView({ behavior: 'smooth' })}>
                Job Harvester
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Chatdeck Hero Block ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4">
        <ChatdeckHero onStart={() => document.getElementById('copilot')?.scrollIntoView({ behavior: 'smooth' })} />
      </div>

      {/* ── Chatdeck Features Section ────────────────────────────────────────── */}
      <ChatdeckFeatures />

      {/* ── Interactive Workspace ──────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {/* Free Model Info Badge */}
        <div className="mb-6 flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="w-4 h-4 text-primary" /> Powered by Free & Open-Source LLMs (DeepSeek R1 / Qwen 2.5 / Ollama Local)
          </div>
          <Badge variant="secondary">Zero Paid API Key Required</Badge>
        </div>

        {/* ── 1. ACTIVE AI CAREER COPILOT CHATBOT (Positioned before CV attachment) ── */}
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

        {/* ── 2. CANDIDATE CV FILE ATTACHMENT & HIGHLIGHT SHOWCASE ────────────── */}
        <div id="cv-upload" className="mb-16 scroll-mt-24">
          <Card className="p-8 border-2 shadow-lg">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Paperclip className="w-6 h-6 text-primary" /> Candidate CV File Attachment
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Attach your CV/Resume file (<code className="font-mono text-xs">.pdf</code>, <code className="font-mono text-xs">.docx</code>, <code className="font-mono text-xs">.txt</code>) or paste raw text below to ingest into your encrypted vault. Once uploaded, the extracted text will automatically display in the text box below.
            </p>

            {/* ── GOOGLE CONNECT & SOVEREIGN VAULT IDENTITY BANNER ── */}
            <div className="mb-6 p-4 rounded-xl border bg-card/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${sessionAddress ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold">
                      {sessionAddress ? 'Decentralized Sovereign Vault Active' : 'Sovereign Career Vault: Not Connected'}
                    </h3>
                    <Badge variant={sessionAddress ? 'default' : 'secondary'} className="text-[10px]">
                      {sessionAddress ? 'Walrus + zkLogin' : 'Guest Mode'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {sessionAddress
                      ? `Deterministic Sui Address: ${sessionAddress.slice(0, 10)}...${sessionAddress.slice(-6)} (SEAL-Encrypted under your Google ID)`
                      : 'Connect with Google to anchor your CV, tailored impact bullets, and interview logs to your private Walrus Memory.'}
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                {sessionAddress ? (
                  <Button size="sm" variant="outline" onClick={() => router.push('/application_board')} className="text-xs">
                    View Vault Records
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => router.push('/signin?callbackUrl=/')} className="text-xs flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M21.6 12.23c0-.72-.06-1.4-.19-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.89-1.74 2.99-4.3 2.99-7.36Z" />
                      <path d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.23-2.5c-.9.6-2.04.96-3.39.96-2.6 0-4.8-1.76-5.6-4.12H3.07v2.58A10 10 0 0 0 12 22Z" opacity="0.72" />
                      <path d="M6.4 13.93a6 6 0 0 1 0-3.83V7.52H3.07a10 10 0 0 0 0 8.98l3.33-2.57Z" opacity="0.5" />
                      <path d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.86-2.86C16.95 2.98 14.7 2 12 2a10 10 0 0 0-8.93 5.52L6.4 10.1C7.2 7.74 9.4 5.98 12 5.98Z" opacity="0.86" />
                    </svg>
                    Connect with Google
                  </Button>
                )}
              </div>
            </div>

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
                  Drag & drop your resume file here (<span className="text-primary font-semibold">PDF, DOCX, TXT</span>), or <span className="text-primary font-medium underline">browse files</span>
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
                Extracting CV content, reading text, detecting institution, degree, work experience, certifications, and skills...
              </div>
            )}
          </Card>

          {/* Interactive Candidate CV Showcase & Highlight Panel */}
          {parsedProfile && (
            <Card className="p-8 border-2 border-primary/20 bg-card/60 shadow-md mt-6 space-y-6">
              {/* Header Info: Name, Phone, Email, URLs */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-bold">{parsedProfile.applicant_name}</h3>
                    <Badge variant="outline">Verified Candidate</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1.5">
                    {parsedProfile.email && (
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <Mail className="w-3.5 h-3.5 text-primary" /> {parsedProfile.email}
                      </span>
                    )}
                    {parsedProfile.phone && (
                      <span className="flex items-center gap-1 font-semibold text-primary">
                        <Phone className="w-3.5 h-3.5 text-primary" /> {parsedProfile.phone}
                      </span>
                    )}
                    {parsedProfile.github_url && (
                      <span className="text-xs">GitHub: {parsedProfile.github_url}</span>
                    )}
                    {parsedProfile.linkedin_url && (
                      <span className="text-xs">LinkedIn: {parsedProfile.linkedin_url}</span>
                    )}
                  </div>
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

              {/* ── Verified Work Experience Showcase (Matching CV) ── */}
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

        {/* ── WALRUS DECENTRALIZED CAREER MEMORY & SOVEREIGN ARCHITECTURE ── */}
        <div id="walrus-memory" className="mb-16 scroll-mt-24">
          <Card className="p-8 border-2 shadow-lg bg-card/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="px-3 py-1 bg-primary/10 border-primary/30 text-primary text-xs font-semibold">
                    <Database className="w-3.5 h-3.5 mr-1" /> Walrus Memory Core
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Sui zkLogin + SEAL Cryptography
                  </Badge>
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight">
                  Decentralized Career Memory: Sovereign Candidate Architecture
                </h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-3xl leading-relaxed">
                  Your career lineage belongs strictly to you. With Walrus Memory (<code className="font-mono text-xs">@mysten-incubation/memwal</code> + <code className="font-mono text-xs">@mysten/walrus</code>), Career Ace eliminates centralized platform silos, ensuring permanent availability, zero-knowledge privacy, and absolute user isolation.
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2.5">
                {sessionAddress ? (
                  <Button variant="outline" size="sm" onClick={() => router.push('/application_board')} className="text-xs flex items-center gap-2">
                    <ExternalLink className="w-3.5 h-3.5" /> View Career Vault Blobs
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => router.push('/signin?callbackUrl=/')} className="text-xs flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M21.6 12.23c0-.72-.06-1.4-.19-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.89-1.74 2.99-4.3 2.99-7.36Z" />
                      <path d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.23-2.5c-.9.6-2.04.96-3.39.96-2.6 0-4.8-1.76-5.6-4.12H3.07v2.58A10 10 0 0 0 12 22Z" opacity="0.72" />
                      <path d="M6.4 13.93a6 6 0 0 1 0-3.83V7.52H3.07a10 10 0 0 0 0 8.98l3.33-2.57Z" opacity="0.5" />
                      <path d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.86-2.86C16.95 2.98 14.7 2 12 2a10 10 0 0 0-8.93 5.52L6.4 10.1C7.2 7.74 9.4 5.98 12 5.98Z" opacity="0.86" />
                    </svg>
                    Connect with Google (zkLogin)
                  </Button>
                )}
              </div>
            </div>

            {/* 4 Architectural Superpowers */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <div className="p-5 rounded-xl border bg-background/60 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
                    <Database className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base mb-1.5">Decentralized Blob Persistence</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Unlike LinkedIn or corporate applicant tracking systems that can delete or paywall your records, your CV and match lineage are stored as durable, content-addressed Walrus blobs permanently owned by you.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t text-[11px] font-mono text-muted-foreground">
                  Stack: @mysten/walrus
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-5 rounded-xl border bg-background/60 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base mb-1.5">Threshold Privacy with SEAL</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Resumes contain private contact details, salaries, and sensitive achievements. Everything is client-side encrypted via Mysten SEAL threshold cryptography on Sui before upload. Nobody can view raw data without your key.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t text-[11px] font-mono text-muted-foreground">
                  Stack: @mysten/seal
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-5 rounded-xl border bg-background/60 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center mb-3">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base mb-1.5">Deterministic User Uniqueness</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Every candidate connects their Google account via Enoki zkLogin, deriving a mathematically unique, non-custodial Sui address. Vaults are strictly isolated under <code className="text-foreground">address::career_vault</code> namespaces with zero cross-contamination.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t text-[11px] font-mono text-muted-foreground">
                  Stack: @mysten/enoki zkLogin
                </div>
              </div>

              {/* Feature 4 */}
              <div className="p-5 rounded-xl border bg-background/60 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base mb-1.5">Cross-Agent Memory &amp; Provenance</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    AI recruiting bots and mock interviewers query candidate vector embeddings for skill verification without exposing raw PII. Retractions stop facts from being recalled while preserving honest on-chain provenance.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t text-[11px] font-mono text-muted-foreground">
                  Stack: @mysten-incubation/memwal
                </div>
              </div>
            </div>

            {/* Live Sovereignty Status Strip */}
            <div className="mt-8 p-4 rounded-xl border bg-muted/40 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-foreground">Sovereign Candidate Network Status:</span>
                  <p className="text-xs text-muted-foreground">
                    Connected to Walrus Testnet Aggregator &amp; Mysten SEAL Decryption Committees on Sui.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="font-mono text-muted-foreground">
                  Vault ID: {sessionAddress ? `${sessionAddress.slice(0, 10)}...${sessionAddress.slice(-6)}` : 'Local Candidate Session'}
                </span>
                <Badge variant={sessionAddress ? 'default' : 'outline'} className="text-[10px]">
                  {sessionAddress ? 'zkLogin Secured' : 'Guest Mode'}
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* ── 3. UNIVERSAL JOB HARVESTER & FIT SCORER BOX ────────────────────── */}
        <div id="jobs" className="mb-16 scroll-mt-24">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold">Universal Job Harvester</h2>
              <p className="text-sm text-muted-foreground">
                Aggregates live remote listings across Remotive, WeWorkRemotely, Jobicy, RemoteOK, Himalayas, Nodesk, FreshRemote, Jobberman, and Google Jobs.
              </p>
            </div>
            <Button variant="outline" onClick={handleHarvest} disabled={isHarvesting}>
              <Search className="w-4 h-4 mr-2" /> {isHarvesting ? 'Scanning All Feeds...' : 'Refresh Listings'}
            </Button>
          </div>

          {harvestedJobs.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <p className="text-muted-foreground mb-4">No harvested jobs loaded yet. Click 'Scan Live Feeds' to aggregate public job channels.</p>
              <Button onClick={handleHarvest} disabled={isHarvesting}>
                {isHarvesting ? 'Scanning All 9 Feeds...' : 'Scan Live Feeds'}
              </Button>
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
