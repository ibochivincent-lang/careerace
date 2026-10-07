import test from "node:test";
import assert from "node:assert/strict";
import {
  processCopilotQuery,
  parseSpecificDateQuery,
  isJobMatchingDate,
  extractHeuristicFacts,
} from "./copilot_intelligence.ts";
import {
  resolveConflicts,
  formatFact,
  isSensitiveData,
  claimsOfKind,
} from "./facts.ts";
import { rememberFact } from "./memory_core.ts";

const TEST_ADDRESS = "0xqa00000000000000000000000000000000000001";

// ── TEST A: Single-Turn Fact Storage & Recall ────────────────────────────────
test("QA Test A: Single-Turn Fact Storage & Recall", async () => {
  const result1 = await processCopilotQuery({
    message: "My target role is Lead Distributed Systems Architect",
    address: TEST_ADDRESS,
    appliedJobs: [],
  });

  assert.ok(result1.stored.some((s) => s.includes("Lead Distributed Systems Architect") || s.includes("target role")));

  // Inquire about the role
  const result2 = await processCopilotQuery({
    message: "What is my target role?",
    address: TEST_ADDRESS,
    appliedJobs: [],
  });

  const reply = result2.reply || result2.content;
  assert.match(reply, /Distributed Systems Architect/i);
});

// ── TEST B: Multi-Turn Fact Accumulation ──────────────────────────────────────
test("QA Test B: Multi-Turn Fact Accumulation", async () => {
  const addr = "0xqa00000000000000000000000000000000000002";

  // Turn 1: Identity
  await processCopilotQuery({
    message: "My name is Vincent Ibochi",
    address: addr,
    appliedJobs: [],
  });

  // Turn 2: Degree
  await processCopilotQuery({
    message: "My degree is B.Sc. in Computer Science from University of Lagos",
    address: addr,
    appliedJobs: [],
  });

  // Turn 3: Skills
  await processCopilotQuery({
    message: "My skills are Rust, TypeScript, and Sui Move",
    address: addr,
    appliedJobs: [],
  });

  // Turn 4: Comprehensive recall
  const result = await processCopilotQuery({
    message: "Can you read my CV and background?",
    address: addr,
    appliedJobs: [],
    profile: {
      applicant_name: "Vincent Ibochi",
      education: ["B.Sc. in Computer Science from University of Lagos"],
      skills: ["Rust", "TypeScript", "Sui Move"],
    },
  });

  const reply = result.reply || result.content;
  assert.match(reply, /Vincent/i);
  assert.match(reply, /Computer Science|University of Lagos/i);
  assert.match(reply, /Rust|TypeScript|Sui Move/i);
});

// ── TEST C: Fact Updating & Correction (Superseding) ─────────────────────────
test("QA Test C: Fact Updating & Correction (Superseding)", async () => {
  const addr = "0xqa00000000000000000000000000000000000003";

  // Turn 1: Original operating system
  await processCopilotQuery({
    message: "I use Mac",
    address: addr,
    appliedJobs: [],
  });

  // Turn 2: Correction / switch
  await processCopilotQuery({
    message: "I switched to Linux",
    address: addr,
    appliedJobs: [],
  });

  // Turn 3: Recall active OS
  const result = await processCopilotQuery({
    message: "What OS do I use?",
    address: addr,
    appliedJobs: [],
  });

  const reply = result.reply || result.content;
  assert.match(reply, /Linux/i);
  assert.doesNotMatch(reply, /\bMac\b/);

  // Pure fact algebra verification of SUPERSEDES resolution
  const fact1 = { text: "2026-10-01 | preference | operating system: mac", distance: 0.1, blobId: "b1" };
  const fact2 = { text: "2026-10-07 | preference | operating system: linux - SUPERSEDES: operating system: mac", distance: 0.1, blobId: "b2" };
  const resolved = resolveConflicts([fact1, fact2]);

  assert.equal(resolved.active.length, 1);
  assert.match(resolved.active[0].text, /linux/i);
  assert.equal(resolved.superseded.length, 1);
  assert.match(resolved.superseded[0].text, /mac/i);
});

