import type { ProcessedApplication } from "./application_router.ts";
import type { ParsedCv } from "./cv_parser.ts";

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
  cv: ParsedCv
): StarQuestion[] {
  return [
    {
      question_id: `q_${application.job_id}_1`,
      category: "technical",
      question_text: `Can you describe a challenging technical problem you solved using ${cv.skills[0] || "React"} at your previous role?`,
      suggested_star_angle: {
        situation: `Working at ${cv.work_experience[0]?.company || "previous company"}, system latency was impacting user retention.`,
        task: "Refactor core API response handling and optimize component rendering.",
        action: "Implemented memoization, virtualized lists, and asynchronous query caching.",
        result: "Reduced page load time by 40% and improved throughput.",
        reflection: "Learned the value of proactive performance profiling during early architecture planning."
      }
    },
    {
      question_id: `q_${application.job_id}_2`,
      category: "behavioral",
      question_text: `How do you approach aligning code implementations with tight business deadlines at ${application.company}?`,
      suggested_star_angle: {
        situation: `During the launch phase for ${cv.work_experience[0]?.role || "Engineering team"}, requirements shifted close to deadline.`,
        task: "Deliver core features on time without compromising production quality or security.",
        action: "Prioritized MVP features, set up automated integration tests, and maintained continuous communication with product managers.",
        result: "Successfully shipped key features on schedule with zero critical bugs.",
        reflection: "Demonstrated that transparent scope management is key to delivering high quality software under tight deadlines."
      }
    }
  ];
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

export function evaluateStarAnswer(
  question: string,
  answer: string,
  roleContext?: string
): StarEvaluation {
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

  if (hasAction) strengths.push("Strong personal agency and clear ownership in technical action steps.");
  if (hasSituation) strengths.push("Clear framing of organizational context and background constraints.");
  if (hasResult) strengths.push("Demonstrated business impact with concrete outcome indicators.");
  else improvements.push("Quantify your results with concrete metrics (e.g. latency reduced by X%, throughput increased by Y).");

  if (!hasReflection) improvements.push("Add a +Reflection closing statement on what technical insights you gained and how they influenced future architecture.");
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
        ? "Excellent STAR+R response. Clear demonstration of technical ownership, quantifiable impact, and reflective maturity."
        : "Good foundation. Focusing on quantitative results and closing with a forward-looking reflection will make this response stand out to senior engineering interviewers.",
  };
}
