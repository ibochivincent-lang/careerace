import { NextResponse } from 'next/server'
import { harvestJobsFromSources, type RawJob } from '@/lib/job_harvester'

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

function normalizeSeniority(title: string, desc = ''): SyncedJobItem['seniority'] {
  const t = title.toLowerCase()
  const d = desc.toLowerCase()
  if (t.includes('intern') || t.includes('cadet') || t.includes('trainee') || t.includes('co-op')) {
    return 'Intern / Co-op'
  }
  if (t.includes('junior') || t.includes('jr.') || t.includes('entry') || t.includes('graduate') || t.includes('associate')) {
    return 'Entry Level'
  }
  if (t.includes('lead') || t.includes('staff') || t.includes('principal') || t.includes('head of') || t.includes('chief') || t.includes('superintendent') || t.includes('director')) {
    return 'Lead / Staff'
  }
  if (t.includes('senior') || t.includes('sr.') || t.includes('specialist') || t.includes('architect') || d.includes('5+ years') || d.includes('senior level')) {
    return 'Senior'
  }
  return 'Mid-Level'
}

function normalizeRoleCategory(title: string, desc = ''): string {
  const text = `${title} ${desc}`.toLowerCase()
  if (text.includes('marine') || text.includes('naval') || text.includes('offshore') || text.includes('subsea') || text.includes('vessel') || text.includes('propulsion') || text.includes('cadet')) {
    return 'Marine Engineering'
  }
  if (text.includes('ai') || text.includes('machine learning') || text.includes('deep learning') || text.includes('robotics') || text.includes('autonomous') || text.includes('llm') || text.includes('neural')) {
    return 'AI / Robotics'
  }
  if (text.includes('data engineer') || text.includes('analytics') || text.includes('data science') || text.includes('business intelligence')) {
    return 'Data & Analytics'
  }
  if (text.includes('cyber') || text.includes('security') || text.includes('infosec') || text.includes('soc analyst') || text.includes('penetration')) {
    return 'Cybersecurity'
  }
  if (text.includes('product manager') || text.includes('ux') || text.includes('ui/ux') || text.includes('product design')) {
    return 'Product & Design'
  }
  if (text.includes('devops') || text.includes('sre') || text.includes('cloud') || text.includes('infrastructure') || text.includes('kubernetes')) {
    return 'Software / Cloud'
  }
  if (text.includes('medical') || text.includes('health') || text.includes('clinical') || text.includes('bioinformatics') || text.includes('telehealth')) {
    return 'Medical / Healthcare'
  }
  if (text.includes('manager') || text.includes('operations') || text.includes('director') || text.includes('coordinator')) {
    return 'Management / Operations'
  }
  if (text.includes('industrial') || text.includes('manufacturing') || text.includes('hardware') || text.includes('aerospace')) {
    return 'Industrial & Manufacturing'
  }
  return 'Software / Cloud'
}

function normalizeWorkplace(job: RawJob): SyncedJobItem['workplace'] {
  const loc = (job.location || '').toLowerCase()
  const wp = (job.job_type || '').toLowerCase()
  if (loc.includes('offshore') || loc.includes('vessel') || loc.includes('rig')) return 'Offshore / Vessel'
  if (job.is_remote || wp === 'remote' || loc.includes('remote') || loc.includes('worldwide')) return 'Remote'
  if (wp === 'hybrid' || loc.includes('hybrid')) return 'Hybrid'
  return 'On-site'
}

function normalizeCountry(location: string): string {
  const loc = (location || '').toLowerCase()
  if (loc.includes('nigeria') || loc.includes('lagos') || loc.includes('abuja') || loc.includes('port harcourt')) return 'Nigeria'
  if (loc.includes('united states') || loc.includes('usa') || loc.includes('tx') || loc.includes('ca') || loc.includes('ny')) return 'United States'
  if (loc.includes('united kingdom') || loc.includes('uk') || loc.includes('london') || loc.includes('aberdeen')) return 'United Kingdom'
  if (loc.includes('netherlands') || loc.includes('rotterdam') || loc.includes('amsterdam')) return 'Netherlands'
  if (loc.includes('norway') || loc.includes('oslo') || loc.includes('kongsberg')) return 'Norway'
  if (loc.includes('germany') || loc.includes('berlin') || loc.includes('munich')) return 'Germany'
  if (loc.includes('canada') || loc.includes('toronto') || loc.includes('vancouver')) return 'Canada'
  return 'Remote Worldwide'
}

/**
 * Normalizes live job postings from open remote APIs (Remotive, Arbeitnow, Jobicy, WeWorkRemotely,
 * RemoteOK, Himalayas, Nodesk, FreshRemote, Jobberman) and Indeed/Google Jobs API schema adapters.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') || 'all'
  const query = searchParams.get('q') || searchParams.get('query') || 'software engineer'

  try {
    const rawJobs = await harvestJobsFromSources(query, category)

    const syncedJobs: SyncedJobItem[] = rawJobs.map((j) => ({
      id: j.job_id || `sync_${Math.random().toString(36).substring(2, 9)}`,
      title: j.title || 'Engineer',
      company: j.company || 'Enterprise Employer',
      location: j.location || 'Remote Worldwide',
      country: normalizeCountry(j.location || ''),
      workplace: normalizeWorkplace(j),
      seniority: normalizeSeniority(j.title, j.description),
      roleCategory: normalizeRoleCategory(j.title, j.description),
      postedDate: j.posted_date ? 'Live Feed' : 'Today',
      apply_url: j.apply_url || 'https://careerace.online/application_board',
      description: j.description || undefined,
      source: j.source || 'Live Feed',
    }))

    return NextResponse.json({
      success: true,
      totalSynced: syncedJobs.length,
      jobs: syncedJobs,
      fetchedAt: new Date().toISOString(),
      apiSources: [
        'Indeed API Adapter (SerpAPI / RapidAPI JSearch)',
        'Arbeitnow Real-Time Job Feed',
        'Remotive Public Open API',
        'Jobicy Global Remote API',
        'WeWorkRemotely RSS Feed',
        'RemoteOK Engineering Feed',
        'Himalayas Software Feed',
        'Jobberman Nigeria Feed',
      ],
    })
  } catch (err: any) {
    console.error('[api/jobs/sync] Error during multi-source synchronization:', err)
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Synchronization failed',
        totalSynced: 0,
        jobs: [],
        fetchedAt: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
