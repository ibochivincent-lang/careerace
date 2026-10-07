/**
 * Pinata IPFS Sovereign Storage Client (pinata.cloud)
 *
 * Provides decentralized, content-addressed storage for candidate chat history,
 * resumes, and audit trails on the InterPlanetary File System (IPFS).
 *
 * Designed for Next.js Serverless and Edge execution (no top-level fs/path).
 */

export interface PinataAuthStatus {
  configured: boolean;
  active: boolean;
  message?: string;
  error?: string;
}

export interface PinataPinResult {
  ok: boolean;
  ipfsHash?: string;
  ipfsUrl?: string;
  gatewayUrl?: string;
  pinSize?: number;
  timestamp?: string;
  error?: string;
}

export const DEFAULT_PINATA_GATEWAY =
  process.env.PINATA_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs";
export const PUBLIC_IPFS_GATEWAY = "https://ipfs.io/ipfs";

/**
 * Retrieves Pinata JWT from environment or local .env.local fallback.
 */
export async function getPinataJwt(): Promise<string | null> {
  const fromEnv = process.env.PINATA_JWT || process.env.NEXT_PUBLIC_PINATA_JWT;
  if (fromEnv) return fromEnv.trim();

  try {
    const [{ default: fs }, { default: path }] = await Promise.all([
      import("node:fs"),
      import("node:path"),
    ]);
    const envPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(/^PINATA_JWT=(.+)$/m);
      if (match?.[1]) return match[1].trim();
    }
  } catch {
    // Safe in serverless/Edge
  }

  return null;
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 2
): Promise<Response> {
  let lastErr: any;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fetch(url, options);
    } catch (err: any) {
      lastErr = err;
      if (i < retries) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    }
  }
  throw lastErr;
}

/**
 * Validates real-time authentication against Pinata Cloud.
 */
