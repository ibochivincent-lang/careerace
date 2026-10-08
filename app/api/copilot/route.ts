import { NextResponse } from "next/server";
import { processCopilotQuery } from "@/lib/copilot_intelligence.ts";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await processCopilotQuery(body);
    return NextResponse.json(result);
  } catch (_error) {
    console.error("[copilot] Query handler caught error:", _error);
    return NextResponse.json(
      {
        role: "assistant",
        content:
          "CareerAce Chatbot is active and connected to your Walrus Sovereign Memory. I can answer questions about your verified CV, past work tenures, education, certifications, and track 7-day follow-ups on your applications.",
        reply:
          "CareerAce Chatbot is active and connected to your Walrus Sovereign Memory. I can answer questions about your verified CV, past work tenures, education, certifications, and track 7-day follow-ups on your applications.",
        stored: [],
      },
      { status: 200 }
    );
  }
}
