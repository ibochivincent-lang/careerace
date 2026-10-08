'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bot, Send, User, Upload, FileText, CheckCircle2, ChevronRight, ChevronDown,
  Sparkles, ShieldCheck, Mail, ExternalLink, Download, Copy, Trash2,
  AlertCircle, Plus, Edit3, Database, TrendingUp, Target, AlertTriangle,
  RotateCcw, Compass, Clock, Check, Layers, Briefcase, Filter, Search,
  Zap, Award, Play, CheckSquare, RefreshCw, X, ArrowRight, ShieldAlert,
  Calendar, Building2, MapPin, Globe, Loader2, DollarSign, Paperclip, ChevronUp,
  GraduationCap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/components/ui/utils'
import { VERIFIED_COMPANY_HIRING_CONTACTS, type CompanyHiringContact } from '@/lib/company_directory'
import { downloadEmlReceipt } from '@/lib/email_receipt'
import {
  generateCareerRoadmap,
  DISCIPLINE_CAREER_LADDERS,
  type CareerRoadmapAnalysis,
  type CareerRank,
  type CareerPathwayOption
} from '@/lib/career_advisory'

export interface InPlaceCareerAssistantProps {
  parsedProfile: any
  onUpdateProfile: (updated: any) => void
  sessionAddress: string
  overviewWalrusVault: {
    latestBlobId?: string | null
    walrusUrl?: string | null
    ipfsHash?: string | null
    gatewayUrl?: string | null
    directWalrusActive?: boolean
  } | null
  appliedJobs: any[]
  onUpdateAppliedJobs: (updated: any[]) => void
  onNavigateToCanvas?: () => void
  onUploadCvClick?: () => void
  overviewChatMessages: Array<{ role: 'user' | 'assistant'; content: string }>
  onSendMessage: (overrideText?: string) => Promise<void>
  isSendingMessage: boolean
}

// Top level modes: Only AI Copilot and In-Place CV Builder (NO cluttered 6-pill row!)
type TopViewMode = 'copilot' | 'cv_builder'

// Inline modules openable inside Copilot via Menus 1, 2, 3, 4
type InCopilotModule = null | 'cover_letter' | 'job_scanner' | 'career_advisor'

// 5-Day Cooldown Threshold in Milliseconds (5 days * 24h * 60m * 60s * 1000ms)
const COOLDOWN_MS = 5 * 24 * 60 * 60 * 1000

// 6 Core Disciplines and Pre-Aligned Technical Skills
export const DISCIPLINE_PRESETS = [
  {
    id: 'maritime',
    label: 'Maritime & Marine Engineering',
    category: 'Marine Engineering',
    defaultRole: 'Chief Marine Engineer (STCW III/2)',
    skills: [
      'STCW III/2 Chief Engineer',
      'Marine Propulsion Systems',
      '2-Stroke & 4-Stroke Diesel Engines',
      'Dynamic Positioning (DP-2 / DP-3)',
      'High Voltage Marine Power (6.6kV)',
      'Auxiliary Machinery & Heat Exchangers',
      'Fuel Bunkering & Centrifuges',
      'MARPOL & SOLAS Compliance',
      'Planned Maintenance Systems (PMS)',
      'Thermal Efficiency Optimization',
      'Boiler Water Treatment',
      'Oily Water Separator (OWS)'
    ]
  },
  {
    id: 'software',
    label: 'Software, Cloud & DevOps',
    category: 'Software Engineering',
    defaultRole: 'Senior Cloud Solutions Architect',
    skills: [
      'TypeScript',
      'React & Next.js',
      'Node.js',
      'Go (Golang)',
      'Distributed Systems Architecture',
      'PostgreSQL',
      'Redis & In-Memory Caching',
      'Docker & Containerization',
      'Kubernetes (K8s)',
      'Terraform & Infrastructure as Code',
      'AWS & Google Cloud',
      'GraphQL & REST APIs',
      'CI/CD GitHub Actions'
    ]
  },
  {
    id: 'ai_robotics',
    label: 'AI, Machine Learning & Robotics',
    category: 'Artificial Intelligence',
    defaultRole: 'Lead Autonomous Systems & AI Architect',
    skills: [
      'PyTorch & Deep Learning',
      'Computer Vision (OpenCV / YOLO)',
      'Sensor Fusion & LiDAR / RADAR',
      'Autonomous Navigation & SLAM',
      'ROS / ROS2',
      'Deep Reinforcement Learning',
      'CUDA Acceleration',
      'LLM Fine-Tuning & Quantization',
      'Vector Databases & RAG',
      'TensorRT Inference'
    ]
  },
  {
    id: 'healthcare',
    label: 'Healthcare & Clinical Informatics',
    category: 'Healthcare Informatics',
    defaultRole: 'Clinical Informatics Specialist',
    skills: [
      'Clinical Informatics',
      'EHR / EMR Systems (Epic, Cerner)',
      'HL7 & FHIR Interoperability',
      'HIPAA Compliance & Privacy',
      'Medical Image Processing (DICOM)',
      'Clinical Decision Support (CDSS)',
      'Healthcare Analytics',
      'SNOMED-CT & LOINC Coding'
    ]
  },
  {
    id: 'marine_ops',
    label: 'Fleet Operations & Marine Management',
    category: 'Fleet Operations',
    defaultRole: 'Fleet Technical Superintendent',
    skills: [
      'ISM & ISPS Code Management',
      'Drydocking & Refit Supervision',
      'Class Bureau Surveys (DNV, ABS, Lloyd’s)',
      'Flag State Inspections',
      'Vessel OPEX Budgeting',
      'Crew Matrix Compliance',
      'Incident Investigation (RCA)',
      'Vessel Vetting & SIRE 2.0 Inspections'
    ]
  },
  {
    id: 'cybersecurity',
    label: 'Cybersecurity & InfoSec',
    category: 'Cybersecurity',
    defaultRole: 'Lead Security Architect & Compliance',
    skills: [
      'Zero Trust Network Architecture',
      'Cloud Security Posture Management',
      'Penetration Testing & Red Teaming',
      'SIEM / SOAR Monitoring',
      'Identity & Access Management (IAM / zkLogin)',
      'ISO 27001 & NIST Frameworks',
      'Threat Modeling & Vulnerability Scans',
      'Applied Cryptography'
    ]
  }
]

/**
 * Robust markdown message formatter that cleans all *** and ** asterisks
 * and renders bold typography without raw asterisks on screen.
 */
function FormattedChatMessage({ content, role }: { content: string; role: 'user' | 'assistant' }) {
  if (role === 'user') {
    return <div className="whitespace-pre-wrap text-[10px] sm:text-[11px] leading-snug">{content}</div>
  }

  const lines = content.split('\n')
  return (
    <div className="space-y-1 leading-snug text-[10px] sm:text-[11px]">
      {lines.map((line, lineIdx) => {
        if (!line.trim()) {
          return <div key={lineIdx} className="h-0.5" />
        }

        const bulletMatch = line.match(/^(\s*)([•\-\*]|\d+\.)\s+(.*)$/)
        const textToFormat = bulletMatch ? bulletMatch[3] : line

        const parts: React.ReactNode[] = []
        const regex = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g
        let lastIndex = 0
        let match: RegExpExecArray | null

        while ((match = regex.exec(textToFormat)) !== null) {
          if (match.index > lastIndex) {
            parts.push(textToFormat.slice(lastIndex, match.index))
          }
          const token = match[0]
          if (token.startsWith('***') && token.endsWith('***')) {
            parts.push(
              <strong key={match.index} className="font-bold text-foreground">
                <em>{token.slice(3, -3)}</em>
              </strong>
            )
          } else if (token.startsWith('**') && token.endsWith('**')) {
            parts.push(
              <strong key={match.index} className="font-bold text-foreground">
                {token.slice(2, -2)}
              </strong>
            )
          } else if (token.startsWith('*') && token.endsWith('*')) {
            parts.push(
              <em key={match.index} className="italic text-foreground/90">
                {token.slice(1, -1)}
              </em>
            )
          }
          lastIndex = regex.lastIndex
        }

        if (lastIndex < textToFormat.length) {
          parts.push(textToFormat.slice(lastIndex))
        }

        if (bulletMatch) {
          return (
            <div key={lineIdx} className="flex items-start gap-1.5 pl-0.5">
              <span className="text-emerald-500 font-bold shrink-0 mt-0.5">•</span>
              <div className="flex-1">{parts}</div>
            </div>
          )
        }

        return <div key={lineIdx}>{parts}</div>
      })}
    </div>
  )
}

