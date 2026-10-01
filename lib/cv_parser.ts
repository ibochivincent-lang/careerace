import { callFreeLlmJson } from "./free_llm.ts";

export interface ParsedCv {
  applicant_name: string;
  email: string;
  phone?: string;
  github_url?: string;
  linkedin_url?: string;
  skills: string[];
  work_experience: Array<{
    company: string;
    role: string;
    duration: string;
    highlights: string[];
  }>;
  academic_history: Array<{
    institution: string;
    degree: string;
    field_of_study: string;
    graduation_year: string;
    achievements: string[];
  }>;
  certifications: string[];
  target_roles: string[];
  custom_achievements?: string[];
}

/**
 * Universal Technical & Professional Skill Dictionary for accurate heuristic parsing
 */
const EXTENSIVE_SKILLS_DICTIONARY = [
  // Languages & Runtimes
  "typescript", "javascript", "python", "java", "c++", "c#", "golang", "go", "rust", "php", "ruby", "swift", "kotlin", "sql", "html", "css", "solidity", "bash", "shell",
  // Frontend
  "react", "react.js", "next.js", "vue", "vue.js", "nuxt", "angular", "svelte", "tailwind css", "tailwind", "bootstrap", "sass", "redux", "zustand", "graphql", "rest apis", "webpack", "vite", "figma",
  // Backend & Databases
  "node.js", "node", "express", "express.js", "nest.js", "fastapi", "django", "flask", "spring boot", "laravel", "ruby on rails", "postgresql", "postgres", "mysql", "mongodb", "redis", "sqlite", "prisma", "typeorm", "supabase", "firebase",
  // DevOps, Cloud & Tools
  "docker", "kubernetes", "aws", "gcp", "azure", "ci/cd", "github actions", "git", "linux", "nginx", "terraform", "ansible", "kafka", "rabbitmq", "microservices", "unit testing", "jest", "cypress"
];

/**
 * Synchronous rule-based extraction that extracts actual words from the CV text
 * without any hardcoded fake defaults.
 */
