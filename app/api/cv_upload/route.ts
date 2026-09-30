import { NextResponse } from "next/server";
import { parseCvText } from "@/lib/cv_parser";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cvText = body.cv_text || body.text || "";

    if (!cvText) {
      return NextResponse.json({ error: "Missing cv_text parameter" }, { status: 400 });
    }

    const parsed = parseCvText(cvText);

    return NextResponse.json({
      success: true,
      message: "CV successfully parsed and candidate profile updated.",
      profile: parsed
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "CV ingestion failed" },
      { status: 500 }
    );
  }
}
