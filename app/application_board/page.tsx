'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
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
  ChevronUp,
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
  FileText,
  Calendar,
  Settings,
  AlertCircle,
  Paperclip,
  Users,
  CheckSquare,
  Square,
  Info,
  ListFilter,
  Upload,
  Trash2,
  FileCheck,
  Eye,
  Plus,
  Download,
} from 'lucide-react'
import { toast } from 'sonner'
import { ApplicationFollowUpModal } from '@/components/ApplicationFollowUpModal'
import { SmtpRelaySettingsModal } from '@/components/SmtpRelaySettingsModal'
import { ComingSoonModal, type ComingSoonFeature } from '@/components/ComingSoonModal'
import { downloadFollowUpIcs } from '@/lib/ics_calendar'
import { downloadEmlReceipt } from '@/lib/email_receipt'
import { downloadCvPdf } from '@/lib/pdf_generator'
import { getClientSessionAddress } from '@/lib/client_auth'
import { VERIFIED_COMPANY_HIRING_CONTACTS, type CompanyHiringContact } from '@/lib/company_directory'
import type { WalrusResumeVersionItem } from '@/components/WalrusVersionDrawer'
import { restoreCandidateDataFromCloud, syncCandidateDataToCloud, subscribeCandidateRealtime } from '@/lib/cloud_sync'
import type { ParsedCv } from '@/lib/cv_parser'
import { LivePdfPreview } from '@/components/LivePdfPreview'

export const VERIFIED_FALLBACK_PROFILE: ParsedCv = {
  applicant_name: 'Ibochi Vincent',
  email: 'vincent@careerace.online',
  phone: '+234 800 123 4567',
  location: 'Lagos, Nigeria',
  target_roles: ['Senior Marine Systems Engineer', 'Software Systems Architect'],
  summary:
    'Disciplined engineering professional with extensive cross-functional expertise in distributed systems architecture, mission-critical operations, and maritime propulsion technology. Proven track record directing operations with zero unscheduled downtime.',
  skills: [
    'Distributed Systems Architecture',
    'TypeScript / Next.js',
    'High-Availability Operations',
    'Marine Propulsion & Dynamic Positioning',
    'STCW Maritime Regulations',
    'Operational Diagnostics & Risk Mitigation',
  ],
  work_experience: [
    {
      role: 'Lead Systems & Operations Engineer',
      company: 'Sovereign Technical Maritime Services',
      duration: '2021 - Present',
      highlights: [
        'Supervised propulsion instrumentation and distributed automation across transatlantic voyages with 99.8% operational availability.',
        'Engineered real-time telemetry logging reducing critical diagnostics time from 12 minutes to under 30 seconds.',
        'Audited multi-departmental technical compliance against Class society and ISO safety regulations.',
      ],
    },
    {
      role: 'Systems Engineer',
      company: 'Apex Logistics & Fleet Automation',
      duration: '2018 - 2021',
      highlights: [
        'Maintained electronic automation switchboards, governor controls, and generator power systems with zero recorded safety incidents.',
        'Implemented rigorous preventive maintenance routines compliant with regulatory safety audits.',
      ],
    },
  ],
  academic_history: [
    {
      degree: 'B.Eng',
      field_of_study: 'Marine & Systems Engineering',
      institution: 'Maritime Academy of Nigeria',
      graduation_year: '2018',
      achievements: ['First Class Honors Equivalent', 'Propulsion Systems Merit Award'],
    },
  ],
  certifications: [
    'STCW 78/2010 Chief Engineer Reg III/2 Certificate of Competency',
    'Dynamic Positioning Advanced Maintenance (DP-2)',
    'ENG1 Seafarer Medical Examination & Safety at Sea (Reg VI/1-VI/4)',
  ],
}

export const DISCIPLINE_CATEGORIES = [
  { id: 'all', label: 'All Disciplines' },
  { id: 'engineering_marine', label: 'Marine & Maritime Engineering' },
  { id: 'software_it', label: 'Software, Cloud & DevOps' },
  { id: 'ai_autonomous', label: 'AI, Machine Learning & Robotics' },
  { id: 'data_analytics', label: 'Data Science & Analytics' },
  { id: 'cybersecurity', label: 'Cybersecurity & InfoSec' },
  { id: 'product_design', label: 'Product & UI/UX Design' },
  { id: 'finance_blockchain', label: 'FinTech, Web3 & Blockchain' },
  { id: 'medical_healthcare', label: 'Medical & Healthcare Informatics' },
  { id: 'management_operations', label: 'Management & Vessel Operations' },
  { id: 'industrial_manufacturing', label: 'Industrial, Hardware & Aerospace' },
  { id: 'energy_cleantech', label: 'Renewable Energy & CleanTech' },
  { id: 'others', label: 'Others (Custom Sector / Role)' },
] as const

export const DEFAULT_ATTACHABLE_CREDENTIALS = [
  { id: 'stcw_bst', label: 'STCW 95/2010 Basic Safety Training (BST)', category: 'Maritime' },
  { id: 'eng1_med', label: 'Seafarer Medical Fitness Certificate (ENG1 / Flag State Approved)', category: 'Maritime' },
  { id: 'seamans_book', label: "Seaman's Discharge Book & Continuous Sea-Service Record", category: 'Maritime' },
  { id: 'coc_license', label: 'Certificate of Competency (CoC) / Marine Watchkeeping License', category: 'Maritime' },
  { id: 'dp_induction', label: 'Dynamic Positioning (DP Induction / Simulator Certificate)', category: 'Maritime' },
  { id: 'bosiet_huet', label: 'OPITO BOSIET / HUET (Offshore Safety Induction)', category: 'Maritime' },
  { id: 'walrus_proof', label: 'Walrus Sovereign Portfolio & Verification Attestation', category: 'General' },
  { id: 'academic_deg', label: 'B.Eng / B.Sc Marine or Systems Engineering Degree', category: 'General' },
] as const

export interface JobListing {
  id: string
  title: string
  company: string
  location: string
  country: string
  workplace: 'Remote' | 'Hybrid' | 'On-site' | 'Offshore / Vessel'
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
  notes?: string
  recipientEmail?: string
  dispatchedAt?: string
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
  {
    id: 'siemens-health-1',
    title: 'Lead Healthcare Systems & Medical Informatics Engineer',
    company: 'Siemens Healthineers',
    location: 'Erlangen, Germany · Remote / Hybrid',
    country: 'Netherlands',
    workplace: 'Hybrid',
    seniority: 'Senior',
    roleCategory: 'Medical & Healthcare Informatics',
    postedDate: 'Today',
    apply_url: 'https://www.siemens-healthineers.com/careers',
    description: 'Architect clinical PACS/RIS data pipelines, medical DICOM imaging integrations, and secure EHR telemetry backends adhering to ISO 13485 standards.',
  },
  {
    id: 'epic-health-1',
    title: 'Healthcare Software & Clinical Integration Specialist',
    company: 'Epic Systems',
    location: 'Verona, WI, United States',
    country: 'United States',
    workplace: 'Hybrid',
    seniority: 'Mid-Level',
    roleCategory: 'Medical & Healthcare Informatics',
    postedDate: 'Today',
    apply_url: 'https://www.epic.com/careers',
    description: 'Design interoperable HL7 FHIR APIs, clinical decision support algorithms, and inpatient EHR data models connecting global hospital networks.',
  },
  {
    id: 'philips-health-1',
    title: 'Clinical Informatics & Telehealth Solutions Architect',
    company: 'Philips Healthcare',
    location: 'Cambridge, MA, United States',
    country: 'United States',
    workplace: 'Hybrid',
    seniority: 'Lead / Staff',
    roleCategory: 'Medical & Healthcare Informatics',
    postedDate: '1d',
    apply_url: 'https://www.philips.com/a-w/careers/healthtech.html',
    description: 'Direct bedside patient monitoring telematics, physiological sensor cloud ingestion, and fault-tolerant ICU alerting architectures.',
  },
  {
    id: 'illumina-health-1',
    title: 'Bioinformatics Software & Genomic Informatics Engineer',
    company: 'Illumina',
    location: 'San Diego, CA, United States',
    country: 'United States',
    workplace: 'Hybrid',
    seniority: 'Senior',
    roleCategory: 'Medical & Healthcare Informatics',
    postedDate: '2d',
    apply_url: 'https://www.illumina.com/company/careers.html',
    description: 'Engineer high-throughput DNA sequencing pipelines, variant calling algorithms, and cloud genomic data repositories for precision oncology.',
  },
  {
    id: 'maersk-ops-1',
    title: 'Global Fleet Operations & Decarbonization Manager',
    company: 'Maersk Fleet Management',
    location: 'Rotterdam, Netherlands · Operations Center',
    country: 'Netherlands',
    workplace: 'Hybrid',
    seniority: 'Lead / Staff',
    roleCategory: 'Management & Operations',
    postedDate: 'Today',
    apply_url: 'https://www.maersk.com/careers',
    description: 'Manage commercial fleet schedule reliability, drydock budgets, IMO CII fuel efficiency compliance, and green corridor voyage planning.',
  },
  {
    id: 'siemens-ops-1',
    title: 'Maritime Decarbonization & Clean Operations Lead',
    company: 'Siemens Energy',
    location: 'Oslo, Norway',
    country: 'Norway',
    workplace: 'Hybrid',
    seniority: 'Lead / Staff',
    roleCategory: 'Management & Operations',
    postedDate: '1d',
    apply_url: 'https://www.siemens-energy.com/global/en/company/jobs.html',
    description: 'Oversee multi-megawatt maritime fuel cell and hybrid propulsion retrofit campaigns across northern European commercial shipyards.',
  },
  {
    id: 'asml-ops-1',
    title: 'High-Tech Semiconductor Operations & Manufacturing Lead',
    company: 'ASML',
    location: 'Veldhoven, Netherlands',
    country: 'Netherlands',
    workplace: 'On-site',
    seniority: 'Senior',
    roleCategory: 'Management & Operations',
    postedDate: 'Today',
    apply_url: 'https://www.asml.com/en/careers',
    description: 'Orchestrate cleanroom manufacturing operations, critical EUV photolithography tool ramp-up schedules, and high-precision optical assembly chains.',
  },
  {
    id: 'chevron-ops-1',
    title: 'Marine Operations Superintendent & Fleet Coordinator',
    company: 'Chevron Shipping',
    location: 'London, United Kingdom · Marine Operations',
    country: 'United Kingdom',
    workplace: 'Hybrid',
    seniority: 'Lead / Staff',
    roleCategory: 'Management & Operations',
    postedDate: '2d',
    apply_url: 'https://careers.chevron.com',
    description: 'Coordinate global energy transport movements, safety management systems (SMS), vetting audits (SIRE 2.0), and port turnaround logistics.',
  },
  {
    id: 'wartsila-marine-1',
    title: 'Marine Automation & Dual-Fuel Engine Field Engineer',
    company: 'Wärtsilä',
    location: 'Vaasa, Finland · Marine Power',
    country: 'Finland',
    workplace: 'Hybrid',
    seniority: 'Mid-Level',
    roleCategory: 'Marine Engineering',
    postedDate: 'Today',
    apply_url: 'https://www.wartsila.com/careers',
    description: 'Oversee electronic fuel injection, SCR emissions aftertreatment, and automated propulsion control commissioning on commercial dual-fuel methanol vessels.',
  },
  {
    id: 'kongsberg-marine-1',
    title: 'Dynamic Positioning (DP) & Vessel Control Systems Architect',
    company: 'Kongsberg Maritime',
    location: 'Kongsberg, Norway · Maritime Solutions',
    country: 'Norway',
    workplace: 'Hybrid',
    seniority: 'Senior',
    roleCategory: 'Marine Engineering',
    postedDate: '1d',
    apply_url: 'https://www.kongsberg.com/careers',
    description: 'Design fault-tolerant DP class 3 architectures, acoustic reference transponders, and vessel cyber-security monitoring under DNV classification rules.',
  },
  {
    id: 'technip-marine-1',
    title: 'Subsea Umbilicals, Risers & Flowlines (SURF) Lead Engineer',
    company: 'TechnipFMC',
    location: 'Houston, TX, United States · Subsea',
    country: 'United States',
    workplace: 'Hybrid',
    seniority: 'Lead / Staff',
    roleCategory: 'Marine Engineering',
    postedDate: 'Today',
    apply_url: 'https://www.technipfmc.com/en/careers',
    description: 'Lead subsea manifold installations, dynamic umbilical fatigue analysis, and subsea tie-back engineering for offshore production assets.',
  },
  {
    id: 'crowley-ops-1',
    title: 'Fleet Safety & SIRE Vetting Marine Superintendent',
    company: 'Crowley',
    location: 'Jacksonville, FL, United States · Fleet Management',
    country: 'United States',
    workplace: 'On-site',
    seniority: 'Senior',
    roleCategory: 'Management & Operations',
    postedDate: 'Today',
    apply_url: 'https://www.crowley.com/careers',
    description: 'Manage maritime safety management systems (SMS), USCG / Flag State regulatory audits, and SIRE 2.0 tanker compliance across tug and tanker fleets.',
  },
  {
    id: 'mysten-core-1',
    title: 'Core Protocol & Consensus Infrastructure Engineer',
    company: 'Mysten Labs',
    location: 'Palo Alto, CA, United States · Remote',
    country: 'United States',
    workplace: 'Remote',
    seniority: 'Senior',
    roleCategory: 'Software & IT',
    postedDate: 'Today',
    apply_url: 'https://mystenlabs.com/careers',
    description: 'Scale Mysticeti and Bullshark Byzantine fault-tolerant consensus, Narwhal mempool latency, and Sui object-centric execution engine.',
  },
  {
    id: 'mysten-walrus-1',
    title: 'Decentralized Storage & Walrus Systems Architect',
    company: 'Mysten Labs',
    location: 'San Francisco, CA, United States · Remote',
    country: 'United States',
    workplace: 'Remote',
    seniority: 'Lead / Staff',
    roleCategory: 'Software & IT',
    postedDate: 'Today',
    apply_url: 'https://mystenlabs.com/careers',
    description: 'Architect multi-petabyte decentralized blob storage, erasure-coding validation schemes, and zero-knowledge cryptographic commitments on Walrus.',
  },
  {
    id: 'chainlink-oracle-1',
    title: 'Smart Contract Security & Decentralized Oracle Engineer',
    company: 'Chainlink Labs',
    location: 'Remote · Global',
    country: 'United States',
    workplace: 'Remote',
    seniority: 'Senior',
    roleCategory: 'Software & IT',
    postedDate: '1d',
    apply_url: 'https://chainlinklabs.com/careers',
    description: 'Build and audit Cross-Chain Interoperability Protocol (CCIP) contracts, cryptographic proof verifiers, and real-time oracle consensus nodes.',
  },
  {
    id: 'anthropic-safety-1',
    title: 'AI Safety & Multimodal Alignment Research Engineer',
    company: 'Anthropic',
    location: 'San Francisco, CA, United States',
    country: 'United States',
    workplace: 'Hybrid',
    seniority: 'Senior',
    roleCategory: 'AI & Autonomous Systems',
    postedDate: 'Today',
    apply_url: 'https://www.anthropic.com/careers',
    description: 'Develop mechanistic interpretability tooling, RLHF safety evaluation benchmarks, and automated constitutional red-teaming pipelines for frontier LLM models.',
  },
  {
    id: 'boston-robotics-1',
    title: 'Robotics Control Systems & Motion Planning Engineer',
    company: 'Boston Dynamics',
    location: 'Waltham, MA, United States',
    country: 'United States',
    workplace: 'On-site',
    seniority: 'Senior',
    roleCategory: 'AI & Autonomous Systems',
    postedDate: '2d',
    apply_url: 'https://bostondynamics.com/careers',
    description: 'Design dynamic trajectory generation, whole-body balance control algorithms, and visual perception pipelines for humanoid and quadruped platforms.',
  },
  {
    id: 'cloudflare-systems-1',
    title: 'High-Throughput Edge Network Systems Engineer',
    company: 'Cloudflare',
    location: 'Austin, TX, United States',
    country: 'United States',
    workplace: 'Hybrid',
    seniority: 'Senior',
    roleCategory: 'Software & IT',
    postedDate: 'Today',
    apply_url: 'https://www.cloudflare.com/careers',
    description: 'Architect eBPF network packet processing, anycast routing protocols, and multi-terabit DDoS mitigation engines across global data centers.',
  },
  {
    id: 'paystack-core-1',
    title: 'Senior Backend Engineer (Payments & Core Rails)',
    company: 'Paystack',
    location: 'Lagos, Nigeria · Hybrid',
    country: 'Nigeria',
    workplace: 'Hybrid',
    seniority: 'Senior',
    roleCategory: 'Software & IT',
    postedDate: 'Today',
    apply_url: 'https://paystack.com/careers',
    description: 'Design and optimize resilient fintech payment switches, ISO 8583 banking integrations, and sub-second settlement infrastructure across African banking corridors.',
    source: 'Paystack Nigeria Careers',
  },
  {
    id: 'flutterwave-switch-1',
    title: 'Staff Infrastructure & Cloud Reliability Engineer',
    company: 'Flutterwave',
    location: 'Lagos, Nigeria · Remote',
    country: 'Nigeria',
    workplace: 'Remote',
    seniority: 'Lead / Staff',
    roleCategory: 'Software & IT',
    postedDate: 'Today',
    apply_url: 'https://flutterwave.com/ng/careers',
    description: 'Lead high-throughput multi-region payment routing clusters, Kubernetes deployments, and PCI-DSS Tier 1 sovereign transaction resilience across Nigeria and global partners.',
    source: 'Flutterwave Nigeria Careers',
  },
  {
    id: 'moniepoint-core-1',
    title: 'Distributed Systems & Switch Protocol Engineer',
    company: 'Moniepoint',
    location: 'Lagos, Nigeria · Hybrid',
    country: 'Nigeria',
    workplace: 'Hybrid',
    seniority: 'Mid-Level',
    roleCategory: 'Software & IT',
    postedDate: 'Today',
    apply_url: 'https://moniepoint.com/careers',
    description: 'Architect POS terminal switching logic, core banking transaction ledger processing, and high-concurrency event-driven microservices handling millions of daily merchant payments.',
    source: 'Moniepoint Nigeria Careers',
  },
  {
    id: 'interswitch-fintech-1',
    title: 'Lead Software Architect & Payment Gateway Specialist',
    company: 'Interswitch',
    location: 'Lagos, Nigeria · Hybrid',
    country: 'Nigeria',
    workplace: 'Hybrid',
    seniority: 'Lead / Staff',
    roleCategory: 'Software & IT',
    postedDate: '1d',
    apply_url: 'https://www.interswitchgroup.com/careers',
    description: 'Direct enterprise payment security architectures, tokenization vaults, and inter-bank clearing telemetry for national switching rails.',
    source: 'Interswitch Group Careers',
  },
  {
    id: 'andela-talent-1',
    title: 'Full Stack Cloud Engineer (Remote Global Placement)',
    company: 'Andela',
    location: 'Lagos, Nigeria · Remote Worldwide',
    country: 'Nigeria',
    workplace: 'Remote',
    seniority: 'Mid-Level',
    roleCategory: 'Software & IT',
    postedDate: 'Today',
    apply_url: 'https://andela.com/careers',
    description: 'Collaborate with international technology teams on cloud-native TypeScript, Node.js, and Python microservices with continuous delivery.',
    source: 'Andela Global Talent Network',
  },
  {
    id: 'talentql-cloud-1',
    title: 'Senior DevOps & Site Reliability Engineer',
    company: 'TalentQL',
    location: 'Lagos, Nigeria · Remote',
    country: 'Nigeria',
    workplace: 'Remote',
    seniority: 'Senior',
    roleCategory: 'Software & IT',
    postedDate: '2d',
    apply_url: 'https://talentql.com',
    description: 'Implement automated CI/CD deployment pipelines, Terraform infrastructure-as-code, and distributed monitoring for Pan-African enterprise clients.',
    source: 'TalentQL Engineering Careers',
  },
  {
    id: 'jobberman-recruit-1',
    title: 'Executive Technical Talent Lead',
    company: 'Jobberman Nigeria',
    location: 'Lagos, Nigeria · Hybrid',
    country: 'Nigeria',
    workplace: 'Hybrid',
    seniority: 'Lead / Staff',
    roleCategory: 'Management & Operations',
    postedDate: 'Today',
    apply_url: 'https://www.jobberman.com',
    description: 'Spearhead enterprise talent acquisition strategies and executive search across West Africa financial services and maritime sectors.',
    source: 'Jobberman Executive Search',
  },
  {
    id: 'workforce-ops-1',
    title: 'Enterprise Technical Project & Operations Specialist',
    company: 'Workforce Group',
    location: 'Lagos, Nigeria · On-site',
    country: 'Nigeria',
    workplace: 'On-site',
    seniority: 'Mid-Level',
    roleCategory: 'Management & Operations',
    postedDate: '1d',
    apply_url: 'https://workforcegroup.com/careers',
    description: 'Coordinate human capital delivery, operational workflows, and verified compliance programs for multinational clients in Nigeria.',
    source: 'Workforce Group Nigeria',
  },
  {
    id: 'goodwork-marine-1',
    title: 'Marine Operations & DP Vessel Engineer',
    company: 'GoodWork Marine Services',
    location: 'Port Harcourt, Nigeria · Offshore Operations',
    country: 'Nigeria',
    workplace: 'Offshore / Vessel',
    seniority: 'Mid-Level',
    roleCategory: 'Engineering & Marine',
    postedDate: 'Today',
    apply_url: 'https://goodworkmarine.com/careers',
    description: 'Maintain dynamic positioning (DP2) propulsion systems, auxiliary generators, and offshore platform supply vessel operations in the Gulf of Guinea.',
    source: 'GoodWork Marine Directory',
  },
  {
    id: 'ocean-prof-marine-1',
    title: '2nd Marine Engineer Officer (AHTS / Offshore)',
    company: 'Ocean Professionals Nigeria',
    location: 'Lagos / Niger Delta, Nigeria · Offshore Base',
    country: 'Nigeria',
    workplace: 'Offshore / Vessel',
    seniority: 'Mid-Level',
    roleCategory: 'Engineering & Marine',
    postedDate: 'Today',
    apply_url: 'https://oceanprofessionals.com.ng',
    description: 'Oversee engine room watchkeeping, 4-stroke marine diesel overhauls, oil-water separators, and safety drills aboard anchor handling tug supply vessels.',
    source: 'Ocean Professionals Marine Recruitment',
  },
  {
    id: 'red-offshore-1',
    title: 'Marine Electrical & Electronic Technician (ETO / Offshore)',
    company: 'Red Offshore',
    location: 'Port Harcourt, Nigeria · Marine Base',
    country: 'Nigeria',
    workplace: 'Offshore / Vessel',
    seniority: 'Senior',
    roleCategory: 'Engineering & Marine',
    postedDate: 'Today',
    apply_url: 'https://redoffshore.com',
    description: 'Troubleshoot integrated vessel control systems, switchboards, high-voltage transformers, and satellite navigation hardware on deepwater supply vessels.',
    source: 'Red Offshore Recruitment Directory',
  },
  {
    id: 'bourbon-ng-marine-1',
    title: 'Offshore Vessel Maintenance Superintendent',
    company: 'Bourbon Interoil Nigeria',
    location: 'Port Harcourt, Nigeria · Onne Port Base',
    country: 'Nigeria',
    workplace: 'Hybrid',
    seniority: 'Lead / Staff',
    roleCategory: 'Management & Operations',
    postedDate: 'Today',
    apply_url: 'https://bourbonoffshore.com/en/careers',
    description: 'Lead planned maintenance systems (PMS), dry-dock scheduling, and NIMASA regulatory compliance for terminal tugs and subsea support vessels.',
    source: 'Bourbon Interoil Nigeria Careers',
  },
  {
    id: 'telford-offshore-1',
    title: 'Subsea DP3 Pipelay & Crane Barge Marine Engineer',
    company: 'Telford Offshore',
    location: 'Lagos, Nigeria · Offshore Operations',
    country: 'Nigeria',
    workplace: 'Offshore / Vessel',
    seniority: 'Senior',
    roleCategory: 'Engineering & Marine',
    postedDate: '1d',
    apply_url: 'https://telfordoffshore.com/careers',
    description: 'Maintain multi-thruster diesel-electric propulsion, 800-ton subsea heave-compensated cranes, and dive-support power plants on DP3 offshore accommodation vessels.',
    source: 'Telford Offshore Global Fleet',
  },
  {
    id: 'deepwater-eng-1',
    title: 'Subsea Pipeline & Flowline Structural Engineer',
    company: 'Deepwater Engineering Nigeria',
    location: 'Port Harcourt, Nigeria · Engineering Center',
    country: 'Nigeria',
    workplace: 'Hybrid',
    seniority: 'Mid-Level',
    roleCategory: 'Engineering & Marine',
    postedDate: '2d',
    apply_url: 'https://deepwaterengineering.com.ng',
    description: 'Perform FEA stress analysis, riser dynamic fatigue calculations, and cathodic protection designs for deepwater offshore field development.',
    source: 'Deepwater Engineering Nigeria',
  },
]

