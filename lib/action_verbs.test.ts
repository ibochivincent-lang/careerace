import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  replaceBulletActionVerb,
  ROLE_VERB_MAP,
  detectTense,
  integrateKeywordIntoBullet,
} from './action_verbs.ts';
import { parseCvText, ROLE_PATTERNS } from './heuristic_cv_parser.ts';

describe('Action Verbs Engine & No AI Slop', () => {
  it('detects tense accurately and preserves it', () => {
    assert.equal(detectTense('Developed modern user interface'), 'past');
    assert.equal(detectTense('Build high-throughput REST APIs'), 'present');
  });

  it('replaces verbs while maintaining grammatical correctness and stripping awkward prepositions', () => {
    // If the bullet has a preposition that would sound awkward with direct transitive verbs
    const original = 'Worked on building high-performance microservices for order routing';
    const replaced = replaceBulletActionVerb(original, 'Architected');
    assert.equal(replaced, 'Architected building high-performance microservices for order routing');
  });

  it('strictly excludes AI slop buzzwords from all suggestion categories', () => {
    const slopKeywords = ['streamline', 'leverage', 'utilize', 'facilitate', 'empower', 'robust', 'tapestry'];
    
    for (const [cat, verbSets] of Object.entries(ROLE_VERB_MAP)) {
      for (const item of [...verbSets.past, ...verbSets.present]) {
        const lower = item.verb.toLowerCase();
        for (const slop of slopKeywords) {
          assert.ok(!lower.includes(slop), `Found AI slop '${slop}' in verb '${item.verb}' under category '${cat}'`);
        }
      }
    }
  });

  it('integrates missing ATS keywords naturally into bullet without AI slop', () => {
    const original = 'Architected distributed caching layer reducing latency by 45ms.';
    const integrated = integrateKeywordIntoBullet(original, 'Redis');
    assert.ok(integrated.includes('Redis'));
    assert.ok(!integrated.toLowerCase().includes('leveraging'));
    assert.ok(!integrated.toLowerCase().includes('utilizing'));
    assert.ok(!integrated.toLowerCase().includes('streamlining'));
  });
});

describe('Universal Heuristic CV Parser - Multi-Industry', () => {
  it('identifies healthcare and clinical professions without maritime or tech bias', () => {
    const sampleCv = `
Dr. Sarah Jenkins
Email: sjenkins@healthpartners.org
Phone: +1 555-234-8901
Location: Chicago, IL

Summary
Dedicated Physician and Clinical Specialist with 8 years leading patient care teams.

Professional Experience
Physician & Clinical Specialist
Cook County Hospital
06/2019 - Present
- Diagnosed complex acute care patients across trauma and intensive care units.
- Directed multidisciplinary clinical rounds reducing readmission rate by 18%.

Education
Doctor of Medicine (M.D.)
University of Illinois College of Medicine
2019

Certifications
Board Certified in Internal Medicine
Advanced Cardiac Life Support (ACLS)
    `;

    const parsed = parseCvText(sampleCv);
    assert.equal(parsed.applicant_name, 'Dr. Sarah Jenkins');
    assert.equal(parsed.email, 'sjenkins@healthpartners.org');
    assert.ok(parsed.work_experience.length >= 1);
    assert.ok(parsed.work_experience[0].role.includes('Physician'));
    assert.equal(parsed.work_experience[0].duration, '06/2019 - Present');
    assert.ok(parsed.academic_history.length >= 1);
    assert.equal(parsed.academic_history[0].field_of_study, 'Medicine');
    assert.ok(parsed.certifications.some((c) => c.includes('Internal Medicine') || c.includes('ACLS')));
  });

  it('identifies finance, banking, and accounting professions accurately', () => {
    const sampleFinanceCv = `
Marcus Vance
Email: marcus.vance@wallstreetadvisors.com
Phone: +1 212-555-0199

Experience
Senior Financial Analyst
Goldman Sachs
03/2021 - 08/2024
- Built multi-currency DCF valuation models for $2.4B cross-border acquisitions.
- Conducted variance analysis and delivered quarterly board presentations.

Education
Bachelor of Science in Finance
New York University
2021
    `;

    const parsed = parseCvText(sampleFinanceCv);
    assert.equal(parsed.applicant_name, 'Marcus Vance');
    assert.ok(parsed.work_experience.some((w) => w.role.includes('Financial Analyst')));
    assert.equal(parsed.work_experience[0].duration, '03/2021 - 08/2024');
    assert.ok(parsed.target_roles.some((r) => r.includes('Financial Analyst')));
  });
});
