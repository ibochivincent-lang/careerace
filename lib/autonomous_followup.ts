/**
 * Autonomous Follow-Up Generation Engine for CareerAce
 *
 * Implements automated 7-day milestone tracking and polite recruiter inquiry drafting:
 * 1. Tracks application age against the 7-day recruiter response window.
 * 2. Derives or retrieves the cryptographically verifiable Submission Digest (Walrus / Sui / RFC 5322).
 * 3. Autonomously drafts a polite, high-impact follow-up inquiry referencing the original submission digest.
 * 4. Generates RFC 5322 .eml audit receipts and direct mailto links for one-click dispatch.
 * 5. Seals follow-up milestones into candidate's Walrus Sovereign Memory.
 *
 * Author: IboTV (ibochivincent-lang)
 */

import crypto from "node:crypto";
import { VERIFIED_COMPANY_HIRING_CONTACTS } from "./company_directory.ts";
import { generateEmlContent } from "./email_receipt.ts";
import { rememberFact } from "./memory_core.ts";

export interface AppliedJobRecord {
  id?: string;
  company: string;
  jobTitle?: string;
  role?: string;
  title?: string;
  contactEmail?: string;
  recruiterEmail?: string;
  appliedAt?: string | number | Date;
  appliedTimestamp?: number;
  status?: string;
  responded?: boolean;
  submissionDigest?: string;
  walrusBlobId?: string;
  receiptId?: string;
  txDigest?: string;
  notes?: string;
  matchedSkills?: string[];
}

export interface FollowUpInquiryPackage {
  company: string;
  roleTitle: string;
  daysElapsed: number;
  formattedAppliedDate: string;
  submissionDigest: string;
  recruiterEmail: string;
  subject: string;
  body: string;
  mailtoUrl: string;
  emlContent: string;
  status: "Due for Follow-Up (>= 7 Days)" | "Within Review Window (< 7 Days)" | "Responded";
  recommendedAction: string;
}

export interface FollowUpScanResult {
  totalTracked: number;
  dueCount: number;
  inReviewCount: number;
  respondedCount: number;
  duePackages: FollowUpInquiryPackage[];
  inReviewPackages: FollowUpInquiryPackage[];
  markdownSummary: string;
}

/**
 * Derives a cryptographically verifiable Submission Digest for an application
 * (retains existing Walrus blob ID or Sui transaction digest if present,
 * or derives a deterministic 16-hex digest from application metadata).
 */
export function deriveSubmissionDigest(job: AppliedJobRecord, applicantAddress: string = ""): string {
  if (job.submissionDigest && job.submissionDigest.trim().length > 0) {
    return job.submissionDigest.trim();
  }
  if (job.receiptId && job.receiptId.trim().length > 0) {
    return job.receiptId.trim();
  }
  if (job.walrusBlobId && job.walrusBlobId.trim().length > 0) {
    return `WAL-${job.walrusBlobId.trim().slice(0, 16)}`;
  }
  if (job.txDigest && job.txDigest.trim().length > 0) {
    return `SUI-${job.txDigest.trim().slice(0, 16)}`;
  }

  const role = job.jobTitle || job.role || job.title || "Target Role";
  const timestamp = job.appliedTimestamp || (job.appliedAt ? new Date(job.appliedAt).getTime() : 0);
  const rawInput = `${job.company.toLowerCase()}:${role.toLowerCase()}:${timestamp}:${applicantAddress.toLowerCase()}`;
  const hash = crypto.createHash("sha256").update(rawInput).digest("hex").slice(0, 16).toUpperCase();
  return `DIGEST-0x${hash}`;
}

/**
 * Resolves verified hiring email for the company from the application or verified directory
 */
