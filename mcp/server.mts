#!/usr/bin/env node
/**
 * Career Ace — Sovereign MCP Server.
 *
 * Exposes a candidate's sovereign Career Vault, CV tailor, job evaluation engine,
 * application router, and STAR+R interview coach memory to any MCP-speaking agent
 * (Claude Code, Cursor, Codex, terminal agents) through the SAME decentralized contract
 * the web app uses.
 *
 * All credentials and memories live on Walrus, owned by the candidate's own Sui address.
 *
 * Required environment variables:
 *   EA_OWNER_ADDRESS     whose career vault this server speaks for
 *   MEMWAL_PRIVATE_KEY   delegate key (server-side only)
 *   MEMWAL_ACCOUNT_ID    the candidate's Walrus Memory account
 *   MEMWAL_SERVER_URL    relayer (defaults to staging)
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
  recallProfile,
  recallFeedback,
  rememberFact,
  forgetFact,
  resolveConflicts,
  claimsOfKind,
  isOffTheRecord,
  CAREER_QUERY,
  COACHING_QUERY,
} from "../lib/memory_core.ts";
import { screenQuestion, buildTeachingConstraintsText, MISCONCEPTIONS } from "../lib/pedagogy.ts";
import { profileNs, feedbackNs } from "../lib/namespaces.ts";
import { parseCvText } from "../lib/cv_parser.ts";
import { harvestJobsFromSources } from "../lib/job_harvester.ts";
import { normalizeAndDeduplicateJobs } from "../lib/job_normaliser.ts";
import { filterJobs } from "../lib/job_filter.ts";
import { evaluateJobFit } from "../lib/job_evaluator.ts";
import { generateTailoredCvAndCoverLetter } from "../lib/resume_tailor.ts";
import { routeApplication } from "../lib/application_router.ts";
import { syncApplicationToNotion } from "../lib/notion_sync.ts";
import { uploadEncryptedResumeToWalrus } from "../lib/walrus_storage.ts";

const OWNER = process.env.EA_OWNER_ADDRESS;
if (!OWNER) {
  console.error("EA_OWNER_ADDRESS is required — the Sui address whose career vault this server speaks for.");
  process.exit(1);
}
const owner: string = OWNER;

const text = (s: string) => ({ content: [{ type: "text" as const, text: s }] });
const fail = (s: string) => ({ content: [{ type: "text" as const, text: s }], isError: true });

/** Stored lines look like `2026-10-01 | skill | Skill: TypeScript and Next.js`. */
function render(facts: { text: string; distance: number }[]) {
  return facts.map((f) => `${f.text}   (distance ${f.distance.toFixed(3)})`).join("\n");
}

async function profile() {
  const career = resolveConflicts(await recallProfile(owner, CAREER_QUERY)).active;
  const coaching = resolveConflicts(await recallFeedback(owner, COACHING_QUERY)).active;
  return {
    skills: claimsOfKind(career, "skill"),
    target_roles: claimsOfKind(career, "target_role"),
    experience: claimsOfKind(career, "experience"),
    education: claimsOfKind(career, "education"),
    tailored_cv: claimsOfKind(career, "tailored_cv"),
    applications: claimsOfKind(coaching, "application"),
    interview_feedback: claimsOfKind(coaching, "interview_feedback"),
    preferences: claimsOfKind(coaching, "preference"),
    // legacy support
    goal: claimsOfKind(career, "goal"),
    misconceptions: claimsOfKind(career, "misconception"),
    weaknesses: claimsOfKind(career, "weakness"),
    mastery: claimsOfKind(career, "mastery"),
    errorPatterns: claimsOfKind(coaching, "error_pattern"),
    active: [...career, ...coaching],
  };
}

const server = new McpServer(
  { name: "careerace", version: "0.2.0" },
  { capabilities: { tools: {}, resources: {} } },
);

/**
 * Tool: recall_memory
 * Recalls candidate credentials and coaching records by vector meaning.
 */
