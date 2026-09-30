'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ChatdeckHero } from '@/components/blocks/chatdeck_hero'
import { ChatdeckFeatures } from '@/components/blocks/chatdeck_features'
import { ChatdeckFooter } from '@/components/blocks/chatdeck_footer'
import {
  Briefcase, Search, Upload, FileText, CheckCircle2,
  ChevronRight, Zap
} from 'lucide-react'

export default function CareerAcePage() {
  const router = useRouter()
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
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ── Chatdeck Sticky Header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary text-primary-foreground font-bold">
              <Briefcase className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg">Career Ace</span>
            <Badge variant="outline" className="text-xs hidden sm:inline-flex">by IboTV</Badge>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground font-medium">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#cv-upload" className="hover:text-foreground transition-colors">CV Upload</a>
            <a href="#jobs" className="hover:text-foreground transition-colors">Job Matcher</a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button size="sm" onClick={() => router.push('/application_board')}>
              Application Tracker
            </Button>
          </div>
        </div>
      </header>

      {/* ── Chatdeck Hero Block ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4">
        <ChatdeckHero onStart={() => document.getElementById('cv-upload')?.scrollIntoView({ behavior: 'smooth' })} />
      </div>

      {/* ── Chatdeck Features Section ────────────────────────────────────────── */}
      <ChatdeckFeatures />

      {/* ── Interactive Workspace (CV Ingestion & Job Scraper) ────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {/* CV Ingestion Box */}
        <div id="cv-upload" className="mb-16 scroll-mt-24">
          <Card className="p-8 border-2 shadow-lg">
            <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" /> Candidate CV Ingestion
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Paste your resume text below to extract technical skills, employment highlights, and education history into your encrypted Walrus Memory vault.
            </p>

            <textarea
              className="w-full h-40 p-4 rounded-lg border bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary mb-4"
              placeholder="Paste your resume / CV text here..."
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
            />

            <div className="flex items-center justify-between">
              <Button onClick={handleCvSubmit} disabled={isParsing || !cvText.trim()}>
                {isParsing ? 'Parsing Profile...' : 'Parse & Update Vault'}
              </Button>
              {parsedProfile && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> CV Parsed: {parsedProfile.skills?.length} skills extracted
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Job Harvester & Fit Scorer Box */}
        <div id="jobs" className="mb-16 scroll-mt-24">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold">Universal Job Harvester</h2>
              <p className="text-sm text-muted-foreground">Scans Remote, Onsite, and Hybrid listings matched against your candidate profile.</p>
            </div>
            <Button variant="outline" onClick={handleHarvest} disabled={isHarvesting}>
              <Search className="w-4 h-4 mr-2" /> {isHarvesting ? 'Scanning...' : 'Refresh Listings'}
            </Button>
          </div>

          {harvestedJobs.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <p className="text-muted-foreground mb-4">No harvested jobs loaded yet. Click 'Refresh Listings' to scan public job channels.</p>
              <Button onClick={handleHarvest} disabled={isHarvesting}>Run Harvester</Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {harvestedJobs.map((job, idx) => (
                <Card key={idx} className="p-6 transition-all hover:shadow-md">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{job.title}</h3>
                      <p className="text-sm text-muted-foreground">{job.company} • {job.location}</p>
                    </div>
                    <Badge variant="secondary" className="capitalize">{job.job_type || 'Remote'}</Badge>
                  </div>
                  <p className="text-sm line-clamp-3 mb-4 text-muted-foreground">{job.description}</p>
                  <div className="flex items-center justify-between pt-3 border-t text-xs">
                    <span className="text-muted-foreground">Source: {job.source}</span>
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

      {/* ── Chatdeck Footer ─────────────────────────────────────────────────── */}
      <ChatdeckFooter />
    </div>
  )
}
