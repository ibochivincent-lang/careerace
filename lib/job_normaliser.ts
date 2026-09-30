import { RawJob } from "./job_harvester";

export interface NormalizedJob {
  job_id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  apply_url: string;
  source: string;
  posted_date: string;
  is_remote: boolean;
  salary?: string;
  job_type: "remote" | "onsite" | "hybrid";
}

export function normalizeAndDeduplicateJobs(rawJobs: RawJob[]): NormalizedJob[] {
  const seen = new Set<string>();
  const normalized: NormalizedJob[] = [];

  for (const job of rawJobs) {
    const key = job.apply_url || `${job.title.toLowerCase()}_${job.company.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const job_id = `job_${Buffer.from(key).toString("hex").substring(0, 12)}`;

    let job_type: "remote" | "onsite" | "hybrid" = job.job_type || "remote";
    const locLower = job.location.toLowerCase();
    if (locLower.includes("hybrid")) {
      job_type = "hybrid";
    } else if (locLower.includes("onsite") || locLower.includes("office")) {
      job_type = "onsite";
    }

    normalized.push({
      job_id,
      title: job.title.trim(),
      company: job.company.trim(),
      location: job.location.trim() || "Remote",
      description: job.description.trim(),
      apply_url: job.apply_url.trim(),
      source: job.source,
      posted_date: job.posted_date,
      is_remote: job.is_remote,
      salary: job.salary || "Competitive",
      job_type
    });
  }

  return normalized;
}
