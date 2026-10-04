/**
 * CareerAce Sovereign Cloud Synchronization Helper
 * Ensures instantaneous cross-device data consistency (Desktop <-> Mobile)
 * backed by Supabase PostgreSQL and Walrus Decentralized Storage.
 */

export interface CloudSyncPayload {
  profile?: any;
  walrusBlobId?: string | null;
  walrusVersions?: any[];
  appliedJobs?: any[];
  savedJobIds?: string[];
  coverLetter?: string;
}

export async function restoreCandidateDataFromCloud(): Promise<{
  restored: boolean;
  profile?: any;
  walrusBlobId?: string | null;
  walrusVersions?: any[];
  appliedJobs?: any[];
  savedJobIds?: string[];
  coverLetter?: string;
} | null> {
  if (typeof window === "undefined") return null;

  try {
    const res = await fetch("/api/candidate/sync", { credentials: "same-origin" });
    if (!res.ok) return null;
    const data = await res.json();

    if (!data.success || !data.authenticated) return null;

    let didRestoreAny = false;

    if (data.profile) {
      try {
        localStorage.setItem("careerace_sovereign_profile", JSON.stringify(data.profile));
        didRestoreAny = true;
      } catch {}
    }

    if (data.walrusBlobId) {
      try {
        localStorage.setItem("careerace_walrus_blob_id", data.walrusBlobId);
      } catch {}
    }

    if (Array.isArray(data.walrusVersions) && data.walrusVersions.length > 0) {
      try {
        localStorage.setItem("careerace_walrus_versions", JSON.stringify(data.walrusVersions));
        didRestoreAny = true;
      } catch {}
    }

    if (Array.isArray(data.appliedJobs) && data.appliedJobs.length > 0) {
      try {
        localStorage.setItem("careerace_applied_jobs", JSON.stringify(data.appliedJobs));
        didRestoreAny = true;
      } catch {}
    }

    if (Array.isArray(data.savedJobIds) && data.savedJobIds.length > 0) {
      try {
        localStorage.setItem("careerace_saved_jobs", JSON.stringify(data.savedJobIds));
      } catch {}
    }

    if (data.coverLetter && typeof data.coverLetter === "string" && data.coverLetter.trim()) {
      try {
        localStorage.setItem("careerace_tailored_cover_letter", data.coverLetter);
        didRestoreAny = true;
      } catch {}
    }

    return {
      restored: didRestoreAny,
      profile: data.profile,
      walrusBlobId: data.walrusBlobId,
      walrusVersions: data.walrusVersions,
      appliedJobs: data.appliedJobs,
      savedJobIds: data.savedJobIds,
      coverLetter: data.coverLetter,
    };
  } catch (err) {
    console.warn("[cloud_sync] Failed to restore from cloud:", err);
    return null;
  }
}

let syncTimeout: any = null;

export function syncCandidateDataToCloud(payload?: CloudSyncPayload): void {
  if (typeof window === "undefined") return;

  // Debounce rapid edits (e.g. typing)
  if (syncTimeout) clearTimeout(syncTimeout);

  syncTimeout = setTimeout(async () => {
    try {
      let finalProfile = payload?.profile;
      if (!finalProfile) {
        try {
          const stored = localStorage.getItem("careerace_sovereign_profile");
          if (stored) finalProfile = JSON.parse(stored);
        } catch {}
      }

      let finalBlobId = payload?.walrusBlobId;
      if (finalBlobId === undefined) {
        try {
          finalBlobId = localStorage.getItem("careerace_walrus_blob_id") || finalProfile?.walrus_blob_id;
        } catch {}
      }

      let finalVersions = payload?.walrusVersions;
      if (!finalVersions) {
        try {
          const stored = localStorage.getItem("careerace_walrus_versions");
          if (stored) finalVersions = JSON.parse(stored);
        } catch {}
      }

      let finalApplied = payload?.appliedJobs;
      if (!finalApplied) {
        try {
          const stored = localStorage.getItem("careerace_applied_jobs");
          if (stored) finalApplied = JSON.parse(stored);
        } catch {}
      }

      let finalSaved = payload?.savedJobIds;
      if (!finalSaved) {
        try {
          const stored = localStorage.getItem("careerace_saved_jobs");
          if (stored) finalSaved = JSON.parse(stored);
        } catch {}
      }

      let finalCoverLetter = payload?.coverLetter;
      if (!finalCoverLetter) {
        try {
          finalCoverLetter = localStorage.getItem("careerace_tailored_cover_letter") || undefined;
        } catch {}
      }

      // If there is no data to sync, skip
      if (!finalProfile && !finalBlobId && !finalVersions?.length && !finalApplied?.length) {
        return;
      }

      await fetch("/api/candidate/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          profile: finalProfile,
          walrusBlobId: finalBlobId,
          walrusVersions: finalVersions,
          appliedJobs: finalApplied,
          savedJobIds: finalSaved,
          coverLetter: finalCoverLetter,
        }),
      });
    } catch (err) {
      console.warn("[cloud_sync] Background cloud sync error:", err);
    }
  }, 800);
}

