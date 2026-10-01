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
  ChevronRight, Paperclip, Sparkles
} from 'lucide-react'

export default function CareerAcePage() {
  const router = useRouter()
  const [cvText, setCvText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [parsedProfile, setParsedProfile] = useState<any>(null)
  const [isHarvesting, setIsHarvesting] = useState(false)
  const [harvestedJobs, setHarvestedJobs] = useState<any[]>([])

  const [evaluatingJobId, setEvaluatingJobId] = useState<string | null>(null)
  const [evaluationResults, setEvaluationResults] = useState<Record<string, any>>({})

  async function handleCvSubmit() {
    setIsParsing(true)
    try {
      let res: Response
      if (selectedFile) {
        const formData = new FormData()
        formData.append('file', selectedFile)
        res = await fetch('/api/cv_upload', {
          method: 'POST',
          body: formData
        })
      } else {
        res = await fetch('/api/cv_upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cv_text: cvText })
        })
      }
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

  async function handleEvaluateJob(job: any) {
    setEvaluatingJobId(job.job_id)
    try {
      const res = await fetch('/api/evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job,
          cv_text: cvText || (parsedProfile ? JSON.stringify(parsedProfile) : "")
        })
      })
      const data = await res.json()
      if (data.evaluation) {
        setEvaluationResults((prev) => ({
          ...prev,
          [job.job_id]: data
        }))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setEvaluatingJobId(null)
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
            <a href="#cv-upload" className="hover:text-foreground transition-colors">CV File Upload</a>
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

      {/* ── Interactive Workspace (File Upload Attachment & Harvester) ───────── */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {/* Free Model Info Badge */}
        <div className="mb-6 flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="w-4 h-4 text-primary" /> Powered by Free & Open-Source LLMs (DeepSeek R1 / Qwen 2.5 / Ollama Local)
          </div>
          <Badge variant="secondary">Zero Paid API Key Required</Badge>
        </div>

        {/* CV File Upload Attachment Box */}
        <div id="cv-upload" className="mb-16 scroll-mt-24">
          <Card className="p-8 border-2 shadow-lg">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Paperclip className="w-6 h-6 text-primary" /> Candidate CV File Attachment
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Attach your CV/Resume file (<code className="font-mono text-xs">.pdf</code>, <code className="font-mono text-xs">.docx</code>, <code className="font-mono text-xs">.txt</code>) or paste raw text below to ingest into your encrypted vault.
            </p>

            {/* File Dropzone */}
            <div className="border-2 border-dashed rounded-lg p-6 mb-6 text-center hover:bg-primary/5 transition-colors cursor-pointer relative">
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <Upload className="w-8 h-8 text-primary mx-auto mb-2" />
              {selectedFile ? (
                <p className="text-sm font-medium text-primary">Attached File: {selectedFile.name}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Drag & drop your resume file here, or <span className="text-primary font-medium underline">browse files</span>
                </p>
              )}
            </div>

            <div className="text-xs text-muted-foreground mb-2 font-medium">Or paste raw text directly:</div>
            <textarea
              className="w-full h-32 p-4 rounded-lg border bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary mb-4"
              placeholder="Paste your CV text here if not uploading a file..."
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
            />

            <div className="flex items-center justify-between">
              <Button onClick={handleCvSubmit} disabled={isParsing || (!selectedFile && !cvText.trim())}>
                {isParsing ? 'Parsing Profile...' : 'Parse & Update Vault'}
              </Button>
              {parsedProfile && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Profile Updated: {parsedProfile.skills?.length} skills extracted
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
              {harvestedJobs.map((job, idx) => {
                const evalData = evaluationResults[job.job_id];
                const isEvaluating = evaluatingJobId === job.job_id;

                return (
                  <Card key={idx} className="p-6 transition-all hover:shadow-md flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-lg">{job.title}</h3>
                          <p className="text-sm text-muted-foreground">{job.company} • {job.location}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="secondary" className="capitalize">{job.job_type || 'Remote'}</Badge>
                          {evalData && (
                            <Badge variant={evalData.evaluation.fit_score >= 6 ? "default" : "destructive"}>
                              Score: {evalData.evaluation.fit_score}/10
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-sm line-clamp-3 mb-4 text-muted-foreground">{job.description}</p>

                      {evalData && (
                        <div className="mb-4 p-3 rounded-md bg-secondary/30 text-xs space-y-1">
                          <div className="font-semibold text-foreground">
                            {evalData.application.track === "track_a_auto_apply" ? "Track A: Auto-Apply Ready" : "Track B: Manual Review Queue"}
                          </div>
                          <div className="text-muted-foreground">{evalData.evaluation.match_reason}</div>
                          {evalData.tailored_package && (
                            <div className="text-primary font-medium mt-1">
                              Cover letter & tailored CV generated and logged.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t text-xs flex flex-wrap items-center justify-between gap-2">
                      <span className="text-muted-foreground">Source: {job.source}</span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEvaluateJob(job)}
                          disabled={isEvaluating}
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1" />
                          {isEvaluating ? 'Scoring...' : evalData ? 'Re-Score' : 'Score Fit'}
                        </Button>
                        <a
                          href={job.apply_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        >
                          Apply Direct <ChevronRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Chatdeck Footer ─────────────────────────────────────────────────── */}
      <ChatdeckFooter />
    </div>
  )
}
