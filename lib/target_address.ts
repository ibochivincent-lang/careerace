export const DEFAULT_WALRUS_ACCOUNT =
  process.env.MEMWAL_ACCOUNT_ID?.toLowerCase() ||
  "0x434f860c828dc4320be447975b8283d7c5786c4a08b9ddc8f88540d9ea69aa00";

/**
 * Resolves the candidate's canonical Sui / Walrus Memory address.
 * Priority:
 * 1. Explicit address provided in request body or FormData (if valid 0x hex)
 * 2. Authenticated Sui session address from signed session cookie
 * 3. Configured Walrus sovereign memory account ID (MEMWAL_ACCOUNT_ID)
 */
export async function resolveTargetAddress(explicitAddress?: string | null): Promise<string> {
  if (explicitAddress && typeof explicitAddress === "string") {
    const trimmed = explicitAddress.trim().toLowerCase();
    if (trimmed.startsWith("0x") && trimmed.length >= 10) {
      return trimmed;
    }
  }

  try {
    const { getOwnerAddress } = await import("./session.ts");
    const sessionAddr = await getOwnerAddress();
    if (sessionAddr && sessionAddr.trim().startsWith("0x")) {
      return sessionAddr.trim().toLowerCase();
    }
  } catch (_e) {
    // Outside server request or cookie context
  }

  return DEFAULT_WALRUS_ACCOUNT;
}