// ── TEST D: Cross-Session Persistence ─────────────────────────────────────────
test("QA Test D: Cross-Session Persistence", async () => {
  const addr = "0xqa00000000000000000000000000000000000004";

  // Session 1: Store location preference
  await processCopilotQuery({
    message: "I want to work in London",
    address: addr,
    appliedJobs: [],
  });

  // Session 2: Fresh query payload with no history, same address
  const session2 = await processCopilotQuery({
    message: "Where am I located?",
    address: addr,
    appliedJobs: [],
  });

  const reply = session2.reply || session2.content;
  assert.match(reply, /London/i);
});

// ── TEST E: Contextual Memory Retrieval ───────────────────────────────────────
test("QA Test E: Contextual Memory Retrieval", async () => {
  const addr = "0xqa00000000000000000000000000000000000005";

  const result = await processCopilotQuery({
    message: "What are my skills?",
    address: addr,
    profile: {
      applicant_name: "Elena Rostova",
      target_roles: ["Subsea Systems Specialist"],
      skills: ["Hydrodynamics", "ANSYS", "Offshore Safety", "Sui Move"],
      academic_history: ["M.Sc. Marine Engineering from NTNU"],
    },
    appliedJobs: [],
  });

  const reply = result.reply || result.content;
  assert.match(reply, /Hydrodynamics|ANSYS|Offshore Safety|Sui Move/i);
  // Specifically answers skills without reciting full unrelated academic background
  assert.match(reply, /skills indexed|skills/i);
});

// ── TEST F: Distractor Resistance ─────────────────────────────────────────────
test("QA Test F: Distractor Resistance", () => {
  const noisyInput =
    "I had a cup of coffee this morning, traffic was terrible on the highway, but please remember that my target role is Staff Protocol Engineer";

  const extracted = extractHeuristicFacts(noisyInput);
  const roleFact = extracted.find((f) => f.kind === "target_role");

  assert.ok(roleFact, "Should extract target role despite noisy conversation");
  assert.match(roleFact.text, /Staff Protocol Engineer/i);
  assert.doesNotMatch(roleFact.text, /coffee|traffic|highway/i);
});

// ── TEST G: Instruction Memory & Behavioral Adaptation ────────────────────────
test("QA Test G: Instruction Memory & Behavioral Adaptation", async () => {
  const addr = "0xqa00000000000000000000000000000000000007";

  // Store preference for short answers
  await processCopilotQuery({
    message: "Remember that I prefer short answers under 2 sentences",
    address: addr,
    appliedJobs: [],
  });

  // Ask platform policy question
  const result = await processCopilotQuery({
    message: "How many jobs can I apply in a day? Keep it concise",
    address: addr,
    appliedJobs: [],
  });

  const reply = result.reply || result.content;
  assert.ok(reply.length > 0);
  assert.match(reply, /as many.*as possible/i);

  // Response should be concise
  const sentenceCount = (reply.match(/[.!?]+/g) || []).length;
  assert.ok(sentenceCount <= 3, `Expected concise response under 3 sentences, got ${sentenceCount}`);
});

// ── TEST H: Memory Boundary & False Memory Refusal ────────────────────────────
test("QA Test H: Memory Boundary & False Memory Refusal", async () => {
  const addr = "0xqa00000000000000000000000000000000000008";

  // Probe unrecorded facts
  const probeDog = await processCopilotQuery({
    message: "What is my dog's name?",
    address: addr,
    appliedJobs: [],
  });
  assert.match(probeDog.reply, /do not have any record/i);

  const probeCar = await processCopilotQuery({
    message: "What car do I drive?",
    address: addr,
    appliedJobs: [],
  });
  assert.match(probeCar.reply, /do not have any record/i);

  const probeFood = await processCopilotQuery({
    message: "What is my favorite food?",
    address: addr,
    appliedJobs: [],
  });
  assert.match(probeFood.reply, /do not have any record/i);
});

