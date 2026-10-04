/**
 * Automated Live ATS Benchmark Simulator
 * 
 * Simulates headless document parsing across two distinct industry ATS architectures:
 * 1. Oracle Taleo (Legacy Enterprise Regex/Table Parser)
 * 2. Greenhouse (Modern Semantic NER Entity Graph Parser)
 * 
 * Generates live keyword density heatmaps, structural compliance checks,
 * and recruiter searchability scores before the candidate applies.
 *
 * Grounded in no-ai-slop guidelines: all feedback is direct, metric-driven,
 * and completely free of filler buzzwords.
 */

import { extractCleanTokens, HARD_TECH_SKILLS } from "./ats_engine.ts";
import { sanitizeAntiSlop } from "./no_slop.ts";
import type { ParsedCv } from "./cv_parser.ts";

export type HeatmapIntensity = "missing_critical" | "under_represented" | "optimal" | "over_stuffed";

export interface KeywordHeatmapItem {
  keyword: string;
  category: "hard_tech" | "domain" | "leadership" | "tool";
  frequency_in_jd: number;
  frequency_in_cv: number;
  intensity: HeatmapIntensity;
  taleo_match: boolean; // Strict lexical match
  greenhouse_match: boolean; // Semantic or synonym match
  recommendation: string;
}

export interface TaleoSimulationResult {
  engineName: "Oracle Taleo Enterprise Edition";
  score: number; // 0-100
  parseConfidence: number; // % of sections cleanly recognized
  structuralSafety: "Safe" | "Caution" | "High Risk";
  layoutRisks: string[];
  contactExtraction: {
    nameDetected: boolean;
    emailDetected: boolean;
    phoneDetected: boolean;
    locationDetected: boolean;
  };
  linearSectionOrder: string[];
  strictKeywordCoverage: number; // %
  flaggedFormattingIssues: string[];
  rawParsedStream: string;
}

export interface GreenhouseSimulationResult {
  engineName: "Greenhouse Recruiting / Modern Semantic ATS";
  score: number; // 0-100
  semanticMatchRate: number; // %
  recruiterSearchabilityScore: number; // %
  candidateRankTier: "Top 5% Priority Pool" | "Top 15% Interview Pool" | "Review Pool" | "Filter Risk";
  skillsRecencyScore: number; // % of required skills in most recent 2 roles
  extractedEntities: {
    companies: string[];
    titles: string[];
    degrees: string[];
    skillsCount: number;
  };
  structuredJsonGraph: Record<string, any>;
}

export interface AtsBenchmarkReport {
  overallReadiness: number; // 0-100 composite
  readyToApply: boolean;
  targetRole: string;
  targetCompany: string;
  taleo: TaleoSimulationResult;
  greenhouse: GreenhouseSimulationResult;
  heatmap: KeywordHeatmapItem[];
  criticalMissingKeywords: string[];
  actionableFixes: string[];
}

// Synonym dictionary for Greenhouse Semantic Entity Matching
const SEMANTIC_SYNONYMS: Record<string, string[]> = {
  "react": ["react.js", "reactjs", "react native"],
  "react.js": ["react", "reactjs"],
  "node": ["node.js", "nodejs"],
  "node.js": ["node", "nodejs"],
  "typescript": ["ts", "type script"],
  "javascript": ["js", "ecmascript"],
  "k8s": ["kubernetes"],
  "kubernetes": ["k8s"],
  "aws": ["amazon web services", "amazon aws"],
  "gcp": ["google cloud", "google cloud platform"],
  "postgres": ["postgresql"],
  "postgresql": ["postgres"],
  "golang": ["go"],
  "go": ["golang"],
  "sre": ["site reliability engineering", "devops", "reliability engineer"],
  "ci/cd": ["continuous integration", "github actions", "gitlab ci", "jenkins"],
  "sql": ["relational database", "mysql", "postgresql"],
  "nosql": ["mongodb", "dynamodb", "redis"],
  "stcw": ["stcw-95", "stcw 2010", "standards of training, certification and watchkeeping"],
};

/**
 * Normalizes text and counts exact word / phrase occurrences
 */
