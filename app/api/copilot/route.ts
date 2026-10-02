import { NextResponse } from "next/server";
import { callFreeLlm } from "@/lib/free_llm.ts";

export async function POST(req: Request) {
  try {
    const { messages, cv_profile } = await req.json();
    const latest = messages?.at(-1)?.content || "Hello, Career Ace";

    const systemPrompt = `You are Career Ace AI Copilot, an autonomous career strategist, job matcher, and interview coach.
${cv_profile ? `Candidate Profile Context:
- Name: ${cv_profile.applicant_name}
- Target Roles: ${cv_profile.target_roles?.join(", ") || "Software Engineer"}
- Identified Skills: ${cv_profile.skills?.join(", ")}
- Recent Experience: ${cv_profile.work_experience?.map((w: any) => `${w.role} at ${w.company}`).join("; ")}` : "No CV uploaded yet. Guide the user to upload or paste their CV."}

Help the candidate evaluate tech jobs, refine CV impact points (using quantitative metrics without fabricating claims), and practice post-application STAR+R interview responses.
Keep replies clear, direct, and under 150 words.`;

    const reply = await callFreeLlm({
      prompt: latest,
      system_prompt: systemPrompt,
      max_tokens: 300,
    });

    return NextResponse.json({
      role: "assistant",
      content: reply,
    });
  } catch (error) {
    return NextResponse.json(
      {
        role: "assistant",
        content: "Career Ace AI is ready. You can ask me to analyze your fit for specific roles, tailor CV bullets, or practice interview questions.",
      },
      { status: 200 }
    );
  }
}
