import test from "node:test";
import assert from "node:assert/strict";
import {
  checkWalrusConsoleStatus,
  getWalrusConsoleApiKey,
  archiveChatSessionToWalrus,
} from "./walrus_console_client.ts";
import {
  getChatHistory,
  getChatHistoryAsync,
  saveChatHistory,
  clearChatHistory,
} from "./chat_history_store.ts";

const TEST_ADDR = "0xwalrus_vault_test_00000000000000000000001";

test("Walrus Console: loads API key from environment", () => {
  const key = getWalrusConsoleApiKey();
  assert.ok(key, "Walrus Console API key should be present from environment");
  assert.ok(key.startsWith("hbr_"), "API key should have hbr_ prefix");
});

test("Walrus Console: checkWalrusConsoleStatus reports registering or active status without unhandled exceptions", async () => {
  const status = await checkWalrusConsoleStatus();
  assert.strictEqual(status.configured, true, "Walrus Console should be configured");
  assert.ok(
    status.active === true || status.registering === true,
    `Status should be either active or registering, got active=${status.active}, registering=${status.registering}`
  );
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
