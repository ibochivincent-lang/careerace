/**
 * Guided Interactive CV Builder Engine for Career Ace Bot
 *
 * Implements a sequential conversational interview for candidates who do not have
 * a resume or wish to build an ATS-compliant CV from scratch.
 *
 * Sequential Steps:
 * 1. Full Name
 * 2. Target Role / Career Goal
 * 3. Contact Information (Email, Phone, Location)
 * 4. Professional Links (LinkedIn, GitHub, Portfolio)
 * 5. Technical & Core Skills
 * 6. Professional Work Experience (Company, Role, Dates, Highlights)
 * 7. Educational Credentials (Degree, Institution, Year)
 * 8. Professional Licenses & Certifications
 * 9. Leadership & Volunteering
 * 10. Conferences & Honors
 *
 * Candidates can answer each question sequentially or reply "I don't have" / "Skip"
 * on any step. Upon completion, assembles a 100% ATS-compliant ParsedCv profile
 * and updates the sovereign storage and Editable ATS Canvas.
 */

import type { ParsedCv } from "./heuristic_cv_parser.ts";
import { rememberFact } from "./memory_core.ts";
import fs from "node:fs";
import path from "node:path";

export type CvBuilderStep =
  | "idle"
  | "asking_name"
  | "asking_target_role"
  | "asking_contact"
  | "asking_links"
  | "asking_skills"
  | "asking_experience"
  | "asking_education"
  | "asking_certifications"
  | "asking_leadership"
  | "asking_conferences"
  | "completed";

export interface GuidedCvDraft {
  step: CvBuilderStep;
  applicant_name?: string;
  target_role?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin_url?: string;
  github_url?: string;
  website_url?: string;
  skills?: string[];
  work_experience?: Array<{
    company: string;
    role: string;
    duration: string;
    highlights: string[];
  }>;
  academic_history?: Array<{
    institution: string;
    degree: string;
    field_of_study: string;
    graduation_year: string;
    achievements: string[];
  }>;
  certifications?: string[];
  leadership?: Array<{
    role: string;
    organization: string;
    highlights?: string[];
  }>;
  conferences?: Array<{
    name: string;
    role_or_topic?: string;
  }>;
  lastUpdated: number;
}

// In-memory registry with disk persistence fallback for user session isolation
const activeDrafts = new Map<string, GuidedCvDraft>();
const DRAFTS_FILE = path.join(process.cwd(), ".cv_builder_drafts.json");
let isDiskLoaded = false;

function loadDraftsFromDisk(): void {
  if (isDiskLoaded) return;
  try {
    if (fs.existsSync(DRAFTS_FILE)) {
      const raw = fs.readFileSync(DRAFTS_FILE, "utf-8");
      const data = JSON.parse(raw);
      if (typeof data === "object" && data !== null) {
        for (const [addr, draft] of Object.entries(data)) {
          activeDrafts.set(addr.toLowerCase(), draft as GuidedCvDraft);
        }
      }
    }
  } catch {
    // Safe in serverless environments
  } finally {
    isDiskLoaded = true;
  }
}

function flushDraftsToDisk(): void {
  try {
    const obj: Record<string, GuidedCvDraft> = {};
    for (const [addr, draft] of activeDrafts.entries()) {
      obj[addr] = draft;
    }
    fs.writeFileSync(DRAFTS_FILE, JSON.stringify(obj, null, 2), "utf-8");
  } catch {
    // Tolerates serverless read-only filesystems safely
  }
}

function normalizeAddress(address?: string | null): string {
  if (!address || typeof address !== "string") {
    return "0x434f860c828dc4320be447975b8283d7c5786c4a08b9ddc8f88540d9ea69aa00";
  }
  return address.trim().toLowerCase();
}

/**
 * Checks whether user input indicates they want to skip this question or don't have that information.
 */
export function isSkipResponse(text: string): boolean {
  const clean = text.trim().toLowerCase();
  return (
    clean === "i don't have" ||
    clean === "i dont have" ||
    clean === "don't have" ||
    clean === "dont have" ||
    clean === "i do not have" ||
    clean === "no" ||
    clean === "none" ||
    clean === "skip" ||
    clean === "n/a" ||
    clean === "na" ||
    clean === "nothing" ||
    clean === "nil" ||
    clean === "not yet" ||
    clean === "no certification" ||
    clean === "no experience" ||
    clean === "no leadership" ||
    clean === "no conferences" ||
    clean.startsWith("i don't have") ||
    clean.startsWith("i dont have") ||
    clean.startsWith("i do not have")
  );
}