export async function testPinataAuthentication(): Promise<PinataAuthStatus> {
  const jwt = await getPinataJwt();
  if (!jwt) {
    return {
      configured: false,
      active: false,
      error: "No PINATA_JWT configured",
    };
  }

  try {
    const res = await fetchWithRetry("https://api.pinata.cloud/data/testAuthentication", {
      headers: {
        Authorization: `Bearer ${jwt}`,
        "User-Agent": "CareerAce-Pinata/1.0",
      },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      return {
        configured: true,
        active: true,
        message: data?.message || "Pinata API operational",
      };
    }

    const err = await res.text().catch(() => "");
    return {
      configured: true,
      active: false,
      error: `HTTP ${res.status}: ${err}`,
    };
  } catch (err: any) {
    return {
      configured: true,
      active: false,
      error: err?.message || "Pinata authentication check timeout",
    };
  }
}

/**
 * Pins an arbitrary JSON payload to IPFS using Pinata's pinJSONToIPFS API.
 */
export async function pinJsonToIpfs(
  content: Record<string, unknown>,
  metadata?: { name?: string; keyvalues?: Record<string, string> }
): Promise<PinataPinResult> {
  const jwt = await getPinataJwt();
  if (!jwt) {
    return { ok: false, error: "Missing PINATA_JWT" };
  }

  try {
    const body: Record<string, unknown> = {
      pinataContent: content,
      pinataMetadata: {
        name: metadata?.name || `careerace_${Date.now()}.json`,
        keyvalues: metadata?.keyvalues || {},
      },
      pinataOptions: {
        cidVersion: 0,
      },
    };

    const res = await fetchWithRetry("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
        "User-Agent": "CareerAce-Pinata/1.0",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return { ok: false, error: `Pinata HTTP ${res.status}: ${errText}` };
    }

    const data = await res.json();
    const ipfsHash = data?.IpfsHash;

    if (!ipfsHash) {
      return { ok: false, error: "Pinata did not return an IPFS Hash (CID)" };
    }

    const gatewayUrl = `${DEFAULT_PINATA_GATEWAY.replace(/\/$/, "")}/${ipfsHash}`;
    const ipfsUrl = `ipfs://${ipfsHash}`;

    return {
      ok: true,
      ipfsHash,
      ipfsUrl,
      gatewayUrl,
      pinSize: data?.PinSize,
      timestamp: data?.Timestamp,
    };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Pinata IPFS pinning error" };
  }
}

/**
 * Pins a binary file buffer or Blob to IPFS using Pinata's pinFileToIPFS API.
 * Provides simultaneous sovereign decentralized storage for candidate attachments,
 * documents, and credentials alongside Walrus Protocol.
 */
export async function pinFileToIpfs(
  fileBuffer: Buffer | Uint8Array,
  fileName: string,
  mimeType = "application/octet-stream",
  metadata?: { keyvalues?: Record<string, string> }
): Promise<PinataPinResult> {
  const jwt = await getPinataJwt();
  if (!jwt) {
    return { ok: false, error: "Missing PINATA_JWT" };
  }

  try {
    const formData = new FormData();
    const blob = new Blob([fileBuffer as any], { type: mimeType });
    formData.append("file", blob, fileName);

    formData.append(
      "pinataMetadata",
      JSON.stringify({
        name: fileName,
        keyvalues: metadata?.keyvalues || {},
      })
    );

    formData.append(
      "pinataOptions",
      JSON.stringify({
        cidVersion: 0,
      })
    );

    const res = await fetchWithRetry("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "User-Agent": "CareerAce-Pinata/1.0",
      },
      body: formData,
      signal: AbortSignal.timeout(25000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return { ok: false, error: `Pinata file upload HTTP ${res.status}: ${errText}` };
    }

    const data = await res.json();
    const ipfsHash = data?.IpfsHash;

    if (!ipfsHash) {
      return { ok: false, error: "Pinata did not return an IPFS Hash (CID)" };
    }

    const gatewayUrl = `${DEFAULT_PINATA_GATEWAY.replace(/\/$/, "")}/${ipfsHash}`;
    const ipfsUrl = `ipfs://${ipfsHash}`;

    return {
      ok: true,
      ipfsHash,
      ipfsUrl,
      gatewayUrl,
      pinSize: data?.PinSize,
      timestamp: data?.Timestamp,
    };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Pinata file pinning error" };
  }
}

export async function fetchFromIpfs(ipfsHash: string): Promise<any | null> {
  if (!ipfsHash) return null;
  const cleanHash = ipfsHash.replace(/^ipfs:\/\//, "").trim();

  for (let attempt = 0; attempt < 3; attempt++) {
    // Primary: Pinata Gateway
    try {
      const res = await fetch(`${DEFAULT_PINATA_GATEWAY.replace(/\/$/, "")}/${cleanHash}`, {
        headers: { "User-Agent": "CareerAce-Pinata/1.0" },
        signal: AbortSignal.timeout(6000),
        cache: "no-store",
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    // Secondary: Cloudflare IPFS Gateway
    try {
      const res = await fetch(`https://cloudflare-ipfs.com/ipfs/${cleanHash}`, {
        headers: { "User-Agent": "CareerAce-Pinata/1.0" },
        signal: AbortSignal.timeout(6000),
        cache: "no-store",
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    // Tertiary: Public ipfs.io Gateway fallback
    try {
      const res = await fetch(`${PUBLIC_IPFS_GATEWAY.replace(/\/$/, "")}/${cleanHash}`, {
        headers: { "User-Agent": "CareerAce-Pinata/1.0" },
        signal: AbortSignal.timeout(6000),
        cache: "no-store",
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  return null;
}

/**
 * Archives candidate chat session to IPFS via Pinata.
 */
export async function archiveChatSessionToIpfs(params: {
  address: string;
  channel: string;
  messages: Array<{ role: string; content: string; timestamp?: number }>;
}): Promise<PinataPinResult> {
  const cleanAddr = params.address.toLowerCase().trim();
  const payload = {
    address: cleanAddr,
    channel: params.channel,
    version: "2.0",
    storageEngine: "pinata-ipfs",
    archivedAt: new Date().toISOString(),
    messageCount: params.messages.length,
    messages: params.messages,
  };

  return pinJsonToIpfs(payload, {
    name: `chat_${cleanAddr.slice(0, 10)}_${params.channel}.json`,
    keyvalues: {
      app: "CareerAce",
      address: cleanAddr,
      channel: params.channel,
    },
  });
}
