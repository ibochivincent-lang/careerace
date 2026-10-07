/**
 * CareerAce Typographical Error Correction & Tolerance Engine
 *
 * Automatically detects and corrects typographical errors in user queries
 * using domain-specific phonetic heuristics, common misspelling maps,
 * and Damerau-Levenshtein distance against tech and career vocabulary.
 */

export const COMMON_CAREER_TYPOS: Record<string, string> = {
  // Question words & pronouns
  hw: "how",
  hwo: "how",
  mny: "many",
  mey: "many",
  wht: "what",
  wat: "what",
  waht: "what",
  wt: "what",
  whr: "where",
  wher: "where",
  wn: "when",
  wen: "when",
  wich: "which",
  whch: "which",
  cna: "can",
  cn: "can",
  hv: "have",
  hve: "have",
  didnt: "didn't",
  aplly: "apply",
  aply: "apply",
  aplying: "applying",
  aplied: "applied",
  appled: "applied",

  // Core career nouns & verbs
  jb: "job",
  jbs: "jobs",
  joob: "job",
  joobs: "jobs",
  rle: "role",
  roel: "role",
  rol: "role",
  wrk: "work",
  wrok: "work",
  resme: "resume",
  reusme: "resume",
  resum: "resume",
  rezume: "resume",
  uploadd: "uploaded",
  uplod: "upload",
  uploded: "uploaded",
  uplaod: "upload",
  upld: "upload",
  skils: "skills",
  skilss: "skills",
  sklils: "skills",
  skls: "skills",
  couse: "course",
  coures: "course",
  cors: "course",
  styd: "study",
  stdy: "study",
  studey: "study",
  studed: "studied",
  degrre: "degree",
  degre: "degree",
  dgre: "degree",
  universty: "university",
  univeristy: "university",
  univ: "university",
  experiance: "experience",
  experince: "experience",
  expeirence: "experience",
  exprince: "experience",
  certifcate: "certificate",
  certficate: "certificate",
  certificats: "certificates",
  licnse: "license",
  lisence: "license",
  licens: "license",
  dicipline: "discipline",
  descipline: "discipline",
  disipline: "discipline",
  disciplin: "discipline",
  yestarday: "yesterday",
  yesturday: "yesterday",
  yesterdy: "yesterday",
  yestrday: "yesterday",
  tody: "today",
  toda: "today",
  folowup: "follow-up",
  folow: "follow",
  follwup: "follow-up",
  follw: "follow",
  "folow-up": "follow-up",
  autonmous: "autonomous",
  autonomus: "autonomous",
  autonoms: "autonomous",
  recomnd: "recommend",
  recommed: "recommend",
  recommnd: "recommend",
  recomende: "recommend",
  recruiter: "recruiter",
  recruter: "recruiter",
  recrutr: "recruiter",
  salry: "salary",
  sallary: "salary",
  techncal: "technical",
  techical: "technical",
  tecnical: "technical",
  engneer: "engineer",
  enginere: "engineer",
  enginner: "engineer",
  softwre: "software",
  sotfware: "software",
  sofftware: "software",
  orgnization: "organization",
  organzation: "organization",
  compny: "company",
  compnay: "company",
  histroy: "history",
  histry: "history",
  summrize: "summarize",
  sumarize: "summarize",
  summaryze: "summarize",
  verfied: "verified",
  verfy: "verify",
  credentals: "credentials",
  credntials: "credentials",
  memry: "memory",
  walrus: "walrus",
};

