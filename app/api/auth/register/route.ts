import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { issueSession, SESSION_COOKIE, deriveVaultAddressFromUserId } from "@/lib/auth";
import { SupabaseDatabaseService, getSanitizedSupabaseUrl } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    // 1. Validation
    if (!username || typeof username !== "string" || username.trim().length < 3) {
      return new Response("Username must be at least 3 characters long.", { status: 400 });
    }
    if (username.trim().length > 30) {
      return new Response("Username must be 30 characters or fewer.", { status: 400 });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
      return new Response("Username can only contain letters, numbers, underscores, and hyphens.", { status: 400 });
    }
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return new Response("Please provide a valid email address.", { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return new Response("Password must be at least 6 characters long.", { status: 400 });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    // 2. Initialize Supabase Admin Client
    const url = getSanitizedSupabaseUrl();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return new Response("Supabase database configuration missing on server.", { status: 500 });
    }

    const adminClient = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 3. Check if username is already taken in candidate records
    const { data: existingCandidate } = await adminClient
      .from("candidates")
      .select("wallet_address")
      .ilike("name", cleanUsername)
      .limit(1);

    if (existingCandidate && existingCandidate.length > 0) {
      return new Response("Username is already taken. Please choose another username.", { status: 409 });
    }

    // 4. Create user in Supabase Auth
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: cleanEmail,
      password,
      user_metadata: { username: cleanUsername },
      email_confirm: true,
    });

    if (createError) {
      console.error("[auth] createError details:", createError);
      return new Response(createError.message || "Failed to create account.", {
        status: createError.status || 400,
      });
    }

    if (!newUser.user) {
      return new Response("Failed to instantiate candidate account.", { status: 500 });
    }

    // 5. Deterministically derive sovereign 66-character hex vault address
    const sovereignAddress = deriveVaultAddressFromUserId(newUser.user.id);

    // 6. Upsert candidate profile into public.candidates
    const db = new SupabaseDatabaseService();
    await db.upsertCandidate({
      wallet_address: sovereignAddress,
      name: cleanUsername,
      namespace: `candidate_${cleanUsername.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
    });

    // 7. Mint session cookie for seamless immediate login
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
        id: newUser.user.id,
        username: cleanUsername,
        email: cleanEmail,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal registration error";
    console.error("[auth] Registration error:", msg);
    return new Response(msg, { status: 500 });
  }
}
