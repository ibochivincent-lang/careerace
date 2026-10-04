import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCvText } from './heuristic_cv_parser.ts';

// Test maritime gating logic
function isMaritimeCandidate(profile: any, tailorRole?: string): boolean {
  if (!profile) return false;
  const combined = [
    tailorRole || '',
    ...(profile.target_roles || []),
    ...(profile.skills || []),
    ...(profile.certifications || []),
    ...(profile.work_experience?.map((w: any) => `${w.role} ${w.company} ${(w.highlights || []).join(' ')}`) || []),
    ...(profile.academic_history?.map((a: any) => `${a.degree} ${a.field_of_study} ${a.institution}`) || []),
  ].join(' ').toLowerCase();

  return /\b(marine|maritime|naval|vessel|captain|deck\s+officer|chief\s+engineer|seafarer|seaman|ship|oicew|propulsion|offshore|subsea|stcw|solas|marpol)\b/i.test(combined);
}

test('Maritime STCW Gating Logic', async (t) => {
  await t.test('detects maritime candidate from degree and certifications', () => {
    const candidate = {
      applicant_name: 'Vincent Lang',
      skills: ['AutoCAD', 'SolidWorks', 'MATLAB', 'Diesel Engines'],
      certifications: ['STCW Basic Safety Training (VI/1)', 'Medical First Aid'],
      academic_history: [
        {
          institution: 'Nigeria Maritime University',
          degree: 'B.Eng',
          field_of_study: 'Marine Engineering',
          graduation_year: '2023',
        },
      ],
      work_experience: [
        {
          role: 'Cadet Engineer',
          company: 'Atlantic Marine Services',
          highlights: ['Monitored ship auxiliary propulsion systems during sea voyage.'],
        },
      ],
    };

    assert.equal(isMaritimeCandidate(candidate), true);
  });

  await t.test('strictly returns false for regular software / tech CVs', () => {
    const candidate = {
      applicant_name: 'Alex Johnson',
      target_roles: ['Senior Full Stack Engineer'],
      skills: ['TypeScript', 'Next.js', 'PostgreSQL', 'Docker', 'AWS'],
      certifications: ['AWS Certified Solutions Architect'],
      academic_history: [
        {
          institution: 'Stanford University',
          degree: 'B.S.',
          field_of_study: 'Computer Science',
          graduation_year: '2022',
        },
      ],
      work_experience: [
        {
          role: 'Software Engineer',
          company: 'Stripe',
          highlights: ['Architected payment gateways with sub-50ms latency.'],
        },
      ],
    };

    assert.equal(isMaritimeCandidate(candidate), false);
    assert.equal(isMaritimeCandidate(candidate, 'Frontend Lead'), false);
  });
});

test('Heuristic CV Parser - Non-Standard Multi-Section Parsing', async (t) => {
  await t.test('extracts leadership and conference sections from CV text', () => {
    const rawCvText = `
Vincent Lang
Email: vincent.lang.marine.engineer@oceanic-logistics.org
Phone: +234 801 234 5678
Location: Lagos, Nigeria | LinkedIn: linkedin.com/in/vincent-lang | GitHub: github.com/vlang

PROFESSIONAL SUMMARY
Experienced Marine Systems Engineer specializing in vessel propulsion, thermodynamics, and planned maintenance systems.

WORK EXPERIENCE
Marine Engineer | Bourbon Interoil | 2023 - Present
- Spearheaded vessel engine room inspections across 4 offshore supply vessels.
- Reduced unplanned engine downtime by 35% through oil analysis.

LEADERSHIP & VOLUNTEER
Student Union President | Maritime Students Association | 2021 - 2022
- Led executive committee representing 1,200 nautical and marine engineering cadets.
- Organized safety workshops and environmental sustainability cleanups.

CONFERENCES & SEMINARS
Keynote Speaker | West Africa Maritime & Shipping Summit | 2024
- Delivered paper on decarbonization and hybrid propulsion retrofits.

CERTIFICATIONS
STCW 95/2010 Certificate of Competency
AutoCAD Certified Professional
    `;

    const parsed = parseCvText(rawCvText);

    assert.equal(parsed.applicant_name, 'Vincent Lang');
    assert.equal(parsed.email, 'vincent.lang.marine.engineer@oceanic-logistics.org');
    assert.ok(parsed.work_experience && parsed.work_experience.length >= 1);
    
    // Check leadership extraction
    assert.ok(parsed.leadership && parsed.leadership.length >= 1);
    const lead = parsed.leadership[0];
    assert.ok(lead.role?.includes('President') || lead.organization?.includes('Maritime Students'));

    // Check conferences extraction
    assert.ok(parsed.conferences && parsed.conferences.length >= 1);
    const conf = parsed.conferences[0];
    assert.ok(conf.name?.includes('Speaker') || conf.name?.includes('Summit') || conf.role_or_topic?.includes('Summit'));
  });
});
