import { cookies } from "next/headers";
import { verifyPersonalMessageSignature } from "@mysten/sui/verify";
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { readNonce, challengeText, issueSession, SESSION_COOKIE, NONCE_COOKIE } from "@/lib/auth.ts";

const rawNetwork = (process.env.NEXT_PUBLIC_SUI_NETWORK ?? "").trim().toLowerCase();
const SUI_NETWORK: "mainnet" | "testnet" | "devnet" = rawNetwork.startsWith("mainnet")
  ? "mainnet"
  : rawNetwork.startsWith("devnet")
  ? "devnet"
  : "testnet";

const suiGraphql = new SuiGraphQLClient({
  url: `https://graphql.${SUI_NETWORK}.sui.io/graphql`,
  network: SUI_NETWORK as "mainnet" | "testnet",
});

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

      console.error("[careerace] Full GraphQL diagnostic response:", JSON.stringify(diag, null, 2));

      if (diag.errors && diag.errors.length > 0) {
        extraDetail = `: ${diag.errors.map((e) => e.message).join(", ")}`;
      } else if (diag.data?.verifyZkLoginSignature?.success === false) {
        extraDetail = `: zkLogin on-chain returned success=false, errors=${JSON.stringify(diag.data.verifyZkLoginSignature.errors || [])}`;
      }
    } catch (diagErr) {
      console.error("[careerace] GraphQL diagnostic failed:", diagErr);
    }

    return new Response(`Verification failed: ${detail}${extraDetail}`, { status: 401 });
  }

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
