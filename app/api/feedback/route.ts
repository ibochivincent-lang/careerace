import { NextRequest, NextResponse } from 'next/server'
import { validateFeedback, saveFeedbackToFile, type UserFeedbackSubmission } from '@/lib/feedback'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validation = validateFeedback(body)

    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 })
    }

    const submission: UserFeedbackSubmission = {
      id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: body.email.trim().toLowerCase(),
      category: body.category || 'general',
      rating: body.rating || 5,
      message: body.message.trim(),
      candidateAddress: body.candidateAddress || undefined,
      createdAt: new Date().toISOString(),
      userAgent: req.headers.get('user-agent') || undefined,
    }

    // 1. Save to local persistent storage
    saveFeedbackToFile(submission)

    // 2. Persist to Supabase if configured
    try {
      const supabase = getSupabaseClient()
      if (supabase) {
        await supabase.from('user_feedback').insert([submission]).select()
      }
    } catch (dbErr) {
      // Supabase is optional; local persistence and response succeed regardless
      console.warn('[feedback] Supabase optional insert notice:', dbErr)
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback! The CareerAce engineering team has received your submission.',
      submissionId: submission.id,
    })
  } catch (err: any) {
    console.error('[feedback] Submission error:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to record feedback.' },
      { status: 500 }
    )
  }
}
