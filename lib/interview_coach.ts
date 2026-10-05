import type { ProcessedApplication } from "./application_router.ts";
import type { ParsedCv } from "./cv_parser.ts";
import { callFreeLlmJson } from "./free_llm.ts";

export interface StarQuestion {
  question_id: string;
  category: "technical" | "behavioral" | "leadership" | "architecture";
  question_text: string;
  suggested_star_angle: {
    situation: string;
    task: string;
    action: string;
    result: string;
    reflection: string;
  };
}

export function generatePostApplicationInterviewPrep(
  application: ProcessedApplication,
  cv: ParsedCv,
  pastMemories?: Array<{ text: string; distance?: number }>
): StarQuestion[] {
  const primarySkill = cv.skills?.[0] || "TypeScript";
  const secondarySkill = cv.skills?.[1] || "React";
  const company = application.company || "Target Tech Company";
  const role = application.title || "Software Engineer";
  const rawPrevComp = cv.work_experience?.[0]?.company?.trim();
  const prevCompany = rawPrevComp && !/^(?:organization|previous tech organization|company)$/i.test(rawPrevComp) ? rawPrevComp : "";
  const prevRole = cv.work_experience?.[0]?.role || "Professional";

  const questions: StarQuestion[] = [];

  // If candidate has past coaching insights in Walrus Memory, inject a targeted recall question!
  if (pastMemories && pastMemories.length > 0) {
    const firstMem = pastMemories[0].text;
    const cleanInsight = firstMem.includes("|")
      ? firstMem.split("|").slice(2).join("|").split(" - SUPERSEDES:")[0].trim()
      : firstMem.split(" - SUPERSEDES:")[0].trim();

    questions.push({
      question_id: `q_${application.job_id}_walrus_recall`,
      category: "technical",
      question_text: `Walrus Memory Coaching Focus: Recalling your past feedback on "${cleanInsight.slice(0, 90)}...". How would you handle a production challenge at ${company} showing measurable mastery in this area?`,
      suggested_star_angle: {
        situation: `Addressing technical edge cases and quantifiable metrics identified during previous AI interview rounds.`,
        task: `Demonstrate mastery over past growth areas with structured STAR+R execution for ${company}.`,
        action: `Applied deliberate practice, systematic root-cause analysis, and benchmarked architectural trade-offs.`,
        result: `Achieved 100% test coverage and eliminated high-latency bottlenecks with zero regressions.`,
        reflection: `Continuous self-evaluation grounded in decentralized memory ensures measurable technical progression.`
      }
    });
  }

  questions.push(
    {
      question_id: `q_${application.job_id}_1`,
      category: "technical",
      question_text: `Can you describe a complex technical challenge you solved using ${primarySkill} and ${secondarySkill}${prevCompany ? ` at ${prevCompany}` : " in your professional career"}?`,
      suggested_star_angle: {
        situation: prevCompany ? `Working at ${prevCompany}, high latency and scalability bottlenecks affected core customer workflows.` : `In a critical production environment, high latency and scalability bottlenecks affected core workflows.`,
        task: `Refactor backend service endpoints and optimize client state caching without disrupting active users.`,
        action: `Implemented asynchronous query batching, structured error boundaries, and Redis caching layers.`,
        result: `Reduced endpoint response latency by 45% and improved customer satisfaction scores.`,
        reflection: `Learned the critical value of proactive telemetry and benchmarking before initiating deep architectural refactors.`
      }
    },
    {
      question_id: `q_${application.job_id}_2`,
      category: "behavioral",
      question_text: `Tell me about a time you navigated shifting product priorities and tight deadlines while building for ${role} level expectations.`,
      suggested_star_angle: {
        situation: `During a major release cycle, key feature specifications changed two weeks before launch.`,
        task: `Re-evaluate implementation scope to deliver core business value without introducing security vulnerabilities.`,
        action: `Conducted rapid triage with product stakeholders, isolated MVP deliverables, and established clear milestone boundaries.`,
        result: `Shipped critical functionality on schedule with zero high-severity production regressions.`,
        reflection: `Transparent, early communication across engineering and product is the most effective safeguard against deadline slippage.`
      }
    },
    {
      question_id: `q_${application.job_id}_3`,
      category: "architecture",
      question_text: `How would you architect a fault-tolerant, high-throughput service for ${company}'s core business domains?`,
      suggested_star_angle: {
        situation: `Designing a mission-critical subsystem requiring high availability across multiple geographic regions.`,
        task: `Ensure zero single points of failure, partition tolerance, and strict data consistency guarantees.`,
        action: `Leveraged decoupled message queues, idempotency tokens, and eventual consistency models with automated dead-letter retries.`,
        result: `Achieved 99.99% service availability during stress testing with automated disaster failover.`,
        reflection: `Architectural simplicity and defensive design principles yield far greater resilience than premature complexity.`
      }
    },
    {
      question_id: `q_${application.job_id}_4`,
      category: "leadership",
      question_text: `Describe a situation where you advocated for engineering best practices (such as testing or security) against pressure to ship quickly.`,
      suggested_star_angle: {
        situation: `Engineering team was accumulating technical debt and skipping end-to-end integration tests to meet sprint goals.`,
        task: `Demonstrate the tangible cost of defects and establish sustainable quality standards for future releases.`,
        action: `Presented incident metrics linking test gaps to outage hours; introduced automated CI validation gates with team buy-in.`,
        result: `Reduced post-release rollback frequency by 60% within two quarters.`,
        reflection: `Influencing team culture requires empirical data and empathy rather than top-down process mandates.`
      }
    }
  );

  return questions;
}

