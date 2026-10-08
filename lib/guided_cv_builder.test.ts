import test from "node:test";
import assert from "node:assert/strict";
import {
  isSkipResponse,
  isCvCreationRequest,
  isGuidedCvBuilderActive,
  startGuidedCvBuilder,
  handleGuidedCvBuilderTurn,
  cancelGuidedCvBuilder,
} from "./guided_cv_builder.ts";

const TEST_ADDR = "0xbuilder_test_address_123456789";

test("Guided CV Builder: isSkipResponse detects skip variations", () => {
  assert.strictEqual(isSkipResponse("I don't have"), true);
  assert.strictEqual(isSkipResponse("i dont have"), true);
  assert.strictEqual(isSkipResponse("skip"), true);
  assert.strictEqual(isSkipResponse("n/a"), true);
  assert.strictEqual(isSkipResponse("none"), true);
  assert.strictEqual(isSkipResponse("no"), true);
  assert.strictEqual(isSkipResponse("I do not have any"), true);
  assert.strictEqual(isSkipResponse("TypeScript, React, Node.js"), false);
});

test("Guided CV Builder: isCvCreationRequest identifies user intent to build CV", () => {
  assert.strictEqual(isCvCreationRequest("I don't have a CV"), true);
  assert.strictEqual(isCvCreationRequest("help me create a cv"), true);
  assert.strictEqual(isCvCreationRequest("build my resume"), true);
  assert.strictEqual(isCvCreationRequest("help me build a resume"), true);
  assert.strictEqual(isCvCreationRequest("how many jobs did I apply for yesterday?"), false);
});

test("Guided CV Builder: executes complete 10-step sequential interview with 'I don't have' skip support", async () => {
  cancelGuidedCvBuilder(TEST_ADDR);

  // 1. Start builder
  const start = startGuidedCvBuilder(TEST_ADDR);
  assert.strictEqual(start.step, "asking_name");
  assert.strictEqual(isGuidedCvBuilderActive(TEST_ADDR), true);

  // Step 1 -> Full Name
  const step1 = await handleGuidedCvBuilderTurn(TEST_ADDR, "Alexander Morgan");
  assert.strictEqual(step1.step, "asking_target_role");
  assert.ok(step1.reply.includes("Alexander Morgan"));

  // Step 2 -> Target Role
  const step2 = await handleGuidedCvBuilderTurn(TEST_ADDR, "Senior Staff Engineer");
  assert.strictEqual(step2.step, "asking_contact");

  // Step 3 -> Contact Info
  const step3 = await handleGuidedCvBuilderTurn(TEST_ADDR, "alex@example.com, +1-555-0199, Seattle, WA");
  assert.strictEqual(step3.step, "asking_links");

  // Step 4 -> Professional Links
  const step4 = await handleGuidedCvBuilderTurn(TEST_ADDR, "https://linkedin.com/in/alexmorgan, https://github.com/alexmorgan");
  assert.strictEqual(step4.step, "asking_skills");

  // Step 5 -> Skills
  const step5 = await handleGuidedCvBuilderTurn(TEST_ADDR, "TypeScript, Next.js, Rust, Distributed Systems, Walrus Storage");
  assert.strictEqual(step5.step, "asking_experience");

  // Step 6 -> Work Experience
  const step6 = await handleGuidedCvBuilderTurn(TEST_ADDR, "Acme Cloud Corp | Lead Systems Architect | 2021 - Present | Led distributed storage migration");
  assert.strictEqual(step6.step, "asking_education");

  // Step 7 -> Education
  const step7 = await handleGuidedCvBuilderTurn(TEST_ADDR, "B.S. Computer Engineering from University of Washington (2020)");
  assert.strictEqual(step7.step, "asking_certifications");

  // Step 8 -> Certifications (Candidate replies "I don't have")
  const step8 = await handleGuidedCvBuilderTurn(TEST_ADDR, "I don't have");
  assert.strictEqual(step8.step, "asking_leadership");

  // Step 9 -> Leadership (Candidate replies "I don't have")
  const step9 = await handleGuidedCvBuilderTurn(TEST_ADDR, "I don't have");
  assert.strictEqual(step9.step, "asking_conferences");

  // Step 10 -> Conferences (Candidate replies "I don't have") -> Completion
  const step10 = await handleGuidedCvBuilderTurn(TEST_ADDR, "I don't have");
  assert.strictEqual(step10.completed, true);
  assert.strictEqual(step10.step, "completed");
  assert.ok(step10.profile);
  assert.strictEqual(step10.profile.applicant_name, "Alexander Morgan");
  assert.strictEqual(step10.profile.email, "alex@example.com");
  assert.strictEqual(step10.profile.target_roles?.[0], "Senior Staff Engineer");
  assert.ok(step10.profile.skills?.includes("TypeScript"));
  assert.strictEqual(isGuidedCvBuilderActive(TEST_ADDR), false);
});
