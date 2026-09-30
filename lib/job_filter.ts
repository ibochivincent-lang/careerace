import { NormalizedJob } from "./job_normaliser";

export interface FilterConfig {
  allowed_regions: string[];
  blocked_regions: string[];
  max_age_days: number;
  allowed_job_types: Array<"remote" | "onsite" | "hybrid">;
}

export const defaultFilterConfig: FilterConfig = {
  allowed_regions: [
    "remote", "us", "usa", "united states", "uk", "united kingdom",
    "nigeria", "lagos", "europe", "eu", "canada", "worldwide", "global"
  ],
  blocked_regions: [
    "india", "pakistan", "bangladesh", "nepal", "sri lanka",
    "philippines", "indonesia", "malaysia"
  ],
  max_age_days: 7,
  allowed_job_types: ["remote", "onsite", "hybrid"]
};

export function filterJobs(jobs: NormalizedJob[], config: FilterConfig = defaultFilterConfig): NormalizedJob[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - config.max_age_days);

  return jobs.filter(job => {
    const combined = `${job.location} ${job.description}`.toLowerCase();

    // Check hard blocked regions
    const isBlocked = config.blocked_regions.some(b => combined.includes(b));
    if (isBlocked) return false;

    // Check job type preference
    if (!config.allowed_job_types.includes(job.job_type)) return false;

    // Check recency
    const posted = new Date(job.posted_date);
    if (!isNaN(posted.getTime()) && posted < cutoff) {
      return false;
    }

    return true;
  });
}