server.registerTool(
  "recall_memory",
  {
    title: "Recall Sovereign Career Memory",
    description:
      "Search this candidate's sovereign Career Vault by semantic similarity. Returns dated facts — " +
      "target roles, verified technical skills, work accomplishments, tailored CV versions, and " +
      "STAR+R interview coach assessments. Results are relevance-filtered and conflict-resolved.",
    inputSchema: {
      query: z.string().describe("What you want to know about the candidate, e.g. 'what is their experience with distributed systems and Sui?'"),
      scope: z.enum(["profile", "feedback", "both"]).default("both")
        .describe("profile = skills, target role, experience, education; feedback = interview coaching, applications, preferences"),
    },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  async ({ query, scope }) => {
    try {
      const want = scope ?? "both";
      const [p, f] = await Promise.all([
        want === "feedback" ? [] : recallProfile(owner, query),
        want === "profile" ? [] : recallFeedback(owner, query),
      ]);
      const active = [...resolveConflicts(p).active, ...resolveConflicts(f).active];
      if (!active.length) {
        return text("No relevant memory found in Career Vault.");
      }
      return text(`${active.length} fact(s) recalled for ${owner}:\n\n${render(active)}`);
    } catch (e) {
      return fail(`Recall failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  },
);

/**
 * Tool: recall_career_vault_tool (dedicated alias)
 */
server.registerTool(
  "recall_career_vault_tool",
  {
    title: "Recall Sovereign Career Vault",
    description: "Search candidate career credentials, skills, work history, and STAR+R coaching notes in Walrus Memory.",
    inputSchema: {
      query: z.string().describe("Query keyword or natural language query, e.g. 'skills and target roles'"),
      scope: z.enum(["profile", "feedback", "both"]).default("both"),
    },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  async ({ query, scope }) => {
    try {
      const want = scope ?? "both";
      const [p, f] = await Promise.all([
        want === "feedback" ? [] : recallProfile(owner, query),
        want === "profile" ? [] : recallFeedback(owner, query),
      ]);
      const active = [...resolveConflicts(p).active, ...resolveConflicts(f).active];
      if (!active.length) {
        return text(`No relevant career credentials found for "${query}".`);
      }
      return text(`${active.length} fact(s) recalled from Walrus for ${owner}:\n\n${render(active)}`);
    } catch (e) {
      return fail(`Career vault recall failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  },
);

/**
 * Tool: remember_fact
 */
server.registerTool(
  "remember_fact",
  {
    title: "Remember a Career Fact",
    description:
      "Store a durable credential or coaching fact about this candidate into Walrus Memory. " +
      "Write ONLY: experience, education, skill, target_role, tailored_cv, application, interview_feedback, " +
      "or preference. Writes reconcile automatically with deterministic deduplication.",
    inputSchema: {
      kind: z.enum([
        "experience",
        "education",
        "skill",
        "target_role",
        "tailored_cv",
        "application",
        "interview_feedback",
        "preference",
        "clearance",
        "misconception",
        "mastery",
        "weakness",
        "goal",
        "error_pattern",
      ]),
      fact: z.string().describe("The fact in plain words, third person, no date."),
      user_turn: z.string().optional().describe("User input used to respect off-the-record directives."),
    },
    annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async ({ kind, fact, user_turn }) => {
    try {
      if (user_turn && isOffTheRecord(user_turn)) {
        return text("Not stored — candidate requested this stay off the record.");
      }
      const r = await rememberFact(owner, kind, fact, { userTurn: user_turn });
      if (r.status === "skipped") {
        return text(
          r.reason === "duplicate"
            ? `Already known, nothing written:\n${r.existing}`
            : "Not stored — candidate requested this stay off the record.",
        );
      }
      return text(
        `Stored in ${r.namespace}:\n${r.text}` +
        (r.supersedes ? `\n\nThis supersedes:\n${r.supersedes}` : ""),
      );
    } catch (e) {
      return fail(`Write failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  },
);

/**
 * Tool: upload_resume_tool
 */
server.registerTool(
  "upload_resume_tool",
  {
    title: "Upload & Encrypt Candidate Resume to Walrus",
    description:
      "Parses candidate CV text, encrypts document using AES-256-GCM, stores to Walrus decentralized storage, " +
      "and indexes verified skills, target roles, and work experience into Walrus Memory.",
    inputSchema: {
      cv_text: z.string().describe("Plain text content of the candidate CV or resume"),
      file_name: z.string().optional().default("candidate_resume.txt").describe("File name"),
    },
    annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async ({ cv_text, file_name }) => {
    try {
      const parsed = parseCvText(cv_text);
      const buffer = Buffer.from(cv_text, "utf-8");
      const docName = file_name || "candidate_resume.txt";
      const walrusResult = await uploadEncryptedResumeToWalrus(buffer, owner, docName);

      await rememberFact(
        owner,
        "tailored_cv",
        `Walrus Encrypted Resume: ${docName} | blobId: ${walrusResult.blobId} | digest: ${walrusResult.sha256Digest.slice(0, 16)}`
      ).catch(() => {});

      let indexedSkills = 0;
      if (parsed.skills?.length) {
        for (const s of parsed.skills.slice(0, 5)) {
          await rememberFact(owner, "skill", `Skill: ${s}`).catch(() => {});
          indexedSkills++;
        }
      }
      if (parsed.target_roles?.length) {
        for (const r of parsed.target_roles.slice(0, 2)) {
          await rememberFact(owner, "target_role", `Target role: ${r}`).catch(() => {});
        }
      }

      return text(
        `Resume encrypted and stored on Walrus.\n` +
        `Blob ID: ${walrusResult.blobId}\n` +
        `Walrus Aggregator URL: ${walrusResult.walrusUrl}\n` +
        `Applicant: ${parsed.applicant_name || "Candidate"}\n` +
        `Indexed Skills Count: ${indexedSkills}\n` +
        `Target Roles: ${(parsed.target_roles || []).join(", ") || "General"}`
      );
    } catch (e) {
      return fail(`Upload to Walrus failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  },
);

/**
 * Tool: check_question
 */
server.registerTool(
  "check_question",
  {
    title: "Check an explanation or question against memory",
    description:
      "Screen a question, explanation or interview challenge against candidate memory constraints.",
    inputSchema: {
      text: z.string().describe("The text to screen"),
    },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  async ({ text: candidate }) => {
    try {
      const p = await profile();
      const verdict = screenQuestion(candidate, p);

      const redundantNote = verdict.redundant.length
        ? `\nNote: this covers ground already mastered (${verdict.redundant.join(", ")}).`
        : "";

      if (verdict.safe) {
        return text(
          `SAFE — nothing in this collides with stored record.\n` +
          `Screened against misconceptions [${p.misconceptions.join(", ") || "none"}], ` +
          `mastery [${p.mastery.join(", ") || "none"}] and goal [${p.goal.join(", ") || "none"}].` +
          redundantNote,
        );
      }

      return text(
        `UNSAFE — do not send this.\n` +
        (verdict.reinforced.length
          ? `Restates a misconception held without contradicting it: ` +
            `${verdict.reinforced.map((k) => MISCONCEPTIONS[k]?.label ?? k).join(", ")}\n`
          : "") +
        (verdict.answerReveals.length
          ? `Hands over the answer: "${verdict.answerReveals.join('", "')}".\n`
          : "") +
        redundantNote +
        `\nConstraints on file:\n${buildTeachingConstraintsText(p)}`,
      );
    } catch (e) {
      return fail(`Screening failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  },
);

/**
 * Tool: forget_fact
 */
server.registerTool(
  "forget_fact",
  {
    title: "Retract a stored fact",
    description:
      "Retract a career or coaching fact from Walrus Memory. Writes a tombstone that outranks the claim.",
    inputSchema: {
      fact: z.string().describe("The claim to retract"),
    },
    annotations: { destructiveHint: true, idempotentHint: true, openWorldHint: true },
  },
  async ({ fact }) => {
    try {
      const r = await forgetFact(owner, fact);
      if (r.status === "not-found") {
        return text(`Nothing close to "${fact}" is stored, so there is nothing to retract.`);
      }
      return text(
        `Retracted in ${r.namespace}:\n${r.target}\n\n` +
        `Written as:\n${r.tombstone}\n\n` +
        `It will not be recalled again. The original entry is still on Walrus, encrypted, until its storage period expires — it is out of reach, not erased.`,
      );
    } catch (e) {
      return fail(`Retraction failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  },
);

/**
 * Tool: list_memory
 */
server.registerTool(
  "list_memory",
  {
    title: "List what recall can reach in Career Vault",
    description: "Everything two broad recalls can reach across profile and feedback namespaces.",
    inputSchema: {},
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  async () => {
    try {
      const [p, f] = await Promise.all([
        recallProfile(owner, CAREER_QUERY),
        recallFeedback(owner, COACHING_QUERY),
      ]);
      const P = resolveConflicts(p);
      const F = resolveConflicts(f);
      const superseded = [...P.superseded, ...F.superseded];
      const retracted = [...P.retracted, ...F.retracted];
      const active = [...P.active, ...F.active];

      if (!active.length && !superseded.length && !retracted.length) {
        return text(`Nothing stored yet for ${owner}.`);
      }
      return text(
        `Career Memory for ${owner} — what recall can reach:\n` +
        `  ${profileNs(owner)}\n  ${feedbackNs(owner)}\n\n` +
        `ACTIVE (${active.length})\n${render(active) || "  none"}` +
        (superseded.length ? `\n\nSUPERSEDED (${superseded.length}) — kept, but outranked\n${render(superseded)}` : "") +
        (retracted.length ? `\n\nRETRACTED (${retracted.length}) — never read again\n${render(retracted)}` : ""),
      );
    } catch (e) {
      return fail(`Listing failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  },
);

/**
 * Tool: harvest_jobs_tool
 */
server.registerTool(
  "harvest_jobs_tool",
  {
    title: "Harvest Job Postings",
    description: "Harvest multi-source job postings across Remote, Onsite, and Hybrid channels.",
    inputSchema: {
      query: z.string().default("software engineer").describe("Job search query keyword"),
    },
  },
  async ({ query }) => {
    try {
      const raw = await harvestJobsFromSources(query);
      const normalized = normalizeAndDeduplicateJobs(raw);
      const filtered = filterJobs(normalized);
      return text(`Harvested ${filtered.length} job(s):\n` + JSON.stringify(filtered.slice(0, 5), null, 2));
    } catch (e) {
      return fail(`Harvest failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  },
);

/**
 * Tool: evaluate_job_tool
 */
server.registerTool(
  "evaluate_job_tool",
  {
    title: "Evaluate Job Candidate Fit",
    description: "Calculates candidate match score (1-10) against job description using stored history.",
    inputSchema: {
      job_title: z.string(),
      job_company: z.string(),
      job_description: z.string(),
      cv_text: z.string(),
      apply_url: z.string().optional(),
    },
  },
  async ({ job_title, job_company, job_description, cv_text, apply_url }) => {
    try {
      const parsedCv = parseCvText(cv_text);
      const job = {
        job_id: "job_mcp_eval",
        title: job_title,
        company: job_company,
        location: "Remote",
        description: job_description,
        apply_url: apply_url || "",
        source: "MCP",
        posted_date: new Date().toISOString(),
        is_remote: true,
        job_type: "remote" as const,
      };
      const result = evaluateJobFit(job, parsedCv);
      const tailored = generateTailoredCvAndCoverLetter(job, parsedCv);
      const routed = routeApplication(job, result, tailored);
      await syncApplicationToNotion(routed).catch(() => {});

      return text(`Fit Score: ${result.fit_score}/10\nRecommendation: ${result.recommendation}\nStatus: ${routed.status}\nReason: ${result.match_reason}`);
    } catch (e) {
      return fail(`Evaluation failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  },
);

/**
 * Tool: tailor_cv_tool
 */
server.registerTool(
  "tailor_cv_tool",
  {
    title: "Tailor CV and Generate Cover Letter",
    description: "Generates tailored CV bullet points and a targeted cover letter optimized for a specific job description.",
    inputSchema: {
      job_title: z.string().describe("Job title"),
      job_company: z.string().describe("Hiring company"),
      job_description: z.string().describe("Complete job description"),
      cv_text: z.string().describe("Candidate CV text"),
      apply_url: z.string().optional().describe("Job application URL"),
    },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  async ({ job_title, job_company, job_description, cv_text, apply_url }) => {
    try {
      const parsedCv = parseCvText(cv_text);
      const job = {
        job_id: `job_${Date.now()}`,
        title: job_title,
        company: job_company,
        location: "Remote",
        description: job_description,
        apply_url: apply_url || "",
        source: "MCP",
        posted_date: new Date().toISOString(),
        is_remote: true,
        job_type: "remote" as const,
      };
      const tailored = generateTailoredCvAndCoverLetter(job, parsedCv);
      return text(
        `Tailored CV for ${job_title} at ${job_company}:\n\n` +
        `SUMMARY:\n${tailored.tailored_summary}\n\n` +
        `KEY BULLETS:\n${(tailored.aligned_highlights || []).map((b) => `- ${b}`).join("\n")}\n\n` +
        `COVER LETTER:\n${tailored.cover_letter}`
      );
    } catch (e) {
      return fail(`Tailoring failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  },
);

/**
 * Tool: fill_application_tool
 */
server.registerTool(
  "fill_application_tool",
  {
    title: "Fill and Route Job Application",
    description: "Generates structured job application package, evaluates match score, routes application via ATS, and syncs status to Notion and candidate's Walrus Career Vault.",
    inputSchema: {
      job_title: z.string(),
      job_company: z.string(),
      job_description: z.string(),
      cv_text: z.string(),
      apply_url: z.string().optional().default(""),
    },
    annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async ({ job_title, job_company, job_description, cv_text, apply_url }) => {
    try {
      const parsedCv = parseCvText(cv_text);
      const job = {
        job_id: `app_${Date.now()}`,
        title: job_title,
        company: job_company,
        location: "Remote",
        description: job_description,
        apply_url: apply_url || "",
        source: "MCP",
        posted_date: new Date().toISOString(),
        is_remote: true,
        job_type: "remote" as const,
      };
      const evaluation = evaluateJobFit(job, parsedCv);
      const tailored = generateTailoredCvAndCoverLetter(job, parsedCv);
      const routed = routeApplication(job, evaluation, tailored);
      await syncApplicationToNotion(routed).catch(() => {});

      await rememberFact(
        owner,
        "application",
        `Applied to ${job_company} for ${job_title}: Fit score ${evaluation.fit_score}/10, status ${routed.status}`
      ).catch(() => {});

      return text(
        `Application Prepared & Routed for ${job_company} — ${job_title}\n` +
        `Status: ${routed.status}\n` +
        `Fit Score: ${evaluation.fit_score}/10\n` +
        `Recommendation: ${evaluation.recommendation}\n` +
        `Applied URL: ${job.apply_url}\n` +
        `Recorded to Walrus Career Vault: application namespace`
      );
    } catch (e) {
      return fail(`Application fill failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  },
);

/**
 * Resource: career-profile
 */
server.registerResource(
  "career-profile",
  "careerace://profile",
  {
    title: "Career profile",
    description: "The candidate's target roles, verified skills, work experience, tailored CV revisions, and STAR+R interview coach assessments distilled from Walrus Memory.",
    mimeType: "application/json",
  },
  async (uri) => {
    const data = await profile();
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({ owner, ...data }, null, 2),
      }],
    };
  },
);

// stdout carries the MCP protocol — anything we say goes to stderr.
await server.connect(new StdioServerTransport());
console.error(`careerace MCP ready for ${owner}`);
