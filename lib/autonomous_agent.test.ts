import test from "node:test";
import assert from "node:assert";
import { isAutonomousGoalQuery, executeAutonomousGoal } from "./autonomous_agent.ts";
import { processCopilotQuery } from "./copilot_intelligence.ts";

test("Autonomous Agent: Goal detection distinguishes compound goals from simple chat queries", () => {
  // Positive matches (The strongest autonomy test prompt and variations)
  assert.strictEqual(
    isAutonomousGoalQuery("Find 20 suitable remote jobs for me, filter them according to my requirements, organize the results, and prepare them for application."),
    true
  );
  assert.strictEqual(
    isAutonomousGoalQuery("find 20 suitable remote jobs for me, filter them according to my requirements, organize the results, and prepare them for application"),
    true
  );
  assert.strictEqual(
    isAutonomousGoalQuery("Find 15 remote jobs for me, filter and organize them, and prepare them for application"),
    true
  );
  assert.strictEqual(
    isAutonomousGoalQuery("Find 25 suitable remote jobs for me, filter them according to my requirements, organize the results, and prepare for application"),
    true
  );
  assert.strictEqual(
    isAutonomousGoalQuery("Execute autonomous job search for 20 remote jobs and prepare them for application"),
    true
  );

  // Negative matches (standard chatbot inquiries should not trigger the heavy autonomous campaign)
  assert.strictEqual(isAutonomousGoalQuery("Hello, what jobs can I apply for today?"), false);
  assert.strictEqual(isAutonomousGoalQuery("Yes or no?"), false);
  assert.strictEqual(isAutonomousGoalQuery("On the 5th, did I apply for any work?"), false);
  assert.strictEqual(isAutonomousGoalQuery("What course did I study?"), false);
  assert.strictEqual(isAutonomousGoalQuery("How many jobs are available for me to apply?"), false);
  assert.strictEqual(isAutonomousGoalQuery("Change my target discipline to Marine"), false);
});

test("Autonomous Agent: Executes 7-step loop (Goal -> Plan -> Decide -> Act -> Observe -> Adapt -> Complete)", async () => {
  const result = await executeAutonomousGoal({
    goalText: "Find 20 suitable remote jobs for me, filter them according to my requirements, organize the results, and prepare them for application.",
    candidateAddress: "0xautonomytest111111111111111111111111111111111",
    candidateName: "Alex Rivera",
    targetDiscipline: "Software & Cloud Systems",
    candidateSkills: ["TypeScript", "Distributed Systems", "Cloud Infrastructure", "API Architecture"],
  });

  // 1. Goal Understanding
  assert.strictEqual(result.isAutonomousGoal, true);
  assert.strictEqual(result.targetCount, 20);
  assert.strictEqual(result.locationConstraint, "remote");

  // 2. Planning (Explicit breakdown into steps)
  assert.strictEqual(result.plan.length, 6);
  assert.ok(result.plan.every((s) => s.status === "Completed"));

  // 3. Independent Decision & Action: Exactly 20 real jobs prepared with zero mock data
  assert.strictEqual(result.applications.length, 20);
  for (const app of result.applications) {
    assert.ok(app.company.length > 0, "Company name must not be empty");
    assert.ok(app.roleTitle.length > 0, "Role title must not be empty");
    assert.ok(app.contactEmail.includes("@"), "Verified email contact must contain @");
    assert.ok(app.careersUrl.startsWith("http"), "Careers URL must be valid HTTP link");
    assert.ok(app.matchScore >= 70 && app.matchScore <= 98, "Match score must be between 70 and 98");
    assert.ok(app.emailSubject.includes("Application:"), "Generated subject must be present");
    assert.ok(app.emailPitch.length > 20, "Generated pitch must be present");
  }

  // 4. Organization: Tiered breakdown
  const tiers = new Set(result.applications.map((a) => a.tier));
  assert.ok(tiers.size >= 2, "Applications must be organized into multiple distinct tiers");

  // 5. Anti-Spam Pacing: 5 immediate, remaining queued
  const immediate = result.applications.filter((a) => a.dispatchPacing.includes("Batch 1"));
  assert.strictEqual(immediate.length, 5, "Batch 1 must contain exactly 5 immediate applications");

  const queued = result.applications.filter((a) => !a.dispatchPacing.includes("Batch 1"));
  assert.strictEqual(queued.length, 15, "Remaining 15 must be queued for subsequent days");

  // 6. Observation & Memory Audit
  assert.strictEqual(result.observationAudit.totalPrepared, 20);
  assert.ok(result.observationAudit.verifiedContactsCount >= 20);
  assert.ok(result.memoryUpdates.length >= 2, "Must seal active goal and campaign plan to Walrus memory");

  // 7. Executive Markdown Report
  assert.ok(result.markdownReport.includes("Autonomous Execution Plan"), "Report must include plan");
  assert.ok(result.markdownReport.includes("Tier 1: Direct Core Matches"), "Report must include Tier 1");
  assert.ok(result.markdownReport.includes("/job-board"), "Report must link to /job-board");
});

test("Autonomous Agent: End-to-end integration via processCopilotQuery", async () => {
  const copilotResponse = await processCopilotQuery({
    message: "Find 20 suitable remote jobs for me, filter them according to my requirements, organize the results, and prepare them for application.",
    address: "0xautonomytest222222222222222222222222222222222",
    profile: {
      applicant_name: "Sarah Chen",
      target_roles: ["AI & Autonomous Systems Engineer"],
      skills: ["Python", "Machine Learning", "Autonomous Navigation", "ROS2", "Robotics"],
    },
  });

  assert.strictEqual(copilotResponse.role, "assistant");
  assert.ok(copilotResponse.reply.includes("I have completed your autonomous goal:"));
  assert.ok(copilotResponse.reply.includes("20 Filtered & Organized Openings"));
  assert.ok(copilotResponse.reply.includes("Autonomous Execution Plan"));
  assert.ok(copilotResponse.reply.includes("Batch 1 (Today)"));
  assert.ok(copilotResponse.reply.includes("/job-board"));
});
