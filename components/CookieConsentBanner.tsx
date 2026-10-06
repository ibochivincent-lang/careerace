'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShieldCheck, Check, X, Settings2, Cookie, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface CookiePreferences {
  essential: boolean
  analytics: boolean
  marketing: boolean
  decided: boolean
  timestamp: string
}

export function CookieConsentBanner() {
  const [isOpen, setIsOpen] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false)
  const [marketingEnabled, setMarketingEnabled] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('careerace_cookie_consent')
      if (!stored) {
        // Delay slightly for smooth non-intrusive entrance
        const timer = setTimeout(() => setIsOpen(true), 1200)
        return () => clearTimeout(timer)
      }
    } catch {}
  }, [])

  function savePreferences(prefs: CookiePreferences) {
    try {
      localStorage.setItem('careerace_cookie_consent', JSON.stringify(prefs))
      // Dispatch custom event for telemetry gates
      window.dispatchEvent(new CustomEvent('careerace_consent_updated', { detail: prefs }))
    } catch {}
    setIsOpen(false)
  }

  function handleAcceptAll() {
    savePreferences({
      essential: true,
      analytics: true,
      marketing: true,
      decided: true,
      timestamp: new Date().toISOString(),
    })
  }

  function handleRejectNonEssential() {
    // Crucial GDPR compliance requirement: Clear "Reject" that disables all trackers
    savePreferences({
      essential: true,
      analytics: false,
      marketing: false,
      decided: true,
      timestamp: new Date().toISOString(),
    })
  }

  function handleSaveCustomPreferences() {
    savePreferences({
      essential: true,
      analytics: analyticsEnabled,
      marketing: marketingEnabled,
      decided: true,
      timestamp: new Date().toISOString(),
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-lg z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl text-foreground space-y-3.5 ring-1 ring-border/50">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Cookie className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                <span>Privacy &amp; Cookie Governance</span>
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Sovereign data principles · Zero tracking before consent
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRejectNonEssential}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Dismiss and Reject Non-Essential"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Text */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          CareerAce uses strictly essential cryptographic cookies for zkLogin authentication and decentralized Walrus memory vaults. We honor GDPR and CCPA: no advertising or performance trackers fire prior to explicit opt-in.
        </p>

        {/* Detailed Preferences Expander */}
        {showPreferences && (
          <div className="p-3 rounded-xl border border-border/70 bg-muted/30 space-y-2.5 text-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold block text-foreground">Strictly Essential</span>
                <span className="text-[10px] text-muted-foreground">zkLogin auth, cryptographic keys, Walrus cache</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-semibold">
                Always Required
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-border/50">
              <div>
                <span className="font-semibold block text-foreground">Performance &amp; Diagnostics</span>
                <span className="text-[10px] text-muted-foreground">Anonymous latency diagnostics and failover metrics</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={analyticsEnabled}
                  onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-border/50">
              <div>
                <span className="font-semibold block text-foreground">Marketing &amp; External Embeds</span>
                <span className="text-[10px] text-muted-foreground">Optional third-party demo video previews</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingEnabled}
                  onChange={(e) => setMarketingEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/60">
          <div className="flex items-center gap-2 text-[11px]">
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground underline underline-offset-2">
              Privacy
            </Link>
            <span>·</span>
            <Link href="/subprocessors" className="text-muted-foreground hover:text-foreground underline underline-offset-2">
              Subprocessors
            </Link>
            <span>·</span>
            <button
              type="button"
              onClick={() => setShowPreferences(!showPreferences)}
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>{showPreferences ? 'Hide Options' : 'Preferences'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* The Mandatory REJECT button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={showPreferences ? handleSaveCustomPreferences : handleRejectNonEssential}
              className="h-8 px-3 text-xs font-semibold border-border hover:bg-muted text-foreground cursor-pointer shadow-2xs"
            >
              {showPreferences ? 'Save Selected' : 'Reject Non-Essential'}
            </Button>

            {/* The ACCEPT button */}
            <Button
              type="button"
              size="sm"
              onClick={handleAcceptAll}
              className="h-8 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Accept All</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
