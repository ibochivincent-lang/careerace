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
 * Universal Technical & Professional Skill Dictionary for accurate heuristic parsing.
 * Each entry is lowercased for matching against the CV text.
 */
const EXTENSIVE_SKILLS_DICTIONARY = [
  // Programming Languages & Runtimes
  "typescript", "javascript", "python", "java", "c++", "c#", "golang", "go",
  "rust", "php", "ruby", "swift", "kotlin", "scala", "perl", "r", "matlab",
  "sql", "html", "css", "solidity", "bash", "shell", "powershell", "dart",
  "lua", "haskell", "elixir", "clojure", "objective-c",
  // Frontend Frameworks & Libraries
  "react", "react.js", "reactjs", "next.js", "nextjs", "vue", "vue.js",
  "vuejs", "nuxt", "nuxt.js", "angular", "svelte", "sveltekit", "gatsby",
  "remix", "astro", "jquery", "ember",
  // Frontend Tools & Styling
  "tailwind", "tailwind css", "tailwindcss", "bootstrap", "sass", "scss",
  "less", "styled-components", "material ui", "mui", "chakra ui", "ant design",
  "figma", "sketch", "adobe xd", "framer",
  // State Management & Frontend Patterns
  "redux", "zustand", "mobx", "recoil", "jotai", "pinia", "vuex",
  "graphql", "rest api", "rest apis", "restful", "trpc",
  // Build Tools & Bundlers
  "webpack", "vite", "rollup", "parcel", "esbuild", "turbopack", "babel",
  // Backend Frameworks
  "node.js", "node", "nodejs", "express", "express.js", "expressjs",
  "nestjs", "nest.js", "fastify", "koa", "hapi",
  "fastapi", "django", "flask", "spring", "spring boot", "laravel",
  "ruby on rails", "rails", "phoenix", "actix", "gin",
  // Databases
  "postgresql", "postgres", "mysql", "mongodb", "redis", "sqlite",
  "mariadb", "oracle", "sql server", "mssql", "cassandra", "dynamodb",
  "couchdb", "neo4j", "elasticsearch", "opensearch",
  // ORMs & DB Tools
  "prisma", "typeorm", "sequelize", "mongoose", "drizzle", "knex",
  "sqlalchemy", "hibernate", "active record",
  // Cloud & BaaS
  "supabase", "firebase", "aws", "amazon web services", "gcp",
  "google cloud", "azure", "microsoft azure", "heroku", "vercel",
  "netlify", "cloudflare", "digitalocean", "linode",
  // DevOps & CI/CD
  "docker", "kubernetes", "k8s", "ci/cd", "github actions", "gitlab ci",
  "jenkins", "circleci", "travis ci", "terraform", "ansible", "puppet",
  "chef", "vagrant", "helm",
  // Version Control & Collaboration
  "git", "github", "gitlab", "bitbucket", "svn",
  // Infrastructure & Networking
  "linux", "ubuntu", "centos", "nginx", "apache", "caddy",
  // Messaging & Streaming
  "kafka", "rabbitmq", "redis pub/sub", "sqs", "sns", "nats",
  // Architecture Patterns
  "microservices", "serverless", "event-driven", "monolith",
  "domain-driven design", "clean architecture",
  // Testing
  "unit testing", "jest", "vitest", "cypress", "playwright", "selenium",
  "mocha", "chai", "pytest", "junit", "rspec", "postman",
  "test-driven development", "tdd", "bdd",
  // Data & ML
  "pandas", "numpy", "scipy", "scikit-learn", "tensorflow", "pytorch",
  "keras", "jupyter", "apache spark", "hadoop", "airflow", "dbt",
  "tableau", "power bi", "looker", "data engineering", "etl",
  "machine learning", "deep learning", "nlp", "computer vision",
  // Mobile
  "react native", "flutter", "swiftui", "jetpack compose", "ionic",
  "xamarin", "expo",
  // Web3 / Blockchain
  "web3", "ethereum", "solana", "sui", "smart contracts",
  "hardhat", "foundry", "wagmi", "ethers.js", "web3.js",
  // APIs & Protocols
  "grpc", "websockets", "soap", "oauth", "jwt", "openapi",
  "swagger",
  // Project Management & Methodologies
  "agile", "scrum", "kanban", "jira", "confluence", "notion",
  "project management",
  // Design & UX
  "ui/ux", "ux design", "ui design", "wireframing", "prototyping",
  "user research", "design systems", "responsive design",
  // Soft Skills
  "leadership", "team management", "communication", "problem-solving",
  "critical thinking", "mentoring", "cross-functional",
];

