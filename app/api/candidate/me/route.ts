import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { getSanitizedSupabaseUrl } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const sessionCookie = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("careerace_session="));

    const token = sessionCookie ? sessionCookie.split("=")[1] : undefined;
    const address = readSession(token);

    if (!address) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const url = getSanitizedSupabaseUrl();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    let username: string | null = null;
    let primaryRole: string | null = null;

    if (url && (serviceKey || anonKey)) {
      const client = createClient(url, serviceKey || anonKey!, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data } = await client
        .from("candidates")
        .select("name, target_role, primary_role")
        .eq("wallet_address", address.toLowerCase())
        .limit(1)
        .maybeSingle();

      if (data) {
        username = data.name || null;
        primaryRole = data.target_role || data.primary_role || null;
      }

      // If no name stored on candidates record, inspect sovereign memory snapshot
      if (!username) {
        const { data: mem } = await client
          .from("candidate_memories")
          .select("fact_text")
          .eq("candidate_wallet", address.toLowerCase())
          .eq("fact_kind", "sovereign_profile_snapshot")
          .limit(1)
          .maybeSingle();

        if (mem && mem.fact_text) {
          try {
            const parsed = JSON.parse(mem.fact_text);
            if (parsed.applicant_name && typeof parsed.applicant_name === "string") {
              username = parsed.applicant_name.trim();
            }
          } catch {}
        }
      }
    }

    return NextResponse.json({
      authenticated: true,
      address,
      username: username && !username.startsWith("0x") ? username : null,
      primaryRole: primaryRole || "Candidate",
    });
  } catch (err) {
    console.error("[candidate/me] error:", err);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
