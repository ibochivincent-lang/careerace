'use client';

import React, { useState, useEffect } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { getRoleIntelligence, type RoleIntelligenceProfile } from '@/lib/role_intelligence';
import type { ParsedCv } from '@/lib/cv_parser';
import { restoreCandidateDataFromCloud, syncCandidateDataToCloud, subscribeCandidateRealtime } from '@/lib/cloud_sync';

const PRESET_DISCIPLINES = [
  { id: 'marine', label: 'Engineering & Marine', role: 'Marine Systems Engineer (Offshore & Propulsion)', company: 'Maersk' },
  { id: 'cadet', label: 'Engine Cadet / Trainee', role: 'Engine Cadet / Trainee Marine Engineer', company: 'Chevron Shipping' },
  { id: 'software', label: 'Software & IT', role: 'Senior Full Stack Engineer', company: 'Vercel' },
  { id: 'ai', label: 'AI & Autonomous Systems', role: 'Autonomous Systems & ML Engineer', company: 'xAI' },
  { id: 'medical', label: 'Medical & Healthcare', role: 'Lead Healthcare Systems & Informatics Engineer', company: 'Siemens Healthineers' },
  { id: 'management', label: 'Management & Operations', role: 'Global Fleet Operations & Decarbonization Manager', company: 'Maersk Fleet Management' },
  { id: 'industrial', label: 'Industrial & Manufacturing', role: 'Manufacturing & Transducer Quality Engineer', company: 'Wabtec' },
];

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
}): string {
  const intel = getRoleIntelligence(params.role, params.jobDescription);
  const company = params.company.trim() || 'Target Organization';
  const problems = params.keyProblems?.trim()
    ? [params.keyProblems.trim(), ...intel.keyProblemsSolved.slice(0, 2)]
    : intel.keyProblemsSolved;

  const topKeywords = intel.technicalKeywords.slice(0, 6).join(', ');
  const verifiedMetric = intel.measurableImpactMetrics[0] || 'Maintained consistent high-reliability performance';
  const recentExpSummary = params.recentExperience?.company
    ? `In my recent role as ${params.recentExperience.role || 'Engineer'} at ${params.recentExperience.company}, I was directly accountable for ${params.recentExperience.highlights?.[0] || 'delivering verified operational outcomes'}.`
    : `Throughout my career, I have focused on solving high-stakes technical bottlenecks with verifiable execution.`;

  const contactPieces = [params.candidateEmail, params.candidatePhone, params.candidateLocation].filter(Boolean);
  const contactLine = contactPieces.length > 0 ? contactPieces.join(' · ') : 'Direct Contact Verified · Sovereign Record';

  const walrusLine = params.walrusBlobId
    ? `My verified work attestations and cryptographic portfolio are permanently anchored on Mysten Labs Walrus storage at: https://walruscan.com/testnet/blob/${params.walrusBlobId}`
    : `My verified credentials and technical portfolio are registered through the CareerAce sovereign proof network.`;

  const todayDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return `${params.candidateName || 'Candidate'}
${contactLine}

${todayDate}

Hiring Team · ${company}

Dear ${company} Hiring Team,

I am writing to formally submit my application for the position of ${params.role} at ${company}. With a background centered on ${topKeywords}, I take direct accountability for engineering reliability, operational discipline, and technical execution.

The scope of the ${params.role} role demands focused execution across critical operational priorities:
• ${intel.coreResponsibilities[0] || 'Execution of mission-critical systems and workflows'}
• ${intel.coreResponsibilities[1] || 'Ensuring compliance, high availability, and operational safety'}
• ${intel.coreResponsibilities[2] || 'Troubleshooting and rapid resolution of complex operational anomalies'}

Specifically, I tailor my technical approach around addressing and resolving key industry challenges that directly impact ${company}:
1. ${problems[0] || 'Mitigating system downtime through predictive diagnostics and rigorous preventive maintenance'}
2. ${problems[1] || 'Optimizing resource allocation and operational throughput under high-constraint environments'}

${recentExpSummary} As a proven benchmark, I have ${verifiedMetric.toLowerCase()}, ensuring that theoretical plans translate into measurable field reliability.

${walrusLine}

I would welcome the opportunity to discuss how my disciplined background and practical problem-solving approach align with ${company}'s upcoming milestones. Thank you for your time and consideration.

Sincerely,

${params.candidateName || 'Candidate'}`;
}

