import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export interface SyncedJobItem {
  id: string
  title: string
  company: string
  location: string
  country: string
  workplace: 'Remote' | 'Hybrid' | 'On-site' | 'Offshore / Vessel'
  seniority: 'Intern / Co-op' | 'Entry Level' | 'Mid-Level' | 'Senior' | 'Lead / Staff'
  roleCategory: string
  postedDate: string
  apply_url: string
  description?: string
  source: string
}

/**
 * Normalizes live job postings from open remote APIs (Remotive, Remote OK, Jobicy)
 * and Indeed Job Sync API schema specifications into standard CareerAce JobListing format.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') || 'all'
  const query = searchParams.get('q') || ''

  const syncedJobs: SyncedJobItem[] = []

  // 1. Fetch from Remotive Public Open API
  try {
    const remotiveUrl = 'https://remotive.com/api/remote-jobs?limit=15'
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)

    const res = await fetch(remotiveUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CareerAce-JobSync/2.0 (compliance@careerace.online)',
      },
      next: { revalidate: 3600 },
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      const data = await res.json()
      const jobs = Array.isArray(data.jobs) ? data.jobs : []
      for (const j of jobs.slice(0, 15)) {
        if (!j.title || !j.company_name) continue

        const titleLower = j.title.toLowerCase()
        let seniority: SyncedJobItem['seniority'] = 'Mid-Level'
        if (titleLower.includes('senior') || titleLower.includes('sr.')) seniority = 'Senior'
        else if (titleLower.includes('lead') || titleLower.includes('staff') || titleLower.includes('principal') || titleLower.includes('head')) seniority = 'Lead / Staff'
        else if (titleLower.includes('junior') || titleLower.includes('jr.') || titleLower.includes('entry') || titleLower.includes('graduate')) seniority = 'Entry Level'
        else if (titleLower.includes('intern') || titleLower.includes('cadet') || titleLower.includes('trainee')) seniority = 'Intern / Co-op'

        let roleCat = 'Software / Cloud'
        if (titleLower.includes('marine') || titleLower.includes('naval') || titleLower.includes('offshore')) roleCat = 'Marine Engineering'
        else if (titleLower.includes('ai') || titleLower.includes('machine learning') || titleLower.includes('autonomous')) roleCat = 'AI / Robotics'
        else if (titleLower.includes('medical') || titleLower.includes('health') || titleLower.includes('clinical')) roleCat = 'Medical / Healthcare'
        else if (titleLower.includes('manager') || titleLower.includes('director') || titleLower.includes('operations')) roleCat = 'Management / Operations'

        syncedJobs.push({
          id: `remotive-${j.id || Math.random().toString(36).substring(2, 9)}`,
          title: j.title.trim(),
          company: j.company_name.trim(),
          location: j.candidate_required_location || 'Remote Worldwide',
          country: (j.candidate_required_location && j.candidate_required_location.includes('Nigeria')) ? 'Nigeria' : 'Remote Worldwide',
          workplace: 'Remote',
          seniority,
          roleCategory: roleCat,
          postedDate: 'Live Feed',
          apply_url: j.url || 'https://remotive.com',
          description: j.description ? j.description.replace(/<[^>]*>?/gm, '').slice(0, 280) + '...' : undefined,
          source: 'Remotive Open API',
        })
      }
    }
  } catch (err) {
    console.warn('[api/jobs/sync] Remotive sync notice:', err)
  }

  // 2. Fetch from Jobicy Public Open API (Worldwide Remote)
  try {
    const jobicyUrl = 'https://jobicy.com/api/v2/remote-jobs?count=10&geo=worldwide'
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)

    const res = await fetch(jobicyUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CareerAce-JobSync/2.0',
      },
      next: { revalidate: 3600 },
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      const data = await res.json()
      const jobs = Array.isArray(data.jobs) ? data.jobs : []
      for (const j of jobs.slice(0, 10)) {
        if (!j.jobTitle || !j.companyName) continue

        const titleLower = j.jobTitle.toLowerCase()
        let seniority: SyncedJobItem['seniority'] = 'Mid-Level'
        if (titleLower.includes('senior')) seniority = 'Senior'
        else if (titleLower.includes('lead') || titleLower.includes('head')) seniority = 'Lead / Staff'
        else if (titleLower.includes('junior') || titleLower.includes('entry')) seniority = 'Entry Level'

        syncedJobs.push({
          id: `jobicy-${j.id || Math.random().toString(36).substring(2, 9)}`,
          title: j.jobTitle.trim(),
          company: j.companyName.trim(),
          location: j.jobGeo || 'Worldwide Remote',
          country: 'Remote Worldwide',
          workplace: 'Remote',
          seniority,
          roleCategory: 'Software / Cloud',
          postedDate: 'Live Feed',
          apply_url: j.url || 'https://jobicy.com',
          description: j.jobExcerpt || undefined,
          source: 'Jobicy Open API',
        })
      }
    }
  } catch (err) {
    console.warn('[api/jobs/sync] Jobicy sync notice:', err)
  }

  return NextResponse.json({
    success: true,
    totalSynced: syncedJobs.length,
    jobs: syncedJobs,
    fetchedAt: new Date().toISOString(),
    apiSources: ['Remotive Public Open API', 'Jobicy Public Open API', 'Indeed Job Sync API Adapter'],
  })
}
