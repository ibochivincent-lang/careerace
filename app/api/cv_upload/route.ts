import { NextResponse } from "next/server";
import { parseCvText, parseCvWithAi } from "@/lib/cv_parser";
import zlib from "zlib";
import { PDFParse } from "pdf-parse";

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
          cvText = await extractPdfText(buffer);
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
    cvText = cvText.replace(/\r\n/g, "\n").trim();

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
      message: "CV successfully parsed and candidate profile updated.",
      extraction_method: extractionMethod,
      extracted_text_length: cvText.length,
      extracted_text: cvText,
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
 * Decode PDF literal strings (escaping and basic octal sequences).
 */
function decodePdfLiteralString(str: string): string {
  return str
    .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}

/**
 * Extract text instructions from raw or decompressed PDF stream content.
 */
function extractFromPdfStream(streamString: string, outputChunks: string[]) {
  const btBlocks = streamString.match(/BT[\s\S]*?ET/g) || [];
  for (const block of btBlocks) {
    const tjArrays = block.match(/\[([^\]]+)\]\s*TJ/gi);
    if (tjArrays) {
      for (const arr of tjArrays) {
        const parts = arr.match(/\(([^()]*)\)/g);
        if (parts) {
          const combined = parts
            .map((p) => decodePdfLiteralString(p.slice(1, -1)))
            .join("");
          if (combined.trim()) outputChunks.push(combined.trim());
        }
      }
    }

    const tjMatches = block.match(/\(([^()]+)\)\s*T[jJ]/g);
    if (tjMatches) {
      for (const m of tjMatches) {
        const inner = m.replace(/\)\s*T[jJ]$/, "").replace(/^\(/, "");
        const decoded = decodePdfLiteralString(inner).trim();
        if (decoded) outputChunks.push(decoded);
      }
    }

    const quoteMatches = block.match(/\(([^()]+)\)\s*['"]/g);
    if (quoteMatches) {
      for (const m of quoteMatches) {
        const inner = m.replace(/\)\s*['"]$/, "").replace(/^\(/, "");
        const decoded = decodePdfLiteralString(inner).trim();
        if (decoded) outputChunks.push(decoded);
      }
    }
  }

  if (outputChunks.length < 5) {
    const parenMatches = streamString.match(/\(([^()]{3,})\)/g) || [];
    for (const m of parenMatches) {
      const s = m.slice(1, -1);
      const printable = s.replace(/[^\x20-\x7E]/g, "");
      if (printable.length > s.length * 0.7 && printable.trim().length > 3) {
        outputChunks.push(printable.trim());
      }
    }
  }
}

/**
 * Extract readable text from PDF buffer using PDFParse with multiple fallbacks.
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  // Strategy 1: Official PDF.js engine via PDFParse
  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    if (result && typeof result.text === "string" && result.text.trim().length > 10) {
      const clean = result.text
        .replace(/-- \d+ of \d+ --/g, "")
        .replace(/\r\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      if (clean.length > 10) return clean;
    }
  } catch (err) {
    console.warn("[cv_upload] PDFParse standard parsing failed, attempting fallback:", err);
  }

  // Strategy 2: Decompress flate streams in PDF
  const textChunks: string[] = [];
  const rawLatin = buffer.toString("latin1");

  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;
  while ((match = streamRegex.exec(rawLatin)) !== null) {
    const rawStreamData = match[1];
    const streamBuffer = Buffer.from(rawStreamData, "latin1");

    let decompressed: string | null = null;
    try {
      decompressed = zlib.inflateSync(streamBuffer).toString("latin1");
    } catch {
      try {
        decompressed = zlib.inflateRawSync(streamBuffer).toString("latin1");
      } catch {
        // Not compressed
      }
    }

    if (decompressed) {
      extractFromPdfStream(decompressed, textChunks);
    }
  }

  extractFromPdfStream(rawLatin, textChunks);

  if (textChunks.length > 5) {
    return textChunks.join("\n").replace(/[ \t]+/g, " ").trim();
  }

  // Strategy 3: Printable ASCII strings
  const utf8 = buffer.toString("utf-8");
  const printableRuns = utf8.match(/[\x20-\x7E\n\r\t]{12,}/g) || [];
  return printableRuns.join("\n").replace(/[ \t]+/g, " ").trim();
}

/**
 * Extract readable text from DOCX buffer (which is a ZIP containing word/document.xml).
 */
function extractDocxText(buffer: Buffer): string {
  try {
    let offset = 0;
    while (offset < buffer.length - 30) {
      if (buffer.readUInt32LE(offset) === 0x04034b50) {
        const compressionMethod = buffer.readUInt16LE(offset + 8);
        const compressedSize = buffer.readUInt32LE(offset + 18);
        const fileNameLength = buffer.readUInt16LE(offset + 26);
        const extraFieldLength = buffer.readUInt16LE(offset + 28);
        const fileName = buffer.toString("utf8", offset + 30, offset + 30 + fileNameLength);

        const dataStart = offset + 30 + fileNameLength + extraFieldLength;
        const dataEnd = dataStart + compressedSize;

        if (fileName === "word/document.xml" && dataEnd <= buffer.length) {
          const fileData = buffer.subarray(dataStart, dataEnd);
          let xml = "";
          if (compressionMethod === 8) {
            xml = zlib.inflateRawSync(fileData).toString("utf8");
          } else if (compressionMethod === 0) {
            xml = fileData.toString("utf8");
          }

          if (xml) {
            const wtMatches = xml.match(/<w:t[^>]*>([^<]*)<\/w:t>/gi) || [];
            const textLines: string[] = [];
            let currentLine = "";

            for (const wt of wtMatches) {
              const val = wt.replace(/<[^>]+>/g, "");
              currentLine += val + " ";
              if (currentLine.length > 80) {
                textLines.push(currentLine.trim());
                currentLine = "";
              }
            }
            if (currentLine.trim()) textLines.push(currentLine.trim());

            if (textLines.length > 0) {
              return textLines.join("\n");
            }
          }
        }
        offset = dataEnd;
      } else {
        offset++;
      }
    }
  } catch (err) {
    console.warn("[cv_upload] DOCX zip extraction fallback:", err);
  }

  // Fallback: strip XML tags from raw buffer
  const raw = buffer.toString("utf-8");
  const wtMatches = raw.match(/<w:t[^>]*>([^<]*)<\/w:t>/gi) || [];
  if (wtMatches.length > 0) {
    return wtMatches.map((m) => m.replace(/<[^>]+>/g, "")).join(" ").trim();
  }
  return raw.replace(/<[^>]+>/g, " ").replace(/[^\x20-\x7E\n\r\t]/g, " ").trim();
}
