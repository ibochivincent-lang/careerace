'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  Briefcase, Search, Upload, FileText, CheckCircle2,
  ChevronRight, ArrowRight, Shield, Zap, Sparkles
} from 'lucide-react'

export default function CareerAcePage() {
  const router = RouterHook()
  const [cvText, setCvText] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [parsedProfile, setParsedProfile] = useState<any>(null)
  const [isHarvesting, setIsHarvesting] = useState(false)
  const [harvestedJobs, setHarvestedJobs] = useState<any[]>([])

  async function handleCvSubmit() {
    if (!cvText.trim()) return
    setIsParsing(true)
    try {
      const res = await fetch('/api/cv_upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv_text: cvText })
      })
      const data = await res.json()
      if (data.profile) {
        setParsedProfile(data.profile)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsParsing(false)
    }
  }

  async function handleHarvest() {
    setIsHarvesting(true)
    try {
      const res = await fetch('/api/harvest?query=software%20engineer')
      const data = await res.json()
      if (data.jobs) {
        setHarvestedJobs(data.jobs)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsHarvesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky Header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary text-primary-foreground">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">Career Ace</span>
            <Badge variant="outline" className="text-xs">by IboTV</Badge>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#cv-upload" className="hover:text-foreground transition-colors">CV Upload</a>
            <a href="#jobs" className="hover:text-foreground transition-colors">Job Harvester</a>
            <a href="#board" className="hover:text-foreground transition-colors">Application Board</a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button size="sm" onClick={() => router.push('/application_board')}>
              Application Tracker
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-12">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="secondary" className="mb-4 gap-1.5 px-3 py-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Autonomous AI Career Copilot
          </Badge>
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight mb-4">
            Land your next job.<br />
            <span className="text-primary">Powered by AI & Decentralized Vault.</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            Upload your CV, continuously harvest Remote, Onsite, and Hybrid jobs, evaluate candidate fit scores (1-10), auto-tailor CV bullets, and submit applications with Human-In-The-Loop review.
          </p>
          <div className="flex justify-center gap-3">
            <Button size="lg" className="px-6" onClick={() => document.getElementById('cv-upload')?.scrollIntoView({ behavior: 'smooth' })}>
              Upload CV & Start <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <Button variant="outline" size="lg" onClick={handleHarvest} disabled={isHarvesting}>
              {isHarvesting ? 'Harvesting Jobs...' : 'Harvest Jobs Now'}
            </Button>
          </div>
        </div>

        {/* Features Row */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="p-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-2">CV Ingestion & History</h3>
            <p className="text-sm text-muted-foreground">
              Parses your resume, extracts skills, academic background, and work experience into your encrypted Walrus Memory vault.
            </p>
          </Card>

          <Card className="p-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Search className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-2">Universal Job Harvester</h3>
            <p className="text-sm text-muted-foreground">
              Continuously searches public feeds and APIs for Remote, Onsite, and Hybrid postings, deduplicating and filtering stale listings.
            </p>
          </Card>

          <Card className="p-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-2">Dual-Track Dispatch</h3>
            <p className="text-sm text-muted-foreground">
              Auto-applies to high-match direct links (Track A) while placing complex ATS portals in your interactive Manual Review Queue (Track B).
            </p>
          </Card>
        </div>

        {/* ── CV Upload Section ─────────────────────────────────────── */}
        <div id="cv-upload" className="mb-16">
          <Card className="p-8 border-2">
            <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" /> Candidate CV Ingestion
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Paste your resume or CV text below to extract skills, work history, and academic achievements into your encrypted vault.
            </p>

            <textarea
              className="w-full h-40 p-4 rounded-md border bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary mb-4"
              placeholder="Paste your CV text here..."
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
            />

            <div className="flex items-center justify-between">
              <Button onClick={handleCvSubmit} disabled={isParsing || !cvText.trim()}>
                {isParsing ? 'Parsing Profile...' : 'Parse & Update Vault'}
              </Button>
              {parsedProfile && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4" /> CV Parsed: {parsedProfile.skills?.length} skills extracted
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ── Job Harvester Section ─────────────────────────────────────── */}
        <div id="jobs" className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Matched Job Postings</h2>
              <p className="text-sm text-muted-foreground">Discovered roles scored against candidate profile.</p>
            </div>
            <Button variant="outline" onClick={handleHarvest} disabled={isHarvesting}>
              <Search className="w-4 h-4 mr-2" /> Refresh Listings
            </Button>
          </div>

          {harvestedJobs.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <p className="text-muted-foreground mb-4">No harvested jobs loaded yet. Click 'Refresh Listings' to scan public job feeds.</p>
              <Button onClick={handleHarvest} disabled={isHarvesting}>Run Harvester</Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {harvestedJobs.map((job, idx) => (
                <Card key={idx} className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{job.title}</h3>
                      <p className="text-sm text-muted-foreground">{job.company} • {job.location}</p>
                    </div>
                    <Badge variant="secondary">{job.job_type || 'Remote'}</Badge>
                  </div>
                  <p className="text-sm line-clamp-3 mb-4 text-muted-foreground">{job.description}</p>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-xs text-muted-foreground">Source: {job.source}</span>
                    <a href={job.apply_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                      Apply Direct <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>Career Ace — Created exclusively by IboTV (ibochivincent-lang). All rights reserved.</p>
      </footer>
    </div>
  )
}

function RouterHook() {
  const router = useRouter()
  return router
}
