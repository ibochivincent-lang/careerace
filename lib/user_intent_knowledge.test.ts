import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  classifyUserIntent,
  generateIntentMemoryResponse,
  STREAMLINED_PROMPT_CHIPS,
  FINE_TUNED_QUESTIONS,
  INTENT_TAXONOMY,
} from "./user_intent_knowledge.ts";

describe("User Intent Knowledge Base & Categorization Engine", () => {
  test("loads all 200 fine-tuned training variations and 6 taxonomy categories", () => {
    assert.equal(FINE_TUNED_QUESTIONS.length, 200);
    assert.equal(Object.keys(INTENT_TAXONOMY).length, 6);
    assert.equal(STREAMLINED_PROMPT_CHIPS.length, 8);
  });

  test("accurately classifies exact fine-tuned training questions", () => {
    const q1 = "What is my daily job submission limit?";
    const c1 = classifyUserIntent(q1);
    assert.equal(c1.category, "Application Limits & Daily Goals");
    assert.ok(c1.confidence >= 0.9);

    const q2 = "Can you show me the list of jobs I submitted applications for?";
    const c2 = classifyUserIntent(q2);
    assert.equal(c2.category, "Application Tracker, History & Follow-ups");

    const q3 = "Which job vacancies currently match my skill set?";
    const c3 = classifyUserIntent(q3);
    assert.equal(c3.category, "Personalized Job Discovery & Matching");

    const q4 = "My exact college degree isn't in the dropdown menu - can I still apply?";
    const c4 = classifyUserIntent(q4);
    assert.equal(c4.category, "Academic Eligibility & Unlisted Disciplines");

    const q5 = "Where can I update my work history and CV details?";
    const c5 = classifyUserIntent(q5);
    assert.equal(c5.category, "Profile, CV & Credentials Management");

    const q6 = "How can I improve my profile to get more interview invitations?";
    const c6 = classifyUserIntent(q6);
    assert.equal(c6.category, "Career Feedback & Profile Advisory");
  });

  test("classifies conversational and typed variations via keyword clustering", () => {
    const v1 = classifyUserIntent("How many more applications am I allowed to send before today ends?");
    assert.equal(v1.category, "Application Limits & Daily Goals");

    const v2 = classifyUserIntent("Which companies did I submit to yesterday?");
    assert.equal(v2.category, "Application Tracker, History & Follow-ups");

    const v3 = classifyUserIntent("Find open roles that fit my background");
    assert.equal(v3.category, "Personalized Job Discovery & Matching");

    const v4 = classifyUserIntent("Can candidates with a non traditional degree apply?");
    assert.equal(v4.category, "Academic Eligibility & Unlisted Disciplines");

    const v5 = classifyUserIntent("Show me an overview of my current resume information");
    assert.equal(v5.category, "Profile, CV & Credentials Management");

    const v6 = classifyUserIntent("What feedback do you have on my resume keywords?");
    assert.equal(v6.category, "Career Feedback & Profile Advisory");
  });

  test("generates grounded Walrus memory responses with candidate data", () => {
    const mockProfile = {
      applicant_name: "Ibochi Vincent",
      target_roles: ["Distributed Systems Architect"],
      skills: ["Go", "TypeScript", "Distributed Systems", "PostgreSQL"],
      work_experience: [
        { role: "Senior Engineer", company: "Apex Tech", highlights: ["Scaled core ledger"] }
      ],
      academic_history: [
        { degree: "B.Sc Computer Science", institution: "University of Lagos" }
      ]
    };

    const mockJobs = [
      { jobTitle: "Lead Architect", company: "Paystack", appliedAt: new Date().toISOString(), followUpDaysLeft: 6 }
    ];

    const c1 = classifyUserIntent("How many jobs did I apply today?");
    const r1 = generateIntentMemoryResponse(c1, mockProfile, mockJobs, "How many jobs did I apply today?");
    assert.ok(r1?.includes("Daily Application Limits"));
    assert.ok(r1?.includes("1 / 5"));

    const c2 = classifyUserIntent("Show me my applied jobs");
    const r2 = generateIntentMemoryResponse(c2, mockProfile, mockJobs, "Show me my applied jobs");
    assert.ok(r2?.includes("Paystack"));
    assert.ok(r2?.includes("Lead Architect"));

    const c3 = classifyUserIntent("Show me matching jobs for my profile");
    const r3 = generateIntentMemoryResponse(c3, mockProfile, mockJobs, "Show me matching jobs for my profile");
    assert.ok(r3?.includes("Ibochi Vincent"));
    assert.ok(r3?.includes("Distributed Systems Architect"));
  });
});
