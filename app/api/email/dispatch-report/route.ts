import { NextRequest, NextResponse } from 'next/server'
import { sendDailyDispatchReportEmail, type DispatchReportItem } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      candidateEmail,
      candidateName,
      dispatches,
      walrusCvSnapshotLabel,
      walrusBlobId,
    } = body

    if (!candidateEmail || typeof candidateEmail !== 'string' || !candidateEmail.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'A valid candidate email address is required.' },
        { status: 400 }
      )
    }

    if (!Array.isArray(dispatches) || dispatches.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one dispatched application record is required to generate a report.' },
        { status: 400 }
      )
    }

    const reportItems: DispatchReportItem[] = dispatches.map((d: any) => ({
      company: d.company || 'Hiring Company',
      role: d.jobTitle || d.role || 'Candidate Application',
      recipientEmail: d.recipientEmail || d.contactEmail || undefined,
      appliedAt: d.appliedAt || new Date().toLocaleDateString('en-US'),
      followUpDue: d.followUpDue || 'In 7 Days',
      status: d.status || 'Delivered',
    }))

    const result = await sendDailyDispatchReportEmail({
      candidateEmail: candidateEmail.trim(),
      candidateName: candidateName || 'Candidate',
      dispatches: reportItems,
      walrusCvSnapshotLabel,
      walrusBlobId,
    })

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to dispatch report email.',
        provider: result.provider,
      }, { status: 502 })
    }

    return NextResponse.json({
      success: true,
      message: `Executive dispatch report delivered to ${candidateEmail}!`,
      provider: result.provider,
      id: result.id,
      totalDispatched: reportItems.length,
    })
  } catch (err: any) {
    console.error('[email/dispatch-report] Error:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error while generating dispatch report.' },
      { status: 500 }
    )
  }
}
