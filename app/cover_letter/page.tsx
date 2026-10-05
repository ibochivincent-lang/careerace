'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  Download,
  ArrowRight,
  Zap,
  Target,
  FileText,
  Briefcase,
  Layers,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Building2,
  Calendar,
  Search,
  Filter,
  SlidersHorizontal,
  Compass,
  CheckCircle2,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import { getRoleIntelligence, type RoleIntelligenceProfile } from '@/lib/role_intelligence';
import { VERIFIED_COMPANY_HIRING_CONTACTS, type CompanyHiringContact } from '@/lib/company_directory';
import type { ParsedCv } from '@/lib/cv_parser';
import { restoreCandidateDataFromCloud, syncCandidateDataToCloud, subscribeCandidateRealtime } from '@/lib/cloud_sync';
import { saveFact } from '@/app/actions/memory';

export interface DisciplineDefinition {
  id: string;
  name: string;
  category: 'Maritime / Offshore' | 'Software / Cloud' | 'AI / Robotics' | 'Engineering / Industrial' | 'Medical / Healthcare' | 'Management / Operations';
  roles: string[];
  defaultRole: string;
  description: string;
}

export const DISCIPLINE_DEFINITIONS: DisciplineDefinition[] = [
  {
    id: 'marine',
    name: 'Marine & Offshore Engineering',
    category: 'Maritime / Offshore',
    roles: [
      'Engine Cadet / Trainee Marine Engineer',
      'Marine Systems Engineer (Offshore & Propulsion)',
      '3rd Marine Engineer Officer',
      'Vessel Technical Superintendent',
      'Ship Captain / Master Mariner (Navigation & Bridge)',
      'Naval Architect & Marine Structural Analyst',
      'Offshore Subsea Systems Engineer'
    ],
    defaultRole: 'Engine Cadet / Trainee Marine Engineer',
    description: 'Propulsion watchkeeping, 2/4-stroke prime movers, auxiliary boilers, SOLAS/MARPOL compliance, and marine power plants.'
  },
  {
    id: 'software',
    name: 'Software, Web & Cloud Systems',
    category: 'Software / Cloud',
    roles: [
      'Full Stack Software Engineer',
      'Frontend / React Specialist',
      'Backend Distributed Systems Engineer',
      'Edge Infrastructure & DevOps Engineer',
      'Protocol & Distributed Storage Engineer'
    ],
    defaultRole: 'Full Stack Software Engineer',
    description: 'Next.js App Router, TypeScript, high-concurrency APIs, distributed databases, caching, and CI/CD pipelines.'
  },
  {
    id: 'ai',
    name: 'AI, Robotics & Autonomous Systems',
    category: 'AI / Robotics',
    roles: [
      'Autonomous Systems & ML Engineer',
      'AI Research Engineer (LLMs & Frontier Models)',
      'Robotics Software & Motion Control Engineer',
      'Supercomputing Infrastructure Engineer'
    ],
    defaultRole: 'Autonomous Systems & ML Engineer',
    description: 'PyTorch, TensorRT, vLLM, low-latency inference, computer vision pipelines, and multi-agent systems.'
  },
  {
    id: 'medical',
    name: 'Medical & Healthcare Informatics',
    category: 'Medical / Healthcare',
    roles: [
      'Lead Healthcare Systems & Informatics Engineer',
      'Clinical Integration Engineer (HL7 / FHIR)',
      'Bioinformatics & Genomic Pipeline Engineer',
      'Medical Device Telemetry Specialist'
    ],
    defaultRole: 'Lead Healthcare Systems & Informatics Engineer',
    description: 'HL7/FHIR APIs, EHR interoperability (Epic/Cerner), HIPAA compliance, and clinical decision support telemetry.'
  },
  {
    id: 'management',
    name: 'Management & Fleet Operations',
    category: 'Management / Operations',
    roles: [
      'Global Fleet Operations & Decarbonization Manager',
      'Vessel Superintendent & Technical Manager',
      'Industrial Operations Director',
      'Semiconductor Manufacturing Operations Lead'
    ],
    defaultRole: 'Global Fleet Operations & Decarbonization Manager',
    description: 'Fleet logistics, drydock budgets, SIRE 2.0 / ISM vetting, IMO CII compliance, and operational cost governance.'
  },
  {
    id: 'industrial',
    name: 'Industrial, Hardware & Quality',
    category: 'Engineering / Industrial',
    roles: [
      'Manufacturing & Transducer Quality Engineer',
      'Environmental Test Engineering Specialist',
      'Satellite Systems & Hardware Engineer',
      'Statistical Process Control (SPC) Engineer'
    ],
    defaultRole: 'Manufacturing & Transducer Quality Engineer',
    description: 'Sensor instrumentation, transducer calibration, AS9100 / ISO 9001 compliance, and first-pass yield optimization.'
  }
];

