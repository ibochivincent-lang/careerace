import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { issueSession, SESSION_COOKIE, deriveVaultAddressFromEmail, deriveVaultAddressFromUserId } from "@/lib/auth";
import { SupabaseDatabaseService, getSanitizedSupabaseUrl } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || typeof identifier !== "string" || !identifier.trim()) {
      return new Response("Please enter your username or email.", { status: 400 });
    }
    if (!password || typeof password !== "string") {
      return new Response("Please enter your password.", { status: 400 });
    }

    const cleanIdentifier = identifier.trim();
    const url = getSanitizedSupabaseUrl();
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !anonKey) {
      return new Response("Database configuration missing on server.", { status: 500 });
    }

    let emailToAuth = cleanIdentifier;

    // If identifier is a username (no @), look up associated email via admin client
    if (!cleanIdentifier.includes("@")) {
      if (!serviceKey) {
        return new Response("Service key missing for username lookup.", { status: 500 });
      }

      const adminClient = createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers();
      if (listError) {
        console.error("[auth] Error listing users for username match:", listError.message);
        return new Response("Invalid username or password.", { status: 401 });
      }

      const matchedUser = usersData.users.find(
        (u) => (u.user_metadata?.username as string)?.toLowerCase() === cleanIdentifier.toLowerCase()
      );

      if (!matchedUser || !matchedUser.email) {
        return new Response("Invalid username or password.", { status: 401 });
      }

      emailToAuth = matchedUser.email;
    }

    // Authenticate credentials against Supabase Auth
    const anonClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
      email: emailToAuth.toLowerCase(),
      password,
    });

    if (authError || !authData.user) {
      return new Response(authError?.message || "Invalid username/email or password.", {
        status: 401,
      });
    }

    const user = authData.user;
    const username = (user.user_metadata?.username as string) || cleanIdentifier;

    // Derive deterministic 66-character sovereign vault address canonically from verified email,
    // unifying Google OAuth and Email login identities into the exact same vault.
    const resolvedEmail = (user.email || emailToAuth)?.toLowerCase().trim();
    const sovereignAddress = resolvedEmail
      ? deriveVaultAddressFromEmail(resolvedEmail)
      : deriveVaultAddressFromUserId(user.id);

    // Ensure candidate record exists
    const db = new SupabaseDatabaseService();
    await db.upsertCandidate({
      wallet_address: sovereignAddress,
      name: username,
      namespace: `candidate_${username.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
    });

    // Mint session cookie
    const jar = await cookies();
    jar.set(SESSION_COOKIE, issueSession(sovereignAddress), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12, // 12 hours
    });

    return Response.json({
      success: true,
      address: sovereignAddress,
      user: {
        id: user.id,
        username,
        email: user.email,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal login error";
    console.error("[auth] Login error:", msg);
    return new Response(msg, { status: 500 });
  }
}
