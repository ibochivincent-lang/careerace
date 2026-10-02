import { NextResponse } from "next/server";
import { parseCvText } from "@/lib/cv_parser";
import { generatePostApplicationInterviewPrep, evaluateStarAnswer } from "@/lib/interview_coach";
import { getOwnerAddress } from "@/lib/session";
import { rememberFact, recallFeedback } from "@/lib/memory_contract";

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

    // Default action: generate role-specific interview prep with Walrus Memory recall!
    const address = await getOwnerAddress();
    let recalledMemories: Array<{ text: string; distance: number }> = [];
    if (address) {
      try {
        recalledMemories = await recallFeedback(
          address,
          "interview feedback, STAR+R score, coaching critique, weakness, area of improvement"
        );
      } catch (err) {
        console.warn("[interview] Walrus Memory recall warning:", err);
      }
    }

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

    const questions = generatePostApplicationInterviewPrep(appData, cv, recalledMemories);

    return NextResponse.json({
      success: true,
      questions,
      recalled_memories: recalledMemories.map(m => {
        const parts = m.text.split('|').map(p => p.trim());
        return {
          date: parts[0] || '',
          kind: parts[1] || 'interview_feedback',
          insight: (parts[2] || m.text).split(' - SUPERSEDES:')[0].trim(),
          distance: m.distance
        };
      })
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Interview prep failed" },
      { status: 500 }
    );
  }
}
