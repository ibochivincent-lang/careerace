import test from "node:test";
import assert from "node:assert";
import {
  deriveSubmissionDigest,
  resolveRecruiterEmail,
  draftFollowUpInquiry,
  scanApplicationsForFollowUp,
  isFollowUpInquiryQuery,
  processAutonomousFollowUpQuery,
} from "./autonomous_followup.ts";
import { processCopilotQuery } from "./copilot_intelligence.ts";

test("Autonomous Follow-Up: deriveSubmissionDigest derives deterministic digests and preserves Walrus/Sui IDs", () => {
  // Existing submission digest
  assert.strictEqual(
    deriveSubmissionDigest({ company: "Maersk", submissionDigest: "CUSTOM-DIGEST-1234" }),
    "CUSTOM-DIGEST-1234"
  );

  // Walrus blob ID preservation
  assert.strictEqual(
    deriveSubmissionDigest({ company: "Maersk", walrusBlobId: "0xwalrusblobid1234567890abcdef" }),
    "WAL-0xwalrusblobid12"
  );

  // Sui transaction digest preservation
  assert.strictEqual(
    deriveSubmissionDigest({ company: "Maersk", txDigest: "5k3H6xL7zPq9yR2wT4mN8vC1bX0" }),
    "SUI-5k3H6xL7zPq9yR2w"
  );

  // Deterministic digest derivation for untagged applications
  const derived1 = deriveSubmissionDigest(
    { company: "Maersk", jobTitle: "Engine Cadet", appliedTimestamp: 1728000000000 },
    "0xuseraddress123"
  );
  const derived2 = deriveSubmissionDigest(
    { company: "Maersk", jobTitle: "Engine Cadet", appliedTimestamp: 1728000000000 },
    "0xuseraddress123"
  );
  assert.ok(derived1.startsWith("DIGEST-0x"));
  assert.strictEqual(derived1, derived2, "Derived digests must be deterministic");
});

test("Autonomous Follow-Up: resolveRecruiterEmail maps real verified contacts", () => {
  // Direct email provided
  assert.strictEqual(
    resolveRecruiterEmail({ company: "Custom Org", contactEmail: "lead@custom.com" }),
    "lead@custom.com"
  );

  // Directory resolution
  const maerskEmail = resolveRecruiterEmail({ company: "Maersk" });
  assert.strictEqual(maerskEmail, "careers.marine@maersk.com");

  const stripeEmail = resolveRecruiterEmail({ company: "Stripe" });
  assert.strictEqual(stripeEmail, "recruiting@stripe.com");
});

test("Autonomous Follow-Up: Drafts polite inquiry referencing original submission digest after 7 days", () => {
  const now = Date.now();
  const nineDaysAgo = now - (9 * 24 * 60 * 60 * 1000);

  const pkg = draftFollowUpInquiry(
    {
      company: "Maersk",
      jobTitle: "Engine Cadet / Marine Systems Engineer",
      appliedTimestamp: nineDaysAgo,
      appliedAt: new Date(nineDaysAgo).toISOString(),
      matchedSkills: ["STCW-95", "Marine Propulsion Systems", "Diesel Engines"],
    },
    "Alex Rivera",
    "0xcandidate111111111111111111111111111111111",
    now
  );

  // Status must be due for follow-up
  assert.strictEqual(pkg.status, "Due for Follow-Up (>= 7 Days)");
  assert.strictEqual(pkg.daysElapsed, 9);
  assert.ok(pkg.submissionDigest.length > 5);

  // Recruiter contact must be real
  assert.strictEqual(pkg.recruiterEmail, "careers.marine@maersk.com");

  // Subject line must reference role, candidate, and submission digest
  assert.ok(pkg.subject.includes("Following Up:"));
  assert.ok(pkg.subject.includes("Engine Cadet"));
  assert.ok(pkg.subject.includes("Alex Rivera"));
  assert.ok(pkg.subject.includes(pkg.submissionDigest));

  // Body must be polite and reference original submission digest
  assert.ok(pkg.body.includes("Dear Maersk Hiring Team,"));
  assert.ok(pkg.body.includes(pkg.submissionDigest), "Body must reference the original submission digest");
  assert.ok(pkg.body.includes("politely follow up on my application"));
  assert.ok(pkg.body.includes("STCW-95"));
  assert.ok(pkg.body.includes("Walrus Protocol"));
  assert.ok(pkg.body.includes("Alex Rivera"));

  // Eml content and mailto link
  assert.ok(pkg.mailtoUrl.startsWith("mailto:careers.marine%40maersk.com"));
  assert.ok(pkg.emlContent.includes("Subject: Following Up:"));
});

