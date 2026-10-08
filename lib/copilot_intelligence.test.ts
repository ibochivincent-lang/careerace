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

test("Copilot Intelligence: 'I don't have a CV' triggers Guided CV Builder interview", async () => {
  const result = await processCopilotQuery({
    message: "I don't have a CV, can you help me create one?",
    address: "0xbuilder_query_test_0001",
    profile: null,
  });

  const reply = result.reply || result.content;
  assert.match(reply, /Career Ace Sovereign CV Builder/i);
  assert.match(reply, /Step 1 of 10/i);
  assert.match(reply, /Full legal or professional name/i);
});

test("Copilot Intelligence: 'What is the career pathway for software engineering?' query", async () => {
  const result = await processCopilotQuery({
    message: "What is the career pathway for software engineering?",
    address: "0xpathway_test_0002",
    profile: { applicant_name: "Devon", target_roles: ["Software Engineer"] },
  });

  const reply = result.reply || result.content;
  assert.match(reply, /Software Engineering/i);
  assert.match(reply, /Junior Software Engineer/i);
  assert.match(reply, /Senior Software Engineer/i);
  assert.match(reply, /Staff \/ Principal/i);
});

test("Copilot Intelligence: 'What skills am I missing for Senior Software Engineer?' skill gap query", async () => {
  const result = await processCopilotQuery({
    message: "What skills am I missing for Senior Software Engineer?",
    address: "0xgap_test_0003",
    profile: {
      applicant_name: "Jordan",
      target_roles: ["Senior Software Engineer"],
      skills: ["JavaScript", "HTML", "CSS"],
    },
  });

  const reply = result.reply || result.content;
  assert.match(reply, /Skill Gap Analysis/i);
  assert.match(reply, /Missing Skills/i);
});

test("Copilot Intelligence: 'Recalibrate my CV' conversational ATS optimization", async () => {
  const result = await processCopilotQuery({
    message: "Recalibrate my CV for Staff Cloud Engineer",
    address: "0xrecal_test_0004",
    profile: {
      applicant_name: "Morgan",
      target_roles: ["Staff Cloud Engineer"],
      skills: ["Kubernetes", "AWS", "Terraform"],
      work_experience: [
        {
          company: "Cloud Corp",
          role: "Cloud Engineer",
          duration: "2022 - Present",
          highlights: ["Maintained AWS infrastructure and deployment scripts."],
        },
      ],
    },
  });

  const reply = result.reply || result.content;
  assert.match(reply, /Successfully Recalibrated/i);
  assert.match(reply, /ATS Score/i);
  assert.ok(result.profile);
  assert.ok(result.extracted_profile);
});

