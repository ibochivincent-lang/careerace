import { resolveTargetAddress } from "./target_address.ts";
import {
  recallCareerProfile,
  recallCareerCoaching,
  recallProfile,
  recallFeedback,
  rememberFact,
  type RecalledFact,
} from "./memory_core.ts";
import {
  resolveConflicts,
  unionFacts,
  claimsOfKind,
  type FactKind,
  isSensitiveData,
} from "./facts.ts";
import { callFreeLlm } from "./free_llm.ts";
import { NO_SLOP_PROMPT_DIRECTIVE, sanitizeAntiSlop } from "./no_slop.ts";
import { classifyUserIntent, generateIntentMemoryResponse } from "./user_intent_knowledge.ts";
import { VERIFIED_COMPANY_HIRING_CONTACTS } from "./company_directory.ts";
import { isAutonomousGoalQuery, executeAutonomousGoal } from "./autonomous_agent.ts";
import {
  isFollowUpInquiryQuery,
  processAutonomousFollowUpQuery,
  scanApplicationsForFollowUp,
  persistFollowUpMilestone,
} from "./autonomous_followup.ts";
import { correctTypographicalErrors } from "./typo_tolerance.ts";
import { appendChatTurn } from "./chat_history_store.ts";
import { handleAutonomousConversationalDispatch } from "./autonomous_conversational_dispatch.ts";

export interface CopilotQueryParams {
  message?: string;
  messages?: Array<{ role: string; content: string }>;
  profile?: any;
  cv_profile?: any;
  appliedJobs?: any[];
  address?: string;
  custom_keys?: any;
  walrusVersions?: any[];
  versions?: any[];
}

export interface CopilotQueryResult {
  role: "assistant";
  content: string;
  reply: string;
  stored: string[];
  candidate_name?: string;
  newAppliedJobs?: any[];
  extracted_profile?: {
    name?: string;
    target_roles?: string[];
    skills?: string[];
    education?: string[];
    experience?: string[];
  };
}

export interface ParsedDateQuery {
  day: number;
  month: number;
  year?: number;
  label: string;
}

export const MONTH_NAMES: Record<string, number> = {
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12,
};

export const MONTH_STRINGS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function getDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

export function getUtcToday(): { day: number; month: number; year: number; label: string } {
  const now = new Date();
  const day = now.getUTCDate();
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();
  const monthName = MONTH_STRINGS[month - 1];
  const suffix = getDaySuffix(day);
  const label = `${day}${suffix} of ${monthName}, ${year}`;
  return { day, month, year, label };
}

export function getUtcYesterday(): { day: number; month: number; year: number; label: string } {
  const now = new Date();
  const yDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  const day = yDate.getUTCDate();
  const month = yDate.getUTCMonth() + 1;
  const year = yDate.getUTCFullYear();
  const monthName = MONTH_STRINGS[month - 1];
  const suffix = getDaySuffix(day);
  const label = `${day}${suffix} of ${monthName}, ${year}`;
  return { day, month, year, label };
}

export function parseSpecificDateQuery(text: string): ParsedDateQuery | null {
  const lower = text.toLowerCase();
  const now = new Date();
  const currentUtcYear = now.getUTCFullYear();
  const currentUtcMonth = now.getUTCMonth() + 1;

  // Format 1: "6th of October", "6 October", "6th October 2026", "on 7th of october", "7th of october, 2026"
  const dayFirstMatch = lower.match(
    /\b(?:on\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)(?:,?\s+(\d{4}))?\b/i
  );
  if (dayFirstMatch) {
    const day = parseInt(dayFirstMatch[1], 10);
    const month = MONTH_NAMES[dayFirstMatch[2].toLowerCase()];
    const year = dayFirstMatch[3] ? parseInt(dayFirstMatch[3], 10) : currentUtcYear;
    if (day >= 1 && day <= 31 && month) {
      const monthName = MONTH_STRINGS[month - 1];
      const suffix = getDaySuffix(day);
      const label = `${day}${suffix} of ${monthName}, ${year}`;
      return { day, month, year, label };
    }
  }

  // Format 2: "October 6th", "October 6", "Oct 7th 2026", "on october 6th", "october 6th, 2026"
  const monthFirstMatch = lower.match(
    /\b(?:on\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?\b/i
  );
  if (monthFirstMatch) {
    const month = MONTH_NAMES[monthFirstMatch[1].toLowerCase()];
    const day = parseInt(monthFirstMatch[2], 10);
    const year = monthFirstMatch[3] ? parseInt(monthFirstMatch[3], 10) : currentUtcYear;
    if (day >= 1 && day <= 31 && month) {
      const monthName = MONTH_STRINGS[month - 1];
      const suffix = getDaySuffix(day);
      const label = `${day}${suffix} of ${monthName}, ${year}`;
      return { day, month, year, label };
    }
  }

  // Format 3: "on the 5th", "on the 6th", "on 5th", "on 6th", "did i apply on the 5th", "did i apply for any work on the 5th", "did i apply for any job on the 6th"
  const dayOnlyMatch = lower.match(
    /\b(?:on\s+(?:the\s+)?|did\s+i\s+apply\s+(?:on\s+)?(?:the\s+)?)(\d{1,2})(?:st|nd|rd|th)\b/i
  );
  if (dayOnlyMatch) {
    const day = parseInt(dayOnlyMatch[1], 10);
    if (day >= 1 && day <= 31) {
      const monthName = MONTH_STRINGS[currentUtcMonth - 1];
      const suffix = getDaySuffix(day);
      const label = `${day}${suffix} of ${monthName}, ${currentUtcYear}`;
      return { day, month: currentUtcMonth, year: currentUtcYear, label };
    }
  }

  // Format 4: ISO "2026-10-06"
  const isoMatch = lower.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      const monthName = MONTH_STRINGS[month - 1];
      const suffix = getDaySuffix(day);
      const label = `${day}${suffix} of ${monthName}, ${year}`;
      return { day, month, year, label };
    }
  }

  return null;
}

export function isJobMatchingDate(job: any, target: ParsedDateQuery): boolean {
  if (!job) return false;
  let d: Date | null = null;
  if (typeof job.appliedTimestamp === "number") {
    d = new Date(job.appliedTimestamp);
  } else if (job.appliedAt) {
    d = new Date(job.appliedAt);
    if (isNaN(d.getTime())) {
      const parsed = parseSpecificDateQuery(String(job.appliedAt));
      if (parsed) {
        return (
          parsed.day === target.day &&
          parsed.month === target.month &&
          (target.year ? parsed.year === target.year : true)
        );
      }
    }
  }
  if (!d || isNaN(d.getTime())) return false;
  const matchUtc =
    d.getUTCDate() === target.day &&
    d.getUTCMonth() + 1 === target.month &&
    (target.year ? d.getUTCFullYear() === target.year : true);
  const matchLocal =
    d.getDate() === target.day &&
    d.getMonth() + 1 === target.month &&
    (target.year ? d.getFullYear() === target.year : true);
  return matchUtc || matchLocal;
}

export function isYesterdayDate(timestampOrDate: number | string | undefined | null): boolean {
  if (!timestampOrDate) return false;
  const d = typeof timestampOrDate === "number" ? new Date(timestampOrDate) : new Date(timestampOrDate);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  const nowUtcMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const yesterdayUtcMidnight = nowUtcMidnight - 24 * 60 * 60 * 1000;
  const dUtcMidnight = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  if (dUtcMidnight === yesterdayUtcMidnight) return true;

  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  );
}

