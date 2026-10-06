import test from "node:test";
import assert from "node:assert/strict";
import { generateCvPdfBytes } from "./pdf_generator.ts";
import type { ParsedCv } from "./cv_parser.ts";

test("generateCvPdfBytes generates valid standard PDF 1.4 output", () => {
  const sampleCv: ParsedCv = {
    applicant_name: "Ibochi Vincent",
    email: "vincent@example.com",
    phone: "+234 800 123 4567",
    location: "Lagos, Nigeria",
    target_roles: ["Senior Marine Engineer", "Software Systems Architect"],
    summary:
      "Disciplined engineering professional with extensive maritime propulsion and distributed software systems expertise.",
    skills: [
      "Marine Propulsion",
      "Dynamic Positioning",
      "TypeScript",
      "Next.js",
      "Distributed Systems",
    ],
    work_experience: [
      {
        role: "Chief Engineer",
        company: "Maersk Line",
        duration: "2021 - 2024",
        highlights: [
          "Supervised 14-megawatt two-stroke main engine operations across 18 transatlantic voyages.",
          "Maintained zero unscheduled downtime across 36 consecutive months.",
        ],
      },
    ],
    academic_history: [
      {
        degree: "B.Eng",
        field_of_study: "Marine Engineering",
        institution: "Maritime Academy",
        graduation_year: "2020",
        achievements: [],
      },
    ],
    certifications: [
      "STCW 95/2010 Basic Safety Training",
      "ENG1 Seafarer Medical Certificate",
    ],
  };

  const pdfBytes = generateCvPdfBytes(sampleCv);
  const pdfString = Buffer.from(pdfBytes).toString("latin1");

  // Validate PDF header and trailer
  assert.ok(pdfString.startsWith("%PDF-1.4"), "Must start with %PDF-1.4 header");
  assert.ok(pdfString.includes("%%EOF"), "Must contain %%EOF trailer");

  // Validate objects and xref table
  assert.ok(pdfString.includes("xref"), "Must contain cross-reference table");
  assert.ok(pdfString.includes("/Type /Catalog"), "Must contain Catalog object");
  assert.ok(pdfString.includes("/Type /Pages"), "Must contain Pages object");

  // Validate candidate text appears in PDF content stream
  assert.ok(pdfString.includes("IBOCHI VINCENT"), "Must contain candidate name in uppercase");
  assert.ok(pdfString.includes("vincent@example.com"), "Must contain candidate email");
  assert.ok(pdfString.includes("Maersk Line"), "Must contain company name");
  assert.ok(pdfString.includes("Chief Engineer"), "Must contain role");
  assert.ok(pdfString.includes("Marine Propulsion"), "Must contain skills");
  assert.ok(pdfString.includes("STCW 95/2010"), "Must contain certification");
});
