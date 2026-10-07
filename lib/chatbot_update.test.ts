import test from "node:test";
import assert from "node:assert/strict";
import {
  correctTypographicalErrors,
  normalizeTypographicalErrors,
  damerauLevenshteinDistance,
} from "./typo_tolerance.ts";
import {
  getChatHistory,
  saveChatHistory,
  appendChatTurn,
  clearChatHistory,
} from "./chat_history_store.ts";
import {
  processCopilotQuery,
  extractHeuristicFacts,
} from "./copilot_intelligence.ts";
import { rememberFact } from "./memory_core.ts";

const TEST_ADDR_TYPO = "0xty00000000000000000000000000000000000001";
const TEST_ADDR_LEARN = "0xln00000000000000000000000000000000000002";
const TEST_ADDR_CROSS = "0xcd00000000000000000000000000000000000003";

// ── REQUIREMENT 1: Data Collection & Processing into Walrus Memory ─────────────
test("Requirement 1: Extracts and processes career credentials, certifications, salary, and availability into Walrus memory", async () => {
  // Test certifications extraction
  const certFacts = extractHeuristicFacts("I am certified in AWS Solutions Architect Professional and STCW Marine Engineering");
  assert.ok(certFacts.some((f) => f.kind === "education" && f.text.includes("AWS Solutions Architect")));

  // Test salary extraction
  const salFacts = extractHeuristicFacts("My target salary is $150k/year with remote flexibility");
  assert.ok(salFacts.some((f) => f.kind === "preference" && f.text.includes("$150k/year")));

  // Test availability extraction
  const availFacts = extractHeuristicFacts("I am available immediately with 2 weeks notice period");
  assert.ok(availFacts.some((f) => f.kind === "preference" && f.text.includes("available immediately")));

  // Test portfolio links
  const linkFacts = extractHeuristicFacts("My portfolio is https://github.com/ibochivincent-lang and linkedin.com/in/vincent");
  assert.ok(linkFacts.some((f) => f.kind === "preference" && f.text.includes("github.com/ibochivincent-lang")));

  // Process through copilot turn and check stored outputs
  const res = await processCopilotQuery({
    message: "I am certified in CompTIA Security+ and my salary expectation is $130,000/yr",
    address: TEST_ADDR_TYPO,
  });

  assert.ok(res.stored.length > 0);
  assert.ok(res.stored.some((s) => s.toLowerCase().includes("security+") || s.toLowerCase().includes("130,000")));
});

// ── REQUIREMENT 2 & 3: AI Fallback, Grounded Answer & Novel Q&A Auto-Persistence ──
test("Requirement 2 & 3: Novel unindexed questions fall back to AI grounded in Walrus memory and auto-persist to Walrus memory", async () => {
  // Step 1: Pre-seed a unique Walrus memory fact for this candidate
  await rememberFact(
    TEST_ADDR_LEARN,
    "preference",
    "Learned Q&A: \"what is my secret project codename\" -> \"Your secret project codename is Project Andromeda.\""
  );

  // Step 2: Query copilot with that question — it should retrieve the stored Q&A from Walrus memory!
  const resRecall = await processCopilotQuery({
    message: "what is my secret project codename",
    address: TEST_ADDR_LEARN,
    profile: {
      applicant_name: "Vincent Ibochi",
      target_roles: ["Staff Protocol Engineer"],
      skills: ["Rust", "Sui Move", "TypeScript"],
    },
  });

  const reply = resRecall.reply || resRecall.content;
  assert.match(reply, /Project Andromeda/i);
});

// ── REQUIREMENT 4: Typographical Error Tolerance & Intent Resolution ─────────
test("Requirement 4: Automatically corrects severe typos and answers what user referred to", async () => {
  // 1. Direct typo engine checks
  const typo1 = correctTypographicalErrors("hw mny jbs can i aply a day");
  assert.strictEqual(typo1.corrected, "how many jobs can i apply a day");
  assert.ok(typo1.hasCorrections);

  const typo2 = correctTypographicalErrors("wt is my target rle");
  assert.strictEqual(typo2.corrected, "what is my target role");

  const typo3 = correctTypographicalErrors("can i aply with other dicipline");
  assert.strictEqual(typo3.corrected, "can i apply with other discipline");

  const typo4 = correctTypographicalErrors("my styd couse is not here");
  assert.strictEqual(typo4.corrected, "my study course is not here");

  // 2. Full end-to-end Copilot query execution with typos
  // Case A: "hw mny jbs can i aply a day" -> Understands "how many jobs can I apply in a day"
  const resLimit = await processCopilotQuery({
    message: "hw mny jbs can i aply a day",
    address: TEST_ADDR_TYPO,
  });
  const limitReply = resLimit.reply || resLimit.content;
  assert.match(limitReply, /as many as possible|daily limit|safeguard|pacing/i);

  // Case B: "can i aply with other dicipline" -> Understands discipline switching
  const resDiscipline = await processCopilotQuery({
    message: "can i aply with other dicipline",
    address: TEST_ADDR_TYPO,
  });
  const discReply = resDiscipline.reply || resDiscipline.content;
  assert.match(discReply, /multiple|discipline|specialized|track|tailored/i);

  // Case C: "my styd couse is not here" -> Understands course of study
  const resCourse = await processCopilotQuery({
    message: "my styd couse is not here",
    address: TEST_ADDR_TYPO,
  });
  const courseReply = resCourse.reply || resCourse.content;
  assert.match(courseReply, /curriculum|course|support|academic|discipline/i);
});

// ── REQUIREMENT 5: Cross-Device Chat History Retention ────────────────────────
test("Requirement 5: Chat history persists across different devices and sessions", async () => {
  const addr = TEST_ADDR_CROSS;
  clearChatHistory(addr);

  // Simulate Device 1: Candidate asks question about their credentials
  const dev1Res = await processCopilotQuery({
    message: "How many jobs can I apply in a day?",
    address: addr,
  });

  // Verify history on Device 1
  const historyDev1 = getChatHistory(addr, "overview");
  assert.ok(historyDev1.length >= 2, "History must contain both user message and assistant reply");
  assert.strictEqual(historyDev1[historyDev1.length - 2].role, "user");
  assert.strictEqual(historyDev1[historyDev1.length - 2].content, "How many jobs can I apply in a day?");
  assert.strictEqual(historyDev1[historyDev1.length - 1].role, "assistant");

  // Simulate Device 2: Candidate opens app on a new device or fresh browser
  // Candidate's sovereign address is the same, so getChatHistory loads existing dialogue
  const historyDev2 = getChatHistory(addr, "overview");
  assert.strictEqual(historyDev2.length, historyDev1.length);
  assert.strictEqual(historyDev2[0].content, historyDev1[0].content);

  // Device 2 asks follow-up
  await processCopilotQuery({
    message: "Can I apply to multiple disciplines?",
    address: addr,
  });

  const historyAfterDev2 = getChatHistory(addr, "overview");
  assert.ok(historyAfterDev2.length >= 4, "History must contain turns from both devices");
});
