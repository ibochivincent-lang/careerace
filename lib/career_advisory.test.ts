import test from 'node:test';
import assert from 'node:assert/strict';
import { generateCareerRoadmap, detectDisciplineCategory } from './career_advisory.ts';

test('detectDisciplineCategory correctly classifies roles', () => {
  assert.equal(detectDisciplineCategory('Senior Fullstack Engineer'), 'software');
  assert.equal(detectDisciplineCategory('Marine Systems Engineer'), 'marine');
  assert.equal(detectDisciplineCategory('Autonomous Systems & AI Researcher'), 'ai');
  assert.equal(detectDisciplineCategory('Clinical Informatics Specialist'), 'healthcare');
});

test('generateCareerRoadmap calculates skill gaps and creates quarterly milestones', () => {
  const analysis = generateCareerRoadmap(
    'Junior Software Engineer',
    'Senior Distributed Systems Engineer',
    ['TypeScript', 'React', 'Node.js']
  );

  assert.equal(analysis.currentTier, 'Mid-Level');
  assert.equal(analysis.targetTier, 'Senior');
  assert.ok(analysis.skillGaps.length > 0);
  assert.ok(analysis.skillGaps.some(g => g.skill.includes('Distributed Systems') || g.skill.includes('Cloud Architecture') || g.skill.includes('Docker')));
  assert.equal(analysis.roadmap.length, 4);
  assert.equal(analysis.compensation.tier, 'Senior');
  assert.ok(analysis.compensation.baseRangeUSD[0] >= 140000);
});

test('generateCareerRoadmap accurately provides maritime day rates and certifications', () => {
  const marineAnalysis = generateCareerRoadmap(
    'Engine Cadet',
    'Chief Engineer (STCW III/2)',
    ['Engine Watchkeeping', 'Bunkering Operations']
  );

  assert.ok(marineAnalysis.compensation.dayRateMaritimeUSD);
  assert.ok(marineAnalysis.compensation.dayRateMaritimeUSD[0] >= 400);
  assert.ok(marineAnalysis.skillGaps.length > 0);
});
