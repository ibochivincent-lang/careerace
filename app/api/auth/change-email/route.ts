import { createClient } from "@supabase/supabase-js";
import { getSanitizedSupabaseUrl } from "@/lib/supabase";
import { getAuthRedirectOrigin } from "@/lib/auth-origin";

export async function POST(req: Request) {
  try {
    const { newEmail, access_token } = await req.json();

    if (!newEmail || typeof newEmail !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      return new Response("Please provide a valid new email address.", { status: 400 });
    }

    if (!access_token || typeof access_token !== "string") {
      return new Response("Authentication token required to change email.", { status: 401 });
    }

    const url = getSanitizedSupabaseUrl();
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      return new Response("Database configuration missing.", { status: 500 });
    }

    const origin = getAuthRedirectOrigin(req);

    const client = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Restore session from the provided access token
    const { error: sessionError } = await client.auth.setSession({
      access_token,
      refresh_token: "",
    });

    if (sessionError) {
      return new Response("Session expired. Please sign in again.", { status: 401 });
    }

    const { error } = await client.auth.updateUser(
      { email: newEmail.trim().toLowerCase() },
      { emailRedirectTo: `${origin}/signin` }
    );

    if (error) {
      console.error("[change-email] Supabase error:", error.message);
      return new Response(error.message || "Failed to change email.", { status: 400 });
    }

    return Response.json({ success: true, message: "Verification email sent to your new address. Check your inbox to confirm." });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to change email.";
    console.error("[change-email] Unexpected error:", msg);
    return new Response(msg, { status: 500 });
  }
}