import { createClient } from "@supabase/supabase-js";
import { getSanitizedSupabaseUrl } from "./supabase";

export interface RealtimeSyncEvent {
  kind: "sovereign_profile_snapshot" | "walrus_versions_snapshot" | "tailored_cover_letter_snapshot" | "saved_jobs_snapshot" | "sui_onchain_anchor" | string;
  data: any;
  walrusBlobId?: string | null;
  updatedAt?: string;
}

let browserSupabaseClient: any = null;

function getBrowserSupabaseClient() {
  if (browserSupabaseClient) return browserSupabaseClient;
  const url = getSanitizedSupabaseUrl();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  browserSupabaseClient = createClient(url, anonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
  return browserSupabaseClient;
}

/**
 * Subscribes to Supabase Realtime WebSocket channel on candidate_memories table.
 * Changes made on desktop will reflect on open mobile screens live within 50ms without page refresh.
 */
export function subscribeCandidateRealtime(
  walletAddress: string,
  onUpdate: (event: RealtimeSyncEvent) => void,
  onStatusChange?: (status: string) => void
): () => void {
  if (typeof window === "undefined" || !walletAddress) return () => {};

  const client = getBrowserSupabaseClient();
  if (!client) return () => {};

  const cleanAddress = walletAddress.toLowerCase().trim();
  const channelName = `realtime_memories_${cleanAddress.replace(/[^a-z0-9]/g, "_").slice(0, 32)}`;

  try {
    const channel = client
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "candidate_memories",
          filter: `candidate_wallet=eq.${cleanAddress}`,
        },
        (payload: any) => {
          const newRecord = payload?.new;
          if (!newRecord || !newRecord.fact_kind) return;

          const kind = newRecord.fact_kind;
          const text = newRecord.fact_text;
          const blobId = newRecord.walrus_blob_id || null;

          if (kind === "sovereign_profile_snapshot" && text) {
            try {
              const parsed = JSON.parse(text);
              localStorage.setItem("careerace_sovereign_profile", JSON.stringify(parsed));
              if (blobId) localStorage.setItem("careerace_walrus_blob_id", blobId);
              onUpdate({ kind, data: parsed, walrusBlobId: blobId, updatedAt: newRecord.created_at });
            } catch {}
          } else if (kind === "walrus_versions_snapshot" && text) {
            try {
              const parsed = JSON.parse(text);
              localStorage.setItem("careerace_walrus_versions", JSON.stringify(parsed));
              onUpdate({ kind, data: parsed, walrusBlobId: blobId, updatedAt: newRecord.created_at });
            } catch {}
          } else if (kind === "tailored_cover_letter_snapshot" && text) {
            localStorage.setItem("careerace_tailored_cover_letter", text);
            onUpdate({ kind, data: text, walrusBlobId: blobId, updatedAt: newRecord.created_at });
          } else if (kind === "saved_jobs_snapshot" && text) {
            try {
              const parsed = JSON.parse(text);
              localStorage.setItem("careerace_saved_jobs", JSON.stringify(parsed));
              onUpdate({ kind, data: parsed, updatedAt: newRecord.created_at });
            } catch {}
          } else if (kind === "sui_onchain_anchor" && text) {
            try {
              const parsed = JSON.parse(text);
              onUpdate({ kind, data: parsed, walrusBlobId: blobId, updatedAt: newRecord.created_at });
            } catch {}
          }
        }
      )
      .subscribe((status: string) => {
        if (onStatusChange) onStatusChange(status);
      });

    return () => {
      try {
        client.removeChannel(channel);
      } catch {}
    };
  } catch (err) {
    console.warn("[cloud_sync] Realtime subscription init error:", err);
    return () => {};
  }
}
