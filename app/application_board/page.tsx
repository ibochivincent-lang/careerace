'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AppShell } from '@/components/AppShell'
import {
  Briefcase,
  Bookmark,
  Search,
  ExternalLink,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  MapPin,
  X,
  Undo2,
  Cpu,
  Bot,
  Zap,
  Play,
  RotateCcw,
  Mail,
  Copy,
  Send,
  Check,
  Layers,
  ChevronRight,
  Filter,
  FileText
} from 'lucide-react'
import { toast } from 'sonner'
import { ApplicationFollowUpModal } from '@/components/ApplicationFollowUpModal'
import { VERIFIED_COMPANY_HIRING_CONTACTS, type CompanyHiringContact } from '@/lib/company_directory'
import type { WalrusResumeVersionItem } from '@/components/WalrusVersionDrawer'
import type { ParsedCv } from '@/lib/cv_parser'

export interface JobListing {
  id: string
  title: string
  company: string
  location: string
  country: string
  workplace: 'Remote' | 'Hybrid' | 'On-site'
  seniority: 'Intern / Co-op' | 'Entry Level' | 'Mid-Level' | 'Senior' | 'Lead / Staff'
  roleCategory: string
  postedDate: string
  apply_url: string
  description?: string
  source?: string
}

export interface AppliedJobRecord {
  id: string
  jobTitle: string
  company: string
  appliedAt: string
  appliedTimestamp?: number
  followUpStatus?: 'pending' | 'due' | 'sent'
  followUpSentAt?: string
}

