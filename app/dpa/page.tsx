import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck, FileText, CheckCircle2, Download } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Data Processing Agreement (DPA) — CareerAce',
  description: 'Standard Data Processing Agreement for enterprise customers, crewing partners, and employers.',
}

export default function DpaPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
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
            <Link href="/subprocessors" className="hover:text-foreground transition-colors">
              Subprocessors
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
      <main className="max-w-4xl mx-auto px-4 py-12 md:py-16 space-y-8">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>GDPR Article 28 · Business Customer Agreement</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Data Processing Agreement (DPA)</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            This Data Processing Agreement (&quot;DPA&quot;) governs the processing of personal data by CareerAce on behalf of enterprise employers, crewing agencies, and recruitment teams (&quot;Customer&quot;).
          </p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-3 p-5 rounded-2xl border bg-card/60">
            <h2 className="text-base font-bold text-foreground">1. Scope and Applicability</h2>
            <p>
              This DPA applies to the extent CareerAce processes Personal Data subject to the General Data Protection Regulation (GDPR), UK GDPR, or California Consumer Privacy Act (CCPA) on behalf of Customer in connection with candidate verification, CV dispatch processing, and application management.
            </p>
          </section>

          <section className="space-y-3 p-5 rounded-2xl border bg-card/60">
            <h2 className="text-base font-bold text-foreground">2. Roles of the Parties</h2>
            <p>
              The parties acknowledge that Customer is the <strong>Data Controller</strong> (or Business) and CareerAce acts as the <strong>Data Processor</strong> (or Service Provider). CareerAce will process Personal Data solely in accordance with Customer&apos;s documented instructions and the CareerAce Terms of Service.
            </p>
          </section>

          <section className="space-y-3 p-5 rounded-2xl border bg-card/60">
            <h2 className="text-base font-bold text-foreground">3. Security Measures &amp; Technical Safeguards</h2>
            <p>CareerAce maintains rigorous technical and organizational measures (TOMs) to protect Personal Data, including:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>End-to-end client encryption using AES-256-GCM prior to Walrus decentralized storage anchoring.</li>
              <li>Zero-knowledge authentication rails (zkLogin) eliminating centralized password compromises.</li>
              <li>Transport Layer Security (TLS 1.3) with mandatory HTTP Strict Transport Security (HSTS).</li>
              <li>Role-based access controls, audit logging, and automated secret detection across continuous integration.</li>
            </ul>
          </section>

          <section className="space-y-3 p-5 rounded-2xl border bg-card/60">
            <h2 className="text-base font-bold text-foreground">4. Subprocessor Governance</h2>
            <p>
              Customer grants general written authorization to CareerAce to engage the subprocessors listed on our public <Link href="/subprocessors" className="text-primary underline">Subprocessors Registry</Link>. CareerAce enforces contractual obligations on every subprocessor equivalent to those in this DPA.
            </p>
          </section>

          <section className="space-y-3 p-5 rounded-2xl border bg-card/60">
            <h2 className="text-base font-bold text-foreground">5. Data Subject Rights &amp; Assistance</h2>
            <p>
              CareerAce provides automated self-serve tools enabling Customers and candidates to execute their rights under GDPR Articles 15–22 (Right of access, rectification, erasure, and data portability). CareerAce will notify Customer within 48 hours of receiving a direct data subject inquiry relating to Customer data.
            </p>
          </section>

          <section className="space-y-3 p-5 rounded-2xl border bg-card/60">
            <h2 className="text-base font-bold text-foreground">6. Security Incident &amp; Breach Notification</h2>
            <p>
              In the unlikely event of a confirmed Personal Data Breach affecting Customer data, CareerAce will notify Customer without undue delay and within 72 hours of becoming aware of the incident, providing detailed remediation actions.
            </p>
          </section>

          <section className="space-y-3 p-5 rounded-2xl border bg-card/60">
            <h2 className="text-base font-bold text-foreground">7. Deletion and Return of Personal Data</h2>
            <p>
              Upon termination of services or upon Customer request, CareerAce will delete or return all Customer Personal Data within thirty (30) days, except where retention is strictly mandated by applicable maritime or tax regulatory statutes.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        <p>CareerAce &copy; 2026. All rights reserved.</p>
      </footer>
    </div>
  )
}