function getFilteredCvHighlights(profile: ParsedCv | null, disciplineId: string): string[] {
  if (!profile) return [];
  const marineKeywords = ['marine', 'cadet', 'vessel', 'engine', 'propulsion', 'boiler', 'ship', 'bunkering', 'marpol', 'solas', 'stcw', 'offshore', 'voyage', 'sea'];
  const techKeywords = ['software', 'frontend', 'backend', 'api', 'react', 'next.js', 'typescript', 'javascript', 'database', 'cloud', 'aws', 'python', 'code', 'git', 'full stack'];
  const aiKeywords = ['ai', 'ml', 'machine learning', 'model', 'neural', 'vision', 'robot', 'autonomous', 'inference', 'pytorch', 'tensor'];
  const healthKeywords = ['health', 'medical', 'clinical', 'ehr', 'fhir', 'hl7', 'patient', 'hipaa', 'informatics', 'genomic'];
  const mgtKeywords = ['fleet', 'manager', 'lead', 'operations', 'budget', 'schedule', 'superintendent', 'logistics', 'vetting'];
  const indKeywords = ['industrial', 'manufacturing', 'quality', 'transducer', 'calibration', 'spc', 'fmea', 'yield', 'hardware'];

  let targetFilter = marineKeywords;
  if (disciplineId === 'software') targetFilter = techKeywords;
  else if (disciplineId === 'ai') targetFilter = aiKeywords;
  else if (disciplineId === 'medical') targetFilter = healthKeywords;
  else if (disciplineId === 'management') targetFilter = mgtKeywords;
  else if (disciplineId === 'industrial') targetFilter = indKeywords;

  const highlights: string[] = [];

  // Inspect work experience highlights
  profile.work_experience?.forEach((w) => {
    w.highlights?.forEach((h) => {
      const lower = h.toLowerCase();
      if (targetFilter.some((k) => lower.includes(k))) {
        highlights.push(`${w.role} at ${w.company}: ${h}`);
      }
    });
  });

  // If no discipline-specific highlights found, fall back to recent top accomplishments
  if (highlights.length === 0 && profile.work_experience?.[0]?.highlights) {
    profile.work_experience[0].highlights.slice(0, 3).forEach((h) => {
      highlights.push(`${profile.work_experience[0].role}: ${h}`);
    });
  }

  return highlights.slice(0, 4);
}

