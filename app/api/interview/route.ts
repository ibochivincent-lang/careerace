import { NextResponse } from "next/server";
import { parseCvText } from "@/lib/cv_parser";
import { generatePostApplicationInterviewPrep } from "@/lib/interview_coach";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { application, cv_text } = body;

    const cv = parseCvText(cv_text || "");
    const appData = application || {
      job_id: `job_${Date.now()}`,
      title: "Fullstack Engineer",
      company: "Tech Corp",
      apply_url: "https://example.com",
      fit_score: 8,
      track: "track_a_auto_apply",
      status: "Applied",
      processed_at: new Date().toISOString()
    };

    const questions = generatePostApplicationInterviewPrep(appData, cv);

    return NextResponse.json({
      success: true,
      questions
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Interview prep generation failed" },
      { status: 500 }
    );
  }
}
