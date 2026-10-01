import { type NextRequest } from "next/server";

const rawNetwork = (process.env.NEXT_PUBLIC_SUI_NETWORK ?? "").trim().toLowerCase();
const PROVER_URL = rawNetwork.startsWith("mainnet")
  ? "https://prover.mystenlabs.com/v1"
  : "https://prover-dev.mystenlabs.com/v1";

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

    const proverRes = await fetch(PROVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const proverText = await proverRes.text();

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
