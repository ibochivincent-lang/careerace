import { type NextRequest } from "next/server";

const rawNetwork = (process.env.NEXT_PUBLIC_SUI_NETWORK ?? "").trim().toLowerCase();
/*
 * Mysten Labs ZK provers:
 *   mainnet + testnet → https://prover.mystenlabs.com/v1
 *   devnet only       → https://prover-dev.mystenlabs.com/v1
 *
 * prover-dev generates proofs with devnet-specific Groth16 proving keys.
 * Verifying a devnet proof against testnet/mainnet JWKs always fails with
 * "Groth16 proof verify failed" — they are cryptographically incompatible.
 */
const PRIMARY_PROVER =
  process.env.ZKLOGIN_PROVER_URL?.trim() ||
  (rawNetwork.startsWith("devnet")
    ? "https://prover-dev.mystenlabs.com/v1"
    : "https://prover.mystenlabs.com/v1");

const FALLBACK_PROVER =
  PRIMARY_PROVER === "https://prover.mystenlabs.com/v1"
    ? "https://prover-dev.mystenlabs.com/v1"
    : "https://prover.mystenlabs.com/v1";

/**
 * Server-side proxy for the Mysten Labs zkLogin ZK prover.
 * Calling the prover directly from the browser can fail due to CORS or
 * origin-based filtering on the prover side. Proxying through the app server
 * avoids that entirely and keeps the proof generation opaque to the client.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const required = ["jwt", "extendedEphemeralPublicKey", "maxEpoch", "jwtRandomness", "salt", "keyClaimName"];
    for (const field of required) {
      if (body[field] === undefined || body[field] === null) {
        return new Response(`Missing required field: ${field}`, { status: 400 });
      }
    }

    let proverRes = await fetch(PRIMARY_PROVER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    let proverText = await proverRes.text();

    // If primary prover rejects audience or returns 400 with "not supported", attempt the fallback prover
    if (!proverRes.ok && (proverText.includes("not supported") || proverRes.status === 400 || proverRes.status === 502)) {
      console.warn(`[zklogin] Primary prover (${PRIMARY_PROVER}) returned ${proverRes.status}: ${proverText}. Retrying with fallback: ${FALLBACK_PROVER}`);
      try {
        const fallbackRes = await fetch(FALLBACK_PROVER, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const fallbackText = await fallbackRes.text();
        if (fallbackRes.ok) {
          proverRes = fallbackRes;
          proverText = fallbackText;
        } else {
          console.error(`[zklogin] Fallback prover (${FALLBACK_PROVER}) also failed:`, fallbackRes.status, fallbackText);
        }
      } catch (fallbackErr) {
        console.error("[zklogin] Fallback prover fetch error:", fallbackErr);
      }
    }

    if (!proverRes.ok) {
      console.error("[zklogin] Prover returned error:", proverRes.status, proverText);
      return new Response(`ZK prover error (${proverRes.status}): ${proverText}`, {
        status: 502,
      });
    }

    return new Response(proverText, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[zklogin] Proof proxy error:", message);
    return new Response(`Proof generation failed: ${message}`, { status: 500 });
  }
}
