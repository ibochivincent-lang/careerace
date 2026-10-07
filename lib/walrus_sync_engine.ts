/**
 * Walrus-to-Supabase Automated Synchronization Engine
 *
 * Periodically bridges sovereign Walrus decentralized memory vectors and
 * verified candidate credentials into Supabase PostgreSQL tables.
 *
 * Author: IboTV (ibochivincent-lang)
 */

import { SupabaseDatabaseService } from "./supabase.ts";
import { CANDIDATE_PROFILES_30 } from "../scripts/seed_30_mainnet_users.ts";
import { WalrusDatabaseManager } from "./database_manager.ts";

export interface CandidateUser {
  id: string;
  name: string;
  namespace: string;
  domain: string;
  memories: string[];
}

export interface WalrusSyncOptions {
  maxCandidates?: number;
  candidates?: CandidateUser[];
  offset?: number;
}

export interface CandidateSyncReport {
  candidateId: string;
  name: string;
  wallet: string;
  namespace: string;
  memoriesFound: number;
  synced: boolean;
  error?: string;
}

export interface WalrusSyncResult {
  ok: boolean;
  syncedCandidates: number;
  syncedMemories: number;
  totalEvaluated: number;
  reports: CandidateSyncReport[];
  durationMs: number;
  timestamp: string;
  notice?: string;
}

/**
 * Executes an automated synchronization batch from Walrus Mainnet to Supabase.
 */
export async function executeWalrusToSupabaseSync(
  options: WalrusSyncOptions = {}
): Promise<WalrusSyncResult> {
  const startTime = Date.now();
  const db = new SupabaseDatabaseService();

  if (!db.isConfigured()) {
    return {
      ok: false,
      syncedCandidates: 0,
      syncedMemories: 0,
      totalEvaluated: 0,
      reports: [],
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      notice: "Supabase database client is unconfigured in this environment.",
    };
  }

  let manager: WalrusDatabaseManager | null = null;
  try {
    manager = new WalrusDatabaseManager();
  } catch (err: any) {
    return {
      ok: false,
      syncedCandidates: 0,
      syncedMemories: 0,
      totalEvaluated: 0,
      reports: [],
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      notice: `Walrus database credentials notice: ${err?.message || "Missing relayer credentials."}`,
    };
  }

  const allCandidates = options.candidates || CANDIDATE_PROFILES_30;
  const max = Math.min(options.maxCandidates || 10, allCandidates.length);
  const offset = options.offset || 0;
  const targetCandidates = allCandidates.slice(offset, offset + max);

  const reports: CandidateSyncReport[] = [];
  let totalMemoriesSynced = 0;
  let successfulCandidates = 0;

  for (const candidate of targetCandidates) {
    const candidateWallet = `0x${candidate.id.padEnd(64, "0")}`;
    const report: CandidateSyncReport = {
      candidateId: candidate.id,
      name: candidate.name,
      wallet: candidateWallet,
      namespace: candidate.namespace,
      memoriesFound: 0,
      synced: false,
    };

    try {
      // 1. Upsert candidate profile into Supabase
      await db.upsertCandidate({
        wallet_address: candidateWallet,
        name: candidate.name,
        target_role: candidate.domain,
        namespace: candidate.namespace,
      });

      // 2. Query memories stored on Walrus decentralized storage
      let memories = await manager.queryNamespace(candidate.namespace, "experience skills role", 15);

      // If remote returned empty (e.g. network latency or new namespace), mirror defined memories
      if (!memories || memories.length === 0) {
        memories = candidate.memories.map((text, idx) => ({
          text,
          namespace: candidate.namespace,
          id: `seed_${candidate.id}_${idx}`,
        }));
      }

      report.memoriesFound = memories.length;

      // 3. Upsert individual memories
      for (const mem of memories) {
        const factKind = mem.text.split(":")[0]?.toLowerCase().trim() || "experience";
        await db.recordMemory({
          candidate_wallet: candidateWallet,
          namespace: candidate.namespace,
          fact_kind: factKind,
          fact_text: mem.text,
          walrus_blob_id: mem.blobId || undefined,
        });
        totalMemoriesSynced++;
      }

      report.synced = true;
      successfulCandidates++;
    } catch (err: any) {
      report.error = err?.message || String(err);
      console.warn(`[walrus_sync] Error syncing ${candidate.name}:`, report.error);
    }

    reports.push(report);
  }

  return {
    ok: successfulCandidates > 0,
    syncedCandidates: successfulCandidates,
    syncedMemories: totalMemoriesSynced,
    totalEvaluated: targetCandidates.length,
    reports,
    durationMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };
}
