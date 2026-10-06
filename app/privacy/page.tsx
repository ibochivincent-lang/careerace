import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy — Career Ace',
  description: 'Privacy Policy and data governance standards for Career Ace by IboTV.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-card border border-border/70 shadow-sm flex items-center justify-center p-1">
              <img src="/careerace_logo.png" alt="Career Ace Logo" className="w-full h-full object-contain dark:invert" />
            </div>
            <span className="font-bold text-lg">Career Ace</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
          <Shield className="w-4 h-4" />
          <span>Data Governance & Privacy</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last Updated: October 2026 | Author: IboTV</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">1. Overview</h2>
            <p>
              Career Ace is an autonomous AI career copilot, resume tailoring system, and candidate fit evaluation engine
              architected and developed exclusively by IboTV (<code>ibochivincent-lang</code>). We are committed to
              protecting your personal and professional data with absolute transparency, user sovereignty, and zero third-party
              data monetization.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">2. Information We Collect</h2>
            <p>We collect only the information strictly necessary to provide intelligent career guidance and evaluation:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Authentication Details:</strong> When you sign in with Google via Enoki zkLogin,
                we receive your basic Google profile identifier (name and email) strictly to verify your identity and anchor your
                cryptographic Sui account. We never access, store, or solicit your Google account password.
              </li>
              <li>
                <strong className="text-foreground">Curriculum Vitae (CV) & Resume Content:</strong> When you upload a resume
                (PDF, DOCX, or text), our parsing pipeline extracts technical competencies, work history, educational milestones,
                and career achievements to generate match recommendations.
              </li>
              <li>
                <strong className="text-foreground">Application & Interview Records:</strong> Records of role evaluations,
                tailored cover letters, application statuses, and mock STAR+R interview responses.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">3. How Your Information Is Used</h2>
            <p>All data collected is utilized solely to power your Career Ace features:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Evaluating candidate fit score (1–10) across live market opportunities.</li>
              <li>Generating tailored resume impact points and bespoke cover letters.</li>
              <li>Conducting interactive post-application STAR+R interview coaching simulations.</li>
              <li>Encrypting and syncing your sovereign career memory vault to your decentralized address.</li>
            </ul>
            <p>
              We do <strong className="text-foreground">not</strong> sell, rent, license, or monetize your resume,
              identity, or contact information to data brokers, advertising platforms, or external recruitment agencies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">4. Cryptographic Storage & Walrus Memory</h2>
            <p>
              Career Ace integrates decentralized Walrus Memory under your Sui zkLogin key. Data persisted to the decentralized
              network is threshold-encrypted before leaving your client environment. Centralized platform administrators have no
              ability to inspect or monetize your private encrypted career vault.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">5. Third-Party Integrations &amp; Subprocessors</h2>
            <p>
              CareerAce partners with vetted infrastructure providers under strict Data Processing Addendums. A complete, regularly maintained list of authorized vendors, hosting locations, and data processing scopes is available on our dedicated <Link href="/subprocessors" className="text-primary underline">Subprocessors Registry</Link>.
            </p>
            <p>
              For enterprise customers, recruiting teams, and corporate partners, our standard GDPR Article 28 <Link href="/dpa" className="text-primary underline">Data Processing Agreement (DPA)</Link> is incorporated by reference.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">6. Data Deletion, Export &amp; User Rights (GDPR &amp; CCPA)</h2>
            <p>
              Under GDPR (Articles 15–20) and CCPA, you retain absolute sovereignty over your career records:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-foreground">Right to Portability &amp; Export:</strong> You can download a complete, machine-readable JSON archive of your parsed profile, tailored resumes, and application records directly in the CareerAce Settings panel.</li>
              <li><strong className="text-foreground">Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> You can permanently wipe your local storage cache, clear cloud synchronization, and disconnect your Sui zkLogin session with one click in the Settings console.</li>
              <li><strong className="text-foreground">Zero Tracking Before Consent:</strong> We enforce strict opt-in consent for non-essential cookies. You can update or reject non-essential cookies at any time via the Cookie Preferences banner.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">7. Contact Information</h2>
            <p>
              If you have any questions or data privacy inquiries regarding Career Ace, please contact the developer:
            </p>
            <div className="p-4 rounded-lg border bg-card text-foreground font-mono text-xs">
              <p>Developer: IboTV (ibochivincent-lang)</p>
              <p>Support Email: ibochivincent@gmail.com</p>
              <p>Platform: https://careerace.online</p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        <p>Career Ace &copy; 2026 by IboTV. All rights reserved.</p>
      </footer>
    </div>
  )
}
