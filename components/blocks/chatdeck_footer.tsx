"use client"

import { useRouter } from 'next/navigation'

export function ChatdeckFooter() {
  const router = useRouter()

  return (
    <footer className="border-t border-border/80 bg-background py-16 text-muted-foreground">
      <div className="max-w-7xl mx-auto px-4 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-card border border-border/70 shadow-sm flex items-center justify-center p-1">
                <img src="/careerace_logo.png" alt="Career Ace Logo" className="w-full h-full object-contain dark:invert" />
              </div>
              <span className="font-bold text-base text-foreground">Career Ace</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
              Confident professional profiles, built with decentralized Walrus Sovereign Memory and reverse-engineered ATS intelligence.
            </p>
            <p className="text-xs text-muted-foreground/60 font-mono">
              &copy; 2026 Career Ace. All rights reserved.
            </p>
          </div>

          {/* Product links */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground text-xs tracking-tight">Product</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block">Features</a></li>
              <li><a href="#how-it-works" className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block">How it works</a></li>
              <li><a href="#pricing" className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block">Pricing</a></li>
              <li><button type="button" onClick={() => router.push('/dashboard?tab=resumes')} className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block text-left bg-transparent p-0 border-0">Resume Editor</button></li>
              <li><button type="button" onClick={() => router.push('/memory')} className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block text-left bg-transparent p-0 border-0">Walrus Vault</button></li>
            </ul>
          </div>

          {/* Use Cases */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground text-xs tracking-tight">Use Cases</h4>
            <ul className="space-y-2">
              <li><button type="button" onClick={() => router.push('/dashboard?tab=resumes')} className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block text-left bg-transparent p-0 border-0">Resume Optimizer</button></li>
              <li><button type="button" onClick={() => router.push('/dashboard?tab=tailored')} className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block text-left bg-transparent p-0 border-0">Resume Tailoring</button></li>
              <li><button type="button" onClick={() => router.push('/dashboard?tab=overview')} className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block text-left bg-transparent p-0 border-0">ATS Checker</button></li>
              <li><button type="button" onClick={() => router.push('/dashboard?tab=cover_letters')} className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block text-left bg-transparent p-0 border-0">Cover Letters</button></li>
              <li><button type="button" onClick={() => router.push('/interview_room')} className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block text-left bg-transparent p-0 border-0">Mock Interviews</button></li>
            </ul>
          </div>

          {/* Company & Support */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground text-xs tracking-tight">Support</h4>
            <ul className="space-y-2">
              <li><a href="mailto:support@careerace.online" className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block">Help Center</a></li>
              <li><a href="mailto:contact@careerace.online" className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block">Contact Support</a></li>
              <li><button type="button" onClick={() => router.push('/progress')} className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block text-left bg-transparent p-0 border-0">Accomplishments</button></li>
              <li><a href="https://walrus.xyz" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block">Walrus Network</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground text-xs tracking-tight">Legal</h4>
            <ul className="space-y-2">
              <li><button type="button" onClick={() => router.push('/privacy')} className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block text-left bg-transparent p-0 border-0">Privacy Policy</button></li>
              <li><button type="button" onClick={() => router.push('/terms')} className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block text-left bg-transparent p-0 border-0">Terms of Service</button></li>
              <li><span className="text-xs text-muted-foreground/60 leading-relaxed block">Zero-Knowledge Isolation</span></li>
              <li><span className="text-xs text-muted-foreground/60 leading-relaxed block">Client-Side Encrypted</span></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}
