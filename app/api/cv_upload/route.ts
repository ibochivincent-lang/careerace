import { NextResponse } from "next/server";
import { parseCvText, parseCvWithAi } from "@/lib/cv_parser";
import { getOwnerAddress } from "@/lib/session";
import { resolveTargetAddress } from "@/lib/target_address";
import { uploadEncryptedResumeToWalrus } from "@/lib/walrus_storage";
import { rememberFact } from "@/lib/memory_contract";
import zlib from "zlib";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let cvText = "";
    let fileName = "";
    let extractionMethod = "text";
    let fileBuffer: Buffer | null = null;

    let explicitAddress: string | null = null;
    let customKeys: { google?: string; groq?: string; openrouter?: string; openai?: string; opencode?: string } | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const clientExtractedText = formData.get("cv_text") as string | null;
      explicitAddress = (formData.get("address") as string) || null;

      const gKey = (formData.get("gemini_key") || formData.get("google_key")) as string | null;
      const grKey = formData.get("groq_key") as string | null;
      const orKey = formData.get("openrouter_key") as string | null;
      const ocKey = formData.get("opencode_key") as string | null;
      if (gKey || grKey || orKey || ocKey) {
        customKeys = {
          google: gKey || undefined,
          groq: grKey || undefined,
          openrouter: orKey || undefined,
          opencode: ocKey || undefined,
        };
      }

      // If client-side PDF.js already extracted the text in browser, prioritize it
      if (clientExtractedText && clientExtractedText.trim().length > 10) {
        cvText = clientExtractedText.trim();
        extractionMethod = "browser_pdf_extraction";
        if (file) {
          fileName = file.name;
          const arrayBuffer = await file.arrayBuffer();
          fileBuffer = Buffer.from(arrayBuffer);
        }
      } else if (file) {
        fileName = file.name;
        const lowerName = file.name.toLowerCase();
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fileBuffer = buffer;

        if (lowerName.endsWith(".txt") || file.type.includes("text")) {
          cvText = buffer.toString("utf-8");
          extractionMethod = "plaintext";
        } else if (
          lowerName.endsWith(".pdf") ||
          file.type.includes("pdf") ||
          file.type === "application/pdf"
        ) {
          cvText = await extractPdfText(buffer);
          extractionMethod = "pdf_extraction";
        } else if (
          lowerName.endsWith(".docx") ||
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
      explicitAddress = body.address || null;
      extractionMethod = "pasted_text";
      if (body.custom_keys) {
        customKeys = body.custom_keys;
      }
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

    // Parse candidate CV with AI model cascade and heuristic fallback
    const finalProfile = await parseCvWithAi(cvText, customKeys);

    // Resolve sovereign Walrus Memory address
    const address = await resolveTargetAddress(explicitAddress);

    // Walrus Sovereign Encrypted Resume Storage
    const uploadBuffer = fileBuffer || Buffer.from(cvText, "utf-8");
    const safeDocName = (fileName || `${(finalProfile.applicant_name || "Candidate").replace(/[^a-zA-Z0-9_-]/g, "_")}_Resume.txt`).trim();

    let walrusBlobResult: { blobId: string; sha256Digest: string } | null = null;
    try {
      const walrusUploadPromise = uploadEncryptedResumeToWalrus(
        uploadBuffer,
        address,
        safeDocName
      );
      const walrusTimeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
      walrusBlobResult = await Promise.race([walrusUploadPromise, walrusTimeout]);

      if (!walrusBlobResult) {
        // Complete in background if network is taking longer than 2s
        walrusUploadPromise
          .then((res) => {
            if (res?.blobId) {
              rememberFact(
                address,
                "tailored_cv",
                `Walrus Encrypted Resume: ${safeDocName} | blobId: ${res.blobId} | digest: ${res.sha256Digest.slice(0, 16)}`
              ).catch(() => {});
            }
          })
          .catch((blobErr) => console.warn("[cv_upload] Background Walrus upload notice:", blobErr));
      }
    } catch (blobErr) {
      console.warn("[cv_upload] Walrus encrypted resume upload notice:", blobErr);
    }

    // Persist verified CV profile facts into Walrus Sovereign Memory
    const factsToStore: Array<{ kind: "candidate_identity" | "target_role" | "skill" | "education" | "experience" | "tailored_cv"; text: string }> = [];

    if (walrusBlobResult?.blobId) {
      factsToStore.push({
        kind: "tailored_cv",
        text: `Walrus Encrypted Resume: ${safeDocName} | blobId: ${walrusBlobResult.blobId} | digest: ${walrusBlobResult.sha256Digest.slice(0, 16)}`,
      });
    }

    if (finalProfile.applicant_name && finalProfile.applicant_name !== "Candidate") {
      factsToStore.push({
        kind: "candidate_identity",
        text: `Candidate Name: ${finalProfile.applicant_name}`,
      });
    }

    if (finalProfile.target_roles && Array.isArray(finalProfile.target_roles) && finalProfile.target_roles.length > 0) {
      factsToStore.push({
        kind: "target_role",
        text: `Target role: ${finalProfile.target_roles.join(", ")}`,
      });
    }

    if (finalProfile.skills && Array.isArray(finalProfile.skills) && finalProfile.skills.length > 0) {
      factsToStore.push({
        kind: "skill",
        text: `Skill: ${finalProfile.skills.slice(0, 15).join(", ")}`,
      });
    }

    if (finalProfile.academic_history && Array.isArray(finalProfile.academic_history)) {
      for (const edu of finalProfile.academic_history.slice(0, 3)) {
        if (edu.institution || edu.degree) {
          factsToStore.push({
            kind: "education",
            text: `Education: Studied ${edu.degree || "Degree"} at ${edu.institution}${edu.field_of_study ? ` in ${edu.field_of_study}` : ""}${edu.graduation_year ? ` (${edu.graduation_year})` : ""}`,
          });
        }
      }
    }

    if (finalProfile.work_experience && Array.isArray(finalProfile.work_experience)) {
      for (const exp of finalProfile.work_experience.slice(0, 4)) {
        if (exp.company || exp.role) {
          const compClean = exp.company && !/^(?:organization|company|employer|client|previous tech organization|target organization)$/i.test(exp.company.trim()) ? exp.company.trim() : "";
          const roleClean = exp.role || "Professional";
          const compClause = compClean ? ` at ${compClean}` : "";
          const highlightsText = exp.highlights && exp.highlights.length > 0 ? ` - Key achievements: ${exp.highlights.slice(0, 2).join("; ")}` : "";
          factsToStore.push({
            kind: "experience",
            text: `Experience: ${roleClean}${compClause}${exp.duration ? ` (${exp.duration})` : ""}${highlightsText}`,
          });
        }
      }
    }

    // Store facts into Walrus Memory asynchronously in the background so the user is never blocked
    Promise.allSettled(
      factsToStore.map((f) => rememberFact(address, f.kind, f.text))
    ).then((settled) => {
      const ok = settled.filter((r) => r.status === "fulfilled").length;
      console.log(`[cv_upload] Asynchronously anchored ${ok}/${factsToStore.length} facts to Walrus Memory`);
    }).catch((err) => {
      console.warn("[cv_upload] Background Walrus Memory fact anchor notice:", err);
    });

    const indexedCount = factsToStore.length;

    let onchainAnchor: any = null;
    if (walrusBlobResult?.blobId) {
      try {
        const { anchorWalrusCredentialOnchain } = await import("@/lib/walrus_anchor");
        const anchorPromise = anchorWalrusCredentialOnchain({
          blobId: walrusBlobResult.blobId,
          sha256Digest: walrusBlobResult.sha256Digest,
          credentialType: "sovereign_resume",
          candidateAddress: address,
          fileName: safeDocName,
        });
        const anchorTimeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000));
        onchainAnchor = await Promise.race([anchorPromise, anchorTimeout]);
      } catch (anchorErr) {
        console.warn("[cv_upload] Auto on-chain anchor notice:", anchorErr);
      }
    }

    return NextResponse.json({
      success: true,
      file_name: safeDocName,
      message: "CV successfully parsed and indexed into Sovereign Walrus Memory.",
      extraction_method: extractionMethod,
      extracted_text_length: cvText.length,
      extracted_text: cvText,
      address,
      profile: finalProfile,
      walrus_vault: {
        status: "indexed",
        address,
        blobId: walrusBlobResult?.blobId || null,
        facts_indexed: indexedCount,
        anchor: onchainAnchor,
      },
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
 * Decode PDF hex strings e.g. <00480065006C006C006F> or <48656C6C6F>
 */
function decodePdfHexString(hex: string): string {
  const clean = hex.replace(/[^0-9a-fA-F]/g, "");
  let decoded = "";
  if (clean.length >= 4 && clean.length % 4 === 0 && clean.startsWith("00")) {
    for (let i = 0; i < clean.length; i += 4) {
      const code = parseInt(clean.slice(i, i + 4), 16);
      if (code >= 32 && code <= 126) decoded += String.fromCharCode(code);
      else if (code === 10 || code === 13) decoded += "\n";
    }
  } else {
    for (let i = 0; i < clean.length; i += 2) {
      const code = parseInt(clean.slice(i, i + 2), 16);
      if (code >= 32 && code <= 126) decoded += String.fromCharCode(code);
      else if (code === 10 || code === 13) decoded += "\n";
    }
  }
  return decoded.trim();
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
        // Parenthesized literal strings
        const parts = arr.match(/\(([^()]*)\)/g);
        if (parts) {
          const combined = parts
            .map((p) => decodePdfLiteralString(p.slice(1, -1)))
            .join("");
          if (combined.trim()) outputChunks.push(combined.trim());
        }
        // Angle-bracket hex strings
        const hexParts = arr.match(/<([0-9a-fA-F\s]+)>/g);
        if (hexParts) {
          const combinedHex = hexParts
            .map((h) => decodePdfHexString(h.slice(1, -1)))
            .join("");
          if (combinedHex.trim()) outputChunks.push(combinedHex.trim());
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

    const hexTjMatches = block.match(/<([0-9a-fA-F\s]+)>\s*T[jJ]/g);
    if (hexTjMatches) {
      for (const m of hexTjMatches) {
        const inner = m.replace(/>\s*T[jJ]$/, "").replace(/^</, "");
        const decoded = decodePdfHexString(inner).trim();
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
 * Extract readable text from PDF buffer using dynamic PDFParse with multiple fallbacks.
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  // Strategy 1: pdf-parse v2 PDFParse class (requires { data: buffer } passed to constructor)
  try {
    const pdfParseModule = await import("pdf-parse");
    const PDFParseClass =
      pdfParseModule.PDFParse ||
      (pdfParseModule as any).default?.PDFParse;

    if (typeof PDFParseClass === "function") {
      const parser = new PDFParseClass({ data: buffer });
      await (parser as any).load();
      const result = await parser.getText();
      if (typeof parser.destroy === "function") {
        await parser.destroy();
      }
      const rawText = (
        typeof result === "string"
          ? result
          : result?.text ||
            (result?.pages || []).map((p: any) => p?.text || "").join("\n\n") ||
            ""
      ).trim();
      if (rawText.length > 10) {
        const clean = rawText
          .replace(/-- \d+ of \d+ --/g, "")
          .replace(/\r\n/g, "\n")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
        if (clean.length > 10) return clean;
      }
    }
  } catch (err) {
    console.warn("[cv_upload] PDFParse v2 parsing notice, falling back:", err);
  }

  // Strategy 2: Decompress flate streams in PDF
  const textChunks: string[] = [];
  const rawLatin = buffer.toString("latin1");

  const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
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

  if (textChunks.length > 3) {
    return textChunks.join("\n").replace(/[ \t]+/g, " ").trim();
  }

  // Strategy 3: Printable ASCII strings with loose threshold
  const utf8 = buffer.toString("utf-8");
  const printableRuns = utf8.match(/[\x20-\x7E\n\r\t]{8,}/g) || [];
  const filtered = printableRuns
    .map((s) => s.trim())
    .filter((s) => !s.startsWith("%PDF") && !s.includes("obj") && !s.includes("endobj") && s.length > 3);

  if (filtered.length > 0) {
    return filtered.join("\n").replace(/[ \t]+/g, " ").trim();
  }

  return printableRuns.join("\n").replace(/[ \t]+/g, " ").trim();
}

/**
 * Extract readable text from DOCX buffer (which is a ZIP containing word/document.xml).
 * Preserves paragraphs, bullet points, and table structures cleanly without artificial line chopping.
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
            const lines: string[] = [];

            // Extract all paragraphs (<w:p>)
            const pMatches = xml.match(/<w:p[\s\S]*?<\/w:p>/gi) || [];

            for (const pXml of pMatches) {
              // Check if paragraph is marked as a bullet or numbered list
              const isList = /<w:numPr[\s\S]*?<\/w:numPr>/i.test(pXml) ||
                             /w:val="ListParagraph"/i.test(pXml);

              // Extract text runs inside paragraph
              const tMatches = pXml.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/gi) || [];
              let pText = "";
              for (const tm of tMatches) {
                pText += tm.replace(/<[^>]+>/g, "");
              }

              pText = pText.replace(/\s+/g, " ").trim();

              if (pText.length > 0) {
                if (isList && !/^[-*•·▪▫◦✦►✓\u2022\u00b7\u2013\u2014>]|^\d+[\.\)]/i.test(pText)) {
                  lines.push(`• ${pText}`);
                } else {
                  lines.push(pText);
                }
              }
            }

            if (lines.length > 0) {
              return lines.join("\n");
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
  const pMatches = raw.match(/<w:p[\s\S]*?<\/w:p>/gi);
  if (pMatches && pMatches.length > 0) {
    return pMatches
      .map((p) => p.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
      .filter((s) => s.length > 0)
      .join("\n");
  }
  return raw.replace(/<[^>]+>/g, " ").replace(/[^\x20-\x7E\n\r\t]/g, " ").trim();
}
