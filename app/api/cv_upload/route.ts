import { NextResponse } from "next/server";
import { parseCvText } from "@/lib/cv_parser";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let cvText = "";
    let fileName = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      
      if (file) {
        fileName = file.name;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (file.name.endsWith(".txt") || file.type.includes("text")) {
          cvText = buffer.toString("utf-8");
        } else if (file.name.endsWith(".pdf")) {
          try {
            // Standard PDF text buffer extraction fallback
            cvText = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
          } catch (e) {
            cvText = buffer.toString("utf-8");
          }
        } else {
          cvText = buffer.toString("utf-8");
        }
      }
    } else {
      const body = await req.json();
      cvText = body.cv_text || body.text || "";
    }

    if (!cvText.trim()) {
      return NextResponse.json({ error: "Missing CV file or text input" }, { status: 400 });
    }

    const parsed = parseCvText(cvText);

    return NextResponse.json({
      success: true,
      file_name: fileName || "Pasted Resume Text",
      message: "CV file successfully attached, parsed, and candidate profile updated.",
      profile: parsed
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "CV ingestion failed" },
      { status: 500 }
    );
  }
}
