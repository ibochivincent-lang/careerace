import { NextResponse } from "next/server";
import { executeWalrusToSupabaseSync } from "@/lib/walrus_sync_engine.ts";

export const maxDuration = 60; // Up to 60s for Vercel serverless execution

/**
 * Vercel Cron Endpoint: Automated Walrus -> Supabase Synchronization
 * Scheduled in vercel.json to run once daily at 04:00 UTC (Vercel Hobby plan compatible).
 *
 * Security: Verified via CRON_SECRET header or ADMIN_SERVICE_KEY
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const adminKey = process.env.ADMIN_SERVICE_KEY;

    // If secrets are configured in environment, require authorization
    if (cronSecret || adminKey) {
      const token = authHeader?.replace(/^Bearer\s+/i, "").trim() || "";
      const url = new URL(req.url);
      const queryKey = url.searchParams.get("key")?.trim() || "";

      const isAuthorized =
        (cronSecret && (token === cronSecret || queryKey === cronSecret)) ||
        (adminKey && (token === adminKey || queryKey === adminKey));

      if (!isAuthorized) {
        return NextResponse.json(
          { ok: false, error: "Unauthorized: Invalid CRON_SECRET or ADMIN_SERVICE_KEY" },
          { status: 401 }
        );
      }
    }

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);

    const result = await executeWalrusToSupabaseSync({
      maxCandidates: Math.min(limit, 30),
      offset,
    });

    return NextResponse.json({
      ok: result.ok,
      syncedCandidates: result.syncedCandidates,
      syncedMemories: result.syncedMemories,
      totalEvaluated: result.totalEvaluated,
      durationMs: result.durationMs,
      timestamp: result.timestamp,
      notice: result.notice,
      reports: result.reports,
    });
  } catch (error: any) {
    console.error("[cron/sync_walrus] Execution error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Sync execution failed" },
      { status: 500 }
    );
  }
}
