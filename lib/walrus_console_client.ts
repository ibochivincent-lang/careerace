/**
 * Walrus Console Sovereign Storage Vault Adapter (console.walrus.xyz)
 *
 * Provides persistent sovereign storage for chat transcripts, audit trails,
 * and candidate archives backed by Walrus decentralized storage.
 * Active deployment connection to Vercel production environment.
 *
 * NOTE: No top-level Node.js `fs`/`path` imports — this module runs in
 * Vercel serverless AND Edge runtimes where those modules are unavailable.
 * The .env.local fallback uses a dynamic import that is safely caught.
 */

export interface WalrusConsoleSpace {
  id: string;
  type: "personal" | "team";
  name: string;
  storage_used: number;
  storage_cap: number;
  bucket_count: number;
}

export interface WalrusConsoleBucket {
  id: string;
  space_id: string;
  name: string;
  oyster_bucket_name: string;
  visibility: "public" | "private";
  storage_used?: number;
}

export interface WalrusConsoleFile {
  id: string;
  bucket_id: string;
  name: string;
  blob_id: string | null;
  size: number;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface WalrusConsoleStatus {
  configured: boolean;
  active: boolean;
  registering: boolean;
  error?: string;
  spacesCount?: number;
}

const WALRUS_CONSOLE_BASE_URL =
  process.env.WALRUS_CONSOLE_BASE_URL || "https://api.console.walrus.xyz/api/v1";

/**
 * Returns the Walrus Console API key from env vars.
 * Falls back to reading .env.local via dynamic fs import (local script runners only).
 * Safe to call in serverless/Edge — the fs fallback is always caught.
 */
export async function getWalrusConsoleApiKey(): Promise<string | null> {
  if (process.env.WALRUS_CONSOLE_API_KEY) {
    return process.env.WALRUS_CONSOLE_API_KEY.trim();
  }
  if (process.env.NEXT_PUBLIC_WALRUS_CONSOLE_API_KEY) {
    return process.env.NEXT_PUBLIC_WALRUS_CONSOLE_API_KEY.trim();
  }

  // Local script runner fallback — dynamic import is caught if fs is unavailable
  try {
    const [{ default: fs }, { default: path }] = await Promise.all([
      import("node:fs"),
      import("node:path"),
    ]);
    const envPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(/^WALRUS_CONSOLE_API_KEY=(.+)$/m);
      if (match?.[1]) return match[1].trim();
    }
  } catch {
    // fs unavailable in serverless/Edge — expected
  }

  return null;
}



/**
 * Checks the real-time registration and health status of the Walrus Console API key.
 */
export async function checkWalrusConsoleStatus(): Promise<WalrusConsoleStatus> {
  const apiKey = await getWalrusConsoleApiKey();
  if (!apiKey) {
    return {
      configured: false,
      active: false,
      registering: false,
      error: "No WALRUS_CONSOLE_API_KEY configured",
    };
  }

  try {
    const res = await fetch(`${WALRUS_CONSOLE_BASE_URL}/spaces`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "User-Agent": "CareerAce-Vault/1.0",
      },
      cache: "no-store",
    });

    if (res.status === 200) {
      const data = await res.json();
      const spaces = Array.isArray(data) ? data : data?.data || [];
      return {
        configured: true,
        active: true,
        registering: false,
        spacesCount: spaces.length,
      };
    }

    const errData = await res.json().catch(() => ({}));
    if (res.status === 401 && errData.code === "api_key_registering") {
      return {
        configured: true,
        active: false,
        registering: true,
        error: "API key is still registering on-chain with Enoki sponsor.",
      };
    }

    return {
      configured: true,
      active: false,
      registering: false,
      error: errData.error || `HTTP ${res.status} ${res.statusText}`,
    };
  } catch (err: any) {
    return {
      configured: true,
      active: false,
      registering: false,
      error: err?.message || "Network connection failure",
    };
  }
}

/**
 * Retrieves spaces available to the API key.
 */
