/**
 * Universal Client & Server Heuristic CV Parser
 * Pure TypeScript, zero external server dependencies, instant execution (<10ms).
 * Accurately extracts candidate name, contact, skills, work experience,
 * academic background, certifications, and target roles directly from text.
 */

export interface ProofAttachment {
  id: string;
  title: string;
  category: "work" | "certificate" | "leadership" | "project" | "other";
  targetId?: string;
  url?: string;
  blobId?: string;
  walrusUrl?: string;
  previewUrl?: string;
  fileType?: string;
  uploadedAt: string;
  isExternal?: boolean;
}

export interface ParsedCv {
  applicant_name: string;
  email: string;
  phone?: string;
  github_url?: string;
  linkedin_url?: string;
  location?: string;
  website_url?: string;
  skills: string[];
  work_experience: Array<{
    company: string;
    role: string;
    duration: string;
    highlights: string[];
    proofAttachment?: ProofAttachment;
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
  summary?: string;
  leadership?: Array<{
    role: string;
    organization: string;
    duration?: string;
    highlights?: string[];
    proofAttachment?: ProofAttachment;
  }>;
  conferences?: Array<{
    name: string;
    role_or_topic?: string;
    year?: string;
    location?: string;
  }>;
  attachments?: ProofAttachment[];
}

export const EXTENSIVE_SKILLS_DICTIONARY = [
  // Programming Languages & Runtimes
  "typescript", "javascript", "python", "java", "c++", "c#", "golang", "go",
  "rust", "php", "ruby", "swift", "kotlin", "scala", "perl", "r", "matlab",
  "sql", "html", "css", "solidity", "bash", "shell", "powershell", "dart",
  "lua", "haskell", "elixir", "clojure", "objective-c",
  // Engineering, CAD, Simulation & Marine Engineering Specialized
  "marine engineering", "naval architecture", "marine power plants", "autocad",
  "solidworks", "ansys", "matlab", "simulink", "cad", "cam", "finite element analysis",
  "fea", "computational fluid dynamics", "cfd", "ship propulsion", "ship hydrodynamics",
  "fluid mechanics", "thermodynamics", "heat transfer", "machine design",
  "offshore engineering", "subsea systems", "vessel maintenance", "dry docking",
  "ship construction", "stability analysis", "stcw", "solas", "marpol", "marine diesel",
  "diesel engines", "piping and instrumentation", "p&id", "turbomachinery", "hvac",
  "pumps and compressors", "hydraulics", "pneumatics", "mechanical design",
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
  "web3", "ethereum", "solana", "sui", "walrus", "smart contracts",
  "hardhat", "foundry", "wagmi", "ethers.js", "web3.js",
  // APIs & Protocols
  "grpc", "websockets", "soap", "oauth", "jwt", "openapi",
  "swagger",
  // Project Management & Methodologies
  "agile", "scrum", "kanban", "jira", "confluence", "notion",
  "project management",
  // Soft Skills
  "leadership", "team management", "communication", "problem-solving",
  "critical thinking", "mentoring", "cross-functional"
];

export const ROLE_PATTERNS = [
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
  "systems engineer", "network engineer", "database administrator",
  // Healthcare, Medicine & Clinical
  "physician", "doctor", "registered nurse", "nurse practitioner",
  "clinical specialist", "pharmacist", "medical director", "surgeon",
  "physical therapist", "radiologist", "anesthesiologist", "biomedical engineer",
  "clinical researcher", "healthcare administrator", "medical laboratory scientist",
  // Finance, Banking & Accounting
  "financial analyst", "investment banker", "portfolio manager", "accountant",
  "auditor", "chief financial officer", "cfo", "finance director",
  "controller", "tax consultant", "actuary", "risk analyst", "credit analyst",
  "wealth manager", "equity research analyst", "bookkeeper",
  // Mechanical, Civil, Electrical & Industrial Engineering
  "mechanical engineer", "civil engineer", "electrical engineer", "structural engineer",
  "chemical engineer", "industrial engineer", "petroleum engineer", "process engineer",
  "marine engineer", "naval architect", "subsea engineer", "offshore engineer",
  "propulsion engineer", "vessel superintendent", "cad engineer",
  "design engineer", "project engineer", "plant engineer", "maintenance engineer",
  // Product, Design & Creative
  "product manager", "product owner", "scrum master",
  "ui/ux designer", "ux designer", "ui designer", "product designer",
  "graphic designer", "art director", "creative director", "brand designer",
  "copywriter", "content strategist", "technical writer",
  // Marketing & Sales
  "marketing manager", "digital marketer", "growth lead", "growth marketer",
  "seo specialist", "content marketer", "social media manager", "performance marketer",
  "account executive", "sales development representative", "sdr", "sales director",
  "business development manager", "customer success manager", "account manager",
  // Human Resources & Legal
  "hr manager", "human resources director", "talent acquisition specialist",
  "recruiter", "people operations manager", "hr business partner",
  "general counsel", "attorney", "lawyer", "legal counsel", "paralegal", "compliance officer",
  // Operations & Business
  "operations manager", "operations lead", "operations coordinator",
  "operations specialist", "director of operations", "head of operations",
  "chief operating officer", "coo", "general manager",
  "supply chain manager", "logistics coordinator", "procurement specialist",
  // Banking, Relationship Management, Corporate & Public Sector
  "business relationship officer", "relationship officer", "customer relationship officer",
  "client relationship officer", "relationship manager", "credit officer", "loan officer",
  "branch manager", "bank teller", "operations officer", "administrative officer",
  "commercial officer", "business development officer", "marketing officer", "technical officer",
  "executive trainee", "management trainee", "commercial manager", "commercial executive",
  "account relationship officer", "client service officer", "underwriting officer",
  // Maritime & Offshore Deck/Engine Officers
  "chief officer", "second engineer", "third engineer", "fourth engineer", "cadet engineer",
  "deck officer", "safety officer", "environmental officer", "marine superintendent",
  "port captain", "harbor pilot", "cargo surveyor"
];

export const KNOWN_CERTIFICATIONS = [
  "STCW Certificate of Competency",
  "Marine Engineer Officer Class 1 / Class 2",
  "Certified Marine Surveyor",
  "AutoCAD Certified Professional",
  "SolidWorks Certified Associate (CSWA)",
  "SolidWorks Certified Professional (CSWP)",
  "AWS Certified Solutions Architect",
  "AWS Certified Developer",
  "Google Cloud Certified Professional Cloud Architect",
  "Microsoft Certified: Azure Fundamentals",
  "CompTIA Security+",
  "CompTIA Network+",
  "Cisco Certified Network Associate (CCNA)",
  "Certified Kubernetes Administrator (CKA)",
  "Project Management Professional (PMP)",
  "Certified ScrumMaster (CSM)",
  "Lean Six Sigma Green Belt",
  "Lean Six Sigma Black Belt"
];

export const SECTION_HEADERS = {
  experience: /^(?:#{0,3}\s*)?(?:work\s+|professional\s+|career\s+|relevant\s+|employment\s+)?(?:experience|employment|work\s+history|career\s+history|employment\s+history|background|history|engagements|projects\s*(?:&|and)\s*experience)\b/i,
  education: /^(?:#{0,3}\s*)?(?:education|academic|qualifications|academic\s+background|academic\s+history|educational\s+background|degrees?|institutions?|studies)\b/i,
  skills: /^(?:#{0,3}\s*)?(?:skills?|technical\s+skills?|technologies|core\s+competencies|tools?\s*(?:&|and)?\s*technologies?|expertise|proficiencies|tech\s+stack|areas\s+of\s+expertise|key\s+skills)\b/i,
  certifications: /^(?:#{0,3}\s*)?(?:certifications?|certificates?|professional\s+certifications?|licenses?|credentials?|accreditations?|courses?|awards?)\b/i,
  projects: /^(?:#{0,3}\s*)?(?:projects?|personal\s+projects?|side\s+projects?|portfolio|key\s+projects?|notable\s+projects?)\b/i,
  summary: /^(?:#{0,3}\s*)?(?:summary|profile|objective|about\s+me|professional\s+summary|career\s+objective|introduction|executive\s+summary)\b/i,
  leadership: /^(?:#{0,3}\s*)?(?:leadership|volunteer|volunteering|community|extracurricular|civic|leadership\s*(?:&|and)\s*(?:service|volunteering|experience|activities))\b/i,
  conferences: /^(?:#{0,3}\s*)?(?:conferences?|seminars?|symposiums?|presentations?|speaking\s+engagements?|publications?\s*(?:&|and)\s*conferences?)\b/i,
  attachments: /^(?:#{0,3}\s*)?(?:attachments?|supporting\s+documents?|credentials?\s+proof|portfolio\s+links?|appendices|proofs?)\b/i,
};

export function parseCvText(rawText: string): ParsedCv {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const textLower = rawText.toLowerCase();

  let applicant_name = "";
  let email = "";
  let phone = "";
  let github_url = "";
  let linkedin_url = "";
  let location = "";
  let website_url = "";
  let summary = "";

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
    if (!website_url && /(?:portfolio|website|site)[\s:]*(https?:\/\/[^\s]+)/i.test(line)) {
      const siteMatch = line.match(/(?:portfolio|website|site)[\s:]*(https?:\/\/[^\s]+)/i);
      if (siteMatch) website_url = siteMatch[1].trim();
    }
    if (!location && /(?:location|address|based\s+in)[\s:]*([a-zA-Z0-9\s,.-]{4,40})/i.test(line)) {
      const locMatch = line.match(/(?:location|address|based\s+in)[\s:]*([a-zA-Z0-9\s,.-]{4,40})/i);
      if (locMatch) location = locMatch[1].trim();
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

  // Summary extraction
  const summaryIdx = lines.findIndex((l) => SECTION_HEADERS.summary.test(l));
  if (summaryIdx !== -1) {
    const nextIdx = lines.findIndex(
      (l, i) =>
        i > summaryIdx &&
        (SECTION_HEADERS.experience.test(l) ||
          SECTION_HEADERS.education.test(l) ||
          SECTION_HEADERS.skills.test(l) ||
          SECTION_HEADERS.projects.test(l) ||
          SECTION_HEADERS.certifications.test(l))
    );
    const end = nextIdx !== -1 ? nextIdx : Math.min(lines.length, summaryIdx + 5);
    summary = lines.slice(summaryIdx + 1, end).join(" ").trim();
  }

  // 2. Extract genuine skills found in text
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
        .replace(/\bAutoCad\b/gi, "AutoCAD")
        .replace(/\bSolidworks\b/gi, "SolidWorks")
        .replace(/\bMatlab\b/gi, "MATLAB")
        .replace(/\bAnsys\b/gi, "ANSYS")
        .replace(/\bFea\b/gi, "FEA")
        .replace(/\bCfd\b/gi, "CFD")
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

  // Explicit Skills Section
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
          SECTION_HEADERS.skills.test(l) ||
          SECTION_HEADERS.leadership.test(l) ||
          SECTION_HEADERS.conferences.test(l) ||
          SECTION_HEADERS.attachments.test(l) ||
          /^(?:#{0,3}\s*)?(?:references?|publications?|languages?|awards?|interests?|volunteer(?:ing)?)\b/i.test(l))
    );
    const sectionEnd = endIdx !== -1 ? endIdx : Math.min(lines.length, expHeadingIdx + 120);
    const expLines = lines.slice(expHeadingIdx + 1, sectionEnd);

    // Date Pattern: catches ranges e.g. "2021 – Present", "Jan 2020 - Dec 2022", "04/2019 - 09/2021", "2019 - 2023"
    const DATE_PATTERN = /((?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}\s*(?:–|—|-|to)\s*(?:present|current|now|to date|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}))|(?:\d{1,2}\/\d{4}\s*(?:–|—|-|to)\s*(?:\d{1,2}\/\d{4}|present|current|now|to date))|(?:(?:20|19)\d{2}\s*(?:–|—|-|to)\s*(?:present|current|now|to date|(?:20|19)\d{2}))|(?:since|from)\s+(?:20|19)\d{2}|\b(?:20|19)\d{2}\b)/i;

    const ACTION_VERBS = /^(?:spearheaded|managed|led|directed|developed|engineered|designed|implemented|conducted|coordinated|oversaw|monitored|achieved|reduced|increased|optimized|delivered|maintained|executed|collaborated|facilitated|authored|analyzed|established|trained|supervised|negotiated|administered|resolved|prepared|underwrote|originated|audited|piloted|inspected|created|built|championed|structured|drove)\b/i;

    const cleanLineText = (s: string) =>
      s.replace(/^[\s•\-\*–—|:,;]+|[\s•\-\*–—|:,;]+$/g, "").replace(/\s+/g, " ").trim();

    const isRoleName = (str: string): boolean => {
      const s = str.toLowerCase();
      for (const r of ROLE_PATTERNS) {
        if (r.length <= 4) {
          if (new RegExp(`\\b${r}\\b`, "i").test(s)) return true;
        } else {
          if (s.includes(r)) return true;
        }
      }
      if (/\b(officer|specialist|engineer|manager|director|lead|leader|developer|analyst|consultant|associate|coordinator|executive|administrator|supervisor|advisor|architect|assistant|head|president|trainee|operator|cadet|technician|superintendent|master|mate|captain|chief|pilot|planner|strategist|auditor|accountant|cashier|teller|scientist|instructor|lecturer|fellow|representative|counsel|partner|practitioner|attorney|designer|writer|marketer|recruiter|surveyor|inspector|underwriter|relationship officer)\b/i.test(s)) return true;
      if (/^(?:senior|junior|lead|principal|staff|chief|head of|associate|assistant|executive|graduate|trainee|intern)\b/i.test(s)) return true;
      return false;
    };

    const isCompanyName = (str: string): boolean => {
      const s = str.toLowerCase();
      if (/\b(bank|plc|ltd|limited|inc|corp|corporation|company|co\.|technologies|technology|solutions|services|group|holdings|systems|shipping|maritime|lines|marine|offshore|logistics|energy|capital|partners|hospital|clinic|center|centre|authority|ministry|agency|consulting|studio|labs|foundation|ventures|enterprises|industries|association|commission|oil|gas|petroleum|trust|cargo|fleet|vessels|terminals)\b/i.test(s)) return true;
      if (/\b(google|microsoft|apple|amazon|meta|first bank|zenith|access bank|gtbank|guaranty trust|uba|stanbic|bourbon|maersk|chevron|shell|totalenergies|nlng|stripe|fidelity|fcmb|ecobank|wema|union bank|keystone|sterling)\b/i.test(s)) return true;
      return false;
    };

    const splitRoleAndCompany = (text: string): { role: string; company: string } => {
      // 1. Check for "at" or "@"
      const atMatch = text.match(/(.*?)\s+(?:at|@)\s+(.*)/i);
      if (atMatch) {
        return {
          role: cleanLineText(atMatch[1]),
          company: cleanLineText(atMatch[2]),
        };
      }

      // 2. Check for pipe separation (handles multi-column e.g. "Role | Company | Location")
      if (text.includes("|")) {
        const parts = text.split("|").map(cleanLineText).filter(Boolean);
        if (parts.length >= 2) {
          const roleIdx = parts.findIndex((p) => isRoleName(p));
          const compIdx = parts.findIndex((p) => isCompanyName(p));

          if (roleIdx !== -1 && compIdx !== -1 && roleIdx !== compIdx) {
            return { role: parts[roleIdx], company: parts[compIdx] };
          }
          if (roleIdx !== -1) {
            const nonRole = parts.filter((_, i) => i !== roleIdx);
            const bestComp = nonRole.find((p) => isCompanyName(p)) || nonRole[0];
            return { role: parts[roleIdx], company: bestComp || "" };
          }
          if (compIdx !== -1) {
            const nonComp = parts.filter((_, i) => i !== compIdx);
            const bestRole = nonComp.find((p) => isRoleName(p)) || nonComp[0];
            return { role: bestRole || "", company: parts[compIdx] };
          }
          return { company: parts[0], role: parts[1] };
        }
      }

      // 3. Check for separators: " — ", " – ", " - "
      const sepMatch = text.match(/(.*?)\s*(?:[—–]|\s-\s)\s*(.*)/i);
      if (sepMatch) {
        const p1 = cleanLineText(sepMatch[1]);
        const p2 = cleanLineText(sepMatch[2]);
        const p1Role = isRoleName(p1);
        const p2Role = isRoleName(p2);
        const p1Comp = isCompanyName(p1);
        const p2Comp = isCompanyName(p2);

        if (p1Role && !p2Role) return { role: p1, company: p2 };
        if (p2Role && !p1Role) return { role: p2, company: p1 };
        if (p1Comp && !p2Comp) return { role: p2, company: p1 };
        if (p2Comp && !p1Comp) return { role: p1, company: p2 };
        if (p2Role) return { role: p2, company: p1 };
        if (p1Role) return { role: p1, company: p2 };
        return { company: p1, role: p2 };
      }

      // 4. Check for comma separation: "Business Relationship Officer, First Bank of Nigeria"
      if (text.includes(",")) {
        const parts = text.split(",").map((p) => cleanLineText(p)).filter(Boolean);
        if (parts.length >= 2) {
          const [p1, p2] = parts;
          if (isRoleName(p1) && (isCompanyName(p2) || !isRoleName(p2))) {
            return { role: p1, company: p2 };
          }
          if (isCompanyName(p1) && isRoleName(p2)) {
            return { role: p2, company: p1 };
          }
        }
      }

      return { role: "", company: "" };
    };

    let currentCompany = "";
    let currentRole = "";
    let currentDuration = "";
    let currentHighlights: string[] = [];

    const flushEntry = () => {
      let comp = cleanLineText(currentCompany);
      let rol = cleanLineText(currentRole);

      // Strip location suffix if present on company e.g. "First Bank of Nigeria, Lagos"
      if (comp.includes(",")) {
        const parts = comp.split(",");
        if (isCompanyName(parts[0])) {
          comp = cleanLineText(parts[0]);
        }
      }

      // If one is missing, check if the other contains both
      if (!comp && rol) {
        const split = splitRoleAndCompany(rol);
        if (split.company) {
          comp = split.company;
          rol = split.role;
        }
      } else if (!rol && comp) {
        const split = splitRoleAndCompany(comp);
        if (split.role) {
          rol = split.role;
          comp = split.company;
        }
      }

      // Sanitize: NEVER default company to "Organization" or "worked at Organization"
      if (/^(?:organization|company|employer|client|previous tech organization|target organization|my previous organization)$/i.test(comp)) {
        comp = "";
      }

      if (rol || comp) {
        work_experience.push({
          company: comp, // Clean extracted organization name (no dummy fallback)
          role: rol || "Professional",
          duration: currentDuration || "",
          highlights: currentHighlights.filter((h) => h.length > 5),
        });
      }

      currentCompany = "";
      currentRole = "";
      currentDuration = "";
      currentHighlights = [];
    };

    for (let i = 0; i < expLines.length; i++) {
      const line = expLines[i];
      const isBullet = /^[-*•·▪▫◦✦►✓\u2022\u00b7\u2013\u2014>]|^\d+[\.\)]\s+/.test(line);

      // If line is clearly an accomplishment bullet or an action-verb sentence under a role
      if (isBullet || (currentHighlights.length > 0 && ACTION_VERBS.test(line))) {
        currentHighlights.push(line.replace(/^[-*•·▪▫◦✦►✓\u2022\u00b7\u2013\u2014>\s]+|^\d+[\.\)]\s+/, "").trim());
        continue;
      }

      // If we already collected bullets for an entry and now encounter a new non-bullet line, flush previous entry!
      if (currentHighlights.length > 0) {
        flushEntry();
      }

      const dateMatch = line.match(DATE_PATTERN);

      if (dateMatch && line.length < 120) {
        const dateStr = dateMatch[0].trim();
        const nonDatePart = cleanLineText(
          line.replace(dateMatch[0], "").replace(/[\(\)\[\]]/g, " ")
        );

        if (nonDatePart.length < 3 || /^(?:present|current|now|to date)$/i.test(nonDatePart)) {
          // Dedicated date line (e.g. "2021 – Present" or "Jan 2020 - Dec 2023")
          currentDuration = dateStr;
        } else {
          // Line has text AND dates (e.g. "Business Relationship Officer | 2021 - Present" or "First Bank of Nigeria (2021 - Present)")
          currentDuration = dateStr;
          const compound = splitRoleAndCompany(nonDatePart);

          if (compound.role && compound.company) {
            if (currentRole || currentCompany) flushEntry();
            currentRole = compound.role;
            currentCompany = compound.company;
            currentDuration = dateStr;
          } else if (isRoleName(nonDatePart)) {
            if (currentRole && currentCompany) {
              flushEntry();
              currentRole = nonDatePart;
              currentDuration = dateStr;
            } else {
              currentRole = nonDatePart;
            }
          } else if (isCompanyName(nonDatePart)) {
            if (currentCompany && currentRole) {
              flushEntry();
              currentCompany = nonDatePart;
              currentDuration = dateStr;
            } else {
              currentCompany = nonDatePart;
            }
          } else {
            if (!currentRole) currentRole = nonDatePart;
            else if (!currentCompany) currentCompany = nonDatePart;
          }
        }
      } else if (line.length < 120 && !isBullet) {
        // Line without date: Check compound header e.g. "Business Relationship Officer at First Bank of Nigeria"
        const compound = splitRoleAndCompany(line);
        if (compound.role && compound.company) {
          if (currentRole || currentCompany) flushEntry();
          currentRole = compound.role;
          currentCompany = compound.company;
        } else if (isRoleName(line)) {
          if (currentRole) {
            if (currentCompany) {
              flushEntry();
              currentRole = line;
            } else if (isCompanyName(currentRole)) {
              currentCompany = currentRole;
              currentRole = line;
            } else {
              flushEntry();
              currentRole = line;
            }
          } else {
            currentRole = line;
          }
        } else if (isCompanyName(line)) {
          if (currentCompany) {
            if (currentRole) {
              flushEntry();
              currentCompany = line;
            } else if (isRoleName(currentCompany)) {
              currentRole = currentCompany;
              currentCompany = line;
            } else {
              flushEntry();
              currentCompany = line;
            }
          } else {
            currentCompany = line;
          }
        } else if (ACTION_VERBS.test(line) && (currentRole || currentCompany)) {
          // Action-verb sentence without leading bullet character
          currentHighlights.push(line.trim());
        } else if (!currentRole) {
          currentRole = cleanLineText(line);
        } else if (!currentCompany) {
          currentCompany = cleanLineText(line);
        } else if (line.length > 25) {
          currentHighlights.push(line.trim());
        }
      } else if (line.length > 25) {
        currentHighlights.push(line.trim());
      }
    }
    flushEntry();
  }

  // 4. Academic History
  const academic_history: ParsedCv["academic_history"] = [];
  const eduHeadingIdx = lines.findIndex((l) => SECTION_HEADERS.education.test(l));

  const extractEduDetailsFromLine = (line: string) => {
    let degree = "";
    let institution = "";
    let field = "";
    let year = "";

    const yearMatch = line.match(/\b(20\d{2}|19\d{2})\b/);
    if (yearMatch) year = yearMatch[0];

    const bscMatch = line.match(/\b(bachelor(?:'s)?(?:\s+of\s+\w+)?|b\.?s\.?c\b|b\.?eng\b|b\.?a\b|b\.?tech\b|undergraduate)\b/i);
    const mscMatch = line.match(/\b(master(?:'s)?(?:\s+of\s+\w+)?|m\.?s\.?c\b|m\.?eng\b|m\.?a\b|mba|postgraduate)\b/i);
    const phdMatch = line.match(/\b(doctor\s+of\s+medicine|m\.?d\b|ph\.?d|doctorate)\b/i);
    const diplomaMatch = line.match(/\b(diploma|associate|hnd|ond|certificate)\b/i);

    if (bscMatch) {
      degree = "Bachelor's Degree (" + bscMatch[0].trim() + ")";
    } else if (mscMatch) {
      degree = "Master's Degree (" + mscMatch[0].trim() + ")";
    } else if (phdMatch) {
      degree = /m\.?d\b|medicine/i.test(phdMatch[0]) ? "Doctor of Medicine (M.D.)" : "Doctorate (PhD)";
    } else if (diplomaMatch) {
      degree = diplomaMatch[0].charAt(0).toUpperCase() + diplomaMatch[0].slice(1);
    }

    const instMatch = line.match(/([a-zA-Z\s]+(?:university|college|polytechnic|institute|school|academy|faculty)[a-zA-Z\s]*)/i);
    if (instMatch) {
      institution = instMatch[0].trim().replace(/^[,\-|]\s*/, "");
    }

    const fieldMatch = line.match(/(?:in|of)\s+([a-zA-Z\s]{4,40})(?:,|\s+from|\s+-|\s+\(|\s*$)/i);
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
        let derivedField = currentField;
        if (!derivedField || derivedField.toLowerCase() === "field of study") {
          if (/medicine|medical|surgeon|doctor/i.test(currentDegree)) derivedField = "Medicine";
          else if (/nursing/i.test(currentDegree)) derivedField = "Nursing";
          else if (/law|juris/i.test(currentDegree)) derivedField = "Law";
          else if (/finance|accounting/i.test(currentDegree)) derivedField = "Finance";
          else if (/computer|software|tech/i.test(currentDegree)) derivedField = "Computer Science";
          else derivedField = "Field of Study";
        }
        academic_history.push({
          institution: currentInstitution || "University / College",
          degree: currentDegree || "Degree",
          field_of_study: derivedField,
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
          if (currentInstitution && currentDegree) {
            flushEdu();
          }
          currentInstitution = parsed.institution;
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

  // Fallback Academic
  if (academic_history.length === 0) {
    for (const line of lines) {
      const parsed = extractEduDetailsFromLine(line);
      if (parsed.institution || parsed.degree) {
        academic_history.push({
          institution: parsed.institution || "Higher Institution",
          degree: parsed.degree || "Bachelor's Degree",
          field_of_study: parsed.field || "Field of Study",
          graduation_year: parsed.year || "",
          achievements: [],
        });
        if (academic_history.length >= 2) break;
      }
    }
  }

  // 5. Certifications
  const certificationsSet = new Set<string>();
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

  for (const cert of KNOWN_CERTIFICATIONS) {
    if (textLower.includes(cert.toLowerCase())) {
      certificationsSet.add(cert);
    }
  }

  for (const line of lines) {
    if (/\b(?:certified|certification|licensed|credential)\b/i.test(line) && line.length < 75) {
      const clean = line.replace(/^[-*\u2022\u00b7>\s]+/, "").trim();
      if (clean.length > 5) {
        certificationsSet.add(clean);
      }
    }
  }

  const certifications = Array.from(certificationsSet);

  // 6. Leadership & Volunteer Experience
  const leadership: ParsedCv["leadership"] = [];
  const leadIdx = lines.findIndex((l) => SECTION_HEADERS.leadership.test(l));
  if (leadIdx !== -1) {
    const endIdx = lines.findIndex(
      (l, i) =>
        i > leadIdx &&
        (SECTION_HEADERS.experience.test(l) ||
          SECTION_HEADERS.education.test(l) ||
          SECTION_HEADERS.skills.test(l) ||
          SECTION_HEADERS.certifications.test(l) ||
          SECTION_HEADERS.conferences.test(l) ||
          SECTION_HEADERS.projects.test(l))
    );
    const leadEnd = endIdx !== -1 ? endIdx : Math.min(lines.length, leadIdx + 20);
    const leadLines = lines.slice(leadIdx + 1, leadEnd);

    let curRole = "";
    let curOrg = "";
    let curDur = "";
    let curHighlights: string[] = [];

    const flushLead = () => {
      if (curRole || curOrg) {
        leadership.push({
          role: curRole || "Lead Volunteer",
          organization: curOrg || "",
          duration: curDur || undefined,
          highlights: curHighlights.length > 0 ? curHighlights : undefined,
        });
      }
      curRole = "";
      curOrg = "";
      curDur = "";
      curHighlights = [];
    };

    for (const line of leadLines) {
      const isBullet = /^[-*\u2022\u00b7>]/.test(line);
      if (isBullet) {
        curHighlights.push(line.replace(/^[-*\u2022\u00b7>\s]+/, "").trim());
      } else {
        const dateMatch = line.match(/\b((?:20|19)\d{2}(?:\s*[-–—]\s*(?:present|current|now|(?:20|19)\d{2}))?)\b/i);
        const sepMatch = line.match(/(.*?)\s+(?:at|@|—|–|-|\|)\s+(.*)/i);
        if (sepMatch) {
          if (curRole || curOrg) flushLead();
          curRole = sepMatch[1].replace(/^[#*\-\s]+/, "").trim();
          curOrg = sepMatch[2].replace(/^[#*\-\s]+/, "").trim();
          if (dateMatch) curDur = dateMatch[0];
        } else if (!curRole) {
          curRole = line.replace(/^[#*\-\s]+/, "").trim();
          if (dateMatch) curDur = dateMatch[0];
        } else if (!curOrg) {
          curOrg = line.replace(/^[#*\-\s]+/, "").trim();
        } else if (line.length > 15) {
          curHighlights.push(line.trim());
        }
      }
    }
    flushLead();
  }

  // 7. Conferences & Seminars
  const conferences: ParsedCv["conferences"] = [];
  const confIdx = lines.findIndex((l) => SECTION_HEADERS.conferences.test(l));
  if (confIdx !== -1) {
    const endIdx = lines.findIndex(
      (l, i) =>
        i > confIdx &&
        (SECTION_HEADERS.experience.test(l) ||
          SECTION_HEADERS.education.test(l) ||
          SECTION_HEADERS.skills.test(l) ||
          SECTION_HEADERS.certifications.test(l) ||
          SECTION_HEADERS.leadership.test(l) ||
          SECTION_HEADERS.projects.test(l))
    );
    const confEnd = endIdx !== -1 ? endIdx : Math.min(lines.length, confIdx + 15);
    const confLines = lines.slice(confIdx + 1, confEnd);

    for (const line of confLines) {
      const clean = line.replace(/^[-*\u2022\u00b7>\s]+/, "").trim();
      if (clean.length > 5) {
        const yearMatch = clean.match(/\b(20\d{2}|19\d{2})\b/);
        const parts = clean.split(/[–—|,\-]/).map((p) => p.trim());
        conferences.push({
          name: parts[0] || clean,
          role_or_topic: parts[1] || undefined,
          year: yearMatch ? yearMatch[0] : undefined,
          location: parts[2] || undefined,
        });
      }
    }
  }

  // 8. Attachments & Supporting Proofs from text (Drive links, Walrus hashes, Credential links)
  const attachments: ParsedCv["attachments"] = [];
  for (const line of lines) {
    const driveMatch = line.match(/https?:\/\/(?:drive\.google\.com|docs\.google\.com)\/[^\s)]+/i);
    const proofUrlMatch = line.match(/https?:\/\/[^\s)]+(?:certificate|credential|badge|verify|proof)[^\s)]*/i);
    if (driveMatch) {
      attachments.push({
        id: "att-" + Math.random().toString(36).substring(2, 9),
        title: "Verified Document / Credential (Google Drive)",
        category: "other",
        url: driveMatch[0],
        previewUrl: driveMatch[0],
        uploadedAt: new Date().toISOString(),
        isExternal: true,
      });
    } else if (proofUrlMatch && !proofUrlMatch[0].includes("github.com") && !proofUrlMatch[0].includes("linkedin.com")) {
      attachments.push({
        id: "att-" + Math.random().toString(36).substring(2, 9),
        title: "Credential Verification Link",
        category: "certificate",
        url: proofUrlMatch[0],
        previewUrl: proofUrlMatch[0],
        uploadedAt: new Date().toISOString(),
        isExternal: true,
      });
    }
  }

  // 9. Target Roles
  const target_roles: string[] = [];
  if (work_experience.length > 0 && work_experience[0].role && work_experience[0].role !== "Role" && work_experience[0].role !== "Professional") {
    target_roles.push(work_experience[0].role);
  }

  for (const role of ROLE_PATTERNS) {
    if (textLower.includes(role)) {
      const formatted = role
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      if (!target_roles.includes(formatted)) {
        target_roles.push(formatted);
      }
      if (target_roles.length >= 4) break;
    }
  }

  return {
    applicant_name: applicant_name || "",
    email: email || "",
    phone: phone || undefined,
    github_url: github_url || undefined,
    linkedin_url: linkedin_url || undefined,
    website_url: website_url || undefined,
    location: location || undefined,
    skills,
    work_experience,
    academic_history,
    certifications,
    target_roles: target_roles.length > 0 ? target_roles : ["Professional"],
    summary: summary || undefined,
    leadership: leadership.length > 0 ? leadership : undefined,
    conferences: conferences.length > 0 ? conferences : undefined,
    attachments: attachments.length > 0 ? attachments : undefined,
  };
}