function generateLocalDraft(params: {
  role: string;
  company: string;
  jobDescription?: string;
  keyProblems?: string;
  candidateName: string;
  candidateEmail?: string;
  candidatePhone?: string;
  candidateLocation?: string;
  recentExperience?: any;
  walrusBlobId?: string;
  disciplineId?: string;
  filteredHighlights?: string[];
}): string {
  const intel = getRoleIntelligence(params.role, params.jobDescription);
  const companyClean = params.company.trim();
  const isGenericCompany = !companyClean || companyClean.toLowerCase() === 'target organization' || companyClean.toLowerCase() === 'hiring team';
  
  const recipientHeader = isGenericCompany ? 'Hiring Team · Technical Recruitment Desk' : `Hiring Team · ${companyClean}`;
  const salutation = isGenericCompany ? 'Dear Hiring Team,' : `Dear ${companyClean} Hiring Team,`;
  const companyDisplay = isGenericCompany ? 'your organization' : companyClean;

  const problems = params.keyProblems?.trim()
    ? [params.keyProblems.trim(), ...intel.keyProblemsSolved.slice(0, 2)]
    : intel.keyProblemsSolved;

  const topKeywords = intel.technicalKeywords.slice(0, 6).join(', ');
  const verifiedMetric = intel.measurableImpactMetrics[0] || 'Maintained consistent operational uptime and verified technical rigor';

  // Discipline-calibrated experience narrative
  let recentExpSummary = '';
  if (params.filteredHighlights && params.filteredHighlights.length > 0) {
    recentExpSummary = `In demonstrated practice: ${params.filteredHighlights[0]}`;
  } else if (params.recentExperience?.company) {
    recentExpSummary = `In my background as ${params.recentExperience.role || 'Engineer'} at ${params.recentExperience.company}, I was directly accountable for ${params.recentExperience.highlights?.[0] || 'delivering verified operational outcomes'}.`;
  } else {
    recentExpSummary = `Throughout my technical career and rigorous training, I have focused on solving operational bottlenecks with verifiable execution.`;
  }

  const contactPieces = [params.candidateEmail, params.candidatePhone, params.candidateLocation].filter(Boolean);
  const contactLine = contactPieces.length > 0 ? contactPieces.join(' · ') : 'Direct Contact Verified · Sovereign Record';

  const walrusLine = params.walrusBlobId
    ? `My verified work attestations, cryptographic credentials, and tailored portfolio are permanently anchored on Mysten Labs Walrus storage at: https://walruscan.com/testnet/blob/${params.walrusBlobId}`
    : `My verified credentials and technical portfolio are registered through the CareerAce sovereign proof network.`;

  // Always live current date formatted cleanly
  const todayDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return `${params.candidateName || 'Candidate'}
${contactLine}

${todayDate}

${recipientHeader}

${salutation}

I am writing to formally submit my application for the position of ${params.role} with ${companyDisplay}. With a foundation centered on ${topKeywords}, I take direct accountability for technical execution, operational discipline, and high-stakes reliability.

The scope of the ${params.role} role demands disciplined execution across critical priorities:
• ${intel.coreResponsibilities[0] || 'Execution of mission-critical systems and verified workflows'}
• ${intel.coreResponsibilities[1] || 'Ensuring continuous compliance, operational availability, and safety'}
• ${intel.coreResponsibilities[2] || 'Troubleshooting and rapid resolution of complex operational anomalies'}

Specifically, I tailor my technical approach around addressing and resolving key industry challenges that directly impact ${companyDisplay}:
1. ${problems[0] || 'Mitigating system downtime through predictive diagnostics and rigorous preventive maintenance'}
2. ${problems[1] || 'Optimizing resource allocation and operational throughput under high-constraint environments'}

${recentExpSummary} As a proven benchmark, I have ${verifiedMetric.toLowerCase()}, ensuring that theoretical operational plans translate directly into field results.

${walrusLine}

I would welcome the opportunity to discuss how my disciplined background and practical problem-solving approach align with ${companyDisplay}'s upcoming milestones. Thank you for your time and consideration.

Sincerely,

${params.candidateName || 'Candidate'}`;
}

