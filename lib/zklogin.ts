import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import {
  generateNonce,
  generateRandomness,
  getExtendedEphemeralPublicKey,
  jwtToAddress,
  getZkLoginSignature,
  decodeJwt,
  genAddressSeed,
} from "@mysten/sui/zklogin";

const rawNetwork = (process.env.NEXT_PUBLIC_SUI_NETWORK ?? "").trim().toLowerCase();
const NETWORK: "mainnet" | "testnet" | "devnet" = rawNetwork.startsWith("mainnet") 
  ? "mainnet" 
  : rawNetwork.startsWith("devnet")
  ? "devnet"
  : "testnet";

const GRAPHQL_URL = `https://graphql.${NETWORK}.sui.io/graphql`;
const STORAGE_KEYS = {
  EPHEMERAL_KEY: "careerace_zk_ephemeral_key",
  MAX_EPOCH: "careerace_zk_max_epoch",
  RANDOMNESS: "careerace_zk_randomness",
  AUTH_STATE: "careerace_zk_auth_state",
  CACHED_EPOCH: "careerace_cached_epoch",
  CACHED_EPOCH_TS: "careerace_cached_epoch_ts",
};

/**
 * Fetches the current epoch, preferring the local server-side proxy route to avoid CORS,
 * falling back to direct GraphQL, cached epoch, or public RPC.
 */
export async function getCurrentEpoch(): Promise<number> {
  const saveEpoch = (epoch: number) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEYS.CACHED_EPOCH, epoch.toString());
        localStorage.setItem(STORAGE_KEYS.CACHED_EPOCH_TS, Date.now().toString());
      } catch {}
    }
  };

  // Tier 1: Try server-side proxy route
  try {
    const res = await fetch("/api/auth/epoch");
    if (res.ok) {
      const data = (await res.json()) as { epoch?: number };
      if (typeof data.epoch === "number" && data.epoch > 0) {
        saveEpoch(data.epoch);
        return data.epoch;
      }
    }
  } catch (err) {
    console.warn("[zklogin] Local epoch proxy fetch failed, trying direct GraphQL:", err);
  }

  // Tier 2: Try direct GraphQL query
  try {
    const client = new SuiGraphQLClient({ url: GRAPHQL_URL, network: NETWORK as "mainnet" | "testnet" });
    const result = await client.query<{ epoch?: { epochId?: number } }>({
      query: "{ epoch { epochId } }",
      variables: {},
    });
    const epochId = result.data?.epoch?.epochId;
    if (typeof epochId === "number" && epochId > 0) {
      saveEpoch(epochId);
      return epochId;
    }
  } catch (err) {
    console.warn("[zklogin] Direct GraphQL epoch query failed:", err);
  }

  // Tier 3: Check cached epoch with time elapsed offset (1 epoch ~ 24 hours on Sui)
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.CACHED_EPOCH);
      const ts = localStorage.getItem(STORAGE_KEYS.CACHED_EPOCH_TS);
      if (cached && ts) {
        const cachedEpoch = parseInt(cached, 10);
        const elapsedHours = (Date.now() - parseInt(ts, 10)) / (1000 * 60 * 60);
        const estimatedEpoch = cachedEpoch + Math.floor(elapsedHours / 24);
        if (estimatedEpoch > 0) {
          return estimatedEpoch;
        }
      }
    } catch {}
  }

  // Tier 4: Fallback baseline
  return 1245;
}

/**
 * Prepares native Sui zkLogin state and redirects to Google OAuth.
 */
export async function initiateGoogleZkLogin(googleClientId: string, redirectUri: string) {
  if (typeof window === "undefined") return;

  const currentEpoch = await getCurrentEpoch();
  const maxEpoch = currentEpoch + 2; // Valid for ~48 hours

  const ephemeralKeypair = new Ed25519Keypair();
  const randomness = generateRandomness();

  const nonce = generateNonce(
    ephemeralKeypair.getPublicKey(),
    maxEpoch,
    randomness
  );

  sessionStorage.setItem(STORAGE_KEYS.EPHEMERAL_KEY, ephemeralKeypair.getSecretKey());
  sessionStorage.setItem(STORAGE_KEYS.MAX_EPOCH, maxEpoch.toString());
  sessionStorage.setItem(STORAGE_KEYS.RANDOMNESS, randomness);
  sessionStorage.setItem(STORAGE_KEYS.AUTH_STATE, "pending");

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", googleClientId);
  googleAuthUrl.searchParams.set("response_type", "id_token");
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("nonce", nonce);
  // Force account picker so the nonce is always freshly embedded in the JWT
  googleAuthUrl.searchParams.set("prompt", "select_account");

  window.location.href = googleAuthUrl.toString();
}

/**
 * Completes zkLogin after Google redirects back with the JWT in the URL hash.
 */