export async function listWalrusSpaces(): Promise<WalrusConsoleSpace[]> {
  const apiKey = await getWalrusConsoleApiKey();
  if (!apiKey) return [];

  try {
    const res = await fetch(`${WALRUS_CONSOLE_BASE_URL}/spaces`, {
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "User-Agent": "CareerAce-Vault/1.0",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : data?.data || [];
  } catch (err) {
    console.warn("[walrus_console] Notice listing spaces:", err);
    return [];
  }
}

/**
 * Lists buckets (folders) within a given space.
 */
export async function listWalrusBuckets(spaceId: string): Promise<WalrusConsoleBucket[]> {
  const apiKey = await getWalrusConsoleApiKey();
  if (!apiKey || !spaceId) return [];

  try {
    const res = await fetch(`${WALRUS_CONSOLE_BASE_URL}/spaces/${spaceId}/buckets`, {
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "User-Agent": "CareerAce-Vault/1.0",
      },
      cache: "no-store",
    });

    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data?.data || [];
  } catch (err) {
    console.warn("[walrus_console] Notice listing buckets:", err);
    return [];
  }
}

/**
 * Ensures a dedicated chat vault bucket exists in the target space.
 */
export async function ensureChatVaultBucket(spaceId: string): Promise<string | null> {
  const apiKey = await getWalrusConsoleApiKey();
  if (!apiKey || !spaceId) return null;

  try {
    const buckets = await listWalrusBuckets(spaceId);
    const existing = buckets.find(
      (b) => b.name === "careerace-chat-vault" || b.name === "careerace-vault"
    );
    if (existing) return existing.id;

    // Create public or unencrypted vault bucket for persistent transcripts
    const res = await fetch(`${WALRUS_CONSOLE_BASE_URL}/spaces/${spaceId}/buckets`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
        "User-Agent": "CareerAce-Vault/1.0",
      },
      body: JSON.stringify({
        name: "careerace-chat-vault",
        visibility: "public",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data?.bucket_id || data?.id || null;
    }

    // Fall back to first available bucket if creation cannot proceed
    return buckets[0]?.id || null;
  } catch (err) {
    console.warn("[walrus_console] Notice ensuring chat vault bucket:", err);
    return null;
  }
}

/**
 * Archives a candidate's chat transcript session to Walrus Console.
 */
export async function archiveChatSessionToWalrus(params: {
  address: string;
  channel: string;
  messages: Array<{ role: string; content: string; timestamp?: number }>;
}): Promise<{ ok: boolean; fileId?: string; error?: string }> {
  const apiKey = await getWalrusConsoleApiKey();
  if (!apiKey) {
    return { ok: false, error: "Missing API key" };
  }

  try {
    const spaces = await listWalrusSpaces();
    if (!spaces.length) {
      return { ok: false, error: "No Walrus Console space found or key registering" };
    }

    const spaceId = spaces[0].id;
    const bucketId = await ensureChatVaultBucket(spaceId);
    if (!bucketId) {
      return { ok: false, error: "Unable to provision chat vault bucket" };
    }

    const cleanAddr = params.address.toLowerCase().replace(/[^a-z0-9]/g, "");
    const fileName = `chat_${cleanAddr}_${params.channel}.json`;
    const payload = JSON.stringify(
      {
        address: params.address,
        channel: params.channel,
        version: "1.0",
        archivedAt: new Date().toISOString(),
        messageCount: params.messages.length,
        messages: params.messages,
      },
      null,
      2
    );

    const formData = new FormData();
    const blob = new Blob([payload], { type: "application/json" });
    formData.append("file", blob, fileName);
    formData.append("name", fileName);
    formData.append(
      "metadata",
      JSON.stringify({
        source: "CareerAce",
        address: params.address,
        channel: params.channel,
        updated: Date.now(),
      })
    );

    const uploadRes = await fetch(`${WALRUS_CONSOLE_BASE_URL}/buckets/${bucketId}/files`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: formData,
    });

    if (uploadRes.status === 200 || uploadRes.status === 202) {
      const respData = await uploadRes.json();
      return { ok: true, fileId: respData?.data?.id };
    }

    const errBody = await uploadRes.text();
    return { ok: false, error: `Upload HTTP ${uploadRes.status}: ${errBody}` };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Archive execution error" };
  }
}

/**
 * Fetches an archived chat session from Walrus Console.
 */
export async function fetchChatSessionFromWalrus(params: {
  address: string;
  channel: string;
}): Promise<any[] | null> {
  const apiKey = await getWalrusConsoleApiKey();
  if (!apiKey) return null;

  try {
    const spaces = await listWalrusSpaces();
    if (!spaces.length) return null;

    const spaceId = spaces[0].id;
    const buckets = await listWalrusBuckets(spaceId);
    const bucket = buckets.find(
      (b) => b.name === "careerace-chat-vault" || b.name === "careerace-vault"
    ) || buckets[0];

    if (!bucket) return null;

    const cleanAddr = params.address.toLowerCase().replace(/[^a-z0-9]/g, "");
    const targetName = `chat_${cleanAddr}_${params.channel}.json`;

    const filesRes = await fetch(`${WALRUS_CONSOLE_BASE_URL}/buckets/${bucket.id}/files`, {
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      cache: "no-store",
    });

    if (!filesRes.ok) return null;
    const filesData = await filesRes.json();
    const files: WalrusConsoleFile[] = Array.isArray(filesData)
      ? filesData
      : filesData?.data || [];

    const file = files.find((f) => f.name === targetName);
    if (!file) return null;

    // Fetch download content
    const dlRes = await fetch(
      `${WALRUS_CONSOLE_BASE_URL}/buckets/${bucket.id}/files/${file.id}/download`,
      {
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        cache: "no-store",
      }
    );

    if (!dlRes.ok) return null;
    const json = await dlRes.json();
    return Array.isArray(json?.messages) ? json.messages : null;
  } catch (err) {
    console.warn("[walrus_console] Notice fetching chat session:", err);
    return null;
  }
}
