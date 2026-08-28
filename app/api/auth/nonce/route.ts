import { cookies } from "next/headers";
import { issueNonce, challengeText, NONCE_COOKIE } from "@/lib/auth.ts";

/**
 * Issues the challenge the wallet signs.
 *
 * The try/catch is not decoration. Signing needs SESSION_SECRET, and an
 * uncaught throw in a route handler returns a 500 with an EMPTY body — the
 * caller's `.json()` then dies on "Unexpected end of JSON input", which says
 * nothing about the missing environment variable that actually caused it.
 */
export async function GET() {
  try {
    const { nonce, cookie } = issueNonce();
    const jar = await cookies();
    jar.set(NONCE_COOKIE, cookie, {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
      path: "/", maxAge: 300,
    });
    return Response.json({ message: challengeText(nonce) });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Could not issue a sign-in challenge";
    console.error("[examace] nonce route failed:", detail);
    return Response.json({ error: detail }, { status: 503 });
  }
}
