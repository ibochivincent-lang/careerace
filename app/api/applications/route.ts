import { NextResponse } from "next/server";
import { getOwnerAddress } from "@/lib/session";
import {
  recallFeedback,
  rememberFact,
  resolveConflicts,
  factBody,
  factDate,
  factKind,
  claimsOfKind,
  type RecalledFact,
} from "@/lib/memory_contract";

export interface ParsedApplication {
  id: string;
  title: string;
  company: string;
  apply_url: string;
  fit_score: number;
  track: "track_a_auto_apply" | "track_b_manual_queue";
  status: "Applied" | "Manual Required";
  flag_reason?: string;
  processed_at: string;
  raw_fact?: string;
}

function parseApplicationRecord(rawFact: string, index: number): ParsedApplication {
  const body = factBody(rawFact);
  const date = factDate(rawFact) || new Date().toISOString().slice(0, 10);

  // Format:
  // Applied to Acme Corp for "Senior Backend Engineer". Track: Track A Auto-Apply. Fit score: 9/10. Status: Applied. Apply URL: https://acme.com/apply
  const companyMatch = body.match(/Applied to (.*?) for/i);
  const titleMatch = body.match(/for "(.*?)"/i) || body.match(/for (.*?)(\. Track|$)/i);
  const trackMatch = body.match(/Track:\s*([^\.]+)/i);
  const fitMatch = body.match(/Fit(?:\s*score)?:\s*(\d+)/i);
  const statusMatch = body.match(/Status:\s*([^\.]+)/i);
  const urlMatch = body.match(/(?:Apply URL|URL):\s*(\S+)/i);

  const company = companyMatch ? companyMatch[1].trim() : "Target Company";
  const title = titleMatch ? titleMatch[1].trim() : "Software Engineering Role";
  const trackStr = trackMatch ? trackMatch[1].toLowerCase() : "";
  const track: "track_a_auto_apply" | "track_b_manual_queue" =
    trackStr.includes("track_a") || trackStr.includes("auto")
      ? "track_a_auto_apply"
      : "track_b_manual_queue";

  const fitScore = fitMatch ? parseInt(fitMatch[1], 10) : 8;
  const statusStr = statusMatch ? statusMatch[1].trim() : "";
  const status: "Applied" | "Manual Required" =
    statusStr.toLowerCase().includes("manual") || track === "track_b_manual_queue"
      ? "Manual Required"
      : "Applied";

  const applyUrl = urlMatch ? urlMatch[1].trim() : "";

  return {
    id: `app_${index}_${date}`,
    title,
    company,
    apply_url: applyUrl,
    fit_score: fitScore,
    track,
    status,
    flag_reason:
      status === "Manual Required"
        ? "Flagged for manual candidate review and ATS portal submission."
        : undefined,
    processed_at: date,
    raw_fact: rawFact,
  };
}

export async function GET() {
  try {
    const address = await getOwnerAddress();
    if (!address) {
      return NextResponse.json({
        authenticated: false,
        applications: [],
      });
    }

    const rawFeedback = await recallFeedback(
      address,
      "job application history and career applications"
    );
    const resolved = resolveConflicts(rawFeedback);

    // Filter active (unretracted) facts that are applications
    const allMatching = resolved.active.filter(
      (f: RecalledFact) =>
        factKind(f.text) === "application" ||
        f.text.toLowerCase().includes("applied to")
    );

    const applications = allMatching.map((f: RecalledFact, i: number) =>
      parseApplicationRecord(f.text, i)
    );

    return NextResponse.json({
      authenticated: true,
      address,
      applications,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load applications" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const address = await getOwnerAddress();
    if (!address) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, company, apply_url, fit_score, track, status } = body;

    if (!title || !company) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const trackLabel =
      track === "track_a_auto_apply" ? "Track A Auto-Apply" : "Track B Manual Queue";
    const appRecord = `Applied to ${company} for "${title}". Track: ${trackLabel}. Fit score: ${fit_score || 8}/10. Status: ${status || "Applied"}. Apply URL: ${apply_url || ""}`;

    const outcome = await rememberFact(address, "application", appRecord);

    return NextResponse.json({
      success: true,
      outcome,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save application" },
      { status: 500 }
    );
  }
}
