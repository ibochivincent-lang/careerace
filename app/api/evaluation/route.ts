import { NextResponse } from "next/server";
import { parseCvText } from "@/lib/cv_parser";
import { evaluateJobFit } from "@/lib/job_evaluator";
import { generateTailoredCvAndCoverLetter } from "@/lib/resume_tailor";
import { routeApplication } from "@/lib/application_router";
import { syncApplicationToNotion } from "@/lib/notion_sync";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { job, cv_text } = body;

    if (!job || !job.title || !job.description) {
      return NextResponse.json({ error: "Missing job data" }, { status: 400 });
    }

    const cv = parseCvText(cv_text || "");
    const normalizedJob = {
      job_id: job.job_id || `job_${Date.now()}`,
      title: job.title,
      company: job.company || "Company",
      location: job.location || "Remote",
      description: job.description,
      apply_url: job.apply_url || "",
      source: job.source || "API",
      posted_date: job.posted_date || new Date().toISOString(),
      is_remote: job.is_remote ?? true,
      job_type: job.job_type || "remote"
    };

    const evaluation = evaluateJobFit(normalizedJob, cv);
    const tailored = generateTailoredCvAndCoverLetter(normalizedJob, cv);
    const application = routeApplication(normalizedJob, evaluation, tailored);

    await syncApplicationToNotion(application);

    return NextResponse.json({
      success: true,
      evaluation,
      tailored_package: tailored,
      application
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Evaluation failed" },
      { status: 500 }
    );
  }
}
