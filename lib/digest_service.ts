import { ProcessedApplication } from "./application_router";

export interface DigestReport {
  timestamp: string;
  total_processed: number;
  auto_applied_count: number;
  manual_required_count: number;
  top_matched_jobs: Array<{
    title: string;
    company: string;
    score: number;
    apply_url: string;
    status: string;
  }>;
  summary_text: string;
}

export function generateDailyDigestReport(applications: ProcessedApplication[]): DigestReport {
  const autoApplied = applications.filter(a => a.status === "Applied");
  const manualReq = applications.filter(a => a.status === "Manual Required");

  const top_matched_jobs = applications
    .sort((a, b) => b.fit_score - a.fit_score)
    .slice(0, 5)
    .map(a => ({
      title: a.title,
      company: a.company,
      score: a.fit_score,
      apply_url: a.apply_url,
      status: a.status
    }));

  const summary_text = `Career Ace Execution Summary: ${applications.length} jobs evaluated. ${autoApplied.length} applications auto-submitted. ${manualReq.length} roles flagged for manual candidate review. Top match score: ${top_matched_jobs[0]?.score || 0}/10.`;

  return {
    timestamp: new Date().toISOString(),
    total_processed: applications.length,
    auto_applied_count: autoApplied.length,
    manual_required_count: manualReq.length,
    top_matched_jobs,
    summary_text
  };
}