test("Autonomous Follow-Up: Within 7-day review window, marked as active review", () => {
  const now = Date.now();
  const twoDaysAgo = now - (2 * 24 * 60 * 60 * 1000);

  const pkg = draftFollowUpInquiry(
    {
      company: "Stripe",
      jobTitle: "Payment Infrastructure Engineer",
      appliedTimestamp: twoDaysAgo,
    },
    "Sarah Chen",
    "0xcandidate222222222222222222222222222222222",
    now
  );

  assert.strictEqual(pkg.status, "Within Review Window (< 7 Days)");
  assert.strictEqual(pkg.daysElapsed, 2);
  assert.ok(pkg.recommendedAction.includes("5 day(s) remaining"));
});

test("Autonomous Follow-Up: scanApplicationsForFollowUp categorizes pipeline and produces summary", () => {
  const now = Date.now();
  const tenDaysAgo = now - (10 * 24 * 60 * 60 * 1000);
  const oneDayAgo = now - (1 * 24 * 60 * 60 * 1000);

  const result = scanApplicationsForFollowUp(
    [
      {
        company: "Maersk",
        jobTitle: "Engine Cadet",
        appliedTimestamp: tenDaysAgo,
      },
      {
        company: "Stripe",
        jobTitle: "Payment Infrastructure Engineer",
        appliedTimestamp: oneDayAgo,
      },
    ],
    "0xcandidate111111111111111111111111111111111",
    "Alex Rivera",
    now
  );

  assert.strictEqual(result.totalTracked, 2);
  assert.strictEqual(result.dueCount, 1);
  assert.strictEqual(result.inReviewCount, 1);

  // Markdown summary must display the alert for the 10-day old application
  assert.ok(result.markdownSummary.includes("Autonomous Follow-Up Alert"));
  assert.ok(result.markdownSummary.includes("Maersk"));
  assert.ok(result.markdownSummary.includes("Original Submission Digest:"));
});

test("Autonomous Follow-Up: Query detection and prompt processing", () => {
  assert.strictEqual(
    isFollowUpInquiryQuery("Autonomous Follow-up Generation: If a recruiter has not responded after 7 days, prompt the agent to draft a polite follow-up inquiry referencing the original submission digest."),
    true
  );
  assert.strictEqual(isFollowUpInquiryQuery("Draft a follow up email for my application"), true);
  assert.strictEqual(isFollowUpInquiryQuery("Check my 7-day follow-up status"), true);
  assert.strictEqual(isFollowUpInquiryQuery("Has recruiter responded to my application?"), true);

  // Non follow-up query
  assert.strictEqual(isFollowUpInquiryQuery("What jobs can I apply for today?"), false);
  assert.strictEqual(isFollowUpInquiryQuery("Yes or no?"), false);
});

test("Autonomous Follow-Up: End-to-end integration via processCopilotQuery", async () => {
  const response = await processCopilotQuery({
    message: "Autonomous Follow-up Generation: If a recruiter has not responded after 7 days, prompt the agent to draft a polite follow-up inquiry referencing the original submission digest.",
    address: "0xfollowuptest333333333333333333333333333333333",
    profile: {
      applicant_name: "Vincent Ibochi",
      target_roles: ["Marine Engineering & Offshore Systems"],
      skills: ["Marine Propulsion", "STCW-95", "Diesel Engines"],
    },
    appliedJobs: [
      {
        company: "Maersk",
        jobTitle: "Engine Cadet / Marine Systems Engineer",
        appliedTimestamp: Date.now() - (8 * 24 * 60 * 60 * 1000), // 8 days ago
        submissionDigest: "WAL-BLOB-MAERSK-0X9A4F",
      },
    ],
  });

  assert.strictEqual(response.role, "assistant");
  assert.ok(response.reply.includes("Autonomous Follow-Up Alert"));
  assert.ok(response.reply.includes("Maersk"));
  assert.ok(response.reply.includes("WAL-BLOB-MAERSK-0X9A4F"), "Must reference the original submission digest");
  assert.ok(response.reply.includes("Drafted Follow-Up Inquiry:"));
  assert.ok(response.reply.includes("Following Up:"));
  assert.ok(response.reply.includes("careers.marine@maersk.com"));
});
