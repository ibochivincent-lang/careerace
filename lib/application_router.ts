import type { NormalizedJob } from "./job_normaliser.ts";
import type { EvaluationResult } from "./job_evaluator.ts";
import type { TailoredPackage } from "./resume_tailor.ts";

export interface ProcessedApplication {
  job_id: string;
  title: string;
  company: string;
  apply_url: string;
  fit_score: number;
  track: "track_a_auto_apply" | "track_b_manual_queue";
  status: "Auto-Apply Ready" | "Applied" | "Manual Required" | "Pending Review";
  flag_reason?: string;
  tailored_package?: TailoredPackage;
  processed_at: string;
}

export function routeApplication(
  job: NormalizedJob,
  evaluation: EvaluationResult,
  tailoredPackage: TailoredPackage
): ProcessedApplication {
  const isMailto = job.apply_url.toLowerCase().startsWith("mailto:");
  const hasDirectUrl = job.apply_url.length > 0 && !job.apply_url.includes("linkedin.com");
  const isHighFit = evaluation.fit_score >= 6;

  if (isHighFit && (isMailto || hasDirectUrl)) {
    return {
      job_id: job.job_id,
      title: job.title,
      company: job.company,
      apply_url: job.apply_url,
      fit_score: evaluation.fit_score,
      track: "track_a_auto_apply",
      status: "Auto-Apply Ready",
      flag_reason: "High fit score: Tailored CV and Cover Letter generated. Ready for one-click submission.",
      tailored_package: tailoredPackage,
      processed_at: new Date().toISOString()
    };
  }

  let flag_reason = "Complex application portal detected or low fit score.";
  if (job.apply_url.includes("linkedin.com")) {
    flag_reason = "LinkedIn Easy Apply requires manual session authentication.";
  } else if (evaluation.fit_score < 6) {
    flag_reason = `Low candidate match fit score (${evaluation.fit_score}/10). Manual review recommended.`;
  }

  return {
    job_id: job.job_id,
    title: job.title,
    company: job.company,
    apply_url: job.apply_url,
    fit_score: evaluation.fit_score,
    track: "track_b_manual_queue",
    status: "Manual Required",
    flag_reason,
    tailored_package: tailoredPackage,
    processed_at: new Date().toISOString()
  };
}
