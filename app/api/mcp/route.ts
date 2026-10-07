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
} from "../../../lib/memory_core.ts";
import { screenQuestion, buildTeachingConstraintsText, MISCONCEPTIONS } from "../../../lib/pedagogy.ts";
import { parseCvText } from "../../../lib/cv_parser.ts";
import { harvestJobsFromSources } from "../../../lib/job_harvester.ts";
import { normalizeAndDeduplicateJobs } from "../../../lib/job_normaliser.ts";
import { filterJobs } from "../../../lib/job_filter.ts";
import { evaluateJobFit } from "../../../lib/job_evaluator.ts";
import { generateTailoredCvAndCoverLetter } from "../../../lib/resume_tailor.ts";
import { routeApplication } from "../../../lib/application_router.ts";
import { syncApplicationToNotion } from "../../../lib/notion_sync.ts";
import { uploadEncryptedResumeToWalrus } from "../../../lib/walrus_storage.ts";
import { exportToJsonResume } from "../../../lib/json_resume.ts";
import { buildDocxResume } from "../../../lib/docx_exporter.ts";
import { Packer } from "docx";
import { resolveTargetAddress } from "../../../lib/target_address.ts";

export const maxDuration = 60; // 60s max execution for deep job tailoring & Walrus I/O

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-careerace-key, x-owner-address",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export const MCP_TOOLS_DEFINITIONS = [
  {
    name: "recall_memory",
    title: "Recall Sovereign Career Memory",
    description:
      "Search this candidate's sovereign Career Vault by semantic similarity. Returns dated facts — target roles, verified technical skills, work accomplishments, tailored CV versions, and STAR+R interview coach assessments.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "What you want to know about the candidate, e.g. 'skills and target roles' or 'experience with distributed systems'",
        },
        scope: {
          type: "string",
          enum: ["profile", "feedback", "both"],
          default: "both",
          description: "profile = credentials & skills; feedback = interview coaching & applications; both = complete vault",
        },
        owner_address: {
          type: "string",
          description: "Optional explicit Sui candidate address (0x...). Defaults to sovereign user session.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "remember_fact",
    title: "Remember a Career Fact",
    description:
      "Store a durable credential or coaching fact about this candidate into Walrus Memory. Reconciles automatically with deterministic deduplication.",
    inputSchema: {
      type: "object",
      properties: {
        kind: {
          type: "string",
          enum: [
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
          ],
          description: "The taxonomy category of the fact to store",
        },
        fact: {
          type: "string",
          description: "The fact in plain words, third person, no date.",
        },
        user_turn: {
          type: "string",
          description: "Optional user input string to evaluate for off-the-record directives.",
        },
        owner_address: {
          type: "string",
          description: "Optional explicit Sui candidate address (0x...).",
        },
      },
      required: ["kind", "fact"],
    },
  },
  {
    name: "forget_fact",
    title: "Retract a Stored Fact",
    description:
      "Retract a career or coaching fact from Walrus Memory. Writes a cryptographically signed tombstone that permanently outranks the claim.",
    inputSchema: {
      type: "object",
      properties: {
        fact: {
          type: "string",
          description: "The claim to retract",
        },
        owner_address: {
          type: "string",
          description: "Optional explicit Sui candidate address (0x...).",
        },
      },
      required: ["fact"],
    },
  },
  {
    name: "list_memory",
    title: "List Sovereign Career Memory",
    description: "Returns all active, superseded, and retracted memory records stored in the candidate's Walrus Career Vault.",
    inputSchema: {
      type: "object",
      properties: {
        owner_address: {
          type: "string",
          description: "Optional explicit Sui candidate address (0x...).",
        },
      },
    },
  },
  {
    name: "harvest_jobs_tool",
    title: "Harvest Job Postings",
    description: "Harvest multi-source job postings across Remote, Onsite, and Hybrid channels with live deduplication.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          default: "software engineer",
          description: "Job search query keyword or title",
        },
      },
    },
  },
  {
    name: "evaluate_job_tool",
    title: "Evaluate Job Candidate Fit & ATS Reverse Engineering",
    description: "Calculates candidate match score (1-10) against job description and produces an ATS diagnostic scorecard.",
    inputSchema: {
      type: "object",
      properties: {
        job_title: { type: "string", description: "Target job title" },
        job_company: { type: "string", description: "Hiring organization name" },
        job_description: { type: "string", description: "Full job description text" },
        cv_text: { type: "string", description: "Candidate CV or resume plain text" },
        apply_url: { type: "string", description: "Optional job application URL" },
      },
      required: ["job_title", "job_company", "job_description", "cv_text"],
    },
  },
  {
    name: "tailor_cv_tool",
    title: "Tailor CV and Generate Targeted Cover Letter",
    description: "Generates tailored CV bullet points and a targeted, high-impact cover letter optimized for a specific job.",
    inputSchema: {
      type: "object",
      properties: {
        job_title: { type: "string", description: "Target job title" },
        job_company: { type: "string", description: "Hiring company" },
        job_description: { type: "string", description: "Full job description" },
        cv_text: { type: "string", description: "Candidate CV text" },
        apply_url: { type: "string", description: "Optional job application URL" },
      },
      required: ["job_title", "job_company", "job_description", "cv_text"],
    },
  },
  {
    name: "export_json_resume_tool",
    title: "Export JSON Resume (Schema v1.0.0)",
    description: "Converts candidate profile into the official global JSON Resume standard format (jsonresume.org).",
    inputSchema: {
      type: "object",
      properties: {
        cv_text: { type: "string", description: "Candidate CV text to export" },
        custom_summary: { type: "string", description: "Optional targeted executive summary" },
      },
      required: ["cv_text"],
    },
  },
  {
    name: "export_docx_resume_tool",
    title: "Export Native ATS Word Document (.docx)",
    description: "Compiles candidate profile into a 100% ATS-compliant Microsoft Word (.docx) document (base64 encoded).",
    inputSchema: {
      type: "object",
      properties: {
        cv_text: { type: "string", description: "Candidate CV text to compile" },
        custom_summary: { type: "string", description: "Optional targeted summary" },
      },
      required: ["cv_text"],
    },
  },
  {
    name: "fill_application_tool",
    title: "Fill and Route Job Application Package",
    description: "Generates complete structured application package, evaluates match score, routes via ATS, and syncs status.",
    inputSchema: {
      type: "object",
      properties: {
        job_title: { type: "string", description: "Job title" },
        job_company: { type: "string", description: "Hiring company" },
        job_description: { type: "string", description: "Job description" },
        cv_text: { type: "string", description: "Candidate CV text" },
        apply_url: { type: "string", description: "Optional apply URL" },
      },
      required: ["job_title", "job_company", "job_description", "cv_text"],
    },
  },
  {
    name: "check_question",
    title: "Screen Interview Question Against Memory",
    description: "Screens an explanation, challenge, or interview question against candidate memory constraints and misconceptions.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "The interview question or technical explanation to screen" },
        owner_address: { type: "string", description: "Optional candidate address" },
      },
      required: ["text"],
    },
  },
];

