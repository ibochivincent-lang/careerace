import { test } from "node:test";
import assert from "node:assert/strict";
import { processCopilotQuery, parseSpecificDateQuery } from "./copilot_intelligence.ts";

test("Copilot Scenario 1: 'Hello, what jobs can I apply for today?' scans board and shows 10 jobs", async () => {
  const result = await processCopilotQuery({
    message: "Hello, what jobs can I apply for today?",
    address: "0xscenario10000000000000000000000000000000001",
    profile: {
      applicant_name: "Vincent",
      target_roles: ["Senior Software Engineer"],
      skills: ["TypeScript", "Next.js", "PostgreSQL"],
    },
    appliedJobs: [],
  });

  const reply = result.reply || result.content;

  // 1. Must greet the candidate
  assert.match(reply, /Hello Vincent/i);

  // 2. Must state scan through job board phrase
  assert.match(reply, /give me a minute, let me scan through the job board for you to see the best possible jobs to get/i);

  // 3. Must show a list of 10 verified jobs
  assert.match(reply, /1\./);
  assert.match(reply, /10\./);

  // 4. Must provide link to Job Board
  assert.match(reply, /\/job-board/i);
});

test("Copilot Scenario 2: Changing target discipline to Marine updates memory and lists 10 Marine jobs", async () => {
  const result = await processCopilotQuery({
    message: "My target discipline is Marine",
    address: "0xscenario20000000000000000000000000000000002",
    profile: {
      applicant_name: "Vincent",
      target_roles: ["IT Support Specialist"],
    },
    appliedJobs: [],
  });

  const reply = result.reply || result.content;

  // 1. Must confirm update to Marine Engineering & Offshore
  assert.match(reply, /updated your target discipline to \*\*Maritime & Offshore Engineering\*\*/i);

  // 2. Must scan and list 10 Marine jobs
  assert.match(reply, /give me a minute, let me scan through the job board for you to see the best possible jobs to get/i);
  assert.match(reply, /10\./);
  assert.match(reply, /Maersk|American Bureau of Shipping|Chevron Shipping|Subsea 7/i);

  // 3. Must store new target discipline in memory
  assert.ok(result.stored.some((s) => s.toLowerCase().includes("marine")));
});

test("Copilot Scenario 3: Binary 'Yes or no?' question returns direct answer", async () => {
  // Candidate with 0 jobs today
  const noResult = await processCopilotQuery({
    message: "Yes or no?",
    address: "0xscenario30000000000000000000000000000000003",
    appliedJobs: [],
  });
  assert.equal(noResult.reply.trim(), "No.");

  // Candidate with 1 job today
  const yesResult = await processCopilotQuery({
    message: "Yes or no?",
    address: "0xscenario30000000000000000000000000000000003",
    appliedJobs: [
      {
        jobTitle: "Marine Engineer",
        company: "Maersk",
        appliedAt: new Date().toISOString(),
        appliedTimestamp: Date.now(),
      },
    ],
  });
  assert.match(yesResult.reply, /^Yes\./);
});

test("Copilot Scenario 4: 'On the 5th, did I apply for any work?' date-specific scan", async () => {
  const result = await processCopilotQuery({
    message: "On the 5th, did I apply for any work?",
    address: "0xscenario40000000000000000000000000000000004",
    appliedJobs: [],
  });

  const reply = result.reply || result.content;

  // Must report scan result with explicit refusal for 5th of October
  assert.match(reply, /From my scan: No\./i);
  assert.match(reply, /5th of October, 2026/i);
  assert.match(reply, /did not apply for any jobs/i);
});

test("Copilot Scenario 5: 'Daily application limit: How many jobs are available for me to apply?'", async () => {
  const result = await processCopilotQuery({
    message: "Daily application limit: How many jobs are available for me to apply?",
    address: "0xscenario50000000000000000000000000000000005",
    profile: {
      applicant_name: "Vincent",
      target_roles: ["Software Engineer"],
    },
    appliedJobs: [],
  });

  const reply = result.reply || result.content;

  // 1. Must explain pacing & no artificial limit
  assert.match(reply, /as many jobs as possible in a day/i);
  assert.match(reply, /does not place an artificial limit/i);

  // 2. Must scan and list 10 preferred jobs
  assert.match(reply, /10\./);

  // 3. Must link to Job Board
  assert.match(reply, /\/job-board/i);
});

test("Copilot Scenario 6: 'Have I applied to any job today?' with 0 applications", async () => {
  const result = await processCopilotQuery({
    message: "Have I applied to any job today?",
    address: "0xscenario60000000000000000000000000000000006",
    appliedJobs: [],
  });

  const reply = result.reply || result.content;
  assert.match(reply, /From my scan: No\./i);
  assert.match(reply, /Today being the.*2026/i);
  assert.match(reply, /have not applied to any jobs yet/i);
});