export const DOMAIN_VOCABULARY = [
  "how",
  "many",
  "what",
  "where",
  "when",
  "which",
  "apply",
  "applied",
  "application",
  "applications",
  "resume",
  "resumes",
  "cv",
  "cvs",
  "job",
  "jobs",
  "work",
  "working",
  "upload",
  "uploaded",
  "skill",
  "skills",
  "course",
  "study",
  "studied",
  "degree",
  "university",
  "college",
  "experience",
  "certificate",
  "certification",
  "certifications",
  "license",
  "licenses",
  "discipline",
  "disciplines",
  "yesterday",
  "today",
  "tomorrow",
  "follow-up",
  "followup",
  "recruiter",
  "autonomous",
  "recommend",
  "salary",
  "technical",
  "engineer",
  "software",
  "organization",
  "company",
  "companies",
  "history",
  "summarize",
  "verified",
  "credentials",
  "memory",
  "walrus",
  "target",
  "role",
  "roles",
  "limit",
  "quota",
  "daily",
  "goal",
  "goals",
  "cooldown",
  "pacing",
  "anti-spam",
  "remote",
  "marine",
  "healthcare",
  "medical",
  "stcw",
  "tracker",
  "status",
  "here",
  "there",
  "is",
  "are",
  "was",
  "were",
  "not",
  "have",
  "has",
  "had",
  "can",
  "could",
  "will",
  "would",
  "my",
  "your",
  "our",
  "their",
  "in",
  "on",
  "at",
  "to",
  "for",
  "from",
  "with",
  "day",
  "days",
];

/**
 * Computes Damerau-Levenshtein distance between two strings
 * (insertion, deletion, substitution, and transposition of adjacent characters).
 */
export function damerauLevenshteinDistance(source: string, target: string): number {
  const s = source.toLowerCase();
  const t = target.toLowerCase();
  const m = s.length;
  const n = t.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const d: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );

      // Transposition
      if (i > 1 && j > 1 && s[i - 1] === t[j - 2] && s[i - 2] === t[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }

  return d[m][n];
}

export interface TypoCorrectionResult {
  original: string;
  corrected: string;
  corrections: Array<{ original: string; corrected: string }>;
  hasCorrections: boolean;
}

/**
 * Corrects typographical errors in a user query while preserving numbers,
 * punctuation, and proper nouns.
 */
export function correctTypographicalErrors(query: string): TypoCorrectionResult {
  if (!query || typeof query !== "string") {
    return { original: "", corrected: "", corrections: [], hasCorrections: false };
  }

  const rawTokens = query.split(/(\s+|[.,!?;:()\[\]"'`])/);
  const corrections: Array<{ original: string; corrected: string }> = [];

  const correctedTokens = rawTokens.map((token) => {
    // Only correct alphabetic tokens of length >= 2
    if (!/^[A-Za-z'-]+$/.test(token) || token.length < 2) {
      return token;
    }

    const lower = token.toLowerCase();

    // 1. Check exact typo map
    if (COMMON_CAREER_TYPOS[lower]) {
      const replacement = COMMON_CAREER_TYPOS[lower];
      if (replacement !== lower) {
        corrections.push({ original: token, corrected: replacement });
        // Preserve original capitalization if token was title-cased
        return preserveCase(token, replacement);
      }
      return token;
    }

    // 2. Check if word is already in domain vocabulary or common English stopwords
    if (DOMAIN_VOCABULARY.includes(lower)) {
      return token;
    }

    // 3. For tokens with length >= 4, check fuzzy distance against domain vocabulary
    if (lower.length >= 4) {
      let bestMatch: string | null = null;
      let minDistance = Infinity;

      for (const vocabWord of DOMAIN_VOCABULARY) {
        // Skip comparing against words of very different lengths
        if (Math.abs(vocabWord.length - lower.length) > 2) continue;

        const dist = damerauLevenshteinDistance(lower, vocabWord);
        // Distance threshold: 1 edit for 4-5 chars, 2 edits for 6+ chars
        const allowedMax = lower.length <= 5 ? 1 : 2;

        if (dist <= allowedMax && dist < minDistance) {
          minDistance = dist;
          bestMatch = vocabWord;
        }
      }

      if (bestMatch && minDistance <= (lower.length <= 5 ? 1 : 2)) {
        corrections.push({ original: token, corrected: bestMatch });
        return preserveCase(token, bestMatch);
      }
    }

    return token;
  });

  const corrected = correctedTokens.join("");

  return {
    original: query,
    corrected,
    corrections,
    hasCorrections: corrections.length > 0,
  };
}

/**
 * Helper to preserve leading uppercase if original was capitalized
 */
function preserveCase(original: string, replacement: string): string {
  if (original[0] && original[0] === original[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

/**
 * Normalizes a query for semantic and heuristic matching with typographical tolerance.
 */
export function normalizeTypographicalErrors(query: string): string {
  return correctTypographicalErrors(query).corrected;
}