function formatFacts(facts: { text: string; distance: number }[]): string {
  if (!facts.length) return "none";
  return facts.map((f) => `${f.text} (relevance distance: ${f.distance.toFixed(3)})`).join("\n");
}

async function getCandidateProfile(owner: string) {
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
    goal: claimsOfKind(career, "goal"),
    misconceptions: claimsOfKind(career, "misconception"),
    weaknesses: claimsOfKind(career, "weakness"),
    mastery: claimsOfKind(career, "mastery"),
    errorPatterns: claimsOfKind(coaching, "error_pattern"),
    active: [...career, ...coaching],
  };
}

async function executeTool(name: string, args: Record<string, any>, req: Request): Promise<{ text: string; isError?: boolean }> {
  const explicitOwner =
    req.headers.get("x-owner-address") ||
    req.headers.get("x-candidate-address") ||
    args.owner_address;
  const owner = await resolveTargetAddress(explicitOwner);

  switch (name) {
    case "recall_memory":
    case "recall_career_vault_tool": {
      const query = String(args.query || "");
      const want = args.scope || "both";
      const [p, f] = await Promise.all([
        want === "feedback" ? [] : recallProfile(owner, query),
        want === "profile" ? [] : recallFeedback(owner, query),
      ]);
      const active = [...resolveConflicts(p).active, ...resolveConflicts(f).active];
      if (!active.length) {
        return { text: `No relevant memory found in Career Vault for query "${query}".` };
      }
      return { text: `${active.length} fact(s) recalled for ${owner}:\n\n${formatFacts(active)}` };
    }

    case "remember_fact": {
      const kind = args.kind;
      const fact = String(args.fact || "");
      const userTurn = args.user_turn ? String(args.user_turn) : undefined;
      if (userTurn && isOffTheRecord(userTurn)) {
        return { text: "Not stored — candidate requested this stay off the record." };
      }
      const r = await rememberFact(owner, kind, fact, { userTurn });
      if (r.status === "skipped") {
        return {
          text: r.reason === "duplicate"
            ? `Already known, nothing written:\n${r.existing}`
            : "Not stored — candidate requested this stay off the record.",
        };
      }
      return {
        text: `Stored in ${r.namespace}:\n${r.text}` + (r.supersedes ? `\n\nThis supersedes:\n${r.supersedes}` : ""),
      };
    }

    case "forget_fact": {
      const fact = String(args.fact || "");
      const r = await forgetFact(owner, fact);
      if (r.status === "not-found") {
        return { text: `Nothing close to "${fact}" is stored, so there is nothing to retract.` };
      }
      return {
        text: `Retracted in ${r.namespace}:\n${r.target}\n\nWritten as:\n${r.tombstone}\n\nIt will not be recalled again.`,
      };
    }

    case "list_memory": {
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
        return { text: `Nothing stored yet in Career Vault for ${owner}.` };
      }
      return {
        text: `Career Memory for ${owner}:\n\nACTIVE (${active.length}):\n${formatFacts(active)}\n\nSUPERSEDED (${superseded.length}):\n${formatFacts(superseded)}\n\nRETRACTED (${retracted.length}):\n${formatFacts(retracted)}`,
      };
    }

    case "harvest_jobs_tool": {
      const query = String(args.query || "software engineer");
      const raw = await harvestJobsFromSources(query);
      const normalized = normalizeAndDeduplicateJobs(raw);
      const filtered = filterJobs(normalized);
      return { text: `Harvested ${filtered.length} live job posting(s):\n\n` + JSON.stringify(filtered.slice(0, 5), null, 2) };
    }

    case "evaluate_job_tool": {
      const parsedCv = parseCvText(String(args.cv_text || ""));
      const job = {
        job_id: `mcp_job_${Date.now()}`,
        title: String(args.job_title || ""),
        company: String(args.job_company || ""),
        location: "Remote",
        description: String(args.job_description || ""),
        apply_url: String(args.apply_url || ""),
        source: "Remote-MCP",
        posted_date: new Date().toISOString(),
        is_remote: true,
        job_type: "remote" as const,
      };
      const result = evaluateJobFit(job, parsedCv);
      const tailored = generateTailoredCvAndCoverLetter(job, parsedCv);
      const routed = routeApplication(job, result, tailored);
      await syncApplicationToNotion(routed).catch(() => {});

      const scorecard = result.ats_scorecard;
      const atsDetails = scorecard
        ? `\n\n--- ATS REVERSE-ENGINEERING DIAGNOSTIC ---\nATS Grade: ${scorecard.ats_grade} (${scorecard.overall_score}%)\nKeyword Coverage: ${scorecard.keyword_coverage_pct}%\nEssential Skills Coverage: ${scorecard.essential_skills_coverage_pct}%\nMatched Keywords: ${scorecard.matched_skills.join(", ") || "None"}\nMissing Critical Skills: ${scorecard.missing_critical_skills.join(", ") || "None"}\nActionable Recommendations:\n${scorecard.actionable_recommendations.map((r) => `• ${r}`).join("\n")}`
        : "";

      return {
        text: `Fit Score: ${result.fit_score}/10\nRecommendation: ${result.recommendation}\nStatus: ${routed.status}\nReason: ${result.match_reason}${atsDetails}`,
      };
    }

    case "tailor_cv_tool": {
      const parsedCv = parseCvText(String(args.cv_text || ""));
      const job = {
        job_id: `mcp_job_${Date.now()}`,
        title: String(args.job_title || ""),
        company: String(args.job_company || ""),
        location: "Remote",
        description: String(args.job_description || ""),
        apply_url: String(args.apply_url || ""),
        source: "Remote-MCP",
        posted_date: new Date().toISOString(),
        is_remote: true,
        job_type: "remote" as const,
      };
      const tailored = generateTailoredCvAndCoverLetter(job, parsedCv);
      return {
        text: `TAILORED CV FOR ${job.title} AT ${job.company}:\n\n` +
          `PROFESSIONAL SUMMARY:\n${tailored.tailored_summary}\n\n` +
          `ALIGNED HIGHLIGHTS:\n${(tailored.aligned_highlights || []).map((b) => `- ${b}`).join("\n")}\n\n` +
          `HIGH-IMPACT COVER LETTER:\n${tailored.cover_letter}`,
      };
    }

    case "export_json_resume_tool": {
      const parsedCv = parseCvText(String(args.cv_text || ""));
      const jsonResume = exportToJsonResume(parsedCv, args.custom_summary);
      return { text: JSON.stringify(jsonResume, null, 2) };
    }

    case "export_docx_resume_tool": {
      const parsedCv = parseCvText(String(args.cv_text || ""));
      const doc = buildDocxResume(parsedCv, args.custom_summary);
      const buffer = await Packer.toBuffer(doc);
      return {
        text: JSON.stringify(
          {
            filename: `${(parsedCv.applicant_name || "Candidate").replace(/\s+/g, "_")}_ATS_Resume.docx`,
            format: "docx",
            mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            base64: buffer.toString("base64"),
          },
          null,
          2
        ),
      };
    }

    case "fill_application_tool": {
      const parsedCv = parseCvText(String(args.cv_text || ""));
      const job = {
        job_id: `mcp_app_${Date.now()}`,
        title: String(args.job_title || ""),
        company: String(args.job_company || ""),
        location: "Remote",
        description: String(args.job_description || ""),
        apply_url: String(args.apply_url || ""),
        source: "Remote-MCP",
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
        `Applied to ${job.company} for ${job.title}: Fit score ${evaluation.fit_score}/10, status ${routed.status}`
      ).catch(() => {});

      return {
        text: `Application Package Prepared & Routed for ${job.company} — ${job.title}\n` +
          `Status: ${routed.status}\n` +
          `Fit Score: ${evaluation.fit_score}/10\n` +
          `Recommendation: ${evaluation.recommendation}\n` +
          `Recorded to Walrus Career Vault: application namespace for ${owner}`,
      };
    }

    case "check_question": {
      const candidateText = String(args.text || "");
      const p = await getCandidateProfile(owner);
      const verdict = screenQuestion(candidateText, p);
      if (verdict.safe) {
        return {
          text: `SAFE — collides with 0 stored records. Screened against misconceptions [${p.misconceptions.join(", ") || "none"}] and mastery [${p.mastery.join(", ") || "none"}].`,
        };
      }
      return {
        text: `UNSAFE — do not send.\n` +
          (verdict.reinforced.length
            ? `Restates misconception: ${verdict.reinforced.map((k) => MISCONCEPTIONS[k]?.label ?? k).join(", ")}\n`
            : "") +
          (verdict.answerReveals.length ? `Reveals answer directly: "${verdict.answerReveals.join('", "')}"\n` : "") +
          `\nConstraints:\n${buildTeachingConstraintsText(p)}`,
      };
    }

    default:
      return { text: `Unknown tool: "${name}"`, isError: true };
  }
}

