import type { NormalizedJob } from "./job_normaliser.ts";
import type { ParsedCv } from "./cv_parser.ts";
import { analyzeAtsMatch, type AtsScorecard } from "./ats_engine.ts";

export interface EvaluationResult {
  job_id: string;
  fit_score: number; // 1 to 10 scale
  match_reason: string;
  matched_skills: string[];
  missing_skills: string[];
  recommendation: "strong_apply" | "moderate_apply" | "manual_review";
  ats_scorecard?: AtsScorecard;
}

export function evaluateJobFit(job: NormalizedJob, cv: ParsedCv): EvaluationResult {
  // Aggregate candidate experience text for deep matching
  const experienceText = (cv.work_experience || [])
    .map(w => `${w.role} at ${w.company}: ${(w.highlights || []).join(' ')}`)
    .join(' ');

  const academicText = (cv.academic_history || [])
    .map(a => `${a.degree} ${a.field_of_study} at ${a.institution}`)
    .join(' ');

  const scorecard = analyzeAtsMatch({
    jobTitle: job.title,
    jobDescription: job.description,
    applicantSkills: cv.skills || [],
    applicantExperienceText: experienceText,
    applicantAcademicText: academicText,
    applicantContactInfo: {
      email: cv.email,
      phone: cv.phone
    }
  });

  const fit_score = scorecard.fit_score_10;

  let recommendation: EvaluationResult["recommendation"] = "manual_review";
  if (fit_score >= 8) recommendation = "strong_apply";
  else if (fit_score >= 6) recommendation = "moderate_apply";

  const match_reason = `ATS Match Grade ${scorecard.ats_grade} (${scorecard.overall_score}%). Matched ${scorecard.matched_skills.length} core keywords (${scorecard.matched_skills.slice(0, 4).join(", ")}). Keyword coverage: ${scorecard.keyword_coverage_pct}%.`;

  return {
    job_id: job.job_id,
    fit_score,
    match_reason,
    matched_skills: scorecard.matched_skills,
    missing_skills: scorecard.missing_critical_skills.concat(scorecard.missing_secondary_skills).slice(0, 8),
    recommendation,
    ats_scorecard: scorecard
  };
}