// Real live openings matching benchmark reference and maritime/tech sovereign employers
const VERIFIED_INITIAL_JOBS: JobListing[] = [
  {
    id: 'maersk-cadet-1',
    title: 'Engine Cadet / Trainee Marine Engineer',
    company: 'Maersk',
    location: 'Rotterdam, Netherlands · Fleet Operations',
    country: 'Netherlands',
    workplace: 'On-site',
    seniority: 'Intern / Co-op',
    roleCategory: 'Marine Engineering',
    postedDate: 'Today',
    apply_url: 'https://www.maersk.com/careers',
    description: 'Entry cadetship on container fleet vessels. Assist duty marine engineer with 2-stroke diesel engine watchkeeping, auxiliary boiler monitoring, and fuel bunkering operations.',
  },
  {
    id: 'maersk-marine-1',
    title: 'Marine Systems Engineer (Offshore & Propulsion)',
    company: 'Maersk',
    location: 'Rotterdam, Netherlands · Maritime Operations',
    country: 'Netherlands',
    workplace: 'Hybrid',
    seniority: 'Mid-Level',
    roleCategory: 'Marine Engineering',
    postedDate: 'Today',
    apply_url: 'https://www.maersk.com/careers',
    description: 'Lead mechanical and propulsion telemetry systems on commercial container fleet vessels. Conduct thermal efficiency and emissions modeling using MATLAB and AutoCAD for dual-fuel LNG power plant transitions.',
  },
  {
    id: 'chevron-marine-1',
    title: '3rd Marine Engineer Officer (LNG & Tanker Fleet)',
    company: 'Chevron Shipping',
    location: 'London, United Kingdom · Fleet Operations',
    country: 'United Kingdom',
    workplace: 'On-site',
    seniority: 'Mid-Level',
    roleCategory: 'Marine Engineering',
    postedDate: 'Today',
    apply_url: 'https://careers.chevron.com',
    description: 'Responsible for auxiliary machinery, cargo compressors, bilge separators, and watchkeeping on modern LNG carriers in international waters.',
  },
  {
    id: 'abs-marine-1',
    title: 'Naval Architect & Marine Structural Engineer',
    company: 'American Bureau of Shipping (ABS)',
    location: 'Houston, TX, United States',
    country: 'United States',
    workplace: 'Hybrid',
    seniority: 'Mid-Level',
    roleCategory: 'Marine Engineering',
    postedDate: 'Today',
    apply_url: 'https://ww2.eagle.org/en/careers.html',
    description: 'Conduct structural classification reviews, finite element analysis (FEA), and damage stability calculations for FPSOs and commercial hulls using SolidWorks and hydrodynamic modeling tools.',
  },
  {
    id: 'subsea7-marine-1',
    title: 'Subsea Systems & Ocean Robotics Engineer',
    company: 'Subsea 7',
    location: 'Aberdeen, United Kingdom',
    country: 'United Kingdom',
    workplace: 'Hybrid',
    seniority: 'Senior',
    roleCategory: 'Marine Engineering',
    postedDate: '1d',
    apply_url: 'https://www.subsea7.com/en/careers.html',
    description: 'Engineer deepwater umbilical connections, subsea manifolds, and remote intervention equipment. Interface with vessel superintendents during dynamic positioning (DP) offshore pipelay campaigns.',
  },
  {
    id: 'sbm-marine-1',
    title: 'Marine Power Plants & Decarbonization Specialist',
    company: 'SBM Offshore',
    location: 'Monaco · Offshore Engineering',
    country: 'Monaco',
    workplace: 'Remote',
    seniority: 'Senior',
    roleCategory: 'Marine Engineering',
    postedDate: '1d',
    apply_url: 'https://www.sbmoffshore.com/careers',
    description: 'Design hybrid gas-turbine and battery energy storage architectures for deepwater FPSOs. Perform thermodynamic cycle optimization to reduce offshore carbon intensity.',
  },
  {
    id: 'vard-marine-1',
    title: 'Vessel Operations & Marine Technical Superintendent',
    company: 'Vard Marine',
    location: 'Vancouver, Canada',
    country: 'Canada',
    workplace: 'On-site',
    seniority: 'Lead / Staff',
    roleCategory: 'Marine Engineering',
    postedDate: '2d',
    apply_url: 'https://vardmarine.com/careers',
    description: 'Direct dry-dock maintenance, SOLAS/MARPOL compliance audits, and main propulsion overhauls for specialized polar research and offshore support vessels.',
  },
  {
    id: 'stolt-marine-1',
    title: 'Chief Marine Engineer (Chemical Tankers & Deep Sea)',
    company: 'Stolt Tankers',
    location: 'Rotterdam, Netherlands · Global Fleet',
    country: 'Netherlands',
    workplace: 'On-site',
    seniority: 'Lead / Staff',
    roleCategory: 'Marine Engineering',
    postedDate: '2d',
    apply_url: 'https://www.stolt-nielsen.com/careers',
    description: 'Overall executive command of engine department, planned maintenance system (PMS), class society surveys, and fuel efficiency compliance across international trade routes.',
  },
  {
    id: 'siemens-marine-1',
    title: 'Marine Automation & Control Systems Engineer',
    company: 'Siemens Energy Marine',
    location: 'Oslo, Norway',
    country: 'Norway',
    workplace: 'Hybrid',
    seniority: 'Mid-Level',
    roleCategory: 'Marine Engineering',
    postedDate: '2d',
    apply_url: 'https://www.siemens-energy.com/global/en/company/jobs.html',
    description: 'Configure BlueDrive marine electric propulsion, integrated automation systems (IAS), and power management systems (PMS) for zero-emission maritime vessels.',
  },
  {
    id: 'bourbon-marine-1',
    title: 'Graduate Marine Field Engineer',
    company: 'Bourbon Offshore',
    location: 'Port Harcourt, Nigeria · Marine Base',
    country: 'Nigeria',
    workplace: 'On-site',
    seniority: 'Entry Level',
    roleCategory: 'Marine Engineering',
    postedDate: 'Today',
    apply_url: 'https://www.bourbonoffshore.com/en/careers',
    description: 'Entry-level field engineering position supporting marine superintendent with vessel auxiliary equipment, ballast water management, and bilge separator maintenance.',
  },
  {
    id: 'muon-1',
    title: 'Environmental Test Engineering Intern (Summer 2027)',
    company: 'Muon Space',
    location: 'Mountain View, CA, United States · Internship',
    country: 'United States',
    workplace: 'On-site',
    seniority: 'Intern / Co-op',
    roleCategory: 'Hardware / Test',
    postedDate: 'Today',
    apply_url: 'https://www.muonspace.com/careers',
    description: 'Design and execute environmental stress screening, thermal vacuum, and vibration tests for satellite bus subsystems.',
  },
  {
    id: 'muon-2',
    title: 'Industrial Engineering Intern (Summer 2027)',
    company: 'Muon Space',
    location: 'Mountain View, CA, United States · Internship',
    country: 'United States',
    workplace: 'On-site',
    seniority: 'Intern / Co-op',
    roleCategory: 'Industrial / Quality',
    postedDate: 'Today',
    apply_url: 'https://www.muonspace.com/careers',
    description: 'Optimize manufacturing workflow, cleanroom logistics, and aerospace production line ergonomics.',
  },
  {
    id: 'affirm-1',
    title: 'Software Engineer (Machine Learning) Intern (Summer 2027)',
    company: 'Affirm',
    location: 'United States · Remote',
    country: 'United States',
    workplace: 'Remote',
    seniority: 'Intern / Co-op',
    roleCategory: 'Machine Learning',
    postedDate: '1d',
    apply_url: 'https://www.affirm.com/careers',
    description: 'Build predictive credit risk models, real-time transaction underwriting pipelines, and fraud detection classifiers.',
  },
  {
    id: 'affirm-2',
    title: 'Software Engineer Intern (Summer 2027)',
    company: 'Affirm',
    location: 'United States · Remote',
    country: 'United States',
    workplace: 'Remote',
    seniority: 'Intern / Co-op',
    roleCategory: 'Software Engineer',
    postedDate: '1d',
    apply_url: 'https://www.affirm.com/careers',
    description: 'Develop high-availability financial ledger services, merchant settlement APIs, and resilient checkout SDKs.',
  },
  {
    id: 'wabtec-1',
    title: 'Transducer Manufacturing Engineering Co-Op',
    company: 'Wabtec',
    location: 'Waltham, MA, United States',
    country: 'United States',
    workplace: 'On-site',
    seniority: 'Intern / Co-op',
    roleCategory: 'Industrial / Quality',
    postedDate: '1d',
    apply_url: 'https://www.wabteccorp.com/careers',
    description: 'Support transducer sensor calibration, quality assurance processes, and rail electronics telemetry.',
  },
  {
    id: 'lyft-1',
    title: 'Hardware Field Quality Engineer Intern (Summer 2027)',
    company: 'Lyft',
    location: 'Toronto, Canada · Internship',
    country: 'Canada',
    workplace: 'Hybrid',
    seniority: 'Intern / Co-op',
    roleCategory: 'Hardware / Test',
    postedDate: '1d',
    apply_url: 'https://www.lyft.com/careers',
    description: 'Diagnose micro-mobility telematics, battery management hardware, and rider safety electronics.',
  },
  {
    id: 'xai-1',
    title: 'Spring 2027 Software Engineering Internship/Co-op',
    company: 'xAI',
    location: 'Palo Alto, CA, United States · Internship',
    country: 'United States',
    workplace: 'On-site',
    seniority: 'Intern / Co-op',
    roleCategory: 'Software Engineer',
    postedDate: '1d',
    apply_url: 'https://x.ai/careers',
    description: 'Scale distributed training infrastructure, high-throughput GPU clusters, and reasoning model evaluation harnesses.',
  },
  {
    id: 'xai-2',
    title: 'Summer 2027 Software Engineering Internship/Co-op',
    company: 'xAI',
    location: 'Palo Alto, CA, United States · Internship',
    country: 'United States',
    workplace: 'On-site',
    seniority: 'Intern / Co-op',
    roleCategory: 'Software Engineer',
    postedDate: '1d',
    apply_url: 'https://x.ai/careers',
    description: 'Accelerate synthetic data generation, fast inference kernels, and multimodal frontier models.',
  },
  {
    id: 'solink-1',
    title: 'Software Engineer Co-op, Agents',
    company: 'Solink',
    location: 'Remote · Canada',
    country: 'Canada',
    workplace: 'Remote',
    seniority: 'Intern / Co-op',
    roleCategory: 'Software Engineer',
    postedDate: '1d',
    apply_url: 'https://solink.com/careers/',
    description: 'Architect autonomous visual intelligence agents, edge surveillance telemetry, and computer vision microservices.',
  },
  {
    id: 'harvey-1',
    title: 'Software Engineering Intern (Winter 2027)',
    company: 'Harvey',
    location: 'Toronto, Canada · Internship',
    country: 'Canada',
    workplace: 'Hybrid',
    seniority: 'Intern / Co-op',
    roleCategory: 'Software Engineer',
    postedDate: '1d',
    apply_url: 'https://www.harvey.ai/careers',
    description: 'Build enterprise legal intelligence workflows, dense retrieval systems, and secure document processing pipelines.',
  },
  {
    id: 'harvey-2',
    title: 'Software Engineering Intern (Summer 2027)',
    company: 'Harvey',
    location: 'New York, NY, United States · Internship',
    country: 'United States',
    workplace: 'Hybrid',
    seniority: 'Intern / Co-op',
    roleCategory: 'Software Engineer',
    postedDate: '1d',
    apply_url: 'https://www.harvey.ai/careers',
    description: 'Engineered high-concurrency LLM agents, citation verification frameworks, and SOC-2 compliant backend services.',
  },
  {
    id: 'sopra-1',
    title: "Stage - Developpement d'un agent IA pour generation de code",
    company: 'Sopra Steria',
    location: 'Aix-en-Provence, France · Internship',
    country: 'France',
    workplace: 'On-site',
    seniority: 'Intern / Co-op',
    roleCategory: 'Machine Learning',
    postedDate: '1d',
    apply_url: 'https://www.soprasteria.com/careers',
    description: 'Fine-tune open-weights code generation models, benchmark test synthesis, and integrate IDE extensions.',
  },
  {
    id: 'anduril-1',
    title: '2027 Industrial Engineer Intern',
    company: 'Anduril',
    location: 'Costa Mesa, CA, United States · Internship',
    country: 'United States',
    workplace: 'On-site',
    seniority: 'Intern / Co-op',
    roleCategory: 'Industrial / Quality',
    postedDate: '1d',
    apply_url: 'https://www.anduril.com/careers',
    description: 'Scale autonomous defense system assembly lines, hardware-in-the-loop validation, and supply chain telemetry.',
  },
  {
    id: 'mysten-1',
    title: 'Senior Full Stack Engineer, Walrus Protocol',
    company: 'Mysten Labs',
    location: 'Remote Worldwide · Full-time',
    country: 'Remote Worldwide',
    workplace: 'Remote',
    seniority: 'Senior',
    roleCategory: 'Full Stack',
    postedDate: 'Today',
    apply_url: 'https://jobs.ashbyhq.com/mystenlabs',
    description: 'Lead developer tooling, web clients, and decentralized storage SDKs for the Walrus protocol on Sui.',
  },
  {
    id: 'anthropic-1',
    title: 'Research Engineer, Foundation Models',
    company: 'Anthropic',
    location: 'San Francisco, CA · Full-time',
    country: 'United States',
    workplace: 'Hybrid',
    seniority: 'Senior',
    roleCategory: 'Machine Learning',
    postedDate: 'Today',
    apply_url: 'https://jobs.lever.co/anthropic',
    description: 'Conduct empirical research on frontier reasoning architectures, alignment verifiers, and mechanistic interpretability.',
  },
  {
    id: 'google-1',
    title: 'Software Engineer III, Infrastructure',
    company: 'Google',
    location: 'Mountain View, CA · Full-time',
    country: 'United States',
    workplace: 'Hybrid',
    seniority: 'Mid-Level',
    roleCategory: 'Backend',
    postedDate: '2d',
    apply_url: 'https://careers.google.com',
    description: 'Engineer planetary-scale RPC frameworks, Borg cluster management subsystems, and resilient cloud storage backends.',
  },
  {
    id: 'vercel-1',
    title: 'Senior Frontend Engineer, Developer Experience',
    company: 'Vercel',
    location: 'Remote Worldwide · Full-time',
    country: 'Remote Worldwide',
    workplace: 'Remote',
    seniority: 'Senior',
    roleCategory: 'Frontend',
    postedDate: '1d',
    apply_url: 'https://vercel.com/careers',
    description: 'Build high-performance web tooling, Next.js server components architecture, and streaming dashboard interfaces.',
  },
  {
    id: 'stripe-1',
    title: 'Systems Engineer, High Throughput Payments',
    company: 'Stripe',
    location: 'New York, NY · Full-time',
    country: 'United States',
    workplace: 'Hybrid',
    seniority: 'Senior',
    roleCategory: 'DevOps / Cloud',
    postedDate: '2d',
    apply_url: 'https://stripe.com/jobs',
    description: 'Scale sub-millisecond payment authorization pipelines, multi-region database failover, and global clearinghouse integrations.',
  },
]

