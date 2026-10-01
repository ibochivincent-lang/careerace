"use client"

import { Briefcase } from "lucide-react"

export function ChatdeckFooter() {
  return (
    <footer className="border-t bg-background py-12 text-sm text-muted-foreground">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-card border border-border/70 shadow-sm flex items-center justify-center p-1">
            <img src="/careerace_logo.png" alt="Career Ace Logo" className="w-full h-full object-contain dark:invert" />
          </div>
          <span className="font-bold text-foreground">Career Ace</span>
        </div>
        <p className="text-xs text-center md:text-left">
          Created exclusively by IboTV (<code className="text-xs font-mono">ibochivincent-lang</code>). All rights reserved.
        </p>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#cv-upload" className="hover:text-foreground">CV Upload</a>
          <a href="#jobs" className="hover:text-foreground">Job Matcher</a>
          <a href="/privacy" className="hover:text-foreground">Privacy Policy</a>
          <a href="/terms" className="hover:text-foreground">Terms of Service</a>
        </div>
      </div>
    </footer>
  )
}
