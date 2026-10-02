import { createClient } from "@supabase/supabase-js";
import { getSanitizedSupabaseUrl } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return new Response("Please provide a valid email address.", { status: 400 });
    }

    const url = getSanitizedSupabaseUrl();
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      return new Response("Database configuration missing.", { status: 500 });
    }

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "careerace.vercel.app";
    const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const origin = `${proto}://${host}`;

    const anonClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error } = await anonClient.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${origin}/signin?mode=reset`,
    });

    if (error) {
      console.error("[reset-password] Supabase error:", error.message);
      return new Response(error.message || "Failed to send password reset email.", { status: 400 });
    }

    return Response.json({ success: true, message: "Password reset link sent." });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to send password reset email.";
    console.error("[reset-password] Unexpected error:", msg);
    return new Response(msg, { status: 500 });
  }
}
