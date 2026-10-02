import { NextResponse } from "next/server";
import { harvestJobsFromSources } from "@/lib/job_harvester";
import { normalizeAndDeduplicateJobs } from "@/lib/job_normaliser";
import { filterJobs } from "@/lib/job_filter";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "software engineer";
    const source = searchParams.get("source") || "all";
    const maxAge = Number(searchParams.get("max_age")) || 30;

    const raw = await harvestJobsFromSources(query, source);
    const normalized = normalizeAndDeduplicateJobs(raw);
    const filtered = filterJobs(normalized, {
      allowed_regions: [
        "remote", "us", "usa", "united states", "uk", "united kingdom",
        "nigeria", "lagos", "europe", "eu", "canada", "worldwide", "global", "berlin", "germany"
      ],
      blocked_regions: [],
      max_age_days: maxAge,
      allowed_job_types: ["remote", "onsite", "hybrid"]
    });

    return NextResponse.json({
      success: true,
      count: filtered.length,
      query,
      source,
      jobs: filtered
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Harvest failed" },
      { status: 500 }
    );
  }
}