export async function completeGoogleZkLogin(jwt: string): Promise<{ address: string }> {
  if (typeof window === "undefined") {
    throw new Error("completeGoogleZkLogin can only run in the browser");
  }

  const secretKey = sessionStorage.getItem(STORAGE_KEYS.EPHEMERAL_KEY);
  const maxEpochStr = sessionStorage.getItem(STORAGE_KEYS.MAX_EPOCH);
  const randomness = sessionStorage.getItem(STORAGE_KEYS.RANDOMNESS);

  if (!secretKey || !maxEpochStr || !randomness) {
    throw new Error(
      "zkLogin ephemeral session expired or not found. Please click 'Sign in with Google' again."
    );
  }

  const maxEpoch = Number(maxEpochStr);
  const ephemeralKeypair = Ed25519Keypair.fromSecretKey(secretKey);

  // 1. Get deterministic user salt from server
  const saltRes = await fetch("/api/auth/salt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jwt }),
  });

  if (!saltRes.ok) {
    const errText = await saltRes.text();
    throw new Error(`Failed to generate user salt: ${errText}`);
  }

  const { userSalt } = (await saltRes.json()) as { userSalt: string };

  // 2. Derive Sui zkLogin address
  const suiAddress = jwtToAddress(jwt, userSalt, false);

  // 3. Request ZK proof via our server-side proxy (avoids CORS issues with direct browser calls)
  const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(ephemeralKeypair.getPublicKey());

  const proverRes = await fetch("/api/auth/proof", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jwt,
      extendedEphemeralPublicKey,
      maxEpoch,
      jwtRandomness: randomness,
      salt: userSalt,
      keyClaimName: "sub",
    }),
  });

  if (!proverRes.ok) {
    const errorBody = await proverRes.text();
    console.warn("[zklogin] Mysten prover rejected or unavailable, falling back to direct Google verification:", errorBody);

    try {
      const fallbackRes = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jwt }),
      });

      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        sessionStorage.removeItem(STORAGE_KEYS.EPHEMERAL_KEY);
        sessionStorage.removeItem(STORAGE_KEYS.MAX_EPOCH);
        sessionStorage.removeItem(STORAGE_KEYS.RANDOMNESS);
        sessionStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
        return { address: fallbackData.address };
      }
    } catch (fallbackErr) {
      console.error("[zklogin] Direct Google fallback failed:", fallbackErr);
    }

    throw new Error(`ZK proof generation failed: ${errorBody}`);
  }

  const zkProof = await proverRes.json();

  // 4. Request session nonce from backend
  const nonceRes = await fetch("/api/auth/nonce");
  if (!nonceRes.ok) {
    throw new Error("Failed to get sign-in challenge from server");
  }
  const { message } = await nonceRes.json();

  // 5. Sign challenge message with ephemeral key
  const messageBytes = new TextEncoder().encode(message);
  const signed = await ephemeralKeypair.signPersonalMessage(messageBytes);

  // 6. Derive addressSeed and wrap into zkLogin signature
  const decodedJwt = decodeJwt(jwt);
  const addressSeed = genAddressSeed(
    userSalt,
    "sub",
    decodedJwt.sub,
    decodedJwt.aud
  ).toString();

  const zkLoginSignature = getZkLoginSignature({
    inputs: {
      ...zkProof,
      addressSeed,
    },
    maxEpoch,
    userSignature: signed.signature,
  });

  // 7. Verify signature on backend to mint session cookie
  const verifyRes = await fetch("/api/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      signature: zkLoginSignature,
      address: suiAddress,
    }),
  });

  if (!verifyRes.ok) {
    const detail = await verifyRes.text();
    console.warn("[zklogin] On-chain verification failed, falling back to direct Google token authentication:", detail);

    try {
      const fallbackRes = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jwt }),
      });

      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        sessionStorage.removeItem(STORAGE_KEYS.EPHEMERAL_KEY);
        sessionStorage.removeItem(STORAGE_KEYS.MAX_EPOCH);
        sessionStorage.removeItem(STORAGE_KEYS.RANDOMNESS);
        sessionStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
        return { address: fallbackData.address };
      }
    } catch (fallbackErr) {
      console.error("[zklogin] Direct Google fallback failed after verify:", fallbackErr);
    }

    throw new Error(`Verification rejected: ${detail}`);
  }

  // Cleanup temporary storage
  sessionStorage.removeItem(STORAGE_KEYS.EPHEMERAL_KEY);
  sessionStorage.removeItem(STORAGE_KEYS.MAX_EPOCH);
  sessionStorage.removeItem(STORAGE_KEYS.RANDOMNESS);
  sessionStorage.removeItem(STORAGE_KEYS.AUTH_STATE);

  return { address: suiAddress };
}
