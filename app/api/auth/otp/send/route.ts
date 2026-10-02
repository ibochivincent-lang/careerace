import { createClient } from "@supabase/supabase-js";
import { getSanitizedSupabaseUrl } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { email, username } = await req.json();

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return new Response("Please provide a valid email address.", { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const url = getSanitizedSupabaseUrl();
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !anonKey) {
      return new Response("Database configuration missing on server.", { status: 500 });
    }

    // Check if username is already taken by another candidate
    if (username && typeof username === "string" && serviceKey) {
      const adminClient = createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: existing } = await adminClient
        .from("candidates")
        .select("wallet_address")
        .ilike("name", username.trim())
        .limit(1);

      if (existing && existing.length > 0) {
        return new Response("Username is already taken. Please choose another username.", { status: 409 });
      }
    }

    // Determine origin for redirect
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "careerace.vercel.app";
    const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const origin = `${proto}://${host}`;

    // Trigger Supabase Email OTP
    const anonClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: otpError } = await anonClient.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${origin}/signin`,
        data: username ? { username: username.trim() } : undefined,
      },
    });

    if (otpError) {
      console.error("[otp/send] Supabase error:", otpError.message);
      const errLower = otpError.message.toLowerCase();
      if (errLower.includes("rate limit")) {
        return new Response("Supabase email rate limit reached. Please wait a few moments or connect a custom SMTP provider (e.g. Resend) in your Supabase dashboard.", { status: 429 });
      }
      if (errLower.includes("error sending") || errLower.includes("magic link") || errLower.includes("confirmation email")) {
        return new Response("Supabase failed to send the email. If you enabled 'Custom SMTP' in Supabase, ensure your SMTP password/API key is valid, or toggle 'Enable Custom SMTP' OFF in Supabase SMTP Settings to use the default mailer.", { status: 500 });
      }
      return new Response(otpError.message || "Failed to send verification code.", {
        status: otpError.status || 400,
      });
    }

    return Response.json({
      success: true,
      message: `An 8-digit verification code has been sent to ${cleanEmail}.`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to send verification code";
    console.error("[otp/send] Unexpected error:", msg);
    return new Response(msg, { status: 500 });
  }
}