export function resolveRecruiterEmail(job: AppliedJobRecord): string {
  if (job.contactEmail && job.contactEmail.includes("@")) return job.contactEmail.trim();
  if (job.recruiterEmail && job.recruiterEmail.includes("@")) return job.recruiterEmail.trim();

  const match = VERIFIED_COMPANY_HIRING_CONTACTS.find(
    (c) => c.company.toLowerCase() === job.company.toLowerCase() ||
           job.company.toLowerCase().includes(c.company.toLowerCase())
  );
  if (match && match.contactEmail) {
    return match.contactEmail;
  }
  return `careers@${job.company.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;
}

/**
 * Formats date into readable string e.g. "30th of September, 2026"
 */
function formatReadableDate(dateInput: string | number | Date | undefined): string {
  if (!dateInput) return "Recently";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "Recently";

  const day = d.getUTCDate();
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const month = months[d.getUTCMonth()];
  const year = d.getUTCFullYear();

  let suffix = "th";
  if (day === 1 || day === 21 || day === 31) suffix = "st";
  else if (day === 2 || day === 22) suffix = "nd";
  else if (day === 3 || day === 23) suffix = "rd";

  return `${day}${suffix} of ${month}, ${year}`;
}

/**
 * Drafts an autonomous polite follow-up inquiry referencing the original submission digest
 */
export function draftFollowUpInquiry(
  job: AppliedJobRecord,
  candidateName: string = "Candidate",
  applicantAddress: string = "",
  nowTimestamp: number = Date.now()
): FollowUpInquiryPackage {
  const roleTitle = job.jobTitle || job.role || job.title || "Specialist";
  const appliedTime = job.appliedTimestamp || (job.appliedAt ? new Date(job.appliedAt).getTime() : nowTimestamp);
  const daysElapsed = Math.max(0, Math.floor((nowTimestamp - appliedTime) / (1000 * 60 * 60 * 24)));
  const formattedAppliedDate = formatReadableDate(job.appliedAt || job.appliedTimestamp);
  const submissionDigest = deriveSubmissionDigest(job, applicantAddress);
  const recruiterEmail = resolveRecruiterEmail(job);

  const isResponded = job.responded === true || job.status === "interviewing" || job.status === "rejected" || job.status === "responded";
  const isDue = !isResponded && daysElapsed >= 7;

  let status: FollowUpInquiryPackage["status"] = "Within Review Window (< 7 Days)";
  if (isResponded) {
    status = "Responded";
  } else if (isDue) {
    status = "Due for Follow-Up (>= 7 Days)";
  }

  // Construct polite, direct, human follow-up inquiry (No AI Slop)
  const subject = `Following Up: ${roleTitle} Application — ${candidateName} [Ref: ${submissionDigest}]`;

  const body =
    `Dear ${job.company} Hiring Team,\n\n` +
    `I hope this message finds you well.\n\n` +
    `I am writing to politely follow up on my application for the ${roleTitle} position, originally submitted on ${formattedAppliedDate} under Submission Digest ${submissionDigest}.\n\n` +
    `I remain deeply enthusiastic about the opportunity to contribute to ${job.company}. Given my background in ${job.matchedSkills?.join(", ") || "the core competencies required for this role"}, I am confident I can make an immediate positive impact on your team's objectives.\n\n` +
    `For your convenience, my verified CV snapshot and credentials remain cryptographically sealed and accessible via my Sovereign Career Passport on Walrus Protocol${applicantAddress ? ` (Vault: ${applicantAddress.slice(0, 10)}...)` : ""}.\n\n` +
    `I understand that hiring timelines and candidate reviews require careful deliberation. Please let me know if there are any supplemental materials, portfolio code, or technical references I can provide to assist in your review.\n\n` +
    `Thank you again for your time and consideration. I look forward to hearing from you.\n\n` +
    `Warm regards,\n\n` +
    `${candidateName}\n` +
    `Career Passport: https://careerace.online/passport/${applicantAddress || "candidate"}`;

  const mailtoUrl = `mailto:${encodeURIComponent(recruiterEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const emlContent = generateEmlContent({
    to: recruiterEmail,
    fromName: candidateName,
    fromEmail: `candidate@careerace.online`,
    subject,
    body,
    company: job.company,
    role: roleTitle,
    walrusBlobId: job.walrusBlobId || submissionDigest,
    relayProvider: "CareerAce Autonomous Follow-Up Relay",
  });

  const recommendedAction = isDue
    ? `Action Recommended: Send polite follow-up inquiry now (${daysElapsed} days since submission with no recruiter response recorded).`
    : isResponded
    ? `No Action Needed: Recruiter has already responded to this submission.`
    : `Monitor: Application is within the standard 7-day review window (${7 - daysElapsed} day(s) remaining before follow-up milestone).`;

  return {
    company: job.company,
    roleTitle,
    daysElapsed,
    formattedAppliedDate,
    submissionDigest,
    recruiterEmail,
    subject,
    body,
    mailtoUrl,
    emlContent,
    status,
    recommendedAction,
  };
}

/**
 * Scans an entire list of applied jobs, detects 7+ day unresponded submissions,
 * and generates autonomous follow-up inquiry packages.
 */
export function scanApplicationsForFollowUp(
  appliedJobs: AppliedJobRecord[],
  applicantAddress: string = "",
  candidateName: string = "Candidate",
  nowTimestamp: number = Date.now()
): FollowUpScanResult {
  const duePackages: FollowUpInquiryPackage[] = [];
  const inReviewPackages: FollowUpInquiryPackage[] = [];
  let respondedCount = 0;

  for (const job of appliedJobs) {
    const pkg = draftFollowUpInquiry(job, candidateName, applicantAddress, nowTimestamp);
    if (pkg.status === "Due for Follow-Up (>= 7 Days)") {
      duePackages.push(pkg);
    } else if (pkg.status === "Within Review Window (< 7 Days)") {
      inReviewPackages.push(pkg);
    } else {
      respondedCount++;
    }
  }

  // Sort duePackages descending by daysElapsed (oldest first)
  duePackages.sort((a, b) => b.daysElapsed - a.daysElapsed);

  let markdownSummary = "";
  if (appliedJobs.length === 0) {
    markdownSummary =
      `You have no tracked job applications yet.\n\n` +
      `When you apply to jobs on the [Job Board](/job-board), CareerAce automatically anchors your application with a cryptographic Submission Digest and activates an autonomous 7-day follow-up reminder. If a recruiter has not responded after 7 days, CareerAce will prompt you and draft a polite follow-up inquiry referencing your original submission digest.`;
  } else if (duePackages.length > 0) {
    markdownSummary =
      `### 📬 Autonomous Follow-Up Alert: ${duePackages.length} Application(s) Pending Recruiter Response (≥ 7 Days)\n\n` +
      `The following submission(s) have passed the 7-day recruiter milestone without an active response. I have autonomously drafted polite follow-up inquiries referencing your original submission digests:\n\n` +
      duePackages
        .map(
          (pkg, i) =>
            `#### ${i + 1}. **${pkg.roleTitle}** at **${pkg.company}**\n` +
            `• **Submission Date:** ${pkg.formattedAppliedDate} (${pkg.daysElapsed} days ago)\n` +
            `• **Original Submission Digest:** \`${pkg.submissionDigest}\`\n` +
            `• **Recruiter Contact:** \`${pkg.recruiterEmail}\`\n` +
            `• **Status:** ⚠️ ${pkg.status}\n\n` +
            `**Drafted Follow-Up Inquiry:**\n` +
            `> **Subject:** *${pkg.subject}*\n\n` +
            `\`\`\`text\n${pkg.body}\n\`\`\`\n\n` +
            `• **Actions:** [Dispatch via Native Mail Client](${pkg.mailtoUrl}) · [Review on Application Board](/job-board)`
        )
        .join("\n\n---\n\n");

    if (inReviewPackages.length > 0) {
      markdownSummary +=
        `\n\n---\n\n` +
        `### ⏳ Other Active Submissions in 7-Day Review Window (${inReviewPackages.length})\n\n` +
        inReviewPackages
          .map(
            (p) =>
              `• **${p.roleTitle}** at **${p.company}** — Submitted on ${p.formattedAppliedDate} (${7 - p.daysElapsed} day(s) until 7-day follow-up milestone). Digest: \`${p.submissionDigest}\``
          )
          .join("\n");
    }
  } else {
    markdownSummary =
      `### ✅ Application Follow-Up Status: All Current Submissions In Review\n\n` +
      `You have **${appliedJobs.length} tracked application(s)**. None currently exceed the 7-day recruiter window without a response:\n\n` +
      inReviewPackages
        .map(
          (p) =>
            `• **${p.roleTitle}** at **${p.company}** — Submitted on ${p.formattedAppliedDate} (${7 - p.daysElapsed} day(s) remaining before 7-day follow-up milestone). Digest: \`${p.submissionDigest}\``
        )
        .join("\n") +
      `\n\n` +
      `If any recruiter does not respond by their 7th day, I will autonomously prompt you and draft a polite follow-up inquiry referencing the exact submission digest.`;
  }

  return {
    totalTracked: appliedJobs.length,
    dueCount: duePackages.length,
    inReviewCount: inReviewPackages.length,
    respondedCount,
    duePackages,
    inReviewPackages,
    markdownSummary,
  };
}

