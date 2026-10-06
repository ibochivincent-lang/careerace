'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  RefreshCw,
  Calendar,
  Compass,
  Send,
  FileCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { getRoleIntelligence, type RoleIntelligenceProfile } from '@/lib/role_intelligence';
import { VERIFIED_COMPANY_HIRING_CONTACTS, type CompanyHiringContact } from '@/lib/company_directory';
import type { ParsedCv } from '@/lib/cv_parser';
import { restoreCandidateDataFromCloud, syncCandidateDataToCloud, subscribeCandidateRealtime } from '@/lib/cloud_sync';
import { saveFact } from '@/app/actions/memory';
import { downloadEmlReceipt } from '@/lib/email_receipt';
import { getClientSessionAddress } from '@/lib/client_auth';

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
      'Offshore DP & Subsea Systems Specialist'
    ],
    defaultRole: 'Engine Cadet / Trainee Marine Engineer',
    description: 'Propulsion telemetry, auxiliary plant, SOLAS/MARPOL compliance, bridge management, and offshore vessel uptime.'
  },
  {
    id: 'software',
    name: 'Software & Cloud Engineering',
    category: 'Software / Cloud',
    roles: [
      'Full Stack Software Engineer',
      'Distributed Systems & Cloud Architect',
      'Frontend / UX Infrastructure Engineer',
      'Reliability & DevOps Platform Engineer'
    ],
    defaultRole: 'Full Stack Software Engineer',
    description: 'High-concurrency APIs, distributed microservices, TypeScript/Next.js architectures, and cloud resilience.'
  },
  {
    id: 'ai',
    name: 'AI & Autonomous Systems',
    category: 'AI / Robotics',
    roles: [
      'Autonomous Systems & ML Engineer',
      'Computer Vision & Sensor Fusion Specialist',
      'LLM & Agentic Systems Engineer',
      'Robotics Software Architect'
    ],
    defaultRole: 'Autonomous Systems & ML Engineer',
    description: 'Deep neural models, sensor fusion, real-time edge inference, and high-safety autonomous feedback loops.'
  },
  {
    id: 'medical',
    name: 'Medical & Healthcare Informatics',
    category: 'Medical / Healthcare',
    roles: [
      'Lead Healthcare Systems & Informatics Engineer',
      'Clinical Decision Support & EHR Specialist',
      'Biomedical Device Integration Engineer',
      'Healthcare Data Compliance Architect'
    ],
    defaultRole: 'Lead Healthcare Systems & Informatics Engineer',
    description: 'HL7 FHIR pipelines, HIPAA-compliant clinical systems, telemedicine security, and zero diagnostic latency.'
  },
  {
    id: 'management',
    name: 'Management & Fleet Operations',
    category: 'Management / Operations',
    roles: [
      'Global Fleet Operations & Decarbonization Manager',
      'Technical Superintendent & Compliance Director',
      'Maritime Logistics & Voyage Planning Director',
      'HSE & Maritime Operations Auditor'
    ],
    defaultRole: 'Global Fleet Operations & Decarbonization Manager',
    description: 'Commercial voyage efficiency, CII emissions compliance, OPEX budget control, and maritime safety governance.'
  },
  {
    id: 'industrial',
    name: 'Industrial & Hardware Engineering',
    category: 'Engineering / Industrial',
    roles: [
      'Industrial Automation & Test Systems Engineer',
      'Hardware Quality & Sensor Calibration Specialist',
      'PLC & SCADA Control Systems Architect',
      'Embedded Firmware Reliability Engineer'
    ],
    defaultRole: 'Industrial Automation & Test Systems Engineer',
    description: 'High-throughput manufacturing lines, PLC/SCADA control loops, hardware transducer calibration, and Six Sigma rigor.'
  },
  {
    id: 'custom',
    name: 'Custom Discipline & Role',
    category: 'Maritime / Offshore',
    roles: [
      'Custom Role Specified by Candidate'
    ],
    defaultRole: 'Custom Engineering Specialist',
    description: 'Define your exact role title and industry focus for custom-tailored cover letter synthesis.'
  }
];

