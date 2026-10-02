import { NextRequest, NextResponse } from "next/server";
import { getOwnerAddress } from "@/lib/session";
import {
  recallProfile,
  recallFeedback,
  rememberFact,
  unionFacts,
  resolveConflicts,
  type FactKind,
} from "@/lib/memory_contract";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const address = await getOwnerAddress();
    if (!address) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "target role, skills, experience, interview feedback";

    const [profile, feedback] = await Promise.all([
      recallProfile(address, query),
      recallFeedback(address, query),
    ]);

    const merged = unionFacts(profile, feedback);
    const resolved = resolveConflicts(merged);

    const formatRow = (f: { text: string; distance: number; blobId: string }) => {
      const [date, kind, body] = f.text.split("|").map((p) => p.trim());
      return {
        date: date ?? "",
        kind: kind ?? "fact",
        claim: (body ?? f.text).split(" - SUPERSEDES:")[0].trim(),
        distance: f.distance,
        blobId: f.blobId,
      };
    };

    return NextResponse.json({
      address,
      query,
      active: resolved.active.map(formatRow),
      superseded: resolved.superseded.map(formatRow),
      retracted: resolved.retracted.map(formatRow),
      counts: {
        active: resolved.active.length,
        superseded: resolved.superseded.length,
        retracted: resolved.retracted.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to query Walrus Memory" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const address = await getOwnerAddress();
    if (!address) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { kind, text, userTurn } = body as {
      kind: FactKind;
      text: string;
      userTurn?: string;
    };

    if (!kind || !text || !text.trim()) {
      return NextResponse.json(
        { error: "Missing required fields: kind and text" },
        { status: 400 }
      );
    }

    const outcome = await rememberFact(address, kind, text.trim(), { userTurn });
    return NextResponse.json({ success: true, outcome });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to persist fact to Walrus Memory" },
      { status: 500 }
    );
  }
}
