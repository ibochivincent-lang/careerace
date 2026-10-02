/**
 * Walrus Memory to Supabase Synchronization Bridge
 *
 * Synchronizes candidate profiles, decentralized Walrus blob IDs, and STAR+R
 * evaluations into Supabase PostgreSQL tables with strict zero-interference partitioning.
 *
 * Author: IboTV (ibochivincent-lang)
 */

import { SupabaseDatabaseService } from "../lib/supabase.ts";
import { CANDIDATE_PROFILES_30 } from "./seed_30_mainnet_users.ts";
import { WalrusDatabaseManager } from "../lib/database_manager.ts";

async function syncToSupabase() {
  const db = new SupabaseDatabaseService();

  if (!db.isConfigured()) {
    console.log(`
[Supabase Sync] SUPABASE_URL or SUPABASE_ANON_KEY is not configured in .env.local.
To enable Supabase synchronization:
1. Create a project at https://supabase.com
2. Paste the contents of 'supabase_schema.sql' into the Supabase SQL Editor.
3. Add SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) to .env.local.
    `);
    process.exit(0);
  }

  console.log("Supabase configured! Starting synchronization from Walrus Memory...");
  const manager = new WalrusDatabaseManager();

  for (const candidate of CANDIDATE_PROFILES_30) {
    const fakeWallet = `0x${candidate.id.padEnd(64, "0")}`;

    console.log(`Syncing candidate: ${candidate.name} (Wallet: ${fakeWallet.slice(0, 10)}...)`);

    // 1. Upsert candidate
    await db.upsertCandidate({
      wallet_address: fakeWallet,
      name: candidate.name,
      target_role: candidate.domain,
      namespace: candidate.namespace,
    });

    // 2. Query memories from Walrus
    const memories = await manager.queryNamespace(candidate.namespace, "experience skills role", 15);
    console.log(`  -> Found ${memories.length} memories on Walrus Mainnet. Syncing to Supabase...`);

    for (const mem of memories) {
      const factKind = mem.text.split(":")[0]?.toLowerCase() || "experience";
      await db.recordMemory({
        candidate_wallet: fakeWallet,
        namespace: candidate.namespace,
        fact_kind: factKind,
        fact_text: mem.text,
        walrus_blob_id: mem.blobId,
      });
    }
  }

  console.log("\nAll candidate profiles and Walrus memories synchronized to Supabase successfully!");
}

syncToSupabase().catch((err) => {
  console.error("Sync error:", err.message);
});
