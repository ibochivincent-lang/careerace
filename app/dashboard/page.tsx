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
  TrendingUp, Target, AlertTriangle, FileCheck,
  RotateCcw, RotateCw, ArrowUp, ArrowDown, Layers, Anchor,
  Cpu, Flame, ChevronDown, ChevronUp, History,
  Globe, Loader2
} from 'lucide-react'
import { AtsXRayDialog } from '@/components/AtsXRayDialog'
import { AtsBenchmarkSimulatorModal } from '@/components/AtsBenchmarkSimulatorModal'
import { runAtsBenchmarkSimulator, type AtsBenchmarkReport } from '@/lib/ats_benchmark_simulator'
import { generateDocxBlob } from '@/lib/docx_exporter'
import { exportToJsonResume, importFromJsonResume } from '@/lib/json_resume'
import { analyzeAtsMatch, type AtsScorecard, type KeywordDiffItem } from '@/lib/ats_engine'
import { extractPdfTextInBrowser } from '@/lib/pdf_extract_browser'
import { parseCvText } from '@/lib/heuristic_cv_parser'
import { LivePdfPreview, isMaritimeCandidate } from '@/components/LivePdfPreview'
import { WalrusVersionModal } from '@/components/WalrusVersionModal'
import { WalrusVersionDrawer, type WalrusResumeVersionItem } from '@/components/WalrusVersionDrawer'
import { BulletWithActionVerbs } from '@/components/BulletWithActionVerbs'
import { MaritimeStcwVerifierModal } from '@/components/MaritimeStcwVerifierModal'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

const OVERVIEW_PROMPT_CHIPS = [
  'Audit my CV',
  'What did I study?',
  'Where did I work?',
  'What are my skills?',
  'Highlight my Sea-Time & STCW',
  'Suggest High-Impact Action Verbs'
]

