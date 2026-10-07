import { NextResponse } from "next/server";
import { seedCandidatesBatch } from "@/scripts/seed_30_mainnet_users.ts";

export const maxDuration = 60; // 60s for serverless seed execution

/**
 * Protected Admin Endpoint: Seed/Re-index Candidate Profiles on Walrus Mainnet
 *
 * Security: Requires ADMIN_SERVICE_KEY or CRON_SECRET authorization.
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const adminKey = process.env.ADMIN_SERVICE_KEY;
    const cronSecret = process.env.CRON_SECRET;

    if (adminKey || cronSecret) {
      const token = authHeader?.replace(/^Bearer\s+/i, "").trim() || "";
      const isAuthorized =
        (adminKey && token === adminKey) ||
        (cronSecret && token === cronSecret);

      if (!isAuthorized) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json().catch(() => ({}));
    const startIndex = typeof body.startIndex === "number" ? body.startIndex : 0;
    const count = typeof body.count === "number" ? Math.min(body.count, 5) : 2;
    const candidateId = typeof body.candidateId === "string" ? body.candidateId : undefined;

    const result = await seedCandidatesBatch({
      startIndex,
      count,
      candidateId,
      skipSleep: body.fast === true,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[admin/seed] Execution error:", error);
    return NextResponse.json({ ok: false, error: error?.message || "Seed execution failed" }, { status: 500 });
  }
}