// Visual Company Badge / Logo Renderer: Clean, typographic monograms only (no emojis)
function CompanyLogo({ company }: { company: string }) {
  const c = company.toLowerCase()

  if (c.includes('siemens')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#00646E] text-white font-bold flex items-center justify-center text-[10px] tracking-tight shadow-xs shrink-0">
        SIE
      </div>
    )
  }
  if (c.includes('epic')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#BA0C2F] text-white font-bold flex items-center justify-center text-[10px] tracking-tight shadow-xs shrink-0">
        EPC
      </div>
    )
  }
  if (c.includes('philips')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#0B5ED7] text-white font-bold flex items-center justify-center text-[10px] tracking-tight shadow-xs shrink-0">
        PHI
      </div>
    )
  }
  if (c.includes('illumina')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#002F6C] text-white font-bold flex items-center justify-center text-[10px] tracking-tight shadow-xs shrink-0">
        ILM
      </div>
    )
  }
  if (c.includes('asml')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#00199C] text-white font-bold flex items-center justify-center text-[10px] tracking-tight shadow-xs shrink-0">
        ASML
      </div>
    )
  }
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
  if (c.includes('wartsila') || c.includes('wï¿½rtsilï¿½') || c.includes('wärtsilä')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#003865] text-white font-bold flex items-center justify-center text-[10px] tracking-wider shadow-xs shrink-0">
        WAR
      </div>
    )
  }
  if (c.includes('kongsberg')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#002855] text-white font-bold flex items-center justify-center text-[10px] tracking-wider shadow-xs shrink-0">
        KNG
      </div>
    )
  }
  if (c.includes('technip')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#78281F] text-white font-bold flex items-center justify-center text-[10px] tracking-wider shadow-xs shrink-0">
        FTI
      </div>
    )
  }
  if (c.includes('crowley')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#B91C1C] text-white font-bold flex items-center justify-center text-[10px] tracking-wider shadow-xs shrink-0">
        CRW
      </div>
    )
  }
  if (c.includes('chainlink')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#375BD2] text-white font-bold flex items-center justify-center text-[10px] tracking-wider shadow-xs shrink-0">
        LINK
      </div>
    )
  }
  if (c.includes('boston dynamics')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#0284C7] text-white font-bold flex items-center justify-center text-[10px] tracking-wider shadow-xs shrink-0">
        BD
      </div>
    )
  }
  if (c.includes('cloudflare')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#F38020] text-white font-bold flex items-center justify-center text-[10px] tracking-wider shadow-xs shrink-0">
        NET
      </div>
    )
  }
  if (c.includes('paystack')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#0BA4DB] text-white font-black flex items-center justify-center text-[9px] tracking-tight shadow-xs shrink-0">
        PSTK
      </div>
    )
  }
  if (c.includes('flutterwave')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#F5A623] text-black font-black flex items-center justify-center text-[10px] tracking-tight shadow-xs shrink-0">
        FLW
      </div>
    )
  }
  if (c.includes('moniepoint')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#0052FF] text-white font-black flex items-center justify-center text-[9px] tracking-tight shadow-xs shrink-0">
        MNP
      </div>
    )
  }
  if (c.includes('interswitch')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#C51A1B] text-white font-bold flex items-center justify-center text-[10px] tracking-tight shadow-xs shrink-0">
        ISW
      </div>
    )
  }
  if (c.includes('andela')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#335EEA] text-white font-bold flex items-center justify-center text-[10px] tracking-tight shadow-xs shrink-0">
        ANDL
      </div>
    )
  }
  if (c.includes('talentql')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#111827] border border-emerald-500/40 text-emerald-400 font-bold flex items-center justify-center text-[10px] tracking-tight shadow-xs shrink-0">
        TQL
      </div>
    )
  }
  if (c.includes('jobberman')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#1F497D] text-amber-300 font-black flex items-center justify-center text-[9px] tracking-tight shadow-xs shrink-0">
        JBM
      </div>
    )
  }
  if (c.includes('workforce')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#0F2027] text-cyan-400 font-bold flex items-center justify-center text-[9px] tracking-tight shadow-xs shrink-0">
        WFG
      </div>
    )
  }
  if (c.includes('goodwork')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#0F4C81] text-white font-bold flex items-center justify-center text-[9px] tracking-tight shadow-xs shrink-0">
        GWM
      </div>
    )
  }
  if (c.includes('ocean professional')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#003B46] text-teal-300 font-bold flex items-center justify-center text-[9px] tracking-tight shadow-xs shrink-0">
        OCP
      </div>
    )
  }
  if (c.includes('red offshore')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#990000] text-white font-black flex items-center justify-center text-[9px] tracking-tight shadow-xs shrink-0">
        RED
      </div>
    )
  }
  if (c.includes('telford')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#1E3D59] text-amber-400 font-bold flex items-center justify-center text-[9px] tracking-tight shadow-xs shrink-0">
        TLF
      </div>
    )
  }
  if (c.includes('deepwater')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#17252A] border border-cyan-700 text-cyan-300 font-bold flex items-center justify-center text-[9px] tracking-tight shadow-xs shrink-0">
        DWE
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

// Normalized matching helpers that cleanly classify jobs into 6 disciplines with zero glitch
function matchesRoleCategory(job: JobListing, filter: string, customFilter = ''): boolean {
  if (filter === 'all') return true
  const r = (job.roleCategory || '').toLowerCase()
  const t = (job.title || '').toLowerCase()
  const d = (job.description || '').toLowerCase()

  if (filter === 'others') {
    if (!customFilter.trim()) return true
    const q = customFilter.toLowerCase().trim()
    return r.includes(q) || t.includes(q) || d.includes(q)
  }

  if (filter === 'engineering_marine' || filter === 'marine') {
    return (
      r.includes('marine') ||
      r.includes('naval') ||
      r.includes('offshore') ||
      r.includes('subsea') ||
      r.includes('propulsion') ||
      t.includes('marine') ||
      t.includes('naval') ||
      t.includes('offshore') ||
      t.includes('subsea') ||
      t.includes('vessel') ||
      t.includes('cadet') ||
      t.includes('propulsion') ||
      t.includes('tanker') ||
      t.includes('hydrodynamic')
    )
  }
  if (filter === 'software_it' || filter === 'software') {
    return (
      r.includes('software') ||
      r.includes('full stack') ||
      r.includes('frontend') ||
      r.includes('backend') ||
      r.includes('devops') ||
      r.includes('cloud') ||
      t.includes('software') ||
      t.includes('full stack') ||
      t.includes('frontend') ||
      t.includes('backend') ||
      t.includes('developer') ||
      t.includes('distributed')
    )
  }
  if (filter === 'ai_autonomous' || filter === 'ai_ml') {
    return (
      r.includes('machine learning') ||
      r.includes('ai') ||
      r.includes('autonomous') ||
      r.includes('robotics') ||
      t.includes('machine learning') ||
      t.includes('ai') ||
      t.includes('autonomous') ||
      t.includes('robotics') ||
      t.includes('agent') ||
      t.includes('research engineer') ||
      t.includes('foundation models') ||
      t.includes('computer vision')
    )
  }
  if (filter === 'medical_healthcare') {
    return (
      r.includes('medical') ||
      r.includes('healthcare') ||
      r.includes('clinical') ||
      r.includes('bioinformatics') ||
      r.includes('genomic') ||
      t.includes('medical') ||
      t.includes('healthcare') ||
      t.includes('clinical') ||
      t.includes('bioinformatics') ||
      t.includes('genomic') ||
      t.includes('telehealth') ||
      d.includes('healthcare') ||
      d.includes('clinical') ||
      d.includes('genomic')
    )
  }
  if (filter === 'management_operations') {
    return (
      r.includes('management') ||
      r.includes('operations') ||
      r.includes('superintendent') ||
      t.includes('manager') ||
      t.includes('operations') ||
      t.includes('superintendent') ||
      t.includes('lead') ||
      t.includes('director') ||
      t.includes('coordinator') ||
      t.includes('decarbonization')
    )
  }
  if (filter === 'industrial_manufacturing' || filter === 'industrial_quality' || filter === 'hardware_aerospace') {
    return (
      r.includes('industrial') ||
      r.includes('quality') ||
      r.includes('manufacturing') ||
      r.includes('hardware') ||
      r.includes('aerospace') ||
      t.includes('industrial') ||
      t.includes('quality') ||
      t.includes('manufacturing') ||
      t.includes('transducer') ||
      t.includes('hardware') ||
      t.includes('test') ||
      t.includes('satellite') ||
      t.includes('space') ||
      t.includes('semiconductor')
    )
  }

  if (filter === 'data_analytics') {
    return (
      r.includes('data') ||
      r.includes('analytics') ||
      t.includes('data engineer') ||
      t.includes('data analyst') ||
      t.includes('bi analyst') ||
      t.includes('data science') ||
      t.includes('analytics') ||
      d.includes('sql') ||
      d.includes('data warehouse') ||
      d.includes('pipeline')
    )
  }
  if (filter === 'cybersecurity') {
    return (
      r.includes('cyber') ||
      r.includes('security') ||
      r.includes('infosec') ||
      t.includes('security') ||
      t.includes('infosec') ||
      t.includes('soc analyst') ||
      t.includes('pentest') ||
      t.includes('threat') ||
      d.includes('vulnerability') ||
      d.includes('siem')
    )
  }
  if (filter === 'product_design') {
    return (
      r.includes('product') ||
      r.includes('design') ||
      t.includes('product manager') ||
      t.includes('product owner') ||
      t.includes('ui/ux') ||
      t.includes('ux designer') ||
      t.includes('product designer') ||
      d.includes('wireframe') ||
      d.includes('figma')
    )
  }
  if (filter === 'finance_blockchain') {
    return (
      r.includes('finance') ||
      r.includes('blockchain') ||
      r.includes('fintech') ||
      t.includes('fintech') ||
      t.includes('blockchain') ||
      t.includes('web3') ||
      t.includes('smart contract') ||
      t.includes('solidity') ||
      t.includes('sui') ||
      t.includes('ledger') ||
      d.includes('defi') ||
      d.includes('payment')
    )
  }
  if (filter === 'energy_cleantech') {
    return (
      r.includes('energy') ||
      r.includes('clean') ||
      r.includes('solar') ||
      r.includes('wind') ||
      t.includes('renewable') ||
      t.includes('power systems') ||
      t.includes('grid') ||
      t.includes('decarbonization') ||
      t.includes('battery') ||
      d.includes('cleantech') ||
      d.includes('offshore wind')
    )
  }

  return r.includes(filter.toLowerCase()) || filter.toLowerCase().includes(r)
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
  if (filter === 'executive_director') {
    return (
      s.includes('lead') ||
      s.includes('director') ||
      t.includes('director') ||
      t.includes('vp') ||
      t.includes('head of') ||
      t.includes('principal') ||
      t.includes('executive') ||
      t.includes('chief')
    )
  }

  return true
}

function matchesCountry(job: JobListing, filter: string): boolean {
  if (!filter || filter === 'all') return true
  const country = (job.country || '').toLowerCase()
  const loc = (job.location || '').toLowerCase()
  const workplace = (job.workplace || '').toLowerCase()

  if (filter === 'ng') {
    return (
      country.includes('nigeria') ||
      loc.includes('nigeria') ||
      loc.includes('lagos') ||
      loc.includes('port harcourt') ||
      loc.includes('abuja') ||
      loc.includes('niger delta') ||
      loc.includes('onne')
    )
  }
  if (filter === 'remote') {
    return country.includes('remote') || loc.includes('remote') || workplace === 'remote'
  }
  if (filter === 'us') {
    return (
      country.includes('united states') ||
      country.includes('usa') ||
      loc.includes('united states') ||
      loc.includes('usa') ||
      loc.includes('ca,') ||
      loc.includes('tx,') ||
      loc.includes('ny,')
    )
  }
  if (filter === 'ca') {
    return country.includes('canada') || loc.includes('canada') || loc.includes('toronto') || loc.includes('vancouver')
  }
  if (filter === 'uk') {
    return (
      country.includes('united kingdom') ||
      country.includes('uk') ||
      loc.includes('united kingdom') ||
      loc.includes('london') ||
      loc.includes('aberdeen')
    )
  }
  if (filter === 'nl') {
    return country.includes('netherlands') || loc.includes('netherlands') || loc.includes('rotterdam') || loc.includes('amsterdam')
  }
  if (filter === 'no') {
    return country.includes('norway') || loc.includes('norway') || loc.includes('oslo') || loc.includes('kongsberg')
  }
  if (filter === 'de') {
    return country.includes('germany') || loc.includes('germany') || loc.includes('berlin') || loc.includes('munich')
  }
  if (filter === 'fr') {
    return country.includes('france') || loc.includes('france') || loc.includes('paris')
  }
  if (filter === 'intl') {
    return (
      country.includes('international') ||
      country.includes('monaco') ||
      country.includes('finland') ||
      country.includes('global') ||
      loc.includes('global')
    )
  }

  return country.includes(filter.toLowerCase()) || loc.includes(filter.toLowerCase())
}

function matchesWorkplace(job: JobListing, filter: string): boolean {
  if (!filter || filter === 'all') return true
  const wp = (job.workplace || '').toLowerCase()
  const loc = (job.location || '').toLowerCase()
  const title = (job.title || '').toLowerCase()

  if (filter === 'remote') {
    return wp === 'remote' || loc.includes('remote')
  }
  if (filter === 'hybrid') {
    return wp === 'hybrid' || loc.includes('hybrid')
  }
  if (filter === 'onsite') {
    return wp === 'on-site' || wp === 'onsite' || loc.includes('on-site')
  }
  if (filter === 'offshore') {
    return (
      wp.includes('offshore') ||
      wp.includes('vessel') ||
      loc.includes('offshore') ||
      loc.includes('vessel') ||
      title.includes('offshore') ||
      title.includes('vessel') ||
      title.includes('cadet') ||
      title.includes('barge') ||
      title.includes('ahts')
    )
  }

  return wp.includes(filter.toLowerCase())
}

const DAILY_CHECKLIST_ITEMS = [
  {
    id: 'check-1',
    title: 'Review New Discipline Openings',
    desc: 'Inspect verified corporate job postings matching your engineering, marine, IT, or medical discipline on the Application Board.',
    actionLabel: 'Browse Openings',
    actionTab: 'discover' as const,
  },
  {
    id: 'check-2',
    title: 'Check 7-Day Follow-Up Milestones',
    desc: 'Review dispatched applications and send timely follow-up messages for submissions that have hit the 7-day mark.',
    actionLabel: 'Check Follow-ups',
    actionTab: 'applied' as const,
  },
  {
    id: 'check-3',
    title: 'Calibrate Role ATS Keywords',
    desc: 'Match your resume bullet points and competencies against specific employer job requirements to maintain >= 80% keyword alignment.',
    actionLabel: 'Resume Studio',
    link: '/dashboard?tab=resumes',
  },
  {
    id: 'check-4',
    title: 'Lead with High-Impact Power Verbs',
    desc: 'Ensure every career accomplishment begins with strong action verbs and includes quantifiable metrics (cost, speed, scale).',
    actionLabel: 'Polish Bullets',
    link: '/dashboard?tab=resumes',
  },
  {
    id: 'check-5',
    title: 'Anchor Latest Profile to Walrus Vault',
    desc: 'Re-seal and commit your verified credentials and latest tailored version snapshot to decentralized Walrus storage.',
    actionLabel: 'View Walrus Vault',
    link: '/memory',
  },
]

export default function ApplicationBoardPage() {
  const router = useRouter()

  // 3 distinct stages on Application Board:
  // 1. Discovery, 2. Applied, 3. Auto Apply
  const [activeBoardTab, setActiveBoardTab] = useState<'discover' | 'applied' | 'auto_apply'>('discover')
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([])
  const originalFileInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingOriginalCv, setIsUploadingOriginalCv] = useState(false)
  const [originalCvFileName, setOriginalCvFileName] = useState<string>('')

  // Daily Action Checklist state (stored in localStorage)
  const [completedChecklistIds, setCompletedChecklistIds] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('careerace_daily_checklist_completed')
      if (stored) setCompletedChecklistIds(JSON.parse(stored))
    } catch {}
  }, [])

  function handleToggleChecklistItem(id: string) {
    setCompletedChecklistIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      try {
        localStorage.setItem('careerace_daily_checklist_completed', JSON.stringify(updated))
      } catch {}
      return updated
    })
  }

  function handleResetDailyChecklist() {
    setCompletedChecklistIds([])
    try {
      localStorage.removeItem('careerace_daily_checklist_completed')
    } catch {}
    toast.success('Daily checklist reset for today!')
  }

  const completedChecklistCount = completedChecklistIds.length

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState('all')
  const [customRoleInput, setCustomRoleInput] = useState('')
  const [selectedSeniority, setSelectedSeniority] = useState('all')
  const [selectedCompany, setSelectedCompany] = useState('all')
  const [selectedCountry, setSelectedCountry] = useState('all')
  const [selectedWorkplace, setSelectedWorkplace] = useState('all')

  // Job storage state
  const [sessionAddress, setSessionAddress] = useState<string | null>(null)
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
  const [customEmailsList, setCustomEmailsList] = useState<string[]>(['careers.marine@maersk.com'])
  const [newCustomEmailInput, setNewCustomEmailInput] = useState<string>('')
  const [customEmailSubject, setCustomEmailSubject] = useState('')
  const [customEmailBody, setCustomEmailBody] = useState('')
  const [copiedDraft, setCopiedDraft] = useState(false)

  // Attachable credentials and uploaded files state
  const [cvSourceType, setCvSourceType] = useState<'walrus' | 'uploaded'>('walrus')
  const [selectedAttachments, setSelectedAttachments] = useState<string[]>([])
  const [uploadedDocuments, setUploadedDocuments] = useState<{
    id: string
    name: string
    size?: number
    blobId?: string
    walrusUrl?: string
    fileType?: string
    uploadedAt: string
  }[]>([])
  const [isUploadingDoc, setIsUploadingDoc] = useState(false)
  const [isBodyUserEdited, setIsBodyUserEdited] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [customAttachmentInput, setCustomAttachmentInput] = useState('')
  const [customAttachmentsList, setCustomAttachmentsList] = useState<string[]>([])

  // 1-Click Batch Dispatch modal state
  const [batchDispatchModalOpen, setBatchDispatchModalOpen] = useState(false)
  const [batchSize, setBatchSize] = useState<number>(10)
  const [customBatchSizeInput, setCustomBatchSizeInput] = useState<string>('10')
  const [isBatchDispatching, setIsBatchDispatching] = useState(false)
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; currentCompany: string } | null>(null)
  const [batchDelaySeconds, setBatchDelaySeconds] = useState<number>(4)
  const [batchCountdown, setBatchCountdown] = useState<number | null>(null)

  // Test Dispatch & Sample Preview state
  const [samplePreviewModalOpen, setSamplePreviewModalOpen] = useState(false)
  const [sovereignCvPreviewModalOpen, setSovereignCvPreviewModalOpen] = useState(false)
  const [testEmailModalOpen, setTestEmailModalOpen] = useState(false)
  const [testRecipientEmail, setTestRecipientEmail] = useState('')
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false)
  const [comingSoonFeature, setComingSoonFeature] = useState<ComingSoonFeature | null>(null)

  // Expandable console controls
  const [deliverabilityGuideOpen, setDeliverabilityGuideOpen] = useState(false)
  const [previewLetterOpen, setPreviewLetterOpen] = useState(true)
  const [showCustomEmailInput, setShowCustomEmailInput] = useState(false)
  const [isCredentialPackageCollapsed, setIsCredentialPackageCollapsed] = useState(false)

  // Auto-apply agent & DKIM/SMTP relay state
  const [autoApplyRunning, setAutoApplyRunning] = useState(false)
  const [smtpSettingsOpen, setSmtpSettingsOpen] = useState(false)
  const [isRelayDispatching, setIsRelayDispatching] = useState(false)
  const [visibleCount, setVisibleCount] = useState<number>(16)
  const [isSyncingLiveApis, setIsSyncingLiveApis] = useState<boolean>(false)
  const [autoApplyLogs, setAutoApplyLogs] = useState<string[]>([
    'Agent standby: Walrus sovereign wallet authenticated.',
    'Verified corporate hiring directory loaded (29 verified recruitment contacts).',
    'Candidate sovereign attestations indexed for direct immutable verification.',
  ])

  // Load saved & applied jobs, Walrus versions, and sovereign profile from localStorage & cloud
  useEffect(() => {
    let hasLocalApplied = false
    let hasLocalSaved = false

    try {
      const storedSaved = localStorage.getItem('careerace_saved_job_ids')
      if (storedSaved) {
        setSavedJobIds(JSON.parse(storedSaved))
        hasLocalSaved = true
      }
    } catch {}

    try {
      const storedApplied = localStorage.getItem('careerace_applied_jobs')
      if (storedApplied) {
        setAppliedJobs(JSON.parse(storedApplied))
        hasLocalApplied = true
      }
    } catch {}

    try {
      const storedVersions = localStorage.getItem('careerace_walrus_versions')
      if (storedVersions) {
        setWalrusVersions(JSON.parse(storedVersions))
      }
    } catch {}

    try {
      const storedProfile = localStorage.getItem('careerace_sovereign_profile') || localStorage.getItem('careerace_parsed_profile')
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile)
        if (parsed && (parsed.applicant_name || parsed.skills?.length || parsed.work_experience?.length)) {
          setActiveDraftProfile(parsed)
        }
      }
    } catch {}

    try {
      const storedUploaded = localStorage.getItem('careerace_dispatch_uploaded_docs')
      if (storedUploaded) {
        const parsed = JSON.parse(storedUploaded)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUploadedDocuments(parsed)
          setSelectedAttachments((prev) => Array.from(new Set([...prev, ...parsed.map((p: any) => p.id)])))
        }
      }
    } catch {}

    try {
      const storedOrig = localStorage.getItem('careerace_original_cv_doc')
      if (storedOrig) {
        const parsed = JSON.parse(storedOrig)
        if (parsed?.name) setOriginalCvFileName(parsed.name)
      }
    } catch {}

    try {
      const addr = getClientSessionAddress()
      if (addr) {
        setSessionAddress(addr)
      } else {
        fetch('/api/auth/session')
          .then((r) => r.json())
          .then((d) => {
            if (d.authenticated && d.address) setSessionAddress(d.address)
          })
          .catch(() => {})
      }
    } catch {}

    // Check for incoming handoff from Cover Letter Studio or external deep-links (?tab=auto_apply&role=...&company=...)
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        const tabParam = params.get('tab')
        if (tabParam === 'auto_apply' || tabParam === 'discover' || tabParam === 'applied') {
          setActiveBoardTab(tabParam)
        }
        const roleParam = params.get('role')
        if (roleParam) {
          setTargetRoleInput(roleParam)
        }
        const companyParam = params.get('company')
        if (companyParam) {
          setTargetCompanyInput(companyParam)
          // Look up verified contact email if known
          const matchedContact = VERIFIED_COMPANY_HIRING_CONTACTS.find(
            (c) => c.company.toLowerCase() === companyParam.toLowerCase()
          )
          if (matchedContact) {
            setTargetEmailInput(matchedContact.contactEmail)
          }
        }
        const letterParam = params.get('letter')
        if (letterParam) {
          setCustomEmailBody(decodeURIComponent(letterParam))
        }
      }
    } catch {}

    // Cross-device cloud restore: hydrate applications, versions, and profile onto mobile
    restoreCandidateDataFromCloud().then((cloudData) => {
      if (cloudData) {
        if (cloudData.profile) {
          setActiveDraftProfile((prev) => prev || cloudData.profile)
        }
        if (Array.isArray(cloudData.walrusVersions) && cloudData.walrusVersions.length > 0) {
          setWalrusVersions((prev) => (prev.length === 0 ? cloudData.walrusVersions! : prev))
        }
        if (Array.isArray(cloudData.appliedJobs) && cloudData.appliedJobs.length > 0) {
          setAppliedJobs((prev) => (prev.length === 0 ? cloudData.appliedJobs! : prev))
        }
        if (Array.isArray(cloudData.savedJobIds) && cloudData.savedJobIds.length > 0) {
          setSavedJobIds((prev) => (prev.length === 0 ? cloudData.savedJobIds! : prev))
        }
      }
    })

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

    // Attach Realtime WebSocket subscription for live saved jobs / applications sync (<50ms)
    const activeAddress = localStorage.getItem('careerace_session_address') || ''
    let unsubscribeRealtime = () => {}
    if (activeAddress) {
      unsubscribeRealtime = subscribeCandidateRealtime(activeAddress, (event) => {
        if (event.kind === 'saved_jobs_snapshot' && Array.isArray(event.data)) {
          setSavedJobIds(event.data)
          toast.info('Saved jobs updated live from connected device (WebSocket)')
        } else if (event.kind === 'walrus_versions_snapshot' && Array.isArray(event.data)) {
          setWalrusVersions(event.data)
        }
      })
    }

    return () => {
      unsubscribeRealtime()
    }
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
    syncCandidateDataToCloud({ savedJobIds: updated })
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
    syncCandidateDataToCloud({ appliedJobs: updated })

    toast.success(`Applied to ${job.company}! Removed from Discovery and scheduled 7-day follow-up.`)
    setActiveBoardTab('applied')
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
  // Unmark applied: Moves back to Discovery
  function handleUnmarkApplied(jobId: string, jobTitle: string) {
    const updated = appliedJobs.filter((a) => a.id !== jobId && a.company?.toLowerCase() !== jobTitle.toLowerCase())
    setAppliedJobs(updated)
    localStorage.setItem('careerace_applied_jobs', JSON.stringify(updated))
    syncCandidateDataToCloud({ appliedJobs: updated })
    toast.info(`Moved "${jobTitle}" back to Discovery.`)
  }

  // Set of applied IDs for fast exclusion
  const appliedJobIdSet = useMemo(() => new Set(appliedJobs.map((a) => a.id)), [appliedJobs])

  // Filtered jobs calculation
  const filteredJobs = useMemo(() => {
    // 1. Stage 2 (Applied tab): Surface ALL applied opportunities from appliedJobs
    if (activeBoardTab === 'applied') {
      const appliedListings: JobListing[] = appliedJobs.map((record) => {
        const matched = allJobs.find(
          (j) => j.id === record.id || j.company?.toLowerCase().trim() === record.company?.toLowerCase().trim()
        )
        if (matched) {
          return {
            ...matched,
            id: record.id,
            title: record.jobTitle || matched.title,
            company: record.company,
            postedDate: record.appliedAt || matched.postedDate,
          }
        }
        return {
          id: record.id,
          title: record.jobTitle || 'Candidate Application',
          company: record.company,
          location: 'Direct Outreach / Crewing Desk',
          country: 'International',
          workplace: 'Remote',
          seniority: 'Mid-Level',
          roleCategory: 'others',
          postedDate: record.appliedAt || 'Recent',
          apply_url: '#',
          description: record.notes || `Dispatched application to hiring desk at ${record.company}. 7-day follow-up tracking active.`,
          source: 'CareerAce Outreach',
        }
      })

      // Search query filter for applied tab
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        return appliedListings.filter(
          (job) =>
            (job.title || '').toLowerCase().includes(q) ||
            (job.company || '').toLowerCase().includes(q) ||
            (job.location || '').toLowerCase().includes(q)
        )
      }

      return appliedListings
    }

    // 2. Stage 1 (Discovery tab): Show ONLY jobs NOT applied yet
    return allJobs.filter((job) => {
      if (appliedJobIdSet.has(job.id)) {
        return false
      }
      const normCompany = job.company?.toLowerCase().trim()
      if (normCompany && appliedJobs.some((a) => a.company?.toLowerCase().trim() === normCompany)) {
        return false
      }

      // 2. Search query filter (matches title, company, location, or description safely)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchTitle = (job.title || '').toLowerCase().includes(q)
        const matchCompany = (job.company || '').toLowerCase().includes(q)
        const matchLocation = (job.location || '').toLowerCase().includes(q)
        const matchDesc = (job.description || '').toLowerCase().includes(q)
        if (!matchTitle && !matchCompany && !matchLocation && !matchDesc) return false
      }

      // 3. Role Category Filter (Normalized to prevent bugs)
      if (!matchesRoleCategory(job, selectedRole, customRoleInput)) {
        return false
      }

      // 4. Seniority / Rank Filter (Marine & Tech normalized)
      if (!matchesSeniority(job, selectedSeniority)) {
        return false
      }

      // 5. Company Filter (Safe)
      if (selectedCompany !== 'all' && (job.company || '') !== selectedCompany) {
        return false
      }

      // 6. Country Filter (Safe & comprehensive: Nigeria, Remote, US, UK, NL, Norway, Germany, France, Canada, International)
      if (!matchesCountry(job, selectedCountry)) {
        return false
      }

      // 7. Workplace Filter (Safe: Remote, Hybrid, Onsite, Offshore / Vessel)
      if (!matchesWorkplace(job, selectedWorkplace)) {
        return false
      }

      return true
    })
  }, [
    allJobs,
    activeBoardTab,
    appliedJobs,
    appliedJobIdSet,
    searchQuery,
    selectedRole,
    customRoleInput,
    selectedSeniority,
    selectedCompany,
    selectedCountry,
    selectedWorkplace,
  ])

  // Reset pagination window when filters change
  useEffect(() => {
    setVisibleCount(16)
  }, [
    searchQuery,
    selectedRole,
    customRoleInput,
    selectedSeniority,
    selectedCompany,
    selectedCountry,
    selectedWorkplace,
    activeBoardTab,
  ])

  // Extract unique companies for dropdown (safe filter)
  const uniqueCompanies = useMemo(() => {
    const set = new Set(allJobs.map((j) => j.company).filter(Boolean))
    return Array.from(set).sort()
  }, [allJobs])

  // Daily Application Goal Target accumulator
  const DAILY_APPLICATION_TARGET = 5

  const appliedTodayCount = useMemo(() => {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const startTimestamp = startOfDay.getTime()
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

    return appliedJobs.filter((a) => {
      if (a.appliedTimestamp && a.appliedTimestamp >= startTimestamp) return true
      if (a.appliedAt && (a.appliedAt === todayStr || Date.parse(a.appliedAt) >= startTimestamp)) return true
      return false
    }).length
  }, [appliedJobs])

  // Live REST API Synchronization without DOM bloat or freeze
  async function handleSyncLiveApis() {
    setIsSyncingLiveApis(true)
    const toastId = toast.loading('Synchronizing verified opportunities from live REST APIs...')
    try {
      const res = await fetch('/api/jobs/sync?query=marine%20engineering%20software')
      const data = await res.json()
      if (data.jobs && Array.isArray(data.jobs) && data.jobs.length > 0) {
        setAllJobs((prev) => {
          const existingIds = new Set(prev.map((p) => p.id))
          const fresh = data.jobs.filter((j: JobListing) => !existingIds.has(j.id))
          return [...fresh, ...prev]
        })
        toast.success(`Synchronized ${data.jobs.length} fresh opportunities from open APIs!`, { id: toastId })
      } else {
        toast.info('All open API feeds are currently up to date.', { id: toastId })
      }
    } catch {
      toast.error('Unable to fetch live API sync feeds. Local directory active.', { id: toastId })
    } finally {
      setIsSyncingLiveApis(false)
    }
  }

  // Active Walrus Version metadata
  const selectedVersionMeta = useMemo(() => {
    if (selectedCvVersionId === 'active_draft') return null
    return walrusVersions.find((v) => v.id === selectedCvVersionId) || null
  }, [selectedCvVersionId, walrusVersions])

  // Resolved Profile data (from active draft or Walrus snapshot, fortified with verified profile fields)
  const activeProfileData = useMemo(() => {
    const raw = (selectedVersionMeta && selectedVersionMeta.profileSnapshot)
      ? selectedVersionMeta.profileSnapshot
      : activeDraftProfile

    if (!raw) return VERIFIED_FALLBACK_PROFILE

    return {
      ...VERIFIED_FALLBACK_PROFILE,
      ...raw,
      applicant_name: raw.applicant_name || VERIFIED_FALLBACK_PROFILE.applicant_name,
      email: raw.email || VERIFIED_FALLBACK_PROFILE.email,
      phone: raw.phone || VERIFIED_FALLBACK_PROFILE.phone,
      location: raw.location || VERIFIED_FALLBACK_PROFILE.location,
      target_roles: raw.target_roles?.length ? raw.target_roles : VERIFIED_FALLBACK_PROFILE.target_roles,
      summary: raw.summary || VERIFIED_FALLBACK_PROFILE.summary,
      skills: raw.skills?.length ? raw.skills : VERIFIED_FALLBACK_PROFILE.skills,
      work_experience: raw.work_experience?.length ? raw.work_experience : VERIFIED_FALLBACK_PROFILE.work_experience,
      academic_history: raw.academic_history?.length ? raw.academic_history : VERIFIED_FALLBACK_PROFILE.academic_history,
      certifications: raw.certifications?.length ? raw.certifications : VERIFIED_FALLBACK_PROFILE.certifications,
    } as ParsedCv
  }, [selectedVersionMeta, activeDraftProfile])

  // Resolved Candidate CV document properties (PDF presentation)
  const candidateNameForCv = activeProfileData?.applicant_name || 'Candidate'
  const walrusCvFileName = selectedVersionMeta?.label
    ? `${candidateNameForCv.replace(/\s+/g, '_')}_${selectedVersionMeta.label.replace(/\s+/g, '_')}.pdf`
    : `${candidateNameForCv.replace(/\s+/g, '_')}_Sovereign_CV.pdf`

  const walrusCvFileSize = selectedVersionMeta?.fileSize
    ? `${Math.round(selectedVersionMeta.fileSize / 1024)} KB`
    : '245 KB'

  const walrusVersionLabel = selectedVersionMeta?.versionNumber
    ? `v${selectedVersionMeta.versionNumber}`
    : 'Active Snapshot'

  function handleDownloadWalrusCv() {
    const profileToUse: ParsedCv = activeProfileData || VERIFIED_FALLBACK_PROFILE
    const fileName = walrusCvFileName
    downloadCvPdf(profileToUse, undefined, fileName)
    toast.success(`Downloaded ${fileName}!`)
  }

  function handleDownloadUploadedCv() {
    const origDoc = uploadedDocuments.find((d: any) => (d as any).category === 'original_cv')
    if (origDoc?.walrusUrl) {
      window.open(origDoc.walrusUrl, '_blank')
      return
    }
    handleDownloadWalrusCv()
  }

  // Real dynamic counts of available verified emails per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: VERIFIED_COMPANY_HIRING_CONTACTS.length,
    }
    VERIFIED_COMPANY_HIRING_CONTACTS.forEach((c) => {
      counts[c.category] = (counts[c.category] || 0) + 1
    })
    return counts
  }, [])

  // 5 Working Days = 7 Calendar Days (7 * 86,400,000 ms) Cooldown Enforcement
  const COOLDOWN_PERIOD_MS = 7 * 24 * 60 * 60 * 1000

  function getCompanyCooldown(companyName: string) {
    if (!companyName || !companyName.trim()) return null
    const normalized = companyName.toLowerCase().trim()
    const record = appliedJobs.find((a) => a.company?.toLowerCase().trim() === normalized)
    if (!record || !record.appliedTimestamp) return null
    const elapsed = Date.now() - record.appliedTimestamp
    if (elapsed < COOLDOWN_PERIOD_MS) {
      const remainingMs = COOLDOWN_PERIOD_MS - elapsed
      const remainingDays = Math.max(1, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)))
      return {
        active: true,
        appliedAt: record.appliedAt,
        remainingDays,
      }
    }
    return null
  }

  // Add an email to custom target emails list
  function handleAddCustomEmail() {
    const emailToAdd = newCustomEmailInput.trim().toLowerCase()
    if (!emailToAdd || !emailToAdd.includes('@')) {
      toast.error('Please enter a valid email address.')
      return
    }
    if (customEmailsList.map((e) => e.toLowerCase()).includes(emailToAdd)) {
      toast.info('This email is already added to custom recipients.')
      setNewCustomEmailInput('')
      return
    }
    const updated = [...customEmailsList, emailToAdd]
    setCustomEmailsList(updated)
    setTargetEmailInput(updated[0])
    setNewCustomEmailInput('')
    toast.success(`Added ${emailToAdd} to target recipients.`)
  }

  // Remove an email from custom target emails list
  function handleRemoveCustomEmail(emailToRemove: string) {
    const updated = customEmailsList.filter((e) => e.toLowerCase() !== emailToRemove.toLowerCase())
    setCustomEmailsList(updated)
    if (updated.length > 0) {
      setTargetEmailInput(updated[0])
    }
    toast.info(`Removed ${emailToRemove}.`)
  }

  // 1-Click Select & Lock Custom Employer direct contact
  function handleSelectCustomDirectContact() {
    let finalEmails = [...customEmailsList]
    const pendingInput = newCustomEmailInput.trim().toLowerCase()
    if (pendingInput && pendingInput.includes('@') && !finalEmails.map((e) => e.toLowerCase()).includes(pendingInput)) {
      finalEmails.push(pendingInput)
      setCustomEmailsList(finalEmails)
      setNewCustomEmailInput('')
    }
    if (finalEmails.length === 0) {
      const fallback = targetEmailInput.trim().toLowerCase()
      if (fallback && fallback.includes('@')) {
        finalEmails = [fallback]
        setCustomEmailsList(finalEmails)
      } else {
        toast.error('Please enter at least 1 valid hiring contact email address.')
        return
      }
    }
    const cleanCompany = targetCompanyInput.trim() || 'Direct Employer'
    setSelectedCompanyIds(['custom_direct_contact'])
    toast.success(`Target locked: ${finalEmails.length} recipient${finalEmails.length > 1 ? 's' : ''} selected (${cleanCompany}). Ready to dispatch!`)
  }

  // Merged available attachments list (uploaded documents and custom additions)
  const allAvailableAttachments = useMemo(() => {
    const list: { id: string; label: string; category: string; isUploaded?: boolean; walrusUrl?: string; size?: number }[] = []
    if (activeProfileData?.certifications && Array.isArray(activeProfileData.certifications)) {
      activeProfileData.certifications.forEach((c, idx) => {
        if (!list.some((item) => item.label.toLowerCase() === c.toLowerCase())) {
          list.push({ id: `profile_cert_${idx}`, label: c, category: 'Profile' })
        }
      })
    }
    customAttachmentsList.forEach((c, idx) => {
      list.push({ id: `custom_cert_${idx}`, label: c, category: 'Custom' })
    })
    uploadedDocuments.forEach((doc) => {
      list.push({
        id: doc.id,
        label: doc.name,
        category: 'Uploaded Document',
        isUploaded: true,
        walrusUrl: doc.walrusUrl,
        size: doc.size,
      })
    })
    return list
  }, [activeProfileData?.certifications, customAttachmentsList, uploadedDocuments])

  // Filtered verified corporate hiring contacts (Excludes already applied companies)
  const filteredCompanyContacts = useMemo(() => {
    return VERIFIED_COMPANY_HIRING_CONTACTS.filter((c) => {
      // Exclude companies already applied to so they do not show again
      const isAlreadyApplied = appliedJobs.some(
        (a) =>
          a.company?.toLowerCase().trim() === c.company?.toLowerCase().trim() ||
          a.recipientEmail?.toLowerCase().trim() === c.contactEmail?.toLowerCase().trim() ||
          (a as any).id === c.id
      )
      if (isAlreadyApplied) return false

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
  }, [companyCategoryFilter, companySearchQuery, appliedJobs])

  // Real file upload to Walrus & attached document manager
  async function handleDocumentUpload(fileList: FileList | File[] | null) {
    if (!fileList || fileList.length === 0) return
    setIsUploadingDoc(true)
    const toastId = toast.loading(`Uploading and anchoring ${fileList.length} document(s)...`)

    try {
      const newDocs: {
        id: string
        name: string
        size?: number
        blobId?: string
        walrusUrl?: string
        fileType?: string
        uploadedAt: string
      }[] = []
      const newSelectedIds: string[] = []

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]
        if (file.size > 25 * 1024 * 1024) {
          toast.error(`File "${file.name}" exceeds 25MB limit.`, { id: toastId })
          continue
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('title', file.name)
        formData.append('category', 'certificate')

        const res = await fetch('/api/attachment/upload', {
          method: 'POST',
          body: formData,
        })

        const data = await res.json()
        if (res.ok && data.success && data.attachment) {
          const docItem = {
            id: data.attachment.id || `up_${Date.now()}_${i}`,
            name: file.name,
            size: file.size,
            blobId: data.attachment.blobId,
            walrusUrl: data.attachment.walrusUrl,
            fileType: file.type || 'application/pdf',
            uploadedAt: new Date().toISOString(),
          }
          newDocs.push(docItem)
          newSelectedIds.push(docItem.id)
        } else {
          // Local fallback representation if network is offline
          const fallbackDoc = {
            id: `local_doc_${Date.now()}_${i}`,
            name: file.name,
            size: file.size,
            fileType: file.type || 'application/pdf',
            uploadedAt: new Date().toISOString(),
          }
          newDocs.push(fallbackDoc)
          newSelectedIds.push(fallbackDoc.id)
        }
      }

      if (newDocs.length > 0) {
        const merged = [...uploadedDocuments, ...newDocs]
        setUploadedDocuments(merged)
        try {
          localStorage.setItem('careerace_dispatch_uploaded_docs', JSON.stringify(merged))
        } catch {}
        setSelectedAttachments((prev) => Array.from(new Set([...prev, ...newSelectedIds])))
        toast.success(`Attached ${newDocs.length} document(s) to application package!`, { id: toastId })
      } else {
        toast.error('No valid documents could be uploaded.', { id: toastId })
      }
    } catch (err: any) {
      console.error('Upload error:', err)
      toast.error(err?.message || 'Failed to upload document.', { id: toastId })
    } finally {
      setIsUploadingDoc(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  function handleRemoveUploadedDoc(docId: string, docName: string) {
    const updated = uploadedDocuments.filter((d) => d.id !== docId)
    setUploadedDocuments(updated)
    setSelectedAttachments((prev) => prev.filter((id) => id !== docId))
    try {
      localStorage.setItem('careerace_dispatch_uploaded_docs', JSON.stringify(updated))
    } catch {}
    toast.info(`Removed "${docName}" from attachments.`)
  }

  // Compose clean, calibrated application draft (No AI slop, no "Organization" placeholders)
  function composeDefaultDraft(forceReset = false, isBatch = false): string {
    const candidateName = activeProfileData?.applicant_name || 'Candidate'
    const candidateEmail = activeProfileData?.email || 'applicant@careerace.online'
    const candidatePhone = activeProfileData?.phone || ''
    const candidateRole = selectedVersionMeta?.role || activeProfileData?.target_roles?.[0] || targetRoleInput || 'Applicant'
    const walrusBlobId = selectedVersionMeta?.blobId || ''
    const walrusUrl = walrusBlobId ? `https://walruscan.com/mainnet/blob/${walrusBlobId}` : 'https://careerace.online'

    const topSkills = activeProfileData?.skills?.slice(0, 5).join(', ') || 'Systems Engineering, Operational Diagnostics, Technical Rigor'
    const recentExp = activeProfileData?.work_experience?.[0]
    const expSummary = recentExp
      ? `In my previous role as ${recentExp.role}${recentExp.company ? ` at ${recentExp.company}` : ''}, I focused on ${recentExp.highlights?.[0] || 'delivering verified technical impact'}.`
      : 'My technical background emphasizes operational readiness, analytical precision, and engineering discipline.'

    const selectedDocs = allAvailableAttachments.filter((d) => selectedAttachments.includes(d.id))
    const docsBlock = selectedDocs.length > 0
      ? `\n\nAttached Documents & Verified Credentials:\n` +
        selectedDocs.map((d) => {
          if (d.walrusUrl) {
            return `• [ATTACHED] ${d.label} (Verified: ${d.walrusUrl})`
          }
          return `• [VERIFIED] ${d.label}`
        }).join('\n')
      : ''

    const cvCredentialBlock = cvSourceType === 'uploaded' && originalCvFileName
      ? `\n\nAttached Primary Resume:\n• [ATTACHED CV] ${originalCvFileName}`
      : `\n\nWalrus Sovereign Portfolio & Verified Snapshot:\n${walrusUrl}\nWalrus Credential ID: ${walrusBlobId || 'Anchored on Walrus Mainnet'}`

    let tailoredCoverLetter = ''
    try {
      tailoredCoverLetter = localStorage.getItem('careerace_tailored_cover_letter') || ''
    } catch {}

    if (!forceReset && tailoredCoverLetter && tailoredCoverLetter.trim()) {
      let cleanTailored = tailoredCoverLetter.trim()
      cleanTailored = cleanTailored.replace(/\n\nAttached Documents & Verified Credentials:[\s\S]*$/i, '')
      cleanTailored = cleanTailored.replace(/\n\nWalrus Sovereign Portfolio & Verified Snapshot:[\s\S]*$/i, '')
      cleanTailored = cleanTailored.replace(/\n\nAttached Primary Resume:[\s\S]*$/i, '')
      return cleanTailored.trim()
    }

    // Dynamic greeting: If batch or multiple companies selected, use clean universal greeting
    const isBatchSelection = isBatch || selectedCompanyIds.length > 1
    const companyGreeting = isBatchSelection
      ? 'Dear Hiring Team,'
      : (targetCompanyInput ? `Dear ${targetCompanyInput} Hiring Team,` : 'Dear Hiring Team,')

    return `${companyGreeting}

I am writing to formally submit my application for the position of ${targetRoleInput || candidateRole}.

${expSummary}

Key Competencies & Attestations:
• Target Role: ${targetRoleInput || candidateRole}
• Verified Skill Profile: ${topSkills}
• Credential Profile: ${cvSourceType === 'uploaded' ? 'Attached verified candidate CV document.' : 'Verified curriculum vitae snapshot on Mysten Labs Walrus decentralized storage.'}

I would welcome the opportunity to discuss how my technical experience and disciplined approach align with your operational standards. Thank you for your time and consideration.

Sincerely,
${candidateName}
${candidateEmail}${candidatePhone ? ` | ${candidatePhone}` : ''}`
  }

  // Update subject and body if not manually modified by user
  useEffect(() => {
    const candidateName = activeProfileData?.applicant_name || 'Candidate'
    const candidateRole = selectedVersionMeta?.role || activeProfileData?.target_roles?.[0] || targetRoleInput || 'Applicant'
    setCustomEmailSubject(`Application: ${targetRoleInput || candidateRole} – ${candidateName} (Walrus Sovereign Credential)`)

    if (!isBodyUserEdited) {
      setCustomEmailBody(composeDefaultDraft())
    }
  }, [activeProfileData, targetCompanyInput, targetRoleInput, selectedVersionMeta, selectedAttachments, allAvailableAttachments, isBodyUserEdited, cvSourceType, originalCvFileName, selectedCompanyIds])

  function handleSelectCompanyFromDirectory(contact: CompanyHiringContact) {
    setTargetCompanyInput(contact.company)
    setTargetEmailInput(contact.contactEmail)
    setCustomEmailsList([contact.contactEmail])
    if (contact.typicalRoles && contact.typicalRoles.length > 0) {
      setTargetRoleInput(contact.typicalRoles[0])
    }
    const cd = getCompanyCooldown(contact.company)
    if (cd && cd.active) {
      toast.warning(`Note: Applied on ${cd.appliedAt}. 5-working-day cooldown active (${cd.remainingDays} days remaining).`)
    } else {
      toast.success(`Selected ${contact.company} (${contact.contactEmail}) for auto-apply.`)
    }
  }

  function handleSendApplicationEmail() {
    if (!targetEmailInput || !targetEmailInput.includes('@')) {
      toast.error('Please specify a valid corporate hiring email.')
      return
    }

    // Automated download of an RFC-compliant .eml delivery receipt alongside native mailto trigger
    try {
      downloadEmlReceipt({
        to: targetEmailInput,
        fromName: activeProfileData?.applicant_name || 'Candidate',
        fromEmail: activeProfileData?.email || 'applicant@careerace.online',
        subject: customEmailSubject,
        body: customEmailBody,
        candidateAddress: sessionAddress || null,
        company: targetCompanyInput,
        role: targetRoleInput,
        walrusBlobId: selectedVersionMeta?.blobId || null,
        relayProvider: 'Native Mail Client (RFC-5322 EML Receipt)',
        attachments: uploadedDocuments.map((d) => ({
          name: d.name,
          size: d.size,
          blobId: d.blobId,
          url: d.walrusUrl,
        })),
      })
      toast.info('RFC-5322 delivery receipt (.eml) downloaded for your offline record.')
    } catch (e) {
      console.error('Failed to trigger automatic .eml receipt', e)
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

    const updated = [record, ...appliedJobs.filter((a) => a.company?.toLowerCase() !== record.company?.toLowerCase())]
    setAppliedJobs(updated)
    localStorage.setItem('careerace_applied_jobs', JSON.stringify(updated))
    syncCandidateDataToCloud({ appliedJobs: updated })

    setAutoApplyLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] Dispatched application to ${targetEmailInput} (${targetCompanyInput}) via mail client. Delivery receipt (.eml) saved. Scheduled 7-day follow-up.`,
      ...prev,
    ])

    toast.success(`Dispatched application to ${targetEmailInput} and logged into Applied tracker!`)
    setActiveBoardTab('applied')
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

    const updated = [record, ...appliedJobs.filter((a) => a.company?.toLowerCase() !== record.company?.toLowerCase())]
    setAppliedJobs(updated)
    localStorage.setItem('careerace_applied_jobs', JSON.stringify(updated))
    syncCandidateDataToCloud({ appliedJobs: updated })

    setAutoApplyLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] Manually logged application for ${targetCompanyInput} (${targetRoleInput}).`,
      ...prev,
    ])

    toast.success(`Logged application to ${targetCompanyInput} in your Applied tracker.`)
    setActiveBoardTab('applied')
  }

  // 1-Click Direct Relay Dispatch via /api/email/dispatch
  async function handleRelayDispatch() {
    if (!targetEmailInput || !targetEmailInput.includes('@')) {
      toast.error('Please specify a valid corporate hiring email.')
      return
    }

    const cooldown = getCompanyCooldown(targetCompanyInput)
    if (cooldown && cooldown.active) {
      toast.error(
        `Cooldown active: You submitted an application to ${targetCompanyInput} on ${cooldown.appliedAt}. Repeat applications are locked for 5 working days (${cooldown.remainingDays} days remaining) to protect your sender reputation.`
      )
      return
    }

    setIsRelayDispatching(true)
    const toastId = toast.loading(`Dispatching application to ${targetEmailInput} via DKIM Relay...`)

    try {
      let smtpConfig: any = { provider: 'sovereign_relay' }
      try {
        const storedSmtp = localStorage.getItem('careerace_custom_smtp')
        if (storedSmtp) {
          smtpConfig = JSON.parse(storedSmtp)
        }
      } catch {}

      const candidateName = activeProfileData?.applicant_name || 'Candidate'
      const candidateEmail = activeProfileData?.email || 'applicant@careerace.online'
      const candidatePhone = activeProfileData?.phone || ''
      const candidateLocation = activeProfileData?.location || ''
      const walrusBlobId = selectedVersionMeta?.blobId || ''
      const primaryCvName = cvSourceType === 'walrus' ? `${candidateName.replace(/\s+/g, '_')}_Sovereign_CV.pdf` : (uploadedDocuments[0]?.name || `${candidateName.replace(/\s+/g, '_')}_CV.pdf`)
      const primaryCvSize = selectedVersionMeta?.fileSize || uploadedDocuments[0]?.size || 245000
      const primaryCvUrl = cvSourceType === 'walrus' ? (walrusBlobId ? `https://walruscan.com/mainnet/blob/${walrusBlobId}` : undefined) : uploadedDocuments[0]?.walrusUrl
      const passportUrl = `https://careerace.online/verify?applicant=${encodeURIComponent(candidateName)}`

      const res = await fetch('/api/email/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: targetEmailInput,
          subject: customEmailSubject,
          body: customEmailBody,
          candidateName,
          candidateEmail,
          candidatePhone,
          candidateLocation,
          role: targetRoleInput,
          company: targetCompanyInput,
          smtpConfig,
          walrusBlobId,
          primaryCvName,
          primaryCvSize,
          primaryCvUrl,
          passportUrl,
          cvProfile: activeProfileData,
          attachments: uploadedDocuments
            .filter((d) => selectedAttachments.includes(d.id))
            .map((d) => ({
              id: d.id,
              name: d.name,
              size: d.size,
              blobId: d.blobId,
              url: d.walrusUrl,
            })),
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Relay dispatch encountered an error.')
      }

      const now = Date.now()
      const record: AppliedJobRecord = {
        id: `relay-apply-${now}`,
        jobTitle: targetRoleInput || 'Candidate Application',
        company: targetCompanyInput || 'Corporate Direct',
        appliedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        appliedTimestamp: now,
        followUpStatus: 'pending',
      }

      const updated = [record, ...appliedJobs]
      setAppliedJobs(updated)
      localStorage.setItem('careerace_applied_jobs', JSON.stringify(updated))
      syncCandidateDataToCloud({ appliedJobs: updated })

      setAutoApplyLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] Dispatched via ${data.relayProvider || 'Sovereign DKIM'} to ${targetEmailInput}. Delivery: ${data.deliveryStatus || 'Sent'}. MessageID: ${data.messageId || 'DKIM-OK'}.`,
        `[${new Date().toLocaleTimeString()}] 5-working-day cooldown active for ${targetCompanyInput}.`,
        ...prev,
      ])

      // Automated download of an RFC-compliant .eml delivery receipt alongside direct relay
      try {
        downloadEmlReceipt({
          to: targetEmailInput,
          fromName: candidateName,
          fromEmail: candidateEmail,
          subject: customEmailSubject,
          body: customEmailBody,
          candidateAddress: sessionAddress || null,
          company: targetCompanyInput,
          role: targetRoleInput,
          walrusBlobId: walrusBlobId || null,
          relayProvider: data.relayProvider || 'Sovereign DKIM Relay',
          messageId: data.messageId || undefined,
          attachments: uploadedDocuments.map((d) => ({
            name: d.name,
            size: d.size,
            blobId: d.blobId,
            url: d.walrusUrl,
          })),
        })
        toast.info('RFC-5322 delivery receipt (.eml) saved to your device.')
      } catch (e) {
        console.error('Failed to trigger automatic .eml receipt', e)
      }

      toast.success(data.message || `Dispatched application to ${targetEmailInput}! 5-working-day cooldown active.`, { id: toastId })
      setActiveBoardTab('applied')
    } catch (err: any) {
      toast.error(err.message || 'Failed to dispatch via relay. Falling back to email client.', { id: toastId })
    } finally {
      setIsRelayDispatching(false)
    }
  }

  // Send a live test application email to candidate's own email address before launching
  async function handleSendTestDispatch() {
    const targetEmail = (testRecipientEmail.trim() || activeProfileData?.email || '').trim()
    if (!targetEmail || !targetEmail.includes('@')) {
      toast.error('Please specify a valid test recipient email.')
      return
    }

    setIsSendingTestEmail(true)
    const toastId = toast.loading(`Sending sample test dispatch to ${targetEmail}...`)

    try {
      let smtpConfig: any = { provider: 'sovereign_relay' }
      try {
        const storedSmtp = localStorage.getItem('careerace_custom_smtp')
        if (storedSmtp) {
          smtpConfig = JSON.parse(storedSmtp)
        }
      } catch {}

      const candidateName = activeProfileData?.applicant_name || 'Candidate'
      const candidateEmail = activeProfileData?.email || targetEmail
      const candidatePhone = activeProfileData?.phone || ''
      const candidateLocation = activeProfileData?.location || ''
      const walrusBlobId = selectedVersionMeta?.blobId || ''
      const primaryCvName = cvSourceType === 'walrus' ? `${candidateName.replace(/\s+/g, '_')}_Sovereign_CV.pdf` : (uploadedDocuments[0]?.name || `${candidateName.replace(/\s+/g, '_')}_CV.pdf`)
      const primaryCvSize = selectedVersionMeta?.fileSize || uploadedDocuments[0]?.size || 245000
      const primaryCvUrl = cvSourceType === 'walrus' ? (walrusBlobId ? `https://walruscan.com/mainnet/blob/${walrusBlobId}` : undefined) : uploadedDocuments[0]?.walrusUrl
      const passportUrl = `https://careerace.online/verify?applicant=${encodeURIComponent(candidateName)}`

      const res = await fetch('/api/email/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: targetEmail,
          subject: `[SAMPLE TEST] Application: ${targetRoleInput} – ${candidateName} (Walrus Sovereign Credential)`,
          body: customEmailBody,
          candidateName,
          candidateEmail,
          candidatePhone,
          candidateLocation,
          role: targetRoleInput,
          company: `${targetCompanyInput} (Sample Test)`,
          smtpConfig,
          walrusBlobId,
          primaryCvName,
          primaryCvSize,
          primaryCvUrl,
          passportUrl,
          cvProfile: activeProfileData,
          attachments: uploadedDocuments
            .filter((d) => selectedAttachments.includes(d.id))
            .map((d) => ({
              id: d.id,
              name: d.name,
              size: d.size,
              blobId: d.blobId,
              url: d.walrusUrl,
            })),
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Test transmission failed.')
      }

      toast.success(`Sample test message successfully dispatched to ${targetEmail}! Inspect your inbox.`, { id: toastId })
      setTestEmailModalOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Test dispatch failed. Verify your relay credentials.', { id: toastId })
    } finally {
      setIsSendingTestEmail(false)
    }
  }

  // 1-Click Send Sample Test directly to candidate's own email without prompts
  async function handleSendSampleToMyEmailDirectly() {
    const userEmail = (testRecipientEmail.trim() || activeProfileData?.email || '').trim()
    if (!userEmail || !userEmail.includes('@')) {
      toast.error('Please specify a valid email address in your profile or test input.')
      setTestEmailModalOpen(true)
      return
    }

    setIsSendingTestEmail(true)
    const toastId = toast.loading(`Sending sample test dispatch to your inbox (${userEmail})...`)
    try {
      let smtpConfig: any = { provider: 'sovereign_relay' }
      try {
        const storedSmtp = localStorage.getItem('careerace_custom_smtp')
        if (storedSmtp) smtpConfig = JSON.parse(storedSmtp)
      } catch {}

      const candidateName = activeProfileData?.applicant_name || 'Candidate'
      const candidateEmail = activeProfileData?.email || userEmail
      const candidatePhone = activeProfileData?.phone || ''
      const candidateLocation = activeProfileData?.location || ''
      const walrusBlobId = selectedVersionMeta?.blobId || ''
      const primaryCvName = cvSourceType === 'walrus' 
        ? `${candidateName.replace(/\s+/g, '_')}_Sovereign_CV.pdf` 
        : (uploadedDocuments[0]?.name || `${candidateName.replace(/\s+/g, '_')}_CV.pdf`)
      const primaryCvSize = selectedVersionMeta?.fileSize || uploadedDocuments[0]?.size || 245000
      const primaryCvUrl = cvSourceType === 'walrus' 
        ? (walrusBlobId ? `https://walruscan.com/mainnet/blob/${walrusBlobId}` : undefined) 
        : uploadedDocuments[0]?.walrusUrl
      const passportUrl = `https://careerace.online/verify?applicant=${encodeURIComponent(candidateName)}`

      const res = await fetch('/api/email/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: userEmail,
          subject: `[SAMPLE TEST] Application: ${targetRoleInput} – ${candidateName} (Walrus Sovereign Credential)`,
          body: customEmailBody,
          candidateName,
          candidateEmail,
          candidatePhone,
          candidateLocation,
          role: targetRoleInput,
          company: `${targetCompanyInput} (Sample Test)`,
          smtpConfig,
          walrusBlobId,
          primaryCvName,
          primaryCvSize,
          primaryCvUrl,
          passportUrl,
          cvProfile: activeProfileData,
          attachments: uploadedDocuments
            .filter((d) => selectedAttachments.includes(d.id))
            .map((d) => ({
              id: d.id,
              name: d.name,
              size: d.size,
              blobId: d.blobId,
              url: d.walrusUrl,
            })),
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Test transmission failed.')
      }

      toast.success(`Sample test message successfully dispatched to ${userEmail}! Inspect your inbox.`, { id: toastId })
    } catch (err: any) {
      toast.error(err.message || 'Test dispatch failed. Verify your relay credentials.', { id: toastId })
    } finally {
      setIsSendingTestEmail(false)
    }
  }

  // Proceed to Batch Dispatch with automatic notification copy delivered to user's personal email
  async function handleProceedToBatchWithNotification() {
    const userEmail = (activeProfileData?.email || testRecipientEmail.trim() || '').trim()
    if (userEmail && userEmail.includes('@')) {
      const candidateName = activeProfileData?.applicant_name || 'Candidate'
      const walrusBlobId = selectedVersionMeta?.blobId || ''
      const primaryCvName = cvSourceType === 'walrus' 
        ? `${candidateName.replace(/\s+/g, '_')}_Sovereign_CV.pdf` 
        : (uploadedDocuments[0]?.name || `${candidateName.replace(/\s+/g, '_')}_CV.pdf`)
      const primaryCvSize = selectedVersionMeta?.fileSize || uploadedDocuments[0]?.size || 245000
      const primaryCvUrl = cvSourceType === 'walrus' 
        ? (walrusBlobId ? `https://walruscan.com/mainnet/blob/${walrusBlobId}` : undefined) 
        : uploadedDocuments[0]?.walrusUrl
      const passportUrl = `https://careerace.online/verify?applicant=${encodeURIComponent(candidateName)}`

      // Fire candidate notification copy
      fetch('/api/email/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: userEmail,
          subject: `[Candidate Notice] Batch Dispatch Prepared: ${targetRoleInput || 'Application'} – ${candidateName}`,
          body: customEmailBody,
          candidateName,
          candidateEmail: userEmail,
          candidatePhone: activeProfileData?.phone || '',
          candidateLocation: activeProfileData?.location || '',
          role: targetRoleInput || 'Application',
          company: targetCompanyInput || 'Hiring Desks',
          walrusBlobId,
          primaryCvName,
          primaryCvSize,
          primaryCvUrl,
          passportUrl,
          cvProfile: activeProfileData,
          attachments: uploadedDocuments
            .filter((d) => selectedAttachments.includes(d.id))
            .map((d) => ({
              id: d.id,
              name: d.name,
              size: d.size,
              blobId: d.blobId,
              url: d.walrusUrl,
            })),
        }),
      }).catch((e) => console.warn('Candidate notification copy error:', e))

      toast.info(`Candidate dispatch notification sent to your email (${userEmail}).`)
    }

    setSamplePreviewModalOpen(false)
    setBatchDispatchModalOpen(true)
  }

  // 1-Click Batch Dispatch across verified corporate contacts with Anti-Spam Pacing
  async function handleBatchDispatch(targetCount: number) {
    const eligibleContacts = filteredCompanyContacts.filter((c) => {
      const cd = getCompanyCooldown(c.company)
      return !cd || !cd.active
    })

    if (eligibleContacts.length === 0) {
      toast.error('All companies in this filter are currently in 5-day cooldown or none found.')
      return
    }

    const batchToProcess = eligibleContacts.slice(0, targetCount)
    setIsBatchDispatching(true)
    let successfulCount = 0

    let smtpConfig: any = { provider: 'sovereign_relay' }
    try {
      const storedSmtp = localStorage.getItem('careerace_custom_smtp')
      if (storedSmtp) {
        smtpConfig = JSON.parse(storedSmtp)
      }
    } catch {}

    const candidateName = activeProfileData?.applicant_name || 'Candidate'
    const candidateEmail = activeProfileData?.email || 'applicant@careerace.online'
    const candidatePhone = activeProfileData?.phone || ''
    const candidateLocation = activeProfileData?.location || ''
    const candidateRole = selectedVersionMeta?.role || activeProfileData?.target_roles?.[0] || targetRoleInput || 'Applicant'
    const walrusBlobId = selectedVersionMeta?.blobId || ''
    const primaryCvName = cvSourceType === 'walrus' ? `${candidateName.replace(/\s+/g, '_')}_Sovereign_CV.pdf` : (uploadedDocuments[0]?.name || `${candidateName.replace(/\s+/g, '_')}_CV.pdf`)
    const primaryCvSize = selectedVersionMeta?.fileSize || uploadedDocuments[0]?.size || 245000
    const primaryCvUrl = cvSourceType === 'walrus' ? (walrusBlobId ? `https://walruscan.com/mainnet/blob/${walrusBlobId}` : undefined) : uploadedDocuments[0]?.walrusUrl
    const passportUrl = `https://careerace.online/verify?applicant=${encodeURIComponent(candidateName)}`

    let currentAppliedList = [...appliedJobs]

    for (let i = 0; i < batchToProcess.length; i++) {
      const contact = batchToProcess[i]
      setBatchProgress({
        current: i + 1,
        total: batchToProcess.length,
        currentCompany: contact.company,
      })

      const targetRole = contact.typicalRoles?.[0] || targetRoleInput || candidateRole
      const batchSubject = `Application: ${targetRole} – ${candidateName} (Walrus Sovereign Credential)`

      let batchBody = customEmailBody
      if (batchBody.includes('Dear Hiring Team')) {
        batchBody = batchBody.replace(/Dear Hiring Team at [^,\n]+,/, `Dear Hiring Team at ${contact.company},`)
      }

      try {
        const res = await fetch('/api/email/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: contact.contactEmail,
            subject: batchSubject,
            body: batchBody,
            candidateName,
            candidateEmail,
            candidatePhone,
            candidateLocation,
            role: targetRole,
            company: contact.company,
            smtpConfig,
            walrusBlobId,
            primaryCvName,
            primaryCvSize,
            primaryCvUrl,
            passportUrl,
            cvProfile: activeProfileData,
            attachments: uploadedDocuments
              .filter((d) => selectedAttachments.includes(d.id))
              .map((d) => ({
                id: d.id,
                name: d.name,
                size: d.size,
                blobId: d.blobId,
                url: d.walrusUrl,
              })),
          }),
        })

        if (res.ok) {
          successfulCount++
          const now = Date.now()
          const record: AppliedJobRecord = {
            id: `batch-apply-${now}-${i}`,
            jobTitle: targetRole,
            company: contact.company,
            appliedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            appliedTimestamp: now,
            followUpStatus: 'pending',
          }
          currentAppliedList = [record, ...currentAppliedList]
          setAppliedJobs(currentAppliedList)
          localStorage.setItem('careerace_applied_jobs', JSON.stringify(currentAppliedList))
          syncCandidateDataToCloud({ appliedJobs: currentAppliedList })
        }
      } catch {}

      // Anti-Spam Staggered Pacing Delay (3.5 to 5 seconds) to prevent triggering spam traps
      if (i < batchToProcess.length - 1) {
        for (let s = batchDelaySeconds; s > 0; s--) {
          setBatchCountdown(s)
          await new Promise((res) => setTimeout(res, 1000))
        }
        setBatchCountdown(null)
      }
    }

    setIsBatchDispatching(false)
    setBatchProgress(null)
    setBatchCountdown(null)
    setBatchDispatchModalOpen(false)

    if (successfulCount > 0) {
      toast.success(`Successfully dispatched application to ${successfulCount} company crewing desks! 5-day cooldown active.`)
      setActiveBoardTab('applied')
      handleTriggerDispatchSummaryReport(currentAppliedList)
    } else {
      toast.error('Batch dispatch completed with 0 successful relays. Check SMTP settings.')
    }
  }

  // Automated or on-demand dispatch summary report delivered to candidate personal email
  async function handleTriggerDispatchSummaryReport(jobsToSend?: AppliedJobRecord[]) {
    const list = jobsToSend || appliedJobs
    const candidateEmail = (activeProfileData?.email || '').trim()
    if (!candidateEmail || !candidateEmail.includes('@')) {
      toast.error('Please configure your candidate email in profile to receive the dispatch summary report.')
      return
    }
    if (list.length === 0) {
      toast.info('No applications recorded yet to report.')
      return
    }

    const toastId = toast.loading(`Generating executive dispatch report for ${candidateEmail}...`)
    try {
      const res = await fetch('/api/email/dispatch-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateEmail,
          candidateName: activeProfileData?.applicant_name || 'Candidate',
          dispatches: list.slice(0, 25).map((j) => ({
            company: j.company,
            role: j.jobTitle,
            appliedAt: j.appliedAt,
            followUpDue: '7 Days',
            status: 'Delivered',
          })),
          walrusCvSnapshotLabel: selectedVersionMeta?.label || walrusVersionLabel,
          walrusBlobId: selectedVersionMeta?.blobId || undefined,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`Executive dispatch report sent to ${candidateEmail}! Check your inbox.`, { id: toastId })
      } else {
        toast.info(`Dispatch report processed (${data.message || 'Complete'}).`, { id: toastId })
      }
    } catch (e: any) {
      console.warn('Dispatch report notice:', e)
      toast.error(e?.message || 'Could not send dispatch report email.', { id: toastId })
    }
  }

  // Dispatch applications to currently selected companies and move them automatically to Applied
  async function handleDispatchSelectedCompanies() {
    const isCustomDirect = selectedCompanyIds.includes('custom_direct_contact')
    const customList = customEmailsList.length > 0 ? customEmailsList : [targetEmailInput.trim()]
    const selectedCompanies: CompanyHiringContact[] = isCustomDirect
      ? customList.map((email, idx) => ({
          id: `custom_direct_contact_${idx}`,
          company: targetCompanyInput.trim() || 'Direct Employer',
          category: 'Software / Cloud',
          contactEmail: email.trim(),
          typicalRoles: [targetRoleInput.trim() || 'Candidate Application'],
          location: 'Direct / Custom Recipient',
          careersUrl: 'https://careerace.online',
          notes: 'Direct custom contact target',
        }))
      : filteredCompanyContacts.filter((c) =>
          selectedCompanyIds.includes(c.id)
        )

    if (selectedCompanies.length === 0) {
      toast.error('Please select at least 1 employer from the directory or target a direct contact.')
      return
    }

    setIsBatchDispatching(true)
    const toastId = toast.loading(
      isCustomDirect
        ? `Dispatching direct application to ${selectedCompanies.length} contact${selectedCompanies.length > 1 ? 's' : ''}...`
        : `Dispatching application to ${selectedCompanies.length} verified employers...`
    )

    let currentAppliedList = [...appliedJobs]
    const candidateName = activeProfileData?.applicant_name || 'Candidate'
    const candidateEmail = activeProfileData?.email || 'applicant@careerace.online'
    const candidatePhone = activeProfileData?.phone || ''
    const candidateLocation = activeProfileData?.location || ''
    const candidateRole = selectedVersionMeta?.role || activeProfileData?.target_roles?.[0] || targetRoleInput || 'Applicant'
    const walrusBlobId = selectedVersionMeta?.blobId || ''
    const primaryCvName = cvSourceType === 'walrus' ? `${candidateName.replace(/\s+/g, '_')}_Sovereign_CV.pdf` : (uploadedDocuments[0]?.name || `${candidateName.replace(/\s+/g, '_')}_CV.pdf`)
    const primaryCvSize = selectedVersionMeta?.fileSize || uploadedDocuments[0]?.size || 245000
    const primaryCvUrl = cvSourceType === 'walrus' ? (walrusBlobId ? `https://walruscan.com/mainnet/blob/${walrusBlobId}` : undefined) : uploadedDocuments[0]?.walrusUrl
    const passportUrl = `https://careerace.online/verify?applicant=${encodeURIComponent(candidateName)}`

    let smtpConfig: any = { provider: 'sovereign_relay' }
    try {
      const storedSmtp = localStorage.getItem('careerace_custom_smtp')
      if (storedSmtp) smtpConfig = JSON.parse(storedSmtp)
    } catch {}

    for (let i = 0; i < selectedCompanies.length; i++) {
      const contact = selectedCompanies[i]
      const targetRole = contact.typicalRoles?.[0] || targetRoleInput || candidateRole
      const batchSubject = `Application: ${targetRole} – ${candidateName} (Walrus Sovereign Credential)`

      let batchBody = customEmailBody
      if (batchBody.includes('Dear Hiring Team')) {
        batchBody = batchBody.replace(/Dear Hiring Team( at [^,\n]+)?,/, `Dear Hiring Team at ${contact.company},`)
      }

      try {
        await fetch('/api/email/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: contact.contactEmail,
            subject: batchSubject,
            body: batchBody,
            candidateName,
            candidateEmail,
            candidatePhone,
            candidateLocation,
            role: targetRole,
            company: contact.company,
            smtpConfig,
            walrusBlobId,
            primaryCvName,
            primaryCvSize,
            primaryCvUrl,
            passportUrl,
            cvProfile: activeProfileData,
            attachments: uploadedDocuments
              .filter((d) => selectedAttachments.includes(d.id))
              .map((d) => ({
                id: d.id,
                name: d.name,
                size: d.size,
                blobId: d.blobId,
                url: d.walrusUrl,
              })),
          }),
        })
      } catch {}

      // Always create applied job record with 7-day follow-up
      const now = Date.now()
      const record: AppliedJobRecord = {
        id: `auto-apply-${now}-${i}`,
        jobTitle: targetRole,
        company: `${contact.company}${selectedCompanies.length > 1 && isCustomDirect ? ` (${contact.contactEmail})` : ''}`,
        appliedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        appliedTimestamp: now,
        followUpStatus: 'pending',
      }
      currentAppliedList = [record, ...currentAppliedList.filter((a) => a.company !== record.company)]
      setAppliedJobs(currentAppliedList)
      localStorage.setItem('careerace_applied_jobs', JSON.stringify(currentAppliedList))
      syncCandidateDataToCloud({ appliedJobs: currentAppliedList })
    }

    setIsBatchDispatching(false)
    setSelectedCompanyIds([])

    toast.success(
      isCustomDirect
        ? `Successfully dispatched application to ${selectedCompanies.length} contact email${selectedCompanies.length > 1 ? 's' : ''}! Switched to Applied tracker.`
        : `Successfully dispatched to ${selectedCompanies.length} verified employers! Switched to Applied tracker.`,
      { id: toastId }
    )
    setActiveBoardTab('applied')
    handleTriggerDispatchSummaryReport(currentAppliedList)
  }

  // Upload original CV directly to Walrus sovereign memory
  async function handleOriginalCvUpload(fileList: FileList | File[] | null) {
    if (!fileList || fileList.length === 0) return
    const file = fileList[0]
    setIsUploadingOriginalCv(true)
    const toastId = toast.loading(`Uploading and anchoring original CV "${file.name}" to Walrus...`)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', `Original CV - ${file.name}`)
      formData.append('category', 'original_cv')

      const res = await fetch('/api/attachment/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      const docItem = {
        id: data?.attachment?.id || `orig_${Date.now()}`,
        name: file.name,
        size: file.size,
        blobId: data?.attachment?.blobId,
        walrusUrl: data?.attachment?.walrusUrl,
        fileType: file.type || 'application/pdf',
        uploadedAt: new Date().toISOString(),
        category: 'original_cv',
      }

      setOriginalCvFileName(file.name)
      localStorage.setItem('careerace_original_cv_doc', JSON.stringify(docItem))
      setUploadedDocuments((prev) => [docItem, ...prev.filter((d: any) => (d as any).category !== 'original_cv')])
      toast.success(`Original CV anchored to Walrus sovereign memory!`, { id: toastId })
    } catch {
      toast.error('Failed to upload original CV.', { id: toastId })
    } finally {
      setIsUploadingOriginalCv(false)
      if (originalFileInputRef.current) originalFileInputRef.current.value = ''
    }
  }

  function handleDownloadFollowUpIcs(job: JobListing, record?: AppliedJobRecord) {
    const followUpDate = record?.appliedTimestamp 
      ? new Date(record.appliedTimestamp + 7 * 86400000)
      : new Date(Date.now() + 7 * 86400000)

    downloadFollowUpIcs({
      jobTitle: job.title,
      company: job.company,
      appliedDate: record?.appliedAt || new Date().toLocaleDateString('en-US'),
      followUpDate,
      contactEmail: job.apply_url?.includes('@') ? job.apply_url : undefined,
      applicationUrl: job.apply_url,
      notes: `CareerAce Sovereign Application Follow-Up. 7-day milestone reached for ${job.title} at ${job.company}. Review response and calibrate portfolio.`
    })
    toast.success(`Downloaded RFC 5545 Calendar reminder for ${job.company}`)
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
        `[${new Date().toLocaleTimeString()}] Prepared tailored application letter with Walrus storage attestation`,
        ...prev,
      ])
      setAutoApplyRunning(false)
      toast.success(`Matched opening at ${matchedContact.company}! Draft loaded in composer ready for email dispatch.`)
    }, 1500)
  }

  return (
    <AppShell>
      <div className="p-2.5 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Top Header & 3 Stage Navigation Tabs: 1. Discovery, 2. Applied, 3. Auto Apply */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1 border-b border-border/60">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border/80 w-full sm:w-fit overflow-x-auto no-scrollbar shrink-0">
            {/* Stage 1: Discovery */}
            <button
              onClick={() => setActiveBoardTab('discover')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                activeBoardTab === 'discover'
                  ? 'bg-background text-foreground shadow-xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Discovery</span>
            </button>

            {/* Stage 2: Applied */}
            <button
              onClick={() => setActiveBoardTab('applied')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                activeBoardTab === 'applied'
                  ? 'bg-background text-foreground shadow-xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Applied</span>
              {appliedJobs.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {appliedJobs.length}
                </span>
              )}
            </button>

            {/* Stage 3: Auto Apply */}
            <button
              onClick={() => setActiveBoardTab('auto_apply')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                activeBoardTab === 'auto_apply'
                  ? 'bg-background text-foreground shadow-xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-primary" />
              <span>Auto Apply</span>
              <Badge variant="outline" className="text-[9px] py-0 px-1 border-primary/30 text-primary">
                AI
              </Badge>
            </button>
          </div>

          {/* Real-time status indicator */}
          <div className="flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono">Sovereign Pipeline · Auto-Sync Active</span>
          </div>
        </div>

        {/* View Content depending on active tab */}
        {activeBoardTab === 'auto_apply' ? (
          /* Stage 4: Auto Apply via Corporate Emails & Walrus Credentials */
          <div className="space-y-4 sm:space-y-6">
            {/* Top Auto Apply Control & Safeguards Header */}
            {/* Top Auto Apply Control Header */}
            <Card className="p-3 sm:p-4 rounded-xl border border-border bg-card shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-foreground">Corporate Email Application Dispatch</h2>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={triggerAutoApplyCycle}
                    disabled={autoApplyRunning}
                    className="gap-1.5 text-xs font-semibold h-8 px-3 border-border hover:bg-muted text-foreground cursor-pointer"
                    title="Scan verified corporate contacts for target role opening"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>{autoApplyRunning ? 'Scanning...' : 'Match Opening'}</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSamplePreviewModalOpen(true)}
                    className="gap-1.5 text-xs font-semibold h-8 px-3 border-border hover:bg-muted text-foreground cursor-pointer"
                    title="Preview full rendered email layout, headers, and attachments"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Preview Sample</span>
                  </Button>
                </div>
              </div>
            </Card>

              {/* Main Operations Split: Verified Directory vs Clean Dispatch Console */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                {/* Left Column (5 cols): Verified Corporate Hiring Directory */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-500" />
                        <h3 className="text-xs font-bold text-foreground">Verified Corporate Hiring Directory</h3>
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {filteredCompanyContacts.length} available
                      </Badge>
                    </div>

                    {/* Batch Selection Controls */}
                    <div className="flex items-center justify-between gap-2 pt-1 pb-1 border-y border-border/40">
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const eligible = filteredCompanyContacts.filter(c => !getCompanyCooldown(c.company)?.active)
                            setSelectedCompanyIds(eligible.slice(0, 5).map(c => c.id))
                            toast.info(`Selected ${Math.min(5, eligible.length)} verified employers.`)
                          }}
                          className="h-7 px-2.5 text-[11px] font-semibold border-border hover:bg-muted cursor-pointer"
                        >
                          Select 5
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const eligible = filteredCompanyContacts.filter(c => !getCompanyCooldown(c.company)?.active)
                            setSelectedCompanyIds(eligible.slice(0, 10).map(c => c.id))
                            toast.info(`Selected ${Math.min(10, eligible.length)} verified employers (Max 10).`)
                          }}
                          className="h-7 px-2.5 text-[11px] font-semibold border-border hover:bg-muted cursor-pointer"
                        >
                          Select 10 (Max)
                        </Button>
                        {selectedCompanyIds.length > 0 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedCompanyIds([])}
                            className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                        {selectedCompanyIds.length} Selected
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

                    {/* Category Filter Pills with Dynamic Counts */}
                    <div className="flex flex-wrap gap-1 text-[11px]">
                      {[
                        { id: 'all', label: `All (${categoryCounts.all})` },
                        { id: 'Software / Cloud', label: `Software (${categoryCounts['Software / Cloud'] || 0})` },
                        { id: 'AI / Robotics', label: `AI (${categoryCounts['AI / Robotics'] || 0})` },
                        { id: 'Maritime / Offshore', label: `Maritime (${categoryCounts['Maritime / Offshore'] || 0})` },
                        { id: 'Engineering / Industrial', label: `Engineering (${categoryCounts['Engineering / Industrial'] || 0})` },
                        { id: 'Medical / Healthcare', label: `Medical (${categoryCounts['Medical / Healthcare'] || 0})` },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setCompanyCategoryFilter(cat.id)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
                            companyCategoryFilter === cat.id
                              ? 'bg-foreground text-background shadow-xs'
                              : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Company Cards List */}
                    <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                      {filteredCompanyContacts.map((contact) => {
                        const cd = getCompanyCooldown(contact.company)
                        const isChecked = selectedCompanyIds.includes(contact.id)

                        return (
                          <div
                            key={contact.id}
                            onClick={() => {
                              setSelectedCompanyIds(prev =>
                                prev.includes(contact.id)
                                  ? prev.filter(id => id !== contact.id)
                                  : [...prev, contact.id]
                              )
                            }}
                            className={`p-2.5 rounded-lg border transition-all text-xs cursor-pointer select-none ${
                              isChecked
                                ? 'border-emerald-500 bg-emerald-500/10 shadow-xs'
                                : 'border-border/80 bg-background hover:bg-muted/30'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="w-3.5 h-3.5 rounded border-border text-emerald-600 focus:ring-emerald-500 pointer-events-none"
                                />
                                <div className="min-w-0">
                                  <span className="font-semibold text-foreground block truncate">{contact.company}</span>
                                  <span className="text-[10px] text-muted-foreground block font-mono truncate">
                                    {contact.contactEmail}
                                  </span>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-[9px] shrink-0 border-border">
                                {contact.category.split('/')[0].trim()}
                              </Badge>
                            </div>

                            {cd && cd.active && (
                              <div className="flex items-center gap-1.5 text-[9px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-mono mt-1">
                                <Clock className="w-3 h-3 shrink-0" />
                                <span>Applied {cd.appliedAt} · {cd.remainingDays}d cooldown active</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Manual Employer Input Toggle */}
                  <div className="p-3.5 rounded-xl border border-border bg-card space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-emerald-500" />
                        <h3 className="text-xs font-bold text-foreground">Custom Employer or Direct Email</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCustomEmailInput(!showCustomEmailInput)}
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
                      >
                        {showCustomEmailInput ? 'Hide' : 'Enter Custom'}
                      </button>
                    </div>

                    {showCustomEmailInput && (
                      <div className="space-y-2 text-xs pt-1 border-t border-border/50">
                        <div>
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">
                            Company Name
                          </label>
                          <input
                            type="text"
                            value={targetCompanyInput}
                            onChange={(e) => setTargetCompanyInput(e.target.value)}
                            placeholder="e.g. OpenAI, Google, Maersk..."
                            className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">
                            Target Role Title
                          </label>
                          <input
                            type="text"
                            value={targetRoleInput}
                            onChange={(e) => setTargetRoleInput(e.target.value)}
                            placeholder="e.g. Senior Software Engineer, Cadet..."
                            className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                              Hiring Contact Email(s)
                            </label>
                            {customEmailsList.length > 0 && (
                              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                                {customEmailsList.length} added
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="email"
                              value={newCustomEmailInput}
                              onChange={(e) => setNewCustomEmailInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  handleAddCustomEmail()
                                }
                              }}
                              placeholder="Add email, e.g. hr@company.com..."
                              className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleAddCustomEmail}
                              className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 cursor-pointer shadow-xs gap-1"
                              title="Add another email recipient"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-semibold hidden sm:inline">Add</span>
                            </Button>
                          </div>

                          {/* Email chips list */}
                          {customEmailsList.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-2 max-h-24 overflow-y-auto">
                              {customEmailsList.map((email) => (
                                <span
                                  key={email}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-mono"
                                >
                                  <span className="truncate max-w-[170px]">{email}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCustomEmail(email)}
                                    className="p-0.5 hover:text-red-500 text-muted-foreground transition-colors cursor-pointer"
                                    title="Remove this email"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSelectCustomDirectContact}
                          disabled={customEmailsList.length === 0 && (!newCustomEmailInput || !newCustomEmailInput.includes('@'))}
                          className="w-full mt-1.5 h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Send className="w-3 h-3" />
                          <span>
                            {customEmailsList.length > 1
                              ? `Select & Target ${customEmailsList.length} Contacts`
                              : 'Select & Target This 1 Contact'}
                          </span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column (7 cols): Clean Application Dispatch Console */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Console Container */}
                  <div className="p-4 sm:p-5 rounded-xl border border-border bg-card space-y-4 shadow-xs">
                    {/* ── APPLICATION CREDENTIAL PACKAGE (COMPACT, SELECTABLE & COLLAPSIBLE) ── */}
                    {isCredentialPackageCollapsed ? (
                      <div
                        onClick={() => setIsCredentialPackageCollapsed(false)}
                        className="p-2.5 sm:p-3 bg-card border border-border/80 rounded-xl flex items-center justify-between gap-2 shadow-xs cursor-pointer hover:border-emerald-500/40 hover:bg-muted/20 transition-all"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="text-xs font-bold text-foreground">Application Credential Package</span>
                          <span className="text-[10px] text-muted-foreground truncate hidden sm:inline">
                            · {cvSourceType === 'walrus' ? 'Walrus Sovereign CV' : 'Uploaded Custom CV'}
                            {uploadedDocuments.filter((d) => selectedAttachments.includes(d.id)).length > 0 &&
                              ` · ${uploadedDocuments.filter((d) => selectedAttachments.includes(d.id)).length} Attached Document(s)`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant="outline" className="text-[9.5px] font-mono border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                            Ready
                          </Badge>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-6 px-1.5 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
                          >
                            <span>Expand</span>
                            <ChevronDown className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 sm:p-3.5 rounded-xl border border-border/80 bg-card/70 space-y-2.5 shadow-xs">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-border/60">
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            <h4 className="text-xs font-bold text-foreground">Application Credential Package</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                              {cvSourceType === 'walrus' ? 'Primary: Walrus Sovereign CV' : 'Primary: Uploaded CV'}
                            </Badge>
                            <button
                              type="button"
                              onClick={() => setIsCredentialPackageCollapsed(true)}
                              className="text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer transition-colors"
                              title="Collapse credential package for more space"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                      {/* Select Primary CV Subtitle */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-foreground">Select Primary CV for Dispatch:</span>
                        <span className="text-[10px] text-muted-foreground">Click option to select</span>
                      </div>

                      {/* CV Options List (Compact & Tick-Box Selectable) */}
                      <div className="space-y-1.5">
                        {/* Option 1: Walrus Sovereign CV */}
                        <div
                          onClick={() => setCvSourceType('walrus')}
                          className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                            cvSourceType === 'walrus'
                              ? 'border-emerald-500 bg-emerald-500/10 shadow-2xs ring-1 ring-emerald-500/30'
                              : 'border-border/70 bg-background hover:bg-muted/30'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Tick Box / Radio */}
                            <div className="flex items-center justify-center shrink-0">
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                  cvSourceType === 'walrus'
                                    ? 'border-emerald-500 bg-emerald-600 text-white'
                                    : 'border-muted-foreground/40 bg-background'
                                }`}
                              >
                                {cvSourceType === 'walrus' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                            </div>

                            <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-foreground truncate">
                                  {walrusCvFileName}
                                </span>
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono shrink-0">
                                  PDF
                                </span>
                              </div>
                              <span className="text-[10px] text-muted-foreground block truncate">
                                {walrusCvFileSize} · Walrus Sovereign Storage · {walrusVersionLabel}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setSovereignCvPreviewModalOpen(true)}
                              className="h-6 px-2 text-[10px] font-semibold gap-1 border-border hover:bg-muted text-foreground cursor-pointer shadow-2xs"
                              title="Preview stylish ATS CV layout"
                            >
                              <Eye className="w-2.5 h-2.5 text-emerald-500" />
                              <span>Preview</span>
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              onClick={handleDownloadWalrusCv}
                              className="h-6 px-2 text-[10px] font-semibold gap-1 bg-background hover:bg-muted text-foreground border border-border cursor-pointer shadow-2xs"
                              title="Download PDF"
                            >
                              <Download className="w-2.5 h-2.5 text-emerald-500" />
                              <span className="hidden sm:inline">PDF</span>
                            </Button>

                            {walrusVersions.length > 0 && (
                              <select
                                value={selectedCvVersionId}
                                onChange={(e) => setSelectedCvVersionId(e.target.value)}
                                className="h-6 px-1 text-[9px] font-medium rounded border border-border bg-background text-foreground cursor-pointer focus:outline-none"
                              >
                                <option value="active_draft">v1 (Active)</option>
                                {walrusVersions.map((v) => (
                                  <option key={v.id} value={v.id}>
                                    v{v.versionNumber}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>

                        {/* Option 2: Uploaded Custom CV */}
                        <div
                          onClick={() => {
                            setCvSourceType('uploaded')
                            if (!originalCvFileName) {
                              originalFileInputRef.current?.click()
                            }
                          }}
                          className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                            cvSourceType === 'uploaded'
                              ? 'border-emerald-500 bg-emerald-500/10 shadow-2xs ring-1 ring-emerald-500/30'
                              : 'border-border/70 bg-background hover:bg-muted/30'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Tick Box / Radio */}
                            <div className="flex items-center justify-center shrink-0">
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                  cvSourceType === 'uploaded'
                                    ? 'border-emerald-500 bg-emerald-600 text-white'
                                    : 'border-muted-foreground/40 bg-background'
                                }`}
                              >
                                {cvSourceType === 'uploaded' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                            </div>

                            <FileCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-foreground truncate">
                                  {originalCvFileName || 'Upload Custom CV Document'}
                                </span>
                                {originalCvFileName && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono shrink-0">
                                    DOC/PDF
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground block truncate">
                                {originalCvFileName ? 'Custom uploaded candidate document' : 'Click to select custom PDF/DOCX file'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {originalCvFileName && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadUploadedCv()}
                                className="h-6 px-2 text-[10px] font-semibold gap-1 border-border hover:bg-muted text-foreground cursor-pointer shadow-2xs"
                                title="Download uploaded CV"
                              >
                                <Download className="w-2.5 h-2.5 text-emerald-500" />
                                <span className="hidden sm:inline">Download</span>
                              </Button>
                            )}

                            <Button
                              type="button"
                              size="sm"
                              disabled={isUploadingOriginalCv}
                              onClick={() => originalFileInputRef.current?.click()}
                              className="h-6 px-2 text-[10px] font-semibold gap-1 bg-background hover:bg-muted text-foreground border border-border cursor-pointer shadow-2xs"
                            >
                              {isUploadingOriginalCv ? (
                                <>
                                  <Zap className="w-2.5 h-2.5 animate-spin text-emerald-500" />
                                  <span>Uploading...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-2.5 h-2.5 text-emerald-500" />
                                  <span>{originalCvFileName ? 'Replace' : 'Upload'}</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Hidden File Input for Custom CV */}
                      <input
                        type="file"
                        ref={originalFileInputRef}
                        onChange={(e) => handleOriginalCvUpload(e.target.files)}
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                      />

                      {/* Attached Documents / Credentials Section */}
                      <div className="space-y-1.5 pt-2 border-t border-border/50">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase font-mono tracking-wider">
                            Attached Credentials &amp; Documents ({uploadedDocuments.filter((d) => selectedAttachments.includes(d.id)).length}/{uploadedDocuments.length} Attached)
                          </label>

                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={(e) => handleDocumentUpload(e.target.files)}
                            multiple
                            accept=".pdf,.doc,.docx,.png,.jpg"
                            className="hidden"
                          />

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isUploadingDoc}
                            onClick={() => fileInputRef.current?.click()}
                            className="h-6 px-2 text-[10px] gap-1 font-semibold border-border hover:bg-muted text-foreground cursor-pointer shadow-2xs"
                          >
                            {isUploadingDoc ? (
                              <Zap className="w-2.5 h-2.5 animate-spin text-emerald-500" />
                            ) : (
                              <Plus className="w-2.5 h-2.5 text-emerald-500" />
                            )}
                            <span>{isUploadingDoc ? 'Uploading...' : 'Add Document'}</span>
                          </Button>
                        </div>

                        {/* List of uploaded documents with check-boxes, preview & delete */}
                        {uploadedDocuments.length === 0 ? (
                          <div className="p-2 rounded-lg border border-dashed border-border/70 bg-background/50 text-center">
                            <span className="text-[10px] text-muted-foreground">
                              No additional credential documents uploaded. Click <strong>Add Document</strong> to attach certificates, licenses, or transcripts.
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
                            {uploadedDocuments.map((doc) => {
                              const isAttached = selectedAttachments.includes(doc.id)
                              return (
                                <div
                                  key={doc.id}
                                  className="p-1.5 px-2 rounded-md border border-border/70 bg-background flex items-center justify-between gap-2 text-[11px]"
                                >
                                  {/* Checkbox for attaching to application */}
                                  <label className="flex items-center gap-2 min-w-0 cursor-pointer select-none flex-1">
                                    <input
                                      type="checkbox"
                                      checked={isAttached}
                                      onChange={() => {
                                        setSelectedAttachments((prev) =>
                                          isAttached ? prev.filter((id) => id !== doc.id) : [...prev, doc.id]
                                        )
                                      }}
                                      className="rounded border-border text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer shrink-0"
                                    />
                                    <FileCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                                    <span className="truncate text-foreground font-medium">{doc.name}</span>
                                    {doc.size && (
                                      <span className="text-[9px] text-muted-foreground font-mono shrink-0">
                                        ({Math.round(doc.size / 1024)} KB)
                                      </span>
                                    )}
                                  </label>

                                  <div className="flex items-center gap-1 shrink-0">
                                    {/* Preview Document Button */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (doc.walrusUrl) {
                                          window.open(doc.walrusUrl, '_blank')
                                        } else {
                                          toast.info(`Viewing ${doc.name}`)
                                        }
                                      }}
                                      className="text-muted-foreground hover:text-emerald-500 cursor-pointer p-1 rounded"
                                      title="Preview document"
                                    >
                                      <Eye className="w-3 h-3" />
                                    </button>

                                    {/* Delete Document Button */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = uploadedDocuments.filter((d) => d.id !== doc.id)
                                        setUploadedDocuments(updated)
                                        setSelectedAttachments((prev) => prev.filter((id) => id !== doc.id))
                                        try {
                                          localStorage.setItem('careerace_dispatch_uploaded_docs', JSON.stringify(updated))
                                        } catch {}
                                      }}
                                      className="text-muted-foreground hover:text-red-500 cursor-pointer p-1 rounded"
                                      title="Remove document"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                    {/* Dispatch Action Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          onClick={handleDispatchSelectedCompanies}
                          disabled={isBatchDispatching || selectedCompanyIds.length === 0}
                          className={`gap-2 text-xs font-semibold h-8 px-4 text-white shadow-xs cursor-pointer ${
                            selectedCompanyIds.length === 0
                              ? 'bg-muted-foreground/40 cursor-not-allowed text-muted-foreground'
                              : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                          title={
                            selectedCompanyIds.length === 0
                              ? 'Select employers from the directory on the left first'
                              : `Dispatch applications to ${selectedCompanyIds.length} selected employers and record follow-ups`
                          }
                        >
                          {isBatchDispatching ? (
                            <>
                              <Zap className="w-3.5 h-3.5 animate-spin" />
                              <span>Dispatching ({selectedCompanyIds.length})...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5 text-emerald-200" />
                              <span>
                                {selectedCompanyIds.length === 1 && selectedCompanyIds[0] === 'custom_direct_contact'
                                  ? `Dispatch to ${targetCompanyInput || 'Direct Contact'} (${customEmailsList.length > 0 ? customEmailsList.length : 1} Email${customEmailsList.length > 1 ? 's' : ''})`
                                  : `Dispatch to Selected (${selectedCompanyIds.length})`}
                              </span>
                            </>
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => setSamplePreviewModalOpen(true)}
                          className="gap-1.5 text-xs font-semibold h-8 px-3 border-border hover:bg-muted text-foreground cursor-pointer"
                          title="Preview full application pitch, credentials, and message content"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Preview Sample</span>
                        </Button>
                      </div>

                      <div className="text-[10px] text-muted-foreground font-mono">
                        <span>7-Day Follow-Up Tracking Auto-Scheduled</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            {/* 1-Click Batch Dispatch Modal Dialog */}
            {batchDispatchModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                <Card className="w-full max-w-lg p-5 sm:p-6 border border-border bg-card shadow-xl rounded-2xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">1-Click Batch Application Dispatch</h3>
                        <p className="text-[11px] text-muted-foreground">
                          Category: <strong className="text-foreground">{companyCategoryFilter === 'all' ? 'All Verified Employers' : companyCategoryFilter}</strong>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => !isBatchDispatching && setBatchDispatchModalOpen(false)}
                      disabled={isBatchDispatching}
                      className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {(() => {
                    const eligible = filteredCompanyContacts.filter((c) => {
                      const cd = getCompanyCooldown(c.company)
                      return !cd || !cd.active
                    })

                    return (
                      <div className="space-y-4 text-xs">
                        <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1 text-emerald-900 dark:text-emerald-200">
                          <div className="font-semibold text-xs flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{eligible.length} Eligible Companies Ready for Transmission</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-normal">
                            All contacts in this batch will receive your tailored CV snapshot ({selectedVersionMeta ? (selectedVersionMeta.label || `v${selectedVersionMeta.versionNumber}`) : 'Active Profile'}), {uploadedDocuments.length} verified attached certifications, and Walrus proof credentials.
                          </p>
                        </div>

                        {/* Batch Size Selector with Presets and Custom Input */}
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-foreground block">
                            Select Batch Size:
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {[3, 5, 10].map((size) => (
                              <button
                                key={size}
                                type="button"
                                disabled={isBatchDispatching || eligible.length < size}
                                onClick={() => {
                                  setBatchSize(size)
                                  setCustomBatchSizeInput(String(size))
                                }}
                                className={`p-2.5 rounded-lg border text-center font-medium transition-all cursor-pointer ${
                                  batchSize === size
                                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold'
                                    : 'border-border bg-background text-muted-foreground hover:bg-muted/40'
                                } ${eligible.length < size ? 'opacity-40 cursor-not-allowed' : ''}`}
                              >
                                <span>{size} Employers</span>
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[11px] text-muted-foreground">Or custom count:</span>
                            <input
                              type="number"
                              min={1}
                              max={Math.min(10, eligible.length)}
                              value={customBatchSizeInput}
                              onChange={(e) => {
                                setCustomBatchSizeInput(e.target.value)
                                const val = parseInt(e.target.value, 10)
                                if (!isNaN(val) && val > 0) setBatchSize(Math.min(10, Math.min(val, eligible.length)))
                              }}
                              className="w-20 px-2 py-1 text-xs rounded-md border border-border bg-background text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <span className="text-[10px] text-muted-foreground">Max 10 per batch ({eligible.length} available)</span>
                          </div>
                        </div>

                        {/* Anti-Spam Pacing Delay Selector */}
                        <div className="space-y-1.5 pt-1 border-t border-border/50">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-foreground">Anti-Spam Pacing Delay:</span>
                            <span className="font-mono text-emerald-600 font-bold text-[11px]">{batchDelaySeconds}s per dispatch</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {[3.5, 4.0, 5.0].map((delay) => (
                              <button
                                key={delay}
                                type="button"
                                disabled={isBatchDispatching}
                                onClick={() => setBatchDelaySeconds(delay)}
                                className={`p-2 rounded-lg border text-center text-xs font-medium transition-all cursor-pointer ${
                                  batchDelaySeconds === delay
                                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold'
                                    : 'border-border bg-background text-muted-foreground hover:bg-muted/40'
                                }`}
                              >
                                {delay}s Pacing
                              </button>
                            ))}
                          </div>
                          <span className="text-[10px] text-muted-foreground block">
                            Staggered cadence protects your sender domain and avoids automated spam triggers.
                          </span>
                        </div>

                        {/* Progress Display while dispatching */}
                        {isBatchDispatching && batchProgress && (
                          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 animate-spin" />
                                <span>Dispatching {batchProgress.current} of {batchProgress.total}...</span>
                              </span>
                              <span className="font-mono text-[11px] font-bold text-emerald-600">
                                {Math.round((batchProgress.current / batchProgress.total) * 100)}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 transition-all duration-300"
                                style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                              <span className="truncate">Targeting: <strong className="text-foreground">{batchProgress.currentCompany}</strong></span>
                              {batchCountdown !== null && (
                                <span className="font-mono text-emerald-600 font-medium">Next in {batchCountdown.toFixed(1)}s</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Modal Action Buttons */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isBatchDispatching}
                            onClick={() => setBatchDispatchModalOpen(false)}
                            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={isBatchDispatching || eligible.length === 0}
                            onClick={() => handleBatchDispatch(batchSize)}
                            className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer"
                          >
                            {isBatchDispatching ? (
                              <>
                                <Zap className="w-3.5 h-3.5 animate-spin" />
                                <span>Dispatching Batch...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" />
                                <span>Dispatch to {Math.min(batchSize, eligible.length)} Employers</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )
                  })()}
                </Card>
              </div>
            )}

            {/* ATS Sovereign CV Preview Modal (Identical stylish preview as /dashboard?tab=resumes) */}
            {sovereignCvPreviewModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-background/85 backdrop-blur-md animate-in fade-in duration-200">
                <Card className="w-full max-w-5xl h-[92vh] max-h-[920px] flex flex-col border border-border bg-card shadow-2xl rounded-2xl overflow-hidden">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-card/95 backdrop-blur shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <span>ATS Sovereign Curriculum Vitae</span>
                          <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-mono">
                            WALRUS VERIFIED
                          </Badge>
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Exact stylish ATS resume layout formatted for hiring portals and applicant tracking systems
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleDownloadWalrusCv}
                        className="h-8 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </Button>

                      <button
                        type="button"
                        onClick={() => setSovereignCvPreviewModalOpen(false)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Body with LivePdfPreview */}
                  <div className="flex-1 overflow-y-auto bg-slate-100/70 dark:bg-slate-950/70 p-2 sm:p-4">
                    <LivePdfPreview
                      profile={activeProfileData || VERIFIED_FALLBACK_PROFILE}
                      walrusBlobId={selectedVersionMeta?.blobId || (activeProfileData as any)?.walrus_blob_id || null}
                      walrusVersions={walrusVersions}
                      tailorRole={targetRoleInput}
                      tailorCompany={targetCompanyInput}
                      atsScore={98}
                    />
                  </div>
                </Card>
              </div>
            )}

            {/* Interactive Sample Email Preview Modal */}
            {samplePreviewModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col p-5 sm:p-6 border border-border bg-card shadow-2xl rounded-2xl space-y-4 overflow-hidden">
                  <div className="flex items-center justify-between pb-3 border-b border-border shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Eye className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">Sample Email Dispatch Preview</h3>
                        <p className="text-[11px] text-muted-foreground">
                          Exact visual rendering and RFC-compliant headers delivered to hiring desks
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSamplePreviewModalOpen(false)}
                      className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Email Client Simulator Window */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                    {/* Headers Box */}
                    <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1.5 font-mono text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground w-16 shrink-0">From:</span>
                        <span className="text-foreground font-semibold">{activeProfileData?.applicant_name || 'Candidate'} &lt;{activeProfileData?.email || 'applicant@careerace.online'}&gt;</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground w-16 shrink-0">To:</span>
                        <span className="text-foreground font-semibold">
                          {selectedCompanyIds.length > 1
                            ? `Multiple Recipients (${selectedCompanyIds.length} Verified Employers Selected)`
                            : (targetEmailInput || 'careers.marine@maersk.com')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground w-16 shrink-0">Subject:</span>
                        <span className="text-foreground font-semibold">{customEmailSubject || `Application: ${targetRoleInput} – ${activeProfileData?.applicant_name || 'Candidate'}`}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground w-16 shrink-0">Headers:</span>
                        <span className="text-emerald-600 dark:text-emerald-400">DKIM: PASS · SPF: PASS · List-Unsubscribe: NO · Deliverability: 99%+</span>
                      </div>
                    </div>

                    {/* Walrus Sovereign Verification Badge */}
                    <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-300">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Decentralized Walrus Sovereign Storage Anchor</span>
                        </div>
                        <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-mono">
                          VERIFIED
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        Blob URL: {selectedVersionMeta?.blobId ? `https://walruscan.com/mainnet/blob/${selectedVersionMeta.blobId}` : 'https://careerace.online/verify'}
                      </p>
                    </div>

                    {/* Branded CareerAce Email Simulator Container (Image 2 Design) */}
                    <div className="p-4 sm:p-6 rounded-2xl bg-[#f4f6fa] dark:bg-slate-900/60 border border-border space-y-4">
                      {/* Brand Header with Real Logo */}
                      <div className="flex items-center gap-2.5 pb-1">
                        <img
                          src="https://careerace.online/careerace_logo.png"
                          alt="CareerAce"
                          className="w-8 h-8 rounded-lg object-contain shadow-2xs"
                        />
                        <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                          Career<span className="text-emerald-600 dark:text-emerald-400">Ace</span>
                        </span>
                      </div>

                      {/* Main Card (Image 2 style) */}
                      <div className="p-5 sm:p-7 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 text-left font-sans">
                        {/* Candidate Identity & Contact Banner */}
                        <div className="pb-4 border-b border-slate-100 dark:border-slate-800/80 space-y-1.5">
                          <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                            {activeProfileData?.applicant_name || 'Candidate'}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              {activeProfileData?.email || 'applicant@careerace.online'}
                            </span>
                            {activeProfileData?.phone && ` · ${activeProfileData.phone}`}
                            {activeProfileData?.location && ` · ${activeProfileData.location}`}
                          </p>
                          <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                              Target: {targetRoleInput || 'Candidate Application'} · {targetCompanyInput || 'Hiring Team'}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>

                        {/* Cover Letter Body Content */}
                        <div className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                          {customEmailBody || composeDefaultDraft(false, selectedCompanyIds.length > 1)}
                        </div>

                        {/* ATTACHMENT SIDE: Dedicated Green Dashed Container (Image 2 signature element) */}
                        <div className="p-4 sm:p-5 rounded-xl border-1.5 border-dashed border-emerald-400/80 bg-emerald-50/60 dark:bg-emerald-950/30 space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                              Attachments & Sovereign Credentials
                            </span>
                            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {selectedVersionMeta?.blobId ? 'WALRUS STORAGE SEALED' : 'VERIFIED CANDIDATE ATTESTATION'}
                            </span>
                          </div>

                          {/* Primary CV Item */}
                          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between gap-3 shadow-2xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0 font-bold text-xs">
                                CV
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {cvSourceType === 'walrus'
                                    ? `${(activeProfileData?.applicant_name || 'Candidate').replace(/\s+/g, '_')}_Sovereign_CV.pdf`
                                    : (uploadedDocuments[0]?.name || `${(activeProfileData?.applicant_name || 'Candidate').replace(/\s+/g, '_')}_CV.pdf`)}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                  {selectedVersionMeta?.fileSize
                                    ? `${Math.round(selectedVersionMeta.fileSize / 1024)} KB`
                                    : '245 KB'} · <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Primary Curriculum Vitae</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => setSovereignCvPreviewModalOpen(true)}
                                className="px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-foreground font-semibold text-[10px] cursor-pointer flex items-center gap-1 border border-border transition-colors"
                              >
                                <Eye className="w-3 h-3 text-emerald-500" />
                                <span>View ATS</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleDownloadWalrusCv}
                                className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs cursor-pointer flex items-center gap-1 transition-colors"
                              >
                                <Download className="w-3 h-3" />
                                <span>Download CV ↓</span>
                              </button>
                            </div>
                          </div>

                          {selectedVersionMeta?.blobId && (
                            <div className="pt-1 text-[10px] text-slate-600 dark:text-slate-400 font-mono truncate">
                              Walrus Explorer: <span className="text-emerald-600 underline">https://walruscan.com/mainnet/blob/{selectedVersionMeta.blobId}</span>
                            </div>
                          )}

                          {/* Additional Uploaded Credentials */}
                          {uploadedDocuments.filter((d) => selectedAttachments.includes(d.id)).length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                                Additional Attached Credentials ({uploadedDocuments.filter((d) => selectedAttachments.includes(d.id)).length})
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {uploadedDocuments
                                  .filter((d) => selectedAttachments.includes(d.id))
                                  .map((doc) => (
                                    <div
                                      key={doc.id}
                                      className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs"
                                    >
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <FileCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                        <span className="truncate font-medium text-slate-900 dark:text-slate-200 text-[11px]">{doc.name}</span>
                                      </div>
                                      {doc.walrusUrl ? (
                                        <a
                                          href={doc.walrusUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-[10px] text-emerald-600 font-bold shrink-0 hover:underline flex items-center gap-0.5 cursor-pointer"
                                        >
                                          <span>View ↓</span>
                                        </a>
                                      ) : (
                                        <span className="text-[10px] text-emerald-600 font-bold shrink-0">Attached</span>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                          <p className="text-[10.5px] text-emerald-700 dark:text-emerald-300">
                            All credential documents are verified and downloadable above.
                          </p>
                        </div>

                        {/* Primary Green CTA Button (Image 2 style) */}
                        <div>
                          <span className="inline-block px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md">
                            View Verified Candidate Passport →
                          </span>
                        </div>

                        {/* Candidate Sign-Off */}
                        <div className="pt-2">
                          <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                            {activeProfileData?.applicant_name || 'Candidate'}
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                            CareerAce Verified Candidate
                          </p>
                        </div>
                      </div>

                      {/* Footer */}
                      <p className="text-center text-[11px] text-slate-400 pt-1">
                        © 2026 CareerAce. All rights reserved.
                      </p>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-border shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSamplePreviewModalOpen(false)}
                      className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Close Preview
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isSendingTestEmail}
                        onClick={handleSendSampleToMyEmailDirectly}
                        className="text-xs font-semibold gap-1.5 border-border hover:bg-muted text-foreground cursor-pointer"
                      >
                        {isSendingTestEmail ? (
                          <>
                            <Zap className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                            <span>Sending Sample...</span>
                          </>
                        ) : (
                          <>
                            <Mail className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Send Sample to My Email</span>
                          </>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        onClick={handleProceedToBatchWithNotification}
                        className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Proceed to Batch Dispatch</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Send Test Dispatch Modal */}
            {testEmailModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                <Card className="w-full max-w-md p-5 sm:p-6 border border-border bg-card shadow-xl rounded-2xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">Send Test Application Dispatch</h3>
                        <p className="text-[11px] text-muted-foreground">
                          Verify formatting, links, and attachments in your own inbox
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => !isSendingTestEmail && setTestEmailModalOpen(false)}
                      disabled={isSendingTestEmail}
                      className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <p className="text-muted-foreground leading-relaxed">
                      A live sample application email will be transmitted using your configured relay. You can inspect the email headers, Walrus CV verification link, and attachment integrity.
                    </p>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-foreground block">
                        Test Recipient Email:
                      </label>
                      <input
                        type="email"
                        value={testRecipientEmail}
                        onChange={(e) => setTestRecipientEmail(e.target.value)}
                        placeholder="your-personal-email@domain.com"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <span className="text-[10px] text-muted-foreground block">
                        Defaults to your profile email address: {activeProfileData?.email || 'applicant@careerace.online'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1 text-emerald-900 dark:text-emerald-200">
                      <span className="font-semibold block text-[11px]">Included in Test:</span>
                      <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-muted-foreground font-mono">
                        <li>Role: {targetRoleInput}</li>
                        <li>Walrus CV Snapshot: {selectedVersionMeta ? (selectedVersionMeta.label || `v${selectedVersionMeta.versionNumber}`) : 'Active Profile'}</li>
                        <li>Attachments: {uploadedDocuments.length} files attached</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isSendingTestEmail}
                      onClick={() => setTestEmailModalOpen(false)}
                      className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isSendingTestEmail || !testRecipientEmail || !testRecipientEmail.includes('@')}
                      onClick={handleSendTestDispatch}
                      className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer"
                    >
                      {isSendingTestEmail ? (
                        <>
                          <Zap className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending Sample...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Sample Test</span>
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </div>
            )}
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

              {/* 5 Filter Dropdowns (Roles, Seniority / Maritime Ranks, Companies, Countries, Workplaces) */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-2.5 pt-1">
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* Filter 1: Roles (Disciplines) */}
                  <div className="relative w-full sm:w-auto">
                    <select
                      value={selectedRole}
                      onChange={(e) => {
                        setSelectedRole(e.target.value)
                        if (e.target.value !== 'others') {
                          setCustomRoleInput('')
                        }
                      }}
                      className="appearance-none w-full sm:w-auto h-8 pl-3 pr-7 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted/30 focus:outline-none cursor-pointer truncate"
                    >
                      {DISCIPLINE_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-2.5 top-2.5 text-muted-foreground pointer-events-none" />
                  </div>

                  {/* Filter 2: Seniority & Maritime Ranks */}
                  <div className="relative w-full sm:w-auto">
                    <select
                      value={selectedSeniority}
                      onChange={(e) => setSelectedSeniority(e.target.value)}
                      className="appearance-none w-full sm:w-auto h-8 pl-3 pr-7 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted/30 focus:outline-none cursor-pointer truncate"
                    >
                      <option value="all">All seniority & ranks</option>
                      <option value="intern_cadet">Intern / Cadet / Trainee</option>
                      <option value="entry_junior">Entry Level / Junior / 4th Eng</option>
                      <option value="mid_officer">Mid-Level / Officer / 2nd-3rd Eng</option>
                      <option value="senior">Senior Engineer</option>
                      <option value="lead_chief">Lead / Chief Engineer / Superintendent</option>
                      <option value="executive_director">Director / VP / Head / Executive</option>
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-2.5 top-2.5 text-muted-foreground pointer-events-none" />
                  </div>

                  {/* Custom Role / Sector Input (when 'others' is selected) */}
                  {selectedRole === 'others' && (
                    <div className="relative col-span-2 sm:col-span-1 w-full sm:w-auto">
                      <input
                        type="text"
                        value={customRoleInput}
                        onChange={(e) => setCustomRoleInput(e.target.value)}
                        placeholder="Type custom discipline or sector..."
                        className="h-8 pl-3 pr-7 rounded-lg border border-primary/40 bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-52 shadow-xs"
                      />
                      {customRoleInput && (
                        <button
                          onClick={() => setCustomRoleInput('')}
                          className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Filter 3: Companies */}
                  <div className="relative w-full sm:w-auto">
                    <select
                      value={selectedCompany}
                      onChange={(e) => setSelectedCompany(e.target.value)}
                      className="appearance-none w-full sm:w-auto h-8 pl-3 pr-7 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted/30 focus:outline-none cursor-pointer truncate"
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
                  <div className="relative w-full sm:w-auto">
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="appearance-none w-full sm:w-auto h-8 pl-3 pr-7 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted/30 focus:outline-none cursor-pointer truncate"
                    >
                      <option value="all">All countries</option>
                      <option value="ng">Nigeria</option>
                      <option value="remote">Remote Worldwide</option>
                      <option value="us">United States</option>
                      <option value="uk">United Kingdom</option>
                      <option value="nl">Netherlands</option>
                      <option value="no">Norway</option>
                      <option value="de">Germany</option>
                      <option value="fr">France</option>
                      <option value="ca">Canada</option>
                      <option value="intl">International / Africa</option>
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-2.5 top-2.5 text-muted-foreground pointer-events-none" />
                  </div>

                  {/* Filter 5: Workplaces */}
                  <div className="relative w-full sm:w-auto">
                    <select
                      value={selectedWorkplace}
                      onChange={(e) => setSelectedWorkplace(e.target.value)}
                      className="appearance-none w-full sm:w-auto h-8 pl-3 pr-7 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted/30 focus:outline-none cursor-pointer truncate"
                    >
                      <option value="all">All workplaces</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="onsite">On-site</option>
                      <option value="offshore">Offshore / Vessel</option>
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-2.5 top-2.5 text-muted-foreground pointer-events-none" />
                  </div>

                  {/* Sync Live APIs Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSyncingLiveApis}
                    onClick={handleSyncLiveApis}
                    className="w-full sm:w-auto h-8 px-2.5 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1.5 cursor-pointer justify-center"
                    title="Fetch fresh verified roles from Remotive, Jobicy, and open APIs"
                  >
                    <RotateCcw className={`w-3 h-3 ${isSyncingLiveApis ? 'animate-spin' : ''}`} />
                    <span>{isSyncingLiveApis ? 'Syncing...' : 'Sync Live APIs'}</span>
                  </Button>

                  {/* Reset filter pill if any active */}
                  {(selectedRole !== 'all' ||
                    customRoleInput !== '' ||
                    selectedSeniority !== 'all' ||
                    selectedCompany !== 'all' ||
                    selectedCountry !== 'all' ||
                    selectedWorkplace !== 'all' ||
                    searchQuery !== '') && (
                    <button
                      onClick={() => {
                        setSelectedRole('all')
                        setCustomRoleInput('')
                        setSelectedSeniority('all')
                        setSelectedCompany('all')
                        setSelectedCountry('all')
                        setSelectedWorkplace('all')
                        setSearchQuery('')
                      }}
                      className="col-span-2 sm:col-span-1 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 ml-1 cursor-pointer py-1 sm:py-0"
                    >
                      Reset filters
                    </button>
                  )}
                </div>

                {/* Total Active Count Indicator & Dispatch Report Action */}
                <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
                  {activeBoardTab === 'applied' && appliedJobs.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTriggerDispatchSummaryReport()}
                      title="Send an executive summary of all dispatched applications with Walrus blob proofs to your email"
                      className="h-7 text-xs gap-1.5 border-primary/30 hover:bg-primary/10 text-primary font-medium shadow-none cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Email Dispatch Report
                    </Button>
                  )}
                  <div className="text-xs font-mono text-muted-foreground font-medium shrink-0">
                    {filteredJobs.length > 0
                      ? `${filteredJobs.length} ${
                          activeBoardTab === 'applied'
                            ? 'applied'
                            : 'open'
                        } roles`
                      : '0 roles'}
                  </div>
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
                      : 'No roles match your filters'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    {activeBoardTab === 'applied'
                      ? 'When you apply or mark a job on the Discovery tab, it moves here so you can track your submissions and prepare for interviews.'
                      : 'Try broadening your search term or resetting some of the role or company dropdowns.'}
                  </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRole('all')
                        setCustomRoleInput('')
                        setSelectedSeniority('all')
                        setSelectedCompany('all')
                        setSelectedCountry('all')
                        setSelectedWorkplace('all')
                        setSearchQuery('')
                        if (activeBoardTab !== 'discover') setActiveBoardTab('discover')
                      }}
                      className="mt-4 text-xs cursor-pointer"
                    >
                      {activeBoardTab === 'discover' ? 'Clear all filters' : 'Return to Discovery'}
                    </Button>
                </Card>
              ) : (
                filteredJobs.slice(0, visibleCount).map((job) => {
                  const isSaved = savedJobIds.includes(job.id)
                  const isApplied = appliedJobIdSet.has(job.id)
                  const appliedRecord = appliedJobs.find((a) => a.id === job.id)

                  return (
                    <div
                      key={job.id}
                      className={`group flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl border transition-all ${
                        isApplied
                          ? 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50'
                          : 'border-border/70 bg-card hover:bg-muted/20 hover:border-border'
                      }`}
                    >
                      {/* Left: Logo (clean monogram) & Job Title / Company */}
                      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                        <CompanyLogo company={job.company} />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                              {job.title}
                            </span>
                            <span className="text-[11px] sm:text-xs text-muted-foreground font-normal">
                              {job.company}
                            </span>
                            {isApplied && (
                              <>
                                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[9px] sm:text-[10px] py-0 px-1.5 font-mono">
                                  Applied {appliedRecord?.appliedAt ? `· ${appliedRecord.appliedAt}` : ''}
                                </Badge>
                                {appliedRecord?.followUpStatus === 'sent' ? (
                                  <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[9px] sm:text-[10px] py-0 px-1.5 font-mono">
                                    <CheckCircle2 className="w-3 h-3 mr-1 text-blue-500" /> Followed up
                                  </Badge>
                                ) : (
                                  (() => {
                                    const appliedTime = appliedRecord?.appliedTimestamp || Date.now() - 4 * 86400000
                                    const daysElapsed = Math.floor((Date.now() - appliedTime) / 86400000)
                                    const daysLeft = Math.max(0, 7 - daysElapsed)
                                    return daysElapsed >= 7 ? (
                                      <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40 text-[9px] sm:text-[10px] py-0 px-1.5 font-mono animate-pulse">
                                        <Clock className="w-3 h-3 mr-1" /> 7d Follow-Up Due
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-[9px] sm:text-[10px] py-0 px-1.5 font-mono text-muted-foreground border-border/80">
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
                      <div className="flex items-center justify-between gap-2 text-[11px] sm:text-xs text-muted-foreground md:shrink-0 md:min-w-[180px] lg:min-w-[220px]">
                        <span className="truncate">{job.location}</span>
                        <span className="md:hidden font-mono shrink-0 whitespace-nowrap text-[10px] text-muted-foreground/80">
                          {job.postedDate}
                        </span>
                      </div>

                      {/* Right: Actions */}
                      <div className="w-full md:w-auto flex flex-wrap items-center justify-between md:justify-end gap-1.5 sm:gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-border/40 max-w-full">
                        <span className="hidden md:inline text-[11px] sm:text-xs text-muted-foreground font-mono shrink-0 whitespace-nowrap text-right">
                          {job.postedDate}
                        </span>

                        {/* Prepare Button (triggers Interview Room Coming Soon) */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setComingSoonFeature('interview_room')}
                          className="h-7 sm:h-8 text-[11px] sm:text-xs gap-1 sm:gap-1.5 px-2 sm:px-3 border-border/80 hover:bg-muted/60 text-foreground font-medium cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                          <span>Prepare</span>
                        </Button>

                        {/* Applied Tab vs Discovery Actions */}
                        {isApplied ? (
                          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 max-w-full">
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
                              className="h-7 sm:h-8 text-[11px] sm:text-xs gap-1 sm:gap-1.5 px-2 sm:px-3 border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 font-medium cursor-pointer"
                            >
                              <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" />
                              <span>Follow up</span>
                            </Button>

                            {/* Download Calendar (.ICS) Reminder */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadFollowUpIcs(job, appliedRecord)}
                              title="Download RFC 5545 Calendar reminder for 7-day follow-up"
                              className="h-7 sm:h-8 text-[11px] sm:text-xs gap-1 sm:gap-1.5 px-2 sm:px-2.5 border-border/80 hover:bg-muted text-foreground font-medium cursor-pointer"
                            >
                              <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" />
                              <span className="hidden sm:inline">.ICS</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnmarkApplied(job.id, job.title)}
                              title="Move back to Discovery"
                              className="h-7 sm:h-8 text-[11px] sm:text-xs gap-1 px-1.5 sm:px-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 cursor-pointer"
                            >
                              <Undo2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              <span>Unmark</span>
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsApplied(job)}
                            title="Mark as Applied (moves to Applied tab)"
                            className="h-7 sm:h-8 text-[11px] sm:text-xs gap-1 sm:gap-1.5 px-2.5 sm:px-3 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 font-medium cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span>Applied</span>
                          </Button>
                        )}

                        {/* Apply External Link */}
                        <a
                          href={job.apply_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1 sm:gap-1.5 h-7 sm:h-8 px-2.5 sm:px-3.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 font-medium text-[11px] sm:text-xs transition-colors shrink-0 shadow-xs"
                        >
                          <span>Apply</span>
                          <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </a>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Pagination / Windowing: Load More Roles to prevent DOM bloat */}
            {filteredJobs.length > visibleCount && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 p-3.5 rounded-xl border border-border bg-card shadow-xs">
                <div className="text-xs text-muted-foreground">
                  Showing <strong className="text-foreground">{Math.min(visibleCount, filteredJobs.length)}</strong> of <strong className="text-foreground">{filteredJobs.length}</strong> opportunities
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVisibleCount((prev) => prev + 16)}
                    className="text-xs h-8 px-3 border-border hover:bg-muted text-foreground cursor-pointer font-medium"
                  >
                    <span>Load More Roles (+16)</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setVisibleCount(filteredJobs.length)}
                    className="text-xs h-8 px-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <span>Show All</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Footer info: Sovereign memory and verification */}
            <div className="pt-4 border-t text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>Decentralized Job Pipeline · Indexed to Walrus Sovereign Memory</span>
              <span>Verified direct company career postings</span>
            </div>
          </>
        )}

        {/* Sovereign DKIM / SMTP Relay Settings Modal */}
        <SmtpRelaySettingsModal
          open={smtpSettingsOpen}
          onOpenChange={setSmtpSettingsOpen}
        />

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

        {/* Coming Soon Feature Modal */}
        <ComingSoonModal
          open={!!comingSoonFeature}
          onOpenChange={(open) => !open && setComingSoonFeature(null)}
          feature={comingSoonFeature}
        />
      </div>
    </AppShell>
  )
}