/**
 * GET /api/mcp
 * Returns MCP OpenAPI discovery metadata, tool schemas, and connection guide.
 */
export async function GET() {
  return Response.json(
    {
      name: "CareerAce Sovereign Remote MCP Server",
      version: "0.2.0",
      protocol: "model-context-protocol / json-rpc-2.0",
      description: "Direct cloud HTTP / JSON-RPC endpoint for Model Context Protocol. Exposes decentralized Walrus Career Vault, ATS reverse-engineering, CV tailoring, and job harvesting to any remote AI agent.",
      endpoint: "/api/mcp",
      transport: "HTTP POST",
      auth: {
        type: "Bearer or Custom Header",
        headers: {
          "Authorization": "Bearer <API_KEY> (Optional if public)",
          "x-owner-address": "0x... (Sui address to scope Career Vault)",
        },
      },
      toolsCount: MCP_TOOLS_DEFINITIONS.length,
      tools: MCP_TOOLS_DEFINITIONS,
      quickstart: {
        cursor_mcp_config: {
          mcpServers: {
            careerace: {
              url: "https://careerace.online/api/mcp",
              transport: "http",
            },
          },
        },
        sample_json_rpc_call: {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: {
            name: "recall_memory",
            arguments: { query: "verified skills and accomplishments" },
          },
        },
      },
    },
    { headers: CORS_HEADERS }
  );
}