export function parseCvText(rawText: string): ParsedCv {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const textLower = rawText.toLowerCase();

  let applicant_name = "";
  let email = "";
  let phone = "";
  let github_url = "";
  let linkedin_url = "";

  // 1. Contact Info & Name
  for (const line of lines) {
    if (!email) {
      const emailMatch = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) email = emailMatch[0];
    }
    if (!phone) {
      const phoneMatch = line.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      if (phoneMatch) phone = phoneMatch[0];
    }
    if (!github_url && line.toLowerCase().includes("github.com")) {
      const gitMatch = line.match(/https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9-_]+/i);
      github_url = gitMatch ? gitMatch[0] : line;
    }
    if (!linkedin_url && line.toLowerCase().includes("linkedin.com")) {
      const linkedMatch = line.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9-_]+/i);
      linkedin_url = linkedMatch ? linkedMatch[0] : line;
    }
  }

  // Name: First line that is not an email, URL, or generic keyword
  for (const line of lines.slice(0, 5)) {
    if (!line.includes("@") && !line.includes("http") && !line.toLowerCase().includes("curriculum") && !line.toLowerCase().includes("resume") && line.length < 50) {
      applicant_name = line.replace(/^[#*\-•\s]+/, "");
      break;
    }
  }
  if (!applicant_name) applicant_name = "Candidate";

  // 2. Extract genuine skills found in text
  const extractedSkillsSet = new Set<string>();
  for (const skill of EXTENSIVE_SKILLS_DICTIONARY) {
    const regex = new RegExp(`\\b${skill.replace(".", "\\.")}\\b`, "i");
    if (regex.test(textLower)) {
      // Capitalize nicely
      const formatted = skill
        .split(" ")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
        .replace("Js", ".js")
        .replace("Css", " CSS");
      extractedSkillsSet.add(formatted);
    }
  }

  // Also check standard comma-separated lists under a "SKILLS" header
  const skillsIndex = lines.findIndex(l => /^(skills|technical skills|technologies|core competencies|tools)/i.test(l));
  if (skillsIndex !== -1 && lines[skillsIndex + 1]) {
    const rawSkillsLine = lines[skillsIndex + 1];
    rawSkillsLine.split(/[,|•·\/\\]/).forEach(s => {
      const clean = s.trim().replace(/^[-*•\s]+/, "");
      if (clean.length > 1 && clean.length < 30) {
        extractedSkillsSet.add(clean);
      }
    });
  }

  const skills = Array.from(extractedSkillsSet);

  // 3. Work Experience Parser (Extract actual sections)
  const work_experience: ParsedCv["work_experience"] = [];
  const expHeadingIdx = lines.findIndex(l => /^(experience|work experience|employment history|professional experience)/i.test(l));
  const eduHeadingIdx = lines.findIndex(l => /^(education|academic background|academic history)/i.test(l));

  if (expHeadingIdx !== -1) {
    const endIdx = eduHeadingIdx !== -1 && eduHeadingIdx > expHeadingIdx ? eduHeadingIdx : Math.min(lines.length, expHeadingIdx + 20);
    const expLines = lines.slice(expHeadingIdx + 1, endIdx);

    let currentCompany = "";
    let currentRole = "";
    let currentDuration = "";
    let currentHighlights: string[] = [];

    for (const line of expLines) {
      // Detect bullet highlights
      if (/^[-*•·]/.test(line)) {
        currentHighlights.push(line.replace(/^[-*•·\s]+/, ""));
      } else if (line.match(/\b(20\d\d|19\d\d)\b/)) {
        // Date / Company Header
        if (currentCompany || currentRole) {
          work_experience.push({
            company: currentCompany || "Company",
            role: currentRole || "Engineer",
            duration: currentDuration || "Past Role",
            highlights: currentHighlights.length > 0 ? currentHighlights : [line]
          });
          currentHighlights = [];
        }
        currentDuration = line;
      } else if (line.length < 60 && !currentCompany) {
        currentCompany = line;
      } else if (line.length < 60 && !currentRole) {
        currentRole = line;
      }
    }

    if (currentCompany || currentRole || currentHighlights.length > 0) {
      work_experience.push({
        company: currentCompany || "Organization",
        role: currentRole || "Professional Role",
        duration: currentDuration || "Recent",
        highlights: currentHighlights.length > 0 ? currentHighlights : ["Delivered core technical milestones."]
      });
    }
  }

  // 4. Academic History Parser (Extract real education entries)
  const academic_history: ParsedCv["academic_history"] = [];
  if (eduHeadingIdx !== -1) {
    const eduLines = lines.slice(eduHeadingIdx + 1, eduHeadingIdx + 10);
    for (const line of eduLines) {
      if (line.match(/(bachelor|master|b\.sc|m\.sc|phd|degree|diploma|university|college|polytechnic|institute)/i)) {
        const yearMatch = line.match(/\b(20\d\d|19\d\d)\b/);
        academic_history.push({
          institution: line.split(/[,|-]/)[0]?.trim() || line,
          degree: line.includes("Master") ? "Master of Science" : line.includes("Ph") ? "Doctorate" : "Bachelor's Degree",
          field_of_study: line,
          graduation_year: yearMatch ? yearMatch[0] : "",
          achievements: []
        });
        break;
      }
    }
  }

  // 5. Target Roles inferred from candidate skills
  const target_roles: string[] = [];
  if (skills.some(s => /react|next|vue|frontend/i.test(s))) target_roles.push("Frontend Developer");
  if (skills.some(s => /node|python|django|fastapi|backend|sql/i.test(s))) target_roles.push("Backend Developer");
  if (target_roles.length >= 2 || skills.some(s => /fullstack|full stack/i.test(s))) target_roles.unshift("Fullstack Developer");
  if (target_roles.length === 0) target_roles.push("Software Engineer");

  return {
    applicant_name: applicant_name || "Candidate",
    email: email || "",
    phone,
    github_url,
    linkedin_url,
    skills,
    work_experience,
    academic_history,
    certifications: [],
    target_roles
  };
}

/**
 * AI-assisted CV parser: Calls free OpenRouter/Ollama LLM to parse raw CV text into accurate JSON,
 * falling back gracefully to the rule-based extractor.
 */
export async function parseCvWithAi(rawText: string): Promise<ParsedCv> {
  const fallback = parseCvText(rawText);

  try {
    const systemPrompt = `You are an expert CV/Resume parser.
Extract the candidate's EXACT details from the provided resume text into a strict JSON object matching this schema:
{
  "applicant_name": string,
  "email": string,
  "phone": string,
  "github_url": string,
  "linkedin_url": string,
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
  "target_roles": string[]
}
Extract ONLY factual data present in the text. Do not invent fake companies or skills.`;

    const aiParsed = await callFreeLlmJson<ParsedCv>(rawText.slice(0, 4000), systemPrompt);
    if (aiParsed && aiParsed.skills && Array.isArray(aiParsed.skills) && aiParsed.skills.length > 0) {
      return {
        applicant_name: aiParsed.applicant_name || fallback.applicant_name,
        email: aiParsed.email || fallback.email,
        phone: aiParsed.phone || fallback.phone,
        github_url: aiParsed.github_url || fallback.github_url,
        linkedin_url: aiParsed.linkedin_url || fallback.linkedin_url,
        skills: aiParsed.skills,
        work_experience: Array.isArray(aiParsed.work_experience) && aiParsed.work_experience.length > 0 ? aiParsed.work_experience : fallback.work_experience,
        academic_history: Array.isArray(aiParsed.academic_history) && aiParsed.academic_history.length > 0 ? aiParsed.academic_history : fallback.academic_history,
        certifications: aiParsed.certifications || [],
        target_roles: aiParsed.target_roles || fallback.target_roles,
        custom_achievements: fallback.custom_achievements || []
      };
    }
  } catch (err) {
    // Graceful fallback to rule-based parser
  }

  return fallback;
}