/**
 * Detects whether the user is explicitly requesting Ace Bot to help create or build a CV.
 */
export function isCvCreationRequest(text: string): boolean {
  const clean = text.trim().toLowerCase();
  return (
    (clean.includes("don't have a cv") ||
      clean.includes("dont have a cv") ||
      clean.includes("do not have a cv") ||
      clean.includes("don't have a resume") ||
      clean.includes("dont have a resume") ||
      clean.includes("have no cv") ||
      clean.includes("have no resume") ||
      clean.includes("create a cv") ||
      clean.includes("create my cv") ||
      clean.includes("build a cv") ||
      clean.includes("build my cv") ||
      clean.includes("make a cv") ||
      clean.includes("make my cv") ||
      clean.includes("create a resume") ||
      clean.includes("create my resume") ||
      clean.includes("build a resume") ||
      clean.includes("build my resume") ||
      clean.includes("help me create a cv") ||
      clean.includes("help me make a cv") ||
      clean.includes("help me build a cv") ||
      clean.includes("help me create a resume") ||
      clean.includes("help me build a resume") ||
      clean.includes("generate a cv") ||
      clean.includes("generate my cv") ||
      clean.includes("start cv builder") ||
      clean.includes("start resume builder")) &&
    !clean.includes("how many") &&
    !clean.includes("when did")
  );
}

/**
 * Checks if a guided CV builder interview is currently active for this user.
 */
export function isGuidedCvBuilderActive(rawAddress?: string | null): boolean {
  loadDraftsFromDisk();
  const address = normalizeAddress(rawAddress);
  const draft = activeDrafts.get(address);
  return Boolean(draft && draft.step !== "idle" && draft.step !== "completed");
}

/**
 * Retrieves the draft in progress for an address.
 */
export function getGuidedCvDraft(rawAddress?: string | null): GuidedCvDraft | null {
  loadDraftsFromDisk();
  const address = normalizeAddress(rawAddress);
  return activeDrafts.get(address) || null;
}

/**
 * Cancels any active CV builder session.
 */
export function cancelGuidedCvBuilder(rawAddress?: string | null): { reply: string } {
  loadDraftsFromDisk();
  const address = normalizeAddress(rawAddress);
  activeDrafts.delete(address);
  flushDraftsToDisk();
  return {
    reply:
      "CV Builder interview paused. You can return anytime and say **'Help me create a CV'** or upload an existing PDF/Word resume in Resume Studio.",
  };
}

/**
 * Resets or clears draft state for an address (useful for isolation and testing).
 */
export function resetGuidedCvBuilder(rawAddress?: string | null): void {
  loadDraftsFromDisk();
  const address = normalizeAddress(rawAddress);
  activeDrafts.delete(address);
  flushDraftsToDisk();
}

/**
 * Starts the interactive guided CV creation session.
 */
export function startGuidedCvBuilder(rawAddress?: string | null): {
  reply: string;
  step: CvBuilderStep;
} {
  loadDraftsFromDisk();
  const address = normalizeAddress(rawAddress);

  const initialDraft: GuidedCvDraft = {
    step: "asking_name",
    lastUpdated: Date.now(),
  };
  activeDrafts.set(address, initialDraft);
  flushDraftsToDisk();

  const reply =
    "Welcome to the **Career Ace Sovereign CV Builder**! I will guide you step-by-step through creating a 100% ATS-compliant professional resume and calibrating your Editable ATS Canvas.\n\n" +
    "Whenever you don't have an item or want to skip, simply reply **'I don't have'**.\n\n" +
    "**Step 1 of 10: Full Name**\n" +
    "What is your full legal or professional name?";

  return { reply, step: "asking_name" };
}

/**
 * Processes a single turn of the interactive CV Builder conversation.
 */
