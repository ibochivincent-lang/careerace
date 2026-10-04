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
