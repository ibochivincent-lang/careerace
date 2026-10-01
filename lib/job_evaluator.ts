import type { NormalizedJob } from "./job_normaliser.ts";
import type { ParsedCv } from "./cv_parser.ts";

export interface EvaluationResult {
  job_id: string;
  fit_score: number; // 1 to 10 scale
  match_reason: string;
  matched_skills: string[];
  missing_skills: string[];
  recommendation: "strong_apply" | "moderate_apply" | "manual_review";
}

export function evaluateJobFit(job: NormalizedJob, cv: ParsedCv): EvaluationResult {
  const jobText = `${job.title} ${job.description}`.toLowerCase();
  
  const matched_skills: string[] = [];
  const missing_skills: string[] = [];

  for (const skill of cv.skills) {
    if (jobText.includes(skill.toLowerCase())) {
      matched_skills.push(skill);
    }
  }

  // Common high priority stack keywords
  const targetKeywords = ["react", "node", "typescript", "python", "next.js", "rest", "api", "sql", "aws"];
  for (const kw of targetKeywords) {
    if (jobText.includes(kw) && !cv.skills.includes(kw)) {
      missing_skills.push(kw);
    }
  }

  // Calculate fit score
  let baseScore = 5;
  if (matched_skills.length >= 3) baseScore += 3;
  else if (matched_skills.length >= 1) baseScore += 1;

  if (cv.target_roles.some(r => job.title.toLowerCase().includes(r.toLowerCase()))) {
    baseScore += 2;
  }

  const fit_score = Math.min(10, Math.max(1, baseScore));

  let recommendation: EvaluationResult["recommendation"] = "manual_review";
  if (fit_score >= 8) recommendation = "strong_apply";
  else if (fit_score >= 6) recommendation = "moderate_apply";

  const match_reason = `Matched ${matched_skills.length} core skills (${matched_skills.join(", ")}). Fit score ${fit_score}/10 based on role requirements.`;

  return {
    job_id: job.job_id,
    fit_score,
    match_reason,
    matched_skills,
    missing_skills,
    recommendation
  };
}
