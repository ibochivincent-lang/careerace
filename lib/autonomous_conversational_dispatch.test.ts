/**
 * Unit Test Suite for Autonomous Conversational Job Application & Batch Dispatch Engine
 *
 * Verifies the 5 core criteria requested by user:
 * 1. User asks: "what jobs can i aplly for today" -> Answers grounded in Walrus memory
 * 2. Multi-CV / Multi-skill candidate detection: Inquires which CV/field (Tech, Marine, Doctor)
 * 3. Preference selection: Synthesizes top matched jobs + tailored sample application email & cover letter
 * 4. Sample test email verification: Dispatches test copy with RFC 5322 audit receipt
 * 5. Autonomous bulk dispatch: Dispatches batch with anti-spam pacing, 5-day cooldowns, and Walrus memory anchoring
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  handleAutonomousConversationalDispatch,
  detectCandidateDisciplines,
  isJobDiscoveryQuery,
  isSampleEmailRequest,
  isBulkDispatchRequest,
  resolveDisciplineChoice,
  DISCIPLINE_TRACKS,
} from "./autonomous_conversational_dispatch.ts";
import { processCopilotQuery } from "./copilot_intelligence.ts";

test("Criterion 1 & 2: Typo job discovery query detects multiple CVs/disciplines (Tech, Marine, Doctor)", async () => {
  const query = "what jobs can i aplly for today"; // typo in "aplly"
  assert.equal(isJobDiscoveryQuery(query), true);

  const candidateProfile = {
    applicant_name: "Captain Alex Rivera",
    target_roles: ["Marine Systems Engineer", "Senior Software Architect"],
    skills: [
      "STCW III/2 Chief Engineer",
      "Marine Propulsion",
      "TypeScript",
      "Cloud Infrastructure",
      "Clinical Informatics",
    ],
    email: "alex.rivera@example.com",
  };

  const walrusVersions = [
    {
      id: "v1",
      role: "Software Architect",
      label: "Software & Cloud Systems CV",
      blobId: "b-tech-001",
    },
    {
      id: "v2",
      role: "Marine Engineer",
      label: "Maritime Offshore CV",
      blobId: "b-marine-002",
    },
  ];

  const tracks = detectCandidateDisciplines(candidateProfile, walrusVersions);
  assert.ok(tracks.length >= 2, "Should detect at least 2 distinct disciplines (Tech and Marine)");
  const trackIds = tracks.map((t) => t.id);
  assert.ok(trackIds.includes("tech"), "Should include Tech track");
  assert.ok(trackIds.includes("marine"), "Should include Marine track");

  // Run through conversational controller
  const result = await handleAutonomousConversationalDispatch({
    latestQuery: query,
    messages: [{ role: "user", content: query }],
    candidateAddress: "0xalex000000000000000000000000000000000001",
    candidateName: "Captain Alex Rivera",
    candidateEmail: "alex.rivera@example.com",
    cvProfile: candidateProfile,
    walrusVersions,
  });

  assert.equal(result.handled, true);
  assert.equal(result.stage, "discipline_selection");
  assert.match(result.reply || "", /Which CV or field would you like to apply with today/i);
  assert.match(result.reply || "", /Tech \/ Software & Cloud/i);
  assert.match(result.reply || "", /Maritime & Offshore Engineering/i);
});

test("Criterion 3: Candidate selects preferred choice ('Marine') -> generates 10 jobs + sample application email & cover letter", async () => {
  const candidateProfile = {
    applicant_name: "Captain Alex Rivera",
    target_roles: ["Marine Systems Engineer"],
    skills: ["STCW III/2 Chief Engineer", "Marine Propulsion", "DP-2 Dynamic Positioning"],
    email: "alex.rivera@example.com",
  };

  const walrusVersions = [
    {
      id: "v2",
      role: "Marine Engineer",
      label: "Maritime Offshore CV",
      blobId: "b-marine-002",
    },
  ];

  const previousAssistantPrompt =
    "According to your history stored in Walrus Sovereign Memory, you have multiple career tracks. Which CV or field would you like to apply with today? 1. Tech, 2. Maritime & Offshore Engineering, 3. Medical";

  const result = await handleAutonomousConversationalDispatch({
    latestQuery: "Marine",
    messages: [
      { role: "user", content: "what jobs can i apply for today" },
      { role: "assistant", content: previousAssistantPrompt },
      { role: "user", content: "Marine" },
    ],
    candidateAddress: "0xalex000000000000000000000000000000000001",
    candidateName: "Captain Alex Rivera",
    candidateEmail: "alex.rivera@example.com",
    cvProfile: candidateProfile,
    walrusVersions,
  });

  assert.equal(result.handled, true);
  assert.equal(result.stage, "sample_preview");
  assert.match(result.reply || "", /Maritime & Offshore Engineering/i);
  assert.match(result.reply || "", /Maersk/i);
  assert.match(result.reply || "", /Sample Application Email & Tailored Cover Letter/i);
  assert.match(result.reply || "", /STCW III\/2 Chief Engineer|Marine Propulsion/i);
  assert.match(result.reply || "", /Would you like me to.*send a sample email.*or.*dispatch the bulk/i);
});

test("Criterion 4: Candidate requests 'send sample email' -> dispatches test email with RFC 5322 audit receipt", async () => {
  const candidateProfile = {
    applicant_name: "Captain Alex Rivera",
    target_roles: ["Marine Systems Engineer"],
    skills: ["STCW III/2 Chief Engineer", "Marine Propulsion"],
    email: "alex.rivera@example.com",
  };

  const previousAssistantPrompt =
    "Would you like me to send a sample email to your address first, or proceed to dispatch the bulk applications directly in Maritime & Offshore Engineering?";

  const result = await handleAutonomousConversationalDispatch({
    latestQuery: "send sample email",
    messages: [
      { role: "assistant", content: previousAssistantPrompt },
      { role: "user", content: "send sample email" },
    ],
    candidateAddress: "0xalex000000000000000000000000000000000001",
    candidateName: "Captain Alex Rivera",
    candidateEmail: "alex.rivera@example.com",
    cvProfile: candidateProfile,
  });

  assert.equal(result.handled, true);
  assert.equal(result.stage, "sample_dispatched");
  assert.match(result.reply || "", /Sample Application Dispatched to Candidate Email/i);
  assert.match(result.reply || "", /alex\.rivera@example\.com/i);
  assert.match(result.reply || "", /RFC 5322 cryptographic audit receipt/i);
  assert.match(result.reply || "", /Dispatch the bulk/i);
});

test("Criterion 5: Candidate confirms 'send dispatch the bulk' -> executes bulk dispatch with cooldown and pacing", async () => {
  const candidateProfile = {
    applicant_name: "Captain Alex Rivera",
    target_roles: ["Marine Systems Engineer"],
    skills: ["STCW III/2 Chief Engineer", "Marine Propulsion"],
    email: "alex.rivera@example.com",
  };

  const previousAssistantPrompt =
    "Would you like to proceed with the bulk dispatch to all 10 verified employers in Maritime & Offshore Engineering now? Reply 'Dispatch the bulk' to start!";

  // Pre-seed an existing application for American Bureau of Shipping (ABS) applied yesterday (within 5-day cooldown)
  const appliedJobs = [
    {
      company: "American Bureau of Shipping (ABS)",
      role: "Class Surveyor",
      appliedTimestamp: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
      status: "Dispatched",
    },
  ];

  const result = await handleAutonomousConversationalDispatch({
    latestQuery: "send dispatch the bulk",
    messages: [
      { role: "assistant", content: previousAssistantPrompt },
      { role: "user", content: "send dispatch the bulk" },
    ],
    candidateAddress: "0xalex000000000000000000000000000000000001",
    candidateName: "Captain Alex Rivera",
    candidateEmail: "alex.rivera@example.com",
    cvProfile: candidateProfile,
    appliedJobs,
  });

  assert.equal(result.handled, true);
  assert.equal(result.stage, "bulk_dispatched");
  assert.ok(result.newAppliedJobs && result.newAppliedJobs.length > 0);
  assert.match(result.reply || "", /Autonomous Bulk Dispatch Complete/i);
  assert.match(result.reply || "", /Dispatched via Sovereign Relay/i);
  assert.match(result.reply || "", /Cooldown Active/i); // ABS cooldown protection
  assert.match(result.reply || "", /Anti-Spam Humanized Pacing/i);
  assert.match(result.reply || "", /7-Day Recruiter Follow-Up Milestone/i);
});

test("End-to-End Integration: processCopilotQuery routes 'what jobs can i aplly for today' through autonomous engine", async () => {
  const res = await processCopilotQuery({
    message: "what jobs can i aplly for today",
    address: "0xe2e0000000000000000000000000000000000001",
    appliedJobs: [],
    profile: {
      applicant_name: "Jordan Lee",
      target_roles: ["Full Stack Engineer"],
      skills: ["React", "TypeScript", "Node.js", "PostgreSQL"],
      email: "jordan.lee@example.com",
    },
  });

  const reply = res.reply || res.content;
  assert.match(reply, /Walrus Sovereign Memory/i);
  assert.match(reply, /verified jobs/i);
  assert.match(reply, /Sample Application Email & Tailored Cover Letter/i);
  assert.match(reply, /send a sample email.*dispatch the bulk/i);
});

test("Criterion 6: Candidate asks 'can you send my documents to them' or 'make application for me as indicated' -> activates Autonomous Application Dispatch Desk with verified employers and credential package", async () => {
  const query = "can you send my documents to them";
  const candidateProfile = {
    applicant_name: "Engineer Taylor Vance",
    target_roles: ["Chief Marine Engineer"],
    skills: ["STCW III/2", "Marine Propulsion", "Dynamic Positioning"],
    email: "taylor.vance@example.com",
  };

  const res = await processCopilotQuery({
    message: query,
    address: "0xtaylor0000000000000000000000000000000001",
    appliedJobs: [],
    profile: candidateProfile,
  });

  const reply = res.reply || res.content;
  assert.match(reply, /Autonomous Application Dispatch Desk/i);
  assert.match(reply, /Target Verified Employers/i);
  assert.match(reply, /Verified Credential Package Ready for Dispatch/i);
  assert.match(reply, /Preview Sample Dispatch/i);
  assert.match(reply, /Send Application Dispatch/i);
});

