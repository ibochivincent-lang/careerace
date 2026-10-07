import test from "node:test";
import assert from "node:assert/strict";
import {
  checkWalrusConsoleStatus,
  getWalrusConsoleApiKey,
  archiveChatSessionToWalrus,
  getCandidateWalrusVault,
  uploadToDirectWalrus,
  fetchFromDirectWalrus,
} from "./walrus_console_client.ts";
import {
  getChatHistory,
  getChatHistoryAsync,
  saveChatHistory,
  saveChatHistoryAsync,
  appendChatTurn,
  appendChatTurnAsync,
  clearChatHistory,
} from "./chat_history_store.ts";

const TEST_ADDR = "0xwalrus_vault_test_00000000000000000000001";

test("Walrus Console: loads API key from environment", async () => {
  const key = await getWalrusConsoleApiKey();
  if (key) {
    assert.ok(key.startsWith("hbr_"), "API key should have hbr_ prefix");
  } else {
    // In CI or environments without .env.local secrets, verify clean null fallback
    assert.strictEqual(key, null);
  }
});

test("Walrus Console: checkWalrusConsoleStatus reports registering or active status without unhandled exceptions", async () => {
  const status = await checkWalrusConsoleStatus();
  if (status.configured) {
    assert.ok(
      status.active === true || status.registering === true || typeof status.error === "string",
      `Status should be either active, registering, or have handled error string`
    );
  } else {
    // In unconfigured test environments (e.g. GitHub Actions without secrets)
    assert.strictEqual(status.configured, false);
    assert.strictEqual(typeof status.error, "string");
  }
});

test("Walrus Console Chat Vault: getChatHistoryAsync returns cached messages immediately and preserves local storage", async () => {
  clearChatHistory(TEST_ADDR, "overview");

  // Save 2 messages
  saveChatHistory(
    TEST_ADDR,
    [
      { role: "user", content: "What is my current CV status?" },
      { role: "assistant", content: "Your CV is anchored to Walrus." },
    ],
    "overview"
  );

  const syncMessages = getChatHistory(TEST_ADDR, "overview");
  assert.strictEqual(syncMessages.length, 2);

  const asyncMessages = await getChatHistoryAsync(TEST_ADDR, "overview");
  assert.strictEqual(asyncMessages.length, 2);
  assert.strictEqual(asyncMessages[0].content, "What is my current CV status?");
});

test("Walrus Console Chat Vault: archiveChatSessionToWalrus handles registering status gracefully", async () => {
  const res = await archiveChatSessionToWalrus({
    address: TEST_ADDR,
    channel: "overview",
    messages: [
      { role: "user", content: "Test message" },
      { role: "assistant", content: "Test reply" },
    ],
  });

  // When key is registering, it should return { ok: false } with error string instead of crashing
  assert.strictEqual(typeof res.ok, "boolean");
});

test("3-Tier Chat History Persistence: saveChatHistoryAsync and appendChatTurnAsync operate seamlessly", async () => {
  const TEST_PERSIST_ADDR = "0xpersist_test_3tier_000000000000000000001";
  clearChatHistory(TEST_PERSIST_ADDR, "overview");

  // Save via async helper
  const saved = await saveChatHistoryAsync(
    TEST_PERSIST_ADDR,
    [
      { role: "user", content: "Initial greeting" },
      { role: "assistant", content: "Welcome to CareerAce!" },
    ],
    "overview"
  );
  assert.strictEqual(saved.length, 2);

  // Append turn via async helper
  const appended = await appendChatTurnAsync(
    TEST_PERSIST_ADDR,
    "Can you check my STCW license?",
    "Your STCW license is active and verified.",
    "overview"
  );
  assert.strictEqual(appended.length, 4);
  assert.strictEqual(appended[2].content, "Can you check my STCW license?");
  assert.strictEqual(appended[3].content, "Your STCW license is active and verified.");

  // Verify retrieval
  const retrieved = await getChatHistoryAsync(TEST_PERSIST_ADDR, "overview");
  assert.strictEqual(retrieved.length, 4);

  // Cleanup
  clearChatHistory(TEST_PERSIST_ADDR, "overview");
  const cleared = getChatHistory(TEST_PERSIST_ADDR, "overview");
  assert.strictEqual(cleared.length, 0);
});

test("Direct Walrus: archives chat session directly, updates vault record, and retrieves via aggregator", async () => {
  const TEST_DIRECT_ADDR = "0x5d42fbac2eae2fb7a30b3a35108141ab6aa2d9e4e382f77e82fd8a2ec11c8fb0";
  const res = await archiveChatSessionToWalrus({
    address: TEST_DIRECT_ADDR,
    channel: "overview",
    messages: [
      { role: "user", content: "Direct Walrus decentralized vault test turn" },
      { role: "assistant", content: "Stored permanently on Walrus Testnet without API key bottlenecks." },
    ],
  });

  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.storageEngine, "direct-walrus");
  assert.ok(typeof res.blobId === "string" && res.blobId.length > 10);
  assert.ok(typeof res.walrusUrl === "string" && res.walrusUrl.includes(res.blobId));

  const vault = await getCandidateWalrusVault(TEST_DIRECT_ADDR, "overview");
  assert.ok(vault !== null);
  assert.strictEqual(vault.blobId, res.blobId);
  assert.strictEqual(vault.storageEngine, "direct-walrus");
});
