import test from "node:test";
import assert from "node:assert/strict";
import { processCopilotQuery } from "./copilot_intelligence.ts";
import { callFreeLlm } from "./free_llm.ts";

test("Copilot Intelligence: First-Time User Resume Upload Gate", async () => {
  // Candidate with NO uploaded resume asks personal profile question
  const result = await processCopilotQuery({
    message: "Can you read my CV and summarize my skills?",
    profile: null,
    address: "0x1111111111111111111111111111111111111111",
    appliedJobs: [],
  });

  const reply = result.reply || result.content;

  // Must instruct candidate to upload resume in Resume Studio first
  assert.match(reply, /upload.*resume/i);
  assert.match(reply, /Resume Studio/i);
});

test("Copilot Intelligence: 'How many jobs can I apply in a day?' FAQ", async () => {
  const result = await processCopilotQuery({
    message: "How many jobs can I apply in a day?",
    profile: { applicant_name: "Ada Lovelace", skills: ["TypeScript"] },
    address: "0x1111111111111111111111111111111111111111",
    appliedJobs: [],
  });

  const reply = result.reply || result.content;

  // Must explain as many as possible, anti-spam pacing, and 5-day cooldown
  assert.match(reply, /as many.*as possible/i);
  assert.match(reply, /anti-spam/i);
  assert.match(reply, /cooldown/i);
});

test("Copilot Intelligence: 'Can I apply with other disciplines?' FAQ", async () => {
  const result = await processCopilotQuery({
    message: "Can I apply with other disciplines?",
    profile: { applicant_name: "Alan Turing", skills: ["Cryptography"] },
    address: "0x1111111111111111111111111111111111111111",
    appliedJobs: [],
  });

  const reply = result.reply || result.content;

  // Must confirm affirmative and explain multiple specialized CV versions
  assert.match(reply, /yes.*absolutely/i);
  assert.match(reply, /multiple.*versions/i);
  assert.match(reply, /Resume Studio/i);
});

test("Copilot Intelligence: 'My course of study is not here, what can I do?' FAQ", async () => {
  const result = await processCopilotQuery({
    message: "My course of study is not here, what can I do?",
    profile: { applicant_name: "Grace Hopper", skills: ["Compilers"] },
    address: "0x1111111111111111111111111111111111111111",
    appliedJobs: [],
  });

  const reply = result.reply || result.content;

  // Must guide user to hit us up / select closest discipline
  assert.match(reply, /hit us up/i);
  assert.match(reply, /closest discipline/i);
  assert.match(reply, /Academic History/i);
});

test("Copilot Intelligence: 'How many jobs did I apply for yesterday?' with Yesterday's jobs", async () => {
  const now = new Date();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 14, 0, 0);

  const appliedJobs = [
    {
      id: "job-1",
      jobTitle: "Senior Distributed Systems Engineer",
      company: "Mysten Labs",
      appliedAt: yesterday.toLocaleDateString(),
      appliedTimestamp: yesterday.getTime(),
    },
    {
      id: "job-2",
      jobTitle: "Cloud Infrastructure Architect",
      company: "Cloudflare",
      appliedAt: yesterday.toLocaleDateString(),
      appliedTimestamp: yesterday.getTime(),
    },
  ];

  const result = await processCopilotQuery({
    message: "How many jobs did I apply for yesterday?",
    profile: { applicant_name: "Vincent", skills: ["Go", "Rust"] },
    address: "0x1111111111111111111111111111111111111111",
    appliedJobs,
  });

  const reply = result.reply || result.content;

  // Must report exact count (2 jobs) and show names
  assert.match(reply, /From our count, you were able to apply to 2 jobs yesterday/i);
  assert.match(reply, /show you the names of the jobs you applied for/i);
  assert.match(reply, /Mysten Labs/i);
  assert.match(reply, /Cloudflare/i);
});

test("Copilot Intelligence: 'How many jobs did I apply for yesterday?' when 0 jobs yesterday", async () => {
  const result = await processCopilotQuery({
    message: "How many jobs did I apply for yesterday?",
    profile: { applicant_name: "Vincent", skills: ["Go", "Rust"] },
    address: "0x1111111111111111111111111111111111111111",
    appliedJobs: [],
  });

  const reply = result.reply || result.content;

  // Must report 0 jobs yesterday
  assert.match(reply, /From our count, you were able to apply to 0 jobs yesterday/i);
});

test("Copilot Intelligence: 'Show me the names of the jobs I applied for'", async () => {
  const appliedJobs = [
    {
      id: "job-abc",
      jobTitle: "Marine Propulsion Specialist",
      company: "Maersk",
      appliedAt: "Oct 2, 2026",
    },
  ];

  const result = await processCopilotQuery({
    message: "Show me the names of the jobs I applied for",
    profile: { applicant_name: "Captain John", skills: ["STCW"] },
    address: "0x1111111111111111111111111111111111111111",
    appliedJobs,
  });

  const reply = result.reply || result.content;

  assert.match(reply, /Maersk/i);
  assert.match(reply, /Marine Propulsion Specialist/i);
});

test("Multi-Model Engine: Fallover and Rotation Safety", async () => {
  // Test that callFreeLlm completes without uncaught exception even with invalid/offline keys
  const res = await callFreeLlm({
    prompt: "What is my target role?",
    system_prompt: "Candidate Name: Ada\nTarget role: Systems Engineer\nSkills: Rust",
    custom_keys: {
      groq: "invalid_key_for_testing",
      google: "invalid_key_for_testing",
    },
  });

  assert.ok(res && res.length > 0);
  assert.match(res, /Systems Engineer/i);
});