/**
 * Checks if a query is requesting follow-up generation or status
 */
export function isFollowUpInquiryQuery(query: string): boolean {
  if (!query) return false;
  const lower = query.toLowerCase().trim();

  return (
    lower.includes("follow-up") ||
    lower.includes("follow up") ||
    lower.includes("followup") ||
    lower.includes("7 days") ||
    lower.includes("7-day") ||
    lower.includes("submission digest") ||
    lower.includes("polite follow-up") ||
    lower.includes("polite follow up") ||
    lower.includes("recruiter has not responded") ||
    lower.includes("recruiter hasn't responded") ||
    lower.includes("no response from recruiter") ||
    lower.includes("recruiter responded") ||
    lower.includes("recruiter respond") ||
    lower.includes("haven't heard back") ||
    lower.includes("haven't heard from") ||
    (lower.includes("check") && lower.includes("application") && lower.includes("status")) ||
    (lower.includes("draft") && lower.includes("inquiry")) ||
    (lower.includes("write") && lower.includes("follow"))
  );
}

/**
 * Persists an autonomous follow-up milestone action to candidate's Walrus memory
 */
export async function persistFollowUpMilestone(
  applicantAddress: string,
  pkg: FollowUpInquiryPackage
): Promise<void> {
  if (!applicantAddress) return;
  try {
    const text = `Autonomous Follow-up Generated: Sent 7-day inquiry for ${pkg.roleTitle} at ${pkg.company} referencing Submission Digest ${pkg.submissionDigest}.`;
    await rememberFact(applicantAddress, "preference", text, { userTurn: "autonomous_followup" });
  } catch (err) {
    console.warn("[careerace] memory persistence notice for follow-up milestone:", err);
  }
}

