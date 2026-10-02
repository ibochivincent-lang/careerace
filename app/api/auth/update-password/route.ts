import { createClient } from "@supabase/supabase-js";
import { getSanitizedSupabaseUrl } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { access_token, refresh_token, newPassword } = await req.json();

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return new Response("Password must be at least 8 characters.", { status: 400 });
    }

    if (!access_token) {
      return new Response("Reset token is missing. Please click the link in your email.", { status: 400 });
    }

    const url = getSanitizedSupabaseUrl();
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      return new Response("Database configuration missing.", { status: 500 });
    }

    const client = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Set the session from the reset link tokens
    const { error: sessionError } = await client.auth.setSession({
      access_token,
      refresh_token: refresh_token || "",
    });

    if (sessionError) {
      console.error("[update-password] Session error:", sessionError.message);
      return new Response("Reset link is expired or invalid. Please request a new one.", { status: 401 });
    }

    const { error: updateError } = await client.auth.updateUser({ password: newPassword });

    if (updateError) {
      console.error("[update-password] Update error:", updateError.message);
      return new Response(updateError.message || "Failed to update password.", { status: 400 });
    }

    await client.auth.signOut();

    return Response.json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update password.";
    console.error("[update-password] Unexpected error:", msg);
    return new Response(msg, { status: 500 });
  }
}
