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
    let address = await getOwnerAddress();
    if (!address) {
      address = "0x0000000000000000000000000000000000000000000000000000000000000001";
    }

    const body = await req.json();

    // 1. Batch profile indexing
    if (body.profile) {
      const p = body.profile;
      const promises: Promise<any>[] = [];

      if (p.applicant_name) {
        promises.push(rememberFact(address, "candidate_identity", `Candidate Name: ${p.applicant_name}${p.location ? `, Location: ${p.location}` : ""}${p.contact_email ? `, Email: ${p.contact_email}` : ""}`));
      }
      if (p.target_roles && Array.isArray(p.target_roles) && p.target_roles.length > 0) {
        promises.push(rememberFact(address, "target_role", `Target role: ${p.target_roles.join(", ")}${p.seniority_level ? `, Seniority: ${p.seniority_level}` : ""}`));
      }
      if (p.skills && Array.isArray(p.skills) && p.skills.length > 0) {
        promises.push(rememberFact(address, "skill", `Skill: ${p.skills.join(", ")}`));
      }
      if (p.academic_history && Array.isArray(p.academic_history)) {
        for (const edu of p.academic_history) {
          if (edu.institution || edu.degree) {
            promises.push(rememberFact(address, "education", `Education: ${edu.degree || "Degree"} from ${edu.institution || "Institution"}${edu.graduation_year ? ` (${edu.graduation_year})` : ""}`));
          }
        }
      }
      if (p.work_experience && Array.isArray(p.work_experience)) {
        for (const exp of p.work_experience) {
          if (exp.company || exp.role) {
            promises.push(rememberFact(address, "experience", `Experience: ${exp.role || "Developer"} at ${exp.company || "Organization"} (${exp.duration || "Present"})`));
          }
        }
      }
      if (p.availability) {
        promises.push(rememberFact(address, "preference", `Workplace preference: ${p.availability}`));
      }

      await Promise.all(promises);
      return NextResponse.json({ success: true, indexed_facts: promises.length });
    }

    // 2. Single fact indexing
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
