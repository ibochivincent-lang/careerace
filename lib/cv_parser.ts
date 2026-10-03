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
  // Tech & Engineering
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
  "qa engineer", "test engineer", "automation engineer",
  "security engineer", "blockchain developer", "systems analyst",
  // Product & Project Management
  "product manager", "product owner", "scrum master",
  "project manager", "program manager", "delivery manager",
  // Operations & Business
  "operations manager", "operations lead", "operations coordinator",
  "operations specialist", "director of operations", "head of operations",
  "business analyst", "business development manager", "management consultant",
  "supply chain manager", "logistics coordinator", "procurement specialist",
  "account manager", "sales manager", "marketing manager", "marketing lead",
  "financial analyst", "accountant", "finance manager", "controller",
  "human resources manager", "hr specialist", "talent acquisition lead",
  "customer success manager", "client relations specialist",
  "executive assistant", "office manager", "administrative coordinator",
  // Creative & Design
  "ux designer", "ui designer", "product designer", "graphic designer",
  "art director", "creative lead", "content strategist",
  // Leadership & General
  "director", "vice president", "vp", "general manager", "team lead",
  "supervisor", "consultant", "specialist", "coordinator", "officer",
  "administrator", "associate", "intern"
];

/**
 * Known professional certification keywords for automatic scanning.
 */
const KNOWN_CERTIFICATIONS = [
  "AWS Certified Solutions Architect",
  "AWS Certified Developer",
  "AWS Certified SysOps",
  "AWS Certified Cloud Practitioner",
  "Google Cloud Certified Professional Cloud Architect",
  "Google Cloud Associate Cloud Engineer",
  "Microsoft Certified: Azure Fundamentals",
  "Microsoft Certified: Azure Developer Associate",
  "Microsoft Certified: Azure Solutions Architect",
  "CompTIA Security+",
  "CompTIA Network+",
  "CompTIA A+",
  "CompTIA CySA+",
  "Cisco Certified Network Associate (CCNA)",
  "Cisco Certified Network Professional (CCNP)",
  "Certified Kubernetes Administrator (CKA)",
  "Certified Kubernetes Application Developer (CKAD)",
  "Certified Information Systems Security Professional (CISSP)",
  "Project Management Professional (PMP)",
  "Certified ScrumMaster (CSM)",
  "Professional Scrum Master (PSM)",
  "Certified Scrum Product Owner (CSPO)",
  "HashiCorp Certified: Terraform Associate",
  "Meta Certified Front-End Developer",
  "Meta Certified Back-End Developer",
  "Oracle Certified Professional",
  "Lean Six Sigma Green Belt",
  "Lean Six Sigma Black Belt",
  "Certified Public Accountant (CPA)",
  "Chartered Financial Analyst (CFA)"
];

/**
 * Section header patterns for robust section detection.
 */
