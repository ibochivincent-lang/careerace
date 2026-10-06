"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FeedbackModal } from '@/components/FeedbackModal'
import { MessageSquare, ExternalLink } from 'lucide-react'

export function ChatdeckFooter() {
  const router = useRouter()
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  return (
    <>
      <footer className="relative overflow-hidden border-t border-border/80 bg-background py-16 text-muted-foreground">
        {/* ── Relocated Emerald Botanical Crystal Background Graphic ── */}
        <div
          className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 bg-cover bg-center sm:bg-top bg-no-repeat opacity-40 dark:opacity-25 transition-opacity duration-700"
            style={{
              backgroundImage: "url('/hero-bg-green.webp')",
              WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 20%, rgba(0,0,0,0.95) 80%, rgba(0,0,0,0) 100%)",
              maskImage: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 20%, rgba(0,0,0,0.95) 80%, rgba(0,0,0,0) 100%)"
            }}
          />
          {/* Luminous emerald glow radial gradient for rich footer depth */}
          <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.14),rgba(5,150,105,0.04),transparent_70%)] blur-[100px] pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Brand info & Social links on one side */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-card border border-border/70 shadow-sm flex items-center justify-center p-1">
                  <img src="/careerace_logo.png" alt="Career Ace Logo" className="w-full h-full object-contain dark:invert" />
                </div>
                <span className="font-bold text-base text-foreground">Career Ace</span>
              </div>
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                Confident professional profiles, built with decentralized Walrus Sovereign Memory and reverse-engineered ATS intelligence.
              </p>

              {/* Verified Social Media Channels */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider block">
                  Official Channels
                </span>
                <div className="flex items-center gap-2.5">
                  <a
                    href="https://x.com/CareerAceps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 text-xs font-semibold"
                    title="Follow Career Ace on X (Twitter)"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    <span>@CareerAceps</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </a>

                  <a
                    href="https://medium.com/@careerace"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 text-xs font-semibold"
                    title="Read Career Ace on Medium"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/>
                    </svg>
                    <span>Medium</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </a>
                </div>
              </div>

              <p className="text-xs text-muted-foreground/60 font-mono pt-1">
                &copy; 2026 Career Ace. All rights reserved.
              </p>
            </div>

            {/* Links side in 2x2 grid format (Product, Use Cases, Community & Support, Legal) */}
            <div className="lg:col-span-7 grid grid-cols-2 gap-8">
              {/* Product links */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground text-xs tracking-tight">Product</h4>
                <ul className="space-y-2">
                  <li><a href="#features" className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block">Features</a></li>
                  <li><a href="#architecture" className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block">Walrus Architecture</a></li>
                  <li><a href="#roadmap" className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block">Roadmap &amp; Frontiers</a></li>
                  <li><a href="/pricing" className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block">Pricing</a></li>
                  <li><button type="button" onClick={() => router.push('/dashboard?tab=resumes')} className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block text-left bg-transparent p-0 border-0 cursor-pointer">Resume Editor</button></li>
                  <li><button type="button" onClick={() => router.push('/memory')} className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block text-left bg-transparent p-0 border-0 cursor-pointer">Walrus Vault</button></li>
                </ul>
              </div>

              {/* Use Cases */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground text-xs tracking-tight">Use Cases</h4>
                <ul className="space-y-2">
                  <li><button type="button" onClick={() => router.push('/dashboard?tab=resumes')} className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block text-left bg-transparent p-0 border-0 cursor-pointer">Resume Optimizer</button></li>
                  <li><button type="button" onClick={() => router.push('/dashboard?tab=tailored')} className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block text-left bg-transparent p-0 border-0 cursor-pointer">Resume Tailoring</button></li>
                  <li><button type="button" onClick={() => router.push('/dashboard?tab=overview')} className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block text-left bg-transparent p-0 border-0 cursor-pointer">ATS Checker</button></li>
                  <li><button type="button" onClick={() => router.push('/cover_letter')} className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block text-left bg-transparent p-0 border-0 cursor-pointer">Cover Letters</button></li>
                  <li><button type="button" onClick={() => router.push('/interview_room')} className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block text-left bg-transparent p-0 border-0 cursor-pointer">Mock Interviews</button></li>
                </ul>
              </div>

              {/* Community & Feedback */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground text-xs tracking-tight">Community &amp; Support</h4>
                <ul className="space-y-2">
                  <li>
                    <button
                      type="button"
                      onClick={() => setFeedbackOpen(true)}
                      className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline transition-colors leading-relaxed flex items-center gap-1.5 text-left bg-transparent p-0 border-0 cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Send User Feedback</span>
                    </button>
                  </li>
                  <li><a href="mailto:support@careerace.online" className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block">Help Center</a></li>
                  <li><a href="mailto:contact@careerace.online" className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block">Contact Support</a></li>
                  <li><button type="button" onClick={() => router.push('/progress')} className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block text-left bg-transparent p-0 border-0 cursor-pointer">Accomplishments</button></li>
                  <li><a href="https://walrus.xyz" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block">Walrus Network</a></li>
                </ul>
              </div>

              {/* Legal & Privacy */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground text-xs tracking-tight">Legal &amp; Privacy</h4>
                <ul className="space-y-2">
                  <li><button type="button" onClick={() => router.push('/privacy')} className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block text-left bg-transparent p-0 border-0 cursor-pointer">Privacy Policy</button></li>
                  <li><button type="button" onClick={() => router.push('/terms')} className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-relaxed block text-left bg-transparent p-0 border-0 cursor-pointer">Terms of Service</button></li>
                  <li><span className="text-xs text-muted-foreground/60 leading-relaxed block">Zero-Knowledge Isolation</span></li>
                  <li><span className="text-xs text-muted-foreground/60 leading-relaxed block">Client-Side Encrypted</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Global Feedback Modal */}
      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  )
}
