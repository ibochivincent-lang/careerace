export interface RawJob {
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
  job_type?: "remote" | "onsite" | "hybrid";
}

function parseRssXml(xml: string, sourceName: string): RawJob[] {
  const jobs: RawJob[] = [];
  const itemBlocks = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
  
  for (const block of itemBlocks.slice(0, 15)) {
    const getTag = (tag: string) => {
      const m = block.match(
        new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`)
      );
      return m ? (m[1] || m[2] || "").trim() : "";
    };

    const rawTitle = getTag("title");
    const link = getTag("link");
    const pubDate = getTag("pubDate");
    const desc = getTag("description").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const region = getTag("region") || getTag("location") || "Remote";

    if (rawTitle && link) {
      let company = "Tech Company";
      let title = rawTitle;

      if (rawTitle.includes(":")) {
        const parts = rawTitle.split(":");
        company = parts[0].trim();
        title = parts.slice(1).join(":").trim();
      } else if (rawTitle.includes(" is hiring ")) {
        const parts = rawTitle.split(" is hiring ");
        company = parts[0].trim();
        title = parts[1].trim();
      } else if (rawTitle.includes(" at ")) {
        const parts = rawTitle.split(" at ");
        title = parts[0].trim();
        company = parts.slice(1).join(" at ").trim();
      }

      const hashKey = `${link}_${sourceName}`;
      const job_id = `job_${Buffer.from(hashKey).toString("hex").slice(0, 14)}`;

      jobs.push({
        job_id,
        title: title || rawTitle,
        company: company || "See listing",
        location: region,
        description: desc.slice(0, 350),
        apply_url: link,
        source: sourceName,
        posted_date: pubDate || new Date().toISOString(),
        is_remote: true,
        job_type: "remote",
      });
    }
  }
  return jobs;
}

async function fetchWithTimeout(url: string, timeoutMs: number = 5000, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent": "CareerAce-JobHarvester/1.0",
        ...(options.headers || {}),
      },
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

export async function harvestJobsFromSources(
  query: string = "software engineer",
  sourceFilter: string = "all"
): Promise<RawJob[]> {
  const harvested: RawJob[] = [];
  const filter = sourceFilter.toLowerCase().trim();

  const shouldRun = (sourceName: string) => {
    if (filter === "all" || !filter) return true;
    return filter.includes(sourceName.toLowerCase()) || sourceName.toLowerCase().includes(filter);
  };

  const tasks: Promise<void>[] = [];

  // Source 1: Remotive Public API (Search Query Aware)
  if (shouldRun("remotive")) {
    tasks.push(
      (async () => {
        try {
          const queryTerm = encodeURIComponent(query);
          const remotiveUrl = queryTerm
            ? `https://remotive.com/api/remote-jobs?search=${queryTerm}&limit=30`
            : "https://remotive.com/api/remote-jobs?category=software-dev&limit=30";
          const res = await fetchWithTimeout(remotiveUrl, 6000);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.jobs)) {
              for (const j of data.jobs) {
                const job_id = `job_rem_${j.id || Buffer.from(j.url || j.title).toString("hex").slice(0, 12)}`;
                harvested.push({
                  job_id,
                  title: j.title || "Software Developer",
                  company: j.company_name || "Tech Company",
                  location: j.candidate_required_location || "Remote",
                  description: (j.description || "").replace(/<[^>]+>/g, " ").slice(0, 350),
                  apply_url: j.url || "",
                  source: "Remotive",
                  posted_date: j.publication_date || new Date().toISOString(),
                  is_remote: true,
                  salary: j.salary || "",
                  job_type: "remote",
                });
              }
            }
          }
        } catch (_e) {}
      })()
    );
  }

  // Source 2: Arbeitnow Public REST API (300+ Verified Global Tech Jobs)
  if (shouldRun("arbeitnow")) {
    tasks.push(
      (async () => {
        try {
          const res = await fetchWithTimeout("https://www.arbeitnow.com/api/job-board-api", 6000);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.data)) {
              const qLower = query.toLowerCase().trim();
              const relevant = data.data.filter((j: any) => {
                if (!qLower || qLower === "software engineer" || qLower === "developer" || qLower === "tech") {
                  return true;
                }
                const titleMatch = (j.title || "").toLowerCase().includes(qLower);
                const tagMatch = (j.tags || []).some((t: string) => t.toLowerCase().includes(qLower));
                const descMatch = (j.description || "").toLowerCase().includes(qLower);
                return titleMatch || tagMatch || descMatch;
              });

              for (const j of relevant.slice(0, 35)) {
                const job_id = `job_arb_${j.slug || Buffer.from(j.url || j.title).toString("hex").slice(0, 12)}`;
                harvested.push({
                  job_id,
                  title: j.title || "Software Engineer",
                  company: j.company_name || "Tech Employer",
                  location: j.location || (j.remote ? "Remote" : "Global"),
                  description: (j.description || "").replace(/<[^>]+>/g, " ").slice(0, 350),
                  apply_url: j.url || "",
                  source: "Arbeitnow",
                  posted_date: new Date(j.created_at * 1000).toISOString() || new Date().toISOString(),
                  is_remote: Boolean(j.remote),
                  salary: (j.tags && j.tags.length > 0) ? j.tags.slice(0, 3).join(", ") : "Competitive",
                  job_type: j.remote ? "remote" : "hybrid",
                });
              }
            }
          }
        } catch (_e) {}
      })()
    );
  }

  // Source 3: Jobicy v2 Remote Jobs REST API (Keyword & Tag Filtered)
  if (shouldRun("jobicy")) {
    tasks.push(
      (async () => {
        try {
          const qParam = encodeURIComponent(query.trim());
          const jobicyUrl = `https://jobicy.com/api/v2/remote-jobs?count=25&tag=${qParam}`;
          const res = await fetchWithTimeout(jobicyUrl, 6000);
          if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.jobs) && data.jobs.length > 0) {
              for (const j of data.jobs) {
                const job_id = `job_jby_${j.id || Buffer.from(j.url || j.jobTitle).toString("hex").slice(0, 12)}`;
                harvested.push({
                  job_id,
                  title: j.jobTitle || "Software Engineer",
                  company: j.companyName || "Tech Company",
                  location: j.jobGeo || "Worldwide Remote",
                  description: (j.jobExcerpt || j.jobDescription || "").replace(/<[^>]+>/g, " ").slice(0, 350),
                  apply_url: j.url || "",
                  source: "Jobicy",
                  posted_date: j.pubDate || new Date().toISOString(),
                  is_remote: true,
                  salary: j.annualSalaryMin ? `$${j.annualSalaryMin} - $${j.annualSalaryMax || ''}` : (j.jobLevel || "Competitive"),
                  job_type: "remote",
                });
              }
            }
          }
        } catch (_e) {}
      })()
    );
  }

  // Source 4: WeWorkRemotely RSS
  if (shouldRun("weworkremotely")) {
    tasks.push(
      (async () => {
        try {
          const res = await fetchWithTimeout(
            "https://weworkremotely.com/categories/remote-programming-jobs.rss",
            5000
          );
          if (res.ok) {
            const xml = await res.text();
            harvested.push(...parseRssXml(xml, "WeWorkRemotely"));
          }
        } catch (_e) {}
      })()
    );
  }

  // Source 5: RemoteOK RSS
  if (shouldRun("remoteok")) {
    tasks.push(
      (async () => {
        try {
          const res = await fetchWithTimeout(
            "https://remoteok.com/remote-dev-jobs.rss",
            5000
          );
          if (res.ok) {
            const xml = await res.text();
            harvested.push(...parseRssXml(xml, "RemoteOK"));
          }
        } catch (_e) {}
      })()
    );
  }

  // Source 6: Himalayas Software Engineering RSS
  if (shouldRun("himalayas")) {
    tasks.push(
      (async () => {
        try {
          const res = await fetchWithTimeout(
            "https://himalayas.app/jobs/software-engineering/feed",
            5000
          );
          if (res.ok) {
            const xml = await res.text();
            harvested.push(...parseRssXml(xml, "Himalayas"));
          }
        } catch (_e) {}
      })()
    );
  }

  // Source 7: Nodesk Engineering RSS
  if (shouldRun("nodesk")) {
    tasks.push(
      (async () => {
        try {
          const res = await fetchWithTimeout(
            "https://nodesk.co/remote-jobs/engineering/feed/",
            5000
          );
          if (res.ok) {
            const xml = await res.text();
            harvested.push(...parseRssXml(xml, "Nodesk"));
          }
        } catch (_e) {}
      })()
    );
  }

  // Source 8: FreshRemote RSS
  if (shouldRun("freshremote")) {
    tasks.push(
      (async () => {
        try {
          const res = await fetchWithTimeout(
            "https://freshremote.work/feed/",
            5000
          );
          if (res.ok) {
            const xml = await res.text();
            harvested.push(...parseRssXml(xml, "FreshRemote"));
          }
        } catch (_e) {}
      })()
    );
  }

  // Source 9: Google Jobs & Indeed via SerpAPI (Environment-authenticated)
  const serpApiKey = process.env.SERPAPI_API_KEY;
  if (serpApiKey && shouldRun("google")) {
    tasks.push(
      (async () => {
        try {
          const serpUrl = `https://serpapi.com/search?engine=google_jobs&q=${encodeURIComponent(
            query + " remote"
          )}&api_key=${serpApiKey}&num=20`;
          const res = await fetchWithTimeout(serpUrl, 6000);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.jobs_results)) {
              for (const j of data.jobs_results) {
                const apply_url =
                  j.apply_options?.[0]?.link ||
                  j.share_link ||
                  `https://www.google.com/search?q=${encodeURIComponent(
                    (j.title || "") + " " + (j.company_name || "")
                  )}`;
                const job_id = `job_serp_${Buffer.from(apply_url).toString("hex").slice(0, 12)}`;
                harvested.push({
                  job_id,
                  title: j.title || "Software Engineer",
                  company: j.company_name || "Enterprise Employer",
                  location: j.location || "Remote",
                  description: (j.description || "").slice(0, 350),
                  apply_url,
                  source: "Google Jobs",
                  posted_date: new Date().toISOString(),
                  is_remote: true,
                  salary: j.detected_extensions?.salary || "",
                  job_type: "remote",
                });
              }
            }
          }
        } catch (_e) {}
      })()
    );
  }

  // Source 9b: Indeed Live Feed via SerpAPI
  if (serpApiKey && (shouldRun("indeed") || shouldRun("all"))) {
    tasks.push(
      (async () => {
        try {
          const indeedUrl = `https://serpapi.com/search.json?engine=indeed&q=${encodeURIComponent(
            query
          )}&api_key=${serpApiKey}&num=20`;
          const res = await fetchWithTimeout(indeedUrl, 6000);
          if (res.ok) {
            const data = await res.json();
            const results = data.organic_results || data.jobs_results || [];
            if (Array.isArray(results)) {
              for (const j of results) {
                const apply_url = j.link || j.job_link || `https://www.indeed.com/viewjob?jk=${j.job_id || ""}`;
                const job_id = `job_ind_${Buffer.from(apply_url).toString("hex").slice(0, 12)}`;
                harvested.push({
                  job_id,
                  title: j.title || "Software Engineer",
                  company: j.company || j.company_name || "Indeed Employer",
                  location: j.location || "Remote Worldwide",
                  description: (j.snippet || j.description || "").slice(0, 350),
                  apply_url,
                  source: "Indeed (SerpAPI)",
                  posted_date: j.pubDate || new Date().toISOString(),
                  is_remote: true,
                  salary: j.salary || "",
                  job_type: "remote",
                });
              }
            }
          }
        } catch (_e) {}
      })()
    );
  }

  // Source 9c: RapidAPI JSearch (Indeed, LinkedIn, Glassdoor aggregator)
  const rapidApiKey = process.env.RAPIDAPI_KEY || process.env.INDEED_RAPIDAPI_KEY;
  if (rapidApiKey && (shouldRun("indeed") || shouldRun("jsearch") || shouldRun("all"))) {
    tasks.push(
      (async () => {
        try {
          const jsearchUrl = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(
            query + " jobs"
          )}&page=1&num_pages=1`;
          const res = await fetchWithTimeout(jsearchUrl, 6000, {
            headers: {
              "X-RapidAPI-Key": rapidApiKey,
              "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
            },
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.data)) {
              for (const j of data.data) {
                const apply_url = j.job_apply_link || j.job_google_link || "";
                const job_id = `job_js_${j.job_id || Buffer.from(apply_url).toString("hex").slice(0, 12)}`;
                harvested.push({
                  job_id,
                  title: j.job_title || "Software Engineer",
                  company: j.employer_name || "Enterprise Employer",
                  location: `${j.job_city || ""}, ${j.job_country || "Remote"}`.trim(),
                  description: (j.job_description || "").slice(0, 350),
                  apply_url,
                  source: "Indeed / JSearch API",
                  posted_date: j.job_posted_at_datetime_utc || new Date().toISOString(),
                  is_remote: Boolean(j.job_is_remote),
                  salary: j.job_salary || (j.job_min_salary ? `$${j.job_min_salary} - $${j.job_max_salary}` : ""),
                  job_type: j.job_is_remote ? "remote" : "hybrid",
                });
              }
            }
          }
        } catch (_e) {}
      })()
    );
  }

  // Source 10: Jobberman Nigeria Remote Tech listings
  if (shouldRun("jobberman")) {
    tasks.push(
      (async () => {
        try {
          const res = await fetchWithTimeout(
            "https://www.jobberman.com/jobs/software-data/remote/full-time",
            5000
          );
          if (res.ok) {
            const html = await res.text();
            const jobBlocks =
              html.match(/<a[^>]+href="(\/listings\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g) || [];
            for (const block of jobBlocks.slice(0, 10)) {
              const linkMatch = block.match(/href="(\/listings\/[^"]+)"/);
              const titleMatch = block.match(/<p[^>]*class="[^"]*text-lg[^"]*"[^>]*>([\s\S]*?)<\/p>/);
              const companyMatch = block.match(/<p[^>]*class="[^"]*text-link[^"]*"[^>]*>([\s\S]*?)<\/p>/);

              const stripTags = (s?: string) => (s || "").replace(/<[^>]+>/g, "").trim();
              const link = linkMatch ? `https://www.jobberman.com${linkMatch[1]}` : "";
              const title = stripTags(titleMatch?.[1]) || "Software Engineer";
              const company = stripTags(companyMatch?.[1]) || "Nigerian Tech Employer";

              if (link) {
                const job_id = `job_jbm_${Buffer.from(link).toString("hex").slice(0, 12)}`;
                harvested.push({
                  job_id,
                  title,
                  company,
                  location: "Nigeria / Remote",
                  description: `Software opening on Jobberman Nigeria: ${title} at ${company}.`,
                  apply_url: link,
                  source: "Jobberman",
                  posted_date: new Date().toISOString(),
                  is_remote: true,
                  job_type: "remote",
                });
              }
            }
          }
        } catch (_e) {}
      })()
    );
  }

  await Promise.allSettled(tasks);

  return harvested;
}
