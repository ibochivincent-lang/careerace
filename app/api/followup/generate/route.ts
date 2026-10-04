import { NextRequest, NextResponse } from "next/server";
import { callFreeLlm } from "@/lib/free_llm.ts";
import { NO_SLOP_PROMPT_DIRECTIVE, sanitizeAntiSlop } from "@/lib/no_slop.ts";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      jobTitle,
      company,
      appliedDate,
      candidateName = "Candidate",
      candidateRole = "",
      contactName = "",
    } = body;

    if (!jobTitle || !company) {
      return NextResponse.json(
        { error: "jobTitle and company are required" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a direct, articulate career strategist.
Write two high-converting, professional follow-up messages for a candidate checking on a job application submitted 7 days ago.

${NO_SLOP_PROMPT_DIRECTIVE}

1. LinkedIn Direct Message (InMail / Connection note):
- Maximum 300 characters.
- Tone: Direct, confident, respectful.
- Immediately cites the ${jobTitle} role at ${company} applied for on ${appliedDate || "last week"} and requests a quick status update.

2. Executive Email:
- Crisp, high-open-rate subject line.
- 3 short paragraphs:
  * Paragraph 1: Direct opening stating follow-up on the ${jobTitle} application submitted on ${appliedDate || "last week"}. Zero throat-clearing openers.
  * Paragraph 2: Mention 1-2 concrete, verifiable capabilities (e.g., distributed architectures, high-reliability engineering, verified credentials).
  * Paragraph 3: Direct invitation to connect or provide additional portfolio details.

Respond strictly in valid JSON format:
{
  "linkedinMessage": "...",
  "emailSubject": "...",
  "emailBody": "...",
  "actionTip": "..."
}`;

    const prompt = `Candidate: ${candidateName}
Applied Role: ${jobTitle}
Company: ${company}
Applied Date: ${appliedDate || "7 days ago"}
Contact/Hiring Lead: ${contactName || "Hiring Manager"}`;

    let parsedResult: any = null;

    try {
      const llmResponse = await callFreeLlm({
        system_prompt: systemPrompt,
        prompt,
        max_tokens: 1000,
      });

      const cleanJson = llmResponse
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      parsedResult = JSON.parse(cleanJson);

      // Enforce anti-slop post-processing
      if (parsedResult) {
        if (parsedResult.linkedinMessage) {
          parsedResult.linkedinMessage = sanitizeAntiSlop(parsedResult.linkedinMessage);
        }
        if (parsedResult.emailSubject) {
          parsedResult.emailSubject = sanitizeAntiSlop(parsedResult.emailSubject);
        }
        if (parsedResult.emailBody) {
          parsedResult.emailBody = sanitizeAntiSlop(parsedResult.emailBody);
        }
      }
    } catch (_err) {
      // High-quality human fallback with zero AI slop
      parsedResult = {
        linkedinMessage: `Hi ${contactName || "there"}, following up on my application for the ${jobTitle} position at ${company}. My verified technical background and engineering track record match your opening. Let me know if you would like to review my verified portfolio or connect this week. Best, ${candidateName}.`,
        emailSubject: `Application Follow-up: ${jobTitle} – ${candidateName}`,
        emailBody: `Dear ${contactName || "Hiring Team at " + company},\n\nI am following up on my application for the ${jobTitle} role at ${company}, submitted on ${appliedDate || "last week"}.\n\nGiven ${company}'s current technical roadmap and focus on high-availability engineering, my background in resilient systems and verifiable execution directly addresses the demands of this position.\n\nI would be glad to share any additional details or credential records whenever convenient. Thank you for your time, and I look forward to your update.\n\nBest regards,\n${candidateName}`,
        actionTip: "Best sent on Tuesday or Wednesday morning between 8:30 AM - 10:30 AM in the recipient's local time zone.",
      };
    }

    return NextResponse.json({
      success: true,
      followUp: parsedResult,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate follow-up",
      },
      { status: 500 }
    );
  }
}
