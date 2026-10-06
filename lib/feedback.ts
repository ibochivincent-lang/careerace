import fs from 'node:fs'
import path from 'node:path'

export interface UserFeedbackSubmission {
  id: string
  email: string
  category: 'feature_request' | 'bug_report' | 'ux_review' | 'employer_partnership' | 'general'
  rating: number // 1 to 5
  message: string
  candidateAddress?: string
  createdAt: string
  userAgent?: string
}

export interface FeedbackValidationResult {
  valid: boolean
  error?: string
}

export function validateFeedback(data: Partial<UserFeedbackSubmission>): FeedbackValidationResult {
  if (!data.email || typeof data.email !== 'string' || !data.email.includes('@')) {
    return { valid: false, error: 'A valid email address is required.' }
  }

  if (!data.message || typeof data.message !== 'string' || data.message.trim().length < 5) {
    return { valid: false, error: 'Feedback message must be at least 5 characters long.' }
  }

  if (data.rating !== undefined && (typeof data.rating !== 'number' || data.rating < 1 || data.rating > 5)) {
    return { valid: false, error: 'Rating must be between 1 and 5 stars.' }
  }

  const validCategories = ['feature_request', 'bug_report', 'ux_review', 'employer_partnership', 'general']
  if (data.category && !validCategories.includes(data.category)) {
    return { valid: false, error: 'Invalid feedback category.' }
  }

  return { valid: true }
}

const FEEDBACK_DIR = path.join(process.cwd(), 'data')
const FEEDBACK_FILE = path.join(FEEDBACK_DIR, 'user_feedback.json')

export function saveFeedbackToFile(submission: UserFeedbackSubmission): void {
  try {
    if (!fs.existsSync(FEEDBACK_DIR)) {
      fs.mkdirSync(FEEDBACK_DIR, { recursive: true })
    }

    let existing: UserFeedbackSubmission[] = []
    if (fs.existsSync(FEEDBACK_FILE)) {
      try {
        const raw = fs.readFileSync(FEEDBACK_FILE, 'utf-8')
        existing = JSON.parse(raw)
      } catch {
        existing = []
      }
    }

    existing.unshift(submission)
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(existing, null, 2), 'utf-8')
  } catch (err) {
    console.warn('[feedback] Unable to write feedback to disk, running in serverless mode:', err)
  }
}
