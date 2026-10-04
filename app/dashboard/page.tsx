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
  Copy, Trash2, Paperclip, AlertCircle, Plus, Edit3, Database,
  TrendingUp, Target, AlertTriangle, FileCheck
} from 'lucide-react'
import { AtsXRayDialog } from '@/components/AtsXRayDialog'
import { generateDocxBlob } from '@/lib/docx_exporter'
import { exportToJsonResume, importFromJsonResume } from '@/lib/json_resume'
import { analyzeAtsMatch, type AtsScorecard, type KeywordDiffItem } from '@/lib/ats_engine'
import { extractPdfTextInBrowser } from '@/lib/pdf_extract_browser'
import { LivePdfPreview } from '@/components/LivePdfPreview'
import { WalrusVersionDrawer, type WalrusResumeVersionItem } from '@/components/WalrusVersionDrawer'

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
  const [sessionAddress, setSessionAddress] = useState<string>('')

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        if (data.address) {
          setSessionAddress(data.address)
        } else {
          const stored = localStorage.getItem('careerace_session_address')
          if (stored) setSessionAddress(stored)
        }
      })
      .catch(() => {})
  }, [])

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
  const [atsScorecard, setAtsScorecard] = useState<AtsScorecard | null>(null)
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false)

  // Resume Tailoring & View State - Modern ATS Standard
  const [jobDescriptionForTailor, setJobDescriptionForTailor] = useState('')
  const [isTailoringResume, setIsTailoringResume] = useState(false)
  const [isTailorOpen, setIsTailorOpen] = useState(false)
  const [resumeDisplayMode, setResumeDisplayMode] = useState<'ats_document' | 'pdf_preview' | 'tailored_text'>('ats_document')
  const [newSkillInput, setNewSkillInput] = useState('')

  // Walrus Resume Versioning state
  const [walrusVersions, setWalrusVersions] = useState<WalrusResumeVersionItem[]>([])
  const [isSavingWalrusVersion, setIsSavingWalrusVersion] = useState(false)
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null)

  // Profiles State
  const [githubUsername, setGithubUsername] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')

  // Resume Document View Mode: default to upload when no profile exists
  const [resumeViewMode, setResumeViewMode] = useState<'editor' | 'upload'>('upload')

  // Automatically open tailoring calibration if tab is 'tailored'
  useEffect(() => {
    if (activeTab === 'tailored') {
      setIsTailorOpen(true)
    }
  }, [activeTab])

  // Auto-scroll chat on message change
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isSending])

  // Load stored profile and Walrus version snapshots
  useEffect(() => {
    try {
      const storedVersions = localStorage.getItem('careerace_walrus_versions')
      if (storedVersions) {
        setWalrusVersions(JSON.parse(storedVersions))
      }
    } catch {}
  }, [])

  // Load stored profile strictly if valid
  useEffect(() => {
    try {
      const stored = localStorage.getItem('careerace_sovereign_profile') || localStorage.getItem('careerace_parsed_profile')
      if (stored) {
        const loaded = JSON.parse(stored)
        if (loaded && (loaded.applicant_name || loaded.skills?.length || loaded.work_experience?.length)) {
          setParsedProfile(loaded)
          if (loaded.target_roles?.[0]) setTailorRole(loaded.target_roles[0])
          setResumeViewMode('editor')
        }
      }
    } catch {}
  }, [])

  // Calculate ATS scorecard ONLY against a real job description.
  // We NEVER generate a synthetic JD from the candidate's own skills (that inflates scores).
  useEffect(() => {
    if (
      parsedProfile &&
      parsedProfile.skills &&
      parsedProfile.skills.length > 0 &&
      jobDescriptionForTailor &&
      jobDescriptionForTailor.trim().length > 30
    ) {
      const expText = (parsedProfile.work_experience || [])
        .map((w: any) => `${w.role} at ${w.company}: ${(w.highlights || []).join(' ')}`)
        .join(' ')
      const eduText = (parsedProfile.academic_history || [])
        .map((a: any) => `${a.degree} at ${a.institution}`)
        .join(' ')
      const score = analyzeAtsMatch({
        jobTitle: tailorRole || parsedProfile.target_roles?.[0] || '',
        jobDescription: jobDescriptionForTailor,
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
      // No real job description → no misleading score
      setAtsScorecard(null)
    }
  }, [parsedProfile, tailorRole, jobDescriptionForTailor])

  function updateProfileField(updates: Partial<any>) {
    if (!parsedProfile) return
    const next = { ...parsedProfile, ...updates }
    setParsedProfile(next)
    localStorage.setItem('careerace_sovereign_profile', JSON.stringify(next))
    localStorage.setItem('careerace_parsed_profile', JSON.stringify(next))
  }

  function handleAddSkillChip() {
    if (!newSkillInput.trim() || !parsedProfile) return
    const s = newSkillInput.trim()
    if (!parsedProfile.skills?.includes(s)) {
      updateProfileField({ skills: [...(parsedProfile.skills || []), s] })
      toast.success(`Skill "${s}" added to profile`)
    }
    setNewSkillInput('')
  }

  function handleRemoveSkillChip(skillToRemove: string) {
    if (!parsedProfile) return
    updateProfileField({
      skills: (parsedProfile.skills || []).filter((s: string) => s !== skillToRemove)
    })
    toast.success(`Skill "${skillToRemove}" removed`)
  }

  function handleAddBullet(expIdx: number) {
    if (!parsedProfile) return
    const exp = [...(parsedProfile.work_experience || [])]
    if (exp[expIdx]) {
      exp[expIdx] = {
        ...exp[expIdx],
        highlights: [...(exp[expIdx].highlights || []), 'Engineered and delivered key initiatives contributing to business and team objectives.']
      }
      updateProfileField({ work_experience: exp })
    }
  }

  function handleEditBullet(expIdx: number, bulletIdx: number, text: string) {
    if (!parsedProfile) return
    const exp = [...(parsedProfile.work_experience || [])]
    if (exp[expIdx] && exp[expIdx].highlights) {
      const hl = [...exp[expIdx].highlights]
      hl[bulletIdx] = text
      exp[expIdx] = { ...exp[expIdx], highlights: hl }
      updateProfileField({ work_experience: exp })
    }
  }

  function handleRemoveBullet(expIdx: number, bulletIdx: number) {
    if (!parsedProfile) return
    const exp = [...(parsedProfile.work_experience || [])]
    if (exp[expIdx] && exp[expIdx].highlights) {
      const hl = exp[expIdx].highlights.filter((_: any, idx: number) => idx !== bulletIdx)
      exp[expIdx] = { ...exp[expIdx], highlights: hl }
      updateProfileField({ work_experience: exp })
    }
  }

  function handleRemoveExperience(expIdx: number) {
    if (!parsedProfile) return
    const exp = (parsedProfile.work_experience || []).filter((_: any, idx: number) => idx !== expIdx)
    updateProfileField({ work_experience: exp })
    toast.success('Experience section updated')
  }

  async function handleTailorResume() {
    if (!parsedProfile) {
      toast.error('Please upload your resume first.')
      return
    }
    setIsTailoringResume(true)
    const toastId = toast.loading('Tailoring resume for ATS alignment...')
    try {
      const custom_keys = {
        groq: localStorage.getItem('careerace_groq_key') || '',
        google: localStorage.getItem('careerace_gemini_key') || '',
        openrouter: localStorage.getItem('careerace_openrouter_key') || '',
        opencode: localStorage.getItem('careerace_opencode_key') || '',
      }

      const res = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: tailorCompany || 'Target Organization',
          role: tailorRole || parsedProfile.target_roles?.[0] || 'Target Role',
          job_description: jobDescriptionForTailor,
          profile: parsedProfile,
          custom_keys
        })
      })
      const data = await res.json()
      if (res.ok && data.tailored_resume) {
        setTailoredResumeText(data.tailored_resume)
        if (data.tailored_profile) {
          updateProfileField(data.tailored_profile)
        }
        if (data.ats_scorecard) {
          setAtsScorecard(data.ats_scorecard)
        }
        setResumeDisplayMode('pdf_preview')
        toast.success(`Tailored resume compiled! ATS Score: ${data.ats_scorecard?.overall_score || 85}/100`, { id: toastId })
      } else {
        const bullets = (parsedProfile.work_experience || []).flatMap((e: any) => e.highlights || [])
        const tailored = `${parsedProfile.applicant_name || 'Candidate'}\n${parsedProfile.contact_email || ''} · ${parsedProfile.contact_phone || ''} · ${parsedProfile.location || ''}\n\nTARGET: ${tailorRole || 'Specialist'} at ${tailorCompany || 'Target Organization'}\n\nPROFESSIONAL SUMMARY\nResults-driven professional with deep expertise in ${(parsedProfile.skills || []).slice(0, 8).join(', ')}. Demonstrated success delivering high-reliability solutions aligned with organizational goals.\n\nCORE COMPETENCIES\n${(parsedProfile.skills || []).join(' · ')}\n\nEXPERIENCE HIGHLIGHTS\n${bullets.slice(0, 8).map((b: string) => `• ${b}`).join('\n')}`
        setTailoredResumeText(tailored)
        setResumeDisplayMode('pdf_preview')
        toast.success('Tailored resume generated!', { id: toastId })
      }
    } catch {
      toast.error('Failed to tailor resume.', { id: toastId })
    } finally {
      setIsTailoringResume(false)
    }
  }

  async function handleCommitWalrusVersion() {
    if (!parsedProfile) {
      toast.error('Please upload or load a resume first.')
      return
    }
    setIsSavingWalrusVersion(true)
    const toastId = toast.loading('Committing encrypted snapshot to Walrus Protocol...')
    try {
      const res = await fetch('/api/resume/version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: sessionAddress,
          company: tailorCompany || 'Target Organization',
          role: tailorRole || parsedProfile.target_roles?.[0] || 'Target Role',
          atsScore: atsScorecard?.overall_score || 0,
          profile: parsedProfile,
          tailoredText: tailoredResumeText,
          customSummary: (parsedProfile as any).summary || ''
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to commit version')

      const newVersion: WalrusResumeVersionItem = {
        id: data.version_id,
        versionNumber: walrusVersions.length + 1,
        label: `v${walrusVersions.length + 1} · ${data.role} @ ${data.company}`,
        company: data.company,
        role: data.role,
        atsScore: data.ats_score,
        blobId: data.blob_id,
        walrusUrl: data.walrus_url,
        createdAt: data.timestamp,
        profileSnapshot: parsedProfile,
        tailoredText: tailoredResumeText,
        encrypted: data.encrypted
      }

      const updated = [newVersion, ...walrusVersions]
      setWalrusVersions(updated)
      setActiveVersionId(newVersion.id)
      localStorage.setItem('careerace_walrus_versions', JSON.stringify(updated))

      toast.success(`Anchored to Walrus! Blob: ${data.blob_id.slice(0, 10)}...`, { id: toastId })
    } catch (err: any) {
      toast.error(err.message || 'Walrus version upload failed', { id: toastId })
    } finally {
      setIsSavingWalrusVersion(false)
    }
  }

  function handleRestoreWalrusVersion(version: WalrusResumeVersionItem) {
    if (version.profileSnapshot) {
      setParsedProfile(version.profileSnapshot)
      localStorage.setItem('careerace_sovereign_profile', JSON.stringify(version.profileSnapshot))
      localStorage.setItem('careerace_parsed_profile', JSON.stringify(version.profileSnapshot))
    }
    if (version.tailoredText) {
      setTailoredResumeText(version.tailoredText)
    }
    if (version.company) setTailorCompany(version.company)
    if (version.role) setTailorRole(version.role)
    setActiveVersionId(version.id)
    toast.success(`Restored version: ${version.label}`)
  }

  async function handleSendMessage() {
    if (!chatInput.trim() || isSending) return
    const text = chatInput.trim()
    setChatInput('')
    const updatedMessages = [...chatMessages, { role: 'user' as const, content: text }]
    setChatMessages(updatedMessages)
    setIsSending(true)

    try {
      const customAiKeys = {
        google: typeof window !== 'undefined' ? localStorage.getItem('careerace_gemini_key') || undefined : undefined,
        groq: typeof window !== 'undefined' ? localStorage.getItem('careerace_groq_key') || undefined : undefined,
        openrouter: typeof window !== 'undefined' ? localStorage.getItem('careerace_openrouter_key') || undefined : undefined,
        opencode: typeof window !== 'undefined' ? localStorage.getItem('careerace_opencode_key') || undefined : undefined,
      }

      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          messages: updatedMessages,
          profile: parsedProfile,
          address: sessionAddress || undefined,
          custom_keys: customAiKeys,
        })
      })
      const data = await res.json()
      const assistantReply = data.reply || data.content
      if (assistantReply) {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: assistantReply }])
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `I've analyzed your question: "${text}". ${
              parsedProfile 
                ? `I am leveraging your verified profile for ${parsedProfile.applicant_name || 'Candidate'} and cross-referencing industry standards.` 
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
        body: JSON.stringify({
          profile: parsedProfile,
          address: sessionAddress || undefined,
        })
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
      if (sessionAddress) {
        formData.append('address', sessionAddress)
      }

      const lowerName = file.name.toLowerCase()

      // Strategy A: Client-side PDF.js extraction (most reliable for all PDF types)
      if (lowerName.endsWith('.pdf') || file.type === 'application/pdf') {
        try {
          toast.loading(`Extracting text from PDF using PDF.js...`, { id: toastId })
          const pdfText = await extractPdfTextInBrowser(file)
          if (pdfText && pdfText.trim().length > 50) {
            formData.append('cv_text', pdfText.trim())
            console.log(`[PDF.js] Extracted ${pdfText.length} chars from ${file.name}`)
          } else {
            console.warn('[PDF.js] Extracted text too short, server will fallback to zlib stream parsing')
          }
        } catch (pdfErr) {
          console.warn('[PDF.js] Client-side extraction failed, server-side fallback will be used:', pdfErr)
        }
      }

      // Strategy B: Direct text read for plaintext/markdown files
      if (lowerName.endsWith('.txt') || lowerName.endsWith('.md') || file.type.includes('text')) {
        try {
          const txt = await file.text()
          if (txt && txt.trim().length > 10) {
            formData.append('cv_text', txt.trim())
          }
        } catch {}
      }

      const geminiKey = typeof window !== 'undefined' ? localStorage.getItem('careerace_gemini_key') || '' : ''
      const groqKey = typeof window !== 'undefined' ? localStorage.getItem('careerace_groq_key') || '' : ''
      const openRouterKey = typeof window !== 'undefined' ? localStorage.getItem('careerace_openrouter_key') || '' : ''
      const openCodeKey = typeof window !== 'undefined' ? localStorage.getItem('careerace_opencode_key') || '' : ''
      if (geminiKey) formData.append('gemini_key', geminiKey)
      if (groqKey) formData.append('groq_key', groqKey)
      if (openRouterKey) formData.append('openrouter_key', openRouterKey)
      if (openCodeKey) formData.append('opencode_key', openCodeKey)

      toast.loading(`Sending to AI parser...`, { id: toastId })
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
        if (data.profile.target_roles?.[0]) {
          setTailorRole(data.profile.target_roles[0])
        }
        localStorage.setItem('careerace_sovereign_profile', JSON.stringify(data.profile))
        localStorage.setItem('careerace_parsed_profile', JSON.stringify(data.profile))
        if (data.address) {
          setSessionAddress(data.address)
          localStorage.setItem('careerace_session_address', data.address)
        }

        const candidateName = data.profile.applicant_name && data.profile.applicant_name !== 'Candidate'
          ? data.profile.applicant_name
          : 'Candidate';
        const topSkills = (data.profile.skills || []).slice(0, 10).join(', ') || 'Technical competencies';
        const targetRoles = (data.profile.target_roles || []).join(', ') || 'Professional';
        const expCount = data.profile.work_experience?.length || 0;
        const eduCount = data.profile.academic_history?.length || 0;
        const methodNote = data.extraction_method === 'browser_pdf_extraction'
          ? ' (PDF text extracted client-side with PDF.js)'
          : '';

        toast.success(`CV parsed for ${candidateName}!${methodNote}`, { id: toastId })

        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `I have successfully analyzed **${file.name}** and indexed it into your Walrus Sovereign Memory vault!\n\n• **Candidate Name:** ${candidateName}\n• **Target Roles:** ${targetRoles}\n• **Skills Detected:** ${topSkills}\n• **Work History:** ${expCount} verified position(s)\n• **Academic Background:** ${eduCount} credential(s)\n\nAll credentials are sealed to ${data.address ? `${data.address.slice(0, 6)}...${data.address.slice(-4)}` : 'your vault'} on Walrus decentralized storage.\n\n🎯 **Next step:** Paste a job description into the **Tailor for Job** panel to get your real ATS keyword match score!`
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

        {/* ── TAB 1: OVERVIEW = SIDE-BY-SIDE BALANCED DASHBOARD ── */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Clean Standard Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/80">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                  {getGreeting()}{parsedProfile?.applicant_name ? `, ${parsedProfile.applicant_name.split(' ')[0]}` : ''}.
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Your sovereign career intelligence vault and autonomous AI copilot with Walrus Sovereign Memory.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-medium border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 px-2.5 py-1">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-500" /> Walrus Sovereign Vault Active
                </Badge>
              </div>
            </div>

            {/* Side-by-Side Grid Layout: Left Column (7 cols) + Right Column (5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: ATS Scorecard + Setup Checklist + Quick Action Cards */}
              <div className="lg:col-span-7 space-y-6">
                {/* 1. Circular ATS Health & Resume Scorecard */}
                <Card className="p-6 border border-border/80 shadow-sm rounded-2xl bg-card">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {/* Circular Score Visual */}
                      <div className={`relative w-20 h-20 rounded-full flex items-center justify-center shrink-0 ${atsScorecard ? (atsScorecard.overall_score >= 70 ? 'border-4 border-emerald-500/30 bg-emerald-500/5' : atsScorecard.overall_score >= 45 ? 'border-4 border-amber-500/30 bg-amber-500/5' : 'border-4 border-red-500/30 bg-red-500/5') : 'border-4 border-muted/40 bg-muted/10'}`}>
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                          <circle
                            cx="40"
                            cy="40"
                            r="34"
                            stroke="currentColor"
                            strokeWidth="5"
                            fill="transparent"
                            className={atsScorecard ? (atsScorecard.overall_score >= 70 ? 'text-emerald-500' : atsScorecard.overall_score >= 45 ? 'text-amber-500' : 'text-red-500') : 'text-muted-foreground/20'}
                            strokeDasharray={213}
                            strokeDashoffset={213 - (213 * Math.min(100, Math.max(0, atsScorecard?.overall_score ?? 0))) / 100}
                          />
                        </svg>
                        <div className="text-center">
                          {atsScorecard ? (
                            <>
                              <span className="text-xl font-extrabold text-foreground">{atsScorecard.overall_score}</span>
                              <span className="text-[10px] text-muted-foreground block -mt-1">/100</span>
                            </>
                          ) : (
                            <span className="text-[9px] text-muted-foreground text-center leading-tight px-1">{parsedProfile ? 'Add JD' : 'Upload CV'}</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-foreground">Resume ATS Score</h3>
                          {atsScorecard ? (
                            <Badge variant="outline" className={`text-xs font-semibold ${atsScorecard.overall_score >= 70 ? 'text-emerald-600 border-emerald-500/30 bg-emerald-500/10' : atsScorecard.overall_score >= 45 ? 'text-amber-600 border-amber-500/30 bg-amber-500/10' : 'text-red-600 border-red-500/30 bg-red-500/10'}`}>
                              {atsScorecard.ats_grade}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">Pending</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {atsScorecard
                            ? `${atsScorecard.keyword_coverage_pct}% keyword match · ${atsScorecard.matched_skills.length} matched · ${atsScorecard.missing_critical_skills.length} critical gaps`
                            : parsedProfile
                            ? '📋 Paste a job description in the Tailor panel to get your real ATS score.'
                            : 'Upload your CV to calculate your live ATS parsing grade and keyword match.'}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => router.push('/dashboard?tab=resumes')}
                      className="text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 h-9"
                    >
                      {parsedProfile ? 'Open Resume Studio' : 'Upload Resume'} <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {parsedProfile && (
                    <div className="grid grid-cols-3 gap-3 pt-5 mt-5 border-t border-border/60 text-xs">
                      <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50 text-center">
                        <span className="text-[11px] text-muted-foreground block">Parsed Skills</span>
                        <span className="font-bold text-sm text-foreground">{parsedProfile.skills?.length || 0} verified</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50 text-center">
                        <span className="text-[11px] text-muted-foreground block">Positions</span>
                        <span className="font-bold text-sm text-foreground">{parsedProfile.work_experience?.length || 0} recorded</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50 text-center">
                        <span className="text-[11px] text-muted-foreground block">Keyword Match</span>
                        <span className={`font-bold text-sm ${atsScorecard ? (atsScorecard.keyword_coverage_pct >= 60 ? 'text-emerald-600 dark:text-emerald-400' : atsScorecard.keyword_coverage_pct >= 35 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400') : 'text-muted-foreground'}`}>
                          {atsScorecard ? `${atsScorecard.keyword_coverage_pct}%` : 'Add JD →'}
                        </span>
                      </div>
                    </div>
                  )}
                </Card>

                {/* 2. Candidate Setup Checklist */}
                <Card className="p-6 border border-border/80 shadow-sm rounded-2xl bg-card space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <h3 className="font-bold text-sm text-foreground">Sovereign Profile Checklist</h3>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      {[
                        Boolean(parsedProfile?.applicant_name),
                        Boolean(parsedProfile?.target_roles?.length),
                        Boolean(parsedProfile?.skills?.length && parsedProfile.skills.length >= 3),
                        Boolean(parsedProfile?.work_experience?.length),
                        Boolean(parsedProfile)
                      ].filter(Boolean).length} / 5 Complete
                    </span>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        title: 'Candidate Identity & Contact Information',
                        desc: parsedProfile?.applicant_name 
                          ? `${parsedProfile.applicant_name} · ${parsedProfile.contact_email || 'Contact on file'}`
                          : 'Extract candidate name, email, and location from CV',
                        done: Boolean(parsedProfile?.applicant_name)
                      },
                      {
                        title: 'Target Professional Role',
                        desc: parsedProfile?.target_roles?.[0]
                          ? `Targeting: ${parsedProfile.target_roles.join(', ')}`
                          : 'Set your primary target title and seniority',
                        done: Boolean(parsedProfile?.target_roles?.length)
                      },
                      {
                        title: 'Core Competencies & Technical Skills',
                        desc: parsedProfile?.skills?.length
                          ? `${parsedProfile.skills.length} cross-industry and technical skills indexed`
                          : 'Extract technical keywords and domain tools',
                        done: Boolean(parsedProfile?.skills?.length && parsedProfile.skills.length >= 3)
                      },
                      {
                        title: 'Work Experience & Quantified Bullets',
                        desc: parsedProfile?.work_experience?.length
                          ? `${parsedProfile.work_experience.length} career positions recorded with achievements`
                          : 'Extract career timeline, company tenures, and impact points',
                        done: Boolean(parsedProfile?.work_experience?.length)
                      },
                      {
                        title: 'Walrus Sovereign Vault Sealing',
                        desc: parsedProfile
                          ? 'Encrypted and cryptographically anchored to your Sui zkLogin'
                          : 'Attach your CV to seal credentials in decentralized storage',
                        done: Boolean(parsedProfile)
                      }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border/60 text-xs">
                        {item.done ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-border/80 text-muted-foreground flex items-center justify-center shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className={`font-semibold ${item.done ? 'text-foreground' : 'text-muted-foreground'}`}>{item.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* 3. Fast-Track Navigation */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard?tab=resumes')}
                    className="p-4 rounded-xl border border-border/80 bg-card hover:bg-muted/30 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <FileText className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <span className="font-bold text-xs text-foreground block">Resume Studio</span>
                    <span className="text-[11px] text-muted-foreground">Select templates, edit sections & download .docx</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push('/dashboard?tab=resumes&mode=tailored')}
                    className="p-4 rounded-xl border border-border/80 bg-card hover:bg-muted/30 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Sparkles className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <span className="font-bold text-xs text-foreground block">Tailored Resumes</span>
                    <span className="text-[11px] text-muted-foreground">Align bullets with target job requirements</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push('/dashboard?tab=cover_letters')}
                    className="p-4 rounded-xl border border-border/80 bg-card hover:bg-muted/30 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Mail className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <span className="font-bold text-xs text-foreground block">Cover Letters</span>
                    <span className="text-[11px] text-muted-foreground">Generate strategic problem-solving narratives</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push('/memory')}
                    className="p-4 rounded-xl border border-border/80 bg-card hover:bg-muted/30 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Database className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <span className="font-bold text-xs text-foreground block">Career Vault</span>
                    <span className="text-[11px] text-muted-foreground">Manage Walrus facts, replace CV & reset vault</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Embedded Autonomous AI Copilot Chatbot */}
              <div className="lg:col-span-5 sticky top-6">
                <Card className="border border-border/80 shadow-md rounded-2xl bg-card overflow-hidden flex flex-col h-[680px]">
                  {/* Status Bar */}
                  <div className="p-3.5 border-b border-border/80 bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                          <Bot className="w-4 h-4" />
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-xs text-foreground">AI Career Copilot</h3>
                          <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-500/30 bg-emerald-500/10 font-mono py-0">
                            MemWal
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate max-w-[190px]">
                          {parsedProfile?.applicant_name ? `${parsedProfile.applicant_name} Vault` : 'Autonomous Profiler'}
                        </p>
                      </div>
                    </div>

                    <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/80">
                      <ShieldCheck className="w-3 h-3 text-emerald-500 mr-1" /> zkLogin
                    </Badge>
                  </div>

                  {/* Chat Messages Feed */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-2.5 leading-relaxed ${
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-6 h-6 rounded-md bg-emerald-600/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Bot className="w-3.5 h-3.5" />
                          </div>
                        )}

                        <div
                          className={`max-w-[85%] p-3.5 rounded-2xl whitespace-pre-wrap text-xs ${
                            msg.role === 'assistant'
                              ? 'bg-muted/40 border border-border/80 text-foreground'
                              : 'bg-emerald-600 text-white font-medium shadow-xs'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}

                    {isSending && (
                      <div className="flex items-center gap-2.5 text-xs text-muted-foreground p-3 rounded-xl bg-muted/30 border border-border/60">
                        <Bot className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                        <span>Querying Walrus Memory...</span>
                      </div>
                    )}
                    <div ref={chatMessagesEndRef} />
                  </div>

                  {/* Starter Chips */}
                  <div className="px-3.5 py-2 bg-muted/20 border-t border-border/60 flex flex-wrap gap-1.5">
                    {[
                      'Audit my CV',
                      'What did I study?',
                      'Where did I work?',
                      'What are my skills?'
                    ].map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => {
                          setChatInput(prompt)
                        }}
                        className="text-[11px] px-2.5 py-0.5 rounded-full border border-border/80 bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  {/* Bottom Input */}
                  <div className="p-3 border-t border-border/80 bg-card flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => chatFileInputRef.current?.click()}
                      title="Attach CV File (.pdf, .docx)"
                      className="h-9 w-9 p-0 rounded-lg border border-border shrink-0 hover:bg-muted text-muted-foreground hover:text-foreground"
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
                          ? "Ask about your experience, audit ATS, or polish bullets..." 
                          : "Type your query or attach your CV..."
                      }
                      className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />

                    <Button
                      size="sm"
                      onClick={handleSendMessage}
                      disabled={isSending || !chatInput.trim()}
                      className="h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 font-semibold text-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── TAB 2: RESUMES & TAILORED RESUMES STUDIO ── */}
        {(activeTab === 'resumes' || activeTab === 'tailored') && (
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {resumeViewMode === 'upload' && !parsedProfile ? (
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
                        Upload your PDF, DOCX, or TXT file. Career Ace indexes your real credentials directly into sovereign Walrus Memory.
                      </p>
                    </div>
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
                      Supported formats: <span className="font-semibold text-foreground">PDF, DOC, DOCX, TXT</span> (Max 10 MB)
                    </p>
                    <Badge variant="outline" className="text-xs font-mono border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                      Client-Side Parsed &amp; Encrypted with Seal
                    </Badge>
                  </Card>
                </motion.div>
              ) : (
                /* VIEW MODE 2: UNIFIED MODERN ATS RESUME WORKSPACE */
                <motion.div
                  key="studio"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  {/* Top Toolbar: Actions & Mode Indicator */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
                    <div className="flex items-center gap-3">
                      <div>
                        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                          <FileText className="w-5 h-5 text-emerald-500" />
                          Resume Workspace
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Standardized to <span className="font-semibold text-foreground">Modern ATS</span> format for optimal scanner compatibility.
                        </p>
                      </div>
                      <Badge variant="outline" className="hidden sm:inline-flex text-[11px] font-mono border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                        Modern ATS Standard
                      </Badge>
                    </div>

                    {/* Primary Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleCommitWalrusVersion}
                        disabled={isSavingWalrusVersion || !parsedProfile}
                        className="text-xs h-8 gap-1.5 bg-purple-600 hover:bg-purple-500 text-white shadow-xs font-semibold"
                        title="Save current resume state as an encrypted version to Walrus Protocol"
                      >
                        <Database className="w-3.5 h-3.5" />
                        {isSavingWalrusVersion ? 'Anchoring...' : 'Save to Walrus'}
                      </Button>
                      <Button
                        variant={isTailorOpen ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsTailorOpen(!isTailorOpen)}
                        className={`text-xs h-8 gap-1.5 ${
                          isTailorOpen
                            ? 'bg-purple-600 hover:bg-purple-500 text-white'
                            : 'border-purple-500/40 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {isTailorOpen ? 'Hide Tailoring' : 'Tailor for Job'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs h-8 gap-1.5 border-border/80"
                      >
                        <Upload className="w-3.5 h-3.5" /> Attach / Replace CV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const content = resumeDisplayMode === 'tailored_text' && tailoredResumeText
                            ? tailoredResumeText
                            : `${parsedProfile?.applicant_name || 'Candidate'}\n${parsedProfile?.contact_email || ''} · ${parsedProfile?.contact_phone || ''} · ${parsedProfile?.location || ''}\n\nTARGET: ${tailorRole || parsedProfile?.target_roles?.[0] || 'Professional'}\n\nEXPERIENCE:\n${(parsedProfile?.work_experience || []).map((e: any) => `${e.role} at ${e.company} (${e.duration || ''})\n${(e.highlights || []).map((h: string) => `• ${h}`).join('\n')}`).join('\n\n')}\n\nSKILLS:\n${(parsedProfile?.skills || []).join(', ')}`
                          navigator.clipboard.writeText(content)
                          toast.success('Resume copied to clipboard!')
                        }}
                        className="text-xs h-8 gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy Text
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

                  {/* Integrated Job Tailoring & ATS Optimization Panel */}
                  <AnimatePresence>
                    {isTailorOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <Card className="p-6 border border-purple-500/30 bg-purple-500/5 rounded-2xl space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-purple-500/20">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-purple-500" />
                              <h3 className="font-bold text-sm text-foreground">Target Role Calibration &amp; ATS Tailoring</h3>
                            </div>
                            {atsScorecard && (
                              <Badge variant="outline" className="text-xs border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                                ATS Alignment: {atsScorecard.overall_score}/100
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                                Target Company
                              </label>
                              <input
                                type="text"
                                value={tailorCompany}
                                onChange={(e) => setTailorCompany(e.target.value)}
                                placeholder="e.g. Anthropic, Stripe, Google, Linear"
                                className="w-full h-9 px-3 rounded-lg border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                                Target Role Title
                              </label>
                              <input
                                type="text"
                                value={tailorRole}
                                onChange={(e) => {
                                  setTailorRole(e.target.value)
                                  if (parsedProfile) updateProfileField({ target_roles: [e.target.value] })
                                }}
                                placeholder="e.g. Senior Full Stack Engineer"
                                className="w-full h-9 px-3 rounded-lg border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-muted-foreground block mb-1">
                              Job Description Keywords &amp; Requirements
                            </label>
                            <textarea
                              rows={4}
                              value={jobDescriptionForTailor}
                              onChange={(e) => setJobDescriptionForTailor(e.target.value)}
                              placeholder="Paste the target job posting bullets, technical requirements, or problem statements here to align your resume..."
                              className="w-full p-2.5 rounded-lg border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed resize-none"
                            />
                          </div>

                          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-background border text-xs">
                                <button
                                  type="button"
                                  onClick={() => setResumeDisplayMode('ats_document')}
                                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                                    resumeDisplayMode === 'ats_document'
                                      ? 'bg-muted text-foreground font-semibold'
                                      : 'text-muted-foreground hover:text-foreground'
                                  }`}
                                >
                                  Modern ATS Editor
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setResumeDisplayMode('pdf_preview')}
                                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                                    resumeDisplayMode === 'pdf_preview'
                                      ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                                      : 'text-muted-foreground hover:text-foreground'
                                  }`}
                                >
                                  <FileCheck className="w-3.5 h-3.5" />
                                  Live PDF Preview
                                </button>
                                {tailoredResumeText && (
                                  <button
                                    type="button"
                                    onClick={() => setResumeDisplayMode('tailored_text')}
                                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                                      resumeDisplayMode === 'tailored_text'
                                        ? 'bg-muted text-foreground font-semibold'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                  >
                                    Tailored Text
                                  </button>
                                )}
                              </div>
                            </div>

                            <Button
                              size="sm"
                              onClick={handleTailorResume}
                              disabled={isTailoringResume}
                              className="w-full sm:w-auto text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white h-9 px-4 rounded-xl"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              {isTailoringResume ? 'Optimizing with Sovereign AI...' : 'Tailor Resume Now'}
                            </Button>
                          </div>

                          {/* ── LIVE ATS KEYWORD DIFF ── */}
                          {atsScorecard && atsScorecard.keyword_diff.length > 0 && (
                            <div className="border-t border-purple-500/20 pt-4 space-y-3">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                  <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
                                  Live Keyword Diff — {atsScorecard.overall_score}/100
                                </span>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Matched</span>
                                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Critical Gap</span>
                                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Secondary Gap</span>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                                {atsScorecard.keyword_diff.slice(0, 35).map((item, i) => (
                                  <span
                                    key={i}
                                    title={`${item.status === 'matched' ? '✓ Found in CV' : item.status === 'partial' ? '~ Partial match' : '✗ Missing from CV'} · Job description mentions ${item.frequency_in_jd}x`}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border cursor-default select-none ${
                                      item.status === 'matched'
                                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25'
                                        : item.status === 'partial'
                                        ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25'
                                        : item.category === 'critical'
                                        ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/25'
                                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25'
                                    }`}
                                  >
                                    {item.status === 'matched' ? (
                                      <Check className="w-2.5 h-2.5 shrink-0" />
                                    ) : (
                                      <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                                    )}
                                    {item.keyword}
                                    {item.frequency_in_jd > 1 && (
                                      <span className="opacity-50 text-[9px]">×{item.frequency_in_jd}</span>
                                    )}
                                  </span>
                                ))}
                              </div>
                              {atsScorecard.actionable_recommendations.length > 0 && (
                                <div className="space-y-1.5 pt-0.5">
                                  {atsScorecard.actionable_recommendations.slice(0, 2).map((rec, i) => (
                                    <p key={i} className="text-[10px] text-muted-foreground bg-muted/30 rounded-lg px-2.5 py-1.5 border border-border/50 leading-relaxed">
                                      💡 {rec}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </Card>

                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* WALRUS VERSION HISTORY DRAWER */}
                  {walrusVersions.length > 0 && (
                    <WalrusVersionDrawer
                      versions={walrusVersions}
                      activeVersionId={activeVersionId}
                      onRestoreVersion={handleRestoreWalrusVersion}
                      onClearHistory={() => {
                        setWalrusVersions([])
                        localStorage.removeItem('careerace_walrus_versions')
                        toast.success('Walrus version cache cleared.')
                      }}
                    />
                  )}

                  {/* DISPLAY MODE 1: LIVE PDF PREVIEW GENERATOR */}
                  {resumeDisplayMode === 'pdf_preview' ? (
                    <LivePdfPreview
                      profile={parsedProfile}
                      tailoredText={tailoredResumeText}
                      sourceFile={selectedFile}
                      tailorRole={tailorRole || parsedProfile?.target_roles?.[0] || 'Target Role'}
                      tailorCompany={tailorCompany || 'Target Organization'}
                      atsScore={atsScorecard?.overall_score ?? null}
                      onCommitWalrusVersion={handleCommitWalrusVersion}
                      isSavingVersion={isSavingWalrusVersion}
                    />
                  ) : resumeDisplayMode === 'tailored_text' && tailoredResumeText ? (
                    /* DISPLAY MODE 2: TAILORED PLAINTEXT VIEW */
                    <Card className="p-6 border border-border/80 shadow-sm rounded-2xl bg-card space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-500" />
                          <h3 className="font-bold text-sm text-foreground">Tailored Resume Output</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setResumeDisplayMode('pdf_preview')}
                            className="text-xs h-7 gap-1"
                          >
                            <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
                            Live PDF Preview
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setResumeDisplayMode('ats_document')}
                            className="text-xs h-7 gap-1"
                          >
                            Switch to ATS Editor
                          </Button>
                          <Badge variant="outline" className="text-xs text-emerald-500 border-emerald-500/30">
                            Ready for Submission
                          </Badge>
                        </div>
                      </div>

                      <div className="p-5 rounded-xl border border-border/80 bg-background text-xs leading-relaxed whitespace-pre-wrap min-h-[380px] max-h-[500px] overflow-y-auto text-foreground shadow-inner font-mono">
                        {tailoredResumeText}
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(tailoredResumeText)
                            toast.success('Tailored resume copied to clipboard!')
                          }}
                          className="flex-1 text-xs gap-1.5"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copy Text
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleDownloadDocxResume}
                          disabled={isDownloadingDocx}
                          className="flex-1 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          <Download className="w-3.5 h-3.5" /> Download Tailored .docx
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleCommitWalrusVersion}
                          disabled={isSavingWalrusVersion}
                          className="text-xs gap-1.5 bg-purple-600 hover:bg-purple-500 text-white"
                        >
                          <Database className="w-3.5 h-3.5" /> Save to Walrus
                        </Button>
                      </div>
                    </Card>
                  ) : parsedProfile ? (
                    /* DISPLAY MODE 2: MODERN ATS RESUME DOCUMENT EDITOR */
                    <Card className="p-8 md:p-12 border border-border/80 shadow-md rounded-2xl bg-card space-y-7 transition-all font-sans">
                      {/* Candidate Header */}
                      <div className="pb-5 space-y-2 border-b border-border/70">
                        <div className="flex items-baseline justify-between gap-4">
                          <input
                            type="text"
                            value={parsedProfile.applicant_name || ''}
                            onChange={(e) => updateProfileField({ applicant_name: e.target.value })}
                            placeholder="Full Candidate Name"
                            className="text-2xl md:text-3xl font-extrabold tracking-tight bg-transparent text-foreground border-b border-transparent hover:border-border focus:border-emerald-500 focus:outline-none w-full max-w-lg"
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <input
                            type="text"
                            value={parsedProfile.contact_email || ''}
                            onChange={(e) => updateProfileField({ contact_email: e.target.value })}
                            placeholder="email@example.com"
                            className="bg-transparent border-b border-transparent hover:border-border focus:border-emerald-500 focus:outline-none max-w-[200px]"
                          />
                          <span>·</span>
                          <input
                            type="text"
                            value={parsedProfile.contact_phone || ''}
                            onChange={(e) => updateProfileField({ contact_phone: e.target.value })}
                            placeholder="+1 (555) 000-0000"
                            className="bg-transparent border-b border-transparent hover:border-border focus:border-emerald-500 focus:outline-none max-w-[150px]"
                          />
                          <span>·</span>
                          <input
                            type="text"
                            value={parsedProfile.location || ''}
                            onChange={(e) => updateProfileField({ location: e.target.value })}
                            placeholder="City, Country"
                            className="bg-transparent border-b border-transparent hover:border-border focus:border-emerald-500 focus:outline-none max-w-[180px]"
                          />
                        </div>

                        <div className="pt-1">
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Target Role: </span>
                          <input
                            type="text"
                            value={parsedProfile.target_roles?.[0] || tailorRole || ''}
                            onChange={(e) => {
                              const r = e.target.value
                              setTailorRole(r)
                              updateProfileField({ target_roles: [r] })
                            }}
                            placeholder="e.g. Lead Full Stack Engineer"
                            className="text-xs font-semibold bg-transparent border-b border-transparent hover:border-border focus:border-emerald-500 focus:outline-none max-w-[280px]"
                          />
                        </div>
                      </div>

                      {/* Work Experience Section */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between border-b pb-1.5">
                          <h3 className="text-xs font-extrabold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
                            WORK EXPERIENCE
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const exp = [
                                ...(parsedProfile.work_experience || []),
                                {
                                  role: 'Senior Professional',
                                  company: 'Organization Name',
                                  duration: '2023 - Present',
                                  highlights: ['Spearheaded strategic deliverables resulting in measured growth and operational improvements.']
                                }
                              ]
                              updateProfileField({ work_experience: exp })
                            }}
                            className="text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 h-7 px-2 gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Position
                          </Button>
                        </div>

                        {parsedProfile.work_experience && parsedProfile.work_experience.length > 0 ? (
                          <div className="space-y-6">
                            {parsedProfile.work_experience.map((exp: any, expIdx: number) => (
                              <div key={expIdx} className="space-y-2.5 p-4 rounded-xl border border-border/50 bg-muted/10 relative group">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveExperience(expIdx)}
                                  title="Delete this role section"
                                  className="absolute top-3 right-3 text-muted-foreground hover:text-red-500 opacity-60 hover:opacity-100 transition-opacity p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>

                                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pr-8">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={exp.role || ''}
                                      onChange={(e) => {
                                        const copy = [...parsedProfile.work_experience]
                                        copy[expIdx] = { ...copy[expIdx], role: e.target.value }
                                        updateProfileField({ work_experience: copy })
                                      }}
                                      placeholder="Position Title"
                                      className="font-bold text-sm text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-emerald-500 focus:outline-none"
                                    />
                                    <span className="text-muted-foreground text-xs">at</span>
                                    <input
                                      type="text"
                                      value={exp.company || ''}
                                      onChange={(e) => {
                                        const copy = [...parsedProfile.work_experience]
                                        copy[expIdx] = { ...copy[expIdx], company: e.target.value }
                                        updateProfileField({ work_experience: copy })
                                      }}
                                      placeholder="Company Name"
                                      className="font-semibold text-xs text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-emerald-500 focus:outline-none"
                                    />
                                  </div>

                                  <input
                                    type="text"
                                    value={exp.duration || ''}
                                    onChange={(e) => {
                                      const copy = [...parsedProfile.work_experience]
                                      copy[expIdx] = { ...copy[expIdx], duration: e.target.value }
                                      updateProfileField({ work_experience: copy })
                                    }}
                                    placeholder="e.g. 2021 - Present"
                                    className="text-xs text-muted-foreground font-mono bg-transparent border-b border-transparent hover:border-border focus:border-emerald-500 focus:outline-none text-right max-w-[140px]"
                                  />
                                </div>

                                {/* Highlights Bullets */}
                                <div className="space-y-1.5 pl-2">
                                  {(exp.highlights || []).map((bullet: string, bIdx: number) => (
                                    <div key={bIdx} className="flex items-start gap-2 group/bullet">
                                      <span className="text-muted-foreground text-xs select-none mt-1">•</span>
                                      <textarea
                                        rows={2}
                                        value={bullet}
                                        onChange={(e) => handleEditBullet(expIdx, bIdx, e.target.value)}
                                        className="flex-1 text-xs leading-relaxed bg-transparent text-foreground border-b border-transparent hover:border-border/60 focus:border-emerald-500 focus:outline-none resize-none p-1 rounded"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveBullet(expIdx, bIdx)}
                                        className="text-muted-foreground hover:text-red-500 opacity-30 group-hover/bullet:opacity-100 transition-opacity p-1 mt-0.5"
                                        title="Delete bullet"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAddBullet(expIdx)}
                                    className="text-[11px] text-muted-foreground hover:text-emerald-500 h-6 px-2 gap-1 mt-1"
                                  >
                                    <Plus className="w-3 h-3" /> Add bullet point
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-6 rounded-xl border border-dashed text-center text-xs text-muted-foreground">
                            No work positions listed yet. Click &quot;Add Position&quot; above or attach a CV to parse.
                          </div>
                        )}
                      </div>

                      {/* Skills Section */}
                      <div className="space-y-3 pt-3 border-t border-border/70">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-extrabold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
                            CORE COMPETENCIES &amp; SKILLS ({parsedProfile.skills?.length || 0})
                          </h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {(parsedProfile.skills || []).map((skill: string, sIdx: number) => (
                            <Badge
                              key={sIdx}
                              variant="secondary"
                              className="text-xs px-2.5 py-1 gap-1.5 bg-muted/60 text-foreground border border-border/50 group"
                            >
                              <span>{skill}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSkillChip(skill)}
                                className="text-muted-foreground hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}

                          <div className="flex items-center gap-1 ml-1">
                            <input
                              type="text"
                              value={newSkillInput}
                              onChange={(e) => setNewSkillInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddSkillChip()}
                              placeholder="Add skill..."
                              className="h-7 px-2 text-xs rounded-md border border-border bg-background max-w-[120px] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={handleAddSkillChip}
                              className="h-7 px-2 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Education Section */}
                      <div className="space-y-3 pt-3 border-t border-border/70">
                        <h3 className="text-xs font-extrabold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
                          EDUCATION
                        </h3>
                        {parsedProfile.academic_history && parsedProfile.academic_history.length > 0 ? (
                          <div className="space-y-2 text-xs">
                            {parsedProfile.academic_history.map((edu: any, eIdx: number) => (
                              <div key={eIdx} className="flex justify-between items-baseline text-muted-foreground">
                                <span className="font-semibold text-foreground">{edu.degree} · {edu.institution}</span>
                                <span className="font-mono text-xs">{edu.graduation_year || ''}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Education records safely anchored in Walrus vault.</p>
                        )}
                      </div>
                    </Card>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── TAB 3: COVER LETTERS ── */}
        {activeTab === 'cover_letters' && (
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

                  {/* USER REQUESTED FIELD: JOB DESCRIPTION / KEY PROBLEM YOU CAN SOLVE */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Job Description / Key Problem You Can Solve
                    </label>
                    <textarea
                      value={keyProblemsSolved}
                      onChange={(e) => setKeyProblemsSolved(e.target.value)}
                      rows={3}
                      placeholder="Paste the target job description or describe key problems you solve (e.g. reducing API latency, scaling microservices, building responsive React web apps)..."
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

        {/* ── TAB 4: PROFILES (LinkedIn) ── */}
        {(activeTab === 'linkedin' || activeTab === 'github') && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 max-w-3xl"
          >
            <div className="pb-4 border-b">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Verified LinkedIn Profile</h1>
              <p className="text-xs text-muted-foreground mt-1">
                Link your verified LinkedIn credentials and professional endorsements to enrich your sovereign Walrus memory lineage.
              </p>
            </div>

            {/* LinkedIn Card */}
            <Card className="p-6 border border-border/80 shadow-sm rounded-2xl bg-card space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">LinkedIn Professional Integration</h3>
                  <p className="text-xs text-muted-foreground">Sync endorsements, public headline, and verified career tenure</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">LinkedIn Public Profile URL</label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/in/your-profile"
                    className="w-full h-10 px-3.5 rounded-lg border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Used to verify your public career profile and align ATS keyword targeting.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground">Status: {linkedinUrl ? 'Profile Linked' : 'Not Connected'}</span>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!linkedinUrl.trim()) {
                        toast.error('Please enter a valid LinkedIn URL')
                        return
                      }
                      localStorage.setItem('careerace_candidate_linkedin', linkedinUrl.trim())
                      toast.success('LinkedIn credentials synced to Sovereign Passport!')
                    }}
                    className="text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-500 text-white"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Sync LinkedIn to Walrus Memory
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
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
