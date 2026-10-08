import test from 'node:test';
import assert from 'node:assert/strict';
import { generateCareerRoadmap, detectDisciplineCategory } from './career_advisory.ts';

test('detectDisciplineCategory correctly classifies roles across all 6 disciplines', () => {
  assert.equal(detectDisciplineCategory('Senior Fullstack Engineer'), 'software');
  assert.equal(detectDisciplineCategory('Marine Systems Engineer'), 'marine');
  assert.equal(detectDisciplineCategory('Autonomous Systems & AI Researcher'), 'ai');
  assert.equal(detectDisciplineCategory('Clinical Informatics Specialist'), 'healthcare');
  assert.equal(detectDisciplineCategory('Fleet Technical Superintendent'), 'marine_ops');
  assert.equal(detectDisciplineCategory('Lead Security Architect & Compliance'), 'cybersecurity');
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

test('generateCareerRoadmap accurately provides Engine Cadet monthly stipend and officer day rates', () => {
  const cadetAnalysis = generateCareerRoadmap(
    'Candidate',
    'Engine Cadet / Trainee Marine Engineer',
    [],
    'maritime',
    'cadet_marine_engineer'
  );

  assert.equal(cadetAnalysis.targetTier, 'Cadet / Entry');
  assert.ok(cadetAnalysis.compensation.maritimeMonthlyStipendUSD);
  assert.equal(cadetAnalysis.compensation.maritimeMonthlyStipendUSD[0], 1800);
  assert.equal(cadetAnalysis.compensation.maritimeMonthlyStipendUSD[1], 2800);

  const secondOfficerAnalysis = generateCareerRoadmap(
    'Candidate',
    '2nd Marine Engineer Officer (First Assistant)',
    [],
    'maritime',
    'second_marine_engineer'
  );

  assert.equal(secondOfficerAnalysis.targetTier, 'Senior');
  assert.ok(secondOfficerAnalysis.compensation.dayRateMaritimeUSD);
  assert.equal(secondOfficerAnalysis.compensation.dayRateMaritimeUSD[0], 550);
  assert.equal(secondOfficerAnalysis.compensation.dayRateMaritimeUSD[1], 850);
});

test('generateCareerRoadmap supports all 6 discipline ladders and lateral pathways', () => {
  const disciplines = ['maritime', 'software', 'ai_robotics', 'healthcare', 'marine_ops', 'cybersecurity'];
  for (const discId of disciplines) {
    const analysis = generateCareerRoadmap('Candidate', '', [], discId);
    assert.ok(analysis.careerLadder && analysis.careerLadder.length >= 4, `Discipline ${discId} must have at least 4 ranks`);
    assert.ok(analysis.alternativePathways && analysis.alternativePathways.length >= 2, `Discipline ${discId} must have lateral pathways`);
    assert.ok(analysis.roadmap.length === 4, `Discipline ${discId} must have 4 quarterly milestones`);
    assert.ok(analysis.compensation.baseRangeUSD[0] > 0);
  }
});