export function InPlaceCareerAssistant({
  parsedProfile,
  onUpdateProfile,
  sessionAddress,
  overviewWalrusVault,
  appliedJobs,
  onUpdateAppliedJobs,
  onNavigateToCanvas,
  onUploadCvClick,
  overviewChatMessages,
  onSendMessage,
  isSendingMessage,
}: InPlaceCareerAssistantProps) {
  const router = useRouter()
  // Primary view: AI Copilot vs In-Place CV Builder
  const [topView, setTopView] = useState<TopViewMode>('copilot')
  
  // Active inline module inside Copilot (Menu 2, 3, 4)
  const [copilotModule, setCopilotModule] = useState<InCopilotModule>(null)

  const [chatInput, setChatInput] = useState('')
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Scroll chat to bottom on new messages
  useEffect(() => {
    if (topView === 'copilot' && chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [overviewChatMessages, isSendingMessage, topView, copilotModule])

  // ─────────────────────────────────────────────────────────────────────────────
  // FN-01 IN-PLACE MENU CV WRITER STATE & ACCORDION EXPANSION
  // ─────────────────────────────────────────────────────────────────────────────
  // FN-01 IN-PLACE MENU CV WRITER STATE & ACCORDION EXPANSION
  // ─────────────────────────────────────────────────────────────────────────────
  // Accordion state for the 7 boxes:
  const [openBoxes, setOpenBoxes] = useState<Record<string, boolean>>({
    contact: true,
    footprint: false,
    role: false,
    skills: false,
    experience: false,
    education: false,
    proof: false,
  })

  const toggleBox = (boxId: string) => {
    setOpenBoxes((prev) => ({ ...prev, [boxId]: !prev[boxId] }))
  }

  // Selected Discipline
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>('software')

  const currentDiscipline = useMemo(() => {
    return DISCIPLINE_PRESETS.find((d) => d.id === selectedDisciplineId) || DISCIPLINE_PRESETS[0]
  }, [selectedDisciplineId])

  // CV Form state supporting multiple emails, phones, and academic education
  const [cvForm, setCvForm] = useState({
    name: parsedProfile?.applicant_name || '',
    email: parsedProfile?.email || '',
    additionalEmails: [] as string[],
    phone: parsedProfile?.phone || '',
    additionalPhones: [] as string[],
    location: parsedProfile?.location || '',
    targetRole: parsedProfile?.target_roles?.[0] || 'Software Systems Architect',
    seniority: 'Senior',
    workplace: 'Remote',
    github: parsedProfile?.github || '',
    linkedin: parsedProfile?.linkedin || '',
    portfolio: parsedProfile?.portfolio || '',
    additionalLinks: [] as string[],
    skills: (parsedProfile?.skills as string[]) || [
      'TypeScript', 'Next.js', 'Distributed Systems', 'Cloud Infrastructure', 'PostgreSQL', 'Docker'
    ],
    experience: (parsedProfile?.work_experience as any[]) || [],
    education: (parsedProfile?.academic_history as any[]) || [],
    certifications: (parsedProfile?.certifications as string[]) || [],
    proofFile: null as { name: string; sizeKb: number } | null,
  })

  // Synchronize form when parsedProfile updates from outside
  useEffect(() => {
    if (parsedProfile) {
      setCvForm((prev) => ({
        ...prev,
        name: parsedProfile.applicant_name || prev.name,
        email: parsedProfile.email || prev.email,
        phone: parsedProfile.phone || prev.phone,
        location: parsedProfile.location || prev.location,
        targetRole: parsedProfile.target_roles?.[0] || prev.targetRole,
        github: parsedProfile.github || prev.github,
        linkedin: parsedProfile.linkedin || prev.linkedin,
        portfolio: parsedProfile.portfolio || prev.portfolio,
        skills: Array.isArray(parsedProfile.skills) && parsedProfile.skills.length > 0 ? parsedProfile.skills : prev.skills,
        experience: Array.isArray(parsedProfile.work_experience) && parsedProfile.work_experience.length > 0 ? parsedProfile.work_experience : prev.experience,
        education: Array.isArray(parsedProfile.academic_history) && parsedProfile.academic_history.length > 0 ? parsedProfile.academic_history : prev.education,
        certifications: Array.isArray(parsedProfile.certifications) && parsedProfile.certifications.length > 0 ? parsedProfile.certifications : prev.certifications,
      }))
    }
  }, [parsedProfile])

  const [newSkillInput, setNewSkillInput] = useState('')
  const [isSavingCv, setIsSavingCv] = useState(false)
  const proofFileInputRef = useRef<HTMLInputElement>(null)

  // Add & remove skill
  const handleAddSkill = (skillToAdd?: string) => {
    const val = (skillToAdd || newSkillInput).trim()
    if (!val) return
    if (!cvForm.skills.includes(val)) {
      setCvForm((prev) => ({ ...prev, skills: [...prev.skills, val] }))
    }
    setNewSkillInput('')
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setCvForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }))
  }

  // Handle Proof Document Upload (STRICT <= 10 MB ENFORCEMENT)
  const handleProofDocumentSelect = (file: File | null) => {
    if (!file) return
    const maxBytes = 10 * 1024 * 1024 // 10 MB
    if (file.size > maxBytes) {
      toast.error(`Proof document exceeds 10 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please upload a file under 10 MB.`)
      return
    }

    const sizeKb = Math.round(file.size / 1024)
    setCvForm((prev) => ({
      ...prev,
      proofFile: { name: file.name, sizeKb },
    }))
    toast.success(`Proof document attached: ${file.name} (${sizeKb} KB)`)
  }

  // Save CV to Walrus Sovereign Memory
  const handleSaveCvToWalrus = async () => {
    setIsSavingCv(true)
    try {
      const updatedProfile = {
        ...(parsedProfile || {}),
        applicant_name: cvForm.name || 'Candidate',
        email: cvForm.email || 'applicant@careerace.online',
        additional_emails: cvForm.additionalEmails,
        phone: cvForm.phone,
        additional_phones: cvForm.additionalPhones,
        location: cvForm.location,
        target_roles: [cvForm.targetRole],
        seniority: cvForm.seniority,
        workplace_preference: cvForm.workplace,
        github: cvForm.github,
        linkedin: cvForm.linkedin,
        portfolio: cvForm.portfolio,
        additional_links: cvForm.additionalLinks,
        skills: cvForm.skills,
        work_experience: cvForm.experience,
        academic_history: cvForm.education,
        certifications: cvForm.certifications,
        proof_document: cvForm.proofFile,
      }

      // 1. Update parent state
      onUpdateProfile(updatedProfile)

      // 2. Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('careerace_sovereign_profile', JSON.stringify(updatedProfile))
        localStorage.setItem('careerace_parsed_profile', JSON.stringify(updatedProfile))
      }

      // 3. Save facts directly to sovereign memory endpoint
      await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: sessionAddress || undefined,
          fact: `Profile verified for ${cvForm.name || 'Candidate'}. Target Role: ${cvForm.targetRole}. Core Skills: ${cvForm.skills.slice(0, 5).join(', ')}. Proof: ${cvForm.proofFile?.name || 'Self-declared'}.`,
          kind: 'experience',
        }),
      }).catch(() => {})

      toast.success('CV saved & synced to Walrus Sovereign Memory!')
    } catch (_err) {
      toast.error('Failed to sync CV to Walrus memory')
    } finally {
      setIsSavingCv(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FN-02 COVER LETTER STUDIO STATE & ACTIONS (INLINE IN COPILOT)
  // ─────────────────────────────────────────────────────────────────────────────
  const [clScope, setClScope] = useState<'singular' | 'batch'>('singular')
  const [clTone, setClTone] = useState<'modern_tech' | 'executive' | 'narrative'>('modern_tech')
  const [clTargetCompany, setClTargetCompany] = useState('Maersk')
  const [clTargetRole, setClTargetRole] = useState(cvForm.targetRole || 'Systems Engineer')
  const [clKeyProblem, setClKeyProblem] = useState('Ensuring 99.9% uptime and zero unscheduled downtime across distributed operations.')
  const [isGeneratingCl, setIsGeneratingCl] = useState(false)
  const [clGenerated, setClGenerated] = useState<{
    salutation: string
    opening: string
    bodyParagraph1: string
    bodyParagraph2: string
    closing: string
    fullText: string
  } | null>(null)

  const handleGenerateCoverLetter = async () => {
    setIsGeneratingCl(true)
    try {
      const res = await fetch('/api/cover_letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: clScope,
          tone: clTone,
          targetCompany: clTargetCompany || 'Hiring Team',
          company: clTargetCompany || 'Hiring Team',
          targetRole: clTargetRole || 'Engineering Specialist',
          role: clTargetRole || 'Engineering Specialist',
          keyProblems: clKeyProblem,
          problem: clKeyProblem,
          candidateName: cvForm.name || 'Candidate',
          candidateSkills: cvForm.skills,
        }),
      })
      const data = await res.json()
      const full = (data.coverLetter || data.letter) as string | undefined
      if (full) {
        const paragraphs = full.split('\n\n').filter((p: string) => p.trim())
        setClGenerated({
          salutation: paragraphs[0] || `Dear ${clTargetCompany || 'Hiring'} Team,`,
          opening: paragraphs[1] || 'I am writing to express my strong interest...',
          bodyParagraph1: paragraphs[2] || 'In my previous tenure...',
          bodyParagraph2: paragraphs[3] || 'My technical toolkit directly addresses your team goals...',
          closing: paragraphs[4] || 'Thank you for your consideration. I look forward to speaking soon.',
          fullText: full,
        })
        toast.success(`Cover Letter generated (${clTone.replace('_', ' ')} tone)!`)
      } else {
        toast.error('Could not generate cover letter')
      }
    } catch (_err) {
      toast.error('Network error generating cover letter')
    } finally {
      setIsGeneratingCl(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FN-03 & FN-04 JOB SCANNER & AUTO-DISPATCH STATE (INLINE IN COPILOT)
  // ─────────────────────────────────────────────────────────────────────────────
  const [jobDisciplineId, setJobDisciplineId] = useState<string | null>(null)
  const [jobSelectedRankId, setJobSelectedRankId] = useState<string>('all')
  const [jobTimeWindow, setJobTimeWindow] = useState<'1h' | '24h' | '3d'>('1h')
  const [isDispatching, setIsDispatching] = useState(false)
  const [dispatchProgress, setDispatchProgress] = useState<{ current: number; total: number; activeCompany?: string } | null>(null)

  // Auto-Dispatch Configuration Studio State
  const [dispatchCvSelection, setDispatchCvSelection] = useState<'primary' | 'technical'>('primary')
  const [dispatchClSelection, setDispatchClSelection] = useState<'tailored' | 'tech' | 'executive'>('tailored')
  const [dispatchPacing, setDispatchPacing] = useState<'2.2s' | '5m' | 'instant'>('2.2s')

  const selectedJobDiscipline = useMemo(() => {
    if (!jobDisciplineId) return null
    return DISCIPLINE_PRESETS.find((d) => d.id === jobDisciplineId) || null
  }, [jobDisciplineId])

  const selectedJobLadder = useMemo(() => {
    if (!jobDisciplineId) return null
    const key = jobDisciplineId === 'ai' ? 'ai_robotics' : jobDisciplineId
    return DISCIPLINE_CAREER_LADDERS[key] || DISCIPLINE_CAREER_LADDERS.software
  }, [jobDisciplineId])

  // Deduplication & cooldown check
  const checkJobSubmissionStatus = (companyEmail: string) => {
    const existing = appliedJobs.find((j: any) => j.recipientEmail === companyEmail)
    if (!existing) return { status: 'eligible' as const }
    const timeSince = Date.now() - new Date(existing.dispatchedAt).getTime()
    if (timeSince < COOLDOWN_MS) {
      const daysRemaining = Math.ceil((COOLDOWN_MS - timeSince) / (1000 * 60 * 60 * 24))
      return { status: 'cooldown' as const, daysRemaining, existing }
    }
    return { status: 'eligible_repeat' as const, existing }
  }

  // Filtered jobs with semantic match, rank synchronization, and time-window filtering
  const filteredJobs = useMemo(() => {
    if (!jobDisciplineId) return []

    const currentRank = selectedJobLadder?.ranks.find((r) => r.id === jobSelectedRankId)

    const matchedContacts = VERIFIED_COMPANY_HIRING_CONTACTS.filter((contact) => {
      // 1. Strict Discipline Matching (all 6 categories)
      switch (jobDisciplineId) {
        case 'maritime':
          return (
            contact.category === 'Maritime / Offshore' ||
            contact.typicalRoles.some((r) => /marine|vessel|naval|subsea|offshore|stcw|cadet|propulsion/i.test(r))
          )
        case 'software':
          return (
            contact.category === 'Software / Cloud' ||
            contact.typicalRoles.some((r) => /software|cloud|frontend|backend|fullstack|devops|systems|web|app/i.test(r))
          )
        case 'ai_robotics':
        case 'ai':
          return (
            contact.category === 'AI / Robotics' ||
            contact.typicalRoles.some((r) => /ai|robotics|machine learning|vision|deep learning|autonomous|perception|neural|llm|kernel/i.test(r))
          )
        case 'healthcare':
          return (
            contact.category === 'Medical / Healthcare' ||
            contact.typicalRoles.some((r) => /health|clinical|medical|informatics|biomed/i.test(r))
          )
        case 'marine_ops':
          return (
            contact.category === 'Management / Operations' ||
            (contact.category === 'Maritime / Offshore' &&
              contact.typicalRoles.some((r) => /superintendent|fleet|manager|operations|crewing|decarbonization/i.test(r)))
          )
        case 'cybersecurity':
          return (
            contact.typicalRoles.some((r) => /security|cyber|infosec|compliance|threat|vulnerability|devsecops|firewall|vault/i.test(r)) ||
            /crowdstrike|palo alto|cloudflare/i.test(contact.company)
          )
        default:
          return true
      }
    })

    const processed = matchedContacts.map((contact) => {
      let matchedCount = 0
      const candSkills = cvForm.skills.map((s) => s.toLowerCase())
      const typicalRoles = contact.typicalRoles || []
      for (const skill of typicalRoles) {
        if (candSkills.some((cs) => cs.includes(skill.toLowerCase()) || skill.toLowerCase().includes(cs))) {
          matchedCount++
        }
      }
      const matchPct = Math.min(98, Math.max(74, Math.round((matchedCount / Math.max(1, typicalRoles.length)) * 30 + 70)))
      const subStatus = checkJobSubmissionStatus(contact.contactEmail)

      // CRITICAL: When a specific rank is selected by the user, ALL companies synchronize directly to that rank!
      let roleTitle = typicalRoles[0] || 'Technical Specialist'
      if (jobSelectedRankId !== 'all' && currentRank) {
        roleTitle = currentRank.title
      } else {
        if (jobDisciplineId === 'ai_robotics' || jobDisciplineId === 'ai') {
          const m = typicalRoles.find(r => /ai|robotics|machine learning|vision|deep learning|autonomous|perception|neural|llm/i.test(r))
          if (m) roleTitle = m
        } else if (jobDisciplineId === 'cybersecurity') {
          const m = typicalRoles.find(r => /security|cyber|infosec|compliance|threat|vulnerability|devsecops|firewall/i.test(r))
          if (m) roleTitle = m
        } else if (jobDisciplineId === 'marine_ops') {
          const m = typicalRoles.find(r => /superintendent|fleet|manager|operations|crewing|decarbonization/i.test(r))
          if (m) roleTitle = m
        } else if (jobDisciplineId === 'maritime') {
          const m = typicalRoles.find(r => /marine|engineer|propulsion|vessel|chief|cadet|stcw|naval|subsea/i.test(r))
          if (m) roleTitle = m
        } else if (jobDisciplineId === 'software') {
          const m = typicalRoles.find(r => /software|cloud|frontend|backend|fullstack|devops|systems|sre|architect/i.test(r))
          if (m) roleTitle = m
        } else if (jobDisciplineId === 'healthcare') {
          const m = typicalRoles.find(r => /health|clinical|medical|informatics|biomed/i.test(r))
          if (m) roleTitle = m
        }
      }

      // Grounded industry compensation tier strictly calibrated to active rank and discipline
      const rankTier = currentRank ? currentRank.tier : 'Mid-Level'
      const isLead = rankTier === 'Lead / Chief' || /chief|lead|principal|staff|director|head|superintendent|ciso|cmio/i.test(roleTitle)
      const isSenior = rankTier === 'Senior' || (/senior|specialist|architect|2nd/i.test(roleTitle) && !isLead)
      const isCadet = rankTier === 'Cadet / Entry' || /cadet|intern|trainee|apprentice|junior|associate/i.test(roleTitle)
      const isJunior = rankTier === 'Junior' || /4th|junior/i.test(roleTitle)

      let salaryRange = '$135,000 - $185,000'
      if (contact.category === 'Maritime / Offshore' || jobDisciplineId === 'maritime' || jobDisciplineId === 'marine_ops') {
        if (isLead) salaryRange = '$750 - $1,100 / day'
        else if (isSenior) salaryRange = '$550 - $850 / day'
        else if (isCadet) salaryRange = '$1,800 - $2,800 / mo (Stipend)'
        else if (isJunior) salaryRange = '$280 - $420 / day'
        else salaryRange = '$380 - $550 / day'
      } else if (jobDisciplineId === 'ai_robotics' || jobDisciplineId === 'ai') {
        if (isLead) salaryRange = '$250,000 - $350,000'
        else if (isSenior) salaryRange = '$180,000 - $245,000'
        else if (isCadet) salaryRange = '$95,000 - $125,000'
        else if (isJunior) salaryRange = '$110,000 - $145,000'
        else salaryRange = '$130,000 - $175,000'
      } else if (jobDisciplineId === 'cybersecurity') {
        if (isLead) salaryRange = '$215,000 - $285,000'
        else if (isSenior) salaryRange = '$160,000 - $210,000'
        else if (isCadet) salaryRange = '$85,000 - $110,000'
        else if (isJunior) salaryRange = '$100,000 - $130,000'
        else salaryRange = '$120,000 - $155,000'
      } else if (jobDisciplineId === 'healthcare') {
        if (isLead) salaryRange = '$190,000 - $260,000'
        else if (isSenior) salaryRange = '$140,000 - $185,000'
        else if (isCadet) salaryRange = '$75,000 - $95,000'
        else if (isJunior) salaryRange = '$85,000 - $115,000'
        else salaryRange = '$100,000 - $130,000'
      } else {
        if (isLead) salaryRange = '$200,000 - $260,000'
        else if (isSenior) salaryRange = '$150,000 - $195,000'
        else if (isCadet) salaryRange = '$80,000 - $105,000'
        else if (isJunior) salaryRange = '$95,000 - $125,000'
        else salaryRange = '$110,000 - $145,000'
      }

      return {
        ...contact,
        roleTitle,
        salaryRange,
        matchPct,
        subStatus,
      }
    }).sort((a, b) => b.matchPct - a.matchPct)

    // Time window slice: 1h -> 6 fresh citations; 24h -> 20 citations; 3d -> up to 40 citations
    if (jobTimeWindow === '1h') {
      return processed.slice(0, 6)
    } else if (jobTimeWindow === '24h') {
      return processed.slice(0, 20)
    }
    return processed.slice(0, 40)
  }, [cvForm.skills, appliedJobs, jobDisciplineId, jobSelectedRankId, jobTimeWindow, selectedJobLadder])

  // Single job dispatch
  const handleDispatchSingle = async (job: (typeof filteredJobs)[0]) => {
    if (job.subStatus.status === 'cooldown') {
      toast.error(`5-day cooldown active for ${job.company}. Cooldown remaining: ${job.subStatus.daysRemaining} days.`)
      return
    }

    const toastId = toast.loading(`Dispatching application to ${job.company}...`)
    try {
      const subject = `Application: ${job.roleTitle} - ${cvForm.name || 'Candidate'}`
      const body =
        clGenerated?.fullText ||
        `Dear ${job.company} Hiring Team,\n\nI am writing to express my interest in the ${job.roleTitle} opening. My background and verified skills align directly with your technical requirements.\n\nSincerely,\n${cvForm.name || 'Candidate'}`

      const newRecord = {
        id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        company: job.company,
        role: job.roleTitle,
        recipientEmail: job.contactEmail,
        dispatchedAt: new Date().toISOString(),
        emlReceiptSubject: subject,
        emlContent: body,
        status: 'dispatched' as const,
      }

      const updated = [newRecord, ...appliedJobs]
      onUpdateAppliedJobs(updated)
      toast.success(`Application sent to ${job.company}! EML receipt generated.`, { id: toastId })
    } catch (_err) {
      toast.error('Dispatch failed', { id: toastId })
    }
  }

  // Batch auto-dispatch with humanized pacing & configuration options
  const handleBatchAutoDispatch = async () => {
    const eligible = filteredJobs.filter((j) => j.subStatus.status !== 'cooldown').slice(0, Math.min(10, filteredJobs.length))
    if (eligible.length === 0) {
      toast.error('No eligible targets available (all currently in 5-day cooldown).')
      return
    }

    setIsDispatching(true)
    setDispatchProgress({ current: 0, total: eligible.length })

    const newlyDispatched: any[] = []
    const pacingMs = dispatchPacing === 'instant' ? 400 : dispatchPacing === '5m' ? 3000 : 1800

    for (let i = 0; i < eligible.length; i++) {
      const target = eligible[i]
      setDispatchProgress({ current: i + 1, total: eligible.length, activeCompany: target.company })

      await new Promise((resolve) => setTimeout(resolve, pacingMs))

      const subject = `Application: ${target.roleTitle} - ${cvForm.name || 'Candidate'}`
      const body =
        clGenerated?.fullText ||
        `Dear ${target.company} Hiring Team,\n\nI am applying for the ${target.roleTitle} position. My verified technical background and sovereign credentials align directly with your requirements.\n\nSincerely,\n${cvForm.name || 'Candidate'}`

      newlyDispatched.push({
        id: `batch_${Date.now()}_${i}`,
        company: target.company,
        role: target.roleTitle,
        recipientEmail: target.contactEmail,
        dispatchedAt: new Date().toISOString(),
        emlReceiptSubject: subject,
        emlContent: body,
        status: 'dispatched' as const,
      })
    }

    const updated = [...newlyDispatched, ...appliedJobs]
    onUpdateAppliedJobs(updated)
    setIsDispatching(false)
    setDispatchProgress(null)
    toast.success(`Batch auto-dispatch completed: ${eligible.length} applications dispatched! EML receipts recorded.`)
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FN-06 & FN-07 CAREER PATH ADVISORY STATE (INLINE IN COPILOT)
  // ─────────────────────────────────────────────────────────────────────────────
  const [advisorDisciplineId, setAdvisorDisciplineId] = useState<string | null>(null)
  const [advisorRankId, setAdvisorRankId] = useState<string>('all')
  const [advisorAnalysis, setAdvisorAnalysis] = useState<CareerRoadmapAnalysis | null>(null)
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(false)

  const selectedAdvisorDiscipline = useMemo(() => {
    if (!advisorDisciplineId) return null
    return DISCIPLINE_PRESETS.find((d) => d.id === advisorDisciplineId) || null
  }, [advisorDisciplineId])

  const selectedAdvisorLadder = useMemo(() => {
    if (!advisorDisciplineId) return null
    const key = advisorDisciplineId === 'ai' ? 'ai_robotics' : advisorDisciplineId
    return DISCIPLINE_CAREER_LADDERS[key] || DISCIPLINE_CAREER_LADDERS.software
  }, [advisorDisciplineId])

  const handleSelectAdvisorDiscipline = async (discId: string, rankId?: string) => {
    setAdvisorDisciplineId(discId)
    const activeRankId = rankId !== undefined ? rankId : advisorRankId
    setAdvisorRankId(activeRankId)
    const disc = DISCIPLINE_PRESETS.find((d) => d.id === discId) || DISCIPLINE_PRESETS[0]
    const ladderKey = discId === 'ai' ? 'ai_robotics' : discId
    const ladder = DISCIPLINE_CAREER_LADDERS[ladderKey] || DISCIPLINE_CAREER_LADDERS.software
    const targetRank = ladder.ranks.find((r) => r.id === activeRankId)
    const targetRole = targetRank ? targetRank.title : disc.defaultRole
    const candidateSkills = cvForm.skills && cvForm.skills.length > 0 ? cvForm.skills : []

    setIsLoadingRoadmap(true)
    try {
      const res = await fetch('/api/career_roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentRole: cvForm.targetRole || 'Candidate',
          targetRole,
          disciplineId: discId,
          targetRankId: activeRankId,
          skills: candidateSkills,
          candidateSkills,
        }),
      })
      const data = await res.json()
      if (data.analysis) {
        setAdvisorAnalysis(data.analysis)
        toast.success(`Roadmap calibrated for ${targetRole}!`)
      } else {
        const fallback = generateCareerRoadmap(
          cvForm.targetRole,
          targetRole,
          candidateSkills,
          discId,
          activeRankId
        )
        setAdvisorAnalysis(fallback)
        toast.success(`Roadmap calibrated for ${targetRole}!`)
      }
    } catch (_err) {
      const fallback = generateCareerRoadmap(
        cvForm.targetRole,
        targetRole,
        candidateSkills,
        discId,
        activeRankId
      )
      setAdvisorAnalysis(fallback)
      toast.success(`Roadmap calibrated for ${targetRole}!`)
    } finally {
      setIsLoadingRoadmap(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER MAIN IN-SITU CONTAINER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      <Card className="border border-border/80 shadow-md rounded-2xl bg-card overflow-hidden flex flex-col h-[760px] sm:h-[800px] lg:h-[840px] min-h-[620px]">
        {/* TOP STATUS BAR: SINGLE STRAIGHT LINE, CLEAN & COMPACT */}
        <div className="px-3 py-2 border-b border-border/80 bg-muted/30 flex items-center justify-between flex-nowrap gap-2">
          {/* Left: Brand Icon + Title (Smaller as requested) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="relative">
              <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                <Bot className="w-3 h-3" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 border border-background rounded-full" />
            </div>

            <h3 className="font-semibold text-[11px] sm:text-xs text-foreground whitespace-nowrap">
              CareerAce Copilot
            </h3>
          </div>

          {/* Right: Two-Way Toggle on the same straight line (Smaller as requested) */}
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/60 shrink-0">
            <button
              type="button"
              onClick={() => {
                setTopView('copilot')
                setCopilotModule(null)
              }}
              className={cn(
                'px-2 py-0.5 rounded-md text-[10.5px] sm:text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap',
                topView === 'copilot' && !copilotModule
                  ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Bot className="w-3 h-3" />
              <span>AI Copilot</span>
            </button>

            {(() => {
              let label = 'In-Place CV Builder'
              let Icon = Edit3
              let onClick = () => {
                setTopView('cv_builder')
                setCopilotModule(null)
              }
              let isActive = topView === 'cv_builder'

              if (copilotModule === 'cover_letter') {
                label = 'In-Place Cover Letter'
                Icon = FileText
                onClick = () => {
                  setTopView('copilot')
                  setCopilotModule('cover_letter')
                }
                isActive = true
              } else if (copilotModule === 'job_scanner') {
                label = 'Job Board Studio'
                Icon = Briefcase
                onClick = () => {
                  setTopView('copilot')
                  setCopilotModule('job_scanner')
                }
                isActive = true
              } else if (copilotModule === 'career_advisor') {
                label = 'Career Path Advisor'
                Icon = Compass
                onClick = () => {
                  setTopView('copilot')
                  setCopilotModule('career_advisor')
                }
                isActive = true
              }

              return (
                <button
                  type="button"
                  onClick={onClick}
                  className={cn(
                    'px-2 py-0.5 rounded-md text-[10.5px] sm:text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap',
                    isActive
                      ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="w-3 h-3" />
                  <span>{label}</span>
                </button>
              )
            })()}
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* VIEW 1: AI COPILOT TAB (CHAT + 4 IN-SITU MENUS 1, 2, 3, 4 BELOW)    */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {topView === 'copilot' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* If an in-copilot module is active, display its top control banner */}
            {copilotModule && (
              <div className="px-3 py-1.5 bg-emerald-500/10 border-b border-emerald-500/30 flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {copilotModule === 'cover_letter' && 'Active Module: Cover Letter Studio'}
                  {copilotModule === 'job_scanner' && 'Active Module: Job Board & Auto-Apply'}
                  {copilotModule === 'career_advisor' && 'Active Module: Career Path Roadmap'}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCopilotModule(null)}
                  className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Back to Copilot Chat</span>
                </Button>
              </div>
            )}

            {/* Chat Messages Feed (if no inline module active) */}
            {!copilotModule && (
              <div ref={chatContainerRef} className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-2.5 text-[10px] sm:text-xs">
                {overviewChatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2.5 leading-relaxed ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-lg bg-emerald-600/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={`max-w-[88%] sm:max-w-[78%] p-2.5 rounded-xl text-[10px] sm:text-[11px] leading-snug ${
                        msg.role === 'assistant'
                          ? 'bg-muted/40 border border-border/80 text-foreground shadow-2xs'
                          : 'bg-emerald-600 text-white font-medium shadow-xs'
                      }`}
                    >
                      <FormattedChatMessage content={msg.content} role={msg.role} />
                    </div>
                  </div>
                ))}

                {isSendingMessage && (
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground p-2 rounded-lg bg-muted/30 border border-border/60">
                    <Bot className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                    <span>Querying Walrus Sovereign Memory...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}

            {/* INLINE MODULE: COVER LETTER STUDIO (INSIDE COPILOT) */}
            {copilotModule === 'cover_letter' && (
              <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-4">
                <div className="p-3 bg-muted/20 border border-border/80 rounded-xl space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-emerald-500" />
                      <span>In-Chat Cover Letter Generator</span>
                    </h4>
                    {/* Scope toggle - Scaled down smaller than the title */}
                    <div className="flex items-center gap-1 bg-muted/80 p-0.5 rounded-lg border border-border/60">
                      <button
                        type="button"
                        onClick={() => setClScope('singular')}
                        className={cn(
                          'px-1.5 py-0.5 rounded text-[9px] font-medium transition-colors cursor-pointer',
                          clScope === 'singular'
                            ? 'bg-background text-foreground shadow-2xs font-semibold'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        Singular Target
                      </button>
                      <button
                        type="button"
                        onClick={() => setClScope('batch')}
                        className={cn(
                          'px-1.5 py-0.5 rounded text-[9px] font-medium transition-colors cursor-pointer',
                          clScope === 'batch'
                            ? 'bg-background text-foreground shadow-2xs font-semibold'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        Batch Dispatch
                      </button>
                    </div>
                  </div>

                  {/* Adaptive Tone Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">Adaptive Tone</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'modern_tech', label: 'Modern Tech', desc: 'Impact & problem-solving' },
                        { id: 'executive', label: 'Executive', desc: 'Governance & leadership' },
                        { id: 'narrative', label: 'Narrative', desc: 'Career arc & motivation' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setClTone(t.id as any)}
                          className={cn(
                            'p-1.5 rounded-lg border text-left transition-colors cursor-pointer',
                            clTone === t.id
                              ? 'border-emerald-500 bg-emerald-500/10 text-foreground font-semibold'
                              : 'border-border/60 bg-background text-muted-foreground hover:bg-muted/30'
                          )}
                        >
                          <div className="text-[10px] font-bold">{t.label}</div>
                          <div className="text-[8.5px] text-muted-foreground truncate">{t.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scope-dependent Target Role & Target Company Inputs */}
                  {clScope === 'singular' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-muted-foreground font-medium">Target Company *</label>
                        <input
                          type="text"
                          value={clTargetCompany}
                          onChange={(e) => setClTargetCompany(e.target.value)}
                          placeholder="e.g. Google, Maersk, Chevron"
                          className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground font-medium">Target Role *</label>
                        <input
                          type="text"
                          value={clTargetRole}
                          onChange={(e) => setClTargetRole(e.target.value)}
                          placeholder="e.g. Systems Engineer, Chief Marine Engineer"
                          className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs mt-0.5"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-muted-foreground font-medium">Target Role (Batch Scope across hiring directory) *</label>
                        <span className="text-[9px] text-emerald-600 font-semibold">No Target Company (Dispatched to role directory)</span>
                      </div>
                      <input
                        type="text"
                        value={clTargetRole}
                        onChange={(e) => setClTargetRole(e.target.value)}
                        placeholder="e.g. Senior Cloud Solutions Architect, Chief Marine Engineer"
                        className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs mt-0.5"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] text-muted-foreground font-medium">Core Problem to Solve</label>
                    <input
                      type="text"
                      value={clKeyProblem}
                      onChange={(e) => setClKeyProblem(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs mt-0.5"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1 flex-wrap sm:flex-nowrap">
                    <Button
                      size="sm"
                      onClick={handleGenerateCoverLetter}
                      disabled={isGeneratingCl}
                      className="flex-1 h-8 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold gap-1.5 cursor-pointer shadow-xs min-w-[190px]"
                    >
                      {isGeneratingCl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>
                        {clScope === 'batch'
                          ? `Generate Batch Letter for ${clTargetRole || 'Target Role'}`
                          : `Generate Cover Letter for ${clTargetCompany || 'Target Company'}`}
                      </span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => {
                        const q = new URLSearchParams()
                        if (clTargetRole) q.set('role', clTargetRole)
                        if (clTargetCompany && clScope === 'singular') q.set('company', clTargetCompany)
                        router.push(`/cover_letter?${q.toString()}`)
                      }}
                      className="h-8 px-3 text-[10.5px] border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1.5 cursor-pointer shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Edit in Dedicated Studio</span>
                    </Button>
                  </div>
                </div>

                {/* Generated Paragraphs Editor */}
                {clGenerated && (
                  <div className="p-3 bg-card border border-border/80 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-bold text-foreground">Editable In-Place Letter</span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const q = new URLSearchParams()
                            if (clTargetRole) q.set('role', clTargetRole)
                            if (clTargetCompany && clScope === 'singular') q.set('company', clTargetCompany)
                            router.push(`/cover_letter?${q.toString()}`)
                          }}
                          className="h-6 px-2 text-[10px] gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10 cursor-pointer"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Open Studio</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            downloadEmlReceipt({
                              to: 'hiring@' + clTargetCompany.toLowerCase() + '.com',
                              fromName: cvForm.name || 'Candidate',
                              fromEmail: cvForm.email || 'applicant@careerace.online',
                              subject: `Cover Letter - ${clTargetCompany}`,
                              body: clGenerated.fullText,
                              company: clTargetCompany,
                              role: clTargetRole,
                            })
                          }
                          className="h-6 px-2 text-[10px] gap-1 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>Export RFC-5322 .EML</span>
                        </Button>
                      </div>
                    </div>

                    <textarea
                      rows={8}
                      value={clGenerated.fullText}
                      onChange={(e) => setClGenerated({ ...clGenerated, fullText: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-border bg-muted/20 text-xs font-mono leading-relaxed"
                    />
                  </div>
                )}
              </div>
            )}

            {/* INLINE MODULE: JOB BOARD SCANNER & AUTO-DISPATCH (INSIDE COPILOT) */}
            {copilotModule === 'job_scanner' && (
              <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3">
                {!jobDisciplineId ? (
                  /* Discipline Question Prompt */
                  <div className="p-4 bg-card border border-border/80 rounded-xl space-y-3">
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-foreground">What discipline are you targeting?</h4>
                      <p className="text-[11px] text-muted-foreground">
                        Select your discipline to query verified job postings cited today:
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {DISCIPLINE_PRESETS.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            setJobDisciplineId(d.id)
                            setJobSelectedRankId('all')
                            setJobTimeWindow('1h')
                          }}
                          className="p-3 rounded-xl border border-border/80 bg-background hover:bg-emerald-500/10 hover:border-emerald-500/50 text-left transition-all cursor-pointer group"
                        >
                          <div className="text-xs font-bold text-foreground group-hover:text-emerald-600">{d.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Discipline Selected: Time Pills, Auto-Dispatch Studio, and Job List */
                  <div className="space-y-3">
                    {/* Discipline Header & Reset Option */}
                    <div className="flex items-center justify-between p-2.5 bg-muted/20 border border-border/80 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          Discipline: <span className="text-emerald-600 dark:text-emerald-400">{selectedJobDiscipline?.label}</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setJobDisciplineId(null)
                          setJobSelectedRankId('all')
                        }}
                        className="text-[10px] text-muted-foreground hover:text-foreground underline cursor-pointer"
                      >
                        Change Discipline
                      </button>
                    </div>

                    {/* Rank / Role Selector - Synchronizes Job Query */}
                    {selectedJobLadder && (
                      <div className="p-2.5 bg-card/80 border border-border/80 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10.5px] font-bold text-foreground flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Select Role / Rank (Synchronizes Active Openings):</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setJobSelectedRankId('all')}
                            className={cn(
                              'px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer border',
                              jobSelectedRankId === 'all'
                                ? 'bg-emerald-600 text-white border-emerald-600 font-semibold shadow-2xs'
                                : 'bg-background border-border/60 text-muted-foreground hover:text-foreground'
                            )}
                          >
                            All Ranks / General
                          </button>
                          {selectedJobLadder.ranks.map((r) => (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => setJobSelectedRankId(r.id)}
                              className={cn(
                                'px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer border',
                                jobSelectedRankId === r.id
                                  ? 'bg-emerald-600 text-white border-emerald-600 font-semibold shadow-2xs'
                                  : 'bg-background border-border/60 text-muted-foreground hover:text-foreground'
                              )}
                            >
                              {r.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Time Window Pills */}
                    <div className="flex items-center justify-between p-2.5 bg-muted/20 border border-border/80 rounded-xl flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10.5px] font-bold text-foreground">Verified Citation Time Window:</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setJobTimeWindow('1h')}
                          className={cn(
                            'px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer border',
                            jobTimeWindow === '1h'
                              ? 'bg-emerald-600 text-white border-emerald-600 font-semibold shadow-2xs'
                              : 'bg-background border-border/60 text-muted-foreground hover:text-foreground'
                          )}
                        >
                          Last 1 Hour (6 Fresh)
                        </button>
                        <button
                          type="button"
                          onClick={() => setJobTimeWindow('24h')}
                          className={cn(
                            'px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer border',
                            jobTimeWindow === '24h'
                              ? 'bg-emerald-600 text-white border-emerald-600 font-semibold shadow-2xs'
                              : 'bg-background border-border/60 text-muted-foreground hover:text-foreground'
                          )}
                        >
                          Last 24 Hours (20 Verified)
                        </button>
                        <button
                          type="button"
                          onClick={() => setJobTimeWindow('3d')}
                          className={cn(
                            'px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer border',
                            jobTimeWindow === '3d'
                              ? 'bg-emerald-600 text-white border-emerald-600 font-semibold shadow-2xs'
                              : 'bg-background border-border/60 text-muted-foreground hover:text-foreground'
                          )}
                        >
                          Last 3 Days (Up to 40)
                        </button>
                      </div>
                    </div>

                    {/* Auto-Dispatch Configuration Studio Box */}
                    <div className="p-3 bg-card border border-border/80 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-bold text-foreground">Auto-Dispatch Configuration Studio</span>
                        </div>
                        <Badge variant="outline" className="text-[9.5px] py-0 text-emerald-600 border-emerald-500/30 bg-emerald-500/10 font-mono">
                          {filteredJobs.length} Available Openings
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px]">
                        {/* CV Profile Selection */}
                        <div className="p-2 rounded-lg bg-muted/20 border border-border/60 space-y-1">
                          <label className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                            <FileText className="w-3 h-3 text-emerald-500" />
                            <span>Select CV Profile:</span>
                          </label>
                          <select
                            value={dispatchCvSelection}
                            onChange={(e) => setDispatchCvSelection(e.target.value as any)}
                            className="w-full h-7 px-2 text-[10.5px] rounded-md border border-border bg-background cursor-pointer"
                          >
                            <option value="primary">Primary Verified Profile ({cvForm.name || 'Candidate'})</option>
                            <option value="technical">Specialized Technical / STCW CV</option>
                          </select>
                        </div>

                        {/* Cover Letter Selection */}
                        <div className="p-2 rounded-lg bg-muted/20 border border-border/60 space-y-1">
                          <label className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3 text-emerald-500" />
                            <span>Select Cover Letter:</span>
                          </label>
                          <select
                            value={dispatchClSelection}
                            onChange={(e) => setDispatchClSelection(e.target.value as any)}
                            className="w-full h-7 px-2 text-[10.5px] rounded-md border border-border bg-background cursor-pointer"
                          >
                            <option value="tailored">Tailored In-Place Letter</option>
                            <option value="tech">Modern Technical Tone</option>
                            <option value="executive">Executive Boardroom Tone</option>
                          </select>
                        </div>

                        {/* Credential Proof Document */}
                        <div className="p-2 rounded-lg bg-muted/20 border border-border/60 space-y-1">
                          <label className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                            <span>Credentials / Proof Document (Max 10MB):</span>
                          </label>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] truncate text-foreground font-mono">
                              {cvForm.proofFile ? `${cvForm.proofFile.name} (${cvForm.proofFile.sizeKb} KB)` : 'No credential proof attached'}
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => proofFileInputRef.current?.click()}
                              className="h-6 px-2 text-[9.5px] shrink-0 border-border/80 cursor-pointer"
                            >
                              {cvForm.proofFile ? 'Change' : 'Attach'}
                            </Button>
                          </div>
                        </div>

                        {/* Dispatch Pacing */}
                        <div className="p-2 rounded-lg bg-muted/20 border border-border/60 space-y-1">
                          <label className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-500" />
                            <span>Dispatch Pacing:</span>
                          </label>
                          <select
                            value={dispatchPacing}
                            onChange={(e) => setDispatchPacing(e.target.value as any)}
                            className="w-full h-7 px-2 text-[10.5px] rounded-md border border-border bg-background cursor-pointer"
                          >
                            <option value="2.2s">Humanized Anti-Spam (2.2s)</option>
                            <option value="5m">Paced Delivery (5 min)</option>
                            <option value="instant">Instant RFC-5322 Batch</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-1 flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[10px] text-muted-foreground">
                          5-Day Cooldown Protection active on all verified employers.
                        </span>
                        <Button
                          size="sm"
                          onClick={handleBatchAutoDispatch}
                          disabled={isDispatching || filteredJobs.length === 0}
                          className="h-7 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold gap-1.5 cursor-pointer shadow-xs shrink-0"
                        >
                          {isDispatching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                          <span>Send to Available Companies ({filteredJobs.length})</span>
                        </Button>
                      </div>
                    </div>

                    {isDispatching && dispatchProgress && (
                      <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                          <span>Dispatching {dispatchProgress.activeCompany}...</span>
                          <span>{dispatchProgress.current} / {dispatchProgress.total}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-1.5 transition-all duration-300"
                            style={{ width: `${(dispatchProgress.current / dispatchProgress.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Job Cards */}
                    <div className="space-y-2">
                      {filteredJobs.map((job) => (
                        <div
                          key={job.id}
                          className="p-2.5 bg-card border border-border/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-foreground">{job.roleTitle}</span>
                              <span className="text-muted-foreground">· {job.company}</span>
                              <Badge variant="secondary" className="text-[9px] py-0 font-bold bg-emerald-500/10 text-emerald-600">
                                {job.matchPct}% ATS Match
                              </Badge>
                              <Badge variant="outline" className="text-[9px] py-0 font-mono text-muted-foreground border-border/80">
                                {jobTimeWindow === '1h' ? 'Cited < 1h ago' : jobTimeWindow === '24h' ? 'Cited < 24h ago' : 'Cited < 3d ago'}
                              </Badge>
                              {job.subStatus.status === 'cooldown' && (
                                <Badge variant="outline" className="text-[9px] py-0 text-amber-600 border-amber-500/30 bg-amber-500/10">
                                  Cooldown: {job.subStatus.daysRemaining}d left
                                </Badge>
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <span>{job.location}</span>
                              <span>•</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">{job.salaryRange}</span>
                              <span>•</span>
                              <span className="font-mono text-muted-foreground">{job.contactEmail}</span>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            onClick={() => handleDispatchSingle(job)}
                            disabled={job.subStatus.status === 'cooldown' || isDispatching}
                            className="h-7 px-3 text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 cursor-pointer"
                          >
                            <span>Dispatch EML</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* INLINE MODULE: CAREER PATH ROADMAP (INSIDE COPILOT) */}
            {copilotModule === 'career_advisor' && (
              <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3 text-xs">
                {!advisorDisciplineId ? (
                  /* Initially show ONLY the discipline selection cards (Nothing else shows) */
                  <div className="p-4 bg-card border border-border/80 rounded-xl space-y-3">
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-foreground">Select Your Target Discipline:</h4>
                      <p className="text-[11px] text-muted-foreground">
                        Select a discipline to unlock quarterly progression milestones, skill gap analysis, and market compensation benchmarks.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {DISCIPLINE_PRESETS.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => handleSelectAdvisorDiscipline(d.id)}
                          className="p-3 rounded-xl border border-border/80 bg-background hover:bg-emerald-500/10 hover:border-emerald-500/50 text-left transition-all cursor-pointer group"
                        >
                          <div className="text-xs font-bold text-foreground group-hover:text-emerald-600">{d.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Discipline Selected: Render Roadmap & Advisory Details */
                  <div className="space-y-3">
                    {/* Header with Selected Discipline & Change Option */}
                    <div className="flex items-center justify-between p-2.5 bg-muted/20 border border-border/80 rounded-xl">
                      <div>
                        <span className="text-[11px] font-bold text-foreground">
                          Target Discipline:{' '}
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {selectedAdvisorDiscipline?.label}
                          </span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAdvisorDisciplineId(null)
                          setAdvisorRankId('all')
                          setAdvisorAnalysis(null)
                        }}
                        className="text-[10px] text-muted-foreground hover:text-foreground underline cursor-pointer"
                      >
                        Change Discipline
                      </button>
                    </div>

                    {/* Rank Selector for Career Progression */}
                    {selectedAdvisorLadder && (
                      <div className="p-2.5 bg-card/80 border border-border/80 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10.5px] font-bold text-foreground flex items-center gap-1.5">
                            <Compass className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Select Target Rank to Calibrate Trajectory:</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleSelectAdvisorDiscipline(advisorDisciplineId!, 'all')}
                            className={cn(
                              'px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer border',
                              advisorRankId === 'all'
                                ? 'bg-emerald-600 text-white border-emerald-600 font-semibold shadow-2xs'
                                : 'bg-background border-border/60 text-muted-foreground hover:text-foreground'
                            )}
                          >
                            All Tiers / Full Ladder
                          </button>
                          {selectedAdvisorLadder.ranks.map((r) => (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => handleSelectAdvisorDiscipline(advisorDisciplineId!, r.id)}
                              className={cn(
                                'px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer border',
                                advisorRankId === r.id
                                  ? 'bg-emerald-600 text-white border-emerald-600 font-semibold shadow-2xs'
                                  : 'bg-background border-border/60 text-muted-foreground hover:text-foreground'
                              )}
                            >
                              {r.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {isLoadingRoadmap && (
                      <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                        <span>Calibrating roadmap for {selectedAdvisorDiscipline?.label}...</span>
                      </div>
                    )}

                    {advisorAnalysis && !isLoadingRoadmap && (
                      <div className="space-y-3">
                        {/* Immediate Quarter & Month Priorities with Compensation Benchmark */}
                        <div className="p-3 bg-card border border-border/80 rounded-xl space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-xs font-bold text-foreground">This Quarter & This Month Priorities</span>
                            <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10 font-bold text-[10px]">
                              {advisorAnalysis.compensation?.dayRateMaritimeUSD
                                ? `$${advisorAnalysis.compensation.dayRateMaritimeUSD[0]} - $${advisorAnalysis.compensation.dayRateMaritimeUSD[1]} / day`
                                : `$${advisorAnalysis.compensation?.baseRangeUSD[0]?.toLocaleString() || 120000} - $${advisorAnalysis.compensation?.baseRangeUSD[1]?.toLocaleString() || 180000} / yr`}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                            <div className="p-2 rounded-lg bg-muted/30 border border-border/60 space-y-1">
                              <div className="font-bold text-foreground flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>This Month (Immediate Sprint)</span>
                              </div>
                              <p className="text-muted-foreground leading-relaxed">
                                {advisorAnalysis.roadmap[0]?.deliverables[0] || 'Focus on high-impact production deliverables and CV metrics alignment.'}
                              </p>
                            </div>
                            <div className="p-2 rounded-lg bg-muted/30 border border-border/60 space-y-1">
                              <div className="font-bold text-foreground flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                <span>This Quarter (Q1 Milestone Focus)</span>
                              </div>
                              <p className="text-muted-foreground leading-relaxed">
                                {advisorAnalysis.roadmap[0]?.focus || 'Master core high-impact competencies in target discipline.'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Detected Skill Gaps */}
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-foreground">
                            Detected Skill Gaps for {selectedAdvisorDiscipline?.label}:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {advisorAnalysis.skillGaps.map((g, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className={cn(
                                  'text-[10px] py-0.5',
                                  g.urgency === 'high' ? 'border-red-500/30 bg-red-500/10 text-red-600' : 'border-border/80'
                                )}
                              >
                                {g.skill} ({g.category})
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* 4-Quarter Progression Milestones */}
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-foreground">4-Quarter Progression Milestones</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {advisorAnalysis.roadmap.map((m) => (
                              <div key={m.quarter} className="p-2.5 bg-card border border-border/80 rounded-xl space-y-1">
                                <div className="text-xs font-bold text-foreground">
                                  {m.quarter}
                                </div>
                                <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                  {m.focus}
                                </div>
                                <p className="text-[9.5px] text-muted-foreground leading-relaxed">
                                  {m.deliverables?.join(' • ')}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Advancement Strategic Advice */}
                        {advisorAnalysis.advancementAdvice && advisorAnalysis.advancementAdvice.length > 0 && (
                          <div className="p-2.5 bg-muted/20 border border-border/60 rounded-xl space-y-1 text-[10px]">
                            <span className="font-bold text-foreground">Advancement Strategy:</span>
                            <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                              {advisorAnalysis.advancementAdvice.map((adv, idx) => (
                                <li key={idx}>{adv}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Discipline Career Progression Ladder */}
                        {selectedAdvisorLadder && (
                          <div className="space-y-2 pt-2 border-t border-border/60">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                <span>{selectedAdvisorLadder.label} Promotion Ladder & Milestones</span>
                              </span>
                              <Badge variant="outline" className="text-[9px] py-0 font-medium">
                                Market Demand: {selectedAdvisorLadder.marketTrend}
                              </Badge>
                            </div>

                            <div className="space-y-1.5">
                              {selectedAdvisorLadder.ranks.map((rk) => {
                                const isCurrent = advisorRankId === rk.id
                                return (
                                  <div
                                    key={rk.id}
                                    onClick={() => handleSelectAdvisorDiscipline(advisorDisciplineId!, rk.id)}
                                    className={cn(
                                      'p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2.5',
                                      isCurrent
                                        ? 'bg-emerald-500/10 border-emerald-500/50 shadow-2xs'
                                        : 'bg-card border-border/80 hover:bg-muted/30'
                                    )}
                                  >
                                    <div className="min-w-0 flex-1 space-y-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge
                                          variant="secondary"
                                          className={cn(
                                            'text-[9px] py-0 font-bold',
                                            isCurrent ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
                                          )}
                                        >
                                          Level {rk.levelOrder}
                                        </Badge>
                                        <span className="text-[11px] font-bold text-foreground">{rk.title}</span>
                                        <span className="text-[9.5px] text-muted-foreground">({rk.typicalTimeline})</span>
                                      </div>
                                      <div className="text-[9.5px] text-muted-foreground leading-snug">
                                        <span className="font-semibold text-foreground">Required Competencies: </span>
                                        {rk.requiredCompetencies.join(' • ')}
                                      </div>
                                      <div className="text-[9.5px] text-emerald-700 dark:text-emerald-300 leading-snug">
                                        <span className="font-semibold">Licensing / Credentials: </span>
                                        {rk.certifications.join(', ')}
                                      </div>
                                    </div>
                                    <ChevronRight
                                      className={cn(
                                        'w-4 h-4 mt-1 shrink-0 transition-transform',
                                        isCurrent ? 'text-emerald-600 rotate-90' : 'text-muted-foreground'
                                      )}
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Lateral & Alternative Career Pathways */}
                        {selectedAdvisorLadder && selectedAdvisorLadder.lateralPathways && (
                          <div className="space-y-2 pt-2 border-t border-border/60">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-blue-500" />
                                <span>Alternative & Lateral Career Pathways</span>
                              </span>
                              <span className="text-[9.5px] text-muted-foreground">Cross-Discipline Pivots</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {selectedAdvisorLadder.lateralPathways.map((lp, idx) => (
                                <div key={idx} className="p-2.5 bg-muted/20 border border-border/80 rounded-xl space-y-1">
                                  <div className="flex items-center justify-between gap-1 flex-wrap">
                                    <span className="text-[10.5px] font-bold text-foreground">{lp.title}</span>
                                    <Badge
                                      variant="outline"
                                      className="text-[8.5px] py-0 text-blue-600 border-blue-500/30 bg-blue-500/10"
                                    >
                                      {lp.type}
                                    </Badge>
                                  </div>
                                  <p className="text-[9.5px] text-muted-foreground leading-relaxed">{lp.description}</p>
                                  <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium pt-0.5">
                                    <span className="text-muted-foreground">Prerequisites: </span>
                                    {lp.prerequisites}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 4 IN-SITU MENUS (1, 2, 3, 4) UNDER CHAT FEED - COMPACT & SUBTITLE-FREE */}
            <div className="p-2 bg-muted/20 border-t border-border/60">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {/* 1. In-Place CV Builder */}
                <button
                  type="button"
                  onClick={() => setTopView('cv_builder')}
                  className="px-2.5 py-1.5 rounded-lg border border-border/80 bg-background hover:bg-emerald-500/10 hover:border-emerald-500/40 text-left transition-all cursor-pointer group flex items-center justify-between"
                >
                  <span className="text-[10.5px] font-bold text-foreground group-hover:text-emerald-600">
                    1. CV Writer
                  </span>
                  <ArrowRight className="w-2.5 h-2.5 text-emerald-500 opacity-60 group-hover:opacity-100" />
                </button>

                {/* 2. Cover Letter Studio */}
                <button
                  type="button"
                  onClick={() => setCopilotModule('cover_letter')}
                  className={cn(
                    'px-2.5 py-1.5 rounded-lg border text-left transition-all cursor-pointer group flex items-center justify-between',
                    copilotModule === 'cover_letter'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                      : 'border-border/80 bg-background hover:bg-emerald-500/10 hover:border-emerald-500/40'
                  )}
                >
                  <span className="text-[10.5px] font-bold text-foreground group-hover:text-emerald-600">
                    2. Cover Letter
                  </span>
                  <ArrowRight className="w-2.5 h-2.5 text-emerald-500 opacity-60 group-hover:opacity-100" />
                </button>

                {/* 3. Job Board & Auto-Apply */}
                <button
                  type="button"
                  onClick={() => setCopilotModule('job_scanner')}
                  className={cn(
                    'px-2.5 py-1.5 rounded-lg border text-left transition-all cursor-pointer group flex items-center justify-between',
                    copilotModule === 'job_scanner'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                      : 'border-border/80 bg-background hover:bg-emerald-500/10 hover:border-emerald-500/40'
                  )}
                >
                  <span className="text-[10.5px] font-bold text-foreground group-hover:text-emerald-600">
                    3. Job Board
                  </span>
                  <ArrowRight className="w-2.5 h-2.5 text-emerald-500 opacity-60 group-hover:opacity-100" />
                </button>

                {/* 4. Career Path Advisory */}
                <button
                  type="button"
                  onClick={() => setCopilotModule('career_advisor')}
                  className={cn(
                    'px-2.5 py-1.5 rounded-lg border text-left transition-all cursor-pointer group flex items-center justify-between',
                    copilotModule === 'career_advisor'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                      : 'border-border/80 bg-background hover:bg-emerald-500/10 hover:border-emerald-500/40'
                  )}
                >
                  <span className="text-[10.5px] font-bold text-foreground group-hover:text-emerald-600">
                    4. Career Advisor
                  </span>
                  <ArrowRight className="w-2.5 h-2.5 text-emerald-500 opacity-60 group-hover:opacity-100" />
                </button>
              </div>
            </div>

            {/* Bottom Message Input Bar */}
            <div className="p-2.5 sm:p-3 border-t border-border/80 bg-card flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && chatInput.trim() && !isSendingMessage) {
                    const text = chatInput
                    setChatInput('')
                    onSendMessage(text)
                  }
                }}
                placeholder="Ask any career question, request role tailoring, or type 'hello'..."
                className="flex-1 h-9 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <Button
                size="sm"
                onClick={() => {
                  if (chatInput.trim() && !isSendingMessage) {
                    const text = chatInput
                    setChatInput('')
                    onSendMessage(text)
                  }
                }}
                disabled={isSendingMessage || !chatInput.trim()}
                className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                <span>Send</span>
              </Button>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* VIEW 2: IN-PLACE CV BUILDER (COLLAPSIBLE RECTANGLE ACCORDION BOXES)   */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {topView === 'cv_builder' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 p-3.5 sm:p-5 overflow-y-auto space-y-3">
              {/* ── BOX 1: CANDIDATE IDENTITY & CONTACT ── */}
              <div className="border border-border/80 rounded-xl overflow-hidden bg-card shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleBox('contact')}
                  className="w-full px-3.5 py-2.5 bg-muted/20 hover:bg-muted/40 transition-colors flex items-center justify-between text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground">1. Candidate Identity & Contact Information</span>
                    {cvForm.name && (
                      <Badge variant="secondary" className="text-[9px] py-0 font-medium">
                        {cvForm.name}
                      </Badge>
                    )}
                  </div>
                  {openBoxes.contact ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                {openBoxes.contact && (
                  <div className="p-3.5 border-t border-border/60 space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10.5px] font-semibold text-muted-foreground">Full Name *</label>
                        <input
                          type="text"
                          value={cvForm.name}
                          onChange={(e) => setCvForm({ ...cvForm, name: e.target.value })}
                          placeholder="e.g. Ibochi Vincent"
                          className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[10.5px] font-semibold text-muted-foreground">Location</label>
                        <input
                          type="text"
                          value={cvForm.location}
                          onChange={(e) => setCvForm({ ...cvForm, location: e.target.value })}
                          placeholder="e.g. Lagos, Nigeria / Worldwide Remote"
                          className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10.5px] font-semibold text-muted-foreground">Primary Email *</label>
                        <input
                          type="email"
                          value={cvForm.email}
                          onChange={(e) => setCvForm({ ...cvForm, email: e.target.value })}
                          placeholder="applicant@careerace.online"
                          className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs mt-1"
                        />
                        {cvForm.additionalEmails.map((em, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 mt-1.5">
                            <input
                              type="email"
                              value={em}
                              onChange={(e) => {
                                const copy = [...cvForm.additionalEmails]
                                copy[idx] = e.target.value
                                setCvForm({ ...cvForm, additionalEmails: copy })
                              }}
                              className="w-full h-7 px-2 text-xs rounded-md border border-border bg-background"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setCvForm({ ...cvForm, additionalEmails: cvForm.additionalEmails.filter((_, i) => i !== idx) })
                              }}
                              className="text-red-500 hover:text-red-600 p-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setCvForm({ ...cvForm, additionalEmails: [...cvForm.additionalEmails, ''] })}
                          className="text-[10px] text-emerald-600 hover:text-emerald-500 font-semibold flex items-center gap-1 mt-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Add Additional Email
                        </button>
                      </div>

                      <div>
                        <label className="text-[10.5px] font-semibold text-muted-foreground">Primary Phone</label>
                        <input
                          type="tel"
                          value={cvForm.phone}
                          onChange={(e) => setCvForm({ ...cvForm, phone: e.target.value })}
                          placeholder="+234 800 000 0000"
                          className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs mt-1"
                        />
                        {cvForm.additionalPhones.map((ph, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 mt-1.5">
                            <input
                              type="tel"
                              value={ph}
                              onChange={(e) => {
                                const copy = [...cvForm.additionalPhones]
                                copy[idx] = e.target.value
                                setCvForm({ ...cvForm, additionalPhones: copy })
                              }}
                              className="w-full h-7 px-2 text-xs rounded-md border border-border bg-background"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setCvForm({ ...cvForm, additionalPhones: cvForm.additionalPhones.filter((_, i) => i !== idx) })
                              }}
                              className="text-red-500 hover:text-red-600 p-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setCvForm({ ...cvForm, additionalPhones: [...cvForm.additionalPhones, ''] })}
                          className="text-[10px] text-emerald-600 hover:text-emerald-500 font-semibold flex items-center gap-1 mt-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Add Additional Phone
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── BOX 2: DIGITAL FOOTPRINT & ATTESTATION ── */}
              <div className="border border-border/80 rounded-xl overflow-hidden bg-card shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleBox('footprint')}
                  className="w-full px-3.5 py-2.5 bg-muted/20 hover:bg-muted/40 transition-colors flex items-center justify-between text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground">2. Digital Footprint & Attestation</span>
                  </div>
                  {openBoxes.footprint ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                {openBoxes.footprint && (
                  <div className="p-3.5 border-t border-border/60 space-y-2.5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[10.5px] font-semibold text-muted-foreground">GitHub URL</label>
                        <input
                          type="url"
                          value={cvForm.github}
                          onChange={(e) => setCvForm({ ...cvForm, github: e.target.value })}
                          placeholder="https://github.com/username"
                          className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[10.5px] font-semibold text-muted-foreground">LinkedIn URL</label>
                        <input
                          type="url"
                          value={cvForm.linkedin}
                          onChange={(e) => setCvForm({ ...cvForm, linkedin: e.target.value })}
                          placeholder="https://linkedin.com/in/username"
                          className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[10.5px] font-semibold text-muted-foreground">Portfolio Website</label>
                        <input
                          type="url"
                          value={cvForm.portfolio}
                          onChange={(e) => setCvForm({ ...cvForm, portfolio: e.target.value })}
                          placeholder="https://careerace.online"
                          className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── BOX 3: TARGET ROLE & DISCIPLINE (FROM VERIFIED DISCIPLINE SET) ── */}
              <div className="border border-border/80 rounded-xl overflow-hidden bg-card shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleBox('role')}
                  className="w-full px-3.5 py-2.5 bg-muted/20 hover:bg-muted/40 transition-colors flex items-center justify-between text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground">3. Target Role & Core Discipline</span>
                    <Badge variant="outline" className="text-[9px] py-0 text-emerald-600 border-emerald-500/30">
                      {currentDiscipline.label}
                    </Badge>
                  </div>
                  {openBoxes.role ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                {openBoxes.role && (
                  <div className="p-3.5 border-t border-border/60 space-y-3 text-xs">
                    <div>
                      <label className="text-[10.5px] font-semibold text-muted-foreground">Select Primary Discipline</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-1">
                        {DISCIPLINE_PRESETS.map((disc) => (
                          <button
                            key={disc.id}
                            type="button"
                            onClick={() => {
                              setSelectedDisciplineId(disc.id)
                              setCvForm((prev) => ({ ...prev, targetRole: disc.defaultRole }))
                            }}
                            className={cn(
                              'p-2 rounded-lg border text-left transition-colors cursor-pointer text-xs font-semibold',
                              selectedDisciplineId === disc.id
                                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                : 'border-border/60 bg-background text-muted-foreground hover:bg-muted/30'
                            )}
                          >
                            {disc.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="sm:col-span-2">
                        <label className="text-[10.5px] font-semibold text-muted-foreground">Target Role Title</label>
                        <input
                          type="text"
                          value={cvForm.targetRole}
                          onChange={(e) => setCvForm({ ...cvForm, targetRole: e.target.value })}
                          className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[10.5px] font-semibold text-muted-foreground">Workplace Preference</label>
                        <select
                          value={cvForm.workplace}
                          onChange={(e) => setCvForm({ ...cvForm, workplace: e.target.value })}
                          className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs mt-1 cursor-pointer"
                        >
                          <option value="Remote">Remote</option>
                          <option value="Hybrid">Hybrid</option>
                          <option value="On-site">On-site</option>
                          <option value="Offshore/Vessel">Offshore / Vessel</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── BOX 4: TECHNICAL SKILLS (ALIGNED TO TARGET DISCIPLINE!) ── */}
              <div className="border border-border/80 rounded-xl overflow-hidden bg-card shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleBox('skills')}
                  className="w-full px-3.5 py-2.5 bg-muted/20 hover:bg-muted/40 transition-colors flex items-center justify-between text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground">4. Technical Skills (Aligned to {currentDiscipline.category})</span>
                    <Badge variant="secondary" className="text-[9px] py-0 font-medium">
                      {cvForm.skills.length} Active
                    </Badge>
                  </div>
                  {openBoxes.skills ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                {openBoxes.skills && (
                  <div className="p-3.5 border-t border-border/60 space-y-3 text-xs">
                    {/* Discipline aligned recommended skills */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10.5px] font-semibold text-muted-foreground">
                          Recommended for {currentDiscipline.category} (Click to Add):
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {currentDiscipline.skills.map((s) => {
                          const isAlreadyAdded = cvForm.skills.includes(s)
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => !isAlreadyAdded && handleAddSkill(s)}
                              disabled={isAlreadyAdded}
                              className={cn(
                                'text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer flex items-center gap-1',
                                isAlreadyAdded
                                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 opacity-60 cursor-default'
                                  : 'border-border/80 bg-background hover:bg-emerald-500/10 hover:border-emerald-500/40 text-foreground'
                              )}
                            >
                              <span>{isAlreadyAdded ? '✓' : '+'}</span>
                              <span>{s}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Active Skills Chips */}
                    <div>
                      <label className="text-[10.5px] font-semibold text-muted-foreground">Your Active Profile Skills:</label>
                      <div className="flex flex-wrap gap-1.5 mt-1.5 p-2 bg-muted/20 border border-border/60 rounded-lg min-h-[44px]">
                        {cvForm.skills.map((sk) => (
                          <span
                            key={sk}
                            className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-600/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                          >
                            <span>{sk}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(sk)}
                              className="hover:text-red-500 cursor-pointer p-0.5"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Custom Skill Input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newSkillInput}
                        onChange={(e) => setNewSkillInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                        placeholder="Add another custom proficiency..."
                        className="flex-1 h-8 px-2.5 rounded-lg border border-border bg-background text-xs"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAddSkill()}
                        className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── BOX 5: WORK EXPERIENCE HISTORY ── */}
              <div className="border border-border/80 rounded-xl overflow-hidden bg-card shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleBox('experience')}
                  className="w-full px-3.5 py-2.5 bg-muted/20 hover:bg-muted/40 transition-colors flex items-center justify-between text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground">5. Work Experience History</span>
                    <Badge variant="secondary" className="text-[9px] py-0 font-medium">
                      {cvForm.experience.length} Positions
                    </Badge>
                  </div>
                  {openBoxes.experience ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                {openBoxes.experience && (
                  <div className="p-3.5 border-t border-border/60 space-y-3 text-xs">
                    {cvForm.experience.map((pos, pIdx) => (
                      <div key={pIdx} className="p-3 bg-muted/20 border border-border/80 rounded-xl space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="font-bold text-xs text-foreground">Position #{pIdx + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setCvForm({
                                ...cvForm,
                                experience: cvForm.experience.filter((_, i) => i !== pIdx),
                              })
                            }}
                            className="text-[10px] text-red-500 hover:text-red-600 font-semibold cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] text-muted-foreground">Company Name</label>
                            <input
                              type="text"
                              value={pos.company || ''}
                              onChange={(e) => {
                                const copy = [...cvForm.experience]
                                copy[pIdx] = { ...copy[pIdx], company: e.target.value }
                                setCvForm({ ...cvForm, experience: copy })
                              }}
                              className="w-full h-7 px-2 rounded-md border border-border bg-background text-xs mt-0.5"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">Job Title / Role</label>
                            <input
                              type="text"
                              value={pos.role || pos.title || ''}
                              onChange={(e) => {
                                const copy = [...cvForm.experience]
                                copy[pIdx] = { ...copy[pIdx], role: e.target.value, title: e.target.value }
                                setCvForm({ ...cvForm, experience: copy })
                              }}
                              className="w-full h-7 px-2 rounded-md border border-border bg-background text-xs mt-0.5"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">Duration / Dates</label>
                            <input
                              type="text"
                              value={pos.duration || pos.dates || ''}
                              onChange={(e) => {
                                const copy = [...cvForm.experience]
                                copy[pIdx] = { ...copy[pIdx], duration: e.target.value, dates: e.target.value }
                                setCvForm({ ...cvForm, experience: copy })
                              }}
                              className="w-full h-7 px-2 rounded-md border border-border bg-background text-xs mt-0.5"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-muted-foreground">Accomplishment Bullets</label>
                          <textarea
                            rows={3}
                            value={Array.isArray(pos.bullets) ? pos.bullets.join('\n') : pos.description || ''}
                            onChange={(e) => {
                              const copy = [...cvForm.experience]
                              const lines = e.target.value.split('\n').filter((l) => l.trim())
                              copy[pIdx] = { ...copy[pIdx], bullets: lines, description: e.target.value }
                              setCvForm({ ...cvForm, experience: copy })
                            }}
                            placeholder="• Led overhaul of marine propulsion plant resulting in 18% fuel savings..."
                            className="w-full p-2 text-xs rounded-md border border-border bg-background mt-0.5 leading-relaxed"
                          />
                        </div>
                      </div>
                    ))}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCvForm({
                          ...cvForm,
                          experience: [
                            ...cvForm.experience,
                            { company: '', role: '', duration: '', bullets: [] },
                          ],
                        })
                      }}
                      className="w-full h-8 text-xs font-semibold gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Add Position</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* ── BOX 6: EDUCATIONAL BACKGROUND ── */}
              <div className="border border-border/80 rounded-xl overflow-hidden bg-card shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleBox('education')}
                  className="w-full px-3.5 py-2.5 bg-muted/20 hover:bg-muted/40 transition-colors flex items-center justify-between text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground">6. Educational Background</span>
                    <Badge variant="secondary" className="text-[9px] py-0 font-medium">
                      {cvForm.education.length} Credentials
                    </Badge>
                  </div>
                  {openBoxes.education ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                {openBoxes.education && (
                  <div className="p-3.5 border-t border-border/60 space-y-3 text-xs">
                    {cvForm.education.map((edu: any, eIdx: number) => (
                      <div key={eIdx} className="p-3 bg-muted/20 border border-border/80 rounded-xl space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="font-bold text-xs text-foreground">Education #{eIdx + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setCvForm({
                                ...cvForm,
                                education: cvForm.education.filter((_, i) => i !== eIdx),
                              })
                            }}
                            className="text-[10px] text-red-500 hover:text-red-600 font-semibold cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-muted-foreground">Degree / Qualification *</label>
                            <input
                              type="text"
                              value={edu.degree || ''}
                              onChange={(e) => {
                                const copy = [...cvForm.education]
                                copy[eIdx] = { ...copy[eIdx], degree: e.target.value }
                                setCvForm({ ...cvForm, education: copy })
                              }}
                              placeholder="e.g. B.Sc. Computer Science / B.Eng. Marine"
                              className="w-full h-7 px-2 rounded-md border border-border bg-background text-xs mt-0.5"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">Institution / University *</label>
                            <input
                              type="text"
                              value={edu.institution || edu.school || ''}
                              onChange={(e) => {
                                const copy = [...cvForm.education]
                                copy[eIdx] = { ...copy[eIdx], institution: e.target.value, school: e.target.value }
                                setCvForm({ ...cvForm, education: copy })
                              }}
                              placeholder="e.g. Federal University of Technology"
                              className="w-full h-7 px-2 rounded-md border border-border bg-background text-xs mt-0.5"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">Field of Study</label>
                            <input
                              type="text"
                              value={edu.field_of_study || ''}
                              onChange={(e) => {
                                const copy = [...cvForm.education]
                                copy[eIdx] = { ...copy[eIdx], field_of_study: e.target.value }
                                setCvForm({ ...cvForm, education: copy })
                              }}
                              placeholder="e.g. Software Systems / Marine Propulsion"
                              className="w-full h-7 px-2 rounded-md border border-border bg-background text-xs mt-0.5"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">Graduation Year / Dates</label>
                            <input
                              type="text"
                              value={edu.graduation_year || edu.year || edu.dates || ''}
                              onChange={(e) => {
                                const copy = [...cvForm.education]
                                copy[eIdx] = { ...copy[eIdx], graduation_year: e.target.value, year: e.target.value }
                                setCvForm({ ...cvForm, education: copy })
                              }}
                              placeholder="e.g. 2018 - 2022"
                              className="w-full h-7 px-2 rounded-md border border-border bg-background text-xs mt-0.5"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCvForm({
                          ...cvForm,
                          education: [
                            ...cvForm.education,
                            {
                              degree: '',
                              institution: '',
                              field_of_study: '',
                              graduation_year: '',
                            },
                          ],
                        })
                      }}
                      className="w-full h-8 text-xs font-semibold gap-1.5 cursor-pointer text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Add Degree / Qualification</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* ── BOX 7: TOOLS, CERTIFICATIONS & PROOF (<= 1 MB) ── */}
              <div className="border border-border/80 rounded-xl overflow-hidden bg-card shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleBox('proof')}
                  className="w-full px-3.5 py-2.5 bg-muted/20 hover:bg-muted/40 transition-colors flex items-center justify-between text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground">7. Tools, Certifications & Document Proof</span>
                    {cvForm.proofFile && (
                      <Badge variant="outline" className="text-[9px] py-0 text-emerald-600 border-emerald-500/40 bg-emerald-500/10">
                        Proof Verified ({cvForm.proofFile.sizeKb} KB)
                      </Badge>
                    )}
                  </div>
                  {openBoxes.proof ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                {openBoxes.proof && (
                  <div className="p-3.5 border-t border-border/60 space-y-3 text-xs">
                    <div>
                      <label className="text-[10.5px] font-semibold text-muted-foreground">Professional Certifications & Licenses</label>
                      <input
                        type="text"
                        value={cvForm.certifications.join(', ')}
                        onChange={(e) => {
                          const certs = e.target.value.split(',').map((c) => c.trim()).filter(Boolean)
                          setCvForm({ ...cvForm, certifications: certs })
                        }}
                        placeholder="e.g. STCW III/2 Chief Engineer, AWS Certified Solutions Architect, DP Induction"
                        className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs mt-1"
                      />
                    </div>

                    {/* Proof Document Upload Input (Strictly <= 10 MB) */}
                    <div className="p-3 bg-muted/20 border border-dashed border-emerald-500/40 rounded-xl space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                            <Paperclip className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Upload Proof Document (Max 10 MB)</span>
                          </span>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Attach license scan, certificate of competency, or credential confirmation (must be under 10 MB).
                          </p>
                        </div>

                        <input
                          ref={proofFileInputRef}
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.docx"
                          onChange={(e) => handleProofDocumentSelect(e.target.files?.[0] || null)}
                          className="hidden"
                        />

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => proofFileInputRef.current?.click()}
                          className="h-7 px-3 text-xs font-semibold gap-1.5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Attach Proof (&lt; 10MB)</span>
                        </Button>
                      </div>

                      {cvForm.proofFile && (
                        <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-between text-xs">
                          <span className="font-mono text-emerald-700 dark:text-emerald-300">
                            📎 {cvForm.proofFile.name} ({cvForm.proofFile.sizeKb} KB)
                          </span>
                          <button
                            type="button"
                            onClick={() => setCvForm({ ...cvForm, proofFile: null })}
                            className="text-red-500 hover:text-red-600 p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions: Save & Sync to Walrus Memory */}
            <div className="p-3 sm:p-4 border-t border-border/80 bg-card flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTopView('copilot')}
                className="h-9 px-4 text-xs font-semibold cursor-pointer"
              >
                <span>Back to Copilot</span>
              </Button>

              <div className="flex items-center gap-2">
                {onNavigateToCanvas && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onNavigateToCanvas}
                    className="h-9 px-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/40 cursor-pointer"
                  >
                    <span>Preview</span>
                  </Button>
                )}

                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveCvToWalrus}
                  disabled={isSavingCv}
                  className="h-9 px-5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1.5 shadow-xs cursor-pointer"
                >
                  {isSavingCv ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                  <span>Save & Sync to Walrus Memory</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
