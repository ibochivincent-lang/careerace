/**
 * Walrus Memory to Supabase Synchronization Bridge
 *
 * Synchronizes candidate profiles, decentralized Walrus blob IDs, and STAR+R
 * evaluations into Supabase PostgreSQL tables with strict zero-interference partitioning.
 *
 * Author: IboTV (ibochivincent-lang)
 */

import { executeWalrusToSupabaseSync } from "../lib/walrus_sync_engine.ts";

async function runCliSync() {
  const limitArg = process.argv[2] ? parseInt(process.argv[2], 10) : 30;
  console.log(`[Supabase Sync] Starting Walrus to Supabase sync (limit: ${limitArg})...`);

  const result = await executeWalrusToSupabaseSync({ maxCandidates: limitArg });

  console.log("\n[Sync Summary]:");
  console.log(`- Success: ${result.ok}`);
  console.log(`- Synced Candidates: ${result.syncedCandidates}/${result.totalEvaluated}`);
  console.log(`- Synced Memories: ${result.syncedMemories}`);
  console.log(`- Duration: ${result.durationMs}ms`);

  if (result.notice) {
    console.log(`- Notice: ${result.notice}`);
  }

  for (const r of result.reports) {
    console.log(`  * ${r.name}: ${r.synced ? `✅ Synced (${r.memoriesFound} memories)` : `❌ Failed (${r.error})`}`);
  }
}

runCliSync().catch((err) => {
  console.error("Sync error:", err.message);
  process.exit(1);
});