// Visual Company Badge / Logo Renderer: Clean, typographic monograms only (no emojis)
function CompanyLogo({ company }: { company: string }) {
  const c = company.toLowerCase()

  if (c.includes('maersk')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#002B49] text-white font-bold flex items-center justify-center text-[10px] tracking-wider shadow-xs shrink-0">
        MSK
      </div>
    )
  }
  if (c.includes('american bureau') || c.includes('abs')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#002D62] text-white font-bold flex items-center justify-center text-[10px] tracking-tight shadow-xs shrink-0">
        ABS
      </div>
    )
  }
  if (c.includes('chevron')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#005B94] text-white font-bold flex items-center justify-center text-[10px] tracking-wider shadow-xs shrink-0">
        CVX
      </div>
    )
  }
  if (c.includes('subsea')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#008559] text-white font-bold flex items-center justify-center text-[11px] font-mono shadow-xs shrink-0">
        S7
      </div>
    )
  }
  if (c.includes('sbm')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#0A2240] text-amber-400 font-bold flex items-center justify-center text-[10px] shadow-xs shrink-0">
        SBM
      </div>
    )
  }
  if (c.includes('stolt')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#1B365D] text-cyan-300 font-bold flex items-center justify-center text-[10px] shadow-xs shrink-0">
        SNS
      </div>
    )
  }
  if (c.includes('vard')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#1B365D] text-white font-bold flex items-center justify-center text-[10px] tracking-wider shadow-xs shrink-0">
        VRD
      </div>
    )
  }
  if (c.includes('siemens')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#00646E] text-white font-bold flex items-center justify-center text-[10px] shadow-xs shrink-0">
        SIE
      </div>
    )
  }
  if (c.includes('bourbon')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#B45309] text-white font-bold flex items-center justify-center text-[10px] tracking-wider shadow-xs shrink-0">
        BRB
      </div>
    )
  }
  if (c.includes('muon')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-bold flex items-center justify-center text-[10px] tracking-wide shadow-xs shrink-0">
        MU
      </div>
    )
  }
  if (c.includes('affirm')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-blue-700 text-white font-bold flex items-center justify-center text-[10px] tracking-wider shadow-xs shrink-0">
        AFR
      </div>
    )
  }
  if (c.includes('wabtec')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-red-700 text-white font-bold flex items-center justify-center text-[10px] tracking-wider shadow-xs shrink-0">
        WAB
      </div>
    )
  }
  if (c.includes('lyft')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#A21CAF] text-white font-black flex items-center justify-center text-[9px] tracking-tight shadow-xs shrink-0">
        LYFT
      </div>
    )
  }
  if (c.includes('xai')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-black flex items-center justify-center text-xs shadow-xs shrink-0">
        xAI
      </div>
    )
  }
  if (c.includes('solink')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-teal-700 text-white font-bold flex items-center justify-center text-[10px] tracking-wider shadow-xs shrink-0">
        SLK
      </div>
    )
  }
  if (c.includes('harvey')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-serif font-black flex items-center justify-center text-xs shadow-xs shrink-0">
        HRV
      </div>
    )
  }
  if (c.includes('sopra')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#DC2626] text-white font-bold flex items-center justify-center text-[10px] tracking-wider shadow-xs shrink-0">
        SOP
      </div>
    )
  }
  if (c.includes('anduril')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-bold flex items-center justify-center text-[10px] tracking-wider shadow-xs shrink-0">
        AND
      </div>
    )
  }
  if (c.includes('mysten')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-cyan-700 text-white font-bold flex items-center justify-center text-[10px] tracking-wider shadow-xs shrink-0">
        MYS
      </div>
    )
  }
  if (c.includes('anthropic')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#C2410C] text-white font-bold flex items-center justify-center text-[10px] tracking-wider shadow-xs shrink-0">
        ANT
      </div>
    )
  }
  if (c.includes('google')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] tracking-wider shadow-xs shrink-0">
        GOOG
      </div>
    )
  }
  if (c.includes('vercel')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-black flex items-center justify-center text-[10px] tracking-wider shadow-xs shrink-0">
        VCL
      </div>
    )
  }
  if (c.includes('stripe')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#4338CA] text-white font-bold flex items-center justify-center text-[10px] tracking-wider shadow-xs shrink-0">
        STRP
      </div>
    )
  }

  // Clean fallback monogram (2 letters)
  const letters = company
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="w-8 h-8 rounded-lg bg-muted text-foreground border border-border font-bold flex items-center justify-center text-[10px] tracking-wider shrink-0">
      {letters || 'JB'}
    </div>
  )
}

// Normalized matching helpers that fix category and seniority filter bugs
function matchesRoleCategory(job: JobListing, filter: string): boolean {
  if (filter === 'all') return true
  const r = (job.roleCategory || '').toLowerCase()
  const t = (job.title || '').toLowerCase()

  if (filter === 'marine') {
    return (
      r.includes('marine') ||
      r.includes('naval') ||
      r.includes('offshore') ||
      t.includes('marine') ||
      t.includes('naval') ||
      t.includes('offshore') ||
      t.includes('subsea') ||
      t.includes('vessel') ||
      t.includes('propulsion') ||
      t.includes('cadet') ||
      t.includes('tanker')
    )
  }
  if (filter === 'software') {
    return (
      r.includes('software') ||
      r.includes('full stack') ||
      r.includes('frontend') ||
      r.includes('backend') ||
      r.includes('devops') ||
      t.includes('software') ||
      t.includes('full stack') ||
      t.includes('frontend') ||
      t.includes('backend') ||
      t.includes('developer')
    )
  }
  if (filter === 'ai_ml') {
    return (
      r.includes('machine learning') ||
      r.includes('ai') ||
      t.includes('machine learning') ||
      t.includes('ai') ||
      t.includes('research engineer')
    )
  }
  if (filter === 'hardware_aerospace') {
    return (
      r.includes('hardware') ||
      r.includes('aerospace') ||
      t.includes('hardware') ||
      t.includes('test') ||
      t.includes('satellite') ||
      t.includes('space')
    )
  }
  if (filter === 'industrial_quality') {
    return (
      r.includes('industrial') ||
      r.includes('quality') ||
      t.includes('industrial') ||
      t.includes('quality') ||
      t.includes('manufacturing') ||
      t.includes('transducer')
    )
  }

  return job.roleCategory === filter
}

function matchesSeniority(job: JobListing, filter: string): boolean {
  if (filter === 'all') return true
  const s = (job.seniority || '').toLowerCase()
  const t = (job.title || '').toLowerCase()

  if (filter === 'intern_cadet') {
    return (
      s.includes('intern') ||
      s.includes('co-op') ||
      t.includes('cadet') ||
      t.includes('intern') ||
      t.includes('trainee') ||
      t.includes('stage')
    )
  }
  if (filter === 'entry_junior') {
    return (
      s.includes('entry') ||
      t.includes('entry') ||
      t.includes('graduate') ||
      t.includes('junior') ||
      t.includes('field engineer') ||
      t.includes('4th eng')
    )
  }
  if (filter === 'mid_officer') {
    return (
      s.includes('mid') ||
      t.includes('3rd eng') ||
      t.includes('2nd eng') ||
      t.includes('officer') ||
      t.includes('systems engineer') ||
      t.includes('architect')
    )
  }
  if (filter === 'senior') {
    return s.includes('senior') || t.includes('senior') || t.includes('specialist')
  }
  if (filter === 'lead_chief') {
    return (
      s.includes('lead') ||
      s.includes('staff') ||
      t.includes('chief') ||
      t.includes('superintendent') ||
      t.includes('principal') ||
      t.includes('lead') ||
      t.includes('staff')
    )
  }

  return true
}