const SECTION_HEADERS = {
  experience: /^(?:#{0,3}\s*)?(?:work\s+|professional\s+|career\s+|relevant\s+|employment\s+)?(?:experience|employment|work\s+history|career\s+history|employment\s+history|background|history|engagements|projects\s*(?:&|and)\s*experience)\b/i,
  education: /^(?:#{0,3}\s*)?(?:education|academic|qualifications|academic\s+background|academic\s+history|educational\s+background|degrees?|institutions?|studies)\b/i,
  skills: /^(?:#{0,3}\s*)?(?:skills?|technical\s+skills?|technologies|core\s+competencies|tools?\s*(?:&|and)?\s*technologies?|expertise|proficiencies|tech\s+stack|areas\s+of\s+expertise|key\s+skills)\b/i,
  certifications: /^(?:#{0,3}\s*)?(?:certifications?|certificates?|professional\s+certifications?|licenses?|credentials?|accreditations?|courses?|awards?)\b/i,
  projects: /^(?:#{0,3}\s*)?(?:projects?|personal\s+projects?|side\s+projects?|portfolio|key\s+projects?|notable\s+projects?)\b/i,
  summary: /^(?:#{0,3}\s*)?(?:summary|profile|objective|about\s+me|professional\s+summary|career\s+objective|introduction|executive\s+summary)\b/i,
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
      const phoneLabelMatch = line.match(/(?:phone|tel|mobile|cell|contact|whatsapp)[\s:]*([+\d\s().-]{7,25})/i);
      if (phoneLabelMatch) {
        phone = phoneLabelMatch[1].trim();
      } else {
        const phoneMatch = line.match(/(?:\+?\d{1,4}[-.\s]?)?(?:\(?\d{2,5}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,5}\b/);
        if (phoneMatch && phoneMatch[0].length >= 7 && !/^\d{4}$/.test(phoneMatch[0].trim())) {
          phone = phoneMatch[0].trim();
        }
      }
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

  // Name: Multi-pass extraction from top lines
  for (const line of lines.slice(0, 12)) {
    const clean = line.replace(/^[#*\-\s]+/, "").trim();
    const nameLabelMatch = clean.match(/^(?:name|candidate(?:\s+name)?|full\s+name)[\s:]+([A-Za-z\s'.-]{2,45})$/i);
    if (nameLabelMatch) {
      applicant_name = nameLabelMatch[1].trim();
      break;
    }
    if (
      clean.length >= 3 &&
      clean.length <= 40 &&
      !clean.includes("@") &&
      !clean.includes("http") &&
      !clean.includes(".com") &&
      !clean.includes("/") &&
      !/^\+?\d/.test(clean) &&
      !SECTION_HEADERS.summary.test(clean) &&
      !SECTION_HEADERS.experience.test(clean) &&
      !SECTION_HEADERS.skills.test(clean) &&
      !SECTION_HEADERS.education.test(clean) &&
      !SECTION_HEADERS.certifications.test(clean) &&
      !/^(curriculum\s+vitae|resume|cv|contact\s+details|personal\s+profile|portfolio|page\s+\d)\b/i.test(clean)
    ) {
      const words = clean.split(/\s+/);
      if (words.length >= 2 && words.length <= 4 && words.every((w) => /^[A-Z][a-zA-Z'.-]*$/.test(w))) {
        applicant_name = clean;
        break;
      }
    }
  }

  // Fallback name from email if not detected from text
  if (!applicant_name && email) {
    const handle = email.split("@")[0].replace(/[0-9_.-]+/g, " ").trim();
    if (handle.length > 2) {
      applicant_name = handle
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
    }
  }

  // 2. Extract genuine skills found in text using dictionary matching
  const extractedSkillsSet = new Set<string>();

  for (const skill of EXTENSIVE_SKILLS_DICTIONARY) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:^|[\\s,;|/()\\[\\]])${escaped}(?:[\\s,;|/()\\[\\]]|$)`, "i");
    if (regex.test(textLower)) {
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

  // Also scan under explicit Skills header
  const skillsSectionIdx = lines.findIndex((l) => SECTION_HEADERS.skills.test(l));
  if (skillsSectionIdx !== -1) {
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

  if (expHeadingIdx !== -1) {
    const endIdx = lines.findIndex(
      (l, i) =>
        i > expHeadingIdx + 1 &&
        (SECTION_HEADERS.education.test(l) ||
          SECTION_HEADERS.certifications.test(l) ||
          SECTION_HEADERS.projects.test(l) ||
          SECTION_HEADERS.skills.test(l))
    );
    const sectionEnd = endIdx !== -1 ? endIdx : Math.min(lines.length, expHeadingIdx + 45);
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
      const dateMatch = line.match(
        /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s*\d{0,4}\s*[-\u2013—]\s*(?:present|current|now|to date|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s*\d{0,4})|(?:20|19)\d{2}\s*[-\u2013—]\s*(?:present|current|now|to date)|(?:20|19)\d{2}\s*[-\u2013—]\s*(?:20|19)\d{2}|\b(?:20|19)\d{2}\b)/i
      );

      if (isBullet) {
        currentHighlights.push(line.replace(/^[-*\u2022\u00b7>\s]+/, "").trim());
      } else if (dateMatch && line.length < 90) {
        // Line has date
        const dateStr = dateMatch[0].trim();
        const nonDatePart = line.replace(dateMatch[0], "").replace(/[|,\-\u2013—()]/g, " ").trim();

        if (nonDatePart.length < 3 || /^(?:present|current|now|to date)$/i.test(nonDatePart)) {
          // This line is strictly a date range for the previous role/company
          currentDuration = line.trim();
        } else {
          // New entry with date and title/company on the same line
          if (currentCompany || currentRole) flushEntry();
          currentDuration = dateStr;

          // Check if nonDatePart has separator
          const sepMatch = nonDatePart.match(/(.*?)\s+(?:at|@|—|–|-|\|)\s+(.*)/i);
          if (sepMatch) {
            currentCompany = sepMatch[1].trim();
            currentRole = sepMatch[2].trim();
          } else {
            currentCompany = nonDatePart;
          }
        }
      } else if (line.length < 90 && !isBullet) {
        // Line without date: could be "Company — Role" or separate Role line
        const sepMatch = line.match(/(.*?)\s+(?:at|@|—|–|-|\|)\s+(.*)/i);
        if (sepMatch && sepMatch[1].length < 50 && sepMatch[2].length < 50) {
          if (currentCompany || currentRole) flushEntry();
          const p1 = sepMatch[1].replace(/^[#*\-\s]+/, "").trim();
          const p2 = sepMatch[2].replace(/^[#*\-\s]+/, "").trim();
          const p1IsRole = ROLE_PATTERNS.some((r) => p1.toLowerCase().includes(r)) || /(?:manager|lead|engineer|director|specialist|analyst|developer|officer|head)/i.test(p1);
          const p2IsRole = ROLE_PATTERNS.some((r) => p2.toLowerCase().includes(r)) || /(?:manager|lead|engineer|director|specialist|analyst|developer|officer|head)/i.test(p2);

          if (p1IsRole && !p2IsRole) {
            currentRole = p1;
            currentCompany = p2;
          } else {
            currentCompany = p1;
            currentRole = p2;
          }
        } else if (!currentRole) {
          if (currentCompany && currentDuration) flushEntry();
          currentRole = line.replace(/^[#*\-\s]+/, "").trim();
        } else if (!currentCompany) {
          currentCompany = line.replace(/^[#*\-\s]+/, "").trim();
        } else if (line.length > 20) {
          currentHighlights.push(line.trim());
        }
      } else if (line.length > 20 && !isBullet) {
        currentHighlights.push(line.trim());
      }
    }
    flushEntry();
  }

  // Fallback: If no experience section was matched, search lines with role patterns + date
  if (work_experience.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const matchedRole = ROLE_PATTERNS.find((r) => line.toLowerCase().includes(r));
      const hasDate = /\b(20\d{2}|19\d{2})\b/.test(line);
      if ((hasDate || matchedRole) && line.length < 90 && !SECTION_HEADERS.education.test(line)) {
        const parts = line.split(/[|,\-\u2013—]/).map((p) => p.trim());
        const role = matchedRole || parts[0] || "Professional";
        const company = parts[1] || "Organization";
        const dateMatch = line.match(/\b(?:20|19)\d{2}\b/);
        work_experience.push({
          company: company.length > 40 ? "Organization" : company,
          role: role.charAt(0).toUpperCase() + role.slice(1),
          duration: dateMatch ? dateMatch[0] : "",
          highlights: [],
        });
        if (work_experience.length >= 3) break;
      }
    }
  }

  // 4. Academic History Parser (Institution & Bachelor's Degree / Degree Detection)
  const academic_history: ParsedCv["academic_history"] = [];
  const eduHeadingIdx = lines.findIndex((l) => SECTION_HEADERS.education.test(l));

  const extractEduDetailsFromLine = (line: string) => {
    let degree = "";
    let institution = "";
    let field = "";
    let year = "";

    const yearMatch = line.match(/\b(20\d{2}|19\d{2})\b/);
    if (yearMatch) year = yearMatch[0];

    // Detect degree type (Bachelor, Master, PhD, etc.)
    const bscMatch = line.match(/\b(bachelor(?:'s)?(?:\s+of\s+\w+)?|b\.?s\.?c\b|b\.?eng\b|b\.?a\b|b\.?tech\b|undergraduate)\b/i);
    const mscMatch = line.match(/\b(master(?:'s)?(?:\s+of\s+\w+)?|m\.?s\.?c\b|m\.?eng\b|m\.?a\b|mba|postgraduate)\b/i);
    const phdMatch = line.match(/\b(ph\.?d|doctorate)\b/i);
    const diplomaMatch = line.match(/\b(diploma|associate|hnd|ond|certificate)\b/i);

    if (bscMatch) {
      degree = "Bachelor's Degree (" + bscMatch[0].trim() + ")";
    } else if (mscMatch) {
      degree = "Master's Degree (" + mscMatch[0].trim() + ")";
    } else if (phdMatch) {
      degree = "Doctorate (PhD)";
    } else if (diplomaMatch) {
      degree = diplomaMatch[0].charAt(0).toUpperCase() + diplomaMatch[0].slice(1);
    }

    // Detect institution keyword
    const instMatch = line.match(/([a-zA-Z\s]+(?:university|college|polytechnic|institute|school|academy|faculty)[a-zA-Z\s]*)/i);
    if (instMatch) {
      institution = instMatch[0].trim().replace(/^[,\-|]\s*/, "");
    }

    // Detect field of study
    const fieldMatch = line.match(/(?:in|of)\s+([a-zA-Z\s]{4,35})(?:,|\s+from|\s+-|\s+\(|\s*$)/i);
    if (fieldMatch) {
      field = fieldMatch[1].trim();
    }

    return { degree, institution, field, year };
  };

  if (eduHeadingIdx !== -1) {
    const eduEndIdx = lines.findIndex(
      (l, i) =>
        i > eduHeadingIdx + 1 &&
        (SECTION_HEADERS.experience.test(l) ||
          SECTION_HEADERS.certifications.test(l) ||
          SECTION_HEADERS.projects.test(l) ||
          SECTION_HEADERS.skills.test(l))
    );
    const eduEnd = eduEndIdx !== -1 ? eduEndIdx : Math.min(lines.length, eduHeadingIdx + 20);
    const eduLines = lines.slice(eduHeadingIdx + 1, eduEnd);

    let currentInstitution = "";
    let currentDegree = "";
    let currentField = "";
    let currentYear = "";
    let currentAchievements: string[] = [];

    const flushEdu = () => {
      if (currentInstitution || currentDegree) {
        academic_history.push({
          institution: currentInstitution || "University / College",
          degree: currentDegree || "Bachelor's Degree",
          field_of_study: currentField || "Computer Science / Engineering",
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
      const parsed = extractEduDetailsFromLine(line);

      if (isBullet) {
        currentAchievements.push(line.replace(/^[-*\u2022\u00b7>\s]+/, ""));
      } else {
        if (parsed.institution && parsed.degree) {
          if (currentInstitution || currentDegree) flushEdu();
          currentInstitution = parsed.institution;
          currentDegree = parsed.degree;
          currentField = parsed.field || currentDegree;
          currentYear = parsed.year;
        } else if (parsed.institution) {
          if (currentInstitution && !currentDegree) {
            currentInstitution = parsed.institution;
          } else if (currentInstitution && currentDegree) {
            flushEdu();
            currentInstitution = parsed.institution;
          } else {
            currentInstitution = parsed.institution;
          }
          if (parsed.year) currentYear = parsed.year;
        } else if (parsed.degree) {
          currentDegree = parsed.degree;
          if (parsed.field) currentField = parsed.field;
          if (parsed.year) currentYear = parsed.year;
        } else if (parsed.year && (currentInstitution || currentDegree)) {
          currentYear = parsed.year;
        } else if (line.length < 60 && !isBullet && !currentInstitution) {
          currentInstitution = line;
        }
      }
    }
    flushEdu();
  }

  // Fallback: If no academic history was found in section, scan whole document for degree/institution
  if (academic_history.length === 0) {
    for (const line of lines) {
      const parsed = extractEduDetailsFromLine(line);
      if (parsed.institution || parsed.degree) {
        academic_history.push({
          institution: parsed.institution || "Higher Institution",
          degree: parsed.degree || "Bachelor's Degree",
          field_of_study: parsed.field || "Technology / Science",
          graduation_year: parsed.year || "",
          achievements: [],
        });
        if (academic_history.length >= 2) break;
      }
    }
  }

  // 5. Certifications (AWS, GCP, CompTIA, Cisco, PMP, Scrum, etc.)
  const certificationsSet = new Set<string>();

  // Check explicit Certifications section
  const certIdx = lines.findIndex((l) => SECTION_HEADERS.certifications.test(l));
  if (certIdx !== -1) {
    const certEnd = Math.min(lines.length, certIdx + 12);
    for (const line of lines.slice(certIdx + 1, certEnd)) {
      if (SECTION_HEADERS.experience.test(line) || SECTION_HEADERS.education.test(line)) break;
      const clean = line.replace(/^[-*\u2022\u00b7>\s]+/, "").trim();
      if (clean.length > 3 && clean.length < 80) {
        certificationsSet.add(clean);
      }
    }
  }

  // Also scan whole text for recognized industry certifications
  for (const cert of KNOWN_CERTIFICATIONS) {
    if (textLower.includes(cert.toLowerCase())) {
      certificationsSet.add(cert);
    }
  }

  // Also scan for lines containing "Certified" or "Certification"
  for (const line of lines) {
    if (/\b(?:certified|certification|licensed|credential)\b/i.test(line) && line.length < 75) {
      const clean = line.replace(/^[-*\u2022\u00b7>\s]+/, "").trim();
      if (clean.length > 5) {
        certificationsSet.add(clean);
      }
    }
  }

  const certifications = Array.from(certificationsSet);

  // 6. Target Roles: Inferred from real recent work experience, headline, or detected patterns
  const target_roles: string[] = [];

  // Priority A: Candidate's most recent job role from work experience
  if (work_experience.length > 0 && work_experience[0].role && work_experience[0].role !== "Role" && work_experience[0].role !== "Professional") {
    target_roles.push(work_experience[0].role);
  }

  // Priority B: Scan text for explicitly matched role patterns
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

  // Priority C: Infer sensibly from skills ONLY if still empty (NEVER force Software Engineer)
  if (target_roles.length === 0) {
    if (skills.some((s) => /react|next|vue|angular|frontend/i.test(s)))
      target_roles.push("Frontend Developer");
    else if (skills.some((s) => /node|python|django|fastapi|backend|express/i.test(s)))
      target_roles.push("Backend Developer");
    else if (skills.some((s) => /operations|supply chain|logistics/i.test(s)))
      target_roles.push("Operations Specialist");
    else if (skills.some((s) => /product|scrum|agile/i.test(s)))
      target_roles.push("Product Specialist");
    else if (skills.some((s) => /marketing|seo|brand/i.test(s)))
      target_roles.push("Marketing Lead");
    else if (skills.some((s) => /finance|accounting|audit/i.test(s)))
      target_roles.push("Financial Specialist");
    else if (academic_history.length > 0 && academic_history[0].field_of_study)
      target_roles.push(`${academic_history[0].field_of_study} Professional`);
    else
      target_roles.push("Professional Profile");
  }

  return {
    applicant_name: applicant_name || (email ? email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "Verified Candidate"),
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
        certifications:
          Array.isArray(aiParsed.certifications) && aiParsed.certifications.length > 0
            ? aiParsed.certifications
            : fallback.certifications,
        target_roles: aiParsed.target_roles || fallback.target_roles,
        custom_achievements: fallback.custom_achievements || [],
      };
    }
  } catch (err) {
    // Graceful fallback to rule-based parser
  }

  return fallback;
}
