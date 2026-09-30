"use client"

import { Briefcase } from "lucide-react"

export function ChatdeckFooter() {
  return (
    <footer className="border-t bg-background py-12 text-sm text-muted-foreground">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
            <Briefcase className="w-4 h-4" />
          </div>
          <span className="font-bold text-foreground">Career Ace</span>
        </div>
        <p className="text-xs text-center md:text-left">
          Created exclusively by IboTV (<code className="text-xs font-mono">ibochivincent-lang</code>). All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-xs">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#cv-upload" className="hover:text-foreground">CV Upload</a>
          <a href="#jobs" className="hover:text-foreground">Job Matcher</a>
        </div>
      </div>
    </footer>
  )
}