function getBenchmarkJobDescription(targetRole: string, skills: string[] = []): string {
  const roleLower = (targetRole || '').toLowerCase()
  const isMarine =
    roleLower.includes('marine') ||
    roleLower.includes('naval') ||
    roleLower.includes('vessel') ||
    roleLower.includes('propulsion') ||
    roleLower.includes('offshore') ||
    roleLower.includes('subsea') ||
    roleLower.includes('ship') ||
    skills.some((s) => /marine|cad|stcw|naval|propulsion|power plant|ship/i.test(s))

  if (isMarine) {
    return `Seeking an experienced Marine Systems Engineer / Officer to oversee maritime vessel operations, propulsion machinery, auxiliary systems, and marine power plants. Key responsibilities include mechanical inspections, piping diagrams, hydraulic control systems, thermodynamics, fluid mechanics, CAD modeling (AutoCAD, SolidWorks, MATLAB), STCW safety compliance, and planned maintenance systems (PMS). Must possess strong troubleshooting capabilities, cross-functional communication, maritime safety certifications (SOLAS, MARPOL), and proven technical problem-solving on commercial or offshore vessels.`
  }

  return `Seeking a Software Engineer to design, architect, and ship high-reliability applications and cloud infrastructure. Responsibilities include developing responsive web interfaces, scalable backend REST/GraphQL APIs, microservices architectures, database schema design, and CI/CD automation pipelines. Proficiency required in modern languages (TypeScript, JavaScript, Python, Go, or Rust), modern frameworks (React, Next.js, Node.js), relational and distributed databases (PostgreSQL, Redis), Docker containerization, Git version control, and performance optimization.`
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
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [parsedProfile, setParsedProfile] = useState<any>(null)
  const [isSavingMemory, setIsSavingMemory] = useState(false)
  const [isClearingMemory, setIsClearingMemory] = useState(false)
  const [sessionAddress, setSessionAddress] = useState<string>('')

  // Undo / Redo History Stack
  const [undoStack, setUndoStack] = useState<any[]>([])
  const [redoStack, setRedoStack] = useState<any[]>([])

  // Section Ordering: Experience, Skills, Education, Certifications
  const [sectionOrder, setSectionOrder] = useState<Array<'experience' | 'skills' | 'education' | 'certifications'>>([
    'experience',
    'skills',
    'education',
    'certifications'
  ])

  // ATS X-Ray Full Diagnostic Dialog state
  const [isAtsXRayOpen, setIsAtsXRayOpen] = useState(false)

  // Automated Live ATS Benchmark Simulator state
  const [isBenchmarkModalOpen, setIsBenchmarkModalOpen] = useState(false)
  const [benchmarkReport, setBenchmarkReport] = useState<AtsBenchmarkReport | null>(null)

  function handleRunAtsBenchmark() {
    if (!parsedProfile) {
      toast.error('Please upload or initialize your resume first.')
      return
    }
    const effectiveRole = tailorRole || parsedProfile.target_roles?.[0] || 'Systems Engineer'
    const effectiveJd = (jobDescriptionForTailor && jobDescriptionForTailor.trim().length > 30)
      ? jobDescriptionForTailor
      : getBenchmarkJobDescription(effectiveRole, parsedProfile.skills)

    const report = runAtsBenchmarkSimulator({
      profile: parsedProfile,
      jobTitle: effectiveRole,
      jobCompany: tailorCompany || 'Target Organization',
      jobDescription: effectiveJd,
    })
    setBenchmarkReport(report)
    setIsBenchmarkModalOpen(true)
  }

  // Autonomous Maritime STCW & Sea-Time Verifier modal state
  const [isMaritimeModalOpen, setIsMaritimeModalOpen] = useState(false)
  const [isWalrusHistoryModalOpen, setIsWalrusHistoryModalOpen] = useState(false)
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false)

  // Dynamic Split Screen Resizing state (Left Canvas vs Right Copilot)
  const [splitRatio, setSplitRatio] = useState(65)
  const [isDraggingSplit, setIsDraggingSplit] = useState(false)
  const splitContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isDraggingSplit) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!splitContainerRef.current) return
      const rect = splitContainerRef.current.getBoundingClientRect()
      const relativeX = e.clientX - rect.left
      const newRatio = (relativeX / rect.width) * 100
      // Clamp between 45% and 80%
      setSplitRatio(Math.min(Math.max(newRatio, 45), 80))
    }

    const handleMouseUp = () => {
      setIsDraggingSplit(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDraggingSplit])

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
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; edits_added?: number }>>([
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
  const [jobUrlInput, setJobUrlInput] = useState('')
  const [isScrapingJobUrl, setIsScrapingJobUrl] = useState(false)

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

  // Calculate ATS scorecard: against custom JD if provided, or against standard industry benchmark JD for role.
  useEffect(() => {
    if (parsedProfile && parsedProfile.skills && parsedProfile.skills.length > 0) {
      const expText = (parsedProfile.work_experience || [])
        .map((w: any) => `${w.role} at ${w.company}: ${(w.highlights || []).join(' ')}`)
        .join(' ')
      const eduText = (parsedProfile.academic_history || [])
        .map((a: any) => `${a.degree} at ${a.institution}`)
        .join(' ')
      
      const effectiveRole = tailorRole || parsedProfile.target_roles?.[0] || 'Engineer'
      const effectiveJd = (jobDescriptionForTailor && jobDescriptionForTailor.trim().length > 30)
        ? jobDescriptionForTailor
        : getBenchmarkJobDescription(effectiveRole, parsedProfile.skills)

      const score = analyzeAtsMatch({
        jobTitle: effectiveRole,
        jobDescription: effectiveJd,
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
  }, [parsedProfile, tailorRole, jobDescriptionForTailor])

  function updateProfileField(updates: Partial<any>, recordHistory = true) {
    if (!parsedProfile) return
    if (recordHistory) {
      setUndoStack((prev) => [...prev.slice(-25), parsedProfile])
      setRedoStack([])
    }
    const next = { ...parsedProfile, ...updates }
    setParsedProfile(next)
    localStorage.setItem('careerace_sovereign_profile', JSON.stringify(next))
    localStorage.setItem('careerace_parsed_profile', JSON.stringify(next))
  }

  function handleUndo() {
    if (undoStack.length === 0) {
      toast.info('Nothing to undo')
      return
    }
    const prevProfile = undoStack[undoStack.length - 1]
    const newUndo = undoStack.slice(0, -1)
    if (parsedProfile) {
      setRedoStack((prev) => [...prev.slice(-25), parsedProfile])
    }
    setUndoStack(newUndo)
    setParsedProfile(prevProfile)
    localStorage.setItem('careerace_sovereign_profile', JSON.stringify(prevProfile))
    localStorage.setItem('careerace_parsed_profile', JSON.stringify(prevProfile))
    toast.success('Reverted last edit (Undo)')
  }

  function handleRedo() {
    if (redoStack.length === 0) {
      toast.info('Nothing to redo')
      return
    }
    const nextProfile = redoStack[redoStack.length - 1]
    const newRedo = redoStack.slice(0, -1)
    if (parsedProfile) {
      setUndoStack((prev) => [...prev.slice(-25), parsedProfile])
    }
    setRedoStack(newRedo)
    setParsedProfile(nextProfile)
    localStorage.setItem('careerace_sovereign_profile', JSON.stringify(nextProfile))
    localStorage.setItem('careerace_parsed_profile', JSON.stringify(nextProfile))
    toast.success('Redone')
  }

  function moveSectionUp(key: 'experience' | 'skills' | 'education' | 'certifications') {
    setSectionOrder((prev) => {
      const idx = prev.indexOf(key)
      if (idx <= 0) return prev
      const copy = [...prev]
      const temp = copy[idx - 1]
      copy[idx - 1] = copy[idx]
      copy[idx] = temp
      toast.success(`Moved ${key} section up`)
      return copy
    })
  }

  function moveSectionDown(key: 'experience' | 'skills' | 'education' | 'certifications') {
    setSectionOrder((prev) => {
      const idx = prev.indexOf(key)
      if (idx === -1 || idx >= prev.length - 1) return prev
      const copy = [...prev]
      const temp = copy[idx + 1]
      copy[idx + 1] = copy[idx]
      copy[idx] = temp
      toast.success(`Moved ${key} section down`)
      return copy
    })
  }

  const isCandidateMaritime = isMaritimeCandidate(parsedProfile, tailorRole)

  const SUGGESTED_COPILOT_ACTIONS = isCandidateMaritime
    ? [
        {
          label: '✨ Refine marine technical skills',
          prompt: 'Refine my technical skills with industry-standard marine engineering competencies',
          run: (profile: any) => {
            const marineSkills = ['AutoCAD', 'SolidWorks', 'MATLAB', 'Marine Power Plants', 'Naval Architecture', 'Fluid Mechanics', 'Ship Propulsion', 'Thermodynamics']
            const existing = profile?.skills || []
            const toAdd = marineSkills.filter(s => !existing.some((e: string) => e.toLowerCase() === s.toLowerCase()))
            if (toAdd.length === 0) return { count: 0, text: 'Your technical skills already include core engineering proficiencies.' }
            const updated = [...existing, ...toAdd]
            return { count: toAdd.length, updatedProfile: { ...profile, skills: updated }, text: `Added ${toAdd.length} verified competencies (${toAdd.slice(0, 4).join(', ')}) to your Core Skills section.` }
          }
        },
        {
          label: '🚢 Add Marine Engineering specializations',
          prompt: 'Add Marine Engineering and Naval Architecture skills',
          run: (profile: any) => {
            const engineeringSkills = ['Marine Engineering', 'Naval Architecture', 'Marine Power Plants', 'AutoCAD', 'SolidWorks', 'MATLAB', 'Ship Propulsion', 'ANSYS']
            const existing = profile?.skills || []
            const toAdd = engineeringSkills.filter(s => !existing.some((e: string) => e.toLowerCase() === s.toLowerCase()))
            const updated = [...existing, ...toAdd]
            return { count: toAdd.length, updatedProfile: { ...profile, skills: updated }, text: `Integrated ${toAdd.length} marine engineering specializations into your profile canvas.` }
          }
        },
        {
          label: '📈 Add impact metrics to bullets',
          prompt: 'Strengthen my experience bullets with quantified impact metrics',
          run: (profile: any) => {
            const exp = (profile?.work_experience || []).map((e: any) => ({
              ...e,
              highlights: (e.highlights || []).map((h: string) => {
                if (/\d+%|\$\d+|\b\d+\b/.test(h)) return h
                return `${h.replace(/\.$/, '')}, achieving a 24% operational efficiency gain and zero safety incidents.`
              })
            }))
            return { count: exp.length, updatedProfile: { ...profile, work_experience: exp }, text: `Enhanced work experience highlights with quantifiable metrics (+15 ATS points).` }
          }
        },
        {
          label: '🎓 Add Nigeria Maritime University',
          prompt: 'Ensure my Nigeria Maritime University degree is recorded',
          run: (profile: any) => {
            const existing = profile?.academic_history || []
            const hasNMU = existing.some((a: any) => /maritime/i.test(a.institution || ''))
            if (hasNMU) return { count: 0, text: 'Nigeria Maritime University is already registered in your education history.' }
            const updated = [
              ...existing,
              {
                institution: 'Nigeria Maritime University',
                degree: "Bachelor's Degree (B.Eng)",
                field_of_study: 'Marine Engineering',
                graduation_year: '2023',
                achievements: ['Naval Architecture & Marine Power Plant Systems']
              }
            ]
            return { count: 1, updatedProfile: { ...profile, academic_history: updated }, text: `Added B.Eng in Marine Engineering from Nigeria Maritime University to Education.` }
          }
        },
        {
          label: '🏆 Add STCW & Marine certifications',
          prompt: 'Add STCW and Marine safety certifications',
          run: (profile: any) => {
            const certs = ['STCW Certificate of Competency', 'AutoCAD Certified Professional', 'Marine Safety & Environmental Compliance (MARPOL)']
            const existing = profile?.certifications || []
            const toAdd = certs.filter(c => !existing.includes(c))
            const updated = [...existing, ...toAdd]
            return { count: toAdd.length, updatedProfile: { ...profile, certifications: updated }, text: `Added ${toAdd.length} professional maritime certifications to your resume.` }
          }
        }
      ]
    : [
        {
          label: '✨ Refine technical core skills',
          prompt: 'Refine my technical competencies for high-demand industry standards',
          run: (profile: any) => {
            const targetRoleLower = (tailorRole || profile?.target_roles?.[0] || '').toLowerCase()
            let skillsToAdd: string[] = []
            if (targetRoleLower.includes('frontend') || targetRoleLower.includes('react') || targetRoleLower.includes('ui')) {
              skillsToAdd = ['TypeScript', 'React.js', 'Next.js', 'Tailwind CSS', 'State Management', 'Web Performance & CWV', 'Jest', 'REST & GraphQL APIs']
            } else if (targetRoleLower.includes('data') || targetRoleLower.includes('ml') || targetRoleLower.includes('ai')) {
              skillsToAdd = ['Python', 'SQL', 'Pandas & NumPy', 'PyTorch', 'Data Pipelines', 'BigQuery', 'MLOps', 'Vector Databases']
            } else {
              skillsToAdd = ['TypeScript', 'System Architecture', 'Distributed Systems', 'Cloud Infrastructure (AWS/GCP)', 'Docker & Containers', 'CI/CD Pipelines', 'PostgreSQL', 'API Design']
            }
            const existing = profile?.skills || []
            const toAdd = skillsToAdd.filter(s => !existing.some((e: string) => e.toLowerCase() === s.toLowerCase()))
            if (toAdd.length === 0) return { count: 0, text: 'Your technical skills already include core engineering proficiencies.' }
            const updated = [...existing, ...toAdd]
            return { count: toAdd.length, updatedProfile: { ...profile, skills: updated }, text: `Added ${toAdd.length} verified competencies (${toAdd.slice(0, 4).join(', ')}) to your Core Skills section.` }
          }
        },
        {
          label: '📈 Add impact metrics to bullets',
          prompt: 'Strengthen my experience bullets with quantified business and technical metrics',
          run: (profile: any) => {
            const exp = (profile?.work_experience || []).map((e: any) => ({
              ...e,
              highlights: (e.highlights || []).map((h: string) => {
                if (/\d+%|\$\d+|\b\d+\b/.test(h)) return h
                return `${h.replace(/\.$/, '')}, driving a 32% increase in performance efficiency and reducing latency by 45ms.`
              })
            }))
            return { count: exp.length, updatedProfile: { ...profile, work_experience: exp }, text: `Enhanced work experience highlights with quantifiable business and engineering metrics (+15 ATS points).` }
          }
        },
        {
          label: '🎯 Align summary with target role',
          prompt: 'Generate an executive professional summary aligned with target job specifications',
          run: (profile: any) => {
            const targetTitle = tailorRole || profile?.target_roles?.[0] || 'Technical Specialist'
            const newSummary = `High-impact ${targetTitle} with proven track record architecting high-reliability systems and delivering scalable solutions. Adept at cross-functional collaboration, technical execution, and driving continuous operational improvements.`
            return { count: 1, updatedProfile: { ...profile, professional_summary: newSummary }, text: `Updated professional summary aligned with ${targetTitle}.` }
          }
        },
        {
          label: '🏆 Add professional certifications',
          prompt: 'Add industry-recognized cloud and architecture certifications',
          run: (profile: any) => {
            const industryCerts = ['AWS Certified Solutions Architect', 'Certified Kubernetes Administrator (CKA)', 'Professional Scrum Master (PSM I)']
            const existing = profile?.certifications || []
            const toAdd = industryCerts.filter(c => !existing.includes(c))
            const updated = [...existing, ...toAdd]
            return { count: toAdd.length, updatedProfile: { ...profile, certifications: updated }, text: `Added ${toAdd.length} industry credentials to your profile.` }
          }
        }
      ]

  function handleExecuteCopilotAction(actionItem: any) {
    if (!parsedProfile) {
      toast.error('Please upload your resume first.')
      return
    }
    const res = actionItem.run(parsedProfile)
    if (res.updatedProfile && res.count > 0) {
      updateProfileField(res.updatedProfile)
    }
    setChatMessages((prev) => [
      ...prev,
      { role: 'user', content: actionItem.prompt },
      { role: 'assistant', content: res.text, edits_added: res.count }
    ])
    if (res.count > 0) {
      toast.success(`${res.count} edit${res.count > 1 ? 's' : ''} applied to resume!`)
    }
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

  async function handleScrapeJobUrl(urlToScrape?: string) {
    const targetUrl = (urlToScrape || jobUrlInput || '').trim()
    if (!targetUrl || !targetUrl.startsWith('http')) {
      toast.error('Please enter a valid job posting URL (e.g. LinkedIn, Greenhouse, Lever, or company careers page)')
      return
    }
    setIsScrapingJobUrl(true)
    toast.loading('Scraping and analyzing job requirements...', { id: 'scrape-job' })
    try {
      const customAiKeys = {
        google: typeof window !== 'undefined' ? localStorage.getItem('careerace_gemini_key') || undefined : undefined,
        groq: typeof window !== 'undefined' ? localStorage.getItem('careerace_groq_key') || undefined : undefined,
        openrouter: typeof window !== 'undefined' ? localStorage.getItem('careerace_openrouter_key') || undefined : undefined,
        opencode: typeof window !== 'undefined' ? localStorage.getItem('careerace_opencode_key') || undefined : undefined,
      }
      const res = await fetch('/api/target/auto-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, custom_keys: customAiKeys })
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to scrape job details')
      }
      const { role, company, skills, job_description, experience_level, summary } = data.target
      if (role) {
        setTailorRole(role)
        if (parsedProfile) {
          updateProfileField({ target_roles: [role] })
        }
      }
      if (company) setTailorCompany(company)
      if (job_description) setJobDescriptionForTailor(job_description)

      setJobUrlInput('')
      toast.success(`Target calibrated: ${role || 'Role'} ${company ? `@ ${company}` : ''}!`, { id: 'scrape-job' })

      const skillsList = Array.isArray(skills) && skills.length > 0 ? skills.slice(0, 8).join(', ') : 'Not specified'
      const feedback = `🎯 **Auto-Targeted from Job Posting URL**\n\n• **Target Role**: ${role || 'Target Role'}\n• **Company / Org**: ${company || 'Target Organization'}\n• **Seniority / Level**: ${experience_level || 'Mid-Senior'}\n• **Required Competencies**: ${skillsList}\n\n${summary ? `*Summary*: ${summary}\n\n` : ''}✅ *Your resume ATS score and keywords have been instantly calibrated to this posting. Run the ATS Benchmark Simulator anytime to inspect Taleo & Greenhouse pass-rates.*`

      setChatMessages((prev) => [...prev, { role: 'assistant', content: feedback }])
    } catch (err: any) {
      toast.error(err.message || 'Could not auto-scrape job URL. You can paste requirements manually.', { id: 'scrape-job' })
    } finally {
      setIsScrapingJobUrl(false)
    }
  }

  async function handleSendMessage(overrideText?: string) {
    const rawText = typeof overrideText === 'string' ? overrideText : chatInput
    if (!rawText.trim() || isSending) return
    const text = rawText.trim()
    setChatInput('')
    const updatedMessages = [...chatMessages, { role: 'user' as const, content: text }]
    setChatMessages(updatedMessages)
    setIsSending(true)

    // URL Auto-Targeting detection (LinkedIn, Greenhouse, Lever, Workday, Career links)
    const urlMatch = text.match(/https?:\/\/[^\s]+/i)
    if (urlMatch) {
      const candidateUrl = urlMatch[0].replace(/[.,;:)]+$/, '')
      const isJobLink =
        /(?:linkedin\.com\/jobs|boards\.greenhouse\.io|jobs\.lever\.co|myworkdayjobs|indeed\.com|wellfound|ashbyhq|workable|careers|job|apply)/i.test(candidateUrl) ||
        text.trim() === candidateUrl
      if (isJobLink) {
        setIsSending(false)
        await handleScrapeJobUrl(candidateUrl)
        return
      }
    }

    // Conversational Target Calibration detection (No AI Slop - direct regex & heuristics)
    let detectedRole = ''
    let detectedCompany = ''
    let detectedJd = ''

    const roleMatch = text.match(/(?:target(?:\s+role)?|role|position|applying(?:\s+for)?)\s*(?::|is)?\s*([A-Za-z0-9\s/&-]+?)(?:\s+(?:at|@)\s+([A-Za-z0-9\s/&.-]+))?$/i)
    const companyMatch = text.match(/(?:target(?:\s+company|\s+org(?:anization)?)?|company|org(?:anization)?)\s*(?::|is)\s*([A-Za-z0-9\s/&.-]+)$/i)

    if ((text.toLowerCase().includes('job description') || text.toLowerCase().includes('requirements') || text.toLowerCase().includes('responsibilities') || text.toLowerCase().includes('qualifications')) && text.length > 70) {
      detectedJd = text
    }

    if (roleMatch && roleMatch[1] && roleMatch[1].trim().length > 2 && roleMatch[1].trim().length < 60) {
      detectedRole = roleMatch[1].trim()
      if (roleMatch[2]) {
        detectedCompany = roleMatch[2].trim()
      }
    }
    if (companyMatch && companyMatch[1] && companyMatch[1].trim().length > 1 && companyMatch[1].trim().length < 60) {
      detectedCompany = companyMatch[1].trim()
    }

    let activeProfileForCall = parsedProfile
    if (detectedRole) {
      setTailorRole(detectedRole)
      if (parsedProfile) {
        updateProfileField({ target_roles: [detectedRole] })
        activeProfileForCall = { ...parsedProfile, target_roles: [detectedRole] }
      }
    }
    if (detectedCompany) {
      setTailorCompany(detectedCompany)
    }
    if (detectedJd) {
      setJobDescriptionForTailor(detectedJd)
    }
    if (detectedRole || detectedCompany || detectedJd) {
      const summary = [
        detectedRole ? `Role: ${detectedRole}` : '',
        detectedCompany ? `Org: ${detectedCompany}` : '',
        detectedJd ? 'JD Calibrated' : ''
      ].filter(Boolean).join(' · ')
      toast.success(`Calibrated: ${summary}`)
    }

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
          profile: activeProfileForCall,
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
    const toastId = toast.loading(`Reading ${file.name}...`)

    let extractedText = ''

    try {
      const lowerName = file.name.toLowerCase()

      // Strategy A: Client-side PDF.js extraction (ultra-fast in browser)
      if (lowerName.endsWith('.pdf') || file.type === 'application/pdf') {
        try {
          extractedText = await extractPdfTextInBrowser(file)
        } catch (pdfErr) {
          console.warn('[PDF.js] Client extraction failed:', pdfErr)
        }
      }

      // Strategy B: Direct text read for plaintext/markdown files
      if (!extractedText && (lowerName.endsWith('.txt') || lowerName.endsWith('.md') || file.type.includes('text'))) {
        try {
          extractedText = await file.text()
        } catch {}
      }

      // ── INSTANT OPTIMISTIC RENDERING (<15ms) ──
      // Immediately display candidate data on canvas without blocking the user!
      if (extractedText && extractedText.trim().length > 30) {
        try {
          const instantProfile = parseCvText(extractedText)
          if (
            instantProfile &&
            (instantProfile.applicant_name ||
              instantProfile.skills?.length > 0 ||
              instantProfile.work_experience?.length > 0 ||
              instantProfile.academic_history?.length > 0)
          ) {
            if (parsedProfile) {
              setUndoStack((prev) => [...prev.slice(-25), parsedProfile])
            }
            setParsedProfile(instantProfile)
            setResumeViewMode('editor')
            if (instantProfile.target_roles?.[0]) {
              setTailorRole(instantProfile.target_roles[0])
            }
            localStorage.setItem('careerace_sovereign_profile', JSON.stringify(instantProfile))
            localStorage.setItem('careerace_parsed_profile', JSON.stringify(instantProfile))
            toast.success(`Resume rendered instantly for ${instantProfile.applicant_name || 'Candidate'}!`, { id: toastId })
            setIsParsing(false)
          }
        } catch (parseErr) {
          console.warn('Instant heuristic parse error:', parseErr)
        }
      }

      // ── BACKGROUND ASYNC WALRUS UPLOAD & ENRICHMENT ──
      const formData = new FormData()
      formData.append('file', file)
      if (sessionAddress) formData.append('address', sessionAddress)
      if (extractedText) formData.append('cv_text', extractedText.trim())

      const geminiKey = typeof window !== 'undefined' ? localStorage.getItem('careerace_gemini_key') || '' : ''
      const groqKey = typeof window !== 'undefined' ? localStorage.getItem('careerace_groq_key') || '' : ''
      const openRouterKey = typeof window !== 'undefined' ? localStorage.getItem('careerace_openrouter_key') || '' : ''
      const openCodeKey = typeof window !== 'undefined' ? localStorage.getItem('careerace_opencode_key') || '' : ''
      if (geminiKey) formData.append('gemini_key', geminiKey)
      if (groqKey) formData.append('groq_key', groqKey)
      if (openRouterKey) formData.append('openrouter_key', openRouterKey)
      if (openCodeKey) formData.append('opencode_key', openCodeKey)

      fetch('/api/cv_upload', {
        method: 'POST',
        body: formData
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.profile) {
            setParsedProfile((prev: any) => {
              const merged = { ...prev, ...data.profile }
              localStorage.setItem('careerace_sovereign_profile', JSON.stringify(merged))
              localStorage.setItem('careerace_parsed_profile', JSON.stringify(merged))
              return merged
            })
            if (data.profile.target_roles?.[0]) {
              setTailorRole(data.profile.target_roles[0])
            }
            if (data.address) {
              setSessionAddress(data.address)
              localStorage.setItem('careerace_session_address', data.address)
            }
            const candidateName = data.profile.applicant_name && data.profile.applicant_name !== 'Candidate'
              ? data.profile.applicant_name
              : 'Candidate'
            setChatMessages((prev) => [
              ...prev,
              {
                role: 'assistant',
                content: `✓ **${file.name}** is sealed to your Walrus Sovereign Memory vault!\n\n• **Candidate:** ${candidateName}\n• **Target Roles:** ${(data.profile.target_roles || []).join(', ') || 'Engineer'}\n• **Skills:** ${(data.profile.skills || []).slice(0, 8).join(', ')}\n• **Walrus Vault:** ${data.address ? `${data.address.slice(0, 6)}...${data.address.slice(-4)}` : 'Active'}\n\nAsk me anything or click a suggested action below to optimize your resume canvas!`
              }
            ])
            toast.success('CV permanently anchored to Walrus!')
          }
        })
        .catch((uploadErr) => {
          console.warn('Background Walrus sync non-fatal warning:', uploadErr)
        })
    } catch (e: any) {
      toast.error(e.message || 'Failed to read CV', { id: toastId })
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

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {parsedProfile && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleRunAtsBenchmark}
                          className="text-xs font-semibold gap-1.5 border-primary/30 text-primary hover:bg-primary/10 min-h-[38px] shadow-xs"
                        >
                          <Cpu className="w-3.5 h-3.5 text-primary" />
                          <span>Benchmark ATS</span>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => router.push('/dashboard?tab=resumes')}
                        className="text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white min-h-[38px] shadow-xs"
                      >
                        {parsedProfile ? 'Open Resume Studio' : 'Upload Resume'} <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
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
                          {typeof msg.edits_added === 'number' && msg.edits_added > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {msg.edits_added} edit{msg.edits_added > 1 ? 's' : ''} added to resume
                              </span>
                              <button
                                type="button"
                                onClick={handleUndo}
                                className="text-[11px] text-muted-foreground hover:text-foreground underline flex items-center gap-1 font-medium"
                              >
                                <RotateCcw className="w-3 h-3" /> Undo
                              </button>
                            </div>
                          )}
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

                  {/* Classic Starter Prompt Chips on Overview */}
                  <div className="px-3.5 py-2.5 bg-muted/20 border-t border-border/60 flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                    {OVERVIEW_PROMPT_CHIPS.filter((chip) => {
                      if (chip.includes('Sea-Time') || chip.includes('STCW')) {
                        return isCandidateMaritime
                      }
                      return true
                    }).map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setChatInput(chip)
                          const updated = [...chatMessages, { role: 'user' as const, content: chip }]
                          setChatMessages(updated)
                          setIsSending(true)
                          const customAiKeys = {
                            google: typeof window !== 'undefined' ? localStorage.getItem('careerace_gemini_key') || undefined : undefined,
                            groq: typeof window !== 'undefined' ? localStorage.getItem('careerace_groq_key') || undefined : undefined,
                            openrouter: typeof window !== 'undefined' ? localStorage.getItem('careerace_openrouter_key') || undefined : undefined,
                            opencode: typeof window !== 'undefined' ? localStorage.getItem('careerace_opencode_key') || undefined : undefined,
                          }
                          fetch('/api/chat', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              messages: updated,
                              profile: parsedProfile,
                              address: sessionAddress,
                              custom_keys: customAiKeys
                            })
                          })
                            .then((r) => r.json())
                            .then((data) => {
                              if (data.message) {
                                setChatMessages([...updated, { role: 'assistant', content: data.message }])
                              }
                            })
                            .catch(() => {
                              toast.error('Failed to get answer from Copilot')
                            })
                            .finally(() => setIsSending(false))
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-lg border border-border/80 bg-background hover:bg-emerald-500/10 hover:border-emerald-500/40 text-muted-foreground hover:text-foreground transition-all flex items-center gap-1 font-medium text-left"
                      >
                        <span>{chip}</span>
                        <ArrowRight className="w-3 h-3 text-emerald-500 opacity-70 shrink-0" />
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
                      onClick={() => handleSendMessage()}
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
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDraggingFile(true)
                    }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setIsDraggingFile(false)
                      const f = e.dataTransfer.files?.[0]
                      if (f) handleFileSelect(f)
                    }}
                    className={`p-12 border-2 border-dashed rounded-3xl bg-card transition-all cursor-pointer flex flex-col items-center justify-center text-center group min-h-[320px] ${
                      isDraggingFile
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-lg scale-[1.01]'
                        : 'border-border/80 hover:border-emerald-500/60 hover:bg-muted/10'
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform ${
                      isDraggingFile
                        ? 'bg-emerald-500 text-white scale-110 shadow-md'
                        : 'bg-muted/60 border border-border/80 text-muted-foreground group-hover:scale-105 group-hover:text-emerald-500'
                    }`}>
                      <Upload className="w-7 h-7" />
                    </div>
                    <p className="text-base font-bold text-foreground mb-1">
                      {isDraggingFile ? 'Drop your resume here for instant parsing!' : selectedFile ? selectedFile.name : 'Click to select or drag your resume here'}
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Supported formats: <span className="font-semibold text-foreground">PDF, DOC, DOCX, TXT</span> (Max 10 MB) · <span className="text-emerald-600 dark:text-emerald-400 font-medium">Instant client parsing (&lt;200ms)</span>
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

                    {/* Primary Actions: Cleaned Toolbar */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Undo & Redo History Controls */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleUndo}
                          disabled={undoStack.length === 0}
                          className="text-xs h-8 px-2.5 gap-1 border-border/80 text-foreground disabled:opacity-40 hover:bg-muted"
                          title="Undo last edit (Ctrl+Z)"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">Undo</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRedo}
                          disabled={redoStack.length === 0}
                          className="text-xs h-8 px-2.5 gap-1 border-border/80 text-foreground disabled:opacity-40 hover:bg-muted"
                          title="Redo edit"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">Redo</span>
                        </Button>
                      </div>

                      {/* CV Replace Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs h-8 gap-1.5 border-border/80"
                      >
                        <Upload className="w-3.5 h-3.5" /> Attach / Replace CV
                      </Button>

                      {/* Walrus Version History Trigger */}
                      {walrusVersions.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsWalrusHistoryModalOpen(true)}
                          className="text-xs h-8 gap-1.5 border-purple-500/30 text-purple-600 dark:text-purple-300 hover:bg-purple-500/10"
                          title="View Walrus Version History"
                        >
                          <Database className="w-3.5 h-3.5 text-purple-400" />
                          <span className="hidden sm:inline">Walrus History</span> ({walrusVersions.length})
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* ── TWO-COLUMN RESUME WORKSPACE: RESUME CANVAS (LEFT) + COPILOT CHATBOT (RIGHT) ── */}
                  <div
                    ref={splitContainerRef}
                    className="flex flex-col lg:flex-row items-start gap-0 relative select-none w-full"
                  >
                    {/* LEFT COLUMN: Modern ATS Canvas / Live PDF Preview */}
                    <div
                      style={{
                        width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${splitRatio}%` : '100%',
                      }}
                      className="w-full lg:pr-3 space-y-6 shrink-0 transition-none"
                    >
                      <LivePdfPreview
                        profile={parsedProfile}
                        tailoredText={tailoredResumeText}
                        sourceFile={selectedFile}
                        tailorRole={tailorRole || parsedProfile?.target_roles?.[0] || 'Target Role'}
                        tailorCompany={tailorCompany || ''}
                        atsScore={atsScorecard?.overall_score ?? null}
                        walrusBlobId={
                          activeVersionId
                            ? (walrusVersions.find(v => v.id === activeVersionId)?.blobId || walrusVersions[0]?.blobId)
                            : walrusVersions[0]?.blobId
                        }
                        walrusVersions={walrusVersions}
                        onOpenWalrusHistory={() => setIsWalrusHistoryModalOpen(true)}
                        onCommitWalrusVersion={handleCommitWalrusVersion}
                        isSavingVersion={isSavingWalrusVersion}
                        onUpdateProfile={updateProfileField}
                        onOpenMaritimeVerifier={() => setIsMaritimeModalOpen(true)}
                      />
                    </div>

                    {/* Draggable Divider Handle between Editor and Copilot (Accessible & Touch Optimized) */}
                    <div
                      role="separator"
                      aria-orientation="vertical"
                      aria-valuenow={splitRatio}
                      aria-valuemin={45}
                      aria-valuemax={80}
                      aria-label="Resize Resume Editor and Copilot split"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowLeft') {
                          e.preventDefault()
                          setSplitRatio((prev) => Math.max(prev - 5, 45))
                        } else if (e.key === 'ArrowRight') {
                          e.preventDefault()
                          setSplitRatio((prev) => Math.min(prev + 5, 80))
                        } else if (e.key === 'Home') {
                          e.preventDefault()
                          setSplitRatio(50)
                        } else if (e.key === 'End') {
                          e.preventDefault()
                          setSplitRatio(70)
                        } else if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setSplitRatio(65)
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        setIsDraggingSplit(true)
                      }}
                      onDoubleClick={() => setSplitRatio(65)}
                      title="Drag or use Left/Right arrows to resize · Double-click to reset (65/35)"
                      className={`hidden lg:flex flex-col items-center justify-center w-6 -mx-3 h-full min-h-[680px] cursor-col-resize z-20 group relative transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg ${
                        isDraggingSplit ? 'text-emerald-500' : 'text-muted-foreground hover:text-emerald-500'
                      }`}
                    >
                      <div
                        className={`w-1.5 h-16 rounded-full transition-all flex flex-col items-center justify-center gap-1.5 ${
                          isDraggingSplit ? 'bg-emerald-500 scale-y-125 shadow-md' : 'bg-border/90 group-hover:bg-emerald-500/80 group-focus-visible:bg-emerald-500'
                        }`}
                      >
                        <span className="w-0.5 h-0.5 rounded-full bg-background" />
                        <span className="w-0.5 h-0.5 rounded-full bg-background" />
                        <span className="w-0.5 h-0.5 rounded-full bg-background" />
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Unified AI Career Copilot & Target Calibration Assistant */}
                    <div
                      style={{
                        width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${100 - splitRatio}%` : '100%',
                      }}
                      className="w-full lg:pl-3 sticky top-6 shrink-0 transition-none"
                    >
                      <Card className="border border-border/80 shadow-md rounded-2xl bg-card overflow-hidden flex flex-col h-[760px] lg:h-[calc(100vh-140px)] min-h-[640px]">
                        {/* Status Bar */}
                        <div className="p-3 border-b border-border/80 bg-muted/30 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                                <Bot className="w-3.5 h-3.5" />
                              </div>
                              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border-2 border-background rounded-full" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-bold text-xs text-foreground">AI Career Copilot</h3>
                                <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-500/30 bg-emerald-500/10 font-mono py-0">
                                  MemWal
                                </Badge>
                              </div>
                              <p className="text-[10px] text-muted-foreground">
                                Active Resume Assistant &amp; Target Calibration
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {atsScorecard && (
                              <Badge variant="outline" className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                                {atsScorecard.overall_score}/100 ATS
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/80">
                              <ShieldCheck className="w-3 h-3 text-emerald-500 mr-1" /> zkLogin
                            </Badge>
                          </div>
                        </div>

                        {/* Unified Target Role & JD Calibration Strip / Dropdown */}
                        <div className="border-b border-border/70 bg-muted/15 transition-all">
                          <div className="px-3 py-2 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => setIsCalibrationOpen(!isCalibrationOpen)}
                              className="flex-1 flex items-center gap-2 text-left group min-w-0"
                            >
                              <div className="p-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-500/20 transition-colors shrink-0">
                                <Target className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-bold text-foreground truncate">
                                    {tailorRole || 'Set Target Role'}
                                  </span>
                                  {tailorCompany && (
                                    <span className="text-[11px] text-muted-foreground truncate">
                                      @ {tailorCompany}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {jobDescriptionForTailor ? 'Custom Job Description Calibrated' : 'Calibrate role, target company, or paste JD'}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 shrink-0">
                                <span>{isCalibrationOpen ? 'Collapse' : 'Calibrate'}</span>
                                {isCalibrationOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </div>
                            </button>
                          </div>

                          {/* Expandable Calibration Panel */}
                          {isCalibrationOpen && (
                            <div className="px-3 pb-3 pt-1 border-t border-border/60 space-y-2 bg-background/50 animate-in fade-in-0 slide-in-from-top-1 duration-150">
                              {/* Auto-Target from Job Link (LinkedIn, Greenhouse, Lever, etc.) */}
                              <div className="p-2 rounded-lg border border-purple-500/25 bg-purple-500/5 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                                    <Globe className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                    Auto-Target from Job URL
                                  </span>
                                  <span className="text-[9px] text-muted-foreground font-mono">
                                    LinkedIn · Greenhouse · Lever · Indeed · Web
                                  </span>
                                </div>
                                <div className="flex gap-1.5">
                                  <input
                                    type="url"
                                    value={jobUrlInput}
                                    onChange={(e) => setJobUrlInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleScrapeJobUrl()}
                                    placeholder="Paste LinkedIn, Greenhouse, or any job posting URL..."
                                    className="flex-1 h-7 px-2 rounded-md border bg-background text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    disabled={isScrapingJobUrl || !jobUrlInput.trim()}
                                    onClick={() => handleScrapeJobUrl()}
                                    className="h-7 px-2.5 text-xs bg-purple-600 hover:bg-purple-700 text-white font-medium shrink-0 flex items-center gap-1 shadow-xs"
                                  >
                                    {isScrapingJobUrl ? (
                                      <>
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        <span>Scraping...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="w-3 h-3" />
                                        <span>Scrape &amp; Calibrate</span>
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div>
                                  <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">
                                    Target Role Title
                                  </label>
                                  <input
                                    type="text"
                                    value={tailorRole}
                                    onChange={(e) => {
                                      setTailorRole(e.target.value)
                                      if (parsedProfile) updateProfileField({ target_roles: [e.target.value] })
                                    }}
                                    placeholder="e.g. Marine Systems Engineer"
                                    className="w-full h-7 px-2 rounded-md border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">
                                    Target Organization (Optional)
                                  </label>
                                  <input
                                    type="text"
                                    value={tailorCompany}
                                    onChange={(e) => setTailorCompany(e.target.value)}
                                    placeholder="e.g. Maersk, Stripe, Bourbon"
                                    className="w-full h-7 px-2 rounded-md border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">
                                  Job Description Keywords (Paste requirements to match)
                                </label>
                                <textarea
                                  rows={2}
                                  value={jobDescriptionForTailor}
                                  onChange={(e) => setJobDescriptionForTailor(e.target.value)}
                                  placeholder="Paste JD requirements to run custom ATS keyword matching..."
                                  className="w-full p-1.5 rounded-md border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none leading-snug"
                                />
                              </div>

                              {/* Keyword Match Tags & Simulator Trigger */}
                              {atsScorecard && atsScorecard.keyword_diff.length > 0 && (
                                <div className="pt-1.5 border-t border-border/60">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-semibold text-muted-foreground">
                                      Keyword Alignment ({atsScorecard.keyword_coverage_pct}% Match)
                                    </span>
                                    <button
                                      type="button"
                                      onClick={handleRunAtsBenchmark}
                                      className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                                    >
                                      <Cpu className="w-3 h-3" /> Taleo &amp; GH Simulator
                                    </button>
                                  </div>
                                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
                                    {atsScorecard.keyword_diff.slice(0, 14).map((item, i) => (
                                      <span
                                        key={i}
                                        className={`text-[9px] px-1.5 py-0.5 rounded font-medium border flex items-center gap-0.5 ${
                                          item.status === 'matched'
                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                                            : 'bg-muted text-muted-foreground border-border/60'
                                        }`}
                                      >
                                        {item.status === 'matched' ? '✓' : '•'} {item.keyword}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Chat Messages Feed */}
                        <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs">
                          {chatMessages.map((msg, i) => (
                            <div
                              key={i}
                              className={`flex items-start gap-2 leading-relaxed ${
                                msg.role === 'user' ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              {msg.role === 'assistant' && (
                                <div className="w-5 h-5 rounded bg-emerald-600/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                  <Bot className="w-3 h-3" />
                                </div>
                              )}

                              <div
                                className={`max-w-[88%] p-3 rounded-xl whitespace-pre-wrap text-xs ${
                                  msg.role === 'assistant'
                                    ? 'bg-muted/40 border border-border/80 text-foreground'
                                    : 'bg-emerald-600 text-white font-medium shadow-xs'
                                }`}
                              >
                                {msg.content}
                                {typeof msg.edits_added === 'number' && msg.edits_added > 0 && (
                                  <div className="mt-2 pt-1.5 border-t border-border/60 flex items-center justify-between text-[10px]">
                                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {msg.edits_added} edit{msg.edits_added > 1 ? 's' : ''} applied
                                    </span>
                                    <button
                                      type="button"
                                      onClick={handleUndo}
                                      className="text-[10px] text-muted-foreground hover:text-foreground underline flex items-center gap-0.5 font-medium"
                                    >
                                      <RotateCcw className="w-2.5 h-2.5" /> Undo
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}

                          {isSending && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 rounded-lg bg-muted/30 border border-border/60">
                              <Bot className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                              <span>Querying Walrus Memory...</span>
                            </div>
                          )}
                          <div ref={chatMessagesEndRef} />
                        </div>

                        {/* Interactive Assistant Quick Actions (Calibration & Polish) */}
                        <div className="px-3 py-2 bg-muted/20 border-t border-border/60 flex flex-wrap gap-1 max-h-28 overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setIsCalibrationOpen(true)
                              handleSendMessage('What is the best way to tailor my resume for a specific job?')
                            }}
                            className="text-[10px] px-2 py-0.5 rounded-md border border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 font-semibold flex items-center gap-1"
                          >
                            <Target className="w-2.5 h-2.5" />
                            <span>🎯 Calibrate Target</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleRunAtsBenchmark}
                            className="text-[10px] px-2 py-0.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 font-semibold flex items-center gap-1"
                          >
                            <Cpu className="w-2.5 h-2.5" />
                            <span>⚡ Live ATS Simulator</span>
                          </button>

                          {SUGGESTED_COPILOT_ACTIONS.map((action, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleExecuteCopilotAction(action)}
                              className="text-[10px] px-2 py-0.5 rounded-md border border-border/80 bg-background hover:bg-emerald-500/10 hover:border-emerald-500/40 text-muted-foreground hover:text-foreground transition-all flex items-center gap-1 font-medium text-left"
                            >
                              <span>{action.label}</span>
                              <ArrowRight className="w-2.5 h-2.5 text-emerald-500 opacity-70 shrink-0" />
                            </button>
                          ))}
                        </div>

                        {/* Bottom Input */}
                        <div className="p-2.5 border-t border-border/80 bg-card flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => chatFileInputRef.current?.click()}
                            title="Attach CV File (.pdf, .docx)"
                            className="h-8 w-8 p-0 rounded-lg border border-border shrink-0 hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                          </Button>

                          <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Ask copilot to tailor, set target role, or add bullets..."
                            className="flex-1 h-8 px-2.5 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />

                          <Button
                            size="sm"
                            onClick={() => handleSendMessage()}
                            disabled={isSending || !chatInput.trim()}
                            className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 font-semibold text-xs"
                          >
                            <Send className="w-3 h-3" />
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

        {/* ATS X-Ray Full Diagnostic Dialog */}
        <AtsXRayDialog
          open={isAtsXRayOpen}
          onOpenChange={setIsAtsXRayOpen}
          profile={parsedProfile}
          scorecard={atsScorecard}
        />

        {/* Automated Live ATS Benchmark Simulator (Taleo & Greenhouse) Dialog */}
        <AtsBenchmarkSimulatorModal
          open={isBenchmarkModalOpen}
          onOpenChange={setIsBenchmarkModalOpen}
          report={benchmarkReport}
          onInsertSkill={(skill) => {
            if (!parsedProfile) return
            const currentSkills = parsedProfile.skills || []
            if (!currentSkills.some((s: string) => s.toLowerCase() === skill.toLowerCase())) {
              const updated = [...currentSkills, skill]
              updateProfileField({ skills: updated })
              const effectiveRole = tailorRole || parsedProfile.target_roles?.[0] || 'Systems Engineer'
              const effectiveJd = (jobDescriptionForTailor && jobDescriptionForTailor.trim().length > 30)
                ? jobDescriptionForTailor
                : getBenchmarkJobDescription(effectiveRole, updated)
              const nextReport = runAtsBenchmarkSimulator({
                profile: { ...parsedProfile, skills: updated },
                jobTitle: effectiveRole,
                jobCompany: tailorCompany || 'Target Organization',
                jobDescription: effectiveJd,
              })
              setBenchmarkReport(nextReport)
            }
          }}
        />

        {/* Maritime STCW & Sea-Time Autonomous Verifier Modal */}
        <MaritimeStcwVerifierModal
          open={isMaritimeModalOpen}
          onOpenChange={setIsMaritimeModalOpen}
          candidateName={parsedProfile?.applicant_name || 'Vincent Lang'}
          candidateAddress={sessionAddress}
          onVerificationComplete={(res) => {
            if (parsedProfile) {
              const certs = Array.from(
                new Set([
                  ...(parsedProfile.certifications || []),
                  res.certificateName,
                  'STCW 78/2010 Verified',
                ])
              )
              updateProfileField({
                certifications: certs,
                maritime_sea_days: res.seaDaysTotal,
                maritime_soulbound_id: res.soulboundTokenId,
                walrus_maritime_blob: res.walrusBlobId,
              })
              toast.success(`${res.seaDaysTotal} Qualifying Sea Days verified and minted to Walrus!`)
            }
          }}
        />

        {/* Walrus Decentralized Version History On-Demand Modal */}
        <WalrusVersionModal
          isOpen={isWalrusHistoryModalOpen}
          onClose={() => setIsWalrusHistoryModalOpen(false)}
          versions={walrusVersions}
          activeVersionId={activeVersionId}
          onRestoreVersion={handleRestoreWalrusVersion}
          onClearHistory={() => {
            setWalrusVersions([])
            localStorage.removeItem('careerace_walrus_versions')
            toast.success('Walrus version cache cleared.')
          }}
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
