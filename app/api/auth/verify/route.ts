import { cookies } from "next/headers";
import { verifyPersonalMessageSignature } from "@mysten/sui/verify";
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { readNonce, challengeText, issueSession, SESSION_COOKIE, NONCE_COOKIE } from "@/lib/auth.ts";

/*
 * Enoki does NOT hand back a plain ed25519 signature. EnokiKeypair wraps the
 * ephemeral key's signature in `getZkLoginSignature(...)`, so what arrives here
 * carries the ZkLogin flag. Verifying that means checking a ZK proof against
 * the JWK set and epoch the chain currently holds — which cannot be done
 * offline. @mysten/sui throws outright without a client:
 *
 *   "A Sui Client (GRPC, GraphQL, or JSON RPC) is required to verify zkLogin
 *    signatures"
 *
 * JSON-RPC is not an option: public fullnodes now answer
 * `sui_verifyZkLoginSignature` with "Method not found. JSON-RPC on public
 * fullnodes has been deprecated." GraphQL is the working path.
 *
 * The network MUST match the one the wallet was registered with in
 * components/SignIn.tsx. A testnet proof checked against mainnet fails as an
 * invalid signature, which reads like a forged login rather than a wrong URL.
 */
const rawNetwork = (process.env.NEXT_PUBLIC_SUI_NETWORK ?? "").trim().toLowerCase();
const SUI_NETWORK: "mainnet" | "testnet" = rawNetwork.startsWith("mainnet") ? "mainnet" : "testnet";
const suiGraphql = new SuiGraphQLClient({
  url: `https://graphql.${SUI_NETWORK}.sui.io/graphql`,
  network: SUI_NETWORK,
});

/**
 * Proves the caller controls the address they claim. The wallet signed a
 * server-issued nonce; we re-derive the expected message, verify the signature,
 * and only then mint a session. An address asserted by the client alone is
 * never enough — it is the key to someone's learning record.
 */
export async function POST(req: Request) {
  const { signature, address } = await req.json();
  if (typeof signature !== "string" || typeof address !== "string") {
    return new Response("signature and address required", { status: 400 });
  }

  const jar = await cookies();
  const nonce = readNonce(jar.get(NONCE_COOKIE)?.value);
  if (!nonce) return new Response("Nonce missing or expired", { status: 400 });

  const bytes = new TextEncoder().encode(challengeText(nonce));

  let publicKey;
  try {
    publicKey = await verifyPersonalMessageSignature(bytes, signature, { client: suiGraphql });
  } catch (error) {
    /*
     * Do not collapse every failure into "Bad signature". A missing client, an
     * unreachable GraphQL endpoint and an actually forged signature all land
     * here, and only the last one is the user's problem.
     */
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[careerace] zkLogin verification failed:", detail);

    let extraDetail = "";
    try {
      const diag = await suiGraphql.query<{
        verifyZkLoginSignature?: {
          success?: boolean;
          errors?: string[];
        };
      }>({
        query: `
          query verifyZkLoginSignature($bytes: Base64!, $signature: Base64!, $intentScope: ZkLoginIntentScope!, $author: SuiAddress!) {
            verifyZkLoginSignature(bytes: $bytes, signature: $signature, intentScope: $intentScope, author: $author) {
              success
              errors
            }
          }
        `,
        variables: {
          bytes: Buffer.from(bytes).toString("base64"),
          signature,
          intentScope: "PERSONAL_MESSAGE",
          author: address,
        },
      });

      const onChainErrors = diag.data?.verifyZkLoginSignature?.errors;
      if (Array.isArray(onChainErrors) && onChainErrors.length > 0) {
        extraDetail = `: ${onChainErrors.join("; ")}`;
        console.error("[careerace] GraphQL on-chain zkLogin verification errors:", onChainErrors);
      } else if (diag.errors && diag.errors.length > 0) {
        extraDetail = `: ${diag.errors.map((e) => e.message).join(", ")}`;
        console.error("[careerace] GraphQL node errors:", diag.errors);
      } else {
        console.error("[careerace] GraphQL node data:", diag.data);
      }
    } catch (diagErr) {
      console.error("[careerace] GraphQL diagnostic failed:", diagErr);
    }

    return new Response(`Signature rejected: ${detail}${extraDetail}`, { status: 401 });
  }

  /*
   * `verifyAddress` accepts both the current and the legacy zkLogin address
   * derivation. A plain string comparison against `toSuiAddress()` rejects
   * accounts still on the legacy form.
   */
  if (!publicKey.verifyAddress(address)) {
    return new Response("Signature does not match address", { status: 401 });
  }

  jar.delete(NONCE_COOKIE);
  jar.set(SESSION_COOKIE, issueSession(address), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: 60 * 60 * 12,
  });

  return Response.json({ address: address.toLowerCase() });
}