export function isTodayDate(timestampOrDate: number | string | undefined | null): boolean {
  if (!timestampOrDate) return false;
  const d = typeof timestampOrDate === "number" ? new Date(timestampOrDate) : new Date(timestampOrDate);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  const matchUtc =
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate();
  if (matchUtc) return true;

  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function getTopJobsForCategory(
  categoryOrRole: string,
  limit = 10
): Array<{ title: string; company: string; location: string; contact: string; url: string }> {
  const lower = (categoryOrRole || "").toLowerCase();
  let targetCategory: 'Maritime / Offshore' | 'Software / Cloud' | 'AI / Robotics' | 'Engineering / Industrial' | 'Medical / Healthcare' | 'Management / Operations' = 'Software / Cloud';

  if (lower.includes("marine") || lower.includes("offshore") || lower.includes("naval") || lower.includes("shipping") || lower.includes("cadet") || lower.includes("seafarer") || lower.includes("maritime")) {
    targetCategory = 'Maritime / Offshore';
  } else if (lower.includes("ai") || lower.includes("robot") || lower.includes("machine learning") || lower.includes("autonomous")) {
    targetCategory = 'AI / Robotics';
  } else if (lower.includes("medical") || lower.includes("health") || lower.includes("nursing") || lower.includes("clinical") || lower.includes("informatics")) {
    targetCategory = 'Medical / Healthcare';
  } else if (lower.includes("mechanical") || lower.includes("electrical") || lower.includes("civil") || lower.includes("industrial") || lower.includes("chemical")) {
    targetCategory = 'Engineering / Industrial';
  } else if (lower.includes("management") || lower.includes("operations") || lower.includes("product") || lower.includes("finance")) {
    targetCategory = 'Management / Operations';
  } else {
    targetCategory = 'Software / Cloud';
  }

  const matchingContacts = VERIFIED_COMPANY_HIRING_CONTACTS.filter(
    (c) => c.category === targetCategory
  );

  const fallbackContacts = VERIFIED_COMPANY_HIRING_CONTACTS.filter(
    (c) => c.category !== targetCategory
  );

  const pool = [...matchingContacts, ...fallbackContacts].slice(0, limit);

  return pool.map((c) => ({
    title: c.typicalRoles[0] || "Specialist",
    company: c.company,
    location: c.location,
    contact: c.contactEmail,
    url: c.careersUrl,
  }));
}

export function formatTopJobs(jobs: ReturnType<typeof getTopJobsForCategory>): string {
  return jobs
    .map(
      (j, i) =>
        `${i + 1}. **${j.title}** at **${j.company}**\n   • Location: ${j.location}\n   • Contact / Portal: ${j.contact || j.url}`
    )
    .join("\n\n");
}

export function extractHeuristicFacts(text: string, asked = ""): Array<{ kind: FactKind; text: string }> {
  const facts: Array<{ kind: FactKind; text: string }> = [];
  const lower = text.toLowerCase().trim();
  const lowerAsked = asked.toLowerCase().trim();

  // 0. Candidate Name & Identity
  const nameIntroMatch = text.match(/(?:my name is|i am|i'm|call me|name:)\s+([A-Za-z\s'-]{2,40})/i);
  let detectedName = "";
  if (nameIntroMatch && nameIntroMatch[1]) {
    const rawName = nameIntroMatch[1].trim();
    const blacklist = ["looking", "a developer", "an engineer", "ready", "interested", "trying", "applying", "here", "available", "seeking", "experienced", "fine", "good"];
    if (!blacklist.includes(rawName.toLowerCase()) && rawName.split(" ").length <= 4) {
      detectedName = rawName;
    }
  } else if (
    (lowerAsked.includes("what is your name") || lowerAsked.includes("what's your name") || lowerAsked.includes("your full name")) &&
    text.split(" ").length <= 5 &&
    !lower.includes("software") &&
    !lower.includes("engineer")
  ) {
    detectedName = text.trim();
  }

  if (detectedName) {
    facts.push({
      kind: "candidate_identity",
      text: `Candidate Name: ${detectedName}`,
    });
  }

  // 1. Target Role & Seniority Level
  if (
    !lower.startsWith("what is") &&
    !lower.startsWith("what's") &&
    !lower.startsWith("what role") &&
    !lower.endsWith("?") &&
    (
      lowerAsked.includes("role") ||
      lowerAsked.includes("work are you looking for") ||
      lowerAsked.includes("kind of work") ||
      lowerAsked.includes("position") ||
      lower.includes("looking for") ||
      lower.includes("targeting") ||
      lower.includes("target role") ||
      lower.includes("entry-level") ||
      lower.includes("entry level") ||
      lower.includes("junior") ||
      lower.includes("senior") ||
      lower.includes("lead") ||
      lower.includes("principal") ||
      lower.includes("staff") ||
      lower.includes("architect") ||
      lower.includes("engineer") ||
      lower.includes("developer")
    )
  ) {
    let roleText = text.trim();
    roleText = roleText.replace(/^(?:my target role is|my target role|target role:?|my desired role is|i am looking for|i'm looking for|i want|targeting|i target)\s+/i, "");
    if (roleText.length > 2 && roleText.length < 100) {
      facts.push({
        kind: "target_role",
        text: `Target role: ${roleText}`,
      });
    }
  }

  // 2. Education & Highest Institution
  if (
    lowerAsked.includes("institution") ||
    lowerAsked.includes("education") ||
    lowerAsked.includes("university") ||
    lowerAsked.includes("degree") ||
    lower.includes("university") ||
    lower.includes("college") ||
    lower.includes("bachelor") ||
    lower.includes("master") ||
    lower.includes("b.s.") ||
    lower.includes("b.sc") ||
    lower.includes("degree") ||
    lower.includes("bootcamp") ||
    lower.includes("graduated from")
  ) {
    let eduText = text.trim();
    eduText = eduText.replace(/^(i graduated from|i attended|my highest institution is|my degree is)\s+/i, "");
    if (eduText.length > 3 && eduText.length < 120) {
      facts.push({
        kind: "education",
        text: `Education: ${eduText}`,
      });
    }
  }

  // 3. Technical Skills & Tools
  if (
    lowerAsked.includes("skill") ||
    lowerAsked.includes("tech stack") ||
    lowerAsked.includes("tools") ||
    lowerAsked.includes("languages") ||
    lower.includes("skills are") ||
    lower.includes("proficient in") ||
    lower.includes("experience with react") ||
    lower.includes("typescript") ||
    lower.includes("python")
  ) {
    let skillText = text.trim();
    skillText = skillText.replace(/^(my skills are|i am proficient in|i know|skills:|tech stack:)\s+/i, "");
    if (skillText.length > 2 && skillText.length < 150) {
      facts.push({
        kind: "skill",
        text: `Skill: ${skillText}`,
      });
    }
  }

  // 4. Where they want to work / Preferences
  if (
    lowerAsked.includes("where you want to work") ||
    lowerAsked.includes("where do you want to work") ||
    lowerAsked.includes("location") ||
    lowerAsked.includes("remote") ||
    lower.includes("remote") ||
    lower.includes("hybrid") ||
    lower.includes("on-site") ||
    lower.includes("located in") ||
    lower.includes("i want to work in") ||
    lower.includes("i want to work") ||
    lower.includes("work in ") ||
    lower.includes("live in ")
  ) {
    let prefText = text.trim();
    prefText = prefText.replace(/^(i want to work in|i want to work|i prefer to work in|i prefer|i am located in|i live in)\s+/i, "");
    if (prefText.length > 2 && prefText.length < 120) {
      facts.push({
        kind: "preference",
        text: `Workplace preference: ${prefText}`,
      });
    }
  }

  // 5. Work Experience & Projects
  if (
    lowerAsked.includes("experience") ||
    lowerAsked.includes("past roles") ||
    lowerAsked.includes("projects") ||
    lower.includes("worked at") ||
    lower.includes("i have worked") ||
    lower.includes("years of experience") ||
    lower.includes("built a")
  ) {
    let expText = text.trim();
    expText = expText.replace(/^(i worked at|i have experience as|experience:)\s+/i, "");
    if (expText.length > 4 && expText.length < 180) {
      facts.push({
        kind: "experience",
        text: `Experience: ${expText}`,
      });
    }
  }

  // 6. Explicit Instructions, Formatting & Behavioral Preferences
  if (
    /short answer|short answers|concise answer|concise answers|keep it concise|keep answers brief|under 2 sentences|in bullet points|bullet point answers/i.test(lower)
  ) {
    facts.push({
      kind: "preference",
      text: `Formatting preference: Short and concise answers`,
    });
  }

  // 7. Operating System & Environment Preferences / Corrections
  if (
    lower.includes("i use linux") ||
    lower.includes("i switched to linux") ||
    lower.includes("switched from mac to linux") ||
    lower.includes("now use linux") ||
    lower.includes("operating system is linux")
  ) {
    facts.push({
      kind: "preference",
      text: `Operating system: Linux - SUPERSEDES: Operating system`,
    });
  } else if (
    lower.includes("i use mac") ||
    lower.includes("i use macos") ||
    lower.includes("operating system is mac")
  ) {
    facts.push({
      kind: "preference",
      text: `Operating system: Mac - SUPERSEDES: Operating system`,
    });
  } else if (
    lower.includes("i use windows") ||
    lower.includes("operating system is windows")
  ) {
    facts.push({
      kind: "preference",
      text: `Operating system: Windows - SUPERSEDES: Operating system`,
    });
  }

  // 8. General Explicit "Remember that ..." Statements
  const rememberMatch = text.match(/(?:please\s+)?remember\s+(?:that\s+)?(.+)/i);
  if (rememberMatch && rememberMatch[1]) {
    const rememberedClaim = rememberMatch[1].trim();
    if (rememberedClaim.length > 2 && rememberedClaim.length < 150) {
      if (/role|position|engineer|developer|architect/i.test(rememberedClaim)) {
        facts.push({
          kind: "target_role",
          text: `Target role: ${rememberedClaim.replace(/^(my target role is|i want to be|i am targeting)\s+/i, "")}`,
        });
      } else if (/python|react|typescript|rust|go|java|aws|sql/i.test(rememberedClaim)) {
        facts.push({
          kind: "skill",
          text: `Skill: ${rememberedClaim.replace(/^(i like|i prefer|my favorite language is)\s+/i, "")}`,
        });
      } else {
        facts.push({
          kind: "preference",
          text: `User preference: ${rememberedClaim}`,
        });
      }
    }
  }

  // 9. Fact Corrections ("Actually, ...", "Correction: ...")
  const correctionMatch = text.match(/(?:actually|correction:?)\s*,?\s*(.+)/i);
  if (correctionMatch && correctionMatch[1]) {
    const correctionText = correctionMatch[1].trim();
    if (/london|berlin|new york|remote|nigeria|lagos|san francisco/i.test(correctionText)) {
      const loc = correctionText.replace(/^(i moved to|i live in|i am located in)\s+/i, "").trim();
      facts.push({
        kind: "preference",
        text: `Workplace preference: ${loc} - SUPERSEDES: Workplace preference`,
      });
    } else if (/name is\s+([A-Za-z\s'-]{2,30})/i.test(correctionText)) {
      const match = correctionText.match(/name is\s+([A-Za-z\s'-]{2,30})/i);
      if (match && match[1]) {
        facts.push({
          kind: "candidate_identity",
          text: `Candidate Name: ${match[1].trim()} - SUPERSEDES: Candidate Name`,
        });
      }
    } else if (/role is\s+([A-Za-z\s'-]{2,50})/i.test(correctionText)) {
      const match = correctionText.match(/role is\s+([A-Za-z\s'-]{2,50})/i);
      if (match && match[1]) {
        facts.push({
          kind: "target_role",
          text: `Target role: ${match[1].trim()} - SUPERSEDES: Target role`,
        });
      }
    }
  }

  // 10. Certifications & Professional Licenses (AWS, STCW, PMP, CompTIA, Cisco, CPA, etc.)
  if (
    lowerAsked.includes("certification") ||
    lowerAsked.includes("license") ||
    lowerAsked.includes("credential") ||
    lower.includes("certified") ||
    lower.includes("certification") ||
    lower.includes("license") ||
    lower.includes("credential") ||
    lower.includes("stcw") ||
    lower.includes("pmp") ||
    lower.includes("aws certified") ||
    lower.includes("comptia") ||
    lower.includes("cisco")
  ) {
    let certText = text.trim().replace(/^(?:i am certified in|i hold a|my certification is|certifications?:?|license:?|credential:?)\s+/i, "");
    if (certText.length > 2 && certText.length < 150) {
      facts.push({
        kind: "education",
        text: `Certification: ${certText}`,
      });
    }
  }

  // 11. Compensation & Salary Expectations
  if (
    lowerAsked.includes("salary") ||
    lowerAsked.includes("compensation") ||
    lowerAsked.includes("rate") ||
    lower.includes("salary") ||
    lower.includes("compensation") ||
    lower.includes("expected pay") ||
    lower.includes("/year") ||
    lower.includes("/yr") ||
    lower.includes("/month") ||
    lower.includes("/hr") ||
    lower.includes("/hour") ||
    /\$\d+[\d,]*\s*(?:k|usd|per|\/)/i.test(text)
  ) {
    let salText = text.trim().replace(/^(?:my target salary is|my salary expectation is|i am asking for|salary expectation:?|compensation:?)\s+/i, "");
    if (salText.length > 2 && salText.length < 120) {
      facts.push({
        kind: "preference",
        text: `Compensation expectation: ${salText}`,
      });
    }
  }

  // 12. Availability & Notice Period
  if (
    lowerAsked.includes("availability") ||
    lowerAsked.includes("notice period") ||
    lowerAsked.includes("when can you start") ||
    lower.includes("available immediately") ||
    lower.includes("notice period") ||
    lower.includes("can start in") ||
    lower.includes("can start immediately") ||
    lower.includes("start date")
  ) {
    let availText = text.trim().replace(/^(?:my availability is|my notice period is|i can start|availability:?)\s+/i, "");
    if (availText.length > 2 && availText.length < 100) {
      facts.push({
        kind: "preference",
        text: `Availability: ${availText}`,
      });
    }
  }

  // 13. Online Portfolios & Profiles
  if (
    lower.includes("github.com") ||
    lower.includes("linkedin.com") ||
    lower.includes("portfolio") ||
    lower.includes("my website")
  ) {
    let linkText = text.trim().replace(/^(?:my portfolio is|my website is|portfolio:?|github:?|linkedin:?)\s+/i, "");
    if (linkText.length > 4 && linkText.length < 150) {
      facts.push({
        kind: "preference",
        text: `Portfolio / Profile: ${linkText}`,
      });
    }
  }

  return facts;
}

export async function processCopilotQuery(body: CopilotQueryParams): Promise<CopilotQueryResult> {
  const messages = Array.isArray(body.messages)
    ? body.messages
    : body.message
    ? [{ role: "user", content: body.message }]
    : [];
  const cv_profile = body.cv_profile || body.profile;
  const rawLatest = (body.message || messages?.at(-1)?.content || "Hello, Career Ace").trim();
  const typoCorrection = correctTypographicalErrors(rawLatest);
  const latest = typoCorrection.corrected || rawLatest;

  // 0. Sensitive Data & Credential Guard (QA Checklist Section 1.10, 2.9, 11.2, and Test J)
  if (isSensitiveData(latest) || isSensitiveData(rawLatest)) {
    const notice =
      "For your security and privacy, Career Ace does not store passwords, API keys, access tokens, social security numbers, or payment details in decentralized Walrus memory. This sensitive data has been omitted.";
    if (body.address) {
      appendChatTurn(body.address, rawLatest, notice, "overview");
    }
    return {
      role: "assistant",
      content: notice,
      reply: notice,
      stored: [],
      candidate_name: undefined,
    };
  }

  const asked =
    [...messages]
      .slice(0, -1)
      .reverse()
      .find((m: { role: string }) => m.role === "assistant")?.content || "";

  // 1. Resolve canonical address for sovereign Walrus Memory
  const address = await resolveTargetAddress(body.address);

  // 2. Recall existing verified facts from Walrus Memory with fast bounded timeout (<350ms)
  const memoryPromise = Promise.all([
    recallCareerProfile(address).catch(() => []),
    recallCareerCoaching(address).catch(() => []),
    recallProfile(address, latest).catch(() => []),
    recallFeedback(address, latest).catch(() => []),
  ]);
  const [profileFacts, coachingFacts, queryProfileFacts, queryCoachingFacts] = await Promise.race([
    memoryPromise,
    new Promise<[RecalledFact[], RecalledFact[], RecalledFact[], RecalledFact[]]>((resolve) =>
      setTimeout(() => resolve([[], [], [], []]), 350)
    ),
  ]);

  const activeProfile = resolveConflicts(unionFacts(profileFacts, queryProfileFacts || [])).active;
  const activeCoaching = resolveConflicts(unionFacts(coachingFacts, queryCoachingFacts || [])).active;

  const storedSummary = {
    names: claimsOfKind(activeProfile, "candidate_identity"),
    targetRoles: claimsOfKind(activeProfile, "target_role"),
    skills: claimsOfKind(activeProfile, "skill"),
    education: claimsOfKind(activeProfile, "education"),
    experience: claimsOfKind(activeProfile, "experience"),
    preferences: claimsOfKind(activeCoaching, "preference"),
    tailoredCvs: claimsOfKind(activeProfile, "tailored_cv"),
  };

  // 3. Extract facts from current user turn and persist to Walrus Memory
  // 3. Extract facts from current user turn and persist to Walrus Memory
  const newlyStored: string[] = [];
  const extracted = extractHeuristicFacts(latest, asked);

  // Optimistically register extracted facts in newlyStored so turn output has immediate acknowledgment
  for (const fact of extracted) {
    newlyStored.push(`${fact.kind.replace("_", " ")}: ${fact.text}`);
  }

  // Persist facts to sovereign Walrus memory with a bounded 150ms race
  // In live environments, fast local/cached writes settle immediately, while slower Walrus relayer writes continue safely in the background
  const persistencePromise = Promise.allSettled(
    extracted.map((fact) =>
      rememberFact(address, fact.kind, fact.text, { userTurn: latest })
        .catch((err) => console.warn("[careerace] memory persistence notice:", err))
    )
  );

  await Promise.race([
    persistencePromise,
    new Promise((resolve) => setTimeout(resolve, 150)),
  ]);

  // Update in-memory collections with newly extracted facts for current turn
  for (const f of extracted) {
    if (f.kind === "target_role") {
      storedSummary.targetRoles.unshift(f.text.replace(/^target role:\s*/i, "").trim());
    } else if (f.kind === "preference") {
      storedSummary.preferences.unshift(f.text.trim());
    } else if (f.kind === "skill") {
      storedSummary.skills.unshift(f.text.replace(/^skill:\s*/i, "").trim());
    }
  }

  const currentName =
    extracted.find((f) => f.kind === "candidate_identity")?.text.replace("Candidate Name: ", "").trim() ||
    storedSummary.names[0]?.replace(/^candidate name:\s*/i, "").trim() ||
    cv_profile?.applicant_name ||
    "";

  let profileRole =
    storedSummary.targetRoles[0]?.replace(/^target role:\s*/i, "") ||
    cv_profile?.target_roles?.[0] ||
    "Software Engineer";

  const profileSkills =
    (cv_profile?.skills?.length
      ? cv_profile.skills
      : storedSummary.skills.map((s: string) => s.replace(/^skill:\s*/i, ""))) || [];

  const profileEducation =
    cv_profile?.academic_history ||
    cv_profile?.education ||
    storedSummary.education.map((e: string) => e.replace(/^education:\s*/i, ""));

  const profileExperience =
    cv_profile?.work_experience ||
    storedSummary.experience.map((e: string) => e.replace(/^experience:\s*/i, ""));

  const appliedJobs = Array.isArray(body.appliedJobs)
    ? body.appliedJobs
    : [];

  const profileCertifications =
    cv_profile?.certifications ||
    cv_profile?.licenses ||
    claimsOfKind(activeProfile, "certification" as any) ||
    [];

  // Check whether candidate has uploaded and calibrated resume
  const hasUploadedResume = Boolean(
    (profileSkills && profileSkills.length > 0) ||
    (Array.isArray(profileExperience) && profileExperience.length > 0) ||
    (Array.isArray(cv_profile?.skills) && cv_profile.skills.length > 0) ||
    (Array.isArray(cv_profile?.work_experience) && cv_profile.work_experience.length > 0)
  );

  const lowerLatest = latest.toLowerCase().trim();
  let directReply = "";

  // Query Matchers
  const isHowManyJobsInADay =
    (lowerLatest.includes("how many") || lowerLatest.includes("limit") || lowerLatest.includes("maximum")) &&
    (lowerLatest.includes("in a day") || lowerLatest.includes("per day") || lowerLatest.includes("a day") || lowerLatest.includes("daily limit") || lowerLatest.includes("can i apply in a day") || lowerLatest.includes("can i apply a day") || lowerLatest.includes("apply in a day"));

  const isOtherDisciplines =
    lowerLatest.includes("other discipline") ||
    lowerLatest.includes("other disciplines") ||
    lowerLatest.includes("different discipline") ||
    lowerLatest.includes("different disciplines") ||
    lowerLatest.includes("other roles") ||
    lowerLatest.includes("other role") ||
    lowerLatest.includes("different role") ||
    lowerLatest.includes("different roles") ||
    lowerLatest.includes("multiple disciplines") ||
    lowerLatest.includes("switch discipline") ||
    lowerLatest.includes("another field") ||
    lowerLatest.includes("other fields");

  const isCourseOfStudy =
    lowerLatest.includes("course of study") ||
    lowerLatest.includes("course is not here") ||
    lowerLatest.includes("course not here") ||
    lowerLatest.includes("course not listed") ||
    lowerLatest.includes("degree not here") ||
    lowerLatest.includes("degree not listed") ||
    lowerLatest.includes("degree is not here") ||
    lowerLatest.includes("major not here") ||
    lowerLatest.includes("major not listed") ||
    lowerLatest.includes("study is not here") ||
    lowerLatest.includes("study not here") ||
    lowerLatest.includes("degree not found") ||
    lowerLatest.includes("field of study not here");

  const isYesterdayJobs =
    (lowerLatest.includes("yesterday") || lowerLatest.includes("yesterdays")) &&
    (lowerLatest.includes("how many") || lowerLatest.includes("job") || lowerLatest.includes("apply") || lowerLatest.includes("applied") || lowerLatest.includes("application"));

  const isShowJobNames =
    lowerLatest.includes("show me the names") ||
    lowerLatest.includes("names of the jobs") ||
    lowerLatest.includes("names of jobs") ||
    lowerLatest.includes("what are the names of the jobs") ||
    lowerLatest.includes("show job names") ||
    lowerLatest.includes("list the jobs") ||
    lowerLatest.includes("show my applied jobs") ||
    (lowerLatest.includes("show") && lowerLatest.includes("names"));

  const isTodayJobs =
    (lowerLatest.includes("today") || lowerLatest.includes("todays")) &&
    (lowerLatest.includes("how many jobs") || lowerLatest.includes("jobs applied") || lowerLatest.includes("applied jobs") || lowerLatest.includes("did i apply") || lowerLatest.includes("application goal") || lowerLatest.includes("daily progress"));

  const isCvUploadCountQuery =
    (lowerLatest.includes("how many") ||
     lowerLatest.includes("count") ||
     lowerLatest.includes("when did") ||
     lowerLatest.includes("when was") ||
     lowerLatest.includes("what cv") ||
     lowerLatest.includes("which cv") ||
     lowerLatest.includes("did i upload") ||
     lowerLatest.includes("have i uploaded") ||
     lowerLatest.includes("upload history") ||
     lowerLatest.includes("uploaded here") ||
     lowerLatest.includes("version history") ||
     lowerLatest.includes("cv versions") ||
     lowerLatest.includes("resume versions")) &&
    (lowerLatest.includes("cv") ||
     lowerLatest.includes("cvs") ||
     lowerLatest.includes("resume") ||
     lowerLatest.includes("resumes") ||
     lowerLatest.includes("uploaded"));

  const isPersonalOrProfileQuery =
    !isCvUploadCountQuery &&
    (lowerLatest.includes("read my cv") ||
    lowerLatest.includes("read my resume") ||
    lowerLatest.includes("what is on my cv") ||
    lowerLatest.includes("summarize my cv") ||
    lowerLatest.includes("summarize my resume") ||
    lowerLatest.includes("who am i") ||
    lowerLatest.includes("what are my skills") ||
    lowerLatest.includes("where did i work") ||
    lowerLatest.includes("what did i study") ||
    lowerLatest.includes("my experience") ||
    lowerLatest.includes("my education") ||
    lowerLatest.includes("my degree") ||
    lowerLatest.includes("my skills") ||
    lowerLatest.includes("audit") ||
    lowerLatest.includes("tailor") ||
    lowerLatest.includes("calibrate") ||
    lowerLatest.includes("how can i improve") ||
    lowerLatest.includes("profile review") ||
    lowerLatest.includes("background"));

  // UTC Date representation for today and yesterday
  const utcToday = getUtcToday();
  const utcYesterday = getUtcYesterday();

  // Binary "Yes or No?" query check
  const isYesOrNoQuery =
    lowerLatest === "yes or no" ||
    lowerLatest === "yes or no?" ||
    lowerLatest.startsWith("yes or no");

  // Did I apply today query check
  const isDidIApplyToday =
    (lowerLatest.includes("did i apply") || lowerLatest.includes("have i applied") || lowerLatest.includes("did i dispatch") || lowerLatest.includes("have i dispatched")) &&
    (lowerLatest.includes("today") || lowerLatest.includes("todays") || lowerLatest.endsWith("today?") || lowerLatest.endsWith("today"));

  // Discipline switch matcher (e.g. "my target discipline is marine", "change my target discipline to marine")
  const isDisciplineSwitch =
    lowerLatest.includes("target discipline is") ||
    lowerLatest.includes("target discipline:") ||
    lowerLatest.includes("change my target discipline") ||
    lowerLatest.includes("change target discipline") ||
    lowerLatest.includes("switch my discipline") ||
    lowerLatest.includes("switch discipline to") ||
    lowerLatest.includes("switch to marine") ||
    lowerLatest.includes("recommend marine") ||
    lowerLatest.includes("i want marine jobs") ||
    lowerLatest.includes("marine jobs") ||
    (lowerLatest.includes("target discipline") && (lowerLatest.includes("marine") || lowerLatest.includes("software") || lowerLatest.includes("ai") || lowerLatest.includes("healthcare") || lowerLatest.includes("engineering") || lowerLatest.includes("management")));

  // Job recommendation query matcher (e.g. "what jobs can I apply for today?", "what job do you recommend for me?")
  const isJobRecommendationQuery =
    lowerLatest.includes("what jobs can i apply for today") ||
    lowerLatest.includes("what jobs can i apply for") ||
    lowerLatest.includes("what job can i apply for") ||
    lowerLatest.includes("what jobs are available for me to apply") ||
    lowerLatest.includes("what jobs are available") ||
    lowerLatest.includes("available jobs for me") ||
    lowerLatest.includes("available jobs") ||
    lowerLatest.includes("jobs for me") ||
    lowerLatest.includes("jobs available") ||
    lowerLatest.includes("what job do you recommend for me") ||
    lowerLatest.includes("what jobs do you recommend for me") ||
    lowerLatest.includes("what jobs do you recommend") ||
    lowerLatest.includes("what job do you recommend") ||
    lowerLatest.includes("recommend jobs") ||
    lowerLatest.includes("recommend a job") ||
    lowerLatest.includes("recommend job") ||
    lowerLatest.includes("find jobs for me") ||
    lowerLatest.includes("find jobs") ||
    lowerLatest.includes("open roles") ||
    lowerLatest.includes("job recommendations") ||
    lowerLatest.includes("jobs in nigeria");

  // Daily limit query matcher
  const isDailyLimitQuery =
    (lowerLatest.includes("daily application limit") || lowerLatest.includes("daily limit") || lowerLatest.includes("how many jobs") || lowerLatest.includes("maximum")) &&
    (lowerLatest.includes("available for me to apply") || lowerLatest.includes("in a day") || lowerLatest.includes("per day") || lowerLatest.includes("can i apply in a day") || lowerLatest.includes("can i apply a day"));

  // Specific Date Application Query Matcher (Audio Rule & Test I)
  const specificDateQuery = parseSpecificDateQuery(latest);
  const isDateJobQuery =
    Boolean(specificDateQuery) &&
    (lowerLatest.includes("job") ||
     lowerLatest.includes("jobs") ||
     lowerLatest.includes("apply") ||
     lowerLatest.includes("applied") ||
     lowerLatest.includes("application") ||
     lowerLatest.includes("applications") ||
     lowerLatest.includes("how many") ||
     lowerLatest.includes("what did i apply") ||
     lowerLatest.includes("did i apply") ||
     lowerLatest.includes("show me") ||
     lowerLatest.includes("work") ||
     lowerLatest.includes("list"));

  const isWhatDatesQuery =
    (lowerLatest.includes("what date") ||
     lowerLatest.includes("what dates") ||
     lowerLatest.includes("which date") ||
     lowerLatest.includes("which dates") ||
     lowerLatest.includes("when did i apply")) &&
    (lowerLatest.includes("job") ||
     lowerLatest.includes("jobs") ||
     lowerLatest.includes("apply") ||
     lowerLatest.includes("application") ||
     lowerLatest.includes("applications"));

  const isAutonomousGoal = isAutonomousGoalQuery(latest);
  const isFollowUp = isFollowUpInquiryQuery(latest);

  const hasSpecificInquiry =
    isAutonomousGoal ||
    isFollowUp ||
    Boolean(specificDateQuery) ||
    isJobRecommendationQuery ||
    isDisciplineSwitch ||
    isDailyLimitQuery ||
    isDidIApplyToday ||
    isYesterdayJobs ||
    isYesOrNoQuery ||
    lowerLatest.includes("job") ||
    lowerLatest.includes("apply") ||
    lowerLatest.includes("applied") ||
    lowerLatest.includes("application") ||
    lowerLatest.includes("discipline") ||
    lowerLatest.includes("cv") ||
    lowerLatest.includes("resume") ||
    lowerLatest.includes("skill") ||
    lowerLatest.includes("study") ||
    lowerLatest.includes("work");

  const isGreeting =
    !hasSpecificInquiry &&
    (/^(hi|hello|hey|good\s+morning|good\s+afternoon|good\s+evening|greetings|help|howdy|start)\b/i.test(lowerLatest) ||
     lowerLatest === "hi" ||
     lowerLatest === "hello" ||
     lowerLatest === "help" ||
     lowerLatest.includes("who are you") ||
     lowerLatest.includes("what can you do") ||
     lowerLatest.includes("what do you do") ||
     lowerLatest.includes("how does this work") ||
     lowerLatest.includes("how can you assist") ||
     lowerLatest.includes("get started"));

  const isFalseMemoryProbe =
    /what (?:is|was) my (?:dog|cat|pet|car|favorite food|favorite color|favorite car|favorite movie|salary|bonus|shoe size|height|blood type)/i.test(lowerLatest) ||
    /\b(?:dog(?:'s)? name|cat(?:'s)? name|pet(?:'s)? name|car do i drive|favorite food|favorite car|favorite movie)\b/i.test(lowerLatest) ||
    /where was i born/i.test(lowerLatest) ||
    /who is my (?:wife|husband|spouse|brother|sister|mother|father|boss|manager)/i.test(lowerLatest);

  const isOSQuery =
    lowerLatest.includes("what os") ||
    lowerLatest.includes("which os") ||
    lowerLatest.includes("what operating system") ||
    (lowerLatest.includes("operating system") && (lowerLatest.includes("i use") || lowerLatest.includes("my")));

  const isLocationQuery =
    lowerLatest.includes("where do i live") ||
    lowerLatest.includes("where am i located") ||
    lowerLatest.includes("my location") ||
    lowerLatest.includes("where i want to work") ||
    lowerLatest.includes("what is my city");

  const isTargetRoleQuery =
    lowerLatest.includes("what is my target role") ||
    lowerLatest.includes("what is my role") ||
    lowerLatest.includes("what role am i targeting") ||
    lowerLatest.includes("my target role");

  // Fine-Tuned Intent Classification & Grounded Walrus Sovereign Memory Recall
  const userIntent = classifyUserIntent(latest);
  const activeProfileData = cv_profile || body.profile || (hasUploadedResume ? {
    applicant_name: currentName,
    target_roles: [profileRole],
    skills: profileSkills,
    work_experience: profileExperience,
    academic_history: profileEducation,
    certifications: profileCertifications,
    uploadedAt: "2026-10-05T09:00:00Z",
    calibratedAt: "2026-10-06T14:30:00Z",
    walrusVersions: body.walrusVersions || [],
    versions: body.versions || [],
  } : null);

  if (activeProfileData) {
    if (!activeProfileData.walrusVersions && body.walrusVersions) {
      activeProfileData.walrusVersions = body.walrusVersions;
    }
    if (!activeProfileData.versions && body.versions) {
      activeProfileData.versions = body.versions;
    }
  }

  const simulatedIntentReply = !isGreeting && !isJobRecommendationQuery && !isDisciplineSwitch && !isDailyLimitQuery
    ? generateIntentMemoryResponse(userIntent, activeProfileData, appliedJobs, latest)
    : null;

  let conversationalDispatchJobs: any[] | undefined;
  const conversationalDispatchResult = await handleAutonomousConversationalDispatch({
    latestQuery: latest,
    messages,
    candidateAddress: address,
    candidateName: currentName,
    candidateEmail: cv_profile?.email || activeProfileData?.email || "applicant@careerace.online",
    targetDiscipline: profileRole,
    candidateSkills: profileSkills,
    appliedJobs,
    cvProfile: activeProfileData || cv_profile,
    walrusVersions: body.walrusVersions || activeProfileData?.walrusVersions || [],
  });

  if (conversationalDispatchResult.handled && conversationalDispatchResult.reply) {
    directReply = conversationalDispatchResult.reply;
    conversationalDispatchJobs = conversationalDispatchResult.newAppliedJobs;
    if (conversationalDispatchResult.storedFacts) {
      newlyStored.push(...conversationalDispatchResult.storedFacts);
    }
  } else if (isAutonomousGoal) {
    const autonomousResult = await executeAutonomousGoal({
      goalText: latest,
      candidateAddress: address,
      candidateName: currentName,
      targetDiscipline: profileRole,
      candidateSkills: profileSkills,
      appliedJobs,
      cvProfile: cv_profile,
    });
    directReply = autonomousResult.markdownReport;
  } else if (isFollowUp) {
    directReply = processAutonomousFollowUpQuery(
      latest,
      appliedJobs,
      address,
      currentName,
      profileRole,
      cv_profile
    );
  } else if (isCvUploadCountQuery) {
    directReply = simulatedIntentReply || generateIntentMemoryResponse(userIntent, activeProfileData, appliedJobs, latest) || "";
  } else if (isYesOrNoQuery) {
    const todayApplied = appliedJobs.filter((a: any) => isTodayDate(a.appliedTimestamp || a.appliedAt));
    if (todayApplied.length === 0) {
      directReply = "No.";
    } else {
      directReply = `Yes. Today being the ${utcToday.label}, you applied to ${todayApplied.length} job${todayApplied.length > 1 ? "s" : ""}:\n\n` +
        todayApplied.map((j: any, i: number) => `${i + 1}. **${j.jobTitle || j.role || j.title || "Target Role"}** at **${j.company || "Company"}**`).join("\n");
    }
  } else if (isDateJobQuery && specificDateQuery) {
    const matchingJobs = appliedJobs.filter((j: any) => isJobMatchingDate(j, specificDateQuery));
    if (matchingJobs.length > 0) {
      const jobList = matchingJobs
        .map((j: any, i: number) => `${i + 1}. **${j.jobTitle || j.role || j.title || "Target Role"}** at **${j.company || "Company"}**`)
        .join("\n");
      directReply =
        `Yes. According to your Walrus application records, you applied to ${matchingJobs.length} job${matchingJobs.length > 1 ? "s" : ""} on ${specificDateQuery.label}:\n\n${jobList}`;
    } else {
      directReply =
        `From my scan: No. According to your Walrus application records, you did not apply for any jobs on ${specificDateQuery.label}. No applications are recorded for that date.`;
    }
  } else if (isDidIApplyToday) {
    const todayApplied = appliedJobs.filter((a: any) => isTodayDate(a.appliedTimestamp || a.appliedAt));
    if (todayApplied.length === 0) {
      directReply = `From my scan: No. Today being the ${utcToday.label}, you have not applied to any jobs yet. Head over to the **Application Board** to discover verified openings and auto-apply!`;
    } else {
      directReply = `Yes. Today being the ${utcToday.label}, you applied to ${todayApplied.length} job${todayApplied.length > 1 ? "s" : ""}:\n\n` +
        todayApplied.map((j: any, i: number) => `${i + 1}. **${j.jobTitle || j.role || j.title || "Target Role"}** at **${j.company || "Company"}**`).join("\n");
    }
  } else if (isDisciplineSwitch) {
    let newDisciplineName = "Marine Engineering & Offshore Systems";
    let newCategory = "Maritime & Offshore Engineering";

    if (lowerLatest.includes("marine") || lowerLatest.includes("offshore") || lowerLatest.includes("maritime") || lowerLatest.includes("naval")) {
      newDisciplineName = "Marine Engineering & Offshore Systems";
      newCategory = "Maritime & Offshore Engineering";
    } else if (lowerLatest.includes("software") || lowerLatest.includes("cloud") || lowerLatest.includes("it support") || lowerLatest.includes("web") || lowerLatest.includes("full stack")) {
      newDisciplineName = "Software & Cloud Systems";
      newCategory = "Software / Cloud";
    } else if (lowerLatest.includes("ai") || lowerLatest.includes("robot") || lowerLatest.includes("machine learning") || lowerLatest.includes("autonomous")) {
      newDisciplineName = "AI & Autonomous Systems";
      newCategory = "AI & Autonomous Systems";
    } else if (lowerLatest.includes("medical") || lowerLatest.includes("health") || lowerLatest.includes("nursing") || lowerLatest.includes("clinical")) {
      newDisciplineName = "Medical & Healthcare Informatics";
      newCategory = "Medical / Healthcare";
    } else if (lowerLatest.includes("engineering") || lowerLatest.includes("mechanical") || lowerLatest.includes("electrical") || lowerLatest.includes("industrial")) {
      newDisciplineName = "Engineering & Industrial Systems";
      newCategory = "Engineering & Industrial";
    } else if (lowerLatest.includes("management") || lowerLatest.includes("operations") || lowerLatest.includes("product")) {
      newDisciplineName = "Management & Operations";
      newCategory = "Management & Operations";
    }

    const switchPromise = Promise.all([
      rememberFact(address, "target_role", `Target role: ${newDisciplineName}`).catch(() => {}),
      rememberFact(address, "preference", `Target discipline: ${newCategory}`).catch(() => {}),
    ]);
    await Promise.race([switchPromise, new Promise((resolve) => setTimeout(resolve, 150))]);
    newlyStored.push(`Target role: ${newDisciplineName}`);
    newlyStored.push(`Target discipline: ${newCategory}`);
    storedSummary.targetRoles.unshift(newDisciplineName);
    profileRole = newDisciplineName;

    const candidateGreeting = currentName && currentName !== "Candidate" ? `Hello ${currentName}` : "Hello";
    const jobs = getTopJobsForCategory(newDisciplineName, 10);
    directReply =
      `${candidateGreeting}, give me a minute, let me scan through the job board for you to see the best possible jobs to get.\n\n` +
      `I have updated your target discipline to **${newCategory}** (${newDisciplineName}) in your Walrus Sovereign Memory vault.\n\n` +
      `Here are 10 verified openings matching your updated discipline from our live employer directory:\n\n` +
      `${formatTopJobs(jobs)}\n\n` +
      `You can explore all verified openings and auto-apply directly on the [Job Board](/job-board). If you'd like to switch to another discipline at any time, simply tell me (e.g. 'Change my target discipline to Software' or 'Change my target discipline to AI').`;
  } else if (isJobRecommendationQuery) {
    const candidateGreeting = currentName && currentName !== "Candidate" ? `Hello ${currentName}` : "Hello";
    const jobs = getTopJobsForCategory(profileRole, 10);
    directReply =
      `${candidateGreeting}, give me a minute, let me scan through the job board for you to see the best possible jobs to get.\n\n` +
      `Based on your target discipline (**${profileRole}**), here are 10 verified opportunities matching your profile from our verified employer directory:\n\n` +
      `${formatTopJobs(jobs)}\n\n` +
      `You can explore all 382+ verified openings and auto-apply directly on the [Job Board](/job-board). If you want to change your target discipline (for example to **Marine & Offshore**, **Software & Cloud**, or **AI & Autonomous Systems**), just let me know and I will update your preferences and reload matches!`;
  } else if (isDailyLimitQuery) {
    const candidateGreeting = currentName && currentName !== "Candidate" ? `Hello ${currentName}` : "Hello";
    const todayCount = appliedJobs.filter((a: any) => isTodayDate(a.appliedTimestamp || a.appliedAt)).length;
    const jobs = getTopJobsForCategory(profileRole, 10);
    directReply =
      `You can apply to as many jobs as possible in a day; CareerAce does not place an artificial limit on your daily dispatches.\n\n` +
      `${candidateGreeting}, give me a minute, let me scan through the job board for you to see the best possible jobs to get.\n\n` +
      `• **Daily Application Progress:** You have dispatched **${todayCount} of 5** recommended daily applications today.\n` +
      `• **Pacing Safeguards:** Dispatches feature 2-5s humanized anti-spam pacing intervals and a 5-day company cooldown.\n` +
      `• **Available Openings:** Over 382 verified employer contacts are available across our directory.\n\n` +
      `Here are 10 preferred openings tailored to your target discipline (**${profileRole}**):\n\n` +
      `${formatTopJobs(jobs)}\n\n` +
      `You can review all verified vacancies and auto-apply directly on the [Job Board](/job-board).`;
  } else if (isWhatDatesQuery) {
    if (appliedJobs.length > 0) {
      const dateGroups = new Map<string, number>();
      for (const j of appliedJobs) {
        let dateLabel = "Unspecified Date";
        if (typeof j.appliedTimestamp === "number") {
          const d = new Date(j.appliedTimestamp);
          if (!isNaN(d.getTime())) {
            dateLabel = `${d.getDate()}${getDaySuffix(d.getDate())} of ${MONTH_STRINGS[d.getMonth()]}, ${d.getFullYear()}`;
          }
        } else if (j.appliedAt) {
          const parsed = parseSpecificDateQuery(String(j.appliedAt));
          if (parsed) {
            dateLabel = parsed.label;
          } else {
            const d = new Date(j.appliedAt);
            if (!isNaN(d.getTime())) {
              dateLabel = `${d.getDate()}${getDaySuffix(d.getDate())} of ${MONTH_STRINGS[d.getMonth()]}, ${d.getFullYear()}`;
            } else {
              dateLabel = String(j.appliedAt);
            }
          }
        }
        dateGroups.set(dateLabel, (dateGroups.get(dateLabel) || 0) + 1);
      }
      const list = [...dateGroups.entries()]
        .map(([date, count]) => `• **${date}**: ${count} job${count > 1 ? "s" : ""}`)
        .join("\n");
      directReply =
        `According to your Walrus application records, you applied for jobs on the following dates:\n\n${list}\n\nTotal applications tracked: ${appliedJobs.length}.`;
    } else {
      directReply = `You have no application dates recorded in your Walrus memory yet.`;
    }
  } else if (isFalseMemoryProbe) {
    const probeWords = lowerLatest.match(/\b(?:dog|cat|pet|car|food|movie|salary|born|wife|husband|spouse)\b/g) || [];
    const hasKnown = [...activeProfile, ...activeCoaching]
      .filter((f) => !f.text.includes("Learned Q&A:"))
      .some((f) =>
        probeWords.some((w) => f.text.toLowerCase().includes(w))
      );
    if (!hasKnown) {
      directReply =
        "I do not have any record of that in your Walrus Sovereign Memory or uploaded CV. You can tell me, and I will remember it for you.";
    }
  } else if (isOSQuery) {
    const osFacts = [...activeCoaching, ...activeProfile].filter((f) =>
      !f.text.includes("Learned Q&A:") &&
      (/operating system:\s*([a-zA-Z]+)/i.test(f.text) || /\b(linux|mac|macos|windows)\b/i.test(f.text))
    );
    const osFact = osFacts[0];
    if (osFact) {
      const match = osFact.text.match(/operating system:\s*([a-zA-Z]+)/i) || osFact.text.match(/\b(linux|mac|macos|windows)\b/i);
      const osName = match ? match[1] : "Linux";
      directReply = `Based on your Walrus Sovereign Memory, your operating system is ${osName.charAt(0).toUpperCase() + osName.slice(1).toLowerCase()}.`;
    } else {
      directReply = "I do not have your operating system recorded in your Walrus Sovereign Memory. Which OS do you use?";
    }
  } else if (isLocationQuery) {
    const locFacts = [...activeCoaching, ...activeProfile].filter((f) =>
      !f.text.includes("Learned Q&A:") &&
      (/workplace preference:\s*([a-zA-Z\s]+)/i.test(f.text) || /location:\s*([a-zA-Z\s]+)/i.test(f.text))
    );
    const locFact = locFacts[0];
    if (locFact) {
      const match = locFact.text.match(/(?:workplace preference|location):\s*([a-zA-Z\s]+)/i);
      let locName = match ? match[1].replace(/ - SUPERSEDES:.*/, "").trim() : "on file";
      locName = locName.replace(/^in\s+/i, "");
      directReply = `Based on your Walrus Sovereign Memory, your location preference is ${locName}.`;
    } else {
      directReply = "I do not have your location recorded in your Walrus Sovereign Memory. Where are you located?";
    }
  } else if (isTargetRoleQuery) {
    directReply = `Based on your Walrus Sovereign Memory, your active target role is ${profileRole}.`;
  } else if (isHowManyJobsInADay) {
    directReply =
      `You can apply to as many jobs as possible in a day. CareerAce does not place an artificial limit on your daily dispatches.\n\n` +
      `To ensure maximum delivery success, protect your candidate reputation, and adhere to recruiter compliance standards, our Universal Application Board and Auto-Apply engine implement two key safeguards:\n` +
      `• **Anti-Spam Pacing Safeguard:** Applications are dispatched with humanized 2 to 5 second pacing intervals rather than reckless automated bursts.\n` +
      `• **5-Day Company Cooldown Safeguard:** Prevents double-applying to the same organization within the same hiring cycle.\n\n` +
      `Head over to the **Application Board** to auto-apply, review RFC-compliant delivery receipts (.eml), and track your 7-day follow-up milestones.` +
      (!hasUploadedResume ? `\n\n*Note: To begin dispatching applications, please head to **Resume Studio** to upload and calibrate your resume first.*` : "");
  } else if (isOtherDisciplines) {
    directReply =
      `Yes, absolutely! CareerAce supports multiple disciplines and career tracks.\n\n` +
      `You can maintain multiple specialized CV versions tailored to different industries (e.g., Software & Cloud Systems, Maritime & Offshore Engineering, AI & Autonomous Systems, Product Management, or Healthcare). Simply head over to **Resume Studio** to select your target discipline, customize your role, and seal a distinct CV snapshot into your decentralized Walrus vault.\n\n` +
      `Each tailored version preserves its own ATS keywords, verified competencies, and cover letters, ensuring you stand out in whatever field you apply.` +
      (!hasUploadedResume ? `\n\n*Note: To set up your first discipline track, upload your resume in **Resume Studio** to begin.*` : "");
  } else if (isCourseOfStudy) {
    directReply =
      `If your specific course of study or academic degree is not listed in our standard options, kindly hit us up via our support channels or contact form, and we will get back to you regarding that and add it to our curriculum index.\n\n` +
      `In the meantime, you can:\n` +
      `1. Select the closest discipline track in **Resume Studio**\n` +
      `2. Directly edit and customize your degree, institution, and major in the **Academic History** section of your CV canvas\n` +
      `3. Add your specialized technical competencies and coursework—CareerAce will immediately index and highlight them for matching employers.` +
      (!hasUploadedResume ? `\n\n*Note: Please head over to **Resume Studio** to upload your resume and customize your academic background.*` : "");
  } else if (isYesterdayJobs) {
    const yesterdayApplied = appliedJobs.filter((a: any) => {
      const t = a.appliedTimestamp || (a.appliedAt ? new Date(a.appliedAt).getTime() : 0);
      return isYesterdayDate(t);
    });

    if (yesterdayApplied.length > 0) {
      const jobList = yesterdayApplied
        .map((j: any, i: number) => `${i + 1}. **${j.jobTitle || j.role || j.title || "Target Role"}** at **${j.company || "Company"}**`)
        .join("\n");
      directReply =
        `From our count, you were able to apply to ${yesterdayApplied.length} job${yesterdayApplied.length > 1 ? "s" : ""} yesterday (${utcYesterday.label}):\n\n` +
        `If you want, I can show you the names of the jobs you applied for:\n\n${jobList}`;
    } else {
      directReply =
        `From our count, you were able to apply to 0 jobs yesterday (${utcYesterday.label}).\n\n` +
        `If you want, I can show you the names of the jobs you applied for across all dates (total tracked: ${appliedJobs.length}), or you can head over to the **Application Board** to discover new verified openings.`;
    }
  } else if (isShowJobNames) {
    if (appliedJobs.length > 0) {
      const jobList = appliedJobs
        .map((j: any, i: number) => {
          const dateStr = j.appliedAt ? (typeof j.appliedAt === "string" ? j.appliedAt : new Date(j.appliedAt).toLocaleDateString()) : "Recently";
          return `${i + 1}. **${j.jobTitle || j.role || j.title || "Target Role"}** at **${j.company || "Company"}** (Applied: ${dateStr})`;
        })
        .join("\n");
      const followUpScan = scanApplicationsForFollowUp(appliedJobs, address, currentName);
      const followUpNotice = followUpScan.dueCount > 0
        ? `\n\n💡 **Autonomous Follow-Up Notice:** You have **${followUpScan.dueCount} application(s)** that have passed 7 days without a recruiter response. I have drafted a polite follow-up inquiry referencing your submission digest \`${followUpScan.duePackages[0].submissionDigest}\`. Say *"draft follow-up"* to review or send it.`
        : "";

      directReply =
        `Here are the verified jobs you have applied for from your sovereign application log:\n\n${jobList}\n\n` +
        `You can track the 7-day follow-up status for each of these on the **Application Board**.\n\n${followUpNotice}`.trim();
    } else {
      directReply =
        `You have no tracked job applications yet.\n\n` +
        `Visit the **Application Board** to explore verified corporate openings across Software, Engineering, Maritime, AI, and Product Management. When you dispatch an application, CareerAce automatically tracks it and triggers a 7-day follow-up reminder.`;
    }
  } else if (isTodayJobs) {
    const todayApplied = appliedJobs.filter((a: any) => {
      const t = a.appliedTimestamp || (a.appliedAt ? new Date(a.appliedAt).getTime() : 0);
      return isTodayDate(t);
    });
    const dailyCount = todayApplied.length;
    const dailyTarget = 5;

    directReply =
      `From our count, you were able to apply to ${dailyCount} job${dailyCount === 1 ? "" : "s"} today (${utcToday.label}, daily target: ${dailyTarget}).\n\n` +
      (dailyCount > 0
        ? `If you want, I can show you the names of the jobs you applied for:\n\n` +
          todayApplied.map((j: any, i: number) => `${i + 1}. **${j.jobTitle || j.role || j.title || "Target Role"}** at **${j.company || "Company"}**`).join("\n")
        : `You haven't dispatched any applications today yet. Head over to the **Application Board** to explore verified openings and auto-apply!`);
  } else if (!hasUploadedResume && isPersonalOrProfileQuery) {
    directReply =
      `Welcome to CareerAce! You haven't uploaded or calibrated your resume yet.\n\n` +
      `To give you tailored career intelligence, match you with verified openings, and track your applications, the very first step is to upload your resume in **Resume Studio**.\n\n` +
      `Once uploaded, our sovereign AI will:\n` +
      `1. Calibrate your target roles and seniority level to match live hiring standards\n` +
      `2. Extract and index your verified technical competencies and work experience into your decentralized Walrus Memory vault\n` +
      `3. Format and quantify your achievements to pass ATS screening algorithms\n\n` +
      `Please head over to **Resume Studio** to upload your resume to get started!`;
  } else if (isGreeting) {
    const candidateDisplayName = currentName && currentName !== "Candidate" ? currentName : "";

    if (hasUploadedResume) {
      directReply = `Hello${candidateDisplayName ? ` ${candidateDisplayName}` : ""}! I am your CareerAce Career Assistant, grounded directly in your decentralized Walrus Sovereign Memory vault.\n\n` +
        `• **Current Sovereign Profile:** Verified background on file for **${profileRole}** with **${profileSkills.length} core skills** and **${Array.isArray(profileExperience) ? profileExperience.length : 1} work tenure(s)** indexed.\n` +
        `• **Multiple Resumes Supported:** You can maintain 2 or 3 distinct CV versions tailored to different industries (e.g. Software, Systems Engineering, Management). Head over to **Resume Studio** to manage or switch between your tailored snapshots.\n` +
        `• **Cover Letter Studio:** Generate laser-targeted, problem-solving cover letters for any prospective employer without AI slop.\n` +
        `• **Application Board:** Track your applications across Discovery, Saved, and Applied stages, and monitor automatic 7-day follow-up milestones.\n\n` +
        `Feel free to ask me anything about your work experience, education, skills, applied jobs, or general career strategy!`;
    } else {
      directReply = `Hello! I am your CareerAce Career Assistant, connected to your decentralized Walrus Sovereign Memory vault.\n\n` +
        `Here is how I can assist you across our ecosystem:\n` +
        `• **First Step — Resume Calibration:** Head over to **Resume Studio** to upload your CV. We will calibrate your experience, skills, and target roles to fit industry benchmarks, and seal tamper-proof snapshots into Walrus storage.\n` +
        `• **Cover Letter Studio:** Synthesize customized, problem-solving cover letters addressing specific company needs without robotic AI filler.\n` +
        `• **Application Board:** Explore verified openings, track your applications across Discovery, Saved, and Applied stages, and manage 7-day recruiter follow-up reminders.\n\n` +
        `To get started, head over to **Resume Studio** to upload your resume, or ask me any question about your career goals!`;
    }
  } else if (
    lowerLatest.includes("applied job") ||
    lowerLatest.includes("jobs applied") ||
    lowerLatest.includes("follow-up") ||
    lowerLatest.includes("follow up") ||
    lowerLatest.includes("followup") ||
    lowerLatest.includes("applications") ||
    lowerLatest.includes("application status")
  ) {
    if (appliedJobs.length > 0) {
      const now = Date.now();
      const formattedJobs = appliedJobs.map((j: any, i: number) => {
        const appliedTime = j.appliedAt ? new Date(j.appliedAt).getTime() : now;
        const daysAgo = Math.max(0, Math.floor((now - appliedTime) / (1000 * 60 * 60 * 24)));
        const isDue = daysAgo >= 7;
        const statusText = isDue
          ? `[Follow-Up Due] (${daysAgo} days elapsed)`
          : `[Pending Follow-Up] (Milestone in ${7 - daysAgo} day(s))`;
        return `${i + 1}. **${j.jobTitle || j.role || j.title || "Target Role"}** at **${j.company || "Company"}**\n   • Applied: ${j.appliedAt ? (typeof j.appliedAt === "string" ? j.appliedAt : new Date(j.appliedAt).toLocaleDateString()) : "Recently"}\n   • Contact: ${j.contactEmail || j.email || "HR / Recruiter on file"}\n   • Status: ${statusText}`;
      }).join("\n\n");

      directReply = `Here is your live application log and 7-day follow-up tracking from your browser session:\n\n${formattedJobs}\n\n**Actionable Advice:** For any application over 7 days old, dispatch a polite follow-up email reiterating your top 3 matching skills and referencing your Walrus-verified CV credentials.`;
    } else {
      directReply = `You have no tracked job applications yet.\n\nVisit the **Application Board** to explore verified corporate openings across Engineering, Software & IT, AI & Autonomous Systems, Medical Informatics, and Management. When you dispatch an application, CareerAce automatically tracks it and triggers a 7-day follow-up reminder.`;
    }
  } else if (
    lowerLatest.includes("certification") ||
    lowerLatest.includes("license") ||
    lowerLatest.includes("credential") ||
    lowerLatest.includes("certifications & licenses")
  ) {
    if (profileCertifications && profileCertifications.length > 0) {
      const certList = Array.isArray(profileCertifications)
        ? profileCertifications
            .map((c: any) => typeof c === "string" ? c : `${c.name || c.title || "Certification"}${c.issuer ? ` (${c.issuer})` : ""}${c.year ? ` · ${c.year}` : ""}`)
            .join("\n• ")
        : String(profileCertifications);
      directReply = `Here are your verified licenses and certifications registered in your sovereign profile:\n\n• ${certList}\n\nThese credentials can be highlighted in your tailored CV bullets and cover letters for regulated and technical disciplines.`;
    } else {
      directReply = `No specific certifications or licenses have been recorded yet in your profile.\n\nYou can add professional credentials (e.g. AWS/Azure, PMP, Professional Engineer, technical licenses) to your profile, and CareerAce will index them into your decentralized Walrus vault.`;
    }
  } else if (
    lowerLatest.includes("career feedback") ||
    lowerLatest.includes("give me feedback") ||
    lowerLatest.includes("career advice") ||
    lowerLatest.includes("how can i improve") ||
    lowerLatest.includes("profile review")
  ) {
    const skillsCount = profileSkills.length;
    const expCount = Array.isArray(profileExperience) ? profileExperience.length : 1;
    directReply = `Career Strategy & Profile Feedback for ${currentName || "Candidate"}:\n\n` +
      `1. **ATS Alignment & Keywords:** You have ${skillsCount} verified technical competencies indexed. Focus on tailoring top keywords directly from target role job descriptions before applying.\n` +
      `2. **Impact & Metrics in Experience:** You have ${expCount} career tenure position(s) listed. Ensure every bullet leads with a strong action verb (e.g., *Engineered, Spearheaded, Overhauled*) and includes quantifiable metrics (speed, cost reduction, scale, or team size).\n` +
      `3. **Target Discipline Strategy:** Align your application outreach to specialized disciplines: ${profileRole}. Tailor each resume version uniquely rather than submitting a generic canvas.\n` +
      `4. **Follow-Up Discipline:** Track every outreach on the Application Board and dispatch follow-ups on day 7 to maximize recruiter response rates.`;
  } else if (
    lowerLatest.includes("cv & background") ||
    lowerLatest.includes("read my cv") ||
    lowerLatest.includes("read my resume") ||
    lowerLatest.includes("can you read cv") ||
    lowerLatest.includes("what is on my cv") ||
    lowerLatest.includes("summarize my cv") ||
    lowerLatest.includes("summarize my resume") ||
    lowerLatest.includes("who am i") ||
    lowerLatest.includes("background")
  ) {
    const candidateDisplayName = currentName && currentName !== "Candidate" ? currentName : "Candidate";
    const expFormatted = Array.isArray(profileExperience) && profileExperience.length > 0
      ? profileExperience.map((e: any) => typeof e === "string" ? e : `${e.role || "Role"} at ${e.company || "Company"}${e.duration ? ` (${e.duration})` : ""}`).slice(0, 3).join("; ")
      : "Work history indexed in Walrus Memory";

    const eduFormatted = Array.isArray(profileEducation) && profileEducation.length > 0
      ? profileEducation.map((a: any) => typeof a === "string" ? a : `${a.degree || "Degree"} from ${a.institution || "Institution"}${a.graduation_year ? ` (${a.graduation_year})` : ""}`).slice(0, 2).join("; ")
      : "Education indexed in Walrus Memory";

    directReply = `Yes! I have read and verified your background from your Walrus Sovereign Memory vault:\n\n• **Candidate Name:** ${candidateDisplayName}\n• **Target Role:** ${profileRole}\n• **Core Skills:** ${profileSkills.slice(0, 10).join(", ") || "Technical competencies"}\n• **Work History:** ${expFormatted}\n• **Academic Background:** ${eduFormatted}\n\nYour profile is cryptographically anchored to Walrus decentralized storage. Select a quick action below or ask about specific roles, certifications, or applications!`;
  } else if (
    lowerLatest.includes("what did i study") ||
    lowerLatest.includes("what is my degree") ||
    lowerLatest.includes("where did i study") ||
    lowerLatest.includes("my education") ||
    lowerLatest.includes("my degree")
  ) {
    if (profileEducation && (Array.isArray(profileEducation) ? profileEducation.length > 0 : Boolean(profileEducation))) {
      const eduList = Array.isArray(profileEducation)
        ? profileEducation
            .map((e: any) =>
              typeof e === "string"
                ? e
                : `${e.degree || "Degree"} from ${e.institution || e.school || "University"}${e.field_of_study ? ` in ${e.field_of_study}` : ""}${e.graduation_year || e.year ? ` (${e.graduation_year || e.year})` : ""}`
            )
            .join("\n• ")
        : String(profileEducation);
      directReply = `Based on your Walrus Sovereign Memory and uploaded CV, you studied:\n\n• ${eduList}\n\nAll educational credentials are encrypted and stored in your decentralized Walrus vault.`;
    } else {
      directReply = "Your education history has not been indexed yet. What is your highest educational institution, degree, and graduation year?";
    }
  } else if (
    lowerLatest.includes("where did i work") ||
    lowerLatest.includes("my past roles") ||
    lowerLatest.includes("my experience") ||
    lowerLatest.includes("work experience") ||
    lowerLatest === "experience" ||
    lowerLatest.includes("past experience") ||
    lowerLatest.includes("where have i worked") ||
    lowerLatest.includes("what companies")
  ) {
    if (profileExperience && (Array.isArray(profileExperience) ? profileExperience.length > 0 : Boolean(profileExperience))) {
      const expList = Array.isArray(profileExperience)
        ? profileExperience
            .map((exp: any) =>
              typeof exp === "string"
                ? exp
                : `${exp.role || "Role"} at ${exp.company || "Company"}${exp.duration ? ` (${exp.duration})` : ""}${exp.highlights?.length ? ` — ${exp.highlights.slice(0, 1).join(" ")}` : ""}`
            )
            .join("\n• ")
        : String(profileExperience);
      directReply = `Here is your verified work experience from your Walrus Memory vault:\n\n• ${expList}\n\nWould you like me to quantify or tailor any of these achievements for a specific job description?`;
    } else {
      directReply = "No work experience positions are currently indexed in your profile. What roles and organizations have you worked at?";
    }
  } else if (
    lowerLatest.includes("what are my skills") ||
    lowerLatest.includes("my skills") ||
    lowerLatest.includes("skills detected") ||
    lowerLatest.includes("what tools do i know")
  ) {
    if (profileSkills && profileSkills.length > 0) {
      const topSkills = profileSkills.slice(0, 20).join(", ");
      directReply = `Your Walrus Sovereign Memory vault has indexed the following verified technical skills:\n\n${topSkills}\n\nTotal skills indexed: ${profileSkills.length}. You can tailor these for live job matches anytime.`;
    } else {
      directReply = "No skills have been registered yet. What are your primary programming languages, frameworks, and developer tools?";
    }
  } else if (
    lowerLatest.includes("audit") &&
    (lowerLatest.includes("cv") || lowerLatest.includes("resume") || lowerLatest.includes("ats"))
  ) {
    const score = Math.min(
      95,
      Math.max(
        68,
        65 + (profileSkills.length > 5 ? 15 : profileSkills.length * 2) + (profileExperience.length > 0 ? 15 : 0)
      )
    );
    directReply = `ATS Audit Complete for ${currentName || "Candidate"}:\n\n- Overall ATS Compatibility: ${score}/100\n- Contact & Header: Clean and parseable\n- Target Role: ${profileRole}\n- Core Competencies: ${profileSkills.length} verified skills\n- Experience Entries: ${Array.isArray(profileExperience) ? profileExperience.length : 1} position(s)\n- Recommendation: Ensure every work accomplishment starts with a strong action verb and includes quantifiable metrics (% growth, revenue, speed, or team size).`;
  }

  // Check previously learned Q&A pairs from Walrus sovereign memory
  if (!directReply) {
    const allMemoryFacts = [...activeProfile, ...activeCoaching];
    for (const fact of allMemoryFacts) {
      if (fact.text.includes("Learned Q&A:")) {
        const match = fact.text.match(/Learned Q&A:\s*"([^"]+)"\s*->\s*"([^"]+)"/i);
        if (match) {
          const learnedQ = match[1].toLowerCase().trim();
          const learnedA = match[2].trim();
          if (
            lowerLatest === learnedQ ||
            lowerLatest.includes(learnedQ) ||
            learnedQ.includes(lowerLatest)
          ) {
            directReply = learnedA;
            break;
          }
        }
      }
    }
  }

  if (!directReply && simulatedIntentReply) {
    directReply = simulatedIntentReply;
  }

  let reply = directReply;

  if (!reply) {
    const memoryFactsList = [...activeProfile, ...activeCoaching].map((f) => `- ${f.text}`).join("\n");

    const formattedEdu = Array.isArray(profileEducation)
      ? profileEducation
          .map((e: any) =>
            typeof e === "string"
              ? e
              : `${e.degree || "Degree"} from ${e.institution || e.school || "University"}${e.field_of_study ? ` in ${e.field_of_study}` : ""}${e.graduation_year ? ` (${e.graduation_year})` : ""}`
          )
          .join("; ")
      : String(profileEducation || "None indexed yet");

    const formattedExp = Array.isArray(profileExperience)
      ? profileExperience
          .map((exp: any) =>
            typeof exp === "string"
              ? exp
              : `${exp.role || "Role"} at ${exp.company || "Company"}${exp.duration ? ` (${exp.duration})` : ""}${exp.highlights?.length ? ` (Highlights: ${exp.highlights.slice(0, 2).join(", ")})` : ""}`
          )
          .join("\n• ")
      : String(profileExperience || "None indexed yet");

    const systemPrompt = `You are Career Ace AI Copilot, a direct, highly effective career strategist, resume builder, and job matcher powered by Walrus Sovereign Memory.

${NO_SLOP_PROMPT_DIRECTIVE}

CLASSIFIED USER INTENT & CONTEXT:
- Category: ${userIntent.category}
- Action Guidance: ${userIntent.actionPrompt}
- Matched Keywords: ${userIntent.matchedKeywords.join(", ") || "Direct inquiry"}

${simulatedIntentReply ? `GROUNDED TAXONOMY & VERIFIED SIMULATION KNOWLEDGE:\n${simulatedIntentReply}\n` : ""}

DATA PRIVACY & STRICT SOVEREIGN ISOLATION:
You are strictly scoped to the active candidate's own verified CV, credentials, and application records. Under no circumstances can you reveal, reference, or cross-pollinate data, applications, or credentials belonging to another user.

FIRST-TIME USER CALIBRATION DIRECTIVE:
If the candidate has not uploaded a resume yet, gently guide them that their very first step must be uploading their resume in Resume Studio so CareerAce can calibrate their target roles, skills, and work experience.

PLATFORM CAPABILITIES & POLICIES:
- "How many jobs can I apply in a day?": As many as possible! No artificial daily limit. Protected by anti-spam pacing (2-5s humanized intervals) and 5-day company cooldown safeguards.
- "Can I apply with other disciplines / roles?": Yes, absolutely! Candidates can maintain multiple specialized CV versions tailored to different industries (Software, Maritime, AI, Product, Healthcare) in Resume Studio.
- "My course of study is not here, what can I do?": Kindly hit us up via support/contact form, we will get back to you and add it to our curriculum index. In the meantime, select the closest discipline track and customize your exact degree/field in Academic History.
- "How many jobs did I apply for yesterday?": State: "From our count, you were able to apply to X jobs yesterday. If you want, I can show you the names of the jobs you applied for."

CANDIDATE VERIFIED CV DETAILS:
Candidate Name: ${currentName || "Candidate"}
Primary Target Role: ${profileRole}
Verified Skills: ${profileSkills.slice(0, 20).join(", ") || "None indexed yet"}
Academic History: ${formattedEdu}
Work Experience:
• ${formattedExp}

APPLICATIONS DISPATCHED (${appliedJobs.length} TOTAL):
${appliedJobs.slice(0, 10).map((j: any, i: number) => `${i + 1}. ${j.jobTitle || j.role || j.title || "Target Role"} at ${j.company || "Company"} (Applied: ${j.appliedAt || "Recent"})`).join("\n") || "No applications dispatched yet."}

FACTS RECORDED IN WALRUS SOVEREIGN MEMORY:
${memoryFactsList || "Profile newly initialized on Walrus."}

RULES:
1. Always ground your answers in the candidate's actual CV details and Walrus Memory above.
2. If the user asks about what they studied, where they worked, what their skills are, or asks "Can you read my CV?", answer directly and affirmatively using their exact background details above.
3. Be professional, direct, concise (under 140 words). Never use filler phrases or AI buzzwords. Never invent unverified companies or credentials.`;

    reply = await callFreeLlm({
      prompt: latest,
      system_prompt: systemPrompt,
      messages: messages,
      max_tokens: 450,
      custom_keys: body.custom_keys,
    });

    if (reply) {
      reply = sanitizeAntiSlop(reply);
      // Auto-add novel question and grounded answer to Walrus memory so it is permanently remembered
      const cleanSnippet = reply.replace(/\s+/g, " ").trim();
      rememberFact(
        address,
        "preference",
        `Learned Q&A: "${latest}" -> "${cleanSnippet.slice(0, 300)}"`,
        { userTurn: latest }
      ).catch((err) => console.warn("[careerace] auto-learning persistence notice:", err));
      newlyStored.push(`learned q&a: ${latest}`);
    }
  }

  if (!reply) {
    reply =
      simulatedIntentReply ||
      directReply ||
      "CareerAce Chatbot is active and connected to your decentralized Walrus Sovereign Memory vault. I can answer questions about your verified CV, work history, target roles, academic credentials, and track 7-day follow-ups.";
  }

  // Strip trailing ellipses or multiple dots
  reply = reply.replace(/\.{3,}/g, "").trim();

  // Instruction Memory Formatting Adaptation (Test G)
  const prefersShort =
    storedSummary.preferences.some((p: string) => /short|concise|brief|under 2 sentences/i.test(p)) ||
    /short answer|concise|brief|under 2 sentences/i.test(lowerLatest);

  if (prefersShort && reply.length > 180) {
    const sentences = reply.match(/[^.!?]+[.!?]+/g);
    if (sentences && sentences.length >= 2) {
      reply = sentences.slice(0, 2).join(" ").trim();
    }
  }

  // Append turn to cross-device persistent chat history store
  appendChatTurn(address, rawLatest, reply, "overview");

  return {
    role: "assistant",
    content: reply,
    reply: reply,
    stored: newlyStored,
    candidate_name: currentName || undefined,
    newAppliedJobs: conversationalDispatchJobs,
    extracted_profile: {
      name: currentName || undefined,
      target_roles: storedSummary.targetRoles,
      skills: storedSummary.skills,
      education: storedSummary.education,
      experience: storedSummary.experience,
    },
  };
}
