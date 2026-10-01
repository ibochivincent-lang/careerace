import { NextResponse } from "next/server";
import { parseCvText, parseCvWithAi } from "@/lib/cv_parser";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let cvText = "";
    let fileName = "";
    let extractionMethod = "text";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (file) {
        fileName = file.name;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (file.name.endsWith(".txt") || file.type.includes("text")) {
          cvText = buffer.toString("utf-8");
          extractionMethod = "plaintext";
        } else if (file.name.endsWith(".pdf")) {
          cvText = extractPdfText(buffer);
          extractionMethod = "pdf_extraction";
        } else if (
          file.name.endsWith(".docx") ||
          file.type.includes("officedocument.wordprocessingml")
        ) {
          cvText = extractDocxText(buffer);
          extractionMethod = "docx_extraction";
        } else {
          cvText = buffer
            .toString("utf-8")
            .replace(/[^\x20-\x7E\n\r\t]/g, " ");
          extractionMethod = "generic_text";
        }
      }
    } else {
      const body = await req.json();
      cvText = body.cv_text || body.text || "";
      extractionMethod = "pasted_text";
    }

    // Clean up extracted text
    cvText = cvText.replace(/\s+/g, " ").trim();

    if (!cvText || cvText.length < 10) {
      return NextResponse.json(
        {
          error:
            "Could not extract readable text from the uploaded file. Please paste your CV text directly into the text area instead.",
          extraction_method: extractionMethod,
          extracted_length: cvText.length,
        },
        { status: 400 }
      );
    }

    // Always run the reliable rule-based parser
    const ruleBasedProfile = parseCvText(cvText);

    // Attempt AI-enhanced parsing (only if OpenRouter key is set)
    let finalProfile = ruleBasedProfile;
    try {
      const aiProfile = await parseCvWithAi(cvText);
      if (
        aiProfile &&
        aiProfile.skills &&
        Array.isArray(aiProfile.skills) &&
        aiProfile.skills.length > 0
      ) {
        finalProfile = aiProfile;
      }
    } catch (_aiErr) {
      // AI parsing failed silently; rule-based result is used
    }

    return NextResponse.json({
      success: true,
      file_name: fileName || "Pasted Resume Text",
      message:
        "CV successfully parsed and candidate profile updated.",
      extraction_method: extractionMethod,
      extracted_text_length: cvText.length,
      profile: finalProfile,
    });
  } catch (error) {
    console.error("[cv_upload] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "CV ingestion failed",
        suggestion:
          "Try pasting your CV text directly into the text area instead of uploading a file.",
      },
      { status: 500 }
    );
  }
}

/**
 * Extract readable text from raw PDF buffer without external libraries.
 * Uses multiple strategies: BT/ET text blocks, parenthesized strings, and
 * printable ASCII fallback.
 */
function extractPdfText(buffer: Buffer): string {
  const raw = buffer.toString("latin1");
  const textChunks: string[] = [];

  // Strategy 1: Extract text from BT...ET (Begin Text / End Text) blocks
  const btBlocks = raw.match(/BT[\s\S]*?ET/g) || [];
  for (const block of btBlocks) {
    // Tj operator: (text) Tj
    const tjMatches = block.match(/\(([^()]+)\)\s*T[jJ]/g);
    if (tjMatches) {
      for (const m of tjMatches) {
        const inner = m.replace(/\)\s*T[jJ]$/, "").replace(/^\(/, "");
        const decoded = inner
          .replace(/\\n/g, "\n")
          .replace(/\\r/g, "\r")
          .replace(/\\t/g, "\t")
          .replace(/\\\(/g, "(")
          .replace(/\\\)/g, ")")
          .replace(/\\\\/g, "\\");
        if (decoded.trim()) textChunks.push(decoded);
      }
    }
    // TJ operator: [(text) num (text)] TJ
    const tjArrayMatches = block.match(/\[([^\]]+)\]\s*TJ/gi);
    if (tjArrayMatches) {
      for (const arr of tjArrayMatches) {
        const innerParts = arr.match(/\(([^()]*)\)/g);
        if (innerParts) {
          for (const p of innerParts) {
            const decoded = p
              .slice(1, -1)
              .replace(/\\n/g, "\n")
              .replace(/\\r/g, "\r")
              .replace(/\\\(/g, "(")
              .replace(/\\\)/g, ")")
              .replace(/\\\\/g, "\\");
            if (decoded.trim()) textChunks.push(decoded);
          }
        }
      }
    }
  }

  if (textChunks.length > 3) {
    return textChunks.join(" ").replace(/\s+/g, " ").trim();
  }

  // Strategy 2: Extract all parenthesized strings longer than 2 chars
  const parenMatches = raw.match(/\(([^()]{3,})\)/g) || [];
  const filtered = parenMatches
    .map((m) => m.slice(1, -1))
    .filter((s) => {
      // Filter out binary/control sequences
      const printable = s.replace(/[^\x20-\x7E]/g, "");
      return printable.length > s.length * 0.6 && printable.length > 2;
    });

  if (filtered.length > 5) {
    return filtered.join(" ").replace(/\s+/g, " ").trim();
  }

  // Strategy 3: Extract any printable ASCII runs from the buffer
  const utf8 = buffer.toString("utf-8");
  const printableRuns = utf8.match(/[\x20-\x7E\n\r\t]{10,}/g) || [];
  return printableRuns.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * Extract readable text from DOCX buffer (which is a ZIP containing XML).
 * Without a zip library, we extract text from XML tags in the raw buffer.
 */
function extractDocxText(buffer: Buffer): string {
  const raw = buffer.toString("utf-8");

  // DOCX stores content in <w:t> tags within document.xml
  const wtMatches = raw.match(/<w:t[^>]*>([^<]*)<\/w:t>/gi) || [];
  if (wtMatches.length > 0) {
    const text = wtMatches
      .map((m) => {
        const inner = m.replace(/<[^>]+>/g, "");
        return inner;
      })
      .join(" ");

    if (text.trim().length > 20) {
      return text.replace(/\s+/g, " ").trim();
    }
  }

  // Fallback: strip all XML/binary and keep printable text
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/[^\x20-\x7E\n\r\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
