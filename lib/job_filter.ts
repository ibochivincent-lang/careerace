import type { NormalizedJob } from "./job_normaliser.ts";

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
  blocked_regions: [],
  max_age_days: 14,
  allowed_job_types: ["remote", "onsite", "hybrid"]
};

export function filterJobs(jobs: NormalizedJob[], config: FilterConfig = defaultFilterConfig): NormalizedJob[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - config.max_age_days);

  return jobs.filter(job => {
    const combined = `${job.location} ${job.description}`.toLowerCase();

    // Check blocked regions with word boundaries if configured
    if (config.blocked_regions && config.blocked_regions.length > 0) {
      const isBlocked = config.blocked_regions.some(b => {
        const regex = new RegExp(`\\b${b.trim()}\\b`, "i");
        return regex.test(job.location);
      });
      if (isBlocked) return false;
    }

    // Check job type preference
    if (config.allowed_job_types && !config.allowed_job_types.includes(job.job_type)) {
      return false;
    }

    // Check recency
    const posted = new Date(job.posted_date);
    if (!isNaN(posted.getTime()) && posted < cutoff) {
      return false;
    }

    return true;
  });
}
