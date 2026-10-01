import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service — Career Ace',
  description: 'Terms of Service and platform usage agreements for Career Ace by IboTV.',
}

export default function TermsOfServicePage() {
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
          <FileText className="w-4 h-4" />
          <span>User Agreement & Terms</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last Updated: October 2026 | Author: IboTV</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Career Ace (available at <code>https://careerace.vercel.app</code>), you agree to be
              bound by these Terms of Service. If you do not agree to these terms, do not access or use the application.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">2. Description of Service</h2>
            <p>
              Career Ace is an autonomous artificial intelligence career guidance platform developed by IboTV. The service
              provides automated resume parsing, candidate skill extraction, job vacancy compatibility scoring, tailored CV
              and cover letter authoring, and simulated STAR+R interview preparation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">3. User Responsibilities & Conduct</h2>
            <p>When using Career Ace, you agree to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Upload only truthful, authentic, and accurate resumes, work history, and educational qualifications.</li>
              <li>Maintain the security of your session and connected authentication credentials.</li>
              <li>Not attempt to reverse engineer, disrupt, or launch denial-of-service attacks against Career Ace infrastructure.</li>
              <li>Not use the service to generate fraudulent, deceptive, or malicious job application materials.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">4. AI Advisory Disclaimer</h2>
            <p>
              Career Ace utilizes modern artificial intelligence models to assist candidates in analyzing job markets and optimizing
              resumes. All match scores, candidate fit evaluations, and interview feedback are provided for informational and
              preparatory purposes only.
            </p>
            <p>
              Career Ace does not guarantee employment offers, interview invitations, or specific hiring outcomes. Final recruitment
              decisions are determined exclusively by third-party hiring organizations and employers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">5. Intellectual Property Rights</h2>
            <p>
              The Career Ace brand, software architecture, UI components, logos, and underlying source code are the sole and
              exclusive intellectual property of IboTV (<code>ibochivincent-lang</code>).
            </p>
            <p>
              You retain all ownership and intellectual property rights to your original resume documents, uploaded portfolio
              assets, and personal career achievements.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">6. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, Career Ace and its creator IboTV shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages arising from your access to or inability to access
              the service, including but not limited to loss of employment opportunities or data discrepancies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">7. Modifications to Terms</h2>
            <p>
              We reserve the right to modify or replace these Terms at any time. Continued use of the platform after any changes
              constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">8. Inquiries & Support</h2>
            <p>
              For questions regarding these Terms of Service, please reach out to the developer:
            </p>
            <div className="p-4 rounded-lg border bg-card text-foreground font-mono text-xs">
              <p>Creator: IboTV (ibochivincent-lang)</p>
              <p>Contact: ibochivincent@gmail.com</p>
              <p>Domain: https://careerace.vercel.app</p>
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
