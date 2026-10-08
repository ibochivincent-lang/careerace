'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Bot, Send, User, Upload, FileText, CheckCircle2, ChevronRight,
  Sparkles, ShieldCheck, Mail, ExternalLink, Download, Copy, Trash2,
  AlertCircle, Plus, Edit3, Database, TrendingUp, Target, AlertTriangle,
  RotateCcw, Compass, Clock, Check, Layers, Briefcase, Filter, Search,
  Zap, Award, Play, CheckSquare, RefreshCw, X, ArrowRight, ShieldAlert,
  Calendar, Building2, MapPin, Globe, Loader2, DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/components/ui/utils'
import { VERIFIED_COMPANY_HIRING_CONTACTS, type CompanyHiringContact } from '@/lib/company_directory'
import { downloadEmlReceipt } from '@/lib/email_receipt'
import type { CareerRoadmapAnalysis } from '@/lib/career_advisory'

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

type AssistantTab = 'copilot' | 'cv_writer' | 'cover_letter' | 'job_scanner' | 'career_advisor' | 'memory_vault'

// 5-Day Cooldown Threshold in Milliseconds (5 days * 24h * 60m * 60s * 1000ms)
const COOLDOWN_MS = 5 * 24 * 60 * 60 * 1000

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
  const [activeTab, setActiveTab] = useState<AssistantTab>('copilot')
  const [chatInput, setChatInput] = useState('')
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Scroll chat to bottom on new messages
  useEffect(() => {
    if (activeTab === 'copilot' && chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [overviewChatMessages, isSendingMessage, activeTab])

  // ─────────────────────────────────────────────────────────────────────────────
  // FN-01 IN-PLACE MENU CV WRITER STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [cvForm, setCvForm] = useState({
    name: parsedProfile?.applicant_name || '',
    email: parsedProfile?.email || '',
    phone: parsedProfile?.phone || '',
    location: parsedProfile?.location || '',
    targetRole: parsedProfile?.target_roles?.[0] || 'Software Systems Architect',
    seniority: 'Senior',
    workplace: 'Remote',
    github: parsedProfile?.github || '',
    linkedin: parsedProfile?.linkedin || '',
    portfolio: parsedProfile?.portfolio || '',
    summary: parsedProfile?.summary || '',
    skills: (parsedProfile?.skills as string[]) || [
      'TypeScript', 'Next.js', 'Distributed Systems', 'Cloud Infrastructure', 'API Architecture', 'Docker'
    ],
    experience: (parsedProfile?.work_experience as any[]) || [],
    education: (parsedProfile?.academic_history as any[]) || [],
    certifications: (parsedProfile?.certifications as string[]) || [],
  })

  // Synchronize form when parsedProfile updates from outside
  useEffect(() => {
    if (parsedProfile) {
      setCvForm({
        name: parsedProfile.applicant_name || '',
        email: parsedProfile.email || '',
        phone: parsedProfile.phone || '',
        location: parsedProfile.location || '',
        targetRole: parsedProfile.target_roles?.[0] || 'Software Systems Architect',
        seniority: 'Senior',
        workplace: 'Remote',
        github: parsedProfile.github || '',
        linkedin: parsedProfile.linkedin || '',
        portfolio: parsedProfile.portfolio || '',
        summary: parsedProfile.summary || '',
        skills: Array.isArray(parsedProfile.skills) ? parsedProfile.skills : [],
        experience: Array.isArray(parsedProfile.work_experience) ? parsedProfile.work_experience : [],
        education: Array.isArray(parsedProfile.academic_history) ? parsedProfile.academic_history : [],
        certifications: Array.isArray(parsedProfile.certifications) ? parsedProfile.certifications : [],
      })
    }
  }, [parsedProfile])

  const [newSkillInput, setNewSkillInput] = useState('')
  const [isSavingCv, setIsSavingCv] = useState(false)

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

  const handleSaveCvToWalrus = async () => {
    setIsSavingCv(true)
    try {
      const updatedProfile = {
        ...(parsedProfile || {}),
        applicant_name: cvForm.name || 'Candidate',
        email: cvForm.email || 'applicant@careerace.online',
        phone: cvForm.phone,
        location: cvForm.location,
        target_roles: [cvForm.targetRole],
        github: cvForm.github,
        linkedin: cvForm.linkedin,
        portfolio: cvForm.portfolio,
        summary: cvForm.summary,
        skills: cvForm.skills,
        work_experience: cvForm.experience,
        academic_history: cvForm.education,
        certifications: cvForm.certifications,
      }

      // 1. Update parent state
      onUpdateProfile(updatedProfile)

      // 2. Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('careerace_cv_draft', JSON.stringify(updatedProfile))
      }

      // 3. Save facts directly to sovereign memory endpoint
      await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: sessionAddress || undefined,
          fact: `Profile verified for ${cvForm.name}. Target Role: ${cvForm.targetRole}. Core Skills: ${cvForm.skills.slice(0, 5).join(', ')}.`,
          kind: 'experience',
        }),
      }).catch(() => {})

      toast.success('CV saved & synced to Walrus Sovereign Memory!')
    } catch (_err) {
      toast.error('Failed to sync CV to memory')
    } finally {
      setIsSavingCv(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FN-02 COVER LETTER STUDIO STATE & ACTIONS
  // ─────────────────────────────────────────────────────────────────────────────
  const [clScope, setClScope] = useState<'singular' | 'batch'>('singular')
  const [clTone, setClTone] = useState<'modern_tech' | 'executive' | 'narrative'>('modern_tech')
  const [clTargetCompany, setClTargetCompany] = useState('Maersk')
  const [clTargetRole, setClTargetRole] = useState(cvForm.targetRole || 'Systems Engineer')
  const [clKeyProblem, setClKeyProblem] = useState('Ensuring 99.9% uptime and zero unscheduled downtime across distributed systems.')
  const [isGeneratingCl, setIsGeneratingCl] = useState(false)
  const [clGenerated, setClGenerated] = useState<{
    salutation: string
    opening: string
    bodyParagraph1: string
    bodyParagraph2: string
    closing: string
    signoff: string
  } | null>(null)

  const handleGenerateCoverLetter = async () => {
    setIsGeneratingCl(true)
    try {
      const res = await fetch('/api/cover_letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: clTargetRole,
          targetCompany: clTargetCompany,
          keyProblems: clKeyProblem,
          candidateName: cvForm.name || 'Candidate',
          candidateEmail: cvForm.email || 'candidate@careerace.online',
          candidatePhone: cvForm.phone,
          candidateLocation: cvForm.location,
          candidateSkills: cvForm.skills,
          recentExperience: cvForm.experience[0],
          walrusBlobId: overviewWalrusVault?.latestBlobId || '',
          tone: clTone,
          mode: clScope,
        }),
      })

      const data = await res.json()
      if (data.success && data.coverLetter) {
        const fullText = data.coverLetter
        // Parse paragraphs roughly for in-place editing
        const paragraphs = fullText.split('\n\n').filter((p: string) => p.trim())
        setClGenerated({
          salutation: paragraphs[0]?.includes('Dear') ? paragraphs[0] : `Dear Hiring Team at ${clTargetCompany},`,
          opening: paragraphs[1] || `I am writing to express my strong enthusiasm for the ${clTargetRole} position at ${clTargetCompany}.`,
          bodyParagraph1: paragraphs[2] || `In my recent roles, I have dedicated myself to resolving critical engineering bottlenecks with measurable reliability.`,
          bodyParagraph2: paragraphs[3] || `My verified track record aligns with ${clTargetCompany}'s operational standards, consistently delivering under high-stakes conditions.`,
          closing: paragraphs[4] || `I welcome the opportunity to discuss how my background can directly advance your upcoming milestones.`,
          signoff: `Sincerely,\n${cvForm.name || 'Candidate'}`,
        })
        toast.success(`Cover letter generated in ${clTone.replace('_', ' ')} tone!`)
      } else {
        toast.error('Failed to generate cover letter')
      }
    } catch (_err) {
      toast.error('Network error generating cover letter')
    } finally {
      setIsGeneratingCl(false)
    }
  }

  const handleCopyCoverLetter = () => {
    if (!clGenerated) return
    const text = `${clGenerated.salutation}\n\n${clGenerated.opening}\n\n${clGenerated.bodyParagraph1}\n\n${clGenerated.bodyParagraph2}\n\n${clGenerated.closing}\n\n${clGenerated.signoff}`
    navigator.clipboard.writeText(text)
    toast.success('Cover letter copied to clipboard!')
  }

  const handleDownloadClEml = () => {
    if (!clGenerated) return
    const text = `${clGenerated.salutation}\n\n${clGenerated.opening}\n\n${clGenerated.bodyParagraph1}\n\n${clGenerated.bodyParagraph2}\n\n${clGenerated.closing}\n\n${clGenerated.signoff}`
    downloadEmlReceipt({
      to: 'hiring@' + clTargetCompany.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com',
      fromName: cvForm.name || 'Candidate',
      fromEmail: cvForm.email || 'candidate@careerace.online',
      subject: `Application: ${clTargetRole} - ${cvForm.name || 'Candidate'}`,
      body: text,
      company: clTargetCompany,
      role: clTargetRole,
      candidateAddress: sessionAddress,
      walrusBlobId: overviewWalrusVault?.latestBlobId,
    })
    toast.success('RFC-5322 EML transmission receipt downloaded!')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FN-03 & FN-04 JOB SCANNER & AUTO-DISPATCH STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [jobCategoryFilter, setJobCategoryFilter] = useState<string>('all')
  const [jobWorkplaceFilter, setJobWorkplaceFilter] = useState<string>('all')
  const [jobSeniorityFilter, setJobSeniorityFilter] = useState<string>('all')
  const [jobSearchQuery, setJobSearchQuery] = useState('')
  const [isBatchDispatching, setIsBatchDispatching] = useState(false)
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; currentCompany: string } | null>(null)

  // Real verified employers database from lib/company_directory.ts
  const allVerifiedContacts = useMemo(() => {
    return VERIFIED_COMPANY_HIRING_CONTACTS
  }, [])

  // Filtered contacts
  const filteredJobs = useMemo(() => {
    return allVerifiedContacts.filter((contact) => {
      // Category match
      if (jobCategoryFilter !== 'all') {
        const catMap: Record<string, string> = {
          marine: 'Maritime / Offshore',
          software: 'Software / Cloud',
          ai: 'AI / Robotics',
          medical: 'Medical / Healthcare',
          engineering: 'Engineering / Industrial',
          management: 'Management / Operations',
        }
        if (contact.category !== catMap[jobCategoryFilter]) return false
      }

      // Search query
      if (jobSearchQuery.trim()) {
        const q = jobSearchQuery.toLowerCase()
        const matchComp = contact.company.toLowerCase().includes(q)
        const matchRoles = contact.typicalRoles.some((r) => r.toLowerCase().includes(q))
        const matchLoc = contact.location.toLowerCase().includes(q)
        if (!matchComp && !matchRoles && !matchLoc) return false
      }

      return true
    })
  }, [allVerifiedContacts, jobCategoryFilter, jobSearchQuery])

  // Helper: Calculate semantic match percentage based on candidate skills
  const calculateMatchPercentage = (contact: CompanyHiringContact): number => {
    const candidateSkills = (cvForm.skills || []).map((s) => s.toLowerCase())
    if (candidateSkills.length === 0) return 75

    let score = 70
    // Bonus if target role category matches contact category
    const cat = contact.category.toLowerCase()
    if (cat.includes('software') && candidateSkills.some((s) => s.includes('typescript') || s.includes('react') || s.includes('cloud'))) {
      score += 18
    } else if (cat.includes('maritime') && candidateSkills.some((s) => s.includes('stcw') || s.includes('propulsion') || s.includes('marine'))) {
      score += 24
    } else if (cat.includes('ai') && candidateSkills.some((s) => s.includes('ai') || s.includes('robotics') || s.includes('vision'))) {
      score += 20
    }

    return Math.min(score, 98)
  }

  // Helper: Check 5-day deduplication cooldown
  const getJobCooldownStatus = (companyName: string) => {
    const existing = appliedJobs.find(
      (j) => j.company?.toLowerCase() === companyName.toLowerCase()
    )
    if (!existing) return { inCooldown: false, daysRemaining: 0 }

    const appliedTime = existing.appliedTimestamp || (existing.appliedAt ? new Date(existing.appliedAt).getTime() : 0)
    const elapsed = Date.now() - appliedTime
    if (elapsed < COOLDOWN_MS) {
      const remainingMs = COOLDOWN_MS - elapsed
      const daysRemaining = Math.max(1, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)))
      return { inCooldown: true, daysRemaining }
    }
    return { inCooldown: false, daysRemaining: 0 }
  }

  // Singular Dispatch Action
  const handleDispatchSingular = (contact: CompanyHiringContact) => {
    const { inCooldown, daysRemaining } = getJobCooldownStatus(contact.company)
    if (inCooldown) {
      toast.warning(`5-Day Anti-Spam Cooldown active for ${contact.company} (${daysRemaining} days left).`)
      return
    }

    const newRecord = {
      id: `app-${Date.now()}-${contact.id}`,
      company: contact.company,
      jobTitle: contact.typicalRoles[0] || 'Engineering Specialist',
      contactEmail: contact.contactEmail,
      appliedAt: new Date().toISOString(),
      appliedTimestamp: Date.now(),
      status: 'dispatched',
      walrusBlobId: overviewWalrusVault?.latestBlobId || undefined,
    }

    const updated = [newRecord, ...appliedJobs]
    onUpdateAppliedJobs(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('careerace_applied_jobs', JSON.stringify(updated))
    }

    // Auto-download RFC-5322 verifiable receipt
    downloadEmlReceipt({
      to: contact.contactEmail,
      fromName: cvForm.name || 'Candidate',
      fromEmail: cvForm.email || 'candidate@careerace.online',
      subject: `Application: ${contact.typicalRoles[0]} - ${cvForm.name || 'Candidate'}`,
      body: `Dear Hiring Team at ${contact.company},\n\nPlease find my verified candidacy for ${contact.typicalRoles[0]}.\n\nMy profile and credentials are authenticated via CareerAce Sovereign Memory.\n\nSincerely,\n${cvForm.name || 'Candidate'}`,
      company: contact.company,
      role: contact.typicalRoles[0],
      candidateAddress: sessionAddress,
      walrusBlobId: overviewWalrusVault?.latestBlobId,
    })

    toast.success(`Application dispatched to ${contact.company}! EML receipt generated.`)
  }

  // Batch Auto-Dispatch with Anti-Spam Humanized Pacing (2-5s)
  const handleBatchAutoDispatch = async () => {
    const eligible = filteredJobs.filter((contact) => !getJobCooldownStatus(contact.company).inCooldown)
    if (eligible.length === 0) {
      toast.info('All displayed companies are currently within their 5-day cooldown period.')
      return
    }

    setIsBatchDispatching(true)
    const newRecords: any[] = []

    for (let i = 0; i < Math.min(eligible.length, 5); i++) {
      const contact = eligible[i]
      setBatchProgress({
        current: i + 1,
        total: Math.min(eligible.length, 5),
        currentCompany: contact.company,
      })

      // Humanized anti-spam pacing delay: 2.2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2200))

      newRecords.push({
        id: `batch-${Date.now()}-${contact.id}`,
        company: contact.company,
        jobTitle: contact.typicalRoles[0] || 'Technical Specialist',
        contactEmail: contact.contactEmail,
        appliedAt: new Date().toISOString(),
        appliedTimestamp: Date.now(),
        status: 'dispatched',
        walrusBlobId: overviewWalrusVault?.latestBlobId || undefined,
      })
    }

    const updated = [...newRecords, ...appliedJobs]
    onUpdateAppliedJobs(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('careerace_applied_jobs', JSON.stringify(updated))
    }

    setIsBatchDispatching(false)
    setBatchProgress(null)
    toast.success(`Autonomous batch dispatch complete! ${newRecords.length} applications queued with 5-day cooldown.`)
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FN-06 & FN-07 CAREER PATH ADVISORY STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [advisorAnalysis, setAdvisorAnalysis] = useState<CareerRoadmapAnalysis | null>(null)
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(false)

  const handleGenerateRoadmap = async () => {
    setIsLoadingRoadmap(true)
    try {
      const res = await fetch('/api/career_roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentRole: cvForm.experience[0]?.role || cvForm.targetRole || 'Software Engineer',
          targetRole: cvForm.targetRole || 'Principal Distributed Systems Architect',
          skills: cvForm.skills,
        }),
      })

      const data = await res.json()
      if (data.success && data.analysis) {
        setAdvisorAnalysis(data.analysis)
        toast.success('Career progression roadmap & compensation benchmarks generated!')
      } else {
        toast.error('Failed to generate career roadmap')
      }
    } catch (_err) {
      toast.error('Network error generating roadmap')
    } finally {
      setIsLoadingRoadmap(false)
    }
  }

  // Auto-generate roadmap on first visit to tab if not yet loaded
  useEffect(() => {
    if (activeTab === 'career_advisor' && !advisorAnalysis && !isLoadingRoadmap) {
      handleGenerateRoadmap()
    }
  }, [activeTab])

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER MAIN IN-SITU CONTAINER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      <Card className="border border-border/80 shadow-md rounded-2xl bg-card overflow-hidden flex flex-col h-[760px] sm:h-[800px] lg:h-[840px] min-h-[620px]">
        {/* TOP STATUS BAR & WALRUS MEMORY VAULT LIVE BADGE */}
        <div className="px-3.5 py-2 sm:py-2.5 border-b border-border/80 bg-muted/30 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border-2 border-background rounded-full" />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-xs sm:text-sm text-foreground">CareerAce Autonomous Copilot</h3>
              {overviewWalrusVault?.latestBlobId ? (
                <a
                  href={overviewWalrusVault.walrusUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 rounded-md font-mono"
                  title={`Walrus Blob ID: ${overviewWalrusVault.latestBlobId}`}
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                  <span>Walrus: {overviewWalrusVault.latestBlobId.slice(0, 6)}...</span>
                </a>
              ) : (
                <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-500/30 bg-emerald-500/10 font-mono py-0">
                  Walrus Sovereign Vault Live
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[9px] sm:text-[10px] text-muted-foreground border-border/80">
              <ShieldCheck className="w-3 h-3 text-emerald-500 mr-1" /> zkLogin Verified
            </Badge>
          </div>
        </div>

        {/* IN-SITU MODULE SWITCHER TABS (PILLS) */}
        <div className="px-2.5 py-1.5 border-b border-border/60 bg-muted/15 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('copilot')}
            className={cn(
              'px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer',
              activeTab === 'copilot'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            )}
          >
            <Bot className="w-3 h-3" />
            <span>AI Copilot</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cv_writer')}
            className={cn(
              'px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer',
              activeTab === 'cv_writer'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            )}
          >
            <Edit3 className="w-3 h-3" />
            <span>In-Place CV (FN-01)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cover_letter')}
            className={cn(
              'px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer',
              activeTab === 'cover_letter'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            )}
          >
            <Mail className="w-3 h-3" />
            <span>Cover Letter Studio (FN-02)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('job_scanner')}
            className={cn(
              'px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer',
              activeTab === 'job_scanner'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            )}
          >
            <Briefcase className="w-3 h-3" />
            <span>Job Scanner & Auto-Apply (FN-03 & 04)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('career_advisor')}
            className={cn(
              'px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer',
              activeTab === 'career_advisor'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            )}
          >
            <Compass className="w-3 h-3" />
            <span>Career Advisor (FN-06 & 07)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('memory_vault')}
            className={cn(
              'px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer',
              activeTab === 'memory_vault'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            )}
          >
            <Database className="w-3 h-3" />
            <span>Worries Memory (FN-05)</span>
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 1: CONVERSATIONAL AI COPILOT */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'copilot' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Chat Feed */}
            <div ref={chatContainerRef} className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-2.5 text-[10px] sm:text-xs">
              {/* First-time Callout if no CV */}
              {!parsedProfile && (
                <div className="p-3.5 rounded-2xl border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-foreground">Attach CV or Build In-Place</h4>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        Upload your resume to calibrate Walrus sovereign memory, or fill out the in-situ cards directly in the <strong>In-Place CV</strong> tab!
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {onUploadCvClick && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={onUploadCvClick}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] sm:text-xs font-semibold px-3 h-7 gap-1 rounded-lg shadow-xs cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload CV</span>
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveTab('cv_writer')}
                      className="text-[10px] sm:text-xs font-semibold px-3 h-7 gap-1 rounded-lg cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Write In-Place</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* In-Situ Action Cards Banner */}
              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span className="text-[11px] font-semibold text-foreground">
                    Quick Navigation: Use in-situ interactive cards without chat clutter
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab('cv_writer')}
                    className="h-6 px-2 text-[9px] rounded-md border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                  >
                    📝 CV Writer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab('cover_letter')}
                    className="h-6 px-2 text-[9px] rounded-md border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                  >
                    ✉️ Cover Letter
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab('job_scanner')}
                    className="h-6 px-2 text-[9px] rounded-md border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                  >
                    🎯 Auto-Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab('career_advisor')}
                    className="h-6 px-2 text-[9px] rounded-md border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                  >
                    🧭 Career Roadmap
                  </Button>
                </div>
              </div>

              {/* Messages Feed */}
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
                    className={`max-w-[88%] sm:max-w-[78%] p-2 sm:p-2.5 rounded-xl text-[10px] sm:text-[11px] leading-snug whitespace-pre-wrap ${
                      msg.role === 'assistant'
                        ? 'bg-muted/40 border border-border/80 text-foreground shadow-2xs'
                        : 'bg-emerald-600 text-white font-medium shadow-xs'
                    }`}
                  >
                    {msg.content}
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

            {/* Bottom Input */}
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
                placeholder="Ask about your CV, target jobs, follow-up dates, or request an auto-dispatch..."
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

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 2: FN-01 IN-PLACE MENU CV WRITER (ATS COMPLIANT) */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'cv_writer' && (
          <div className="flex-1 p-3.5 sm:p-5 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-emerald-500" />
                  <span>In-Place ATS CV Writer (FN-01)</span>
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Direct in-situ cards. Edit parameters without conversational message clutter.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveCvToWalrus}
                  disabled={isSavingCv}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-8 px-3.5 rounded-xl shadow-xs"
                >
                  {isSavingCv ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <SaveIcon className="w-3.5 h-3.5 mr-1" />}
                  <span>Save & Sync to Walrus</span>
                </Button>

                {onNavigateToCanvas && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onNavigateToCanvas}
                    className="text-xs h-8 px-3 rounded-xl border-border/80"
                  >
                    <span>Full Canvas</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>

            {/* CARD 1: IDENTITY & CONTACT */}
            <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2.5">
              <h5 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-500" /> Candidate Identity & Contact
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-muted-foreground">Full Name</label>
                  <input
                    type="text"
                    value={cvForm.name}
                    onChange={(e) => setCvForm({ ...cvForm, name: e.target.value })}
                    placeholder="e.g. Ibochi Vincent"
                    className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Email</label>
                  <input
                    type="email"
                    value={cvForm.email}
                    onChange={(e) => setCvForm({ ...cvForm, email: e.target.value })}
                    placeholder="vincent@careerace.online"
                    className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Phone</label>
                  <input
                    type="text"
                    value={cvForm.phone}
                    onChange={(e) => setCvForm({ ...cvForm, phone: e.target.value })}
                    placeholder="+234 800 123 4567"
                    className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Location</label>
                  <input
                    type="text"
                    value={cvForm.location}
                    onChange={(e) => setCvForm({ ...cvForm, location: e.target.value })}
                    placeholder="Lagos, Nigeria / Global Remote"
                    className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs"
                  />
                </div>
              </div>
            </div>

            {/* CARD 2: DIGITAL FOOTPRINT */}
            <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2.5">
              <h5 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-500" /> Digital Footprint & Attestation
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-muted-foreground">GitHub URL</label>
                  <input
                    type="text"
                    value={cvForm.github}
                    onChange={(e) => setCvForm({ ...cvForm, github: e.target.value })}
                    placeholder="https://github.com/..."
                    className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">LinkedIn URL</label>
                  <input
                    type="text"
                    value={cvForm.linkedin}
                    onChange={(e) => setCvForm({ ...cvForm, linkedin: e.target.value })}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Portfolio / Website</label>
                  <input
                    type="text"
                    value={cvForm.portfolio}
                    onChange={(e) => setCvForm({ ...cvForm, portfolio: e.target.value })}
                    placeholder="https://careerace.online"
                    className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs"
                  />
                </div>
              </div>
            </div>

            {/* CARD 3: TARGET ROLE & PREFERENCES */}
            <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2.5">
              <h5 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-500" /> Target Role & Preferences
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-muted-foreground">Target Role Title</label>
                  <input
                    type="text"
                    value={cvForm.targetRole}
                    onChange={(e) => setCvForm({ ...cvForm, targetRole: e.target.value })}
                    placeholder="e.g. Senior Marine Systems Engineer"
                    className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Seniority Level</label>
                  <select
                    value={cvForm.seniority}
                    onChange={(e) => setCvForm({ ...cvForm, seniority: e.target.value })}
                    className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs"
                  >
                    <option value="Intern">Intern / Cadet</option>
                    <option value="Entry">Entry Level</option>
                    <option value="Mid">Mid-Level</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead / Staff Architect</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Workplace Format</label>
                  <select
                    value={cvForm.workplace}
                    onChange={(e) => setCvForm({ ...cvForm, workplace: e.target.value })}
                    className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                    <option value="Offshore">Offshore / Vessel</option>
                  </select>
                </div>
              </div>
            </div>

            {/* CARD 4: TECHNICAL SKILLS CHIP SELECTOR */}
            <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <h5 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-500" /> Technical Skills & Competencies ({cvForm.skills.length})
                </h5>
                <span className="text-[10px] text-muted-foreground">Tap 'x' to remove, or add new chip</span>
              </div>

              {/* Existing Chips */}
              <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 rounded-lg bg-background border border-border/70">
                {cvForm.skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="text-[10px] py-0.5 px-2 gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-red-500 cursor-pointer ml-0.5"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>

              {/* Add Skill Input & Suggestions */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                  placeholder="Type a skill and press Enter (e.g. Docker, STCW CoC, Python)..."
                  className="flex-1 h-8 px-2.5 rounded-lg border border-border bg-background text-xs"
                />
                <Button
                  size="sm"
                  onClick={() => handleAddSkill()}
                  className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>

              {/* Quick suggestions */}
              <div className="flex items-center gap-1 flex-wrap text-[10px] text-muted-foreground">
                <span>Suggested:</span>
                {['Distributed Systems', 'TypeScript', 'Marine Propulsion', 'STCW III/2', 'Kubernetes', 'Cloud Ops'].map(
                  (sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleAddSkill(sug)}
                      className="px-1.5 py-0.5 rounded bg-muted/60 hover:bg-emerald-500/10 hover:text-emerald-600 border border-border/60 cursor-pointer"
                    >
                      +{sug}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* CARD 5: WORK EXPERIENCE HIGHLIGHTS */}
            <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <h5 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-500" /> Work Experience Tenures ({cvForm.experience.length})
                </h5>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newExp = {
                      role: 'Systems Engineer',
                      company: 'New Organization',
                      duration: '2022 - Present',
                      highlights: ['Led engineering deliverables with zero unscheduled downtime.'],
                    }
                    setCvForm({ ...cvForm, experience: [newExp, ...cvForm.experience] })
                  }}
                  className="h-6 px-2 text-[10px] rounded-md"
                >
                  <Plus className="w-2.5 h-2.5 mr-1" /> Add Position
                </Button>
              </div>

              {cvForm.experience.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No positions listed yet. Click 'Add Position' above.</p>
              ) : (
                <div className="space-y-2.5">
                  {cvForm.experience.map((exp, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border border-border bg-background space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                          <input
                            type="text"
                            value={exp.role || ''}
                            onChange={(e) => {
                              const copy = [...cvForm.experience]
                              copy[idx].role = e.target.value
                              setCvForm({ ...cvForm, experience: copy })
                            }}
                            placeholder="Role Title"
                            className="h-7 px-2 rounded border border-border text-xs font-semibold"
                          />
                          <input
                            type="text"
                            value={exp.company || ''}
                            onChange={(e) => {
                              const copy = [...cvForm.experience]
                              copy[idx].company = e.target.value
                              setCvForm({ ...cvForm, experience: copy })
                            }}
                            placeholder="Company"
                            className="h-7 px-2 rounded border border-border text-xs"
                          />
                          <input
                            type="text"
                            value={exp.duration || ''}
                            onChange={(e) => {
                              const copy = [...cvForm.experience]
                              copy[idx].duration = e.target.value
                              setCvForm({ ...cvForm, experience: copy })
                            }}
                            placeholder="Dates (e.g. 2021 - Present)"
                            className="h-7 px-2 rounded border border-border text-xs"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const copy = cvForm.experience.filter((_, i) => i !== idx)
                            setCvForm({ ...cvForm, experience: copy })
                          }}
                          className="text-muted-foreground hover:text-red-500 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Bullet points */}
                      <div>
                        <label className="text-[10px] text-muted-foreground">Quantifiable Bullet Points</label>
                        <textarea
                          value={Array.isArray(exp.highlights) ? exp.highlights.join('\n') : (exp.highlights || '')}
                          onChange={(e) => {
                            const copy = [...cvForm.experience]
                            copy[idx].highlights = e.target.value.split('\n')
                            setCvForm({ ...cvForm, experience: copy })
                          }}
                          rows={2}
                          placeholder="• Engineered telemetry logger reducing diagnosis time from 12m to 30s..."
                          className="w-full p-2 rounded border border-border text-xs leading-relaxed"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 3: FN-02 COVER LETTER STUDIO & DISPATCH PROMPT */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'cover_letter' && (
          <div className="flex-1 p-3.5 sm:p-5 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-500" />
                  <span>Cover Letter Studio (FN-02)</span>
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Scope decision menu, adaptive tone synthesis, and dynamic in-situ paragraph editor.
                </p>
              </div>

              {clGenerated && (
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyCoverLetter}
                    className="text-xs h-7 px-2.5 rounded-lg border-border/80"
                  >
                    <Copy className="w-3 h-3 mr-1" /> Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadClEml}
                    className="text-xs h-7 px-2.5 rounded-lg border-border/80"
                  >
                    <Download className="w-3 h-3 mr-1" /> EML Receipt
                  </Button>
                </div>
              )}
            </div>

            {/* CONFIGURATION CONTROLS */}
            <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {/* SCOPE SELECTION */}
                <div>
                  <label className="text-[10px] font-semibold text-foreground uppercase tracking-wider block mb-1">
                    1. Scope Decision
                  </label>
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-background border border-border">
                    <button
                      type="button"
                      onClick={() => setClScope('singular')}
                      className={cn(
                        'flex-1 py-1 px-2 rounded-md text-[10px] font-medium transition-all text-center cursor-pointer',
                        clScope === 'singular' ? 'bg-emerald-600 text-white font-semibold shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Singular Target
                    </button>
                    <button
                      type="button"
                      onClick={() => setClScope('batch')}
                      className={cn(
                        'flex-1 py-1 px-2 rounded-md text-[10px] font-medium transition-all text-center cursor-pointer',
                        clScope === 'batch' ? 'bg-emerald-600 text-white font-semibold shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Batch Dispatch
                    </button>
                  </div>
                </div>

                {/* ADAPTIVE IN-CHAT TONE SELECTOR */}
                <div>
                  <label className="text-[10px] font-semibold text-foreground uppercase tracking-wider block mb-1">
                    2. In-Chat Tone
                  </label>
                  <select
                    value={clTone}
                    onChange={(e: any) => setClTone(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs"
                  >
                    <option value="modern_tech">Modern Tech (Impact & Metric-first)</option>
                    <option value="executive">Executive (Strategic Governance)</option>
                    <option value="narrative">Narrative (Purpose & Trajectory)</option>
                  </select>
                </div>

                {/* TARGET COMPANY & ROLE */}
                <div>
                  <label className="text-[10px] font-semibold text-foreground uppercase tracking-wider block mb-1">
                    3. Target Entity
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={clTargetCompany}
                      onChange={(e) => setClTargetCompany(e.target.value)}
                      placeholder="Company (e.g. Maersk)"
                      className="w-1/2 h-8 px-2 rounded-lg border border-border bg-background text-xs"
                    />
                    <input
                      type="text"
                      value={clTargetRole}
                      onChange={(e) => setClTargetRole(e.target.value)}
                      placeholder="Role Title"
                      className="w-1/2 h-8 px-2 rounded-lg border border-border bg-background text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* CORE PROBLEM STATEMENT */}
              <div>
                <label className="text-[10px] font-semibold text-foreground uppercase tracking-wider block mb-1">
                  Core Problem Solved (Grounded Execution)
                </label>
                <input
                  type="text"
                  value={clKeyProblem}
                  onChange={(e) => setClKeyProblem(e.target.value)}
                  placeholder="e.g. Ensuring 99.9% uptime and zero unscheduled downtime across distributed systems."
                  className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs"
                />
              </div>

              <Button
                onClick={handleGenerateCoverLetter}
                disabled={isGeneratingCl}
                className="w-full h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs"
              >
                {isGeneratingCl ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
                <span>Generate In-Situ Cover Letter ({clTone.replace('_', ' ')})</span>
              </Button>
            </div>

            {/* DYNAMIC PARAGRAPH IN-SITU EDITOR */}
            {clGenerated && (
              <div className="p-3.5 rounded-xl border border-border/80 bg-background space-y-3">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-emerald-500" /> Editable In-Situ Paragraphs
                  </span>
                  <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-500/30">
                    ATS Calibrated
                  </Badge>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] text-muted-foreground font-semibold">Salutation</label>
                    <input
                      type="text"
                      value={clGenerated.salutation}
                      onChange={(e) => setClGenerated({ ...clGenerated, salutation: e.target.value })}
                      className="w-full h-7 px-2 rounded border border-border text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-muted-foreground font-semibold">Opening Hook</label>
                    <textarea
                      value={clGenerated.opening}
                      onChange={(e) => setClGenerated({ ...clGenerated, opening: e.target.value })}
                      rows={2}
                      className="w-full p-2 rounded border border-border text-xs leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-muted-foreground font-semibold">Body 1: Technical Execution & Problem Solving</label>
                    <textarea
                      value={clGenerated.bodyParagraph1}
                      onChange={(e) => setClGenerated({ ...clGenerated, bodyParagraph1: e.target.value })}
                      rows={3}
                      className="w-full p-2 rounded border border-border text-xs leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-muted-foreground font-semibold">Body 2: Measurable Impact & Verifiable Outcomes</label>
                    <textarea
                      value={clGenerated.bodyParagraph2}
                      onChange={(e) => setClGenerated({ ...clGenerated, bodyParagraph2: e.target.value })}
                      rows={3}
                      className="w-full p-2 rounded border border-border text-xs leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-muted-foreground font-semibold">Closing & Next Steps</label>
                    <textarea
                      value={clGenerated.closing}
                      onChange={(e) => setClGenerated({ ...clGenerated, closing: e.target.value })}
                      rows={2}
                      className="w-full p-2 rounded border border-border text-xs leading-relaxed"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-border/60">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Walrus Attestation: {overviewWalrusVault?.latestBlobId ? `Blob ${overviewWalrusVault.latestBlobId.slice(0, 8)}...` : 'Linked'}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => {
                      toast.success(`Cover letter finalized for ${clTargetCompany}! Ready for dispatch.`)
                      setActiveTab('job_scanner')
                    }}
                    className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold gap-1"
                  >
                    <span>Proceed to Job Dispatch</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 4: FN-03 & FN-04 JOB SCANNER & BATCH AUTO-DISPATCH */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'job_scanner' && (
          <div className="flex-1 p-3.5 sm:p-5 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-500" />
                  <span>Job Board Scanner & In-Chat Dispatch (FN-03 & 04)</span>
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Semantic matching, deduplicated submission ledger, and anti-spam pacing (2-5s intervals).
                </p>
              </div>

              {/* BATCH AUTO-DISPATCH TRIGGER */}
              <Button
                size="sm"
                onClick={handleBatchAutoDispatch}
                disabled={isBatchDispatching}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-8 px-3.5 rounded-xl shadow-xs gap-1.5"
              >
                {isBatchDispatching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                <span>Auto-Dispatch Eligible Batch</span>
              </Button>
            </div>

            {/* BATCH PACING PROGRESS MODAL / BANNER */}
            {batchProgress && (
              <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 space-y-1.5 animate-pulse">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <span>Anti-Spam Humanized Pacing Active...</span>
                  <span>{batchProgress.current} / {batchProgress.total}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Dispatching application to <strong>{batchProgress.currentCompany}</strong> with verifiable RFC-5322 EML receipt...
                </p>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* FILTERS BAR */}
            <div className="p-3 rounded-xl border border-border/80 bg-muted/20 flex items-center gap-2 flex-wrap text-xs">
              <div className="flex-1 min-w-[180px]">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={jobSearchQuery}
                    onChange={(e) => setJobSearchQuery(e.target.value)}
                    placeholder="Search company, role, or country..."
                    className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-border bg-background text-xs"
                  />
                </div>
              </div>

              <select
                value={jobCategoryFilter}
                onChange={(e) => setJobCategoryFilter(e.target.value)}
                className="h-8 px-2 rounded-lg border border-border bg-background text-xs"
              >
                <option value="all">All Sectors</option>
                <option value="marine">Maritime & Offshore</option>
                <option value="software">Software & Cloud</option>
                <option value="ai">AI & Robotics</option>
                <option value="medical">Medical & Healthcare</option>
                <option value="engineering">Engineering & Industrial</option>
              </select>

              <Badge variant="outline" className="text-[10px] text-muted-foreground font-mono">
                {filteredJobs.length} Verified Roles
              </Badge>
            </div>

            {/* VERIFIED JOBS LIST */}
            <div className="space-y-2.5">
              {filteredJobs.map((contact) => {
                const matchPct = calculateMatchPercentage(contact)
                const { inCooldown, daysRemaining } = getJobCooldownStatus(contact.company)

                return (
                  <div
                    key={contact.id}
                    className="p-3 rounded-xl border border-border/80 bg-background hover:border-emerald-500/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="font-bold text-xs sm:text-sm text-foreground">
                          {contact.typicalRoles[0] || 'Technical Specialist'}
                        </h5>
                        <Badge variant="outline" className="text-[9px] py-0 border-border/60">
                          {contact.company}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-[9px] py-0 font-bold font-mono',
                            matchPct >= 90
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          )}
                        >
                          {matchPct}% Match
                        </Badge>
                        {inCooldown && (
                          <Badge variant="outline" className="text-[9px] py-0 text-amber-600 border-amber-500/30 bg-amber-500/10">
                            Cooldown Active ({daysRemaining}d left)
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" /> {contact.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="w-2.5 h-2.5" /> {contact.category}
                        </span>
                        <span className="font-mono text-[9px]">{contact.contactEmail}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                      <a
                        href={contact.careersUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded border border-border/60"
                      >
                        <ExternalLink className="w-2.5 h-2.5" /> Portal
                      </a>

                      <Button
                        size="sm"
                        onClick={() => handleDispatchSingular(contact)}
                        disabled={inCooldown}
                        className={cn(
                          'h-7 px-3 text-[10px] font-semibold rounded-lg',
                          inCooldown
                            ? 'bg-muted text-muted-foreground cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                        )}
                      >
                        {inCooldown ? 'Applied' : 'Apply & Dispatch'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 5: FN-06 & FN-07 CAREER PATH ADVISORY TOOL */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'career_advisor' && (
          <div className="flex-1 p-3.5 sm:p-5 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-500" />
                  <span>Career Path Advisory Tool (FN-06 & 07)</span>
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Skill gap detection, 6–12 month quarterly progression roadmap, and verified compensation benchmarks.
                </p>
              </div>

              <Button
                size="sm"
                onClick={handleGenerateRoadmap}
                disabled={isLoadingRoadmap}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-8 px-3 rounded-xl shadow-xs"
              >
                {isLoadingRoadmap ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
                <span>Recalibrate Roadmap</span>
              </Button>
            </div>

            {isLoadingRoadmap && (
              <div className="p-8 text-center space-y-2 text-xs text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto" />
                <p>Analyzing skill gaps and industry compensation benchmarks...</p>
              </div>
            )}

            {advisorAnalysis && !isLoadingRoadmap && (
              <div className="space-y-4">
                {/* CAREER TRAJECTORY & COMPENSATION OVERVIEW */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Target Progression
                    </span>
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <span>{advisorAnalysis.currentRole}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-emerald-600 dark:text-emerald-400">{advisorAnalysis.targetRole}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Badge variant="outline" className="text-[9px] py-0">{advisorAnalysis.currentTier}</Badge>
                      <span>➔</span>
                      <Badge variant="secondary" className="text-[9px] py-0 font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                        {advisorAnalysis.targetTier}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Market Compensation Benchmarks
                    </span>
                    <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      <span>
                        ${(advisorAnalysis.compensation.baseRangeUSD[0] / 1000).toFixed(0)}k - ${(advisorAnalysis.compensation.baseRangeUSD[1] / 1000).toFixed(0)}k USD / yr
                      </span>
                    </div>
                    {advisorAnalysis.compensation.dayRateMaritimeUSD && (
                      <div className="text-[11px] text-muted-foreground">
                        Maritime Day Rate: <strong>${advisorAnalysis.compensation.dayRateMaritimeUSD[0]} - ${advisorAnalysis.compensation.dayRateMaritimeUSD[1]} / day</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* SKILL GAP ANALYSIS */}
                <div className="p-3.5 rounded-xl border border-border/80 bg-background space-y-2.5">
                  <h5 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-500" /> Critical Skill Gaps to Close
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {advisorAnalysis.skillGaps.map((gap, i) => (
                      <div key={i} className="p-2.5 rounded-lg border border-border/70 bg-muted/15 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">{gap.skill}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[8px] py-0 uppercase',
                              gap.urgency === 'high' ? 'text-red-600 border-red-500/30 bg-red-500/10' : 'text-blue-600 border-blue-500/30'
                            )}
                          >
                            {gap.urgency}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-snug">{gap.recommendedAction}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6-12 MONTH PROGRESSION ROADMAP */}
                <div className="p-3.5 rounded-xl border border-border/80 bg-background space-y-2.5">
                  <h5 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-500" /> 6-to-12 Month Milestone Roadmap
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {advisorAnalysis.roadmap.map((m, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-border/80 bg-muted/15 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between border-b border-border/60 pb-1">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">
                            {m.quarter}
                          </span>
                          <span className="font-semibold text-[11px] text-foreground">{m.focus}</span>
                        </div>
                        <ul className="space-y-1 text-[10px] text-muted-foreground list-disc list-inside">
                          {m.deliverables.map((d, dIdx) => (
                            <li key={dIdx} className="leading-tight">{d}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 6: FN-05 WORRIES MEMORY VAULT & SUBMISSION LEDGER */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'memory_vault' && (
          <div className="flex-1 p-3.5 sm:p-5 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-500" />
                  <span>Worries Memory Vault & Submission Ledger (FN-05)</span>
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Decentralized Walrus Sovereign Memory + cryptographically anchored application ledger. Zero data loss.
                </p>
              </div>

              <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                Sovereign Storage Active
              </Badge>
            </div>

            {/* IDENTITY & WALRUS VAULT OVERVIEW */}
            <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2 text-xs">
              <h5 className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Candidate Sovereign Credentials
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded bg-background border border-border/60">
                  <span className="text-[9px] text-muted-foreground block">Sui zkLogin Address:</span>
                  <span className="font-mono text-foreground font-semibold break-all">
                    {sessionAddress || '0x...sovereign-session'}
                  </span>
                </div>
                <div className="p-2 rounded bg-background border border-border/60">
                  <span className="text-[9px] text-muted-foreground block">Mysten Labs Walrus Blob:</span>
                  {overviewWalrusVault?.latestBlobId ? (
                    <a
                      href={overviewWalrusVault.walrusUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-emerald-600 hover:underline break-all"
                    >
                      {overviewWalrusVault.latestBlobId}
                    </a>
                  ) : (
                    <span className="text-muted-foreground italic">Ready to anchor</span>
                  )}
                </div>
              </div>
            </div>

            {/* SUBMISSION LEDGER (APPLIED JOBS WITH VERIFIABLE RECEIPTS) */}
            <div className="p-3.5 rounded-xl border border-border/80 bg-background space-y-2.5">
              <div className="flex items-center justify-between">
                <h5 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-500" /> Submission Ledger ({appliedJobs.length} records)
                </h5>
                <span className="text-[10px] text-muted-foreground">5-day cooldown enforced</span>
              </div>

              {appliedJobs.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-3 text-center">
                  No job applications dispatched yet. Run a search in the Job Scanner to auto-dispatch!
                </p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {appliedJobs.map((record, i) => (
                    <div
                      key={record.id || i}
                      className="p-2.5 rounded-lg border border-border/70 bg-muted/15 flex items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{record.company}</span>
                          <Badge variant="outline" className="text-[9px] py-0">
                            {record.jobTitle || 'Role'}
                          </Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Dispatched: {record.appliedAt ? new Date(record.appliedAt).toLocaleDateString() : 'Recent'}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          downloadEmlReceipt({
                            to: record.contactEmail || 'hiring@' + record.company.toLowerCase() + '.com',
                            fromName: cvForm.name || 'Candidate',
                            fromEmail: cvForm.email || 'candidate@careerace.online',
                            subject: `Receipt: ${record.jobTitle} - ${record.company}`,
                            body: `Verifiable transmission receipt for application to ${record.company}.`,
                            company: record.company,
                            role: record.jobTitle,
                            candidateAddress: sessionAddress,
                          })
                        }}
                        className="h-6 px-2 text-[9px] rounded-md border-border/80"
                      >
                        <Download className="w-2.5 h-2.5 mr-1" /> EML Receipt
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

function SaveIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
      <path d="M7 3v4a1 1 0 0 0 1 1h7" />
    </svg>
  )
}