/**
 * POST /api/mcp
 * Handles incoming JSON-RPC 2.0 requests adhering to the Model Context Protocol.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return Response.json(
        { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error: Invalid JSON" } },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const { id, method, params } = body;

    // 1. MCP Initialization Handshake
    if (method === "initialize") {
      return Response.json(
        {
          jsonrpc: "2.0",
          id: id ?? null,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: { listChanged: false },
              resources: { subscribe: false, listChanged: false },
            },
            serverInfo: {
              name: "careerace-remote",
              version: "0.2.0",
            },
          },
        },
        { headers: CORS_HEADERS }
      );
    }

    // 2. tools/list
    if (method === "tools/list") {
      return Response.json(
        {
          jsonrpc: "2.0",
          id: id ?? null,
          result: {
            tools: MCP_TOOLS_DEFINITIONS,
          },
        },
        { headers: CORS_HEADERS }
      );
    }

    // 3. tools/call
    if (method === "tools/call") {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      if (!toolName || typeof toolName !== "string") {
        return Response.json(
          {
            jsonrpc: "2.0",
            id: id ?? null,
            error: { code: -32602, message: "Invalid params: missing tool 'name'" },
          },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const execution = await executeTool(toolName, toolArgs, req);
      return Response.json(
        {
          jsonrpc: "2.0",
          id: id ?? null,
          result: {
            content: [{ type: "text", text: execution.text }],
            isError: execution.isError || false,
          },
        },
        { headers: CORS_HEADERS }
      );
    }

    // 4. resources/list
    if (method === "resources/list") {
      return Response.json(
        {
          jsonrpc: "2.0",
          id: id ?? null,
          result: {
            resources: [
              {
                uri: "careerace://profile",
                name: "Sovereign Career Profile",
                description: "The candidate's target roles, verified skills, and STAR+R assessments.",
                mimeType: "application/json",
              },
            ],
          },
        },
        { headers: CORS_HEADERS }
      );
    }

    // 5. resources/read
    if (method === "resources/read") {
      const uri = params?.uri;
      if (uri === "careerace://profile") {
        const owner = await resolveTargetAddress(req.headers.get("x-owner-address"));
        const data = await getCandidateProfile(owner);
        return Response.json(
          {
            jsonrpc: "2.0",
            id: id ?? null,
            result: {
              contents: [
                {
                  uri,
                  mimeType: "application/json",
                  text: JSON.stringify({ owner, ...data }, null, 2),
                },
              ],
            },
          },
          { headers: CORS_HEADERS }
        );
      }
      return Response.json(
        {
          jsonrpc: "2.0",
          id: id ?? null,
          error: { code: -32602, message: `Resource not found: ${uri}` },
        },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // Unknown method
    return Response.json(
      {
        jsonrpc: "2.0",
        id: id ?? null,
        error: { code: -32601, message: `Method not found: ${method}` },
      },
      { status: 404, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error("[api/mcp] Uncaught error:", err);
    return Response.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32603, message: `Internal server error: ${err?.message || String(err)}` },
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
