import { NextResponse } from "next/server";
import { callFreeLlmJson } from "@/lib/free_llm";

export const maxDuration = 60;

interface ExtractedJobTarget {
  role: string;
  company: string;
  skills: string[];
  job_description: string;
  experience_level?: string;
  summary?: string;
}

/**
 * Extracts clean textual content from raw HTML
 */
function extractTextFromHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Autonomous Job Posting Scraper & ATS Calibrator
 * Supports LinkedIn, Greenhouse, Lever, Indeed, Workday, or standard career pages.
 */
export async function POST(req: Request) {
  try {
    const { url, custom_keys } = await req.json();

    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      return NextResponse.json(
        { error: "A valid job posting URL (e.g. LinkedIn, Greenhouse, or career site) is required." },
        { status: 400 }
      );
    }

    let pageText = "";

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: AbortSignal.timeout(15000),
      });

      if (response.ok) {
        const rawHtml = await response.text();
        pageText = extractTextFromHtml(rawHtml);
      }
    } catch (fetchErr) {
      console.warn("[auto-scrape] Direct fetch warning:", fetchErr);
    }

    // If direct fetch couldn't extract enough body text (e.g. strict SPA or login-wall),
    // derive context from the URL structure or fallback prompt.
    const urlLower = url.toLowerCase();
    const isLinkedIn = urlLower.includes("linkedin.com");

    const systemPrompt = `You are an expert ATS Job Specification Parser.
Analyze the provided web text or job posting URL and extract the exact target position details into a strict JSON object.

Extract:
1. "role": Exact Job Title (e.g. "Senior Marine Systems Engineer", "Lead Full Stack Architect", "DevOps Engineer").
2. "company": Organization or hiring company name (e.g. "Maersk", "Stripe", "Bourbon Offshore", "Google").
3. "skills": Array of 8 to 20 hard skills, technical competencies, tools, programming languages, or certifications required in this role.
4. "job_description": Clean, standardized summary of the key responsibilities, qualifications, and core deliverable requirements (200-400 words) for optimal ATS keyword matching.
5. "experience_level": Seniority level (e.g. "Entry", "Mid-Level", "Senior", "Lead", "Executive").
6. "summary": A concise 1-sentence synopsis of why this role exists and its primary mission.

Return strict JSON only matching this schema:
{
  "role": string,
  "company": string,
  "skills": string[],
  "job_description": string,
  "experience_level": string,
  "summary": string
}`;

    const prompt = pageText && pageText.length > 100
      ? `Job Posting URL: ${url}\n\nWebpage Content Snippet:\n${pageText.slice(0, 14000)}`
      : `Job Posting URL: ${url}\nNotice: The direct page fetch returned minimal public text. Analyze the URL path tokens, role identifiers, company names, and infer the standard industry job description and hard skills expected for this position.`;

    const extracted = await callFreeLlmJson<ExtractedJobTarget>(
      prompt,
      systemPrompt,
      custom_keys
    );

    if (extracted && extracted.role) {
      return NextResponse.json({
        success: true,
        source_url: url,
        target_role: extracted.role,
        target_company: extracted.company || "Target Organization",
        skills: Array.isArray(extracted.skills) ? extracted.skills : [],
        job_description: extracted.job_description || "",
        experience_level: extracted.experience_level || "Mid-Senior",
        summary: extracted.summary || `Target role calibrated from ${url}`
      });
    }

    // Heuristic fallback if LLM returned incomplete object
    const roleFromUrl = url.split("/").filter(Boolean).pop()?.replace(/[-_]/g, " ") || "Systems Engineer";
    return NextResponse.json({
      success: true,
      source_url: url,
      target_role: roleFromUrl.length < 50 ? roleFromUrl : "Systems Engineer",
      target_company: isLinkedIn ? "LinkedIn Opportunity" : "Target Organization",
      skills: ["Problem Solving", "Cross-Functional Collaboration", "Technical Deliverables"],
      job_description: `Target role calibrated for ${roleFromUrl}. Seeking qualified professional with proven track record delivering high-reliability operational solutions.`,
      experience_level: "Mid-Level",
      summary: `Calibrated for target role from ${url}`
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to auto-target job from link." },
      { status: 500 }
    );
  }
}
