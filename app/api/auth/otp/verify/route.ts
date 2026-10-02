import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { issueSession, SESSION_COOKIE, deriveVaultAddressFromUserId } from "@/lib/auth";
import { SupabaseDatabaseService, getSanitizedSupabaseUrl } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { email, token, username, password, access_token } = await req.json();

    const url = getSanitizedSupabaseUrl();
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !anonKey) {
      return new Response("Database configuration missing on server.", { status: 500 });
    }

    const anonClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let user: any = null;
    let cleanUsername = username?.trim() || "";

    // Path A: Verification via Magic Link access_token from email link click
    if (access_token && typeof access_token === "string") {
      const { data: userData, error: userError } = await anonClient.auth.getUser(access_token);
      if (userError || !userData?.user) {
        return new Response(userError?.message || "Invalid or expired session token.", { status: 401 });
      }
      user = userData.user;
      if (!cleanUsername) {
        cleanUsername = user.user_metadata?.username || user.email?.split("@")[0] || "candidate";
      }
    } else {
      // Path B: Verification via 6-digit OTP code entered by candidate
      if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return new Response("Valid email is required.", { status: 400 });
      }
      if (!token || typeof token !== "string" || token.trim().length < 6) {
        return new Response("Please enter the 6-digit verification code.", { status: 400 });
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanToken = token.trim();
      if (!cleanUsername) {
        cleanUsername = cleanEmail.split("@")[0];
      }

      let authData: any = null;
      let verifyError: any = null;

      const otpTypes: ("email" | "signup" | "magiclink")[] = ["email", "signup", "magiclink"];

      for (const otpType of otpTypes) {
        const result = await anonClient.auth.verifyOtp({
          email: cleanEmail,
          token: cleanToken,
          type: otpType,
        });

        if (!result.error && result.data?.user) {
          authData = result.data;
          verifyError = null;
          break;
        } else {
          verifyError = result.error;
        }
      }

      if (verifyError || !authData?.user) {
        console.error("[otp/verify] Verification failed:", verifyError?.message);
        return new Response(verifyError?.message || "Invalid or expired verification code.", {
          status: 401,
        });
      }
      user = authData.user;
    }

    // 2. If user set a password or username during signup, persist it via Admin API
    if (serviceKey && (password || username)) {
      try {
        const adminClient = createClient(url, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        const updates: { password?: string; user_metadata?: Record<string, any> } = {};
        if (password && password.length >= 6) {
          updates.password = password;
        }
        if (cleanUsername) {
          updates.user_metadata = {
            ...user.user_metadata,
            username: cleanUsername,
          };
        }

        if (Object.keys(updates).length > 0) {
          await adminClient.auth.admin.updateUserById(user.id, updates);
        }
      } catch (updateErr) {
        console.warn("[otp/verify] Warning updating user credentials:", updateErr);
      }
    }

    // 3. Derive deterministic 66-character sovereign vault address
    const sovereignAddress = deriveVaultAddressFromUserId(user.id);

    // 4. Provision candidate profile in public.candidates
    const db = new SupabaseDatabaseService();
    await db.upsertCandidate({
      wallet_address: sovereignAddress,
      name: cleanUsername,
      namespace: `candidate_${cleanUsername.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
    });

    // 5. Mint authenticated session cookie
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
        id: user.id,
        username: cleanUsername,
        email: user.email,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal verification error";
    console.error("[otp/verify] Unexpected error:", msg);
    return new Response(msg, { status: 500 });
  }
}
