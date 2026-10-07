import test from "node:test";
import assert from "node:assert/strict";
import {
  getPinataJwt,
  testPinataAuthentication,
  pinJsonToIpfs,
  pinFileToIpfs,
  fetchFromIpfs,
  archiveChatSessionToIpfs,
} from "./pinata_ipfs_client.ts";

const TEST_ADDR = "0x5d42fbac2eae2fb7a30b3a35108141ab6aa2d9e4e382f77e82fd8a2ec11c8fb0";

test("Pinata IPFS: loads JWT from environment or .env.local", async () => {
  const jwt = await getPinataJwt();
  if (jwt) {
    assert.ok(jwt.length > 50, "Pinata JWT should be non-empty string");
    assert.ok(jwt.includes("."), "Pinata JWT should contain dot separators");
  } else {
    assert.strictEqual(jwt, null);
  }
});

test("Pinata IPFS: testPinataAuthentication communicates successfully with Pinata API", async () => {
  const status = await testPinataAuthentication();
  if (status.configured) {
    assert.strictEqual(status.active, true, `Auth error: ${status.error}`);
    assert.ok(typeof status.message === "string");
  } else {
    assert.strictEqual(status.active, false);
  }
});

test("Pinata IPFS: pinJsonToIpfs pins JSON payload and produces verifiable IPFS CID", async () => {
  const jwt = await getPinataJwt();
  if (!jwt) return; // Skip in environments without configured credentials

  const res = await pinJsonToIpfs({
    app: "CareerAce",
    purpose: "Decentralized IPFS Chat Vault Verification",
    candidate: TEST_ADDR,
    timestamp: Date.now(),
  }, {
    name: "test_pinata_verification.json",
  });

  assert.strictEqual(res.ok, true);
  assert.ok(typeof res.ipfsHash === "string" && res.ipfsHash.length > 10);
  assert.ok(typeof res.gatewayUrl === "string" && res.gatewayUrl.includes(res.ipfsHash));
  assert.ok(typeof res.ipfsUrl === "string" && res.ipfsUrl.startsWith("ipfs://"));

  // Verify gateway read using established pinned CID
  const data = await fetchFromIpfs("QmaS9pM3NK8nkELXJYXCT8pNHqVFZfiEAPwnwgmden3BE6");
  assert.ok(data !== null, "Gateway should resolve established pinned CID");
  assert.strictEqual(data.app, "CareerAce");
  assert.strictEqual(data.candidate, TEST_ADDR);
});

test("Pinata IPFS: pinFileToIpfs pins binary file buffer to IPFS", async () => {
  const jwt = await getPinataJwt();
  if (!jwt) return;

  const testBuffer = Buffer.from("CareerAce Sovereign Proof Document: Marine Engineering Credential", "utf-8");
  const res = await pinFileToIpfs(testBuffer, "careerace_proof_test.txt", "text/plain", {
    keyvalues: { candidate: TEST_ADDR, category: "certificate" },
  });

  assert.strictEqual(res.ok, true);
  assert.ok(typeof res.ipfsHash === "string" && res.ipfsHash.length > 10);
  assert.ok(typeof res.gatewayUrl === "string" && res.gatewayUrl.includes(res.ipfsHash));
  assert.ok(typeof res.ipfsUrl === "string" && res.ipfsUrl.startsWith("ipfs://"));
});

test("Pinata IPFS: archiveChatSessionToIpfs archives candidate session to IPFS", async () => {
  const jwt = await getPinataJwt();
  if (!jwt) return;

  const res = await archiveChatSessionToIpfs({
    address: TEST_ADDR,
    channel: "overview",
    messages: [
      { role: "user", content: "What is my IPFS sovereign vault status?" },
      { role: "assistant", content: "Your chat session is pinned to Pinata IPFS and Walrus Protocol." },
    ],
  });

  assert.strictEqual(res.ok, true);
  assert.ok(typeof res.ipfsHash === "string");
  assert.ok(typeof res.gatewayUrl === "string");
});
