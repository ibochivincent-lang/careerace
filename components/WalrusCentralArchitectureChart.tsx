'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Database,
  FileText,
  Briefcase,
  Bot,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Lock,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Zap,
  Layers,
  Globe,
} from 'lucide-react'

interface ArchitectureNode {
  id: string
  title: string
  shortLabel: string
  category: string
  icon: any
  color: string
  description: string
  syncDetails: string[]
  storageModel: string
  securityGuarantee: string
}

const NODES: ArchitectureNode[] = [
  {
    id: 'cv_vault',
    title: '1. Candidate CV & Sovereign Credentials Vault',
    shortLabel: 'CV & Credentials',
    category: 'Decentralized Vault',
    icon: FileText,
    color: 'emerald',
    description: 'Your primary curriculum vitae, specialized certifications, STCW maritime licenses, and academic degree proofs are parsed, encrypted, and committed to Walrus blobs.',
    syncDetails: [
      'Encrypted client-side with AES-256-GCM before transmission',
      'Assigned permanent, content-addressed Walrus Blob ID (e.g. 5x7f...89a)',
      'Deterministic Sui Move onchain anchor binds blob digest to your sovereign address',
      'Downloadable as standard ATS-compliant PDF 1.4 at any time',
    ],
    storageModel: 'Content-Addressed Walrus Blob Storage (@mysten/walrus)',
    securityGuarantee: 'Zero corporate platform lock-in. You hold the private cryptographic keys.',
  },
  {
    id: 'job_board',
    title: '2. Job Board, Auto-Apply & Cooldown Engine',
    shortLabel: 'Job Board & Cooldowns',
    category: 'Application Submissions',
    icon: Briefcase,
    color: 'teal',
    description: 'Tracks every job application dispatched, anti-spam pacing intervals, recruiter crewing desks, and the active 7-day cooldown schedule directly in memory.',
    syncDetails: [
      'Dispatched records logged with company name, target role, and RFC-5322 Message-ID',
      '7-day anti-spam cooldown schedule auto-calculated per employer crewing desk',
      'Daily dispatch quota tracking ensures respectful, non-blacklisted outreach rate',
      'Full delivery receipts (.eml) and calendar follow-ups (.ics) synchronized',
    ],
    storageModel: 'Walrus Persistent State Namespace (@mysten-incubation/memwal)',
    securityGuarantee: 'Tamper-proof dispatch ledger. Transparent hiring desk auditability.',
  },
  {
    id: 'copilot_memory',
    title: '3. AI Copilot Inquiries & Factual Recall',
    shortLabel: 'AI Copilot Memory',
    category: 'Conversational Memory',
    icon: Bot,
    color: 'blue',
    description: 'Every inquiry you make, role question you ask, and recruiter prompt you explore is indexed into Walrus memory so the chatbot remembers facts without hallucinating.',
    syncDetails: [
      'Cross-session memory allows the AI agent to remember your actual years of experience',
      'Semantic embeddings query Walrus memory without leaking unredacted PII',
      'Answers interview prep and company inquiries using verified facts from your vault',
      'Eliminates repetitive re-prompting across multiple sessions and devices',
    ],
    storageModel: 'Vector & Key-Value Memory Layer (MemWal Namespaces)',
    securityGuarantee: 'Zero training on third-party public models without explicit authorization.',
  },
  {
    id: 'resume_assistant',
    title: '4. AI Resume Assistant & Version Snapshots',
    shortLabel: 'Resume Assistant',
    category: 'Version Control',
    icon: Sparkles,
    color: 'amber',
    description: 'Tailored variations, Google XYZ formula metric upgrades, and ATS benchmark scores are saved as immutable version snapshots (v1, v2, v3) on Walrus.',
    syncDetails: [
      'Maintains strict audit trail of tailored CV iterations across industries',
      'Candidate can roll back or branch any previous snapshot with 1 click',
      'Recruiters receive a clean snapshot link with verified creation timestamp',
      'Allows switching between general software, AI systems, and maritime licenses',
    ],
    storageModel: 'Versioned Immutable Walrus Blob Snapshots',
    securityGuarantee: 'Immutable timestamping. Prevents accidental loss or overwrite.',
  },
  {
    id: 'multidevice_passport',
    title: '5. Universal Multi-Device Sovereign Passport',
    shortLabel: 'Multi-Device Access',
    category: 'Device Portability',
    icon: Smartphone,
    color: 'purple',
    description: 'Access your sovereign career records from any phone, laptop, or new browser. Authenticate with Sui zkLogin (Google) and your private memory rehydrates instantly.',
    syncDetails: [
      'Zero-knowledge authentication requires no password or centralized username database',
      'Seamless synchronization across mobile browsers, desktop IDEs, and hiring portals',
      'Data never lives on an unencrypted third-party central server',
      'Deterministic address derivation ensures only you can decrypt your vault',
    ],
    storageModel: 'Zero-Knowledge Sui zkLogin Identity + Walrus Decentralized Network',
    securityGuarantee: '100% device-agnostic, portable, and permanently accessible worldwide.',
  },
]