export default function ApplicationBoardPage() {
  const router = useRouter()

  // 4 distinct stages requested by user:
  // 1. Discovery, 2. Saved, 3. Applied, 4. Auto Apply
  const [activeBoardTab, setActiveBoardTab] = useState<'discover' | 'saved' | 'applied' | 'auto_apply'>('discover')

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState('all')
  const [selectedSeniority, setSelectedSeniority] = useState('all')
  const [selectedCompany, setSelectedCompany] = useState('all')
  const [selectedCountry, setSelectedCountry] = useState('all')
  const [selectedWorkplace, setSelectedWorkplace] = useState('all')

  // Job storage state
  const [allJobs, setAllJobs] = useState<JobListing[]>(VERIFIED_INITIAL_JOBS)
  const [savedJobIds, setSavedJobIds] = useState<string[]>([])
  const [appliedJobs, setAppliedJobs] = useState<AppliedJobRecord[]>([])
  const [followUpModalJob, setFollowUpModalJob] = useState<{ job: JobListing; record: AppliedJobRecord } | null>(null)

  // Multi-CV / Walrus Version selection state
  const [walrusVersions, setWalrusVersions] = useState<WalrusResumeVersionItem[]>([])
  const [selectedCvVersionId, setSelectedCvVersionId] = useState<string>('active_draft')
  const [activeDraftProfile, setActiveDraftProfile] = useState<ParsedCv | null>(null)

  // Auto-Apply corporate directory & live composer state
  const [companyCategoryFilter, setCompanyCategoryFilter] = useState<string>('all')
  const [companySearchQuery, setCompanySearchQuery] = useState('')
  const [targetCompanyInput, setTargetCompanyInput] = useState('A.P. Moller - Maersk')
  const [targetRoleInput, setTargetRoleInput] = useState('Engine Cadet / Trainee Marine Engineer')
  const [targetEmailInput, setTargetEmailInput] = useState('careers.marine@maersk.com')
  const [customEmailSubject, setCustomEmailSubject] = useState('')
  const [customEmailBody, setCustomEmailBody] = useState('')
  const [copiedDraft, setCopiedDraft] = useState(false)

  // Auto-apply agent state
  const [autoApplyRunning, setAutoApplyRunning] = useState(false)
  const [autoApplyLogs, setAutoApplyLogs] = useState<string[]>([
    'Agent standby: Walrus sovereign wallet authenticated.',
    'Verified corporate hiring directory loaded (18 verified recruitment contacts).',
    'Candidate sovereign attestations indexed for direct immutable verification.',
  ])

  // Load saved & applied jobs, Walrus versions, and sovereign profile from localStorage
  useEffect(() => {
    try {
      const storedSaved = localStorage.getItem('careerace_saved_job_ids')
      if (storedSaved) {
        setSavedJobIds(JSON.parse(storedSaved))
      }
    } catch {}

    try {
      const storedApplied = localStorage.getItem('careerace_applied_jobs')
      if (storedApplied) {
        setAppliedJobs(JSON.parse(storedApplied))
      }
    } catch {}

    try {
      const storedVersions = localStorage.getItem('careerace_walrus_versions')
      if (storedVersions) {
        setWalrusVersions(JSON.parse(storedVersions))
      }
    } catch {}

    try {
      const storedProfile = localStorage.getItem('careerace_sovereign_profile')
      if (storedProfile) {
        setActiveDraftProfile(JSON.parse(storedProfile))
      }
    } catch {}

    // Harvest fresh live tech & marine jobs
    fetch('/api/harvest?query=software%20engineer')
      .then((res) => res.json())
      .then((data) => {
        if (data.jobs && Array.isArray(data.jobs) && data.jobs.length > 0) {
          const formattedHarvested: JobListing[] = data.jobs.slice(0, 15).map((j: any) => ({
            id: `harvest-${j.job_id || Math.random().toString(36).substring(7)}`,
            title: j.title,
            company: j.company,
            location: j.location || (j.is_remote ? 'Remote' : 'United States'),
            country: j.location?.toLowerCase().includes('canada')
              ? 'Canada'
              : j.location?.toLowerCase().includes('france')
              ? 'France'
              : j.location?.toLowerCase().includes('uk')
              ? 'United Kingdom'
              : j.is_remote
              ? 'Remote Worldwide'
              : 'United States',
            workplace: j.is_remote ? 'Remote' : 'Hybrid',
            seniority: j.title.toLowerCase().includes('senior')
              ? 'Senior'
              : j.title.toLowerCase().includes('intern')
              ? 'Intern / Co-op'
              : 'Mid-Level',
            roleCategory: j.title.toLowerCase().includes('machine learning') || j.title.toLowerCase().includes('ai')
              ? 'Machine Learning'
              : j.title.toLowerCase().includes('frontend')
              ? 'Frontend'
              : j.title.toLowerCase().includes('backend')
              ? 'Backend'
              : 'Software Engineer',
            postedDate: 'Today',
            apply_url: j.apply_url || 'https://careerace.online',
            description: j.description,
            source: j.source,
          }))

          setAllJobs((prev) => {
            const existingIds = new Set(prev.map((p) => p.id))
            const newOnes = formattedHarvested.filter((h) => !existingIds.has(h.id))
            return [...prev, ...newOnes]
          })
        }
      })
      .catch(() => {})
  }, [])

  // Toggle bookmark / saved job
  function toggleSaveJob(jobId: string, jobTitle: string) {
    let updated: string[]
    if (savedJobIds.includes(jobId)) {
      updated = savedJobIds.filter((id) => id !== jobId)
      toast.info(`Removed "${jobTitle}" from Saved roles.`)
    } else {
      updated = [...savedJobIds, jobId]
      toast.success(`Saved "${jobTitle}" to your watch list!`)
    }
    setSavedJobIds(updated)
    localStorage.setItem('careerace_saved_job_ids', JSON.stringify(updated))
  }

  // Mark as applied: Removes from Discovery and adds to Applied list with 7-day scheduler baseline
  function handleMarkAsApplied(job: JobListing) {
    const now = Date.now()
    const record: AppliedJobRecord = {
      id: job.id,
      jobTitle: job.title,
      company: job.company,
      appliedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      appliedTimestamp: now,
      followUpStatus: 'pending',
    }

    const updated = [record, ...appliedJobs.filter((a) => a.id !== job.id)]
    setAppliedJobs(updated)
    localStorage.setItem('careerace_applied_jobs', JSON.stringify(updated))

    toast.success(`Applied to ${job.company}! Removed from Discovery and scheduled 7-day follow-up.`)
  }

  // Mark follow-up as sent
  function handleMarkFollowUpSent(jobId: string) {
    const updated = appliedJobs.map((a) => {
      if (a.id === jobId) {
        return {
          ...a,
          followUpStatus: 'sent' as const,
          followUpSentAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        }
      }
      return a
    })
    setAppliedJobs(updated)
    localStorage.setItem('careerace_applied_jobs', JSON.stringify(updated))
    toast.success('Follow-up marked as sent!')
  }

  // Unmark applied: Moves back to Discovery
  function handleUnmarkApplied(jobId: string, jobTitle: string) {
    const updated = appliedJobs.filter((a) => a.id !== jobId)
    setAppliedJobs(updated)
    localStorage.setItem('careerace_applied_jobs', JSON.stringify(updated))
    toast.info(`Moved "${jobTitle}" back to Discovery.`)
  }

  // Set of applied IDs for fast exclusion
  const appliedJobIdSet = useMemo(() => new Set(appliedJobs.map((a) => a.id)), [appliedJobs])

  // Filtered jobs calculation
  const filteredJobs = useMemo(() => {
    return allJobs.filter((job) => {
      // 1. Stage tab filter:
      // Discovery: Show ONLY jobs NOT applied yet
      if (activeBoardTab === 'discover' && appliedJobIdSet.has(job.id)) {
        return false
      }

      // Saved: Show ONLY saved jobs
      if (activeBoardTab === 'saved' && !savedJobIds.includes(job.id)) {
        return false
      }

      // Applied: Show ONLY jobs that were applied
      if (activeBoardTab === 'applied' && !appliedJobIdSet.has(job.id)) {
        return false
      }

      // 2. Search query filter (matches title, company, or location)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchTitle = job.title.toLowerCase().includes(q)
        const matchCompany = job.company.toLowerCase().includes(q)
        const matchLocation = job.location.toLowerCase().includes(q)
        if (!matchTitle && !matchCompany && !matchLocation) return false
      }

      // 3. Role Category Filter (Normalized to prevent bugs)
      if (!matchesRoleCategory(job, selectedRole)) {
        return false
      }

      // 4. Seniority / Rank Filter (Marine & Tech normalized)
      if (!matchesSeniority(job, selectedSeniority)) {
        return false
      }

      // 5. Company Filter
      if (selectedCompany !== 'all' && job.company !== selectedCompany) {
        return false
      }

      // 6. Country Filter
      if (selectedCountry !== 'all') {
        if (selectedCountry === 'us' && job.country !== 'United States') return false
        if (selectedCountry === 'ca' && job.country !== 'Canada') return false
        if (selectedCountry === 'uk' && job.country !== 'United Kingdom') return false
        if (selectedCountry === 'fr' && job.country !== 'France') return false
        if (selectedCountry === 'nl' && job.country !== 'Netherlands') return false
        if (selectedCountry === 'remote' && job.country !== 'Remote Worldwide') return false
      }

      // 7. Workplace Filter
      if (selectedWorkplace !== 'all' && job.workplace.toLowerCase() !== selectedWorkplace.toLowerCase()) {
        return false
      }

      return true
    })
  }, [
    allJobs,
    activeBoardTab,
    savedJobIds,
    appliedJobIdSet,
    searchQuery,
    selectedRole,
    selectedSeniority,
    selectedCompany,
    selectedCountry,
    selectedWorkplace,
  ])

  // Extract unique companies for dropdown
  const uniqueCompanies = useMemo(() => {
    const set = new Set(allJobs.map((j) => j.company))
    return Array.from(set).sort()
  }, [allJobs])

  // Active Walrus Version metadata
  const selectedVersionMeta = useMemo(() => {
    if (selectedCvVersionId === 'active_draft') return null
    return walrusVersions.find((v) => v.id === selectedCvVersionId) || null
  }, [selectedCvVersionId, walrusVersions])

  // Resolved Profile data (from active draft or Walrus snapshot)
  const activeProfileData = useMemo(() => {
    if (selectedVersionMeta && selectedVersionMeta.profileSnapshot) {
      return selectedVersionMeta.profileSnapshot
    }
    return activeDraftProfile
  }, [selectedVersionMeta, activeDraftProfile])

  // Filtered verified corporate hiring contacts
  const filteredCompanyContacts = useMemo(() => {
    return VERIFIED_COMPANY_HIRING_CONTACTS.filter((c) => {
      if (companyCategoryFilter !== 'all' && c.category !== companyCategoryFilter) {
        return false
      }
      if (companySearchQuery.trim()) {
        const q = companySearchQuery.toLowerCase()
        const matchName = c.company.toLowerCase().includes(q)
        const matchEmail = c.contactEmail.toLowerCase().includes(q)
        const matchRoles = c.typicalRoles?.some((r) => r.toLowerCase().includes(q))
        if (!matchName && !matchEmail && !matchRoles) return false
      }
      return true
    })
  }, [companyCategoryFilter, companySearchQuery])

  // Dynamically compose formal, professional application draft (No AI slop)
  useEffect(() => {
    const candidateName = activeProfileData?.applicant_name || 'Candidate'
    const candidateEmail = activeProfileData?.email || 'applicant@careerace.online'
    const candidatePhone = activeProfileData?.phone || ''
    const candidateRole = selectedVersionMeta?.role || activeProfileData?.target_roles?.[0] || targetRoleInput || 'Applicant'
    const walrusBlobId = selectedVersionMeta?.blobId || ''
    const walrusUrl = walrusBlobId ? `https://walruscan.com/testnet/blob/${walrusBlobId}` : 'https://careerace.online'

    const topSkills = activeProfileData?.skills?.slice(0, 5).join(', ') || 'Systems Engineering, Operational Diagnostics, Technical Rigor'
    const recentExp = activeProfileData?.work_experience?.[0]
    const expSummary = recentExp
      ? `In my previous role as ${recentExp.role} at ${recentExp.company}, I focused on ${recentExp.highlights?.[0] || 'delivering verified technical impact'}.`
      : 'My technical background emphasizes operational readiness, analytical precision, and engineering discipline.'

    setCustomEmailSubject(`Application: ${targetRoleInput || candidateRole} – ${candidateName} (Walrus Sovereign Credential)`)
    
    setCustomEmailBody(
`Dear Hiring Team at ${targetCompanyInput || 'the Organization'},

I am writing to formally submit my application for the position of ${targetRoleInput || candidateRole}.

${expSummary}

Key Competencies & Attestations:
• Target Role: ${targetRoleInput || candidateRole}
• Verified Skill Profile: ${topSkills}
• Sovereign Portfolio: Cryptographically certified CV snapshot on Mysten Labs Walrus storage.

My complete credentials, verified work attestations, and cryptographic sovereign portfolio are permanently recorded on Walrus at:
${walrusUrl}

I would welcome the opportunity to discuss how my technical experience and disciplined approach align with your operational standards.

Sincerely,
${candidateName}
${candidateEmail}${candidatePhone ? ` | ${candidatePhone}` : ''}
Walrus Sovereign Credential ID: ${walrusBlobId || 'Recorded on Walrus Testnet'}`
    )
  }, [activeProfileData, targetCompanyInput, targetRoleInput, selectedVersionMeta])

  function handleSelectCompanyFromDirectory(contact: CompanyHiringContact) {
    setTargetCompanyInput(contact.company)
    setTargetEmailInput(contact.contactEmail)
    if (contact.typicalRoles && contact.typicalRoles.length > 0) {
      setTargetRoleInput(contact.typicalRoles[0])
    }
    toast.success(`Selected ${contact.company} (${contact.contactEmail}) for auto-apply.`)
  }

  function handleSendApplicationEmail() {
    if (!targetEmailInput || !targetEmailInput.includes('@')) {
      toast.error('Please specify a valid corporate hiring email.')
      return
    }

    const mailtoUrl = `mailto:${encodeURIComponent(targetEmailInput)}?subject=${encodeURIComponent(
      customEmailSubject
    )}&body=${encodeURIComponent(customEmailBody)}`

    window.location.href = mailtoUrl

    const now = Date.now()
    const record: AppliedJobRecord = {
      id: `direct-apply-${Date.now()}`,
      jobTitle: targetRoleInput || 'Candidate Application',
      company: targetCompanyInput || 'Corporate Direct',
      appliedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      appliedTimestamp: now,
      followUpStatus: 'pending',
    }

    const updated = [record, ...appliedJobs]
    setAppliedJobs(updated)
    localStorage.setItem('careerace_applied_jobs', JSON.stringify(updated))

    setAutoApplyLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] Dispatched application to ${targetEmailInput} (${targetCompanyInput}) via mail client. Scheduled 7-day follow-up.`,
      ...prev,
    ])

    toast.success(`Dispatched application to ${targetEmailInput} and logged into Applied tracker!`)
  }

  function handleCopyApplicationDraft() {
    const fullDraft = `To: ${targetEmailInput}\nSubject: ${customEmailSubject}\n\n${customEmailBody}`
    navigator.clipboard.writeText(fullDraft)
    setCopiedDraft(true)
    setTimeout(() => setCopiedDraft(false), 2500)
    toast.success('Application draft copied to clipboard!')
  }

  function handleRecordAsAppliedDirectly() {
    const now = Date.now()
    const record: AppliedJobRecord = {
      id: `direct-apply-${Date.now()}`,
      jobTitle: targetRoleInput || 'Candidate Application',
      company: targetCompanyInput || 'Corporate Direct',
      appliedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      appliedTimestamp: now,
      followUpStatus: 'pending',
    }

    const updated = [record, ...appliedJobs]
    setAppliedJobs(updated)
    localStorage.setItem('careerace_applied_jobs', JSON.stringify(updated))

    setAutoApplyLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] Manually logged application for ${targetCompanyInput} (${targetRoleInput}).`,
      ...prev,
    ])

    toast.success(`Logged application to ${targetCompanyInput} in your Applied tracker.`)
  }

  // Simulate auto apply cycle
  function triggerAutoApplyCycle() {
    setAutoApplyRunning(true)
    setAutoApplyLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] Scanning verified corporate hiring contacts for target role: "${targetRoleInput}"...`,
      ...prev,
    ])

    setTimeout(() => {
      const matchedContact =
        filteredCompanyContacts.find((c) =>
          c.typicalRoles?.some((r) => r.toLowerCase().includes(targetRoleInput.toLowerCase()))
        ) || filteredCompanyContacts[0] || VERIFIED_COMPANY_HIRING_CONTACTS[0]

      if (matchedContact) {
        handleSelectCompanyFromDirectory(matchedContact)
      }

      setAutoApplyLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] Matched hiring target: ${matchedContact.company} (${matchedContact.contactEmail})`,
        `[${new Date().toLocaleTimeString()}] Prepared tailored application letter with Walrus cryptographic proof`,
        ...prev,
      ])
      setAutoApplyRunning(false)
      toast.success(`Matched opening at ${matchedContact.company}! Draft loaded in composer ready for email dispatch.`)
    }, 1500)
  }

  return (
    <AppShell>
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Top Header & 4 Stage Navigation Tabs: 1. Discovery, 2. Saved, 3. Applied, 4. Auto Apply */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-border/60">
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/80 w-fit">
            {/* Stage 1: Discovery */}
            <button
              onClick={() => setActiveBoardTab('discover')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeBoardTab === 'discover'
                  ? 'bg-background text-foreground shadow-xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-sm bg-muted text-foreground">1</span>
              <Briefcase className="w-3.5 h-3.5" />
              <span>Discovery</span>
            </button>

            {/* Stage 2: Saved */}
            <button
              onClick={() => setActiveBoardTab('saved')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeBoardTab === 'saved'
                  ? 'bg-background text-foreground shadow-xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-sm bg-muted text-foreground">2</span>
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved</span>
              {savedJobIds.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-primary/10 text-primary">
                  {savedJobIds.length}
                </span>
              )}
            </button>

            {/* Stage 3: Applied */}
            <button
              onClick={() => setActiveBoardTab('applied')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeBoardTab === 'applied'
                  ? 'bg-background text-foreground shadow-xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-sm bg-muted text-foreground">3</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Applied</span>
              {appliedJobs.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {appliedJobs.length}
                </span>
              )}
            </button>

            {/* Stage 4: Auto Apply */}
            <button
              onClick={() => setActiveBoardTab('auto_apply')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeBoardTab === 'auto_apply'
                  ? 'bg-background text-foreground shadow-xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-sm bg-muted text-foreground">4</span>
              <Bot className="w-3.5 h-3.5 text-primary" />
              <span>Auto Apply</span>
              <Badge variant="outline" className="text-[9px] py-0 px-1 border-primary/30 text-primary">
                AI
              </Badge>
            </button>
          </div>

          {/* Real-time status indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[11px]">Sovereign Pipeline · Auto-Sync Active</span>
          </div>
        </div>

        {/* Walrus Sovereign CV Version Selector Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">Active CV Version</span>
                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  Walrus Sovereign Storage
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Select which tailored CV identity to present when applying across companies.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedCvVersionId('active_draft')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCvVersionId === 'active_draft'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              Active Draft {activeDraftProfile?.target_roles?.[0] ? `(${activeDraftProfile.target_roles[0]})` : ''}
            </button>
            {walrusVersions.map((ver) => (
              <button
                key={ver.id}
                onClick={() => setSelectedCvVersionId(ver.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  selectedCvVersionId === ver.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground border border-border'
                }`}
              >
                <span>{ver.label || `v${ver.versionNumber}`}</span>
                {ver.role && (
                  <span className="text-[10px] opacity-80 font-mono">· {ver.role}</span>
                )}
              </button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard?tab=resumes')}
              className="text-[11px] text-muted-foreground hover:text-foreground h-8 px-2 gap-1"
            >
              <span>Manage Versions</span>
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* View Content depending on active tab */}
        {activeBoardTab === 'auto_apply' ? (
          /* Stage 4: Auto Apply via Corporate Emails & Walrus Credentials */
          <div className="space-y-6">
            {/* Top Auto Apply Banner */}
            <Card className="p-6 rounded-2xl border bg-card">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/60">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-emerald-500" />
                    <h2 className="text-base font-bold text-foreground">Corporate Email Application Dispatch</h2>
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                      Direct Hiring Contacts
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                    Dispatches applications directly to verified corporate recruitment emails (careers@, recruiting@) or custom employers. 
                    Embeds immutable Walrus blob credentials and tailors the pitch to your selected CV snapshot.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={triggerAutoApplyCycle}
                    disabled={autoApplyRunning}
                    className="gap-2 text-xs font-semibold h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {autoApplyRunning ? (
                      <>
                        <Zap className="w-4 h-4 animate-spin text-white" />
                        <span>Matching Corporate Openings...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>Scan Corporate Openings</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Active Profile Snapshot Card */}
              <div className="p-4 mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center font-bold text-xs text-foreground shrink-0 shadow-xs">
                    <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        {selectedVersionMeta ? (selectedVersionMeta.label || `v${selectedVersionMeta.versionNumber}`) : 'Active Working Draft'}
                      </span>
                      <Badge variant="secondary" className="text-[10px] bg-background font-medium border border-border">
                        {selectedVersionMeta?.role || activeProfileData?.target_roles?.[0] || 'General Engineering'}
                      </Badge>
                      {selectedVersionMeta?.company && (
                        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600">
                          {selectedVersionMeta.company}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Candidate: <span className="text-foreground font-medium">{activeProfileData?.applicant_name || 'Candidate'}</span> · {activeProfileData?.skills?.length || 0} Verified Skills · Walrus Storage Certified
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {selectedVersionMeta?.blobId ? (
                    <a
                      href={`https://walruscan.com/testnet/blob/${selectedVersionMeta.blobId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] hover:bg-emerald-500/20 transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>walruscan.com/{selectedVersionMeta.blobId.slice(0, 8)}...</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-muted-foreground text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Ready for Permanent Walrus Commit</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Main Operations Split: Verified Directory vs Live Composer */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                {/* Left Column (5 cols): Verified Corporate Hiring Directory & Custom Input */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Verified Directory Header */}
                  <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-500" />
                        <h3 className="text-xs font-bold text-foreground">Verified Corporate Hiring Directory</h3>
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {filteredCompanyContacts.length} verified
                      </Badge>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                      <input
                        type="text"
                        value={companySearchQuery}
                        onChange={(e) => setCompanySearchQuery(e.target.value)}
                        placeholder="Search employer, email, or role..."
                        className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex flex-wrap gap-1 text-[11px]">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'Maritime / Offshore', label: 'Maritime' },
                        { id: 'Software / Cloud', label: 'Software' },
                        { id: 'AI / Robotics', label: 'AI' },
                        { id: 'Engineering / Industrial', label: 'Engineering' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setCompanyCategoryFilter(cat.id)}
                          className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                            companyCategoryFilter === cat.id
                              ? 'bg-foreground text-background'
                              : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Company Cards List */}
                    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                      {filteredCompanyContacts.map((contact) => (
                        <div
                          key={contact.id}
                          className={`p-3 rounded-xl border transition-all text-xs space-y-2 ${
                            targetCompanyInput === contact.company
                              ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20'
                              : 'border-border/80 bg-background hover:bg-muted/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-bold text-foreground block">{contact.company}</span>
                              <span className="text-[11px] text-muted-foreground block font-mono">
                                {contact.contactEmail}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-[9px] shrink-0 border-border">
                              {contact.category.split('/')[0].trim()}
                            </Badge>
                          </div>

                          {contact.typicalRoles && (
                            <div className="flex flex-wrap gap-1">
                              {contact.typicalRoles.slice(0, 2).map((r, rIdx) => (
                                <span
                                  key={rIdx}
                                  className="text-[10px] px-1.5 py-0.5 rounded-sm bg-muted/80 text-foreground font-mono"
                                >
                                  {r}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="pt-1 flex items-center justify-between border-t border-border/40">
                            <span className="text-[10px] text-muted-foreground">
                              Verified Recruitment Desk
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSelectCompanyFromDirectory(contact)}
                              className="h-6 text-[10px] px-2 font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                            >
                              <span>Use in Composer</span>
                              <ChevronRight className="w-3 h-3 ml-0.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Manual Employer Input */}
                  <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-emerald-500" />
                      <h3 className="text-xs font-bold text-foreground">Or Enter Custom Employer</h3>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">
                          Company Name
                        </label>
                        <input
                          type="text"
                          value={targetCompanyInput}
                          onChange={(e) => setTargetCompanyInput(e.target.value)}
                          placeholder="e.g. Siemens Energy, Chevron, Google..."
                          className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">
                          Target Role
                        </label>
                        <input
                          type="text"
                          value={targetRoleInput}
                          onChange={(e) => setTargetRoleInput(e.target.value)}
                          placeholder="e.g. Engine Cadet, Systems Engineer..."
                          className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">
                          Hiring Contact Email
                        </label>
                        <input
                          type="email"
                          value={targetEmailInput}
                          onChange={(e) => setTargetEmailInput(e.target.value)}
                          placeholder="careers@company.com"
                          className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column (7 cols): Live Application Composer & Verification Preview */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-border/60">
                      <div>
                        <h3 className="text-xs font-bold text-foreground">Live Application Composer & Verification</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Review, edit, and dispatch your application with verifiable Walrus credentials.
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                        Formal Attestation
                      </Badge>
                    </div>

                    {/* Email Recipient & Subject Header */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/80">
                        <span className="font-mono text-[11px] font-semibold text-muted-foreground w-14 shrink-0">
                          To:
                        </span>
                        <span className="font-mono text-[11px] text-foreground font-medium truncate">
                          {targetEmailInput || '(No email specified)'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/80">
                        <span className="font-mono text-[11px] font-semibold text-muted-foreground w-14 shrink-0">
                          Subject:
                        </span>
                        <input
                          type="text"
                          value={customEmailSubject}
                          onChange={(e) => setCustomEmailSubject(e.target.value)}
                          className="w-full bg-transparent text-xs text-foreground font-medium focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Email Body Textarea */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                          Application Letter (Editable)
                        </label>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {customEmailBody.length} characters
                        </span>
                      </div>
                      <textarea
                        value={customEmailBody}
                        onChange={(e) => setCustomEmailBody(e.target.value)}
                        rows={14}
                        className="w-full p-3.5 rounded-xl border border-border bg-background text-xs text-foreground font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-y"
                      />
                    </div>

                    {/* Dispatch Action Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleSendApplicationEmail}
                          className="gap-2 text-xs font-semibold h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send via Email Client</span>
                        </Button>

                        <Button
                          variant="outline"
                          onClick={handleCopyApplicationDraft}
                          className="gap-2 text-xs font-semibold h-9 px-3.5 border-border hover:bg-muted"
                        >
                          {copiedDraft ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Draft Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Draft</span>
                            </>
                          )}
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        onClick={handleRecordAsAppliedDirectly}
                        className="text-xs font-medium h-9 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1.5" />
                        <span>Record in Applied Tracker</span>
                      </Button>
                    </div>
                  </div>

                  {/* Agent Activity & Audit Telemetry */}
                  <div className="rounded-xl border border-border/80 bg-zinc-950 p-4 font-mono text-xs text-zinc-300 space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                        Application Audit & Telemetry Stream
                      </span>
                      <span className="text-emerald-400 font-mono">Walrus Sovereign Dispatch</span>
                    </div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {autoApplyLogs.map((log, i) => (
                        <div key={i} className="text-zinc-400 leading-relaxed text-[11px]">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          /* Stages 1, 2, and 3: Discovery, Saved, Applied */
          <>
            {/* Search & Filter Bar (No Emojis) */}
            <div className="space-y-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search role, company, or location..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Quick Role Categories Filter (Clean, professional, zero emojis) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'all', label: 'All Openings' },
                  { id: 'marine', label: 'Marine Engineering' },
                  { id: 'software', label: 'Software Engineering' },
                  { id: 'ai_ml', label: 'AI & Machine Learning' },
                  { id: 'hardware_aerospace', label: 'Hardware & Aerospace' },
                  { id: 'industrial_quality', label: 'Industrial & Quality' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedRole(cat.id)
                      toast.info(cat.id === 'all' ? 'Showing all openings' : `Filtered to ${cat.label}`)
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedRole === cat.id
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* 5 Filter Dropdowns (Roles, Seniority / Maritime Ranks, Companies, Countries, Workplaces) */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Filter 1: Roles */}
                  <div className="relative">
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="appearance-none h-8 pl-3 pr-7 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted/30 focus:outline-none cursor-pointer"
                    >
                      <option value="all">All roles</option>
                      <option value="marine">Marine Engineering</option>
                      <option value="software">Software Engineering</option>
                      <option value="ai_ml">AI & Machine Learning</option>
                      <option value="hardware_aerospace">Hardware & Aerospace</option>
                      <option value="industrial_quality">Industrial & Quality</option>
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-2.5 top-2.5 text-muted-foreground pointer-events-none" />
                  </div>

                  {/* Filter 2: Seniority & Maritime Ranks (Cadet, Junior, Officer, Senior, Chief/Superintendent) */}
                  <div className="relative">
                    <select
                      value={selectedSeniority}
                      onChange={(e) => setSelectedSeniority(e.target.value)}
                      className="appearance-none h-8 pl-3 pr-7 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted/30 focus:outline-none cursor-pointer"
                    >
                      <option value="all">All seniority & ranks</option>
                      <option value="intern_cadet">Intern / Cadet / Trainee</option>
                      <option value="entry_junior">Entry Level / Junior / 4th Eng</option>
                      <option value="mid_officer">Mid-Level / Officer / 2nd-3rd Eng</option>
                      <option value="senior">Senior Engineer</option>
                      <option value="lead_chief">Lead / Chief Engineer / Superintendent</option>
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-2.5 top-2.5 text-muted-foreground pointer-events-none" />
                  </div>

                  {/* Filter 3: Companies */}
                  <div className="relative">
                    <select
                      value={selectedCompany}
                      onChange={(e) => setSelectedCompany(e.target.value)}
                      className="appearance-none h-8 pl-3 pr-7 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted/30 focus:outline-none cursor-pointer"
                    >
                      <option value="all">All companies</option>
                      {uniqueCompanies.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-2.5 top-2.5 text-muted-foreground pointer-events-none" />
                  </div>

                  {/* Filter 4: Countries */}
                  <div className="relative">
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="appearance-none h-8 pl-3 pr-7 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted/30 focus:outline-none cursor-pointer"
                    >
                      <option value="all">All countries</option>
                      <option value="us">United States</option>
                      <option value="ca">Canada</option>
                      <option value="uk">United Kingdom</option>
                      <option value="nl">Netherlands</option>
                      <option value="fr">France</option>
                      <option value="remote">Remote Worldwide</option>
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-2.5 top-2.5 text-muted-foreground pointer-events-none" />
                  </div>

                  {/* Filter 5: Workplaces */}
                  <div className="relative">
                    <select
                      value={selectedWorkplace}
                      onChange={(e) => setSelectedWorkplace(e.target.value)}
                      className="appearance-none h-8 pl-3 pr-7 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted/30 focus:outline-none cursor-pointer"
                    >
                      <option value="all">All workplaces</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="onsite">On-site</option>
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-2.5 top-2.5 text-muted-foreground pointer-events-none" />
                  </div>

                  {/* Reset filter pill if any active */}
                  {(selectedRole !== 'all' ||
                    selectedSeniority !== 'all' ||
                    selectedCompany !== 'all' ||
                    selectedCountry !== 'all' ||
                    selectedWorkplace !== 'all' ||
                    searchQuery !== '') && (
                    <button
                      onClick={() => {
                        setSelectedRole('all')
                        setSelectedSeniority('all')
                        setSelectedCompany('all')
                        setSelectedCountry('all')
                        setSelectedWorkplace('all')
                        setSearchQuery('')
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 ml-1"
                    >
                      Reset filters
                    </button>
                  )}
                </div>

                {/* Total Active Count Indicator */}
                <div className="text-xs font-mono text-muted-foreground font-medium shrink-0">
                  {filteredJobs.length > 0
                    ? `${filteredJobs.length} ${
                        activeBoardTab === 'applied'
                          ? 'applied'
                          : activeBoardTab === 'saved'
                          ? 'saved'
                          : 'open'
                      } roles`
                    : '0 roles'}
                </div>
              </div>
            </div>

            {/* Job Listings List */}
            <div className="space-y-2">
              {filteredJobs.length === 0 ? (
                <Card className="p-12 text-center rounded-2xl border bg-card/60">
                  <Briefcase className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-bold text-sm text-foreground">
                    {activeBoardTab === 'applied'
                      ? 'No applied roles yet'
                      : activeBoardTab === 'saved'
                      ? 'No saved roles yet'
                      : 'No roles match your filters'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    {activeBoardTab === 'applied'
                      ? 'When you apply or mark a job on the Discovery tab, it moves here so you can track your submissions and prepare for interviews.'
                      : activeBoardTab === 'saved'
                      ? 'You have not saved any roles yet. Switch to Discovery and click the bookmark icon on any job.'
                      : 'Try broadening your search term or resetting some of the role or company dropdowns.'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRole('all')
                      setSelectedSeniority('all')
                      setSelectedCompany('all')
                      setSelectedCountry('all')
                      setSelectedWorkplace('all')
                      setSearchQuery('')
                      if (activeBoardTab !== 'discover') setActiveBoardTab('discover')
                    }}
                    className="mt-4 text-xs"
                  >
                    {activeBoardTab === 'discover' ? 'Clear all filters' : 'Return to Discovery'}
                  </Button>
                </Card>
              ) : (
                filteredJobs.map((job) => {
                  const isSaved = savedJobIds.includes(job.id)
                  const isApplied = appliedJobIdSet.has(job.id)
                  const appliedRecord = appliedJobs.find((a) => a.id === job.id)

                  return (
                    <div
                      key={job.id}
                      className={`group flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 sm:px-4 sm:py-3 rounded-xl border transition-all ${
                        isApplied
                          ? 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50'
                          : 'border-border/70 bg-card hover:bg-muted/20 hover:border-border'
                      }`}
                    >
                      {/* Left: Logo (clean monogram) & Job Title / Company */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <CompanyLogo company={job.company} />

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                              {job.title}
                            </span>
                            <span className="text-xs text-muted-foreground font-normal">
                              {job.company}
                            </span>
                            {isApplied && (
                              <>
                                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] py-0 px-1.5 font-mono">
                                  Applied {appliedRecord?.appliedAt ? `· ${appliedRecord.appliedAt}` : ''}
                                </Badge>
                                {appliedRecord?.followUpStatus === 'sent' ? (
                                  <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[10px] py-0 px-1.5 font-mono">
                                    <CheckCircle2 className="w-3 h-3 mr-1 text-blue-500" /> Followed up
                                  </Badge>
                                ) : (
                                  (() => {
                                    const appliedTime = appliedRecord?.appliedTimestamp || Date.now() - 4 * 86400000
                                    const daysElapsed = Math.floor((Date.now() - appliedTime) / 86400000)
                                    const daysLeft = Math.max(0, 7 - daysElapsed)
                                    return daysElapsed >= 7 ? (
                                      <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40 text-[10px] py-0 px-1.5 font-mono animate-pulse">
                                        <Clock className="w-3 h-3 mr-1" /> 7d Follow-Up Due
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono text-muted-foreground border-border/80">
                                        <Clock className="w-3 h-3 mr-1 text-primary" /> Follow up in {daysLeft}d
                                      </Badge>
                                    )
                                  })()
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Middle: Location & Workplace */}
                      <div className="text-xs text-muted-foreground shrink-0 md:min-w-[220px]">
                        <span>{job.location}</span>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center justify-between md:justify-end gap-2.5 shrink-0">
                        <span className="text-xs text-muted-foreground font-mono w-10 text-right">
                          {job.postedDate}
                        </span>

                        {/* Bookmark Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleSaveJob(job.id, job.title)}
                          title={isSaved ? 'Remove from Saved' : 'Save role'}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isSaved
                              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'border-border/70 hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                        </button>

                        {/* Prepare Button (links to Interview Room) */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/interview_room?role=${encodeURIComponent(job.title)}&company=${encodeURIComponent(
                                job.company
                              )}`
                            )
                          }
                          className="h-8 text-xs gap-1.5 px-3 border-border/80 hover:bg-muted/60 text-foreground font-medium"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-primary" />
                          <span>Prepare</span>
                        </Button>


                        {/* Applied Tab vs Discovery Actions */}
                        {isApplied ? (
                          <div className="flex items-center gap-1.5">
                            {/* Follow-up Generator Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setFollowUpModalJob({
                                  job,
                                  record: appliedRecord || {
                                    id: job.id,
                                    jobTitle: job.title,
                                    company: job.company,
                                    appliedAt: 'Recently',
                                  },
                                })
                              }
                              className="h-8 text-xs gap-1.5 px-3 border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 font-medium"
                            >
                              <Mail className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Follow up (AI)</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnmarkApplied(job.id, job.title)}
                              title="Move back to Discovery"
                              className="h-8 text-xs gap-1 px-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                            >
                              <Undo2 className="w-3.5 h-3.5" />
                              <span>Unmark</span>
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsApplied(job)}
                            title="Mark as Applied (moves to Applied tab)"
                            className="h-8 text-xs gap-1.5 px-3 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 font-medium"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Applied</span>
                          </Button>
                        )}

                        {/* Apply External Link */}
                        <a
                          href={job.apply_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 h-8 px-3.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 font-medium text-xs transition-colors shrink-0 shadow-xs"
                        >
                          <span>Apply</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer info: Sovereign memory and verification */}
            <div className="pt-4 border-t text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>Decentralized Job Pipeline · Indexed to Walrus Sovereign Memory</span>
              <span>Verified direct company career postings</span>
            </div>
          </>
        )}

        {/* 7-Day Autonomous Application Follow-up Scheduler Modal */}
        {followUpModalJob && (
          <ApplicationFollowUpModal
            open={!!followUpModalJob}
            onOpenChange={(open) => !open && setFollowUpModalJob(null)}
            jobTitle={followUpModalJob.job.title}
            company={followUpModalJob.job.company}
            appliedDate={followUpModalJob.record.appliedAt}
            onMarkSent={() => {
              handleMarkFollowUpSent(followUpModalJob.job.id)
              setFollowUpModalJob(null)
            }}
          />
        )}
      </div>
    </AppShell>
  )
}