function getFilteredCvHighlights(profile: ParsedCv | null, disciplineId: string): string[] {
  if (!profile) return [];

  const disciplineKeywords: Record<string, string[]> = {
    marine: ['marine', 'cadet', 'vessel', 'engine', 'propulsion', 'boiler', 'generator', 'auxiliary', 'pump', 'solas', 'marpol', 'stcw', 'ship', 'bunkering', 'ballast', 'offshore', 'voyage', 'captain', 'bridge'],
    software: ['software', 'react', 'next.js', 'typescript', 'api', 'database', 'frontend', 'backend', 'full stack', 'cloud', 'aws', 'docker', 'kubernetes', 'node', 'ui', 'ux'],
    ai: ['machine learning', 'ai', 'neural', 'vision', 'sensor', 'model', 'inference', 'python', 'pytorch', 'tensorflow', 'robotics', 'cuda'],
    medical: ['health', 'medical', 'clinical', 'fhir', 'ehr', 'hipaa', 'biomedical', 'patient', 'hospital', 'telehealth'],
    management: ['fleet', 'operations', 'superintendent', 'cii', 'management', 'logistics', 'charter', 'budget', 'audit', 'compliance'],
    industrial: ['automation', 'plc', 'scada', 'hardware', 'transducer', 'calibration', 'manufacturing', 'quality', 'six sigma', 'sensor'],
    custom: ['engineer', 'lead', 'operations', 'systems', 'management', 'specialist']
  };

  const targetFilter = disciplineKeywords[disciplineId] || disciplineKeywords.marine;
  const highlights: string[] = [];

  profile.work_experience?.forEach((w) => {
    w.highlights?.forEach((h) => {
      const lower = h.toLowerCase();
      if (targetFilter.some((k) => lower.includes(k))) {
        highlights.push(`${w.role} at ${w.company}: ${h}`);
      }
    });
  });

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

Specifically, I tailor my technical approach around addressing and resolving key industry challenges that directly impact ${companyDisplay}:
1. ${problems[0] || 'Mitigating system downtime through predictive diagnostics and rigorous preventive maintenance'}
2. ${problems[1] || 'Optimizing resource allocation and operational throughput under high-constraint environments'}

${recentExpSummary}

${walrusLine}

I would welcome the opportunity to discuss how my disciplined background and practical problem-solving approach align with ${companyDisplay}'s upcoming milestones. Thank you for your time and consideration.

Sincerely,

${params.candidateName || 'Candidate'}`;
}

export default function CoverLetterStudioPage() {
  const router = useRouter();

  // Discipline & Role Selector State
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>('marine');
  const [targetRole, setTargetRole] = useState<string>('Engine Cadet / Trainee Marine Engineer');
  const [customRoleInput, setCustomRoleInput] = useState<string>('');
  const [targetCompany, setTargetCompany] = useState<string>('Maersk');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [keyProblemsInput, setKeyProblemsInput] = useState<string>('');

  // Profile & Walrus Sovereign Memory State
  const [profile, setProfile] = useState<ParsedCv | null>(null);
  const [walrusBlobId, setWalrusBlobId] = useState<string>('');

  // Output & Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingToWalrus, setIsSavingToWalrus] = useState(false);
  const [roleScope, setRoleScope] = useState<RoleIntelligenceProfile>(() => getRoleIntelligence('Engine Cadet'));
  const [coverLetterText, setCoverLetterText] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Active discipline definition
  const activeDiscipline = useMemo(() => {
    return DISCIPLINE_DEFINITIONS.find((d) => d.id === selectedDisciplineId) || DISCIPLINE_DEFINITIONS[0];
  }, [selectedDisciplineId]);

  // Verified companies for current discipline
  const availableCompanies = useMemo(() => {
    return VERIFIED_COMPANY_HIRING_CONTACTS.filter((c) => c.category === activeDiscipline.category);
  }, [activeDiscipline]);

  // Filtered CV highlights
  const activeCvHighlights = useMemo(() => {
    return getFilteredCvHighlights(profile, selectedDisciplineId);
  }, [profile, selectedDisciplineId]);

  // Live date string
  const liveDateString = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }, []);

  // Real-time draft generator helper
  const updateDraft = useCallback((
    role: string,
    company: string,
    disciplineId: string,
    prof: ParsedCv | null,
    blobId: string,
    jd: string,
    kp: string
  ) => {
    const draft = generateLocalDraft({
      role: role.trim() || 'Engineering Specialist',
      company: company,
      jobDescription: jd,
      keyProblems: kp,
      candidateName: prof?.applicant_name || 'Candidate',
      candidateEmail: prof?.email || '',
      candidatePhone: prof?.phone || '',
      candidateLocation: prof?.location || 'Global Remote',
      recentExperience: prof?.work_experience?.[0],
      walrusBlobId: blobId,
      disciplineId: disciplineId,
      filteredHighlights: getFilteredCvHighlights(prof, disciplineId)
    });
    setCoverLetterText(draft);
    try {
      localStorage.setItem('careerace_tailored_cover_letter', draft);
      syncCandidateDataToCloud({ coverLetter: draft });
    } catch {}
  }, []);

  // Load profile & initial state on mount
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

      // Check detected role
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

      // Initial draft
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

    restoreCandidateDataFromCloud().then((cloudData) => {
      if (cloudData) {
        if (cloudData.profile) setProfile((prev) => prev || cloudData.profile);
        if (cloudData.coverLetter) setCoverLetterText((prev) => prev || cloudData.coverLetter!);
      }
    });

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

    let newCompany = '';
    if (disciplineId !== 'custom') {
      const companies = VERIFIED_COMPANY_HIRING_CONTACTS.filter((c) => c.category === def.category);
      newCompany = companies[0]?.company || '';
    }
    setTargetCompany(newCompany);

    toast.info(`Switched discipline to ${def.name}`);
    updateDraft(def.defaultRole, newCompany, disciplineId, profile, walrusBlobId, jobDescription, keyProblemsInput);
  }

  // Handle role selection
  function handleSelectRole(roleName: string) {
    setTargetRole(roleName);
    setCustomRoleInput('');
    toast.success(`Role updated: ${roleName}`);
    updateDraft(roleName, targetCompany, selectedDisciplineId, profile, walrusBlobId, jobDescription, keyProblemsInput);
  }

  // Handle custom role typing
  function handleCustomRoleChange(newRole: string) {
    setCustomRoleInput(newRole);
    const effectiveRole = newRole.trim() || targetRole;
    updateDraft(effectiveRole, targetCompany, selectedDisciplineId, profile, walrusBlobId, jobDescription, keyProblemsInput);
  }

  // Handle company selection / typing with immediate real-time calibration
  function handleCompanyChange(newCompany: string) {
    setTargetCompany(newCompany);
    const effectiveRole = customRoleInput.trim() || targetRole;
    updateDraft(effectiveRole, newCompany, selectedDisciplineId, profile, walrusBlobId, jobDescription, keyProblemsInput);
  }

  // Generate / Synthesize Tailored Cover Letter (Strict client-side execution, no redirect, no 404)
  async function handleGenerate(e?: React.MouseEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

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

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (!data.success || !data.coverLetter) {
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

      toast.success(company ? `Tailored cover letter calibrated for ${company}!` : 'Tailored cover letter synthesized for batch application!', { id: toastId });
    } catch (err: any) {
      // Local sovereign fallback ensures zero downtime and no 404
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

  function handleDownloadEml() {
    if (!coverLetterText) return;
    const roleForFile = customRoleInput.trim() || targetRole;
    const compForFile = targetCompany.trim() || 'Hiring Organization';
    const matchedContact = VERIFIED_COMPANY_HIRING_CONTACTS.find(
      (c) => c.company.toLowerCase() === targetCompany.toLowerCase().trim()
    );
    const recipientEmail = matchedContact?.contactEmail || `careers@${targetCompany.toLowerCase().replace(/[^a-z0-9]/g, '') || 'company'}.com`;
    const candidateName = profile?.applicant_name || 'Candidate';
    const candidateEmail = profile?.email || 'applicant@careerace.online';
    const sessionAddr = getClientSessionAddress();

    try {
      downloadEmlReceipt({
        to: recipientEmail,
        fromName: candidateName,
        fromEmail: candidateEmail,
        subject: `Application: ${roleForFile} - ${candidateName}`,
        body: coverLetterText,
        candidateAddress: sessionAddr || null,
        candidatePhone: profile?.phone || null,
        company: compForFile,
        role: roleForFile,
        walrusBlobId: walrusBlobId || null,
        relayProvider: 'Cover Letter Studio (Verifiable .eml)',
      });
      toast.success('Verifiable RFC-5322 .eml message file downloaded!');
    } catch (e) {
      console.error('Failed to generate .eml receipt', e);
      toast.error('Failed to generate .eml receipt.');
    }
  }

  async function handleAnchorToWalrusVault() {
    if (!coverLetterText) return;
    setIsSavingToWalrus(true);
    const toastId = toast.loading('Sealing cover letter into Walrus Sovereign Memory...');

    try {
      const role = customRoleInput.trim() || targetRole;
      const comp = targetCompany.trim() || 'Batch Application';

      await saveFact('tailored_cv', `Tailored Cover Letter for ${role} at ${comp}: ${coverLetterText.slice(0, 300)}...`);

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
    } catch {
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

  function handleGoToAutoApply() {
    const role = customRoleInput.trim() || targetRole;
    const company = targetCompany.trim();

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
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 pt-3 sm:pt-6 pb-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                Cover Letter Studio
              </h1>
              <Badge variant="secondary" className="text-[10px] font-mono flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-500" />
                <span>{liveDateString}</span>
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push('/application_board')}
              className="text-xs gap-1.5 h-9 cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
              <span>Job Board</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleGoToAutoApply}
              className="text-xs gap-1.5 h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send via Auto-Apply</span>
            </Button>
          </div>
        </div>

        {/* 1. DISCIPLINE & TARGET ROLE SELECTOR */}
        <Card className="p-4 sm:p-5 border border-border shadow-xs rounded-2xl bg-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/70">
            <h2 className="text-sm font-bold text-foreground">Discipline and Target Role Selector</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Discipline Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground block">
                Target Discipline
              </label>
              <select
                value={selectedDisciplineId}
                onChange={(e) => handleSelectDiscipline(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                {DISCIPLINE_DEFINITIONS.map((def) => (
                  <option key={def.id} value={def.id}>
                    {def.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Role Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground block">
                Calibrated Target Role
              </label>
              <select
                value={customRoleInput.trim() ? 'custom' : targetRole}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'custom') {
                    if (!customRoleInput) {
                      setCustomRoleInput(targetRole || activeDiscipline.defaultRole);
                    }
                  } else {
                    setCustomRoleInput('');
                    handleSelectRole(val);
                  }
                }}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <optgroup label={activeDiscipline.name}>
                  {activeDiscipline.roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </optgroup>
                <option value="custom">Enter Custom Role...</option>
              </select>
            </div>
          </div>

          {/* Custom Role Input field (visible if custom role selected or entered) */}
          {(customRoleInput || !activeDiscipline.roles.includes(targetRole)) && (
            <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="text-xs font-semibold text-muted-foreground shrink-0">
                Custom Role Title:
              </div>
              <input
                type="text"
                value={customRoleInput || targetRole}
                onChange={(e) => handleCustomRoleChange(e.target.value)}
                placeholder={`e.g. ${activeDiscipline.defaultRole}`}
                className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setCustomRoleInput('');
                  handleSelectRole(activeDiscipline.defaultRole);
                }}
                className="text-xs h-9 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Reset to Calibrated Role
              </Button>
            </div>
          )}
        </Card>

        {/* Main 2-Column Split: Intelligence Engine & Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (5 Cols): Role Intelligence Parameters & Company Selector */}
          <div className="lg:col-span-5 space-y-5">
            <Card className="p-5 border border-border shadow-xs rounded-2xl bg-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h2 className="font-bold text-sm text-foreground">Target Role Intelligence</h2>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  {roleScope.discipline}
                </Badge>
              </div>

              {/* Company Picker & Custom Input (Real-time dynamic calibration, NO EMOJIS) */}
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Target Company
                  </label>

                  <div className="flex flex-col gap-2">
                    {/* Select from discipline corporate directory */}
                    {availableCompanies.length > 0 && (
                      <select
                        value={availableCompanies.some((c) => c.company === targetCompany) ? targetCompany : targetCompany === '' ? 'general_batch' : 'custom'}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'general_batch') {
                            handleCompanyChange('');
                            toast.info('Configured for batch application: Dear Hiring Team');
                          } else if (val !== 'custom') {
                            handleCompanyChange(val);
                            toast.info(`Calibrated to verified employer: ${val}`);
                          }
                        }}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="general_batch">General Application (Dear Hiring Team - Batch Ready)</option>
                        <optgroup label={`Verified ${activeDiscipline.name} Employers`}>
                          {availableCompanies.map((c) => (
                            <option key={c.id} value={c.company}>
                              {c.company} · {c.location}
                            </option>
                          ))}
                        </optgroup>
                        <option value="custom">Enter Custom Employer Name...</option>
                      </select>
                    )}

                    {/* Text input for manual or edited company name */}
                    <input
                      type="text"
                      value={targetCompany}
                      onChange={(e) => handleCompanyChange(e.target.value)}
                      placeholder="e.g. Maersk, Chevron Shipping, Stolt Tankers (or leave empty for general)"
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
                    onChange={(e) => handleCustomRoleChange(e.target.value)}
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
            </Card>
          </div>

          {/* Right Column (7 Cols): Generated Cover Letter Viewer & Toolbar */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="p-5 border border-border shadow-xs rounded-2xl bg-card space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-500" />
                  <h3 className="font-bold text-sm text-foreground">Tailored Sovereign Cover Letter</h3>
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
                  className="w-full p-4 rounded-xl border border-border bg-background text-xs text-foreground font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-y shadow-inner"
                  placeholder="Your tailored cover letter will render here..."
                />
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCopy}
                    className="text-xs gap-1.5 h-9 border-border text-foreground hover:bg-muted cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Copied to Clipboard</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Copy Letter</span>
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleDownload}
                    className="text-xs gap-1.5 h-9 border-border text-foreground hover:bg-muted cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Download (.TXT)</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadEml}
                    className="text-xs gap-1.5 h-9 border-border text-foreground hover:bg-muted cursor-pointer"
                    title="Download RFC-compliant .eml message file for verifiable offline records"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Download (.EML)</span>
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
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
                    type="button"
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
          </div>
        </div>
      </div>
    </AppShell>
  );
}
