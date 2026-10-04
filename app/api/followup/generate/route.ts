import { NextRequest, NextResponse } from "next/server";
import { callFreeLlm } from "@/lib/free_llm.ts";

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

    const systemPrompt = `You are an elite executive career strategist and recruiter.
Write two high-converting, professional follow-up messages for a candidate following up on a job application submitted 7 days ago.

1. LinkedIn Direct Message (InMail / Connection note):
- Maximum 350 characters.
- Tone: Respectful, articulate, confident.
- Clearly states the position applied for at ${company}, references the timeline, and expresses high motivation.

2. Executive Email:
- Includes a crisp, high-open-rate subject line.
- 3 short, punchy paragraphs:
  * Paragraph 1: Friendly greeting, polite check-in on the status of the application for ${jobTitle} submitted on ${appliedDate || "last week"}.
  * Paragraph 2: Reiterate 1-2 core value drivers and verified accomplishments (e.g., modern technical or marine propulsion telemetry, verifiable STCW credentials, sovereign competence).
  * Paragraph 3: Reaffirm enthusiasm, offer additional portfolio / Walrus-verified documentation if needed, and thank them for their time.

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
    } catch (_err) {
      // High-quality fallback if LLM parser has issues
      parsedResult = {
        linkedinMessage: `Hi ${contactName || "there"}, following up on my application for the ${jobTitle} role at ${company} submitted last week. My background in high-reliability systems and verifiable track record aligns closely with your team's objectives. I would welcome the opportunity to connect and discuss how I can contribute. Best regards, ${candidateName}.`,
        emailSubject: `Following up on ${jobTitle} Application – ${candidateName}`,
        emailBody: `Dear ${contactName || "Hiring Team at " + company},\n\nI hope this week is treating you well. I am following up on my application for the ${jobTitle} position at ${company}, which I submitted on ${appliedDate || "last week"}.\n\nGiven ${company}'s current trajectory and engineering standards, I remain very enthusiastic about the opportunity to contribute. My background in critical operational systems, problem solving, and disciplined execution aligns directly with the requirements of this opening.\n\nI would be delighted to provide any additional materials, references, or Walrus-verified credentials if helpful. Thank you for your consideration, and I look forward to hearing about next steps.\n\nWarm regards,\n${candidateName}`,
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
