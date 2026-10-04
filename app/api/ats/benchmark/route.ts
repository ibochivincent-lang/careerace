import { NextRequest, NextResponse } from "next/server";
import { runAtsBenchmarkSimulator } from "@/lib/ats_benchmark_simulator.ts";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile, jobTitle = "Software Engineer", jobCompany = "Target Company", jobDescription = "" } = body;

    if (!profile) {
      return NextResponse.json(
        { error: "Candidate profile is required for ATS benchmarking." },
        { status: 400 }
      );
    }

    const effectiveJd = jobDescription && jobDescription.trim().length > 20
      ? jobDescription
      : `${jobTitle} at ${jobCompany}. Required competencies: ${(profile.skills || []).slice(0, 8).join(", ")}`;

    const benchmarkReport = runAtsBenchmarkSimulator({
      profile,
      jobTitle,
      jobCompany,
      jobDescription: effectiveJd,
    });

    return NextResponse.json({
      success: true,
      report: benchmarkReport,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to execute ATS benchmark simulation",
      },
      { status: 500 }
    );
  }
}
