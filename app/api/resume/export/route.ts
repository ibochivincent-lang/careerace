import { NextResponse } from "next/server";
import { buildDocxResume } from "@/lib/docx_exporter";
import { exportToJsonResume } from "@/lib/json_resume";
import { Packer } from "docx";
import type { ParsedCv } from "@/lib/cv_parser";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { profile, format = "docx", custom_summary } = body;

    if (!profile) {
      return NextResponse.json({ error: "Candidate profile required." }, { status: 400 });
    }

    const cv: ParsedCv = profile;
    const applicantName = (cv.applicant_name || "candidate").replace(/[^a-zA-Z0-9_-]/g, "_");

    if (format === "json") {
      const jsonResume = exportToJsonResume(cv, custom_summary);
      return new NextResponse(JSON.stringify(jsonResume, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${applicantName}_JSON_Resume.json"`
        }
      });
    }

    // Default: DOCX
    const doc = buildDocxResume(cv, custom_summary);
    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${applicantName}_ATS_Resume.docx"`
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Export failed" },
      { status: 500 }
    );
  }
}
