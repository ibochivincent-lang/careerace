import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseCvText } from "./heuristic_cv_parser.ts";

describe("Executive CV Experience Extraction & Organization Precision", () => {
  test("Extracts Company Name on Line 1 and Role + Dates on Line 2 without placeholder Organization", () => {
    const rawCv = `
CHIDIEBERE EZE
Email: chidiebere.eze@example.com | Phone: +234 803 123 4567 | Lagos, Nigeria

PROFESSIONAL SUMMARY
Experienced banking and relationship management officer with expertise in commercial lending and portfolio growth.

WORK EXPERIENCE
First Bank of Nigeria
Business Relationship Officer | 2021 - Present
• Managed client relationship portfolios with 98% retention across 140 commercial accounts.
• Originated $3.8M in structured credit facilities complying with Central Bank regulations.
• Championed digital banking adoption, increasing mobile transaction volume by 42%.

EDUCATION
Bachelor of Science in Banking and Finance
University of Lagos, 2020
`;

    const parsed = parseCvText(rawCv);
    assert.ok(parsed.work_experience && parsed.work_experience.length >= 1, "Work experience should have at least 1 entry");

    const exp = parsed.work_experience[0];
    assert.equal(exp.company, "First Bank of Nigeria", "Company name should be First Bank of Nigeria");
    assert.equal(exp.role, "Business Relationship Officer", "Role should be Business Relationship Officer");
    assert.ok(exp.duration.includes("2021") && exp.duration.toLowerCase().includes("present"), "Duration should capture 2021 - Present");
    assert.ok(exp.highlights.length >= 2, "Should capture accomplishment bullets");
    assert.notEqual(exp.company.toLowerCase(), "organization", "Company must never be default Organization placeholder");
  });

  test("Extracts Role on Line 1, Company on Line 2, and Date on Line 3", () => {
    const rawCv = `
FATIMA AL-MANSOOR
Email: fatima.mansoor@example.com | Dubai, UAE

PROFESSIONAL EXPERIENCE
Business Relationship Officer
Standard Chartered Bank
Jan 2020 - Dec 2023
- Oversaw high-net-worth client advisory and cross-border trade transactions.
- Grew institutional deposits by 31% year-over-year.

EDUCATION
B.Sc in Economics, American University of Sharjah, 2019
`;

    const parsed = parseCvText(rawCv);
    assert.ok(parsed.work_experience && parsed.work_experience.length >= 1);

    const exp = parsed.work_experience[0];
    assert.equal(exp.company, "Standard Chartered Bank");
    assert.equal(exp.role, "Business Relationship Officer");
    assert.ok(exp.duration.includes("2020") && exp.duration.includes("2023"));
    assert.ok(exp.highlights.length >= 1);
    assert.notEqual(exp.company.toLowerCase(), "organization");
  });

  test("Extracts inline format 'Role at Company (Dates)'", () => {
    const rawCv = `
OLUWASEUN ADEYEMI
Email: seun.adeyemi@example.com

EXPERIENCE
Business Relationship Officer at Zenith Bank Plc (2022 - Present)
• Supervised branch corporate relationships and retail credit appraisal.
• Conducted risk assessments reducing non-performing loans by 18%.
`;

    const parsed = parseCvText(rawCv);
    assert.ok(parsed.work_experience && parsed.work_experience.length >= 1);

    const exp = parsed.work_experience[0];
    assert.equal(exp.company, "Zenith Bank Plc");
    assert.equal(exp.role, "Business Relationship Officer");
    assert.ok(exp.duration.includes("2022"));
    assert.notEqual(exp.company.toLowerCase(), "organization");
  });

  test("Extracts compound dash format 'Company - Role' with subsequent date line", () => {
    const rawCv = `
TARIQ HASSAN
Email: tariq.hassan@example.com

WORK HISTORY
Bourbon Interoil - Marine Engineer
2021 - Present
• Commanded auxiliary engine maintenance across 3 offshore support vessels.
• Enforced STCW safety protocols with zero lost-time incidents over 450 sea days.

Access Bank - Commercial Officer
2018 - 2021
• Managed corporate treasury portfolios and structured trade lines.
`;

    const parsed = parseCvText(rawCv);
    assert.ok(parsed.work_experience && parsed.work_experience.length >= 2, "Should capture both positions");

    const exp1 = parsed.work_experience[0];
    assert.equal(exp1.company, "Bourbon Interoil");
    assert.equal(exp1.role, "Marine Engineer");
    assert.ok(exp1.duration.includes("2021"));
    assert.notEqual(exp1.company.toLowerCase(), "organization");

    const exp2 = parsed.work_experience[1];
    assert.equal(exp2.company, "Access Bank");
    assert.equal(exp2.role, "Commercial Officer");
    assert.ok(exp2.duration.includes("2018"));
    assert.notEqual(exp2.company.toLowerCase(), "organization");
  });

  test("Extracts multi-column line format 'Role | Company | Location | Dates'", () => {
    const rawCv = `
NGOZI OKAFOR
Email: ngozi.okafor@example.com

EXPERIENCE
Business Relationship Officer | Guaranty Trust Bank | Lagos, Nigeria | 2020 - 2024
• Spearheaded corporate client onboarding and syndicated credit analysis.
• Maintained 99.4% customer satisfaction rating across 80 corporate accounts.
`;

    const parsed = parseCvText(rawCv);
    assert.ok(parsed.work_experience && parsed.work_experience.length >= 1);

    const exp = parsed.work_experience[0];
    assert.equal(exp.company, "Guaranty Trust Bank");
    assert.equal(exp.role, "Business Relationship Officer");
    assert.ok(exp.duration.includes("2020") && exp.duration.includes("2024"));
    assert.notEqual(exp.company.toLowerCase(), "organization");
  });
});
