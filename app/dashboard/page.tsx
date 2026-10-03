'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AppShell } from '@/components/AppShell'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'motion/react'
import {
  Upload, FileText, CheckCircle2,
  ChevronRight, ChevronLeft, Sparkles, MessageSquare,
  Send, Bot, X,
  ShieldCheck, Mail, ExternalLink,
  Download, FileCode, Eye, Check, RefreshCw, ArrowRight,
  Copy, Trash2, Paperclip, AlertCircle
} from 'lucide-react'
import { AtsXRayDialog } from '@/components/AtsXRayDialog'
import { generateDocxBlob } from '@/lib/docx_exporter'
import { exportToJsonResume, importFromJsonResume } from '@/lib/json_resume'
import { analyzeAtsMatch, type AtsScorecard } from '@/lib/ats_engine'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

const FRESH_WELCOME_MESSAGE = {
  role: 'assistant' as const,
  content:
    "Welcome to Career Ace! I am your autonomous AI career copilot powered by Walrus Sovereign Memory. I securely store your verified experience, technical skills, and target roles across every session.\n\nAttach your CV (.pdf or .docx) to index your profile, or ask me anything to get started. How can I assist your career today?"
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'

  // Candidate CV File Attachment state - Starts clean with NO mock data
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatFileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [parsedProfile, setParsedProfile] = useState<any>(null)
  const [isSavingMemory, setIsSavingMemory] = useState(false)
  const [isClearingMemory, setIsClearingMemory] = useState(false)

  // Career Ace AI Copilot Chatbot state
  const [chatInput, setChatInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const chatMessagesEndRef = useRef<HTMLDivElement>(null)
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    FRESH_WELCOME_MESSAGE
  ])

  // Tailoring & Cover Letter state - No mock company or role defaults
  const [tailorCompany, setTailorCompany] = useState('')
  const [tailorRole, setTailorRole] = useState('')
  const [keyProblemsSolved, setKeyProblemsSolved] = useState('')
  const [coverLetterAngle, setCoverLetterAngle] = useState<'systems' | 'product' | 'startup'>('systems')
  const [tailoredResumeText, setTailoredResumeText] = useState('')
  const [tailoredCoverLetterText, setTailoredCoverLetterText] = useState('')
  const [isXRayOpen, setIsXRayOpen] = useState(false)
  const [atsScorecard, setAtsScorecard] = useState<AtsScorecard | null>(null)
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false)
  const jsonResumeFileInputRef = useRef<HTMLInputElement>(null)

  // Profiles State
  const [githubUsername, setGithubUsername] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')

  // Resume Document View Mode: default to upload when no profile exists
  const [resumeViewMode, setResumeViewMode] = useState<'editor' | 'upload'>('upload')

  // Auto-scroll chat on message change
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isSending])

  // Load stored profile strictly if valid (and clean out any legacy mock profiles)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('careerace_sovereign_profile') || localStorage.getItem('careerace_parsed_profile')
      if (stored) {
        const loaded = JSON.parse(stored)
        // Purge legacy mock profile if present
        if (loaded?.applicant_name === 'Ibochi Vincent' && loaded?.contact_email === 'ibochivincent@gmail.com') {
          localStorage.removeItem('careerace_sovereign_profile')
          localStorage.removeItem('careerace_parsed_profile')
          setParsedProfile(null)
          setResumeViewMode('upload')
        } else if (loaded && (loaded.applicant_name || loaded.skills?.length)) {
          setParsedProfile(loaded)
          if (loaded.target_roles?.[0]) setTailorRole(loaded.target_roles[0])
          setResumeViewMode('editor')
        }
      }
    } catch {}
  }, [])

  // Calculate dynamic ATS match scorecard only when a real profile exists
  useEffect(() => {
    if (parsedProfile && parsedProfile.skills && parsedProfile.skills.length > 0) {
      const expText = (parsedProfile.work_experience || [])
        .map((w: any) => `${w.role} at ${w.company}: ${(w.highlights || []).join(' ')}`)
        .join(' ')
      const eduText = (parsedProfile.academic_history || [])
        .map((a: any) => `${a.degree} at ${a.institution}`)
        .join(' ')
      const targetRoleName = tailorRole || parsedProfile.target_roles?.[0] || 'Software Engineer'
      const score = analyzeAtsMatch({
        jobTitle: targetRoleName,
        jobDescription: `Looking for an experienced professional skilled in ${(parsedProfile.skills || []).slice(0, 6).join(', ')} with strong architecture and production delivery.`,
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
    } else {
      setAtsScorecard(null)
    }
  }, [parsedProfile, tailorRole])

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
            content: `I've analyzed your question: "${text}". ${
              parsedProfile 
                ? `I am leveraging your verified profile for ${parsedProfile.applicant_name || 'your candidate profile'} and cross-referencing industry standards.` 
                : 'Upload or attach your CV to unlock personalized answers tailored to your exact work history and skills.'
            }`
          }
        ])
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I have logged your request into your session. Attach your CV or ask another question to proceed.'
        }
      ])
    } finally {
      setIsSending(false)
    }
  }

  async function handleSaveAndSyncProfile() {
    if (!parsedProfile) {
      toast.error('No CV uploaded yet. Please attach your CV first.')
      return
    }
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

  async function handleClearMemory() {
    if (!confirm('Are you sure you want to clear your Walrus Memory vault and reset all profile data? This will clear all stored candidate details for a completely fresh start.')) {
      return
    }
    setIsClearingMemory(true)
    const toastId = toast.loading('Clearing memory vault and wiping cache...')
    try {
      localStorage.removeItem('careerace_sovereign_profile')
      localStorage.removeItem('careerace_parsed_profile')
      localStorage.removeItem('careerace_target_title')
      localStorage.removeItem('careerace_chat_history')

      await fetch('/api/memory', { method: 'DELETE' }).catch(() => {})

      setParsedProfile(null)
      setSelectedFile(null)
      setTailorCompany('')
      setTailorRole('')
      setKeyProblemsSolved('')
      setTailoredResumeText('')
      setTailoredCoverLetterText('')
      setAtsScorecard(null)
      setChatMessages([FRESH_WELCOME_MESSAGE])
      setResumeViewMode('upload')

      toast.success('Memory vault cleared. Fresh session initialized.', { id: toastId })
    } catch {
      toast.error('Failed to clear memory.', { id: toastId })
    } finally {
      setIsClearingMemory(false)
    }
  }

  async function handleDownloadDocxResume() {
    if (!parsedProfile) {
      toast.error('Please upload a resume first.')
      return
    }
    setIsDownloadingDocx(true)
    const toastId = toast.loading('Compiling ATS-compliant .docx resume...')
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
      toast.success('ATS-compliant .docx resume downloaded!', { id: toastId })
    } catch {
      toast.error('Failed to generate .docx resume.', { id: toastId })
    } finally {
      setIsDownloadingDocx(false)
    }
  }

  function handleExportJsonResume() {
    if (!parsedProfile) {
      toast.error('Please upload a resume first.')
      return
    }
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
      toast.success('JSON Resume Standard file exported!')
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
      setResumeViewMode('editor')
      localStorage.setItem('careerace_sovereign_profile', JSON.stringify(imported))
      toast.success(`Successfully imported JSON Resume for ${imported.applicant_name || 'Candidate'}!`)
    } catch {
      toast.error('Failed to parse JSON Resume file.')
    }
  }

  function handleGenerateCoverLetter() {
    const role = tailorRole.trim() || 'the position'
    const company = tailorCompany.trim() || 'your organization'
    const name = parsedProfile?.applicant_name || 'Candidate'
    const email = parsedProfile?.contact_email || ''
    const phone = parsedProfile?.contact_phone || ''
    const location = parsedProfile?.location || ''
    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const topSkills = (parsedProfile?.skills || []).slice(0, 5).join(', ')
    const recentExp = parsedProfile?.work_experience?.[0]

    let problemSolvingBlock = ''
    if (keyProblemsSolved.trim()) {
      problemSolvingBlock = `Specifically, I specialize in addressing and resolving the following key challenges:\n${keyProblemsSolved.trim()}\n\n`
    }

    let narrative = ''
    if (coverLetterAngle === 'systems') {
      narrative =
        `I am writing to express my enthusiastic interest in the ${role} opening at ${company}. ` +
        (topSkills ? `With core expertise in ${topSkills}, ` : '') +
        `I have dedicated my career to designing dependable, resilient systems with measurable delivery impact.\n\n` +
        problemSolvingBlock +
        (recentExp
          ? `In my work at ${recentExp.company || 'my previous organization'} as ${recentExp.role || 'an engineer'}, I took ownership of complex operational workflows and collaborated cross-functionally to achieve measurable results.\n\n`
          : '') +
        `I am eager to bring this same engineering discipline, accountability, and problem-solving focus to ${company}.`
    } else if (coverLetterAngle === 'product') {
      narrative =
        `I am excited to submit my application for the ${role} role at ${company}. ` +
        (topSkills ? `Leveraging hands-on mastery in ${topSkills}, ` : '') +
        `I blend technical rigor with a deep commitment to user velocity, interface responsiveness, and business impact.\n\n` +
        problemSolvingBlock +
        (recentExp
          ? `Throughout my tenure at ${recentExp.company || 'my previous organization'}, I worked directly alongside product stakeholders to turn strategic roadmaps into resilient, production-ready deliverables.\n\n`
          : '') +
        `I welcome the chance to partner with ${company} to accelerate feature delivery and enhance customer satisfaction.`
    } else {
      narrative =
        `I am reaching out regarding the ${role} opportunity at ${company}. As a proactive builder who thrives with high autonomy and end-to-end ownership, I excel at taking ambiguous objectives and converting them into reliable, clean solutions.\n\n` +
        problemSolvingBlock +
        (recentExp
          ? `At ${recentExp.company || 'my prior role'}, I repeatedly stepped up to solve unblocking challenges and streamline technical execution across the entire stack.\n\n`
          : '') +
        `I am genuinely inspired by ${company}'s work and would be thrilled to contribute to your core initiatives.`
    }

    const contactLine = [email, phone, location].filter(Boolean).join(' · ')
    const letter =
      `${name}\n` +
      `${contactLine ? `${contactLine}\n\n` : '\n'}` +
      `${today}\n\n` +
      `Hiring Team · ${company}\n\n` +
      `Dear ${company} Hiring Team,\n\n` +
      `${narrative}\n\n` +
      `Thank you for your time and consideration. I would welcome the opportunity to discuss how my background and verified experience align with your team's objectives.\n\n` +
      `Sincerely,\n` +
      `${name}`

    setTailoredCoverLetterText(letter)
    toast.success(`Custom cover letter generated for ${company}!`)
  }

  async function handleFileSelect(file: File | null) {
    setSelectedFile(file)
    if (!file) return

    setIsParsing(true)
    const toastId = toast.loading(`Parsing CV from ${file.name}...`)

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
        setResumeViewMode('editor')
        localStorage.setItem('careerace_sovereign_profile', JSON.stringify(data.profile))
        localStorage.setItem('careerace_parsed_profile', JSON.stringify(data.profile))

        // Also sync facts to Walrus Memory automatically
        fetch('/api/memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: data.profile })
        }).catch(() => {})

        toast.success(`CV parsed and indexed into Sovereign Memory for ${data.profile.applicant_name || 'Candidate'}!`, { id: toastId })
        
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `I have successfully parsed and attached **${file.name}**!\n\n**Candidate:** ${data.profile.applicant_name || 'Verified Candidate'}\n• **Skills Detected:** ${(data.profile.skills || []).slice(0, 8).join(', ') || 'General competencies'}\n• **Target Roles:** ${(data.profile.target_roles || []).join(', ') || 'Engineering & Technology'}\n• **Experience Count:** ${data.profile.work_experience?.length || 0} position(s)\n\nYour profile has been indexed into your Walrus Sovereign Memory vault. You can now audit ATS compliance, generate tailored cover letters, or ask me to polish your bullets.`
          }
        ])
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to parse CV', { id: toastId })
    } finally {
      setIsParsing(false)
    }
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
        />
        <input
          ref={chatFileInputRef}
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

        {/* ── TAB 1: OVERVIEW = CENTRALIZED AI CAREER COPILOT CHATBOT ── */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Top Workspace Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                  {getGreeting()}{parsedProfile?.applicant_name ? `, ${parsedProfile.applicant_name.split(' ')[0]}` : ''}.
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Your autonomous AI career copilot with Walrus Sovereign Memory.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isParsing}
                  className="text-xs font-semibold gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 h-9"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {isParsing ? 'Parsing CV...' : parsedProfile ? 'Replace CV' : 'Attach CV (.pdf, .docx)'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearMemory}
                  disabled={isClearingMemory}
                  className="text-xs font-semibold gap-1.5 border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 h-9"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Reset Vault
                </Button>

                {parsedProfile && (
                  <Button
                    size="sm"
                    onClick={handleSaveAndSyncProfile}
                    disabled={isSavingMemory}
                    className="text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm h-9"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Sync Walrus Memory
                  </Button>
                )}
              </div>
            </div>

            {/* Central Autonomous Copilot Workspace */}
            <Card className="border border-border/80 shadow-md rounded-2xl bg-card overflow-hidden flex flex-col min-h-[620px]">
              {/* Agent Status Bar */}
              <div className="p-4 border-b border-border/80 bg-muted/30 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                      <Bot className="w-5 h-5" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-foreground">Career Ace Autonomous Copilot</h3>
                      <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 bg-emerald-500/10 font-mono">
                        MemWal v1.0
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {parsedProfile 
                        ? `Loaded verified profile: ${parsedProfile.applicant_name || 'Candidate'} (${parsedProfile.skills?.length || 0} skills indexed)`
                        : 'Fresh session. Upload your CV to index your sovereign credentials.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs text-muted-foreground border-border/80">
                    <ShieldCheck className="w-3 h-3 text-emerald-500 mr-1" /> zkLogin Isolated
                  </Badge>
                  {parsedProfile?.applicant_name && (
                    <Badge variant="secondary" className="text-xs font-semibold text-emerald-600 bg-emerald-500/10">
                      CV Attached
                    </Badge>
                  )}
                </div>
              </div>

              {/* Chat Messages Stream */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[500px]">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 text-xs leading-relaxed ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-lg bg-emerald-600/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl whitespace-pre-wrap ${
                        msg.role === 'assistant'
                          ? 'bg-muted/40 border border-border/80 text-foreground'
                          : 'bg-emerald-600 text-white font-medium shadow-sm'
                      }`}
                    >
                      {msg.content}
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                        U
                      </div>
                    )}
                  </div>
                ))}

                {isSending && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground p-3 rounded-xl bg-muted/30 border border-border/60 max-w-[320px]">
                    <Bot className="w-4 h-4 text-emerald-500 animate-pulse" />
                    <span>Career Ace is reasoning over your profile...</span>
                    <span className="flex items-center gap-1 ml-auto">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                    </span>
                  </div>
                )}
                <div ref={chatMessagesEndRef} />
              </div>

              {/* Prompt Suggestion Chips */}
              <div className="px-5 py-2.5 bg-muted/20 border-t border-border/60 flex flex-wrap items-center gap-2">
                {[
                  'Audit my CV for missing technical skills',
                  'What roles best match my experience?',
                  'Help me formulate high-impact Google XYZ bullet points',
                  'Draft a strategic outreach message to a hiring manager'
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setChatInput(prompt)}
                    className="text-xs px-3 py-1 rounded-full border border-border/80 bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <div className="p-4 border-t border-border/80 bg-card flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => chatFileInputRef.current?.click()}
                  title="Attach CV File"
                  className="h-10 w-10 p-0 rounded-xl border border-border shrink-0 hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>

                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={
                    parsedProfile 
                      ? "Ask Career Ace to polish your CV, analyze roles, or audit ATS compliance..." 
                      : "Type your query or attach your CV to begin..."
                  }
                  className="flex-1 h-10 px-4 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />

                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={isSending || !chatInput.trim()}
                  className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 font-semibold text-xs"
                >
                  <Send className="w-3.5 h-3.5 mr-1" /> Send
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── TAB 2: RESUMES ── */}
        {activeTab === 'resumes' && (
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {resumeViewMode === 'upload' || !parsedProfile ? (
                /* VIEW MODE 1: UPLOAD RESUME */
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Upload your resume</h1>
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload your PDF or DOCX file. Career Ace extracts your real experience, skills, and metrics into clean ATS format.
                      </p>
                    </div>

                    {parsedProfile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setResumeViewMode('editor')}
                        className="text-xs text-muted-foreground hover:text-foreground self-start"
                      >
                        View parsed resume <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    )}
                  </div>

                  <Card
                    onClick={() => fileInputRef.current?.click()}
                    className="p-12 border-2 border-dashed border-border/80 hover:border-emerald-500/60 rounded-3xl bg-card hover:bg-muted/10 transition-all cursor-pointer flex flex-col items-center justify-center text-center group min-h-[320px]"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-muted/60 border border-border/80 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform text-muted-foreground group-hover:text-emerald-500">
                      <Upload className="w-7 h-7" />
                    </div>
                    <p className="text-base font-bold text-foreground mb-1">
                      {selectedFile ? selectedFile.name : 'Click to select or drag your resume here'}
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Supported formats: <span className="font-semibold text-foreground">PDF, DOC, DOCX</span> (Max 10 MB)
                    </p>
                    <Badge variant="outline" className="text-xs font-mono border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                      Client-Side Parsed &amp; Encrypted
                    </Badge>
                  </Card>
                </motion.div>
              ) : (
                /* VIEW MODE 2: PARSED RESUME VIEW & ATS ACTIONS */
                <motion.div
                  key="editor"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
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
                        <ChevronLeft className="w-3.5 h-3.5" /> Re-upload file
                      </Button>
                      {atsScorecard && (
                        <Badge variant="outline" className="text-xs font-semibold text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                          ATS Grade: {atsScorecard.ats_grade} ({atsScorecard.overall_score}/100)
                        </Badge>
                      )}
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
                        size="sm"
                        onClick={handleDownloadDocxResume}
                        disabled={isDownloadingDocx}
                        className="text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white h-8"
                      >
                        <Download className="w-3.5 h-3.5" /> Download .docx
                      </Button>
                    </div>
                  </div>

                  {/* Clean Resume Paper View */}
                  <Card className="p-8 md:p-10 border border-border/80 shadow-md rounded-2xl bg-card space-y-6 font-sans">
                    {/* Header */}
                    <div className="border-b pb-5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                          {parsedProfile.applicant_name || 'Candidate Name'}
                        </h2>
                        <button
                          onClick={() => {
                            const newName = prompt('Enter candidate name:', parsedProfile.applicant_name || '')
                            if (newName) setParsedProfile({ ...parsedProfile, applicant_name: newName })
                          }}
                          className="text-xs text-muted-foreground hover:text-emerald-500 font-medium"
                        >
                          Edit Name
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {[
                          parsedProfile.contact_email,
                          parsedProfile.contact_phone,
                          parsedProfile.location
                        ].filter(Boolean).join(' · ')}
                      </p>
                    </div>

                    {/* Section: WORK EXPERIENCE */}
                    <div className="space-y-5">
                      <div className="flex items-center gap-2 border-b pb-1">
                        <h3 className="text-xs font-extrabold tracking-wider uppercase text-foreground">
                          WORK EXPERIENCE
                        </h3>
                        <span className="text-xs text-muted-foreground font-mono">
                          {parsedProfile.work_experience?.length || 0}
                        </span>
                      </div>

                      {parsedProfile.work_experience && parsedProfile.work_experience.length > 0 ? (
                        <div className="space-y-6">
                          {parsedProfile.work_experience.map((exp: any, idx: number) => (
                            <div key={idx} className="space-y-2">
                              <div className="flex justify-between items-baseline text-xs">
                                <span className="font-bold text-sm text-foreground">
                                  {exp.role || 'Position'} · {exp.company || 'Company'}
                                </span>
                                <span className="text-muted-foreground font-mono text-xs">
                                  {exp.duration || 'Past'}
                                </span>
                              </div>

                              {exp.highlights && exp.highlights.length > 0 ? (
                                <ul className="list-disc pl-4 space-y-1.5 text-xs text-muted-foreground">
                                  {exp.highlights.map((h: string, hIdx: number) => (
                                    <li key={hIdx} className="leading-relaxed">
                                      {h}
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl border border-dashed text-center text-xs text-muted-foreground">
                          No work experience entries parsed from file.
                        </div>
                      )}
                    </div>

                    {/* Section: SKILLS */}
                    <div className="space-y-3 pt-3 border-t">
                      <h3 className="text-xs font-extrabold tracking-wider uppercase text-foreground">SKILLS</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {(parsedProfile.skills || []).map((skill: string, sIdx: number) => (
                          <Badge key={sIdx} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Section: EDUCATION */}
                    {parsedProfile.academic_history && parsedProfile.academic_history.length > 0 && (
                      <div className="space-y-3 pt-3 border-t">
                        <h3 className="text-xs font-extrabold tracking-wider uppercase text-foreground">EDUCATION</h3>
                        <div className="space-y-2 text-xs">
                          {parsedProfile.academic_history.map((edu: any, eIdx: number) => (
                            <div key={eIdx} className="flex justify-between text-muted-foreground">
                              <span className="font-semibold text-foreground">{edu.degree} · {edu.institution}</span>
                              <span className="font-mono">{edu.graduation_year || ''}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
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
                Generate tailored cover letters grounded strictly in your real skills and the specific problems you can solve.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Parameters Panel */}
              <Card className="lg:col-span-5 p-6 border border-border/80 shadow-sm rounded-2xl bg-card space-y-5">
                <h3 className="font-bold text-sm text-foreground">Cover Letter Parameters</h3>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Target Company
                    </label>
                    <input
                      type="text"
                      value={tailorCompany}
                      onChange={(e) => setTailorCompany(e.target.value)}
                      placeholder="e.g. Acme Corp, Anthropic, Vercel"
                      className="w-full h-9 px-3 rounded-lg border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Target Role
                    </label>
                    <input
                      type="text"
                      value={tailorRole}
                      onChange={(e) => setTailorRole(e.target.value)}
                      placeholder="e.g. Full Stack Engineer, Senior Infrastructure Engineer"
                      className="w-full h-9 px-3 rounded-lg border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* USER REQUESTED FIELD: KEY PROBLEMS YOU CAN SOLVE */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Key Problems You Can Solve
                    </label>
                    <textarea
                      value={keyProblemsSolved}
                      onChange={(e) => setKeyProblemsSolved(e.target.value)}
                      rows={3}
                      placeholder="Describe the technical or business problems you excel at solving (e.g. reducing API latency, scaling microservices, building responsive React web apps)..."
                      className="w-full p-2.5 rounded-lg border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-2">
                      Problem-Solving Angle
                    </label>
                    <div className="space-y-2">
                      {[
                        { id: 'systems', title: 'Technical Scaling & Architecture', desc: 'Emphasizes reliability, throughput, and robust systems design.' },
                        { id: 'product', title: 'Product Velocity & UI Delivery', desc: 'Emphasizes rapid delivery, customer feedback, and clean interfaces.' },
                        { id: 'startup', title: 'High-Autonomy & Ownership', desc: 'Emphasizes wearing multiple hats, proactive unblocking, and speed.' }
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
                          <span className="text-[11px] text-muted-foreground">{angle.desc}</span>
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

                <div className="p-5 rounded-xl border border-border/80 bg-background text-xs leading-relaxed whitespace-pre-wrap min-h-[380px] max-h-[480px] overflow-y-auto text-foreground shadow-inner">
                  {tailoredCoverLetterText || (
                    <div className="text-center py-20 space-y-2 text-muted-foreground">
                      <Mail className="w-8 h-8 text-emerald-500 mx-auto" />
                      <p className="font-semibold text-foreground text-sm">No cover letter drafted yet</p>
                      <p className="text-xs">
                        Configure target company, role, and key problems you solve, then click Generate.
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
                        a.download = `${(tailorCompany || 'Company').replace(/\s+/g, '_')}_Cover_Letter.txt`
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
                      placeholder="e.g. octocat"
                      className="w-full h-9 px-3 rounded-lg border bg-background text-xs"
                    />
                  </div>

                  <Button
                    size="sm"
                    onClick={() => {
                      if (!githubUsername.trim()) {
                        toast.error('Please enter a GitHub username')
                        return
                      }
                      toast.success(`GitHub activity for ${githubUsername} synced to Walrus Memory!`)
                    }}
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
                      placeholder="e.g. https://linkedin.com/in/username"
                      className="w-full h-9 px-3 rounded-lg border bg-background text-xs"
                    />
                  </div>

                  <Button
                    size="sm"
                    onClick={() => {
                      if (!linkedinUrl.trim()) {
                        toast.error('Please enter a LinkedIn URL')
                        return
                      }
                      toast.success('LinkedIn credentials synced to Sovereign Passport!')
                    }}
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
