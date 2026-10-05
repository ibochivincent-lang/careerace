import { callFreeLlmJson } from "./free_llm.ts";
export {
  parseCvText,
  EXTENSIVE_SKILLS_DICTIONARY,
  ROLE_PATTERNS,
  KNOWN_CERTIFICATIONS,
  SECTION_HEADERS,
  type ParsedCv
} from "./heuristic_cv_parser.ts";
import { parseCvText, type ParsedCv } from "./heuristic_cv_parser.ts";

/**
 * AI-assisted CV parser: Calls free OpenRouter/Ollama LLM to parse raw CV text into accurate JSON,
 * falling back gracefully to the rule-based extractor.
 */
export async function parseCvWithAi(
  rawText: string,
  custom_keys?: {
    google?: string;
    groq?: string;
    openrouter?: string;
    openai?: string;
    opencode?: string;
  }
): Promise<ParsedCv> {
  const fallback = parseCvText(rawText);

  try {
    const systemPrompt = `You are a world-class executive CV and technical resume parser.
Your task is to analyze the candidate's raw CV/Resume text and extract their COMPLETE, VERIFIED professional profile into a strict JSON object.

CRITICAL EXTRACTION REQUIREMENTS:
1. "applicant_name": The candidate's actual full personal name (usually at the very top of the CV header). Never return "Candidate" or "Resume" if a real name exists.
2. "email", "phone", "github_url", "linkedin_url": Extract all available contact details and portfolio links.
3. "skills": Extract ALL programming languages, frameworks, developer tools, cloud platforms, engineering competencies, and domain specializations mentioned.
4. "work_experience": Extract every professional role listed.
   CRITICAL RULES:
   - "company": The actual company, corporation, firm, bank, agency, vessel, or employer name (e.g. "First Bank of Nigeria", "Bourbon Interoil", "Maersk", "Stripe"). It almost always appears right before or right after the role title or on an adjacent line. NEVER return generic placeholders like "Organization", "Tech Company", "Previous Employer", or "Company".
   - "role": Exact professional job title (e.g. "Business Relationship Officer", "Marine Engineer", "Senior Software Developer").
   - "duration": Date range (e.g. "2021 - Present" or "Jan 2019 - Dec 2022").
   - "highlights": Array of 2-5 detailed bullet point achievements, projects, or responsibilities.
5. "academic_history": Extract every university, college, school, or institution:
   - "institution": School or university name
   - "degree": Degree type (e.g. B.S., B.Eng, M.S., Diploma)
   - "field_of_study": Major or department (e.g. Marine Engineering, Mechanical Engineering, Computer Science)
   - "graduation_year": Year or date range
   - "achievements": Honors, awards, or key coursework
6. "certifications": Any professional certificates or licenses.
7. "leadership": Extract any leadership, community volunteer, committee, or extracurricular service roles.
8. "conferences": Extract conferences, seminars, symposiums, or presentations attended/delivered.
9. "target_roles": Inferred or stated job positions this candidate qualifies for (e.g. "Marine Engineer", "Naval Architect", "Mechanical Engineer", "Software Engineer").

Strict Output JSON Schema:
{
  "applicant_name": string,
  "email": string,
  "phone": string,
  "github_url": string,
  "linkedin_url": string,
  "website_url": string,
  "skills": string[],
  "work_experience": [
    {
      "company": string,
      "role": string,
      "duration": string,
      "highlights": string[]
    }
  ],
  "academic_history": [
    {
      "institution": string,
      "degree": string,
      "field_of_study": string,
      "graduation_year": string,
      "achievements": string[]
    }
  ],
  "certifications": string[],
  "leadership": [
    {
      "role": string,
      "organization": string,
      "duration": string,
      "highlights": string[]
    }
  ],
  "conferences": [
    {
      "name": string,
      "role_or_topic": string,
      "year": string,
      "location": string
    }
  ],
  "target_roles": string[]
}
Extract ONLY factual data present in the text. Return raw JSON only.`;

    const aiParsed = await callFreeLlmJson<ParsedCv>(
      rawText.slice(0, 25000),
      systemPrompt,
      custom_keys
    );

    if (aiParsed && typeof aiParsed === "object") {
      // Intelligently merge skills from both AI and dictionary heuristic parser
      const combinedSkills = Array.from(
        new Set([
          ...(Array.isArray(aiParsed.skills) ? aiParsed.skills : []),
          ...(Array.isArray(fallback.skills) ? fallback.skills : []),
        ])
      ).filter(Boolean);

      const resolvedName =
        aiParsed.applicant_name &&
        aiParsed.applicant_name.trim().length > 1 &&
        aiParsed.applicant_name.toLowerCase() !== "candidate" &&
        aiParsed.applicant_name.toLowerCase() !== "resume"
          ? aiParsed.applicant_name.trim()
          : fallback.applicant_name && fallback.applicant_name !== "Candidate"
          ? fallback.applicant_name
          : "Candidate";

      const resolvedWorkExp =
        Array.isArray(aiParsed.work_experience) && aiParsed.work_experience.length > 0
          ? aiParsed.work_experience.map((exp: any, idx: number) => {
              const compRaw = typeof exp.company === "string" ? exp.company.trim() : "";
              const isGenericComp = !compRaw || /^(?:organization|company|employer|client|previous tech organization|target organization|my previous organization)$/i.test(compRaw);
              const fallbackComp = fallback.work_experience?.[idx]?.company || fallback.work_experience?.[0]?.company || "";
              const cleanComp = isGenericComp ? (fallbackComp && !/^(?:organization|company)$/i.test(fallbackComp) ? fallbackComp : "") : compRaw;

              return {
                company: cleanComp,
                role: exp.role || fallback.work_experience?.[idx]?.role || "Professional",
                duration: exp.duration || fallback.work_experience?.[idx]?.duration || "",
                highlights: Array.isArray(exp.highlights) && exp.highlights.length > 0 ? exp.highlights : (fallback.work_experience?.[idx]?.highlights || []),
              };
            })
          : fallback.work_experience;

      const resolvedAcademic =
        Array.isArray(aiParsed.academic_history) && aiParsed.academic_history.length > 0
          ? aiParsed.academic_history
          : fallback.academic_history;

      const resolvedTargetRoles =
        Array.isArray(aiParsed.target_roles) && aiParsed.target_roles.length > 0
          ? aiParsed.target_roles
          : fallback.target_roles.length > 0
          ? fallback.target_roles
          : resolvedWorkExp.length > 0
          ? [resolvedWorkExp[0].role]
          : ["Engineer"];

      const resolvedLeadership =
        Array.isArray(aiParsed.leadership) && aiParsed.leadership.length > 0
          ? aiParsed.leadership
          : fallback.leadership;

      const resolvedConferences =
        Array.isArray(aiParsed.conferences) && aiParsed.conferences.length > 0
          ? aiParsed.conferences
          : fallback.conferences;

      return {
        applicant_name: resolvedName,
        email: aiParsed.email || fallback.email,
        phone: aiParsed.phone || fallback.phone,
        github_url: aiParsed.github_url || fallback.github_url,
        linkedin_url: aiParsed.linkedin_url || fallback.linkedin_url,
        website_url: aiParsed.website_url || fallback.website_url,
        skills: combinedSkills.length > 0 ? combinedSkills : fallback.skills,
        work_experience: resolvedWorkExp,
        academic_history: resolvedAcademic,
        certifications:
          Array.isArray(aiParsed.certifications) && aiParsed.certifications.length > 0
            ? aiParsed.certifications
            : fallback.certifications,
        target_roles: resolvedTargetRoles,
        custom_achievements: fallback.custom_achievements || [],
        leadership: resolvedLeadership,
        conferences: resolvedConferences,
        attachments: fallback.attachments,
      };
    }
  } catch (err) {
    // Graceful fallback to rule-based parser on any network or parsing issue
  }

  return fallback;
}