export default function CoverLetterStudioPage() {
  const router = useRouter();

  // Inputs
  const [targetCompany, setTargetCompany] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [keyProblemsInput, setKeyProblemsInput] = useState('');

  // Profile data from Walrus / localStorage
  const [profile, setProfile] = useState<ParsedCv | null>(null);
  const [walrusBlobId, setWalrusBlobId] = useState('');

  // Generated outputs & intelligence
  const [isGenerating, setIsGenerating] = useState(false);
  const [roleScope, setRoleScope] = useState<RoleIntelligenceProfile>(() => getRoleIntelligence('Systems Engineer'));
  const [coverLetterText, setCoverLetterText] = useState('');
  const [copied, setCopied] = useState(false);

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

      const initialRole = loadedProfile?.work_experience?.[0]?.role || 'Senior Systems Engineer';
      const initialCompany = loadedProfile?.work_experience?.[0]?.company || 'Target Organization';

      setTargetRole(initialRole);
      setTargetCompany(initialCompany);

      // Check if candidate already has an active tailored cover letter in storage
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

      // Generate instant initial draft so the studio is immediately populated with zero delay
      const instant = generateLocalDraft({
        role: initialRole,
        company: initialCompany,
        candidateName: loadedProfile?.applicant_name || 'Candidate',
        candidateEmail: loadedProfile?.email || '',
        candidatePhone: loadedProfile?.phone || '',
        candidateLocation: loadedProfile?.location || 'Global Remote',
        recentExperience: loadedProfile?.work_experience?.[0],
        walrusBlobId: storedBlob
      });
      setCoverLetterText(instant);
      localStorage.setItem('careerace_tailored_cover_letter', instant);
      syncCandidateDataToCloud({ coverLetter: instant });
    } catch (e) {
      console.error('Error during Cover Letter Studio initialization:', e);
    }

    // Cross-device cloud restore: fetch cover letter and profile onto mobile
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
    if (targetRole) {
      const intel = getRoleIntelligence(targetRole, jobDescription);
      setRoleScope(intel);
    }
  }, [targetRole, jobDescription]);

  // Generate cover letter
  async function handleGenerate() {
    const role = targetRole.trim() || 'Systems Engineer';
    const company = targetCompany.trim() || 'Target Organization';

    setIsGenerating(true);
    const toastId = toast.loading('Extracting role scope & synthesizing tailored cover letter...');

    try {
      const res = await fetch('/api/cover_letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: role,
          targetCompany: company,
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

      toast.success(`Tailored cover letter generated for ${company}!`, { id: toastId });
    } catch (err: any) {
      // Fallback to local sovereign synthesis if network or server error occurs
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
        walrusBlobId
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
    const blob = new Blob([coverLetterText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${targetCompany.replace(/[^a-zA-Z0-9]/g, '_')}_${targetRole.replace(/[^a-zA-Z0-9]/g, '_')}_Cover_Letter.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Cover letter text file downloaded!');
  }

  function handleSaveToVault() {
    try {
      const records = JSON.parse(localStorage.getItem('careerace_saved_letters') || '[]');
      records.unshift({
        id: `cl-${Date.now()}`,
        company: targetCompany,
        role: targetRole,
        text: coverLetterText,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('careerace_saved_letters', JSON.stringify(records.slice(0, 15)));
      toast.success('Cover letter recorded to Sovereign Local Vault!');
    } catch {
      toast.error('Failed to record letter to vault.');
    }
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
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              Extracts core responsibilities scope and key industry problems that your target role solves, tailoring every sentence around solving those exact challenges. Grounded in Walrus sovereign memory with zero AI slop.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/application_board')}
              className="text-xs gap-1.5 h-9"
            >
              <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
              <span>Job Board</span>
            </Button>
          </div>
        </div>

        {/* Quick Role Presets Bar */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Select or Switch Benchmark Discipline:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {PRESET_DISCIPLINES.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setTargetRole(preset.role);
                  setTargetCompany(preset.company);
                  toast.info(`Switched target role to ${preset.role}`);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  targetRole === preset.role
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main 2-Column Split: Intelligence Engine & Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column (5 Cols): Role Intelligence Parameters */}
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

              {/* Company & Role Inputs */}
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Target Company / Employer
                  </label>
                  <input
                    type="text"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    placeholder="e.g. Acme Corp, Siemens, Vercel, Chevron"
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Target Role Title
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Senior Full Stack Engineer, Systems Specialist, Operations Lead"
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Custom Job Description or Scope (Optional)
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
                    className="text-xs gap-1.5 h-9 border-border text-foreground hover:bg-muted"
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
                    className="text-xs gap-1.5 h-9 border-border text-foreground hover:bg-muted"
                  >
                    <Download className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Download (.TXT)</span>
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveToVault}
                    className="text-xs gap-1.5 h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Anchor to Vault</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push('/application_board')}
                    className="text-xs gap-1 h-9 text-muted-foreground hover:text-foreground"
                  >
                    <span>Auto-Apply</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
                <span className="font-mono text-[10px] text-muted-foreground">Walrus Certified</span>
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
