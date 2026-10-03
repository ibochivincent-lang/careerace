import type { ParsedCv } from "./cv_parser.ts";

/**
 * Standard JSON Resume Schema (v1.0.0) Specification
 * Reference: https://jsonresume.org/schema/
 * Popularized globally by reactive-resume/reactive-resume
 */
export interface JsonResumeSchema {
  $schema?: string;
  basics: {
    name: string;
    label?: string;
    image?: string;
    email: string;
    phone?: string;
    url?: string;
    summary?: string;
    location?: {
      address?: string;
      postalCode?: string;
      city?: string;
      countryCode?: string;
      region?: string;
    };
    profiles?: Array<{
      network: string;
      username: string;
      url: string;
    }>;
  };
  work?: Array<{
    name: string;
    position: string;
    url?: string;
    startDate?: string;
    endDate?: string;
    summary?: string;
    highlights: string[];
  }>;
  volunteer?: Array<{
    organization: string;
    position: string;
    url?: string;
    startDate?: string;
    endDate?: string;
    summary?: string;
    highlights?: string[];
  }>;
  education?: Array<{
    institution: string;
    url?: string;
    area?: string;
    studyType?: string;
    startDate?: string;
    endDate?: string;
    score?: string;
    courses?: string[];
  }>;
  awards?: Array<{
    title: string;
    date?: string;
    awarder?: string;
    summary?: string;
  }>;
  certificates?: Array<{
    name: string;
    date?: string;
    issuer?: string;
    url?: string;
  }>;
  publications?: Array<{
    name: string;
    publisher?: string;
    releaseDate?: string;
    url?: string;
    summary?: string;
  }>;
  skills?: Array<{
    name: string;
    level?: string;
    keywords?: string[];
  }>;
  languages?: Array<{
    language: string;
    fluency?: string;
  }>;
  interests?: Array<{
    name: string;
    keywords?: string[];
  }>;
  references?: Array<{
    name: string;
    reference: string;
  }>;
  projects?: Array<{
    name: string;
    description?: string;
    highlights?: string[];
    keywords?: string[];
    startDate?: string;
    endDate?: string;
    url?: string;
  }>;
}

/**
 * Converts CareerAce internal candidate profile into standard JSON Resume v1.0.0
 */
export function exportToJsonResume(cv: ParsedCv, customSummary?: string): JsonResumeSchema {
  const profiles: Array<{ network: string; username: string; url: string }> = [];

  if (cv.github_url) {
    const username = cv.github_url.split('/').filter(Boolean).pop() || '';
    profiles.push({
      network: 'GitHub',
      username,
      url: cv.github_url
    });
  }

  if (cv.linkedin_url) {
    const username = cv.linkedin_url.split('/').filter(Boolean).pop() || '';
    profiles.push({
      network: 'LinkedIn',
      username,
      url: cv.linkedin_url
    });
  }

  return {
    $schema: "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json",
    basics: {
      name: cv.applicant_name || "Candidate",
      label: cv.target_roles?.[0] || "Software Engineer",
      email: cv.email || "",
      phone: cv.phone || "",
      url: cv.github_url || "",
      summary: customSummary || `Experienced professional with demonstrated competencies in ${(cv.skills || []).slice(0, 5).join(', ')}.`,
      location: {
        city: "",
        countryCode: "US"
      },
      profiles
    },
    work: (cv.work_experience || []).map(w => {
      // Split duration into start and end if possible
      const durationParts = (w.duration || '').split(/[-–—to]+/i).map(s => s.trim());
      return {
        name: w.company,
        position: w.role,
        startDate: durationParts[0] || "",
        endDate: durationParts[1] || "Present",
        highlights: w.highlights || []
      };
    }),
    education: (cv.academic_history || []).map(a => ({
      institution: a.institution,
      area: a.field_of_study,
      studyType: a.degree,
      endDate: a.graduation_year,
      courses: a.achievements || []
    })),
    skills: (cv.skills || []).map(skill => ({
      name: skill,
      keywords: [skill]
    })),
    certificates: (cv.certifications || []).map(cert => ({
      name: cert,
      issuer: "Accredited Provider"
    })),
    projects: (cv.custom_achievements || []).map((ach, idx) => ({
      name: `Key Milestone #${idx + 1}`,
      description: ach,
      highlights: [ach]
    }))
  };
}

/**
 * Imports a JSON Resume standard object into CareerAce ParsedCv format
 */
export function importFromJsonResume(jsonResume: any): ParsedCv {
  if (!jsonResume || typeof jsonResume !== 'object') {
    throw new Error('Invalid JSON Resume payload.');
  }

  const basics = jsonResume.basics || {};
  const profiles = basics.profiles || [];
  const githubProfile = profiles.find((p: any) => /github/i.test(p.network || p.url || ''));
  const linkedinProfile = profiles.find((p: any) => /linkedin/i.test(p.network || p.url || ''));

  // Flatten skills
  const skills: string[] = [];
  if (Array.isArray(jsonResume.skills)) {
    for (const s of jsonResume.skills) {
      if (typeof s === 'string') {
        skills.push(s);
      } else if (s && typeof s === 'object') {
        if (s.name) skills.push(s.name);
        if (Array.isArray(s.keywords)) {
          skills.push(...s.keywords);
        }
      }
    }
  }

  // Work experience
  const work_experience = Array.isArray(jsonResume.work)
    ? jsonResume.work.map((w: any) => ({
        company: w.name || w.company || 'Company',
        role: w.position || w.role || 'Role',
        duration: [w.startDate, w.endDate].filter(Boolean).join(' - ') || 'Present',
        highlights: Array.isArray(w.highlights) ? w.highlights : w.summary ? [w.summary] : []
      }))
    : [];

  // Academic history
  const academic_history = Array.isArray(jsonResume.education)
    ? jsonResume.education.map((e: any) => ({
        institution: e.institution || 'University',
        degree: e.studyType || e.degree || 'Degree',
        field_of_study: e.area || e.field || '',
        graduation_year: e.endDate || e.startDate || '',
        achievements: Array.isArray(e.courses) ? e.courses : []
      }))
    : [];

  // Certifications
  const certifications = Array.isArray(jsonResume.certificates)
    ? jsonResume.certificates.map((c: any) => c.name || String(c))
    : [];

  return {
    applicant_name: basics.name || 'Candidate',
    email: basics.email || '',
    phone: basics.phone || '',
    github_url: githubProfile?.url || basics.url || '',
    linkedin_url: linkedinProfile?.url || '',
    target_roles: basics.label ? [basics.label] : ['Software Engineer'],
    skills: Array.from(new Set(skills)),
    work_experience,
    academic_history,
    certifications,
    custom_achievements: Array.isArray(jsonResume.projects)
      ? jsonResume.projects.map((p: any) => p.description || p.name).filter(Boolean)
      : []
  };
}
