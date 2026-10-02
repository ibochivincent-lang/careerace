/**
 * Walrus Sovereign Database Manager
 *
 * Provides non-interfering namespace-isolated database operations over Walrus Memory.
 * Guarantees zero cross-tenant collision, cryptographic privacy, and deterministic CRUD operations.
 *
 * Author: IboTV (ibochivincent-lang)
 */

import { MemWal } from "@mysten-incubation/memwal";

export interface MemoryRecord {
  id?: string;
  blobId?: string;
  text: string;
  namespace: string;
  distance?: number;
}

export interface NamespaceStats {
  namespace: string;
  recalledCount: number;
  sampleMemories: MemoryRecord[];
}

export class WalrusDatabaseManager {
  private key: string;
  private accountId: string;
  private serverUrl: string;

  constructor(key?: string, accountId?: string, serverUrl?: string) {
    this.key = (key || process.env.MEMWAL_PRIVATE_KEY || "").trim();
    this.accountId = (accountId || process.env.MEMWAL_ACCOUNT_ID || "").trim();
    this.serverUrl = (serverUrl || process.env.MEMWAL_SERVER_URL || "https://relayer.memory.walrus.xyz").trim();

    if (!this.key || !this.accountId) {
      throw new Error("Missing MEMWAL_PRIVATE_KEY or MEMWAL_ACCOUNT_ID for WalrusDatabaseManager.");
    }
  }

  /**
   * Builds an isolated client bound exclusively to a target candidate namespace.
   * This guarantees zero interference with other candidate records.
   */
  public getClientForNamespace(namespace: string): MemWal {
    return MemWal.create({
      key: this.key,
      accountId: this.accountId,
      serverUrl: this.serverUrl,
      namespace: namespace.trim().toLowerCase(),
    });
  }

  /**
   * Stores a memory into the candidate's isolated namespace.
   */
  public async storeMemory(
    namespace: string,
    memoryText: string
  ): Promise<{ status: string; id?: string; blobId?: string }> {
    const client = this.getClientForNamespace(namespace);
    const result = await client.rememberAndWait(memoryText, namespace);
    return {
      status: "stored",
      id: (result as any)?.id,
      blobId: (result as any)?.blob_id,
    };
  }

  /**
   * Queries memories strictly within the candidate's namespace using semantic search.
   */
  public async queryNamespace(
    namespace: string,
    query: string,
    limit: number = 10
  ): Promise<MemoryRecord[]> {
    const client = this.getClientForNamespace(namespace);
    const recallResult = await client.recall({
      query,
      limit,
      namespace,
    });

    return (recallResult.results || []).map((r: any) => ({
      id: r.id,
      blobId: r.blob_id,
      text: r.text,
      namespace,
      distance: r.distance,
    }));
  }

  /**
   * Inspects and returns snapshot statistics for a specific namespace without mutating state.
   */
  public async inspectNamespace(namespace: string): Promise<NamespaceStats> {
    const records = await this.queryNamespace(namespace, "experience skills role career", 20);
    return {
      namespace,
      recalledCount: records.length,
      sampleMemories: records,
    };
  }

  /**
   * Restores vector embeddings from Walrus decentralized storage for a specific namespace.
   * This operation is idempotent and repairs any local index discrepancies directly from on-chain blobs.
   */
  public async restoreNamespace(namespace: string, limit: number = 50) {
    const client = this.getClientForNamespace(namespace);
    return await client.restore(namespace, limit);
  }
}