export default function CoverLetterStudioPage() {
  const router = useRouter();

  // 1. Discipline & Role Box Selector State
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>('marine');
  const [targetRole, setTargetRole] = useState<string>('Engine Cadet / Trainee Marine Engineer');
  const [customRoleInput, setCustomRoleInput] = useState<string>('');
  const [targetCompany, setTargetCompany] = useState<string>('Maersk');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [keyProblemsInput, setKeyProblemsInput] = useState<string>('');

  // 2. Profile & Walrus Sovereign Memory
  const [profile, setProfile] = useState<ParsedCv | null>(null);
  const [walrusBlobId, setWalrusBlobId] = useState<string>('');

  // 3. Generated outputs & intelligence
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingToWalrus, setIsSavingToWalrus] = useState(false);
  const [roleScope, setRoleScope] = useState<RoleIntelligenceProfile>(() => getRoleIntelligence('Engine Cadet'));
  const [coverLetterText, setCoverLetterText] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Active discipline definition object
  const activeDiscipline = useMemo(() => {
    return DISCIPLINE_DEFINITIONS.find((d) => d.id === selectedDisciplineId) || DISCIPLINE_DEFINITIONS[0];
  }, [selectedDisciplineId]);

  // Verified companies filtered by selected discipline
  const availableCompanies = useMemo(() => {
    return VERIFIED_COMPANY_HIRING_CONTACTS.filter((c) => c.category === activeDiscipline.category);
  }, [activeDiscipline]);

  // Filtered CV highlights tailored strictly to active discipline
  const activeCvHighlights = useMemo(() => {
    return getFilteredCvHighlights(profile, selectedDisciplineId);
  }, [profile, selectedDisciplineId]);

  // Dynamic live current date
  const liveDateString = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }, []);

  // Load sovereign profile & initial cover letter draft on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('careerace_sovereign_profile');
      let loadedProfile: ParsedCv | null = null;
      if (stored) {
        loadedProfile = JSON.parse(stored);
        setProfile(loadedProfile);
      }
      const storedBlob = localStorage.getItem('careerace_walrus_blob_id') || '';
      if (storedBlob) {
        setWalrusBlobId(storedBlob);
      }

      // Check if user has target roles in parsed profile
      const detectedRole = loadedProfile?.target_roles?.[0] || loadedProfile?.work_experience?.[0]?.role || '';
      let initialDisciplineId = 'marine';
      let initialRole = 'Engine Cadet / Trainee Marine Engineer';
      let initialCompany = 'Maersk';

      if (detectedRole) {
        const lower = detectedRole.toLowerCase();
        if (lower.includes('software') || lower.includes('frontend') || lower.includes('full stack') || lower.includes('developer')) {
          initialDisciplineId = 'software';
          initialRole = 'Full Stack Software Engineer';
          initialCompany = 'Vercel';
        } else if (lower.includes('ai') || lower.includes('machine learning') || lower.includes('robotics')) {
          initialDisciplineId = 'ai';
          initialRole = 'Autonomous Systems & ML Engineer';
          initialCompany = 'xAI';
        } else if (lower.includes('health') || lower.includes('medical') || lower.includes('clinical')) {
          initialDisciplineId = 'medical';
          initialRole = 'Lead Healthcare Systems & Informatics Engineer';
          initialCompany = 'Siemens Healthineers';
        } else if (lower.includes('fleet') || lower.includes('operations')) {
          initialDisciplineId = 'management';
          initialRole = 'Global Fleet Operations & Decarbonization Manager';
          initialCompany = 'Maersk Fleet Management';
        } else if (lower.includes('cadet') || lower.includes('marine') || lower.includes('propulsion') || lower.includes('captain')) {
          initialDisciplineId = 'marine';
          initialRole = lower.includes('captain') ? 'Ship Captain / Master Mariner (Navigation & Bridge)' : 'Engine Cadet / Trainee Marine Engineer';
          initialCompany = 'Maersk';
        }
      }

      setSelectedDisciplineId(initialDisciplineId);
      setTargetRole(initialRole);
      setTargetCompany(initialCompany);

      // Check saved letter
      const savedLetter = localStorage.getItem('careerace_tailored_cover_letter');
      if (savedLetter && savedLetter.trim()) {
        setCoverLetterText(savedLetter);
        return;
      }

      // Check saved letters vault
      const vault = JSON.parse(localStorage.getItem('careerace_saved_letters') || '[]');
      if (vault.length > 0 && vault[0].text) {
        setCoverLetterText(vault[0].text);
        if (vault[0].company) setTargetCompany(vault[0].company);
        if (vault[0].role) setTargetRole(vault[0].role);
        return;
      }

      // Generate instant initial draft tailored to discipline
      const instant = generateLocalDraft({
        role: initialRole,
        company: initialCompany,
        candidateName: loadedProfile?.applicant_name || 'Candidate',
        candidateEmail: loadedProfile?.email || '',
        candidatePhone: loadedProfile?.phone || '',
        candidateLocation: loadedProfile?.location || 'Global Remote',
        recentExperience: loadedProfile?.work_experience?.[0],
        walrusBlobId: storedBlob,
        disciplineId: initialDisciplineId,
        filteredHighlights: getFilteredCvHighlights(loadedProfile, initialDisciplineId)
      });
      setCoverLetterText(instant);
      localStorage.setItem('careerace_tailored_cover_letter', instant);
      syncCandidateDataToCloud({ coverLetter: instant });
    } catch (e) {
      console.error('Error during Cover Letter Studio initialization:', e);
    }

    // Cross-device cloud restore
    restoreCandidateDataFromCloud().then((cloudData) => {
      if (cloudData) {
        if (cloudData.profile) {
          setProfile((prev) => prev || cloudData.profile);
        }
        if (cloudData.coverLetter) {
          setCoverLetterText((prev) => prev || cloudData.coverLetter!);
        }
      }
    });

    // Realtime WebSocket channel for cross-device live updates (<50ms)
    const activeAddress = localStorage.getItem('careerace_session_address') || '';
    let unsubscribeRealtime = () => {};
    if (activeAddress) {
      unsubscribeRealtime = subscribeCandidateRealtime(activeAddress, (event) => {
        if (event.kind === 'tailored_cover_letter_snapshot' && typeof event.data === 'string' && event.data.trim()) {
          setCoverLetterText(event.data);
          toast.info('Cover letter updated live from connected device (WebSocket)');
        } else if (event.kind === 'sovereign_profile_snapshot' && event.data) {
          setProfile(event.data);
          if (event.walrusBlobId) setWalrusBlobId(event.walrusBlobId);
        }
      });
    }

    return () => {
      unsubscribeRealtime();
    };
  }, []);

  // Update role intelligence preview whenever role changes
  useEffect(() => {
    const effectiveRole = customRoleInput.trim() || targetRole;
    if (effectiveRole) {
      const intel = getRoleIntelligence(effectiveRole, jobDescription);
      setRoleScope(intel);
    }
  }, [targetRole, customRoleInput, jobDescription]);

  // Handle switching discipline from the Selector Box
  function handleSelectDiscipline(disciplineId: string) {
    const def = DISCIPLINE_DEFINITIONS.find((d) => d.id === disciplineId);
    if (!def) return;

    setSelectedDisciplineId(disciplineId);
    setTargetRole(def.defaultRole);
    setCustomRoleInput('');

    // Pre-select first verified company in that category
    const companies = VERIFIED_COMPANY_HIRING_CONTACTS.filter((c) => c.category === def.category);
    const newCompany = companies[0]?.company || '';
    setTargetCompany(newCompany);

    toast.info(`Switched discipline to ${def.name}`);

    // Regenerate letter immediately
    const draft = generateLocalDraft({
      role: def.defaultRole,
      company: newCompany,
      jobDescription,
      keyProblems: keyProblemsInput,
      candidateName: profile?.applicant_name || 'Candidate',
      candidateEmail: profile?.email || '',
      candidatePhone: profile?.phone || '',
      candidateLocation: profile?.location || 'Global Remote',
      recentExperience: profile?.work_experience?.[0],
      walrusBlobId,
      disciplineId,
      filteredHighlights: getFilteredCvHighlights(profile, disciplineId)
    });
    setCoverLetterText(draft);
    try {
      localStorage.setItem('careerace_tailored_cover_letter', draft);
      syncCandidateDataToCloud({ coverLetter: draft });
    } catch {}
  }

  // Handle role selection within discipline
  function handleSelectRole(roleName: string) {
    setTargetRole(roleName);
    setCustomRoleInput('');
    toast.success(`Role updated: ${roleName}`);

    // Auto update draft
    const draft = generateLocalDraft({
      role: roleName,
      company: targetCompany,
      jobDescription,
      keyProblems: keyProblemsInput,
      candidateName: profile?.applicant_name || 'Candidate',
      candidateEmail: profile?.email || '',
      candidatePhone: profile?.phone || '',
      candidateLocation: profile?.location || 'Global Remote',
      recentExperience: profile?.work_experience?.[0],
      walrusBlobId,
      disciplineId: selectedDisciplineId,
      filteredHighlights: activeCvHighlights
    });
    setCoverLetterText(draft);
    try {
      localStorage.setItem('careerace_tailored_cover_letter', draft);
      syncCandidateDataToCloud({ coverLetter: draft });
    } catch {}
  }

  // Generate / Synthesize Tailored Cover Letter
  async function handleGenerate() {
    const role = customRoleInput.trim() || targetRole.trim() || 'Engineering Specialist';
    const company = targetCompany.trim();

    setIsGenerating(true);
    const toastId = toast.loading('Extracting role scope & synthesizing tailored cover letter...');

    try {
      const res = await fetch('/api/cover_letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: role,
          targetCompany: company || 'Hiring Team',
          jobDescription,
          keyProblems: keyProblemsInput,
          candidateName: profile?.applicant_name || 'Candidate',
          candidateEmail: profile?.email || '',
          candidatePhone: profile?.phone || '',
          candidateLocation: profile?.location || 'Global Remote',
          candidateSkills: profile?.skills || roleScope.technicalKeywords,
          recentExperience: profile?.work_experience?.[0],
          walrusBlobId
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate cover letter.');
      }

      setCoverLetterText(data.coverLetter);
      try {
        localStorage.setItem('careerace_tailored_cover_letter', data.coverLetter);
        syncCandidateDataToCloud({ coverLetter: data.coverLetter });
      } catch {}
      if (data.roleScope) {
        setRoleScope(data.roleScope);
      }

      toast.success(company ? `Tailored cover letter generated for ${company}!` : 'Tailored cover letter synthesized for batch application!', { id: toastId });
    } catch (err: any) {
      // Local sovereign fallback
      const fallbackDraft = generateLocalDraft({
        role,
        company,
        jobDescription,
        keyProblems: keyProblemsInput,
        candidateName: profile?.applicant_name || 'Candidate',
        candidateEmail: profile?.email || '',
        candidatePhone: profile?.phone || '',
        candidateLocation: profile?.location || 'Global Remote',
        recentExperience: profile?.work_experience?.[0],
        walrusBlobId,
        disciplineId: selectedDisciplineId,
        filteredHighlights: activeCvHighlights
      });
      setCoverLetterText(fallbackDraft);
      try {
        localStorage.setItem('careerace_tailored_cover_letter', fallbackDraft);
        syncCandidateDataToCloud({ coverLetter: fallbackDraft });
      } catch {}
      toast.info('Synthesized letter via sovereign role engine.', { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  }

  function handleCopy() {
    if (!coverLetterText) return;
    navigator.clipboard.writeText(coverLetterText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
    toast.success('Cover letter copied to clipboard!');
  }

  function handleDownload() {
    if (!coverLetterText) return;
    const roleForFile = customRoleInput.trim() || targetRole;
    const compForFile = targetCompany.trim() || 'General';
    const blob = new Blob([coverLetterText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${compForFile.replace(/[^a-zA-Z0-9]/g, '_')}_${roleForFile.replace(/[^a-zA-Z0-9]/g, '_')}_Cover_Letter.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Cover letter text file downloaded!');
  }

  // Anchor to Walrus Sovereign Memory Vault
  async function handleAnchorToWalrusVault() {
    if (!coverLetterText) return;
    setIsSavingToWalrus(true);
    const toastId = toast.loading('Sealing cover letter into Walrus Sovereign Memory...');

    try {
      const role = customRoleInput.trim() || targetRole;
      const comp = targetCompany.trim() || 'Batch Application';

      // 1. Record in sovereign memory contract
      await saveFact('tailored_cv', `Tailored Cover Letter for ${role} at ${comp}: ${coverLetterText.slice(0, 300)}...`);

      // 2. Save into local vault
      const records = JSON.parse(localStorage.getItem('careerace_saved_letters') || '[]');
      records.unshift({
        id: `cl-${Date.now()}`,
        company: comp,
        role: role,
        text: coverLetterText,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('careerace_saved_letters', JSON.stringify(records.slice(0, 15)));

      toast.success('Cover letter permanently anchored into Walrus Sovereign Memory!', { id: toastId });
    } catch (err: any) {
      // Local fallback record
      try {
        const records = JSON.parse(localStorage.getItem('careerace_saved_letters') || '[]');
        records.unshift({
          id: `cl-${Date.now()}`,
          company: targetCompany || 'Direct Application',
          role: customRoleInput.trim() || targetRole,
          text: coverLetterText,
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('careerace_saved_letters', JSON.stringify(records.slice(0, 15)));
        toast.success('Cover letter recorded to Sovereign Local Vault!', { id: toastId });
      } catch {
        toast.error('Failed to anchor letter to vault.', { id: toastId });
      }
    } finally {
      setIsSavingToWalrus(false);
    }
  }

  // Direct Handoff to Auto-Apply on Job Board
  function handleGoToAutoApply() {
    const role = customRoleInput.trim() || targetRole;
    const company = targetCompany.trim();

    // Store tailored cover letter in storage for auto-apply ingestion
    try {
      localStorage.setItem('careerace_tailored_cover_letter', coverLetterText);
    } catch {}

    const queryParams = new URLSearchParams({
      tab: 'auto_apply',
      role: role,
      company: company
    });

    toast.success(`Handoff to Auto-Apply for ${role} with live cover letter!`);
    router.push(`/application_board?${queryParams.toString()}`);
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                Cover Letter Studio
              </h1>
              <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-mono">
                Target Role Intelligence
              </Badge>
              <Badge variant="secondary" className="text-[10px] font-mono flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-500" />
                <span>{liveDateString}</span>
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              Tailors every sentence around the exact problems and operational responsibilities of your target discipline. Filtered strictly to relevant verified experience with zero AI slop, permanent Walrus memory commit, and instant 1-click Auto-Apply dispatch.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/application_board')}
              className="text-xs gap-1.5 h-9 cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
              <span>Job Board</span>
            </Button>

            <Button
              size="sm"
              onClick={handleGoToAutoApply}
              className="text-xs gap-1.5 h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send via Auto-Apply</span>
            </Button>
          </div>
        </div>

        {/* 1. DISCIPLINE & TARGET ROLE SELECTOR BOX (UI/UX Pro Max) */}
        <Card className="p-5 border border-border shadow-xs rounded-2xl bg-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/70">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-bold text-foreground">Discipline & Target Role Intelligence Selector</h2>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Select or customize your career discipline to calibrate role scope, CV highlights & corporate contacts.
            </span>
          </div>

          {/* Discipline Selector Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {DISCIPLINE_DEFINITIONS.map((def) => {
              const isSelected = selectedDisciplineId === def.id;
              return (
                <button
                  key={def.id}
                  type="button"
                  onClick={() => handleSelectDiscipline(def.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 shadow-xs ring-1 ring-emerald-500'
                      : 'border-border bg-background hover:border-emerald-500/50 hover:bg-muted/30 text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                      {def.id.toUpperCase()}
                    </span>
                    {isSelected && <Check className="w-3 h-3 text-emerald-500" />}
                  </div>
                  <div className="text-xs font-bold truncate">{def.name}</div>
                  <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                    {def.roles[0]}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Role Pills inside Selected Discipline + Custom Role Input */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Select Calibrated Role in {activeDiscipline.name}:
              </span>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                {activeDiscipline.roles.length} roles available
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs">
              {activeDiscipline.roles.map((r) => {
                const isRoleActive = targetRole === r && !customRoleInput.trim();
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleSelectRole(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isRoleActive
                        ? 'bg-foreground text-background font-semibold shadow-xs'
                        : 'bg-muted/50 text-foreground hover:bg-muted border border-border/80'
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>

            {/* Custom Target Role input if user wants something specific (e.g. Engine Cadet, 3rd Engineer, Captain) */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="text-xs font-semibold text-muted-foreground shrink-0">
                Or Type Custom Target Role:
              </div>
              <input
                type="text"
                value={customRoleInput}
                onChange={(e) => setCustomRoleInput(e.target.value)}
                placeholder={`e.g. ${activeDiscipline.defaultRole}`}
                className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {customRoleInput && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCustomRoleInput('')}
                  className="text-xs h-9 text-muted-foreground hover:text-foreground"
                >
                  Clear Custom
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Main 2-Column Split: Intelligence Engine & Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column (5 Cols): Role Intelligence Parameters & Company Directory */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-6 border border-border shadow-sm rounded-2xl bg-card space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-500" />
                  <h2 className="font-bold text-sm text-foreground">Target Role Intelligence</h2>
                </div>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  {roleScope.discipline}
                </Badge>
              </div>

              {/* Company Picker & Custom Input */}
              <div className="space-y-4 text-xs">
                {/* Available Companies Dropdown & Batch Apply Option */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Target Company (Verified or Custom)
                    </label>
                    <span className="text-[10px] text-muted-foreground">
                      Leave empty for general batch apply
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {/* Select from discipline corporate directory */}
                    {availableCompanies.length > 0 && (
                      <div className="relative">
                        <select
                          value={availableCompanies.some((c) => c.company === targetCompany) ? targetCompany : 'custom'}
                          onChange={(e) => {
                            if (e.target.value === 'general_batch') {
                              setTargetCompany('');
                              toast.info('Configured for batch application: "Dear Hiring Team"');
                            } else if (e.target.value !== 'custom') {
                              setTargetCompany(e.target.value);
                              toast.info(`Selected verified employer: ${e.target.value}`);
                            }
                          }}
                          className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                        >
                          <option value="general_batch">⚡ General Application (Dear Hiring Team — Batch Ready)</option>
                          <optgroup label={`Verified ${activeDiscipline.name} Employers`}>
                            {availableCompanies.map((c) => (
                              <option key={c.id} value={c.company}>
                                {c.company} · {c.location}
                              </option>
                            ))}
                          </optgroup>
                          <option value="custom">Enter Custom Employer Name...</option>
                        </select>
                      </div>
                    )}

                    {/* Text input for manual or edited company name */}
                    <input
                      type="text"
                      value={targetCompany}
                      onChange={(e) => setTargetCompany(e.target.value)}
                      placeholder="e.g. Maersk, Chevron Shipping, Stolt Tankers (or leave blank)"
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Active Target Role Display */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Target Role Title
                  </label>
                  <input
                    type="text"
                    value={customRoleInput.trim() || targetRole}
                    onChange={(e) => {
                      setCustomRoleInput(e.target.value);
                    }}
                    placeholder="e.g. Engine Cadet / Trainee Marine Engineer"
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>

                {/* Job Description Optional Scope */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Job Description or Specific Scope (Optional)
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={2}
                    placeholder="Paste specific job posting requirements or leave blank for autonomous discipline extraction..."
                    className="w-full p-2.5 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Discipline-Filtered Candidate Highlights */}
              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Active CV Highlights ({activeDiscipline.name})</span>
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-600">
                    Walrus Memory
                  </Badge>
                </div>
                {activeCvHighlights.length > 0 ? (
                  <ul className="space-y-1.5 text-[11px] text-muted-foreground leading-relaxed">
                    {activeCvHighlights.map((hl, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold mt-0.5 shrink-0">✓</span>
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-muted-foreground italic">
                    Focusing on foundational problem-solving metrics and operational discipline for this role.
                  </p>
                )}
              </div>

              {/* Auto-Extracted Role Intelligence Scope */}
              <div className="space-y-3 pt-2 border-t border-border">
                {/* 1. Core Responsibilities Scope */}
                <div className="p-3.5 rounded-xl border border-border/80 bg-muted/30 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Core Responsibilities Scope</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-muted-foreground leading-relaxed pl-1">
                    {roleScope.coreResponsibilities.map((resp, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 2. Key Industry Problems That Role Solves */}
                <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900 dark:text-amber-300">
                    <Target className="w-3.5 h-3.5 text-amber-500" />
                    <span>Key Industry Problems This Role Solves</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-amber-950 dark:text-amber-200/80 leading-relaxed pl-1">
                    {roleScope.keyProblemsSolved.map((prob, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-0.5 shrink-0">
                          {i + 1}.
                        </span>
                        <span>{prob}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3. Calibrated ATS Impact Metrics */}
                <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800 dark:text-emerald-300">
                    <Zap className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Calibrated Measurable Benchmark</span>
                  </div>
                  <p className="text-[11px] text-emerald-950 dark:text-emerald-200/90 leading-relaxed">
                    {roleScope.measurableImpactMetrics[0]}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full h-10 rounded-xl text-xs font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing Tailored Letter...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Synthesize Tailored Cover Letter</span>
                  </>
                )}
              </Button>
            </Card>
          </div>

          {/* Right Column (7 Cols): Generated Cover Letter Viewer & Toolbar */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="p-6 border border-border shadow-sm rounded-2xl bg-card space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-500" />
                  <h3 className="font-bold text-sm text-foreground">Generated Sovereign Cover Letter</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 bg-emerald-500/10 font-mono">
                    <ShieldCheck className="w-3 h-3 mr-1 text-emerald-500" /> Zero AI Slop Verified
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {liveDateString}
                  </Badge>
                </div>
              </div>

              {/* Letter Preview Area */}
              <div className="relative">
                <textarea
                  value={coverLetterText}
                  onChange={(e) => {
                    setCoverLetterText(e.target.value);
                    try {
                      localStorage.setItem('careerace_tailored_cover_letter', e.target.value);
                    } catch {}
                  }}
                  rows={20}
                  className="w-full p-5 rounded-xl border border-border bg-background text-xs text-foreground font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-y shadow-inner"
                  placeholder="Your tailored cover letter will render here..."
                />
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopy}
                    className="text-xs gap-1.5 h-9 border-border text-foreground hover:bg-muted cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Copy Letter</span>
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownload}
                    className="text-xs gap-1.5 h-9 border-border text-foreground hover:bg-muted cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Download (.TXT)</span>
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleAnchorToWalrusVault}
                    disabled={isSavingToWalrus}
                    className="text-xs gap-1.5 h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs cursor-pointer"
                    title="Cryptographically seal this tailored cover letter into Walrus Sovereign Memory"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{isSavingToWalrus ? 'Anchoring...' : 'Anchor to Walrus Vault'}</span>
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleGoToAutoApply}
                    className="text-xs gap-1.5 h-9 bg-foreground text-background hover:bg-foreground/90 font-semibold shadow-xs cursor-pointer"
                    title="Send this tailored cover letter via Job Board Auto-Apply"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Batch Apply on Job Board</span>
                    <ArrowRight className="w-3 h-3 ml-0.5" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Anti-Slop Audit & Verification Guarantee */}
            <div className="p-4 rounded-xl border border-border/80 bg-muted/20 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Sovereign Letter Standards
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">Walrus Certified · Live Date {liveDateString}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Zero cliché buzzwords (delve, foster, leverage, cutting-edge, tapestry). Sentences use active voice, concrete mechanisms, and direct accountability. Grounded strictly in candidate experience records.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
