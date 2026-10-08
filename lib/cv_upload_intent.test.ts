import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { processCopilotQuery } from "./copilot_intelligence.ts";
import { classifyUserIntent, generateIntentMemoryResponse } from "./user_intent_knowledge.ts";

describe("CV Upload Intent Classification & Grounded Memory Recall", () => {
  test("classifyUserIntent accurately routes CV upload queries to Profile, CV & Credentials Management", () => {
    const q1 = "How many CVs have I uploaded here?";
    const c1 = classifyUserIntent(q1);
    assert.equal(c1.category, "Profile, CV & Credentials Management");

    const q2 = "How many resumes have I uploaded?";
    const c2 = classifyUserIntent(q2);
    assert.equal(c2.category, "Profile, CV & Credentials Management");

    const q3 = "When was my CV uploaded and what changes were made?";
    const c3 = classifyUserIntent(q3);
    assert.equal(c3.category, "Profile, CV & Credentials Management");

    const q4 = "Can you remember how many CVs I uploaded?";
    const c4 = classifyUserIntent(q4);
    assert.equal(c4.category, "Profile, CV & Credentials Management");
  });

  test("Copilot Query: 'How many CVs have I uploaded here?' with 1 active CV", async () => {
    const result = await processCopilotQuery({
      message: "How many CVs have I uploaded here?",
      address: "0xusercvupload0000000000000000000000000000001",
      profile: {
        applicant_name: "Vincent",
        target_roles: ["Senior Distributed Systems Engineer"],
        skills: ["Go", "TypeScript", "PostgreSQL", "Docker", "Sui Move"],
        work_experience: [
          { company: "Apex Tech", role: "Lead Engineer", duration: "2023 - Present" },
        ],
        uploadedAt: "2026-10-05T10:00:00Z",
        calibratedAt: "2026-10-06T14:30:00Z",
      },
      appliedJobs: [],
    });

    const reply = result.reply || result.content;

    // 1. Must report exact count (1 tailored CV)
    assert.match(reply, /1 tailored CV/i);

    // 2. Must state upload date
    assert.match(reply, /5th of October, 2026/i);

    // 3. Must state calibration / upgrade date
    assert.match(reply, /6th of October, 2026/i);

    // 4. Must cite the upgrade to "ATS stylish standard"
    assert.match(reply, /ATS stylish standard/i);

    // 5. Must explain the up to 3 distinct snapshots in Walrus Sovereign Memory vault
    assert.match(reply, /3 distinct tailored/i);
    assert.match(reply, /Walrus/i);
  });

  test("Copilot Query: 'How many CVs have I uploaded here?' with 0 active CVs", async () => {
    const result = await processCopilotQuery({
      message: "How many CVs have I uploaded here?",
      address: "0xusercvupload0000000000000000000000000000002",
      profile: null,
      appliedJobs: [],
    });

    const reply = result.reply || result.content;

    // 1. Must report exact count (0 CVs)
    assert.match(reply, /0 CVs/i);

    // 2. Must not give generic welcome fallback
    assert.doesNotMatch(reply, /Welcome to CareerAce! You haven't uploaded or calibrated your resume yet\./);

    // 3. Must instruct candidate on uploading up to 3 versions in Resume Studio to upgrade to ATS stylish standard
    assert.match(reply, /Resume Studio/i);
    assert.match(reply, /ATS stylish standard/i);
  });

  test("Copilot Query: 'Can you remember how many CVs I uploaded and when?' with versions array", async () => {
    const result = await processCopilotQuery({
      message: "Can you remember how many CVs I uploaded and when?",
      address: "0xusercvupload0000000000000000000000000000003",
      profile: {
        applicant_name: "Vincent",
        target_roles: ["Systems Architect"],
        skills: ["Rust", "Distributed Systems"],
        versions: [
          { id: "v1", role: "Software Engineer", uploadedAt: "2026-10-04T08:00:00Z" },
          { id: "v2", role: "Systems Architect", uploadedAt: "2026-10-06T12:00:00Z" },
        ],
      },
      appliedJobs: [],
    });

    const reply = result.reply || result.content;
    assert.match(reply, /2 tailored CV/i);
    assert.match(reply, /ATS stylish standard/i);
    assert.match(reply, /Resume Studio/i);
  });

  test("CV Upload API: Enforces 150,000 character text limit", async () => {
    const { validateCvTextLength, MAX_CV_TEXT_LENGTH } = await import("./cv_upload_validator.ts");
    assert.strictEqual(MAX_CV_TEXT_LENGTH, 150_000);

    const validCheck = validateCvTextLength(5000);
    assert.strictEqual(validCheck.valid, true);

    const overCheck = validateCvTextLength(150_005);
    assert.strictEqual(overCheck.valid, false);
    assert.strictEqual(overCheck.code, "TEXT_TOO_LONG");
    assert.strictEqual(overCheck.statusCode, 413);
    assert.match(overCheck.error || "", /150,000 character limit/i);

    const corruptCheck = validateCvTextLength(5);
    assert.strictEqual(corruptCheck.valid, false);
    assert.strictEqual(corruptCheck.code, "EMPTY_OR_CORRUPT");
    assert.strictEqual(corruptCheck.statusCode, 400);
  });

  test("CV Upload API: Enforces 10MB file size limit", async () => {
    const { validateFileSize, MAX_UPLOAD_FILE_SIZE } = await import("./cv_upload_validator.ts");
    assert.strictEqual(MAX_UPLOAD_FILE_SIZE, 10 * 1024 * 1024);

    const validCheck = validateFileSize(2 * 1024 * 1024); // 2MB
    assert.strictEqual(validCheck.valid, true);

    const overCheck = validateFileSize(11 * 1024 * 1024); // 11MB
    assert.strictEqual(overCheck.valid, false);
    assert.strictEqual(overCheck.code, "FILE_TOO_LARGE");
    assert.strictEqual(overCheck.statusCode, 413);
    assert.match(overCheck.error || "", /10MB limit/i);
  });
});


