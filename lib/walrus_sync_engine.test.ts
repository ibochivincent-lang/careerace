import test from "node:test";
import assert from "node:assert/strict";
import { executeWalrusToSupabaseSync } from "./walrus_sync_engine.ts";

test("Walrus Sync Engine: executeWalrusToSupabaseSync executes without unhandled errors", async () => {
  const result = await executeWalrusToSupabaseSync({
    maxCandidates: 1,
    offset: 0,
  });

  // Verification: should complete and report status cleanly
  assert.strictEqual(typeof result.ok, "boolean");
  assert.strictEqual(typeof result.durationMs, "number");
  assert.strictEqual(typeof result.timestamp, "string");
  assert.ok(Array.isArray(result.reports), "Should contain array of candidate reports");
  assert.ok(result.totalEvaluated <= 1, "Should respect maxCandidates parameter");
});
