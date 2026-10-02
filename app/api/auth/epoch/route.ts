export const dynamic = "force-dynamic";

import { SuiGraphQLClient } from "@mysten/sui/graphql";

const rawNetwork = (process.env.NEXT_PUBLIC_SUI_NETWORK ?? "").trim().toLowerCase();
const SUI_NETWORK: "mainnet" | "testnet" | "devnet" = rawNetwork.startsWith("mainnet")
  ? "mainnet"
  : rawNetwork.startsWith("devnet")
  ? "devnet"
  : "testnet";

const GRAPHQL_URL = `https://graphql.${SUI_NETWORK}.sui.io/graphql`;

// Safe baseline epoch fallback
const SAFE_DEFAULT_EPOCH = 1240;

/**
 * Returns the current Sui epoch.
 * The browser should not call third-party endpoints directly to avoid CORS/adblock
 * issues, so this server-side route proxies the request.
 */
export async function GET() {
  try {
    const client = new SuiGraphQLClient({ url: GRAPHQL_URL, network: SUI_NETWORK as "mainnet" | "testnet" });
    const result = await client.query<{ epoch?: { epochId?: number } }>({
      query: "{ epoch { epochId } }",
      variables: {},
    });

    const epochId = result.data?.epoch?.epochId;
    if (typeof epochId === "number" && epochId > 0) {
      return Response.json({ epoch: epochId });
    }
    return Response.json({ epoch: SAFE_DEFAULT_EPOCH, fallback: true });
  } catch (err) {
    const msg = err instanceof Error ? (err.stack || err.message) : "Unknown error";
    console.warn("[zklogin] Primary Sui GraphQL epoch query failed, using safe fallback:", msg);
    return Response.json({ epoch: SAFE_DEFAULT_EPOCH, fallback: true, error: msg });
  }
}