export function WalrusCentralArchitectureChart() {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('cv_vault')
  const [isSimulatingSync, setIsSimulatingSync] = useState<boolean>(false)

  const activeNode = NODES.find((n) => n.id === selectedNodeId) || NODES[0]

  function triggerSyncSimulation() {
    setIsSimulatingSync(true)
    setTimeout(() => {
      setIsSimulatingSync(false)
    }, 1500)
  }

  return (
    <div className="w-full pb-10">
      <div className="space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3.5">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <Database className="w-3.5 h-3.5" />
            <span>Centralized Walrus Sovereign Memory Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            How data synchronizes into your decentralized career memory.
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Every action, CV snapshot, application dispatch, and AI copilot inquiry converges into a centralized, client-side encrypted Walrus memory hub. 100% safe, permanently available, and fully portable across devices.
          </p>
        </div>

        {/* Central Architecture Interactive Diagram Container (Strict Equal Height on Same Line) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Visual Hub & Spoke Interactive Canvas (7 Cols) */}
          <div className="lg:col-span-7 bg-card/70 border border-border/80 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden backdrop-blur h-full flex flex-col justify-between">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-emerald-500/10 rounded-full blur-[90px] pointer-events-none" />

            <div className="flex items-center justify-between pb-4 border-b border-border/60 mb-6 h-11 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs sm:text-sm font-bold text-foreground">Active Topology Visualizer</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={triggerSyncSimulation}
                disabled={isSimulatingSync}
                className="h-7 text-[11px] gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isSimulatingSync ? 'animate-spin' : ''}`} />
                <span>{isSimulatingSync ? 'Synchronizing Blobs...' : 'Simulate Live Sync'}</span>
              </Button>
            </div>

            {/* Hub in Center + Spoke Grid */}
            <div className="space-y-6">
              {/* Central Glowing Hub */}
              <div className="p-6 rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent text-center space-y-2 relative shadow-lg shadow-emerald-500/10">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <Database className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <Badge variant="secondary" className="text-[10px] uppercase font-mono tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/30">
                    Central Core Storage
                  </Badge>
                  <h3 className="text-lg font-bold text-foreground mt-1">Walrus Sovereign Memory Vault</h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    @mysten/walrus · @mysten-incubation/memwal · AES-256-GCM
                  </p>
                </div>
              </div>

              {/* Connecting Pulse Indicator */}
              <div className="text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 border border-border text-[10px] font-mono text-muted-foreground">
                  <RefreshCw className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span>Real-Time Bi-Directional Synchronization Bus</span>
                </span>
              </div>

              {/* Surrounding 5 Spoke Nodes + 1 Security Guard (Equal Heights) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
                {NODES.map((node) => {
                  const Icon = node.icon
                  const isSelected = selectedNodeId === node.id

                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-full ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10 shadow-md ring-1 ring-emerald-500/30'
                          : 'border-border/80 bg-background/50 hover:bg-muted/40 hover:border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-muted border border-border text-foreground'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-foreground block">{node.shortLabel}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{node.category}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping mt-1" />
                        )}
                      </div>

                      <div className="pt-2.5 mt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="truncate">{node.storageModel.split(' ')[0]}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                          Inspect <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </button>
                  )
                })}

                {/* 6th Tile: Security Pillar */}
                <div className="p-3.5 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/[0.03] flex flex-col justify-between text-left h-full">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-foreground block">Zero-Knowledge Guard</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">100% Client Encrypted</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-2">
                    No third party, recruiter, or central cloud can decrypt your raw lineage without your key.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Node Detail & Technical Inspector (5 Cols, Equal Height to Left Column) */}
          <div className="lg:col-span-5 h-full flex flex-col">
            <Card className="p-6 sm:p-8 border border-border bg-card rounded-2xl shadow-xl h-full flex flex-col justify-between space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-border/60 mb-1 h-11 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <activeNode.icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-emerald-600 uppercase font-semibold block leading-tight">Subsystem Inspector</span>
                    <h4 className="text-xs sm:text-sm font-bold text-foreground leading-tight">{activeNode.shortLabel}</h4>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 font-mono">
                  SYNCHRONIZED
                </Badge>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider block">Overview</span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {activeNode.description}
                </p>
              </div>

              {/* Synchronization Details Checklist */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider block">
                  Data Synchronization Mechanics
                </span>
                <div className="space-y-1.5">
                  {activeNode.syncDetails.map((detail, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-foreground/90">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="leading-snug">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Protocol Specs Box */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-2 font-mono text-[11px]">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Storage Architecture:</span>
                  <span className="text-foreground font-semibold">{activeNode.storageModel}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Privacy &amp; Security Protocol:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{activeNode.securityGuarantee}</span>
                </div>
              </div>

              {/* Value Proposition Strip */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  The Sovereign Advantage:
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  When you change devices or apply to new opportunities, your career credentials remain unbroken, verifiable, and completely under your personal command.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
