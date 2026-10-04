import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  normalizeSuinsName,
  isValidSuinsName,
  bindSuinsDomain,
  resolveSuinsToAddress,
} from './suins.ts';

describe('Sui Name Service (SuiNS) Integration Engine', () => {
  it('correctly normalizes handles into standard .sui domain syntax', () => {
    assert.strictEqual(normalizeSuinsName('vincent'), 'vincent.sui');
    assert.strictEqual(normalizeSuinsName('@vincent'), 'vincent.sui');
    assert.strictEqual(normalizeSuinsName('Vincent.Sui'), 'vincent.sui');
    assert.strictEqual(normalizeSuinsName('marine-engineer'), 'marine-engineer.sui');
    assert.strictEqual(normalizeSuinsName('  lang.sui  '), 'lang.sui');
  });

  it('validates RFC-1035 compliant SuiNS names', () => {
    assert.strictEqual(isValidSuinsName('vincent.sui'), true);
    assert.strictEqual(isValidSuinsName('marine-systems.sui'), true);
    assert.strictEqual(isValidSuinsName('alex123.sui'), true);

    // Invalid cases: too short (<3 chars before .sui)
    assert.strictEqual(isValidSuinsName('ab.sui'), false);
    // Invalid characters: spaces, underscores, symbols
    assert.strictEqual(isValidSuinsName('vincent lang.sui'), false);
    assert.strictEqual(isValidSuinsName('vincent_lang.sui'), false);
    assert.strictEqual(isValidSuinsName('vincent!lang.sui'), false);
  });

  it('binds a candidate sovereign address to a .sui domain and returns passport URL', async () => {
    const candidateAddress = '0x74c67e28ac89533dc41118fc1fe9cd673c3c83871188cec31941875d57971e6d';
    const testDomain = 'vincent.sui';
    const blobId = 'walrus_blob_sovereign_cv_vincent';

    const result = await bindSuinsDomain({
      candidateAddress,
      domain: testDomain,
      walrusBlobId: blobId,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.domain, 'vincent.sui');
    assert.strictEqual(result.candidateAddress, candidateAddress);
    assert.strictEqual(result.walrusBlobId, blobId);
    assert.ok(result.passportUrl.includes('/p/vincent.sui'), 'Expected passportUrl to include /p/vincent.sui');
    assert.ok(result.boundAt.length > 0);
  });

  it('rejects binding with an invalid SuiNS domain name', async () => {
    await assert.rejects(
      async () => {
        await bindSuinsDomain({
          candidateAddress: '0x123',
          domain: 'a', // invalid length
        });
      },
      { message: /Invalid SuiNS domain format/ }
    );
  });
});
