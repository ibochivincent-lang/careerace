"use client"

import { useRouter } from 'next/navigation'

export function ChatdeckFooter() {
  const router = useRouter()

  return (
    <footer className="border-t border-border/80 bg-background py-16 text-sm text-muted-foreground">
      <div className="max-w-7xl mx-auto px-4 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-card border border-border/70 shadow-sm flex items-center justify-center p-1">
                <img src="/careerace_logo.png" alt="Career Ace Logo" className="w-full h-full object-contain dark:invert" />
              </div>
              <span className="font-bold text-lg text-foreground">Career Ace</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
              Confident professional profiles, built with decentralized Walrus Sovereign Memory and reverse-engineered ATS intelligence.
            </p>
            <p className="text-[11px] text-muted-foreground/60 font-mono">
              &copy; 2026 Career Ace. All rights reserved. Built for Walrus Hackathon.
            </p>
          </div>

          {/* Product links */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">Product</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a></li>
              <li><button onClick={() => router.push('/dashboard?tab=resumes')} className="hover:text-foreground transition-colors text-left">Resume Editor</button></li>
              <li><button onClick={() => router.push('/application_board')} className="hover:text-foreground transition-colors text-left">Job Harvester</button></li>
              <li><button onClick={() => router.push('/memory')} className="hover:text-foreground transition-colors text-left">Walrus Vault</button></li>
            </ul>
          </div>

          {/* Use Cases */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">Use Cases</h4>
            <ul className="space-y-2">
              <li><button onClick={() => router.push('/dashboard?tab=resumes')} className="hover:text-foreground transition-colors text-left">Resume Optimizer</button></li>
              <li><button onClick={() => router.push('/dashboard?tab=tailored')} className="hover:text-foreground transition-colors text-left">Resume Tailoring</button></li>
              <li><button onClick={() => router.push('/dashboard?tab=overview')} className="hover:text-foreground transition-colors text-left">ATS Checker</button></li>
              <li><button onClick={() => router.push('/dashboard?tab=cover_letters')} className="hover:text-foreground transition-colors text-left">Cover Letters</button></li>
              <li><button onClick={() => router.push('/interview_room')} className="hover:text-foreground transition-colors text-left">Mock Interviews</button></li>
            </ul>
          </div>

          {/* Company & Support */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">Support</h4>
            <ul className="space-y-2">
              <li><a href="mailto:support@careerace.online" className="hover:text-foreground transition-colors">Help Center</a></li>
              <li><a href="mailto:contact@careerace.online" className="hover:text-foreground transition-colors">Contact Support</a></li>
              <li><button onClick={() => router.push('/progress')} className="hover:text-foreground transition-colors text-left">Accomplishments</button></li>
              <li><a href="https://walrus.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Walrus Network</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">Legal</h4>
            <ul className="space-y-2">
              <li><button onClick={() => router.push('/privacy')} className="hover:text-foreground transition-colors text-left">Privacy Policy</button></li>
              <li><button onClick={() => router.push('/terms')} className="hover:text-foreground transition-colors text-left">Terms of Service</button></li>
              <li><span className="text-muted-foreground/60">Zero-Knowledge Isolation</span></li>
              <li><span className="text-muted-foreground/60">Client-Side Encrypted</span></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}
