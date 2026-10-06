'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  Sparkles,
  Bug,
  Heart,
  Handshake,
  Star,
  X,
  Send,
  CheckCircle2,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'

interface FeedbackModalProps {
  open: boolean
  onClose: () => void
  initialEmail?: string
  candidateAddress?: string
}

const CATEGORIES = [
  { id: 'feature_request', label: 'Feature Request', icon: Sparkles },
  { id: 'bug_report', label: 'Bug Report', icon: Bug },
  { id: 'ux_review', label: 'UI / UX Polish', icon: Heart },
  { id: 'employer_partnership', label: 'Partnership', icon: Handshake },
  { id: 'general', label: 'General', icon: MessageSquare },
] as const

export function FeedbackModal({ open, onClose, initialEmail = '', candidateAddress }: FeedbackModalProps) {
  const [email, setEmail] = useState(initialEmail)
  const [category, setCategory] = useState<string>('feature_request')
  const [rating, setRating] = useState<number>(5)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!email || !email.includes('@')) {
      toast.error('Please provide a valid email address.')
      return
    }

    if (!message || message.trim().length < 5) {
      toast.error('Please share at least a few words of feedback.')
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading('Transmitting feedback to CareerAce team...')

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          category,
          rating,
          message: message.trim(),
          candidateAddress,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit feedback.')
      }

      toast.success('Feedback received! Thank you for shaping CareerAce.', { id: toastId })
      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setMessage('')
        onClose()
      }, 1800)
    } catch (err: any) {
      toast.error(err.message || 'Submission failed. Please try again.', { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-lg p-5 sm:p-6 border border-border bg-card shadow-2xl rounded-2xl space-y-5 relative">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Community &amp; User Feedback</h3>
              <p className="text-[11px] text-muted-foreground">
                Help shape the autonomous AI career platform and sovereign vault
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-foreground">Thank You for Your Feedback!</h4>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Your notes have been sent directly to our product and engineering team.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Category selection */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-foreground block">Category:</label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon
                  const isSelected = category === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold'
                          : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60'
                      }`}
                    >
                      <Icon className="w-3 h-3 text-emerald-500" />
                      <span>{cat.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Star Rating */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-foreground">Experience Rating:</label>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {rating === 5 && 'Outstanding'}
                  {rating === 4 && 'Very Good'}
                  {rating === 3 && 'Good / Satisfied'}
                  {rating === 2 && 'Needs Polish'}
                  {rating === 1 && 'Needs Improvement'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-muted-foreground/40 hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Email input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-foreground block">
                Your Email Address:
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Message input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-foreground">
                  Your Suggestions / Insights:
                </label>
                <span className="text-[10px] text-muted-foreground">{message.length}/500</span>
              </div>
              <textarea
                required
                rows={4}
                maxLength={500}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What features would you love to see next? Any suggestions for the Walrus Sovereign memory or job auto-apply?"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !email.includes('@') || message.trim().length < 5}
                className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Zap className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Feedback</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}
