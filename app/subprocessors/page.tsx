import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Shield, Server, Database, Mail, Cpu, Globe2, CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Third-Party Subprocessors — CareerAce',
  description: 'Authorized infrastructure vendors, data hosting regions, and processing activities for CareerAce.',
}

interface SubprocessorEntry {
  name: string
  category: string
  purpose: string
  dataProcessed: string
  location: string
  transferMechanism: string
  entity: string
}

const SUBPROCESSORS: SubprocessorEntry[] = [
  {
    name: 'Mysten Labs (Walrus Protocol)',
    category: 'Decentralized Storage',
    purpose: 'Cryptographic storage and decentralized blob anchoring of user CV snapshots and verified credentials.',
    dataProcessed: 'Client-encrypted CV PDFs, STCW maritime licenses, and degree certificates.',
    location: 'Global Decentralized Node Network (Primary nodes: US, EU)',
    transferMechanism: 'Zero-Knowledge Client Encryption (Walrus Erasure-Coded Blobs)',
    entity: 'Mysten Labs, Inc. (Palo Alto, CA, USA)',
  },
  {
    name: 'Mysten Labs (Sui Blockchain)',
    category: 'Blockchain Ledger',
    purpose: 'Zero-knowledge authentication (zkLogin via Enoki) and immutable transaction attestation hashes.',
    dataProcessed: 'Public cryptographic wallet addresses and attestation transaction digests (zero plaintext PII).',
    location: 'Global Sui Validator Set',
    transferMechanism: 'ZK Proof Cryptographic Hashes (zkLogin)',
    entity: 'Mysten Labs, Inc. (Palo Alto, CA, USA)',
  },
  {
    name: 'Resend, Inc.',
    category: 'Email Dispatch Relay',
    purpose: 'Transactional transmission of candidate job applications, delivery receipts, and follow-up notices.',
    dataProcessed: 'Recipient hiring desk email, candidate email, cover letter text, and MIME PDF attachments.',
    location: 'United States & AWS Global Regions',
    transferMechanism: 'EU-US Data Privacy Framework / Standard Contractual Clauses (SCCs)',
    entity: 'Resend, Inc. (San Francisco, CA, USA)',
  },
  {
    name: 'Vercel, Inc.',
    category: 'Application Hosting & Edge CDN',
    purpose: 'Front-end web delivery, Edge Middleware routing, and serverless API execution.',
    dataProcessed: 'Transient IP addresses, HTTP request headers, and encrypted ephemeral session tokens.',
    location: 'United States & Global Edge Network',
    transferMechanism: 'EU-US Data Privacy Framework / Standard Contractual Clauses (SCCs)',
    entity: 'Vercel, Inc. (San Francisco, CA, USA)',
  },
  {
    name: 'Supabase, Inc.',
    category: 'State Database & Authentication',
    purpose: 'Candidate profile synchronization, application status tracking, and encrypted credentials backup.',
    dataProcessed: 'Account identifiers, application logs, target roles, and fit evaluation records.',
    location: 'AWS EU (Frankfurt) / US East',
    transferMechanism: 'GDPR Data Processing Addendum / ISO 27001 Certified Infrastructure',
    entity: 'Supabase, Inc. (Singapore / USA)',
  },
  {
    name: 'Google LLC (Google Cloud / Vertex AI)',
    category: 'AI Inference & OAuth',
    purpose: 'Google zkLogin OpenID Connect identity tokens and stateless ATS keyword compatibility evaluation.',
    dataProcessed: 'OAuth identity claims (name, email) and transient job description text (zero model training retention).',
    location: 'United States & European Union',
    transferMechanism: 'EU-US Data Privacy Framework / Zero-Data-Retention Enterprise AI Agreement',
    entity: 'Google LLC (Mountain View, CA, USA)',
  },
]

export default function SubprocessorsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-card border border-border/70 shadow-sm flex items-center justify-center p-1">
              <img src="/careerace_logo.png" alt="Career Ace Logo" className="w-full h-full object-contain dark:invert" />
            </div>
            <span className="font-bold text-lg">CareerAce</span>
          </Link>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/dpa" className="hover:text-foreground transition-colors">
              DPA
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-12 md:py-16 space-y-8">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
            <Server className="w-4 h-4" />
            <span>GDPR &amp; CCPA Compliance Disclosure</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Third-Party Subprocessors</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            In accordance with GDPR Article 28 and modern privacy governance standards, CareerAce publishes all authorized third-party vendors with access to infrastructure or processed user data.
          </p>
        </div>

        {/* Subprocessor Cards / Table */}
        <div className="space-y-4">
          {SUBPROCESSORS.map((sub) => (
            <div
              key={sub.name}
              className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs hover:border-primary/40 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">{sub.name}</h3>
                    <p className="text-xs font-mono text-muted-foreground">{sub.entity}</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-primary/10 text-primary self-start sm:self-auto">
                  {sub.category}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="font-semibold text-muted-foreground uppercase text-[10px] block">Purpose</span>
                  <p className="text-foreground leading-relaxed mt-0.5">{sub.purpose}</p>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground uppercase text-[10px] block">Data Processed</span>
                  <p className="text-foreground leading-relaxed mt-0.5">{sub.dataProcessed}</p>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground uppercase text-[10px] block">Hosting Region</span>
                  <p className="text-foreground leading-relaxed mt-0.5">{sub.location}</p>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground uppercase text-[10px] block">Transfer Mechanism</span>
                  <p className="text-foreground leading-relaxed mt-0.5 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                    {sub.transferMechanism}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Change Notification Notice */}
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-xs text-muted-foreground leading-relaxed space-y-1">
          <span className="font-bold text-foreground block">Subprocessor Updates &amp; Notifications</span>
          <p>
            CareerAce maintains strict vendor due diligence. In the event a new subprocessor is onboarded, notice will be posted to this page at least 14 days prior to processing. Business customers with an active Data Processing Agreement (DPA) may object within 10 days of notice.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        <p>CareerAce &copy; 2026. All rights reserved.</p>
      </footer>
    </div>
  )
}
