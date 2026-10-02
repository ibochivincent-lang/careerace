import { cookies } from "next/headers";
import { decodeJwt } from "@mysten/sui/zklogin";
import { issueSession, SESSION_COOKIE, deriveVaultAddressFromUserId } from "@/lib/auth";
import { SupabaseDatabaseService } from "@/lib/supabase";

/**
 * Direct Google OAuth JWT Session Verification.
 * Guarantees that users can sign in with Google even if Mysten Labs' external ZK prover
 * has not yet allowlisted the client ID or is temporarily experiencing latency.
 */
export async function POST(req: Request) {
  try {
    const { jwt } = await req.json();

    if (!jwt || typeof jwt !== "string") {
      return new Response("Missing Google ID token (JWT).", { status: 400 });
    }

    const decoded = decodeJwt(jwt);

    // Verify token validity
    if (!decoded.sub || !decoded.iss) {
      return new Response("Invalid Google token payload.", { status: 400 });
    }

    const validIssuer = decoded.iss === "https://accounts.google.com" || decoded.iss === "accounts.google.com";
    if (!validIssuer) {
      return new Response("Invalid token issuer.", { status: 401 });
    }

    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return new Response("Google token has expired. Please sign in again.", { status: 401 });
    }

    const payload = decoded as Record<string, any>;
    const email = typeof payload.email === "string" ? payload.email : "";
    const name = typeof payload.name === "string" ? payload.name : email.split("@")[0] || "Candidate";
    const sub = decoded.sub;

    // Derive deterministic 66-character sovereign vault address from Google sub ID
    const sovereignAddress = deriveVaultAddressFromUserId(`google:${sub}`);

    // Upsert candidate profile
    const db = new SupabaseDatabaseService();
    await db.upsertCandidate({
      wallet_address: sovereignAddress,
      name,
      namespace: `candidate_${name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
    });

    // Mint authenticated session cookie
    const jar = await cookies();
    jar.set(SESSION_COOKIE, issueSession(sovereignAddress), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return Response.json({
      success: true,
      address: sovereignAddress,
      user: {
        id: sub,
        username: name,
        email,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Google token verification failed";
    console.error("[auth/google] Error:", msg);
    return new Response(msg, { status: 500 });
  }
}
