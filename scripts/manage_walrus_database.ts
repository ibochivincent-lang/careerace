/**
 * Walrus Sovereign Database Management CLI Utility
 *
 * Usage:
 *   node --env-file-if-exists=.env.local --experimental-strip-types scripts/manage_walrus_database.ts inspect <namespace>
 *   node --env-file-if-exists=.env.local --experimental-strip-types scripts/manage_walrus_database.ts query <namespace> "<search_query>"
 *   node --env-file-if-exists=.env.local --experimental-strip-types scripts/manage_walrus_database.ts restore <namespace>
 *
 * Author: IboTV (ibochivincent-lang)
 */

import { WalrusDatabaseManager } from "../lib/database_manager.ts";

async function runCli() {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();
  const namespace = args[1];
  const queryParam = args[2] || "career experience target role";

  if (!command || !namespace) {
    console.log(`
Walrus Database Manager CLI (Zero-Interference Sovereign Operations)
Author: IboTV

Commands:
  inspect <namespace>                Inspect memories stored in an isolated namespace
  query   <namespace> "<query>"      Execute semantic search strictly within a namespace
  restore <namespace>                Rebuild vector embeddings from Walrus on-chain blobs
    `);
    process.exit(0);
  }

  const manager = new WalrusDatabaseManager();

  console.log(`\nExecuting '${command}' on isolated namespace: [${namespace}]`);

  switch (command) {
    case "inspect": {
      const stats = await manager.inspectNamespace(namespace);
      console.log(`\n--- Namespace Inspection: ${namespace} ---`);
      console.log(`Recalled Active Memories: ${stats.recalledCount}`);
      stats.sampleMemories.forEach((m, idx) => {
        console.log(`  [${idx + 1}] (dist: ${m.distance?.toFixed(3) ?? "N/A"}) ${m.text}`);
      });
      break;
    }

    case "query": {
      console.log(`Searching with query: "${queryParam}"...`);
      const results = await manager.queryNamespace(namespace, queryParam, 10);
      console.log(`Found ${results.length} matching memories in ${namespace}:`);
      results.forEach((r, idx) => {
        console.log(`  #${idx + 1} [score: ${r.distance?.toFixed(3)}] ${r.text}`);
      });
      break;
    }

    case "restore": {
      console.log(`Triggering idempotent Walrus blob re-indexing for ${namespace}...`);
      const restoreResult = await manager.restoreNamespace(namespace, 50);
      console.log("Restore Result:", restoreResult);
      break;
    }

    default: {
      console.error(`Unknown command: ${command}`);
      break;
    }
  }
}

runCli().catch((err) => {
  console.error("Database manager error:", err.message);
});