export interface StarEvaluation {
  overall_score: number; // 1-10
  dimensions: {
    situation: { score: number; feedback: string };
    task: { score: number; feedback: string };
    action: { score: number; feedback: string };
    result: { score: number; feedback: string };
    reflection: { score: number; feedback: string };
  };
  strengths: string[];
  improvements: string[];
  coach_critique: string;
}

export async function evaluateStarAnswer(
  question: string,
  answer: string,
  roleContext?: string
): Promise<StarEvaluation> {
  // 1. Attempt Genuine AI Evaluation using configured LLM
  try {
    const prompt = `Evaluate candidate interview answer for role "${roleContext || "Software Engineer"}":
Question: "${question}"
Candidate Answer: "${answer}"

Provide rigorous STAR+R analysis (Situation, Task, Action, Result, Reflection).`;

    const systemPrompt = `You are a Principal Technical Interview Coach. Analyze the response and return ONLY valid JSON:
{
  "overall_score": number (1-10),
  "dimensions": {
    "situation": { "score": number (1-10), "feedback": "string" },
    "task": { "score": number (1-10), "feedback": "string" },
    "action": { "score": number (1-10), "feedback": "string" },
    "result": { "score": number (1-10), "feedback": "string" },
    "reflection": { "score": number (1-10), "feedback": "string" }
  },
  "strengths": ["string", "string"],
  "improvements": ["string", "string"],
  "coach_critique": "string"
}`;

    const aiResult = await callFreeLlmJson<StarEvaluation>(prompt, systemPrompt);
    if (aiResult && typeof aiResult.overall_score === "number" && aiResult.dimensions) {
      return aiResult;
    }
  } catch (_aiErr) {}

  // 2. Deterministic Rubric Fallback
  return fallbackStarEvaluation(question, answer);
}

function fallbackStarEvaluation(question: string, answer: string): StarEvaluation {
  const text = answer.trim().toLowerCase();
  const wordCount = answer.trim().split(/\s+/).length;

  const hasSituation =
    text.includes("when") || text.includes("working at") || text.includes("team") ||
    text.includes("project") || text.includes("situation") || text.includes("company");

  const hasTask =
    text.includes("task") || text.includes("goal") || text.includes("needed to") ||
    text.includes("responsible for") || text.includes("objective") || text.includes("challenge");

  const hasAction =
    text.includes("i ") || text.includes("implemented") || text.includes("designed") ||
    text.includes("built") || text.includes("migrated") || text.includes("architected") ||
    text.includes("refactored") || text.includes("developed");

  const hasResult =
    /\d+[%kM]|\breduced\b|\bincreased\b|\bimproved\b|\bsaved\b|\baccelerated\b|\bdelivered\b/.test(text) ||
    text.includes("result") || text.includes("outcome") || text.includes("impact");

  const hasReflection =
    text.includes("learned") || text.includes("reflection") || text.includes("in retrospect") ||
    text.includes("takeaway") || text.includes("next time") || text.includes("going forward");

  const situationScore = hasSituation ? (wordCount > 30 ? 9 : 7) : 5;
  const taskScore = hasTask ? (wordCount > 40 ? 9 : 7) : 5;
  const actionScore = hasAction ? (wordCount > 50 ? 9 : 8) : 6;
  const resultScore = hasResult ? 9 : 5;
  const reflectionScore = hasReflection ? 9 : 5;

  const overall = Math.round(
    (situationScore * 0.2 + taskScore * 0.2 + actionScore * 0.3 + resultScore * 0.2 + reflectionScore * 0.1) * 10
  ) / 10;

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (hasAction) strengths.push("Clear personal ownership and proactive technical execution steps.");
  if (hasSituation) strengths.push("Strong initial framing of operational context and organizational stakes.");
  if (hasResult) strengths.push("Concrete business impact demonstrated with measurable outcome metrics.");
  else improvements.push("Quantify results with hard metrics (e.g. latency reduced by X%, throughput increased by Y).");

  if (!hasReflection) improvements.push("Conclude with a +Reflection on what architectural insights or lessons you carried into future systems.");
  if (wordCount < 40) improvements.push("Elaborate on specific architectural tradeoffs and technical decisions made during implementation.");

  return {
    overall_score: Math.min(10, Math.max(1, overall)),
    dimensions: {
      situation: {
        score: situationScore,
        feedback: hasSituation
          ? "Context and team constraints clearly outlined."
          : "Needs clearer framing of the initial environment and why this situation arose.",
      },
      task: {
        score: taskScore,
        feedback: hasTask
          ? "Core responsibility and task objectives were well established."
          : "Explicitly state the exact technical goal and who was depending on it.",
      },
      action: {
        score: actionScore,
        feedback: hasAction
          ? "First-person actions and technical execution steps were well communicated."
          : "Clarify your individual contributions versus general team actions.",
      },
      result: {
        score: resultScore,
        feedback: hasResult
          ? "Measurable result or milestone successfully communicated."
          : "Strengthen the result with quantified metrics (percentage, latency, revenue, error rate).",
      },
      reflection: {
        score: reflectionScore,
        feedback: hasReflection
          ? "Insightful reflection showing engineering maturity and continuous learning."
          : "Include what you would do differently in hindsight to demonstrate engineering seniority.",
      },
    },
    strengths,
    improvements,
    coach_critique:
      overall >= 8
        ? "Strong STAR+R answer. Demonstrates decisive technical ownership, quantifiable impact, and reflective leadership."
        : "Good foundation. Focusing on quantitative results and closing with a forward-looking reflection will make this response stand out to senior engineering interviewers.",
  };
}
