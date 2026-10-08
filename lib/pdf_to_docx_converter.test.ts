import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  buildWordDocumentFromPdfText,
  convertPdfBufferToDocx
} from "./pdf_to_docx_converter.ts";
import { isLikelyGenuineDocumentText } from "./pdf_extract_browser.ts";

describe("ONLYOFFICE PDF-to-Word (DOCX) Conversion Engine", () => {
  const samplePdfText = `
CHIDIEBERE EZE
Email: chidiebere.eze@example.com | Phone: +234 803 123 4567 | Lagos, Nigeria

PROFESSIONAL SUMMARY
Experienced banking operations and relationship management officer with expertise in commercial lending.

WORK EXPERIENCE
First Bank of Nigeria
Business Relationship Officer | 2021 - Present
• Managed client relationship portfolios with 98% retention across 140 commercial accounts.
• Originated $3.8M in structured credit facilities complying with Central Bank regulations.
• Championed digital banking adoption, increasing mobile transaction volume by 42%.

EDUCATION
Bachelor of Science in Banking and Finance
University of Lagos, 2020

SKILLS
Commercial Lending, Credit Analysis, Portfolio Management, Risk Assessment
`;

  test("buildWordDocumentFromPdfText structures sections, bullets, and contact header", () => {
    const { doc, cleanText, metadata } = buildWordDocumentFromPdfText(samplePdfText, "Chidiebere_Eze_CV.pdf");

    assert.ok(doc, "Should construct a valid Document");
    assert.ok(cleanText.includes("CHIDIEBERE EZE"));
    assert.ok(metadata.sectionCount >= 3, `Should detect at least 3 sections, found: ${metadata.sectionCount}`);
    assert.ok(metadata.bulletCount >= 3, `Should detect at least 3 bullet points, found: ${metadata.bulletCount}`);
  });

  test("convertPdfBufferToDocx compiles into valid OpenXML .docx zip buffer", async () => {
    const rawBuffer = Buffer.from(samplePdfText, "utf-8");
    const result = await convertPdfBufferToDocx(rawBuffer, "Candidate_Resume.pdf", samplePdfText);

    assert.ok(result.docxBuffer instanceof Buffer, "Should produce a Node.js Buffer");
    assert.ok(result.docxBuffer.length > 1000, "DOCX buffer should be non-trivial (>1KB)");

    // Standard OpenXML / ZIP magic numbers: PK\x03\x04 (0x04034b50)
    const magic = result.docxBuffer.readUInt32LE(0);
    assert.equal(magic, 0x04034b50, "Generated file must have standard ZIP/OpenXML magic number PK\\x03\\x04");

    // Output filename should end in .docx
    assert.ok(result.fileName.endsWith(".docx"), "Filename must end with .docx");
    assert.equal(result.fileName, "Candidate_Resume.docx");
  });

  test("isLikelyGenuineDocumentText accurately discriminates genuine CV prose from binary/font metadata", () => {
    assert.equal(isLikelyGenuineDocumentText(""), false);
    assert.equal(isLikelyGenuineDocumentText("opensource\\nanonymous\\nD:20261007141158+00'00'\\nunspecified"), false);
    assert.equal(isLikelyGenuineDocumentText("mhi8/mPhp*07s\\nVYK4%-:?G-^hYe#8[d>r8<B$8GO1@ToEPWln"), false);
    assert.equal(isLikelyGenuineDocumentText(samplePdfText), true);
  });

  test("convertPdfBufferToDocx extracts text and compiles docx even when raw text is omitted", async () => {
    const rawBuffer = Buffer.from(samplePdfText, "utf-8");
    // Omit third argument to test internal extraction fallback
    const result = await convertPdfBufferToDocx(rawBuffer, "Candidate_Resume.pdf");

    assert.ok(result.docxBuffer instanceof Buffer);
    assert.ok(result.docxBuffer.length > 500);
    assert.equal(result.fileName, "Candidate_Resume.docx");
  });
});
