"use client"

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, HelpCircle } from 'lucide-react'

export interface FAQItem {
  q: string
  a: string
}

export const CAREER_ACE_FAQS: FAQItem[] = [
  {
    q: "How does Career Ace guarantee 100% ATS compliance?",
    a: "Career Ace uses an OpenXML .docx compiler and the official JSON Resume Schema v1.0.0. Our output is single-column, table-free, and respects standardized typography and heading semantics. It has been tested against Workday, Taleo, Greenhouse, Lever, and iCIMS parsers."
  },
  {
    q: "What makes Walrus Sovereign Memory different from normal AI apps?",
    a: "Traditional career apps store your private career history on centralized databases where they can sell or lock your data. Career Ace encrypts all candidate milestones using client-side AES-256-GCM tied to your Google zkLogin Sui address and stores it as content-addressed Walrus blobs. You hold the only cryptographic keys."
  },
  {
    q: "How does the autonomous Job Harvester work?",
    a: "Our background crawler monitors 9 verified remote, hybrid, and onsite networks (including Arbeitnow, Jobicy v2, Remotive, and WeWorkRemotely). New postings are evaluated against your sovereign resume and scored from 1 to 10 for skill alignment and salary bracket."
  },
  {
    q: "Can I generate automated, customized cover letters?",
    a: "Yes. Career Ace correlates your verified achievements with the specific requirements of the job posting, extracting real metrics (e.g. '2M+ RPS latency reduction') directly from your resume into compelling problem-solving narratives without inventing fake experience."
  },
  {
    q: "Is there any cost to get started?",
    a: "Zero. Career Ace provides free ATS resume auditing, sovereign profile extraction, Google zkLogin authentication, and full DOCX / JSON Resume exports with no credit card required."
  }
]

export function ChatdeckFaq() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="max-w-4xl mx-auto px-4 py-16 scroll-mt-20">
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
        <Badge variant="outline" className="px-3.5 py-1 text-xs font-semibold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
          <HelpCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-500 inline" /> Frequently Asked Questions
        </Badge>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Everything you need to know.
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Clear answers about ATS compatibility, Walrus cryptographic sovereignty, and our autonomous job agent.
        </p>
      </div>

      <div className="space-y-3.5">
        {CAREER_ACE_FAQS.map((faq, idx) => {
          const isOpen = openFaqIndex === idx
          return (
            <div
              key={faq.q}
              className="rounded-xl border border-border/80 bg-card overflow-hidden transition-all shadow-xs"
            >
              <button
                type="button"
                onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                aria-expanded={isOpen}
                className="w-full p-5 text-left font-semibold text-sm sm:text-base flex items-center justify-between gap-4 hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <span className="text-foreground">{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 text-emerald-500 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40">
                  {faq.a}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