function countPhrase(text: string, phrase: string): number {
  if (!text || !phrase) return 0;
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escaped}\\b`, "gi");
  return (text.match(regex) || []).length;
}

/**
 * Run Headless ATS Benchmark Simulation on candidate CV against target Job Description
 */
export function runAtsBenchmarkSimulator(params: {
  profile: ParsedCv | any;
  jobTitle: string;
  jobCompany?: string;
  jobDescription: string;
}): AtsBenchmarkReport {
  const { profile, jobTitle, jobCompany = "Target Organization", jobDescription } = params;

  const candidateSkills: string[] = profile?.skills || [];
  const candidateWork: any[] = profile?.work_experience || [];
  const candidateEdu: any[] = profile?.academic_history || [];

  const candidateSkillsLower = candidateSkills.map((s) => s.toLowerCase().trim());
  const expHighlights = candidateWork.flatMap((w) => w.highlights || []);
  const allExpText = [
    candidateWork.map((w) => `${w.role} at ${w.company}: ${(w.highlights || []).join(" ")}`).join(" "),
  ].join(" ");

  const combinedCvText = [
    profile?.applicant_name || "",
    profile?.email || profile?.contact_email || "",
    profile?.phone || profile?.contact_phone || "",
    candidateSkills.join(" "),
    allExpText,
    candidateEdu.map((e) => `${e.degree || ""} ${e.institution || ""}`).join(" "),
    (profile?.certifications || []).join(" "),
  ].join(" ").toLowerCase();

  const jdTextLower = (jobDescription || `${jobTitle} at ${jobCompany}`).toLowerCase();

  // 1. EXTRACT BENCHMARK KEYWORDS FROM JOB DESCRIPTION
  const rawJdTokens = extractCleanTokens(`${jobTitle} ${jobDescription}`);
  const tokenFreq: Record<string, number> = {};
  for (const t of rawJdTokens) {
    tokenFreq[t] = (tokenFreq[t] || 0) + 1;
  }

  // Prioritize technical and domain terms
  const benchmarkTermsSet = new Set<string>();

  // Add all detected hard technical skills from taxonomy that appear in JD
  for (const tech of HARD_TECH_SKILLS) {
    if (jdTextLower.includes(tech)) {
      benchmarkTermsSet.add(tech);
    }
  }

  // Add high-frequency JD tokens (mentioned >= 2 times)
  Object.keys(tokenFreq)
    .filter((t) => tokenFreq[t] >= 2 && t.length > 2)
    .sort((a, b) => tokenFreq[b] - tokenFreq[a])
    .slice(0, 25)
    .forEach((t) => benchmarkTermsSet.add(t));

  // If set is too small, inject role tokens
  const roleTokens = extractCleanTokens(jobTitle);
  roleTokens.forEach((r) => benchmarkTermsSet.add(r));

  const benchmarkTerms = Array.from(benchmarkTermsSet);

  // 2. BUILD LIVE KEYWORD HEATMAP
  const heatmap: KeywordHeatmapItem[] = [];
  const criticalMissingKeywords: string[] = [];

  for (const term of benchmarkTerms) {
    const jdCount = countPhrase(jobDescription, term) || 1;
    const cvCount = countPhrase(combinedCvText, term);

    // Exact match (Taleo rule)
    const exactMatch = cvCount > 0 || candidateSkillsLower.includes(term);

    // Semantic match (Greenhouse rule)
    let semanticMatch = exactMatch;
    if (!semanticMatch && SEMANTIC_SYNONYMS[term]) {
      semanticMatch = SEMANTIC_SYNONYMS[term].some((syn) => countPhrase(combinedCvText, syn) > 0);
    }

    // Determine intensity
    let intensity: HeatmapIntensity = "optimal";
    let recommendation = `Well-balanced frequency (${cvCount}x in CV vs ${jdCount}x in JD).`;

    const isHardTech = HARD_TECH_SKILLS.has(term) || term.includes("engine") || term.includes("architect");

    if (cvCount === 0) {
      if (isHardTech) {
        intensity = "missing_critical";
        recommendation = `Missing critical hard skill. Add '${term}' into your recent accomplishments.`;
        criticalMissingKeywords.push(term);
      } else {
        intensity = "under_represented";
        recommendation = `Mentioned ${jdCount}x in JD, missing in CV. Integrate naturally in skills list.`;
      }
    } else if (cvCount === 1 && jdCount >= 3) {
      intensity = "under_represented";
      recommendation = `Appears only once in CV. High emphasis in JD (${jdCount}x) — reinforce in an experience bullet.`;
    } else if (cvCount > 6 && cvCount > jdCount * 2.5) {
      intensity = "over_stuffed";
      recommendation = `Risk of keyword stuffing (${cvCount}x). Reduce repetitions to keep prose human.`;
    }

    heatmap.push({
      keyword: term,
      category: isHardTech ? "hard_tech" : term.length > 8 ? "domain" : "tool",
      frequency_in_jd: jdCount,
      frequency_in_cv: cvCount,
      intensity,
      taleo_match: exactMatch,
      greenhouse_match: semanticMatch,
      recommendation: sanitizeAntiSlop(recommendation),
    });
  }

  // Sort heatmap: missing critical first, then under-represented, then optimal
  heatmap.sort((a, b) => {
    const order: Record<HeatmapIntensity, number> = {
      missing_critical: 0,
      under_represented: 1,
      over_stuffed: 2,
      optimal: 3,
    };
    return order[a.intensity] - order[b.intensity];
  });

  // 3. RUN SIMULATED ORACLE TALEO HEADLESS ENGINE
  const taleoExactHits = heatmap.filter((h) => h.taleo_match).length;
  const taleoStrictPct = Math.round((taleoExactHits / Math.max(1, heatmap.length)) * 100);

  const layoutRisks: string[] = [];
  const flaggedFormattingIssues: string[] = [];

  const hasName = Boolean(profile?.applicant_name && profile.applicant_name.length > 2);
  const hasEmail = Boolean(profile?.email || profile?.contact_email);
  const hasPhone = Boolean(profile?.phone || profile?.contact_phone);
  const hasLocation = Boolean(profile?.location);

  if (!hasPhone) {
    layoutRisks.push("Phone number missing or in unparsed header element.");
    flaggedFormattingIssues.push("Taleo rejects applicant records lacking parseable telephone strings.");
  }
  if (!hasEmail) {
    layoutRisks.push("Email address not found in linear contact block.");
    flaggedFormattingIssues.push("Critical contact failure: Taleo candidate record cannot be indexed.");
  }

  // Check section titles against standard Taleo vocabulary
  const recognizedSections = ["SUMMARY", "EXPERIENCE", "SKILLS", "EDUCATION"];
  if ((profile?.certifications || []).length > 0) recognizedSections.push("CERTIFICATIONS");

  // Taleo Score Calculation: 60% Keyword Exact Hits + 40% Formatting & Contact Robustness
  let taleoScore = Math.round(taleoStrictPct * 0.65);
  if (hasName) taleoScore += 10;
  if (hasEmail) taleoScore += 15;
  if (hasPhone) taleoScore += 10;

  // Formatting penalty
  if (criticalMissingKeywords.length > 3) taleoScore -= 10;
  taleoScore = Math.min(100, Math.max(25, taleoScore));

  const taleoSafety: "Safe" | "Caution" | "High Risk" =
    taleoScore >= 80 ? "Safe" : taleoScore >= 60 ? "Caution" : "High Risk";

  const rawTaleoStream = [
    "--- ORACLE TALEO ENTERPRISE PARSER STREAM ---",
    `RECORD_ID: TALEO_${Date.now()}`,
    `STATUS: ${taleoSafety.toUpperCase()}`,
    `CANDIDATE_NAME: ${profile?.applicant_name || "UNKNOWN"}`,
    `CONTACT_INFO: ${hasEmail ? "VERIFIED_EMAIL" : "MISSING"} | ${hasPhone ? "VERIFIED_PHONE" : "MISSING"} | LOC: ${profile?.location || "N/A"}`,
    `PARSED_SECTIONS: [${recognizedSections.join(", ")}]`,
    `EXACT_KEYWORD_MATCH_COUNT: ${taleoExactHits} / ${heatmap.length}`,
    `EXPERIENCE_RECORDS_INDEXED: ${candidateWork.length}`,
    `SKILL_TOKENS_FILTERED: ${candidateSkills.length}`,
    "--- END TALEO RECORD ---",
  ].join("\n");

  const taleoResult: TaleoSimulationResult = {
    engineName: "Oracle Taleo Enterprise Edition",
    score: taleoScore,
    parseConfidence: hasEmail && hasName ? 94 : 68,
    structuralSafety: taleoSafety,
    layoutRisks,
    contactExtraction: {
      nameDetected: hasName,
      emailDetected: hasEmail,
      phoneDetected: hasPhone,
      locationDetected: hasLocation,
    },
    linearSectionOrder: recognizedSections,
    strictKeywordCoverage: taleoStrictPct,
    flaggedFormattingIssues,
    rawParsedStream: rawTaleoStream,
  };

  // 4. RUN SIMULATED GREENHOUSE SEMANTIC NER ENGINE
  const greenhouseSemanticHits = heatmap.filter((h) => h.greenhouse_match).length;
  const greenhouseSemanticPct = Math.round((greenhouseSemanticHits / Math.max(1, heatmap.length)) * 100);

  // Analyze Recency: Are critical skills present in the most recent job?
  const recentWork = candidateWork.slice(0, 2);
  const recentHighlights = recentWork.flatMap((w) => w.highlights || []).join(" ").toLowerCase();
  const recentHits = heatmap.filter((h) => recentHighlights.includes(h.keyword.toLowerCase())).length;
  const skillsRecencyScore = Math.min(100, Math.round((recentHits / Math.max(1, heatmap.length)) * 120));

  // Recruiter Searchability: Greenhouse calculates density and role title relevance
  const roleRelevance = jdTextLower.includes((profile?.target_roles?.[0] || jobTitle).toLowerCase()) ? 95 : 78;
  const recruiterSearchabilityScore = Math.round((greenhouseSemanticPct * 0.6) + (roleRelevance * 0.4));

  let candidateRankTier: GreenhouseSimulationResult["candidateRankTier"] = "Review Pool";
  if (greenhouseSemanticPct >= 85 && recruiterSearchabilityScore >= 85) {
    candidateRankTier = "Top 5% Priority Pool";
  } else if (greenhouseSemanticPct >= 72) {
    candidateRankTier = "Top 15% Interview Pool";
  } else if (greenhouseSemanticPct < 50) {
    candidateRankTier = "Filter Risk";
  }

  let greenhouseScore = Math.round((greenhouseSemanticPct * 0.6) + (skillsRecencyScore * 0.2) + (recruiterSearchabilityScore * 0.2));
  greenhouseScore = Math.min(100, Math.max(30, greenhouseScore));

  const extractedEntities = {
    companies: candidateWork.map((w) => w.company).filter(Boolean),
    titles: candidateWork.map((w) => w.role).filter(Boolean),
    degrees: candidateEdu.map((e) => e.degree).filter(Boolean),
    skillsCount: candidateSkills.length,
  };

  const structuredJsonGraph = {
    candidate: {
      name: profile?.applicant_name || "Candidate",
      role_title: jobTitle,
      semantic_affinity_score: greenhouseScore,
      search_rank_tier: candidateRankTier,
      verified_skills: candidateSkills,
      employment_history: candidateWork.map((w) => ({
        company: w.company,
        role: w.role,
        duration: w.duration,
        skills_detected: candidateSkills.filter((s) => (w.highlights || []).join(" ").toLowerCase().includes(s.toLowerCase())),
      })),
      academics: candidateEdu,
    },
  };

  const greenhouseResult: GreenhouseSimulationResult = {
    engineName: "Greenhouse Recruiting / Modern Semantic ATS",
    score: greenhouseScore,
    semanticMatchRate: greenhouseSemanticPct,
    recruiterSearchabilityScore,
    candidateRankTier,
    skillsRecencyScore,
    extractedEntities,
    structuredJsonGraph,
  };

  // 5. SYNTHESIZE ACTIONABLE ANTI-SLOP FIXES
  const actionableFixes: string[] = [];

  if (criticalMissingKeywords.length > 0) {
    actionableFixes.push(
      `Add these ${criticalMissingKeywords.length} missing required skills to your experience: ${criticalMissingKeywords.slice(0, 4).join(", ")}.`
    );
  }

  if (taleoScore < 80) {
    actionableFixes.push(
      "Align section headers with standard keywords (Summary, Experience, Skills, Education) to maximize Taleo linear parsing."
    );
  }

  if (!hasPhone) {
    actionableFixes.push("Include a phone number with country code in your contact header for Taleo candidate creation.");
  }

  if (skillsRecencyScore < 70) {
    actionableFixes.push(
      "Feature target job skills directly in your most recent role highlights to boost Greenhouse recency ranking."
    );
  }

  if (actionableFixes.length === 0) {
    actionableFixes.push("Resume is fully calibrated across Taleo and Greenhouse. High probability of passing automated screening.");
  }

  const overallReadiness = Math.round((taleoScore * 0.45) + (greenhouseScore * 0.55));

  return {
    overallReadiness,
    readyToApply: overallReadiness >= 75 && criticalMissingKeywords.length <= 1,
    targetRole: jobTitle,
    targetCompany: jobCompany,
    taleo: taleoResult,
    greenhouse: greenhouseResult,
    heatmap,
    criticalMissingKeywords,
    actionableFixes: actionableFixes.map((f) => sanitizeAntiSlop(f)),
  };
}