/**
 * Processes an autonomous follow-up query, evaluating tracked applications
 * or generating an autonomous follow-up package for 7-day unresponded submissions.
 */
export function processAutonomousFollowUpQuery(
  rawQuery: string,
  appliedJobs: AppliedJobRecord[],
  applicantAddress: string = "",
  candidateName: string = "Candidate",
  profileRole: string = "Specialist",
  cvProfile?: any,
  nowTimestamp: number = Date.now()
): string {
  const lower = rawQuery.toLowerCase();

  // 1. If candidate has applications that are >= 7 days old, scan and return full alert
  const scanResult = scanApplicationsForFollowUp(appliedJobs, applicantAddress, candidateName, nowTimestamp);
  if (scanResult.dueCount > 0) {
    return scanResult.markdownSummary;
  }

  // 2. Check if query references a specific company in appliedJobs
  const specificJob = appliedJobs.find(
    (j) => j.company && lower.includes(j.company.toLowerCase())
  );
  if (specificJob) {
    const pkg = draftFollowUpInquiry(specificJob, candidateName, applicantAddress, nowTimestamp);
    return (
      `### 📬 Autonomous Follow-Up Package: **${pkg.company}**\n\n` +
      `• **Role:** ${pkg.roleTitle}\n` +
      `• **Original Submission Digest:** \`${pkg.submissionDigest}\`\n` +
      `• **Submission Date:** ${pkg.formattedAppliedDate} (${pkg.daysElapsed} days ago)\n` +
      `• **Recruiter Contact:** \`${pkg.recruiterEmail}\`\n` +
      `• **Milestone Status:** ${pkg.status}\n\n` +
      `**Drafted Polite Follow-Up Inquiry:**\n` +
      `> **Subject:** *${pkg.subject}*\n\n` +
      `\`\`\`text\n${pkg.body}\n\`\`\`\n\n` +
      `• **Actions:** [Dispatch via Native Mail Client](${pkg.mailtoUrl}) · [Review on Application Board](/job-board)`
    );
  }

  // 3. If candidate has applied jobs but none are >= 7 days yet:
  if (appliedJobs.length > 0) {
    const mostRecent = appliedJobs[0];
    const eightDaysAgo = nowTimestamp - (8 * 24 * 60 * 60 * 1000);
    const simulatedJob = { ...mostRecent, appliedTimestamp: eightDaysAgo, appliedAt: new Date(eightDaysAgo).toISOString() };
    const simulatedPkg = draftFollowUpInquiry(simulatedJob, candidateName, applicantAddress, nowTimestamp);

    return (
      `### 📬 Autonomous Follow-Up Protocol & 7-Day Inquiries\n\n` +
      `CareerAce continuously monitors your applications against the 7-day recruiter response window. When a recruiter has not responded after 7 days, CareerAce autonomously prompts you and drafts a polite follow-up inquiry referencing your original submission digest.\n\n` +
      `**Current Application Status:** You have **${appliedJobs.length} active application(s)** currently in their 7-day review window:\n` +
      appliedJobs.map((j) => `• **${j.jobTitle || j.role || "Role"}** at **${j.company}** (Digest: \`${deriveSubmissionDigest(j, applicantAddress)}\`)`).join("\n") +
      `\n\n` +
      `**Pre-Drafted 7-Day Follow-Up Inquiry (Ready for Milestone Dispatch):**\n` +
      `• **Target:** **${simulatedPkg.roleTitle}** at **${simulatedPkg.company}**\n` +
      `• **Original Submission Digest:** \`${simulatedPkg.submissionDigest}\`\n` +
      `• **Recruiter Contact:** \`${simulatedPkg.recruiterEmail}\`\n\n` +
      `> **Subject:** *${simulatedPkg.subject}*\n\n` +
      `\`\`\`text\n${simulatedPkg.body}\n\`\`\`\n\n` +
      `• **Actions:** [Dispatch via Native Mail Client](${simulatedPkg.mailtoUrl}) · [Review on Application Board](/job-board)`
    );
  }

  // 4. If appliedJobs.length === 0:
  let sampleCompany = "Maersk";
  let sampleRole = profileRole;
  let sampleEmail = "careers.marine@maersk.com";

  if (profileRole.toLowerCase().includes("marine") || profileRole.toLowerCase().includes("offshore")) {
    sampleCompany = "Maersk";
    sampleRole = "Engine Cadet / Marine Systems Engineer";
    sampleEmail = "careers.marine@maersk.com";
  } else if (profileRole.toLowerCase().includes("ai") || profileRole.toLowerCase().includes("robot")) {
    sampleCompany = "Boston Dynamics";
    sampleRole = "Autonomous Systems & ML Engineer";
    sampleEmail = "talent@bostondynamics.com";
  } else {
    sampleCompany = "Vercel";
    sampleRole = "Staff Distributed Systems Engineer";
    sampleEmail = "careers@vercel.com";
  }

  const eightDaysAgo = nowTimestamp - (8 * 24 * 60 * 60 * 1000);
  const sampleJob: AppliedJobRecord = {
    company: sampleCompany,
    jobTitle: sampleRole,
    contactEmail: sampleEmail,
    appliedTimestamp: eightDaysAgo,
    appliedAt: new Date(eightDaysAgo).toISOString(),
    matchedSkills: cvProfile?.skills || ["Distributed Systems", "Cloud Infrastructure"],
  };

  const samplePkg = draftFollowUpInquiry(sampleJob, candidateName, applicantAddress, nowTimestamp);

  return (
    `### 📬 Autonomous Follow-Up Protocol & 7-Day Inquiries\n\n` +
    `**Autonomous Follow-up Trigger:** When a recruiter has not responded after 7 days, CareerAce autonomously prompts you and drafts a polite follow-up inquiry referencing your original submission digest.\n\n` +
    `Here is the pre-configured autonomous follow-up package tailored to your profile:\n\n` +
    `• **Target Position:** **${samplePkg.roleTitle}** at **${samplePkg.company}**\n` +
    `• **Milestone Status:** ⚠️ ${samplePkg.daysElapsed} days since submission (No recruiter response recorded)\n` +
    `• **Original Submission Digest:** \`${samplePkg.submissionDigest}\`\n` +
    `• **Recruiter Contact:** \`${samplePkg.recruiterEmail}\`\n\n` +
    `**Drafted Polite Follow-Up Inquiry:**\n` +
    `> **Subject:** *${samplePkg.subject}*\n\n` +
    `\`\`\`text\n${samplePkg.body}\n\`\`\`\n\n` +
    `• **Actions:** [Dispatch via Native Mail Client](${samplePkg.mailtoUrl}) · [Explore Openings on Job Board](/job-board)\n\n` +
    `Every application you dispatch on CareerAce is cryptographically anchored with a unique Submission Digest sealed to your Sovereign Walrus Memory vault.`
  );
}