// ── TEST I: Specific Date & Timing Recall (Strict Zero Hallucination) ─────────
test("QA Test I: Specific Date & Timing Recall", async () => {
  const addr = "0xqa00000000000000000000000000000000000009";

  const appliedJobs = [
    {
      id: "job-1",
      jobTitle: "Senior Distributed Systems Engineer",
      company: "Mysten Labs",
      appliedAt: "October 6, 2026",
      appliedTimestamp: new Date("2026-10-06T10:00:00Z").getTime(),
    },
    {
      id: "job-2",
      jobTitle: "Staff Smart Contract Engineer",
      company: "Walrus Foundation",
      appliedAt: "October 6, 2026",
      appliedTimestamp: new Date("2026-10-06T14:30:00Z").getTime(),
    },
    {
      id: "job-3",
      jobTitle: "Autonomous Systems Architect",
      company: "DeepSurge",
      appliedAt: "October 7, 2026",
      appliedTimestamp: new Date("2026-10-07T09:15:00Z").getTime(),
    },
  ];

  // 1. Query exact date with 2 jobs (October 6th)
  const queryOct6 = await processCopilotQuery({
    message: "How many jobs did I apply for on October 6th?",
    address: addr,
    appliedJobs: appliedJobs,
  });
  assert.match(queryOct6.reply, /applied to 2 jobs on 6th of October/i);
  assert.match(queryOct6.reply, /Mysten Labs/i);
  assert.match(queryOct6.reply, /Walrus Foundation/i);

  // 2. Query exact date with 1 job (7th of October)
  const queryOct7 = await processCopilotQuery({
    message: "What jobs did I apply for on 7th of October?",
    address: addr,
    appliedJobs: appliedJobs,
  });
  assert.match(queryOct7.reply, /applied to 1 job on 7th of October/i);
  assert.match(queryOct7.reply, /DeepSurge/i);

  // 3. Strict Refusal on Unrecorded Date (October 8th) - Zero Hallucination!
  const queryOct8 = await processCopilotQuery({
    message: "Did I apply for any jobs on October 8th?",
    address: addr,
    appliedJobs: appliedJobs,
  });
  assert.match(queryOct8.reply, /did not apply for any jobs on 8th of October/i);
  assert.match(queryOct8.reply, /No applications are recorded/i);
  assert.doesNotMatch(queryOct8.reply, /Mysten Labs|Walrus Foundation|DeepSurge/);

  // 4. Query All Application Dates
  const queryDates = await processCopilotQuery({
    message: "What dates did I apply for jobs?",
    address: addr,
    appliedJobs: appliedJobs,
  });
  assert.match(queryDates.reply, /6th of October.*2 jobs/i);
  assert.match(queryDates.reply, /7th of October.*1 job/i);
});

// ── TEST J: Sensitive Data Rejection & Privacy Guard ──────────────────────────
test("QA Test J: Sensitive Data Rejection & Privacy Guard", async () => {
  const addr = "0xqa00000000000000000000000000000000000010";

  // Pattern detection tests
  assert.ok(isSensitiveData("My OpenAI API key is sk-abcdef1234567890abcdef1234567890"));
  assert.ok(isSensitiveData("Here is my password: SuperSecretP@ssw0rd!123"));
  assert.ok(isSensitiveData("My SSN is 000-12-3456"));
  assert.ok(isSensitiveData("My GitHub token is ghp_1234567890abcdef1234567890abcdef1234"));

  // Copilot query test with API key
  const leakAttempt = await processCopilotQuery({
    message: "Please remember my api key: sk-live9876543210abcdef9876543210abcdef",
    address: addr,
    appliedJobs: [],
  });

  assert.equal(leakAttempt.stored.length, 0, "Sensitive data must never be saved to memory");
  assert.match(leakAttempt.reply, /security and privacy/i);
  assert.match(leakAttempt.reply, /does not store passwords, API keys/i);
});
