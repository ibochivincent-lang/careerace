import { NextResponse } from "next/server";
import { parseCvText } from "@/lib/cv_parser";
import { generatePostApplicationInterviewPrep, evaluateStarAnswer } from "@/lib/interview_coach";
import { getOwnerAddress } from "@/lib/session";
import { rememberFact } from "@/lib/memory_contract";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, question, answer, application, cv_text } = body;

    // Action: evaluate candidate STAR+R response
    if (action === "evaluate_answer") {
      if (!answer || typeof answer !== "string" || !answer.trim()) {
        return NextResponse.json({ error: "Candidate answer text is required." }, { status: 400 });
      }

      const qText = question || "Technical behavioral interview question";
      const evaluation = await evaluateStarAnswer(qText, answer, application?.title);

      // Record interview assessment into candidate's sovereign Walrus Memory
      try {
        const address = await getOwnerAddress();
        if (address) {
          const summary = `STAR+R Evaluation: ${evaluation.overall_score}/10 on "${qText.slice(0, 48)}..." | ${evaluation.coach_critique}`;
          await rememberFact(address, "interview_feedback", summary).catch(() => {});
        }
      } catch (err) {
        console.warn("[interview] Walrus Memory feedback indexing skipped:", err);
      }

      return NextResponse.json({
        success: true,
        evaluation,
      });
    }

    // Default action: generate questions
    const cv = parseCvText(cv_text || "");
    const appData = application || {
      job_id: `job_${Date.now()}`,
      title: "Fullstack Engineer",
      company: "Tech Corp",
      apply_url: "",
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
      { error: error instanceof Error ? error.message : "Interview prep failed" },
      { status: 500 }
    );
  }
}
