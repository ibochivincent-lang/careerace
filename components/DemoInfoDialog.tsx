'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button'
import { Info } from 'lucide-react'

export function DemoInfoDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Info className="w-4 h-4 mr-2" />
          How It Works
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>How ExamAce Works</DialogTitle>
          <DialogDescription>
            Understanding the Socratic tutoring method
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Core rule */}
          <div>
            <h4 className="font-semibold mb-2">The Core Rule</h4>
            <p className="text-sm text-muted-foreground">
              ExamAce will <strong className="text-foreground">never give you the direct answer</strong>. This is intentional.
              The tutor responds with questions designed to help you discover the answer yourself.
            </p>
          </div>

          {/* Three-tier */}
          <div>
            <h4 className="font-semibold mb-2">Three-Tier Intervention</h4>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Tier 1: Conceptual</p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                  When you have the wrong mental model. Forces you to examine concepts from first principles.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900">
                <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">Tier 2: Procedural</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  When your concept is right but method is wrong. Asks about specific steps.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900">
                <p className="text-sm font-medium text-orange-900 dark:text-orange-200">Tier 3: Distractor</p>
                <p className="text-xs text-orange-700 dark:text-orange-400 mt-0.5">
                  When you chose a trap option. Asks you to defend your choice to expose flaws.
                </p>
              </div>
            </div>
          </div>

          {/* Confidence detection */}
          <div>
            <h4 className="font-semibold mb-2">Confidence Detection</h4>
            <p className="text-sm text-muted-foreground mb-2">
              The system detects hedge words in your responses:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900">
                <span className="font-medium text-emerald-800 dark:text-emerald-300">High Confidence:</span>
                <span className="text-emerald-700 dark:text-emerald-400"> No hedging</span>
              </div>
              <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-100 dark:border-yellow-900">
                <span className="font-medium text-yellow-800 dark:text-yellow-300">Medium:</span>
                <span className="text-yellow-700 dark:text-yellow-400"> &quot;I think&quot;, &quot;maybe&quot;</span>
              </div>
              <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900">
                <span className="font-medium text-orange-800 dark:text-orange-300">Low:</span>
                <span className="text-orange-700 dark:text-orange-400"> &quot;I&apos;m not sure&quot;, &quot;abi&quot;</span>
              </div>
              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900">
                <span className="font-medium text-red-800 dark:text-red-300">Guessing:</span>
                <span className="text-red-700 dark:text-red-400"> Very short answers</span>
              </div>
            </div>
          </div>

          {/* Cognitive map */}
          <div>
            <h4 className="font-semibold mb-2">Cognitive Map</h4>
            <p className="text-sm text-muted-foreground">
              Your progress is tracked through a cognitive map that records:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
              <li>Misconceptions per topic</li>
              <li>Confidence calibration (are you right when you&apos;re confident?)</li>
              <li>Error patterns</li>
              <li>Spaced repetition schedule</li>
            </ul>
          </div>

          {/* Tips */}
          <div>
            <h4 className="font-semibold mb-2">Tips for Success</h4>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Explain your reasoning out loud, even if uncertain</li>
              <li>Don&apos;t just pick an option — explain WHY</li>
              <li>If stuck, say what you DO know about the topic</li>
              <li>Pay attention to the tutor&apos;s questions — they contain hints</li>
            </ul>
          </div>

          {/* Info note */}
          <div className="p-4 rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20">
            <p className="text-sm text-primary font-medium">
              AI responses are currently simulated. The full version integrates with Frontier AI Engine
              for real-time intelligent Socratic tutoring tailored to your exact misconceptions.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