/**
 * Common role title patterns to detect in CV text.
 */
const ROLE_PATTERNS = [
  "software engineer", "software developer", "web developer",
  "frontend developer", "frontend engineer", "front-end developer",
  "backend developer", "backend engineer", "back-end developer",
  "fullstack developer", "fullstack engineer", "full-stack developer",
  "full stack developer", "senior software engineer", "lead engineer",
  "principal engineer", "staff engineer", "engineering manager",
  "technical lead", "tech lead", "cto", "vp of engineering",
  "devops engineer", "sre", "site reliability engineer",
  "data engineer", "data scientist", "data analyst",
  "machine learning engineer", "ml engineer", "ai engineer",
  "mobile developer", "ios developer", "android developer",
  "cloud engineer", "cloud architect", "solutions architect",
  "product manager", "product owner", "scrum master",
  "qa engineer", "test engineer", "automation engineer",
  "ux designer", "ui designer", "product designer",
  "project manager", "program manager", "delivery manager",
  "business analyst", "systems analyst",
  "security engineer", "blockchain developer",
  "intern", "junior developer", "mid-level", "senior",
];

/**
 * Section header patterns for robust section detection.
 */
const SECTION_HEADERS = {
  experience: /^(?:#{0,3}\s*)?(?:work\s+)?(?:experience|employment|professional\s+experience|career\s+history|work\s+history|relevant\s+experience)/i,
  education: /^(?:#{0,3}\s*)?(?:education|academic|qualifications|academic\s+background|academic\s+history|degrees?)/i,
  skills: /^(?:#{0,3}\s*)?(?:skills?|technical\s+skills?|technologies|core\s+competencies|tools?\s*(?:&|and)?\s*technologies?|expertise|proficiencies|tech\s+stack)/i,
  certifications: /^(?:#{0,3}\s*)?(?:certifications?|certificates?|professional\s+certifications?|licenses?|credentials?)/i,
  projects: /^(?:#{0,3}\s*)?(?:projects?|personal\s+projects?|side\s+projects?|portfolio|key\s+projects?|notable\s+projects?)/i,
  summary: /^(?:#{0,3}\s*)?(?:summary|profile|objective|about\s+me|professional\s+summary|career\s+objective|introduction)/i,
};

/**
 * Synchronous rule-based extraction that extracts actual words from the CV text
 * without any hardcoded fake defaults.
 */
export function parseCvText(rawText: string): ParsedCv {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const textLower = rawText.toLowerCase();

  let applicant_name = "";
  let email = "";
  let phone = "";
  let github_url = "";
  let linkedin_url = "";

  // 1. Contact Info & Name Extraction
  for (const line of lines) {
    if (!email) {
      const emailMatch = line.match(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
      );
      if (emailMatch) email = emailMatch[0];
    }
    if (!phone) {
      const phoneMatch = line.match(
        /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/
      );
      if (phoneMatch) phone = phoneMatch[0];
    }
    if (!github_url && /github\.com/i.test(line)) {
      const gitMatch = line.match(
        /https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i
      );
      github_url = gitMatch ? gitMatch[0] : "";
    }
    if (!linkedin_url && /linkedin\.com/i.test(line)) {
      const linkedMatch = line.match(
        /https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i
      );
      linkedin_url = linkedMatch ? linkedMatch[0] : "";
    }
  }

  // Name: First non-empty line that is not an email, URL, phone, or section header
  for (const line of lines.slice(0, 8)) {
    const clean = line.replace(/^[#*\-\s]+/, "").trim();
    if (
      clean.length > 1 &&
      clean.length < 50 &&
      !clean.includes("@") &&
      !clean.includes("http") &&
      !/^\+?\d/.test(clean) &&
      !SECTION_HEADERS.summary.test(clean) &&
      !SECTION_HEADERS.experience.test(clean) &&
      !SECTION_HEADERS.skills.test(clean) &&
      !/^(curriculum|resume|cv)\b/i.test(clean)
    ) {
      applicant_name = clean;
      break;
    }
  }

  // 2. Extract genuine skills found in text using dictionary matching
  const extractedSkillsSet = new Set<string>();

  for (const skill of EXTENSIVE_SKILLS_DICTIONARY) {
    // Build regex that handles word boundaries properly for skills with special chars
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:^|[\\s,;|/()\\[\\]])${escaped}(?:[\\s,;|/()\\[\\]]|$)`, "i");
    if (regex.test(textLower)) {
      // Format the skill name nicely
      const formatted = skill
        .split(/[\s-]+/)
        .map((w) =>
          w.toUpperCase() === w ? w : w.charAt(0).toUpperCase() + w.slice(1)
        )
        .join(" ")
        .replace(/\bJs\b/g, ".js")
        .replace(/\bCss\b/g, "CSS")
        .replace(/\bApi\b/g, "API")
        .replace(/\bApis\b/g, "APIs")
        .replace(/\bSql\b/g, "SQL")
        .replace(/\bHtml\b/g, "HTML")
        .replace(/\bUi\b/g, "UI")
        .replace(/\bUx\b/g, "UX")
        .replace(/\bCi\/cd\b/gi, "CI/CD")
        .replace(/\bAws\b/g, "AWS")
        .replace(/\bGcp\b/g, "GCP")
        .replace(/\bSre\b/g, "SRE")
        .replace(/\bCto\b/g, "CTO")
        .replace(/\bDbt\b/g, "dbt")
        .replace(/\bEtl\b/g, "ETL")
        .replace(/\bNlp\b/g, "NLP")
        .replace(/\bGrpc\b/g, "gRPC")
        .replace(/\bJwt\b/g, "JWT");
      extractedSkillsSet.add(formatted);
    }
  }

  // Also scan for skills under explicit "Skills" section headers
  const skillsSectionIdx = lines.findIndex((l) => SECTION_HEADERS.skills.test(l));
  if (skillsSectionIdx !== -1) {
    // Scan the next several lines after the skills header
    const nextSectionIdx = lines.findIndex(
      (l, i) =>
        i > skillsSectionIdx &&
        (SECTION_HEADERS.experience.test(l) ||
          SECTION_HEADERS.education.test(l) ||
          SECTION_HEADERS.certifications.test(l) ||
          SECTION_HEADERS.projects.test(l))
    );
    const endIdx = nextSectionIdx !== -1 ? nextSectionIdx : Math.min(lines.length, skillsSectionIdx + 15);
    const skillLines = lines.slice(skillsSectionIdx + 1, endIdx);

    for (const line of skillLines) {
      // Split on common delimiters
      line.split(/[,|;\u2022\u00b7\/\\]/).forEach((s) => {
        const clean = s.replace(/^[-*\u2022\s:]+/, "").trim();
        if (clean.length > 1 && clean.length < 40 && !/^\d+$/.test(clean)) {
          extractedSkillsSet.add(clean);
        }
      });
    }
  }

  const skills = Array.from(extractedSkillsSet);

  // 3. Work Experience Parser
  const work_experience: ParsedCv["work_experience"] = [];
  const expHeadingIdx = lines.findIndex((l) => SECTION_HEADERS.experience.test(l));
  const eduHeadingIdx = lines.findIndex((l) => SECTION_HEADERS.education.test(l));

  if (expHeadingIdx !== -1) {
    // Find the end of the experience section
    const endIdx = lines.findIndex(
      (l, i) =>
        i > expHeadingIdx + 1 &&
        (SECTION_HEADERS.education.test(l) ||
          SECTION_HEADERS.certifications.test(l) ||
          SECTION_HEADERS.projects.test(l) ||
          SECTION_HEADERS.skills.test(l))
    );
    const sectionEnd = endIdx !== -1 ? endIdx : Math.min(lines.length, expHeadingIdx + 30);
    const expLines = lines.slice(expHeadingIdx + 1, sectionEnd);

    let currentCompany = "";
    let currentRole = "";
    let currentDuration = "";
    let currentHighlights: string[] = [];

    const flushEntry = () => {
      if (currentCompany || currentRole) {
        work_experience.push({
          company: currentCompany || "Organization",
          role: currentRole || "Role",
          duration: currentDuration || "",
          highlights: currentHighlights.length > 0 ? currentHighlights : [],
        });
      }
      currentCompany = "";
      currentRole = "";
      currentDuration = "";
      currentHighlights = [];
    };

    for (const line of expLines) {
      const isBullet = /^[-*\u2022\u00b7>]/.test(line);
      const hasDate = /\b(20\d{2}|19\d{2})\b/.test(line) ||
        /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s*[-\u2013]\s*/i.test(line) ||
        /\b(present|current|now)\b/i.test(line);
      const isShortLine = line.length < 70 && !isBullet;
      const looksLikeRole = ROLE_PATTERNS.some((r) =>
        line.toLowerCase().includes(r)
      );

      if (isBullet) {
        currentHighlights.push(line.replace(/^[-*\u2022\u00b7>\s]+/, ""));
      } else if (hasDate && isShortLine) {
        // This line likely contains a date range and possibly company/role
        if (currentCompany || currentRole) {
          flushEntry();
        }
        // Try to extract duration from the line
        const dateMatch = line.match(
          /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s*\d{0,4}\s*[-\u2013]\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)?\w*\s*\d{0,4}|(?:20|19)\d{2}\s*[-\u2013]\s*(?:20|19)?\d{0,4}|(?:20|19)\d{2}\s*[-\u2013]\s*(?:present|current|now))/i
        );
        if (dateMatch) {
          currentDuration = dateMatch[0].trim();
          // The rest might be a company or role
          const remainder = line.replace(dateMatch[0], "").replace(/[|,\-\u2013]/g, " ").trim();
          if (remainder.length > 2 && remainder.length < 60) {
            if (looksLikeRole) {
              currentRole = remainder;
            } else {
              currentCompany = remainder;
            }
          }
        } else {
          currentDuration = line;
        }
      } else if (isShortLine && !currentCompany) {
        currentCompany = line.replace(/^[#*\-\s]+/, "").trim();
      } else if (isShortLine && !currentRole) {
        currentRole = line.replace(/^[#*\-\s]+/, "").trim();
      } else if (line.length > 30 && !isBullet) {
        // Long non-bullet lines are likely description text
        currentHighlights.push(line);
      }
    }
    flushEntry();
  }

  // 4. Academic History Parser
  const academic_history: ParsedCv["academic_history"] = [];
  if (eduHeadingIdx !== -1) {
    const eduEndIdx = lines.findIndex(
      (l, i) =>
        i > eduHeadingIdx + 1 &&
        (SECTION_HEADERS.experience.test(l) ||
          SECTION_HEADERS.certifications.test(l) ||
          SECTION_HEADERS.projects.test(l) ||
          SECTION_HEADERS.skills.test(l))
    );
    const eduEnd = eduEndIdx !== -1 ? eduEndIdx : Math.min(lines.length, eduHeadingIdx + 15);
    const eduLines = lines.slice(eduHeadingIdx + 1, eduEnd);

    let currentInstitution = "";
    let currentDegree = "";
    let currentField = "";
    let currentYear = "";
    let currentAchievements: string[] = [];

    const flushEdu = () => {
      if (currentInstitution || currentDegree) {
        academic_history.push({
          institution: currentInstitution || "Institution",
          degree: currentDegree || "Degree",
          field_of_study: currentField || currentDegree,
          graduation_year: currentYear || "",
          achievements: currentAchievements,
        });
      }
      currentInstitution = "";
      currentDegree = "";
      currentField = "";
      currentYear = "";
      currentAchievements = [];
    };

    for (const line of eduLines) {
      const isBullet = /^[-*\u2022\u00b7>]/.test(line);
      const hasDegreeKeyword =
        /\b(bachelor|master|b\.?s\.?c|m\.?s\.?c|b\.?a\b|m\.?a\b|ph\.?d|degree|diploma|certificate|associate|mba|b\.?eng|m\.?eng)/i.test(
          line
        );
      const hasSchoolKeyword =
        /\b(university|college|polytechnic|institute|school|academy|faculty)\b/i.test(
          line
        );
      const yearMatch = line.match(/\b(20\d{2}|19\d{2})\b/);

      if (isBullet) {
        currentAchievements.push(line.replace(/^[-*\u2022\u00b7>\s]+/, ""));
      } else if (hasSchoolKeyword && !currentInstitution) {
        if (currentInstitution || currentDegree) flushEdu();
        currentInstitution = line.replace(/^[#*\-\s]+/, "").trim();
        if (yearMatch) currentYear = yearMatch[0];
      } else if (hasDegreeKeyword) {
        currentDegree = line.replace(/^[#*\-\s]+/, "").trim();
        currentField = currentDegree;
        if (yearMatch) currentYear = yearMatch[0];
      } else if (line.length < 60 && yearMatch && !currentInstitution) {
        currentInstitution = line.replace(/^[#*\-\s]+/, "").trim();
        currentYear = yearMatch[0];
      }
    }
    flushEdu();
  }

  // 5. Certifications
  const certifications: string[] = [];
  const certIdx = lines.findIndex((l) => SECTION_HEADERS.certifications.test(l));
  if (certIdx !== -1) {
    const certEnd = Math.min(lines.length, certIdx + 10);
    for (const line of lines.slice(certIdx + 1, certEnd)) {
      if (SECTION_HEADERS.experience.test(line) || SECTION_HEADERS.education.test(line)) break;
      const clean = line.replace(/^[-*\u2022\u00b7>\s]+/, "").trim();
      if (clean.length > 3 && clean.length < 100) {
        certifications.push(clean);
      }
    }
  }

  // 6. Target Roles inferred from candidate skills and detected roles in text
  const target_roles: string[] = [];

  // Check which role patterns appear in the CV text
  for (const role of ROLE_PATTERNS) {
    if (textLower.includes(role)) {
      const formatted = role
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      if (!target_roles.includes(formatted)) {
        target_roles.push(formatted);
      }
      if (target_roles.length >= 3) break;
    }
  }

  // Fallback: infer from skills
  if (target_roles.length === 0) {
    if (skills.some((s) => /react|next|vue|angular|frontend|front.end/i.test(s)))
      target_roles.push("Frontend Developer");
    if (skills.some((s) => /node|python|django|fastapi|backend|back.end|express/i.test(s)))
      target_roles.push("Backend Developer");
    if (
      target_roles.length >= 2 ||
      skills.some((s) => /fullstack|full.stack/i.test(s))
    )
      target_roles.unshift("Fullstack Developer");
    if (skills.some((s) => /docker|kubernetes|terraform|devops|ci\/cd/i.test(s)))
      target_roles.push("DevOps Engineer");
    if (skills.some((s) => /machine learning|tensorflow|pytorch|data/i.test(s)))
      target_roles.push("Data Engineer");
    if (target_roles.length === 0) target_roles.push("Software Engineer");
  }

  return {
    applicant_name: applicant_name || "Candidate",
    email: email || "",
    phone,
    github_url,
    linkedin_url,
    skills,
    work_experience,
    academic_history,
    certifications,
    target_roles,
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

    const aiParsed = await callFreeLlmJson<ParsedCv>(
      rawText.slice(0, 4000),
      systemPrompt
    );
    if (
      aiParsed &&
      aiParsed.skills &&
      Array.isArray(aiParsed.skills) &&
      aiParsed.skills.length > 0
    ) {
      return {
        applicant_name: aiParsed.applicant_name || fallback.applicant_name,
        email: aiParsed.email || fallback.email,
        phone: aiParsed.phone || fallback.phone,
        github_url: aiParsed.github_url || fallback.github_url,
        linkedin_url: aiParsed.linkedin_url || fallback.linkedin_url,
        skills: aiParsed.skills,
        work_experience:
          Array.isArray(aiParsed.work_experience) &&
          aiParsed.work_experience.length > 0
            ? aiParsed.work_experience
            : fallback.work_experience,
        academic_history:
          Array.isArray(aiParsed.academic_history) &&
          aiParsed.academic_history.length > 0
            ? aiParsed.academic_history
            : fallback.academic_history,
        certifications: aiParsed.certifications || fallback.certifications,
        target_roles: aiParsed.target_roles || fallback.target_roles,
        custom_achievements: fallback.custom_achievements || [],
      };
    }
  } catch (err) {
    // Graceful fallback to rule-based parser
  }

  return fallback;
}
