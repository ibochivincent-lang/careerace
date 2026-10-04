import test from 'node:test';
import assert from 'node:assert';
import { getRoleIntelligence, VERIFIED_ROLE_INTELLIGENCE } from './role_intelligence.ts';

test('Target Role Intelligence Engine', async (t) => {
  await t.test('correctly identifies Marine Engineering roles and extracts core problems', () => {
    const intel = getRoleIntelligence('Marine Systems Engineer (Offshore & Propulsion)');
    assert.strictEqual(intel.discipline, 'Engineering & Marine');
    assert.ok(intel.coreResponsibilities.length >= 3);
    assert.ok(intel.keyProblemsSolved.length >= 3);
    assert.ok(intel.keyProblemsSolved.some(p => p.toLowerCase().includes('propulsion') || p.toLowerCase().includes('cii')));
  });

  await t.test('correctly identifies Healthcare Informatics roles and extracts clinical problems', () => {
    const intel = getRoleIntelligence('Lead Healthcare Systems & Informatics Engineer');
    assert.strictEqual(intel.discipline, 'Medical & Healthcare Informatics');
    assert.ok(intel.coreResponsibilities.some(r => r.includes('HL7') || r.includes('FHIR')));
    assert.ok(intel.keyProblemsSolved.some(p => p.includes('EHR') || p.includes('HIPAA')));
  });

  await t.test('correctly identifies Fleet Operations and Management roles', () => {
    const intel = getRoleIntelligence('Global Fleet Operations Manager');
    assert.strictEqual(intel.discipline, 'Management & Operations');
    assert.ok(intel.coreResponsibilities.some(r => r.includes('fleet') || r.includes('drydock')));
  });

  await t.test('correctly identifies AI and Autonomous Systems roles', () => {
    const intel = getRoleIntelligence('Autonomous Systems & ML Engineer');
    assert.strictEqual(intel.discipline, 'AI & Autonomous Systems');
    assert.ok(intel.technicalKeywords.some(k => k.includes('PyTorch') || k.includes('TensorRT')));
  });

  await t.test('falls back gracefully to full stack software intelligence for generic roles', () => {
    const intel = getRoleIntelligence('Senior Systems Architect');
    assert.strictEqual(intel.discipline, 'Software & IT');
    assert.ok(intel.measurableImpactMetrics.length > 0);
  });
});
