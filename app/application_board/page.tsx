'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ApplicationBoardPage() {
  const router = useRouter()
  
  const [applications] = useState([
    {
      job_id: "job_01",
      title: "Fullstack TypeScript Engineer",
      company: "Vercel Partner Agency",
      apply_url: "mailto:careers@vercelpartner.com?subject=Application%20Fullstack%20Engineer",
      fit_score: 9,
      track: "track_a_auto_apply",
      status: "Applied",
      processed_at: new Date().toISOString()
    },
    {
      job_id: "job_02",
      title: "Backend Node.js & Python Developer",
      company: "Stellar Infrastructure Labs",
      apply_url: "https://careers.stellarlabs.com/jobs/backend-dev",
      fit_score: 5,
      track: "track_b_manual_queue",
      status: "Manual Required",
      flag_reason: "Low candidate match fit score (5/10). Manual review recommended.",
      processed_at: new Date().toISOString()
    }
  ])

  return (
    <div className="min-h-screen bg-background p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Application Tracker Board</h1>
            <p className="text-sm text-muted-foreground">Track A Auto-Applied vs Track B Manual Review Queue</p>
          </div>
        </div>
        <Button onClick={() => router.push('/interview_room')}>
          Practice Mock Interview
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Track A Column */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <h2 className="text-xl font-bold">Track A: Auto-Applied</h2>
            <Badge variant="secondary">{applications.filter(a => a.status === 'Applied').length}</Badge>
          </div>

          <div className="space-y-4">
            {applications.filter(a => a.status === 'Applied').map((app) => (
              <Card key={app.job_id} className="p-5 border-l-4 border-l-green-500">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold">{app.title}</h3>
                  <Badge variant="outline" className="text-green-600 dark:text-green-400">Score: {app.fit_score}/10</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{app.company}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
                  <span>Applied via Email / Direct API</span>
                  <a href={app.apply_url} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center gap-1 hover:underline">
                    View Link <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Track B Column */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-bold">Track B: Manual Review Queue</h2>
            <Badge variant="secondary">{applications.filter(a => a.status === 'Manual Required').length}</Badge>
          </div>

          <div className="space-y-4">
            {applications.filter(a => a.status === 'Manual Required').map((app) => (
              <Card key={app.job_id} className="p-5 border-l-4 border-l-amber-500">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold">{app.title}</h3>
                  <Badge variant="outline" className="text-amber-600 dark:text-amber-400">Score: {app.fit_score}/10</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{app.company}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mb-3 bg-amber-500/10 p-2 rounded">
                  Reason: {app.flag_reason}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
                  <span>Manual Submission Needed</span>
                  <a href={app.apply_url} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center gap-1 hover:underline">
                    Open Portal <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
