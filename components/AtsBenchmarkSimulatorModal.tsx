'use client'

import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Terminal,
  FileCode,
  Flame,
  Search,
  ExternalLink,
  Sparkles,
  Zap,
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers
} from 'lucide-react'
import { toast } from 'sonner'
import type { AtsBenchmarkReport, KeywordHeatmapItem, HeatmapIntensity } from '@/lib/ats_benchmark_simulator'

interface AtsBenchmarkSimulatorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  report: AtsBenchmarkReport | null
  onInsertSkill?: (skill: string) => void
}

export function AtsBenchmarkSimulatorModal({
  open,
  onOpenChange,
  report,
  onInsertSkill,
}: AtsBenchmarkSimulatorModalProps) {
  const [activeEngineTab, setActiveEngineTab] = useState<'taleo' | 'greenhouse'>('taleo')
  const [heatmapFilter, setHeatmapFilter] = useState<'all' | 'missing' | 'optimal' | 'hard_tech'>('all')
  const [showRawStream, setShowRawStream] = useState(false)

  if (!report) return null

  const filteredHeatmap = useMemo(() => {
    if (!report.heatmap) return []
    return report.heatmap.filter((item) => {
      if (heatmapFilter === 'missing') {
        return item.intensity === 'missing_critical' || item.intensity === 'under_represented'
      }
      if (heatmapFilter === 'optimal') {
        return item.intensity === 'optimal'
      }
      if (heatmapFilter === 'hard_tech') {
        return item.category === 'hard_tech'
      }
      return true
    })
  }, [report.heatmap, heatmapFilter])

  const missingCriticalCount = report.heatmap.filter((h) => h.intensity === 'missing_critical').length
  const underrepresentedCount = report.heatmap.filter((h) => h.intensity === 'under_represented').length
  const optimalCount = report.heatmap.filter((h) => h.intensity === 'optimal').length

  function handleCopyText(text: string, label = 'Copied') {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  function getIntensityColor(intensity: HeatmapIntensity) {
    switch (intensity) {
      case 'missing_critical':
        return 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300'
      case 'under_represented':
        return 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
      case 'over_stuffed':
        return 'bg-blue-500/15 border-blue-500/40 text-blue-700 dark:text-blue-300'
      case 'optimal':
      default:
        return 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
    }
  }

  function getIntensityBadge(intensity: HeatmapIntensity) {
    switch (intensity) {
      case 'missing_critical':
        return <Badge variant="outline" className="text-[10px] border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10">Missing Critical</Badge>
      case 'under_represented':
        return <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10">Under-represented</Badge>
      case 'over_stuffed':
        return <Badge variant="outline" className="text-[10px] border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/10">Over-stuffed</Badge>
      case 'optimal':
      default:
        return <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">Optimal Fit</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border border-border/80 bg-card rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="p-6 bg-muted/30 border-b border-border/70 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <span>Automated Live ATS Benchmark Simulator</span>
                  <Badge variant="outline" className="text-[11px] font-mono border-primary/30 text-primary bg-primary/10">
                    Dual Headless Engine
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Simulated headless parse check across Oracle Taleo (linear regex) &amp; Greenhouse (semantic NER)
                </DialogDescription>
              </div>
            </div>

            {/* Composite Readiness Gauge */}
            <div className="flex items-center gap-3 bg-background/90 px-3.5 py-2 rounded-xl border border-border/80 shadow-xs">
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  Pre-Flight Readiness
                </div>
                <div className="text-lg font-extrabold text-foreground">
                  {report.overallReadiness}%
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${report.readyToApply ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            </div>
          </div>

          {/* Target Role & Readiness Summary Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span>Target Role:</span>
              <span className="font-semibold text-foreground">{report.targetRole}</span>
              {report.targetCompany && (
                <>
                  <span>at</span>
                  <span className="font-semibold text-foreground">{report.targetCompany}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {report.readyToApply ? (
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> High Pass Probability
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" /> Gaps Detected Before Application
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Actionable Pre-Flight Fixes (Zero AI Slop) */}
          {report.actionableFixes.length > 0 && (
            <Card className="p-4 bg-muted/20 border-border/70 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Priority Calibration Steps</span>
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {report.actionableFixes.map((fix, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>{fix}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* DUAL ENGINE SIMULATION HEADLESS VIEWER */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-primary" />
                <span>Simulated ATS Parser Engines</span>
              </h3>

              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/60 border border-border/80 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveEngineTab('taleo')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                    activeEngineTab === 'taleo'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Oracle Taleo ({report.taleo.score}%)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEngineTab('greenhouse')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                    activeEngineTab === 'greenhouse'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Greenhouse Semantic ({report.greenhouse.score}%)
                </button>
              </div>
            </div>

            {/* TALEO ENGINE CARD */}
            {activeEngineTab === 'taleo' && (
              <Card className="p-5 border border-border/80 rounded-xl space-y-4 bg-card">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
                  <div>
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <span>{report.taleo.engineName}</span>
                      <Badge variant="outline" className={`text-[10px] ${
                        report.taleo.structuralSafety === 'Safe'
                          ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                          : 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                      }`}>
                        {report.taleo.structuralSafety}
                      </Badge>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Strict linear text parser. Requires exact keyword matches and clean standard headers.
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">Taleo Exact Score</span>
                    <div className="text-xl font-black text-foreground">{report.taleo.score}/100</div>
                  </div>
                </div>

                {/* Taleo Extraction Checkpoints */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-muted-foreground text-[11px]">Contact Parse</span>
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      {report.taleo.contactExtraction.emailDetected && report.taleo.contactExtraction.phoneDetected ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>Phone &amp; Email Found</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>Missing Phone/Email</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-muted-foreground text-[11px]">Strict Coverage</span>
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <span className="font-mono">{report.taleo.strictKeywordCoverage}%</span>
                      <span className="text-[10px] text-muted-foreground">exact lexical</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-muted-foreground text-[11px]">Section Order</span>
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Linear Safe</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-muted-foreground text-[11px]">Parse Confidence</span>
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <span className="font-mono">{report.taleo.parseConfidence}%</span>
                      <span className="text-[10px] text-muted-foreground">ingestion rate</span>
                    </div>
                  </div>
                </div>

                {/* Taleo Warnings */}
                {report.taleo.flaggedFormattingIssues.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 space-y-1">
                    <div className="font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Taleo Parser Warnings:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                      {report.taleo.flaggedFormattingIssues.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Raw Stream Toggle */}
                <div className="pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowRawStream(!showRawStream)}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>{showRawStream ? 'Hide' : 'Inspect'} Raw Taleo Parser Stream</span>
                  </Button>

                  {showRawStream && (
                    <pre className="mt-2 p-3 rounded-lg bg-black/90 text-emerald-400 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed border border-border/60">
                      {report.taleo.rawParsedStream}
                    </pre>
                  )}
                </div>
              </Card>
            )}

            {/* GREENHOUSE ENGINE CARD */}
            {activeEngineTab === 'greenhouse' && (
              <Card className="p-5 border border-border/80 rounded-xl space-y-4 bg-card">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
                  <div>
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <span>{report.greenhouse.engineName}</span>
                      <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                        {report.greenhouse.candidateRankTier}
                      </Badge>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Next-gen semantic NER parser. Maps synonyms (e.g., K8s → Kubernetes) and checks skill recency.
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">Greenhouse Score</span>
                    <div className="text-xl font-black text-foreground">{report.greenhouse.score}/100</div>
                  </div>
                </div>

                {/* Greenhouse Extraction Checkpoints */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-muted-foreground text-[11px]">Semantic Match</span>
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <span className="font-mono">{report.greenhouse.semanticMatchRate}%</span>
                      <span className="text-[10px] text-muted-foreground">synonyms included</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-muted-foreground text-[11px]">Recruiter Search</span>
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <span className="font-mono">{report.greenhouse.recruiterSearchabilityScore}%</span>
                      <span className="text-[10px] text-muted-foreground">discoverability</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-muted-foreground text-[11px]">Skills Recency</span>
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <span className="font-mono">{report.greenhouse.skillsRecencyScore}%</span>
                      <span className="text-[10px] text-muted-foreground">in recent roles</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-muted-foreground text-[11px]">Entities Indexed</span>
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <span className="font-mono">{report.greenhouse.extractedEntities.companies.length}</span>
                      <span className="text-[10px] text-muted-foreground">companies mapped</span>
                    </div>
                  </div>
                </div>

                {/* Structured JSON Graph Toggle */}
                <div className="pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowRawStream(!showRawStream)}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>{showRawStream ? 'Hide' : 'Inspect'} Structured Greenhouse Entity Graph</span>
                  </Button>

                  {showRawStream && (
                    <pre className="mt-2 p-3 rounded-lg bg-muted/50 text-foreground font-mono text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed border border-border/60">
                      {JSON.stringify(report.greenhouse.structuredJsonGraph, null, 2)}
                    </pre>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* LIVE KEYWORD DENSITY HEATMAP */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Live Keyword Density Heatmap ({report.heatmap.length} Terms)
                </h3>
              </div>

              {/* Heatmap Filters */}
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setHeatmapFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    heatmapFilter === 'all'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All ({report.heatmap.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHeatmapFilter('missing')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    heatmapFilter === 'missing'
                      ? 'bg-rose-600 text-white'
                      : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Missing / Gaps ({missingCriticalCount + underrepresentedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setHeatmapFilter('optimal')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    heatmapFilter === 'optimal'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Optimal ({optimalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setHeatmapFilter('hard_tech')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    heatmapFilter === 'hard_tech'
                      ? 'bg-blue-600 text-white'
                      : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Hard Tech
                </button>
              </div>
            </div>

            {/* Heatmap Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground py-1 border-y border-border/40">
              <span className="font-semibold text-foreground">Legend:</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500/60 border border-rose-500" />
                <span>Missing Hard Tech</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-500/60 border border-amber-500" />
                <span>Under-represented</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500/60 border border-emerald-500" />
                <span>Optimal Density</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-500/60 border border-blue-500" />
                <span>Keyword Stuffing Risk</span>
              </span>
            </div>

            {/* Keyword Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {filteredHeatmap.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border transition-all text-xs space-y-1.5 ${getIntensityColor(
                    item.intensity
                  )}`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-bold tracking-tight font-mono truncate">{item.keyword}</span>
                    {getIntensityBadge(item.intensity)}
                  </div>

                  <div className="flex items-center justify-between text-[11px] opacity-90">
                    <span>
                      JD: <strong className="font-mono">{item.frequency_in_jd}x</strong> · CV:{' '}
                      <strong className="font-mono">{item.frequency_in_cv}x</strong>
                    </span>

                    <div className="flex items-center gap-1">
                      <span
                        title={item.taleo_match ? 'Taleo: Exact Match' : 'Taleo: Missed'}
                        className={`text-[9px] px-1 py-0.5 rounded font-mono font-bold ${
                          item.taleo_match ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' : 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                        }`}
                      >
                        Taleo
                      </span>
                      <span
                        title={item.greenhouse_match ? 'Greenhouse: Semantic Match' : 'Greenhouse: Missed'}
                        className={`text-[9px] px-1 py-0.5 rounded font-mono font-bold ${
                          item.greenhouse_match ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' : 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                        }`}
                      >
                        GH
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] leading-tight line-clamp-2 opacity-80">
                    {item.recommendation}
                  </p>

                  {item.frequency_in_cv === 0 && onInsertSkill && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onInsertSkill(item.keyword)
                        toast.success(`'${item.keyword}' added to resume skills inventory!`)
                      }}
                      className="w-full h-6 text-[10px] font-semibold mt-1 bg-background/50 hover:bg-background text-foreground border border-border/40"
                    >
                      + Insert into Skills
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-muted/20 border-t border-border/70 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Benchmarked against active job description criteria
          </div>

          <Button
            onClick={() => onOpenChange(false)}
            className="text-xs font-semibold px-4 min-h-[44px]"
          >
            Done Calibrating
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
