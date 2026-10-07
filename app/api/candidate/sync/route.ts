import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { getSanitizedSupabaseUrl, SupabaseDatabaseService } from "@/lib/supabase";

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
      return NextResponse.json({ authenticated: false, success: false }, { status: 200 });
    }

    const url = getSanitizedSupabaseUrl();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!url || (!serviceKey && !anonKey)) {
      return NextResponse.json({ authenticated: true, address, success: false, error: "Database unconfigured" }, { status: 200 });
    }

    const client = createClient(url, serviceKey || anonKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const normalizedAddress = address.toLowerCase().trim();

    // 1. Fetch Candidate record
    const { data: candidateData } = await client
      .from("candidates")
      .select("*")
      .eq("wallet_address", normalizedAddress)
      .maybeSingle();

    // 2. Fetch candidate memories
    const { data: memories } = await client
      .from("candidate_memories")
      .select("*")
      .eq("candidate_wallet", normalizedAddress)
      .order("created_at", { ascending: false });

    let profile: any = null;
    let walrusBlobId: string | null = null;
    let walrusVersions: any[] = [];
    let savedJobIds: string[] = [];
    let coverLetter: string = "";

    if (memories && memories.length > 0) {
      const profileMem = memories.find((m) => m.fact_kind === "sovereign_profile_snapshot");
      if (profileMem && profileMem.fact_text) {
        try {
          profile = JSON.parse(profileMem.fact_text);
          walrusBlobId = profileMem.walrus_blob_id || profile?.walrus_blob_id || null;
        } catch {}
      }

      const versionsMem = memories.find((m) => m.fact_kind === "walrus_versions_snapshot");
      if (versionsMem && versionsMem.fact_text) {
        try {
          walrusVersions = JSON.parse(versionsMem.fact_text);
        } catch {}
      }

      const clMem = memories.find((m) => m.fact_kind === "tailored_cover_letter_snapshot");
      if (clMem && clMem.fact_text) {
        coverLetter = clMem.fact_text;
      }

      const savedMem = memories.find((m) => m.fact_kind === "saved_jobs_snapshot");
      if (savedMem && savedMem.fact_text) {
        try {
          savedJobIds = JSON.parse(savedMem.fact_text);
        } catch {}
      }

      const learningMem = memories.find((m) => m.fact_kind === "learning_stats_snapshot");
      if (learningMem && learningMem.fact_text) {
        try {
          var learningStatsData = JSON.parse(learningMem.fact_text);
        } catch {}
      }
    }

    // 3. Fetch applications
    const { data: appData } = await client
      .from("job_applications")
      .select("*")
      .eq("candidate_wallet", normalizedAddress)
      .order("created_at", { ascending: false });

    const appliedJobs = (appData || []).map((a) => ({
      id: a.id,
      company: a.company,
      title: a.role_title,
      status: a.status,
      fitScore: a.fit_score,
      apply_url: a.job_url,
      tailored_cv_bullet: a.tailored_cv_bullet,
      appliedAt: a.created_at,
    }));

    return NextResponse.json({
      success: true,
      authenticated: true,
      address: normalizedAddress,
      candidate: candidateData,
      profile,
      walrusBlobId,
      walrusVersions,
      appliedJobs,
      savedJobIds,
      coverLetter,
      learningStats: typeof learningStatsData !== "undefined" ? learningStatsData : null,
    });
  } catch (err: any) {
    console.error("[candidate/sync GET] error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const sessionCookie = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("careerace_session="));

    const token = sessionCookie ? sessionCookie.split("=")[1] : undefined;
    const address = readSession(token);

    if (!address) {
      return NextResponse.json({ success: false, error: "Unauthorized session" }, { status: 401 });
    }

    const body = await req.json();
    const {
      profile,
      walrusBlobId,
      walrusVersions,
      appliedJobs,
      savedJobIds,
      coverLetter,
      learningStats,
    } = body;

    const url = getSanitizedSupabaseUrl();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!url || (!serviceKey && !anonKey)) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
    }

    const client = createClient(url, serviceKey || anonKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const normalizedAddress = address.toLowerCase().trim();
    const candidateName = profile?.applicant_name || "Candidate";
    const candidateNamespace = `candidate_${candidateName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    const targetRole = profile?.target_roles?.[0] || profile?.work_experience?.[0]?.role || "Specialist";

    // 1. Upsert candidate profile
    await client
      .from("candidates")
      .upsert(
        {
          wallet_address: normalizedAddress,
          name: candidateName,
          target_role: targetRole,
          namespace: candidateNamespace,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "wallet_address" }
      );

    // 2. Persist sovereign profile snapshot if provided
    if (profile && typeof profile === "object") {
      const activeBlobId = walrusBlobId || profile.walrus_blob_id || null;
      // Delete existing profile snapshot for this wallet
      await client
        .from("candidate_memories")
        .delete()
        .eq("candidate_wallet", normalizedAddress)
        .eq("fact_kind", "sovereign_profile_snapshot");

      await client.from("candidate_memories").insert({
        candidate_wallet: normalizedAddress,
        namespace: candidateNamespace,
        fact_kind: "sovereign_profile_snapshot",
        fact_text: JSON.stringify(profile),
        walrus_blob_id: activeBlobId,
      });
    }

    // 3. Persist walrus versions snapshot if provided
    if (Array.isArray(walrusVersions)) {
      await client
        .from("candidate_memories")
        .delete()
        .eq("candidate_wallet", normalizedAddress)
        .eq("fact_kind", "walrus_versions_snapshot");

      await client.from("candidate_memories").insert({
        candidate_wallet: normalizedAddress,
        namespace: candidateNamespace,
        fact_kind: "walrus_versions_snapshot",
        fact_text: JSON.stringify(walrusVersions),
        walrus_blob_id: walrusBlobId || null,
      });
    }

    // 4. Persist tailored cover letter snapshot if provided
    if (typeof coverLetter === "string" && coverLetter.trim()) {
      await client
        .from("candidate_memories")
        .delete()
        .eq("candidate_wallet", normalizedAddress)
        .eq("fact_kind", "tailored_cover_letter_snapshot");

      await client.from("candidate_memories").insert({
        candidate_wallet: normalizedAddress,
        namespace: candidateNamespace,
        fact_kind: "tailored_cover_letter_snapshot",
        fact_text: coverLetter,
        walrus_blob_id: walrusBlobId || null,
      });
    }

    // 5. Persist saved jobs snapshot if provided
    if (Array.isArray(savedJobIds)) {
      await client
        .from("candidate_memories")
        .delete()
        .eq("candidate_wallet", normalizedAddress)
        .eq("fact_kind", "saved_jobs_snapshot");

      await client.from("candidate_memories").insert({
        candidate_wallet: normalizedAddress,
        namespace: candidateNamespace,
        fact_kind: "saved_jobs_snapshot",
        fact_text: JSON.stringify(savedJobIds),
        walrus_blob_id: null,
      });
    }

    // 6. Persist applied jobs into job_applications table
    if (Array.isArray(appliedJobs) && appliedJobs.length > 0) {
      for (const job of appliedJobs) {
        if (!job.company || !job.title) continue;
        await client.from("job_applications").insert({
          candidate_wallet: normalizedAddress,
          company: job.company,
          role_title: job.title,
          status: job.status || "applied",
          fit_score: typeof job.fitScore === "number" ? job.fitScore : 9.0,
          job_url: job.apply_url || null,
          tailored_cv_bullet: job.tailored_cv_bullet || null,
        });
      }
    }

    // 7. Persist learning stats snapshot if provided
    if (learningStats && typeof learningStats === "object") {
      await client
        .from("candidate_memories")
        .delete()
        .eq("candidate_wallet", normalizedAddress)
        .eq("fact_kind", "learning_stats_snapshot");

      await client.from("candidate_memories").insert({
        candidate_wallet: normalizedAddress,
        namespace: candidateNamespace,
        fact_kind: "learning_stats_snapshot",
        fact_text: JSON.stringify(learningStats),
        walrus_blob_id: null,
      });
    }

    return NextResponse.json({
      success: true,
      syncedAt: new Date().toISOString(),
      address: normalizedAddress,
    });
  } catch (err: any) {
    console.error("[candidate/sync POST] error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * GDPR Art. 17: Right to Erasure / Account & Data Deletion
 */
export async function DELETE(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const sessionCookie = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("careerace_session="));

    const token = sessionCookie ? sessionCookie.split("=")[1] : undefined;
    const address = readSession(token);

    if (!address) {
      return NextResponse.json({ success: false, error: "Unauthorized session." }, { status: 401 });
    }

    const url = getSanitizedSupabaseUrl();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!url || (!serviceKey && !anonKey)) {
      return NextResponse.json({ success: true, message: "Local session purged. Cloud unconfigured." });
    }

    const client = createClient(url, serviceKey || anonKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const normalizedAddress = address.toLowerCase().trim();

    // Delete candidate memories
    await client.from("candidate_memories").delete().eq("candidate_wallet", normalizedAddress);

    // Delete job applications
    await client.from("job_applications").delete().eq("candidate_wallet", normalizedAddress);

    // Delete candidate profile
    await client.from("candidates").delete().eq("wallet_address", normalizedAddress);

    return NextResponse.json({
      success: true,
      message: "GDPR Article 17 Erasure complete. All profile records, memories, and applications purged.",
      address: normalizedAddress,
    });
  } catch (err: any) {
    console.error("[candidate/sync DELETE] error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

