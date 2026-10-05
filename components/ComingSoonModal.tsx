'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Compass, Target, Bell, Check, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export type ComingSoonFeature = 'career_pathway' | 'interview_room' | 'linkedin'

interface ComingSoonConfig {
  title: string
  subtitle: string
  badge: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const FEATURE_CONFIGS: Record<ComingSoonFeature, ComingSoonConfig> = {
  career_pathway: {
    title: 'Career Pathway',
    subtitle: 'Verifiable Career Milestone Progression',
    badge: 'In Development',
    description:
      'Autonomous milestone tracking and compensation roadmaps are being integrated with on-chain Sui credentials. Candidates will be able to map verified skills directly against promotion criteria and industry salary bands.',
    icon: Compass,
  },
  interview_room: {
    title: 'Interview Room',
    subtitle: 'STAR+R Autonomous Practice Simulator',
    badge: 'Under Calibration',
    description:
      'The multi-modal STAR+R interview preparation room is undergoing calibration for maritime, engineering, and distributed systems tracks. Real-time audio rubrics and answer scoring will launch shortly.',
    icon: Target,
  },
  linkedin: {
    title: 'LinkedIn Sync & Outreach',
    subtitle: 'Direct Recruiter Integration',
    badge: 'Upcoming Release',
    description:
      'Bi-directional LinkedIn synchronization and automated InMail follow-up pipelines are being wired to your sovereign profile. Direct recruiter dispatch and profile verification will be active in the next release.',
    icon: () => (
      <svg className="w-5 h-5 shrink-0 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
      </svg>
    ),
  },
}

interface ComingSoonModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feature: ComingSoonFeature | null
}

export function ComingSoonModal({
  open,
  onOpenChange,
  feature,
}: ComingSoonModalProps) {
  const [subscribed, setSubscribed] = useState(false)

  if (!feature) return null
  const config = FEATURE_CONFIGS[feature]
  const IconComponent = config.icon

  function handleNotify() {
    setSubscribed(true)
    toast.success(`You will be notified as soon as ${config.title} launches.`)
    setTimeout(() => {
      onOpenChange(false)
      setSubscribed(false)
    }, 1200)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border border-border/80 bg-card rounded-2xl shadow-2xl">
        <div className="p-6 bg-muted/40 border-b border-border/70 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-background border border-border/80 flex items-center justify-center shadow-xs shrink-0">
              <IconComponent className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base font-bold text-foreground">
                  {config.title}
                </DialogTitle>
                <Badge variant="outline" className="font-mono text-[10px] border-primary/30 text-primary bg-primary/5">
                  {config.badge}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {config.subtitle}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {config.description}
          </p>

          <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Priority Deployment</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-normal">
              This module is actively being connected to the Career Ace sovereign core. Check back shortly or request launch notification.
            </p>
          </div>
        </div>

        <div className="p-4 bg-muted/30 border-t border-border/70 flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Dismiss
          </Button>
          <Button
            size="sm"
            onClick={handleNotify}
            disabled={subscribed}
            className="gap-1.5 text-xs font-semibold h-8 px-4"
          >
            {subscribed ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Subscribed</span>
              </>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5" />
                <span>Notify When Live</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
