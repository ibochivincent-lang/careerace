import { NextResponse } from "next/server";
import { harvestJobsFromSources } from "@/lib/job_harvester";
import { normalizeAndDeduplicateJobs } from "@/lib/job_normaliser";
import { filterJobs } from "@/lib/job_filter";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "software engineer";

    const raw = await harvestJobsFromSources(query);
    const normalized = normalizeAndDeduplicateJobs(raw);
    const filtered = filterJobs(normalized);

    return NextResponse.json({
      success: true,
      count: filtered.length,
      jobs: filtered
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Harvest failed" },
      { status: 500 }
    );
  }
}
