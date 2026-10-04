import { describe, it } from 'node:test';
import assert from 'node:assert';
import { anchorWalrusCredentialOnchain } from './walrus_anchor.ts';

describe('Sui Move Onchain Anchor for Walrus Blobs', () => {
  it('anchors a Walrus blob to candidate address and derives verifiable Sui transaction digest', async () => {
    const candidate = '0x74c67e28ac89533dc41118fc1fe9cd673c3c83871188cec31941875d57971e6d';
    const testBlobId = 'walrus_test_blob_999_candidate_cv';
    const sha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

    const result = await anchorWalrusCredentialOnchain({
      blobId: testBlobId,
      sha256Digest: sha256,
      credentialType: 'sovereign_resume',
      candidateAddress: candidate,
      fileName: 'Vincent_Lang_Marine_Systems_Resume.txt',
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.blobId, testBlobId);
    assert.strictEqual(result.sha256Digest, sha256);
    assert.strictEqual(result.candidateAddress, candidate);
    assert.strictEqual(result.credentialType, 'sovereign_resume');
    assert.ok(result.txDigest && result.txDigest.length > 20, 'Expected non-empty Sui txDigest');
    assert.ok(result.objectId && result.objectId.startsWith('0x'), 'Expected Sui object ID to start with 0x');
    assert.ok(result.explorerUrl.includes('suiscan.xyz/testnet/tx/'), 'Expected explorer link to point to suiscan testnet');
    assert.ok(result.walrusUrl.includes('/v1/blobs/'), 'Expected walrusUrl to link to blob aggregator');
    assert.ok(result.signature && result.signature.length === 128, 'Expected 64-byte Ed25519 signature in hex format');
    assert.strictEqual(result.verifiedOnchain, true);
  });

  it('supports specialized credential anchors (e.g. STCW marine licenses and certifications)', async () => {
    const candidate = '0x74c67e28ac89533dc41118fc1fe9cd673c3c83871188cec31941875d57971e6d';
    const blobId = 'walrus_cert_stcw_chief_engineer_license';

    const result = await anchorWalrusCredentialOnchain({
      blobId,
      credentialType: 'stcw_marine_license',
      candidateAddress: candidate,
      metadata: {
        issuer: 'USCG / Maritime Authority',
        stcwCode: 'III/2 Chief Engineer',
      },
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.credentialType, 'stcw_marine_license');
    assert.ok(result.txDigest.length > 0);
  });

  it('rejects anchoring if mandatory candidate address or blob ID is omitted', async () => {
    await assert.rejects(
      async () => {
        await anchorWalrusCredentialOnchain({
          blobId: '',
          candidateAddress: '0x123',
        });
      },
      { message: /Missing mandatory blobId/ }
    );
  });
});
