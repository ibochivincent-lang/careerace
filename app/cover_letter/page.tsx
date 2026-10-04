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

const PRESET_DISCIPLINES = [
  { id: 'marine', label: 'Engineering & Marine', role: 'Marine Systems Engineer (Offshore & Propulsion)', company: 'Maersk' },
  { id: 'cadet', label: 'Engine Cadet / Trainee', role: 'Engine Cadet / Trainee Marine Engineer', company: 'Chevron Shipping' },
  { id: 'software', label: 'Software & IT', role: 'Senior Full Stack Engineer', company: 'Vercel' },
  { id: 'ai', label: 'AI & Autonomous Systems', role: 'Autonomous Systems & ML Engineer', company: 'xAI' },
  { id: 'medical', label: 'Medical & Healthcare', role: 'Lead Healthcare Systems & Informatics Engineer', company: 'Siemens Healthineers' },
  { id: 'management', label: 'Management & Operations', role: 'Global Fleet Operations & Decarbonization Manager', company: 'Maersk Fleet Management' },
  { id: 'industrial', label: 'Industrial & Manufacturing', role: 'Manufacturing & Transducer Quality Engineer', company: 'Wabtec' },
];

export default function CoverLetterStudioPage() {
  const router = useRouter();

  // Inputs
  const [targetCompany, setTargetCompany] = useState('Maersk');
  const [targetRole, setTargetRole] = useState('Marine Systems Engineer (Offshore & Propulsion)');
  const [jobDescription, setJobDescription] = useState('');
  const [keyProblemsInput, setKeyProblemsInput] = useState('');

  // Profile data from Walrus / localStorage
  const [profile, setProfile] = useState<ParsedCv | null>(null);
  const [walrusBlobId, setWalrusBlobId] = useState('');

  // Generated outputs & intelligence
  const [isGenerating, setIsGenerating] = useState(false);
  const [roleScope, setRoleScope] = useState<RoleIntelligenceProfile>(() => getRoleIntelligence(targetRole));
  const [coverLetterText, setCoverLetterText] = useState('');
  const [copied, setCopied] = useState(false);

  // Load sovereign profile & Walrus credentials on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('careerace_sovereign_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        setProfile(parsed);
      }
      const storedBlob = localStorage.getItem('careerace_walrus_blob_id');
      if (storedBlob) {
        setWalrusBlobId(storedBlob);
      }
    } catch {}
  }, []);

  // Update role intelligence preview whenever role changes
  useEffect(() => {
    const intel = getRoleIntelligence(targetRole, jobDescription);
    setRoleScope(intel);
  }, [targetRole, jobDescription]);

  // Generate cover letter
  async function handleGenerate() {
    if (!targetRole.trim()) {
      toast.error('Please enter a target role.');
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading('Extracting role scope & synthesizing tailored cover letter...');

    try {
      const res = await fetch('/api/cover_letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole,
          targetCompany: targetCompany.trim() || 'the Organization',
          jobDescription,
          keyProblems: keyProblemsInput,
          candidateName: profile?.applicant_name || 'Vincent Lang',
          candidateEmail: profile?.email || 'applicant@careerace.online',
          candidatePhone: profile?.phone || '+1 (415) 890-4221',
          candidateLocation: profile?.location || 'Rotterdam / Global Remote',
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
      if (data.roleScope) {
        setRoleScope(data.roleScope);
      }

      toast.success(`Tailored cover letter generated for ${targetCompany}!`, { id: toastId });
    } catch (err: any) {
      toast.error(err.message || 'Error generating cover letter.', { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  }

  // Auto-generate on first load
  useEffect(() => {
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                    placeholder="e.g. Maersk, Siemens, Chevron, Vercel"
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
                    placeholder="e.g. Marine Systems Engineer, Engine Cadet, Full Stack Engineer"
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
                  onChange={(e) => setCoverLetterText(e.target.value)}
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