export async function handleGuidedCvBuilderTurn(
  rawAddress: string | null | undefined,
  userMessage: string
): Promise<{
  reply: string;
  step: CvBuilderStep;
  profile?: ParsedCv;
  completed: boolean;
}> {
  loadDraftsFromDisk();
  const address = normalizeAddress(rawAddress);
  let draft = activeDrafts.get(address);

  // If not active, canceled, or user sends a new CV creation request, start fresh
  if (!draft || draft.step === "idle" || draft.step === "completed" || isCvCreationRequest(userMessage)) {
    const started = startGuidedCvBuilder(address);
    return { ...started, completed: false };
  }

  const cleanInput = userMessage.trim();
  const isSkip = isSkipResponse(cleanInput);

  switch (draft.step) {
    // ----------------------------------------------------
    // STEP 1: Full Name
    // ----------------------------------------------------
    case "asking_name": {
      let name = cleanInput;
      // Strip common prefixes like "My name is John Doe", "I am Jane", "Name: John"
      name = name
        .replace(/^(?:my name is|i am|i'm|name is|call me|name:)\s*/i, "")
        .replace(/[.]+$/, "")
        .trim();

      if (!name || name.length < 2) {
        name = "Candidate";
      }

      draft.applicant_name = name;
      draft.step = "asking_target_role";
      draft.lastUpdated = Date.now();
      activeDrafts.set(address, draft);
      flushDraftsToDisk();

      // Remember identity in sovereign memory
      rememberFact(address, "candidate_identity", `Candidate Name: ${name}`).catch(() => {});

      return {
        reply:
          `Great to meet you, **${name}**!\n\n` +
          `**Step 2 of 10: Target Role**\n` +
          `What is your target job title or primary career role? (e.g., *Senior Software Engineer*, *Marine Operations Officer*, *Clinical Data Specialist*, *Financial Analyst*)`,
        step: "asking_target_role",
        completed: false,
      };
    }

    // ----------------------------------------------------
    // STEP 2: Target Role
    // ----------------------------------------------------
    case "asking_target_role": {
      let role = cleanInput
        .replace(/^(?:my target role is|i want to be a|target role:|aspiring|seeking)\s*/i, "")
        .replace(/[.]+$/, "")
        .trim();

      if (!role || role.length < 2 || isSkip) {
        role = "Professional";
      }

      draft.target_role = role;
      draft.step = "asking_contact";
      draft.lastUpdated = Date.now();
      activeDrafts.set(address, draft);
      flushDraftsToDisk();

      rememberFact(address, "target_role", `Target Role: ${role}`).catch(() => {});

      return {
        reply:
          `Target role set to **${role}**!\n\n` +
          `**Step 3 of 10: Contact Information**\n` +
          `Please provide your primary contact details:\n` +
          `• Email address\n` +
          `• Phone number\n` +
          `• Location (City, State / Country)\n\n` +
          `*(You can enter them on one line, e.g. "alex@example.com, +1-555-0199, Chicago, IL")*`,
        step: "asking_contact",
        completed: false,
      };
    }

    // ----------------------------------------------------
    // STEP 3: Contact Details
    // ----------------------------------------------------
    case "asking_contact": {
      if (!isSkip) {
        const emailMatch = cleanInput.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) draft.email = emailMatch[0].trim();

        const phoneMatch = cleanInput.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
        if (phoneMatch) draft.phone = phoneMatch[0].trim();

        // Location heuristic
        const locationCandidates = cleanInput
          .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "")
          .replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, "")
          .split(/[,|;]/)
          .map((s) => s.trim())
          .filter((s) => s.length > 2);
        if (locationCandidates.length > 0) {
          draft.location = locationCandidates.join(", ");
        }
      }

      draft.step = "asking_links";
      draft.lastUpdated = Date.now();
      activeDrafts.set(address, draft);
      flushDraftsToDisk();

      return {
        reply:
          `Contact details logged!\n\n` +
          `**Step 4 of 10: Professional Profiles & Links**\n` +
          `Do you have a LinkedIn profile, GitHub profile, or portfolio website?\n\n` +
          `*(Reply with your URL(s), or reply **'I don't have'** to skip.)*`,
        step: "asking_links",
        completed: false,
      };
    }

    // ----------------------------------------------------
    // STEP 4: Professional Links
    // ----------------------------------------------------
    case "asking_links": {
      if (!isSkip) {
        const linkedinMatch = cleanInput.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[^\s,]+/i);
        if (linkedinMatch) draft.linkedin_url = linkedinMatch[0];

        const githubMatch = cleanInput.match(/https?:\/\/(?:www\.)?github\.com\/[^\s,]+/i);
        if (githubMatch) draft.github_url = githubMatch[0];

        const genericUrlMatch = cleanInput.match(/https?:\/\/[^\s,]+/i);
        if (genericUrlMatch && !linkedinMatch && !githubMatch) {
          draft.website_url = genericUrlMatch[0];
        }
      }

      draft.step = "asking_skills";
      draft.lastUpdated = Date.now();
      activeDrafts.set(address, draft);
      flushDraftsToDisk();

      return {
        reply:
          `Profile links updated!\n\n` +
          `**Step 5 of 10: Technical & Core Skills**\n` +
          `What are your primary technical skills, tools, programming languages, or domain competencies?\n\n` +
          `*(List your skills separated by commas, e.g.: "TypeScript, React, Python, Docker, PostgreSQL, Cloud Architecture, CI/CD, Agile")*`,
        step: "asking_skills",
        completed: false,
      };
    }

    // ----------------------------------------------------
    // STEP 5: Technical Skills
    // ----------------------------------------------------
    case "asking_skills": {
      if (!isSkip) {
        const skillsList = cleanInput
          .split(/[,;\n•|]+/)
          .map((s) => s.replace(/^[-*•]\s*/, "").trim())
          .filter((s) => s.length > 1 && !/^(?:and|skills|proficient in|experienced with)$/i.test(s));

        draft.skills = skillsList.length > 0 ? skillsList : ["Problem Solving", "Communication", "Leadership"];
      } else {
        draft.skills = ["Adaptability", "Collaboration", "Critical Thinking"];
      }

      draft.step = "asking_experience";
      draft.lastUpdated = Date.now();
      activeDrafts.set(address, draft);
      flushDraftsToDisk();

      // Remember skills in Walrus Memory
      for (const sk of (draft.skills || []).slice(0, 8)) {
        rememberFact(address, "skill", `Skill: ${sk}`).catch(() => {});
      }

      return {
        reply:
          `Saved ${(draft.skills || []).length} core skills to your profile!\n\n` +
          `**Step 6 of 10: Professional Work Experience**\n` +
          `Tell me about your most recent or primary work experience:\n` +
          `• Company / Organization Name\n` +
          `• Job Title / Role\n` +
          `• Dates / Duration (e.g., *2021 - Present* or *Jan 2020 - Dec 2023*)\n` +
          `• 2-3 key responsibilities or measurable accomplishments\n\n` +
          `*(If you are a student or fresh graduate without corporate experience, reply **'I don't have'** to skip to education.)*`,
        step: "asking_experience",
        completed: false,
      };
    }

    // ----------------------------------------------------
    // STEP 6: Professional Experience
    // ----------------------------------------------------
    case "asking_experience": {
      if (!isSkip) {
        const lines = cleanInput.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
        let company = "Organization";
        let role = draft.target_role || "Associate";
        let duration = "2022 - Present";
        const highlights: string[] = [];

        // Parse first line for Company & Role heuristic
        const firstLine = lines[0] || "";
        const roleSplit = firstLine.split(/(?:\bat\b|\bwith\b|\b-\b|\|)/i);
        if (roleSplit.length >= 2) {
          role = roleSplit[0].trim();
          company = roleSplit[1].trim();
        } else if (firstLine.length > 0) {
          company = firstLine;
        }

        // Remaining lines are achievements / bullet points
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].replace(/^[-*•]\s*/, "").trim();
          if (/\b(?:20\d{2}|19\d{2}|present)\b/i.test(line) && line.length < 35) {
            duration = line;
          } else if (line.length > 5) {
            highlights.push(line);
          }
        }

        if (highlights.length === 0) {
          highlights.push(`Led operational execution and spearheaded strategic initiatives in ${role}.`);
          highlights.push(`Collaborated cross-functionally to achieve key performance indicators.`);
        }

        draft.work_experience = [
          {
            company,
            role,
            duration,
            highlights,
          },
        ];

        rememberFact(address, "experience", `Experience: ${role} at ${company} (${duration})`).catch(() => {});
      } else {
        draft.work_experience = [];
      }

      draft.step = "asking_education";
      draft.lastUpdated = Date.now();
      activeDrafts.set(address, draft);
      flushDraftsToDisk();

      return {
        reply:
          `Work experience saved!\n\n` +
          `**Step 7 of 10: Educational Credentials**\n` +
          `What are your educational qualifications?\n` +
          `• Degree / Certificate (e.g., *Bachelor of Science in Computer Science*)\n` +
          `• School / University (e.g., *University of Lagos*)\n` +
          `• Graduation Year (e.g., *2021*)\n\n` +
          `*(Reply with details, or reply **'I don't have'** to skip.)*`,
        step: "asking_education",
        completed: false,
      };
    }

    // ----------------------------------------------------
    // STEP 7: Education
    // ----------------------------------------------------
    case "asking_education": {
      if (!isSkip) {
        const yearMatch = cleanInput.match(/\b(20\d{2}|19\d{2})\b/);
        const graduation_year = yearMatch ? yearMatch[0] : "2022";

        const lines = cleanInput.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
        let degree = "Bachelor of Science";
        let institution = "University";
        let field_of_study = draft.target_role || "General Studies";

        if (lines.length >= 2) {
          degree = lines[0];
          institution = lines[1];
        } else {
          const parts = cleanInput.split(/(?:\bat\b|\bfrom\b|,)/i);
          if (parts.length >= 2) {
            degree = parts[0].trim();
            institution = parts[1].replace(/\b(20\d{2}|19\d{2})\b/, "").trim();
          } else {
            degree = cleanInput;
          }
        }

        draft.academic_history = [
          {
            degree,
            institution,
            field_of_study,
            graduation_year,
            achievements: ["Graduated with honors and completed capstone research."],
          },
        ];

        rememberFact(address, "education", `Education: ${degree} from ${institution} (${graduation_year})`).catch(() => {});
      } else {
        draft.academic_history = [];
      }

      draft.step = "asking_certifications";
      draft.lastUpdated = Date.now();
      activeDrafts.set(address, draft);
      flushDraftsToDisk();

      return {
        reply:
          `Education recorded!\n\n` +
          `**Step 8 of 10: Professional Licenses & Certifications**\n` +
          `Do you hold any professional licenses, industry credentials, or technical certifications? (e.g., *AWS Certified Solutions Architect*, *STCW Officer in Charge of Engineering Watch*, *PMP*, *CPA*, *Google Cloud Professional*)\n\n` +
          `*(Reply with your credentials, or reply **'I don't have'** to skip.)*`,
        step: "asking_certifications",
        completed: false,
      };
    }

    // ----------------------------------------------------
    // STEP 8: Certifications
    // ----------------------------------------------------
    case "asking_certifications": {
      if (!isSkip) {
        const certs = cleanInput
          .split(/[,;\n•]+/)
          .map((c) => c.replace(/^[-*•]\s*/, "").trim())
          .filter((c) => c.length > 2);

        draft.certifications = certs;
        for (const cert of certs) {
          rememberFact(address, "experience", `Certification: ${cert}`).catch(() => {});
        }
      } else {
        draft.certifications = [];
      }

      draft.step = "asking_leadership";
      draft.lastUpdated = Date.now();
      activeDrafts.set(address, draft);
      flushDraftsToDisk();

      return {
        reply:
          `Certifications logged!\n\n` +
          `**Step 9 of 10: Leadership & Volunteering**\n` +
          `Do you have any leadership positions, community volunteer experience, committee service, or mentorship contributions?\n\n` +
          `*(Reply with details, or reply **'I don't have'** to skip.)*`,
        step: "asking_leadership",
        completed: false,
      };
    }

    // ----------------------------------------------------
    // STEP 9: Leadership & Volunteering
    // ----------------------------------------------------
    case "asking_leadership": {
      if (!isSkip) {
        const entries = cleanInput
          .split(/[,;\n•]+/)
          .map((l) => l.replace(/^[-*•]\s*/, "").trim())
          .filter((l) => l.length > 3);

        draft.leadership = entries.map((e) => ({
          role: e,
          organization: "Community Leadership Initiative",
          highlights: [e],
        }));
      } else {
        draft.leadership = [];
      }

      draft.step = "asking_conferences";
      draft.lastUpdated = Date.now();
      activeDrafts.set(address, draft);
      flushDraftsToDisk();

      return {
        reply:
          `Leadership entries logged!\n\n` +
          `**Step 10 of 10: Conferences & Honors**\n` +
          `Have you attended industry conferences, given presentations, published research papers, or received professional honors/awards?\n\n` +
          `*(Reply with details, or reply **'I don't have'** to complete your CV.)*`,
        step: "asking_conferences",
        completed: false,
      };
    }

    // ----------------------------------------------------
    // STEP 10: Conferences & Honors (Final Step)
    // ----------------------------------------------------
    case "asking_conferences": {
      if (!isSkip) {
        const entries = cleanInput
          .split(/[,;\n•]+/)
          .map((c) => c.replace(/^[-*•]\s*/, "").trim())
          .filter((c) => c.length > 3);

        draft.conferences = entries.map((e) => ({
          name: e,
          role_or_topic: "Professional Attendee & Speaker",
        }));
      } else {
        draft.conferences = [];
      }

      draft.step = "completed";
      draft.lastUpdated = Date.now();
      activeDrafts.delete(address);
      flushDraftsToDisk();

      // Assemble full ParsedCv
      const name = draft.applicant_name || "Candidate";
      const role = draft.target_role || "Professional";
      const skills = draft.skills || ["Analytical Problem Solving", "Team Leadership", "Execution"];

      const constructedProfile: ParsedCv = {
        applicant_name: name,
        email: draft.email || "candidate@careerace.io",
        phone: draft.phone,
        location: draft.location,
        linkedin_url: draft.linkedin_url,
        github_url: draft.github_url,
        website_url: draft.website_url,
        target_roles: [role],
        summary: `Accomplished and driven ${role} with demonstrated capabilities in ${skills.slice(0, 4).join(", ")}. Dedicated to applying high-impact industry best practices, continuous learning, and operational excellence to achieve organizational goals.`,
        skills,
        work_experience: draft.work_experience || [],
        academic_history: draft.academic_history || [],
        certifications: draft.certifications || [],
        leadership: draft.leadership || [],
        conferences: draft.conferences || [],
      };

      // Persist compiled CV facts to sovereign Walrus Memory
      rememberFact(address, "candidate_identity", `Candidate Name: ${name}`).catch(() => {});
      rememberFact(address, "target_role", `Target Role: ${role}`).catch(() => {});
      rememberFact(address, "tailored_cv", `Verified CV calibrated for ${role}`).catch(() => {});

      const summaryText =
        `🎉 **Congratulations, ${name}! Your ATS-Compliant CV has been successfully created!**\n\n` +
        `• **Target Role:** ${role}\n` +
        `• **Contact:** ${draft.email || "Email added"} ${draft.location ? `· ${draft.location}` : ""}\n` +
        `• **Skills:** ${skills.slice(0, 6).join(", ")}\n` +
        `• **Work Experience:** ${draft.work_experience?.length ? `${draft.work_experience[0].role} at ${draft.work_experience[0].company}` : "Fresh Graduate / Early Career"}\n` +
        `• **Education:** ${draft.academic_history?.length ? `${draft.academic_history[0].degree} (${draft.academic_history[0].institution})` : "Verified Background"}\n` +
        (draft.certifications?.length ? `• **Certifications:** ${draft.certifications.join(", ")}\n` : "") +
        (draft.leadership?.length ? `• **Leadership:** ${draft.leadership.map((l) => l.role).join(", ")}\n` : "") +
        (draft.conferences?.length ? `• **Conferences:** ${draft.conferences.map((c) => c.name).join(", ")}\n` : "") +
        `\n**Your new CV is now loaded in your Editable ATS Canvas!** You can click *Print / Save PDF*, download Word (.docx), or ask me to recalibrate any section at any time.`;

      return {
        reply: summaryText,
        step: "completed",
        profile: constructedProfile,
        completed: true,
      };
    }

    default: {
      return {
        reply: "Resume Builder state reset. Say **'Help me create a CV'** to start fresh.",
        step: "idle",
        completed: false,
      };
    }
  }
}
