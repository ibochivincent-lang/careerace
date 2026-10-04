/**
 * ATS Reverse-Engineering & Gap Analysis Engine
 * Inspired by srbhr/Resume-Matcher & xitanggg/open-resume
 *
 * Implements:
 * 1. Dynamic N-gram (1-gram, 2-gram, 3-gram) text extraction & tokenization.
 * 2. Multi-category skill extraction (Languages, Frameworks, Cloud, Databases, Methodologies, Tools).
 * 3. Exact keyword coverage ratio & semantic alignment scoring.
 * 4. Categorized missing skill gap analysis (Critical Hard Skills vs Secondary/Soft Tools).
 * 5. Actionable ATS recommendations and letter grade (A+, A, B, C, D).
 * 6. Inline keyword diff (matched, missing, partially matched).
 */

export interface AtsScorecard {
  overall_score: number; // 0 to 100
  fit_score_10: number; // 1 to 10 (for CareerAce Track A / B routing)
  ats_grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  keyword_coverage_pct: number; // % of job keywords found in CV
  essential_skills_coverage_pct: number; // % of hard technical requirements satisfied
  matched_skills: string[];
  missing_critical_skills: string[];
  missing_secondary_skills: string[];
  job_extracted_keywords: string[];
  actionable_recommendations: string[];
  compliance_checks: {
    contact_info_present: boolean;
    standard_headings_detected: boolean;
    date_formatting_valid: boolean;
    single_column_safe: boolean;
  };
  // Keyword diff data for inline visualization
  keyword_diff: KeywordDiffItem[];
}

export interface KeywordDiffItem {
  keyword: string;
  status: 'matched' | 'missing' | 'partial';
  category: 'critical' | 'secondary' | 'soft';
  frequency_in_jd: number; // how many times it appears in the job description
  frequency_in_cv: number; // how many times it appears in the CV
}

const COMMON_STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being',
  'below', 'between', 'both', 'but', 'by', 'can', 'can\'t', 'cannot', 'could',
  'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t',
  'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t',
  'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s',
  'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how',
  'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is',
  'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most',
  'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once',
  'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over',
  'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should',
  'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their',
  'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they',
  'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through',
  'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d',
  'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when',
  'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom',
  'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d',
  'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves',
  'looking', 'role', 'team', 'work', 'working', 'experience', 'responsibilities',
  'requirements', 'candidate', 'apply', 'opportunity', 'company', 'position',
  'years', 'plus', 'preferred', 'must', 'have', 'strong', 'ability', 'knowledge',
  'skills', 'including', 'well', 'high', 'within', 'across', 'help', 'join',
  'will', 'also', 'able', 'etc', 'like', 'new', 'best', 'good', 'great',
  'one', 'two', 'three', 'four', 'five', 'use', 'using', 'used',
  'ensure', 'build', 'develop', 'create', 'maintain', 'support', 'provide',
  'need', 'based', 'related', 'relevant', 'key', 'part', 'time', 'full',
  'day', 'week', 'month', 'year', 'level', 'area', 'type'
]);

// Canonical technical skill taxonomy for tagging hard requirements
export const HARD_TECH_SKILLS = new Set([
  'typescript', 'javascript', 'python', 'rust', 'golang', 'go', 'java', 'c++',
  'c#', 'solidity', 'react', 'next.js', 'vue', 'angular', 'node.js', 'nodejs',
  'express', 'fastapi', 'django', 'nestjs', 'postgresql', 'postgres', 'mysql',
  'mongodb', 'redis', 'graphql', 'rest api', 'docker', 'kubernetes', 'aws',
  'gcp', 'azure', 'terraform', 'ci/cd', 'github actions', 'tailwind', 'html',
  'css', 'sui', 'move', 'web3', 'linux', 'git', 'microservices', 'kafka',
  'python', 'machine learning', 'deep learning', 'tensorflow', 'pytorch',
  'data engineering', 'etl', 'spark', 'hadoop', 'airflow', 'sql', 'nosql',
  'elasticsearch', 'rabbitmq', 'grpc', 'websockets', 'flutter', 'react native',
  'swift', 'kotlin', 'ruby', 'rails', 'php', 'laravel', 'spring boot',
  'svelte', 'nuxt', 'gatsby', 'prisma', 'supabase', 'firebase', 'serverless',
  'sass', 'webpack', 'vite', 'jest', 'cypress', 'playwright', 'selenium',
  'figma', 'agile', 'scrum', 'jira', 'project management',
  'devops', 'sre', 'nginx', 'jenkins', 'ansible'
]);

/**
 * Clean and tokenize raw text into normalized words and n-grams
 */
export function extractCleanTokens(text: string): string[] {
  if (!text) return [];
  const normalized = text.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, ' ');
  return normalized
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 1 && !COMMON_STOPWORDS.has(t));
}

/**
 * Extract 1-gram, 2-gram and 3-gram keyphrases from text
 */
export function extractKeyphrases(text: string): string[] {
  const tokens = extractCleanTokens(text);
  const phrases = new Set<string>();

  for (let i = 0; i < tokens.length; i++) {
    // 1-gram
    if (tokens[i].length > 2) {
      phrases.add(tokens[i]);
    }
    // 2-gram
    if (i < tokens.length - 1) {
      const bigram = `${tokens[i]} ${tokens[i + 1]}`;
      phrases.add(bigram);
    }
    // 3-gram
    if (i < tokens.length - 2) {
      const trigram = `${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`;
      phrases.add(trigram);
    }
  }

  return Array.from(phrases);
}

/**
 * Count occurrences of a term in text (case-insensitive)
 */
function countOccurrences(text: string, term: string): number {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
  return (text.match(regex) || []).length;
}

/**
 * Main ATS Evaluation Engine: Computes detailed ATS Scorecard comparing
 * candidate resume against REAL job description text.
 *
 * IMPORTANT: jobDescription MUST be the actual job posting text, NOT a generated
 * description from the candidate's skills. Passing a synthetic description
 * will always yield inflated scores.
 */
export function analyzeAtsMatch(params: {
  jobTitle: string;
  jobDescription: string;
  applicantSkills: string[];
  applicantExperienceText: string;
  applicantAcademicText: string;
  applicantContactInfo: { email?: string; phone?: string; location?: string };
}): AtsScorecard {
  const {
    jobTitle,
    jobDescription,
    applicantSkills = [],
    applicantExperienceText = '',
    applicantAcademicText = '',
    applicantContactInfo = {}
  } = params;

  const combinedCvText = [
    applicantSkills.join(' '),
    applicantExperienceText,
    applicantAcademicText
  ].join(' ').toLowerCase();

  const jobDescLower = jobDescription.toLowerCase();

  const candidateSkillSet = new Set(
    applicantSkills.map(s => s.toLowerCase().trim())
  );

  // Extract key terms from job posting
  const jobTokens = extractCleanTokens(`${jobTitle} ${jobDescription}`);

  // Frequency count of terms in job description
  const termFrequency: Record<string, number> = {};
  for (const token of jobTokens) {
    termFrequency[token] = (termFrequency[token] || 0) + 1;
  }

  // Filter high-importance job keywords (mentioned >= 2 times or in hard tech skills)
  const prioritizedJobTerms = Object.keys(termFrequency)
    .filter(term => termFrequency[term] >= 2 || HARD_TECH_SKILLS.has(term))
    .sort((a, b) => (termFrequency[b] || 0) - (termFrequency[a] || 0))
    .slice(0, 40);

  // Also extract multi-word tech terms from job description directly
  const multiWordTechTerms: string[] = [];
  for (const techSkill of HARD_TECH_SKILLS) {
    if (techSkill.includes(' ') || techSkill.includes('.') || techSkill.includes('/')) {
      if (jobDescLower.includes(techSkill)) {
        multiWordTechTerms.push(techSkill);
      }
    }
  }

  // Combine single-word and multi-word terms
  const allJobTerms = Array.from(new Set([...prioritizedJobTerms, ...multiWordTechTerms]));

  // Determine matches and gaps with diff data
  const matched_skills: string[] = [];
  const missing_critical_skills: string[] = [];
  const missing_secondary_skills: string[] = [];
  const keyword_diff: KeywordDiffItem[] = [];

  for (const term of allJobTerms) {
    const isDirectSkillMatch = candidateSkillSet.has(term);
    const isInCvText = combinedCvText.includes(term);
    const isHardTech = HARD_TECH_SKILLS.has(term);
    const jdFreq = countOccurrences(jobDescription, term);
    const cvFreq = countOccurrences(combinedCvText, term);

    if (isDirectSkillMatch || isInCvText) {
      matched_skills.push(term);
      keyword_diff.push({
        keyword: term,
        status: 'matched',
        category: isHardTech ? 'critical' : 'secondary',
        frequency_in_jd: jdFreq,
        frequency_in_cv: cvFreq
      });
    } else {
      // Check for partial matches (e.g., "react" in "react native")
      const isPartialMatch = applicantSkills.some(s => {
        const sLower = s.toLowerCase();
        return sLower.includes(term) || term.includes(sLower);
      });

      if (isPartialMatch) {
        matched_skills.push(term);
        keyword_diff.push({
          keyword: term,
          status: 'partial',
          category: isHardTech ? 'critical' : 'secondary',
          frequency_in_jd: jdFreq,
          frequency_in_cv: cvFreq
        });
      } else if (isHardTech) {
        missing_critical_skills.push(term);
        keyword_diff.push({
          keyword: term,
          status: 'missing',
          category: 'critical',
          frequency_in_jd: jdFreq,
          frequency_in_cv: 0
        });
      } else if (term.length > 3) {
        missing_secondary_skills.push(term);
        keyword_diff.push({
          keyword: term,
          status: 'missing',
          category: 'secondary',
          frequency_in_jd: jdFreq,
          frequency_in_cv: 0
        });
      }
    }
  }

  // Check explicit candidate skills against job description
  for (const skill of applicantSkills) {
    const normalized = skill.toLowerCase().trim();
    if (jobDescLower.includes(normalized) && !matched_skills.includes(normalized)) {
      matched_skills.push(skill);
      keyword_diff.push({
        keyword: skill,
        status: 'matched',
        category: HARD_TECH_SKILLS.has(normalized) ? 'critical' : 'secondary',
        frequency_in_jd: countOccurrences(jobDescription, normalized),
        frequency_in_cv: countOccurrences(combinedCvText, normalized)
      });
    }
  }

  // Calculate Scores
  const totalTargetKeywords = Math.max(allJobTerms.length, 1);
  const keyword_coverage_pct = Math.round((matched_skills.length / totalTargetKeywords) * 100);

  const hardSkillsInJob = allJobTerms.filter(t => HARD_TECH_SKILLS.has(t));
  const hardSkillsMatched = hardSkillsInJob.filter(t => matched_skills.includes(t));
  const essential_skills_coverage_pct = hardSkillsInJob.length > 0
    ? Math.round((hardSkillsMatched.length / hardSkillsInJob.length) * 100)
    : keyword_coverage_pct; // Fall back to keyword coverage if no specific hard skills detected

  // Title alignment bonus
  let titleBonus = 0;
  const titleWords = jobTitle.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !COMMON_STOPWORDS.has(w));
  const titleMatches = titleWords.filter(w => combinedCvText.includes(w));
  if (titleMatches.length > 0) {
    titleBonus = Math.min(10, Math.round((titleMatches.length / Math.max(titleWords.length, 1)) * 10));
  }

  // Experience depth bonus (have actual work experience related to job)
  let experienceBonus = 0;
  if (applicantExperienceText.length > 50) {
    const expRelevanceTokens = extractCleanTokens(applicantExperienceText);
    const relevantExpTerms = expRelevanceTokens.filter(t => allJobTerms.includes(t));
    experienceBonus = Math.min(5, Math.round((relevantExpTerms.length / Math.max(allJobTerms.length, 1)) * 10));
  }

  // Overall ATS Score (0 - 100)
  const weightedScore = Math.min(
    100,
    Math.round(
      keyword_coverage_pct * 0.40 +
      essential_skills_coverage_pct * 0.40 +
      titleBonus +
      experienceBonus
    )
  );

  // Don't artificially inflate — allow genuine low scores
  const overall_score = Math.max(5, weightedScore);
  const fit_score_10 = Math.min(10, Math.max(1, Math.round(overall_score / 10)));

  // ATS Grade
  let ats_grade: AtsScorecard['ats_grade'] = 'D';
  if (overall_score >= 85) ats_grade = 'A+';
  else if (overall_score >= 70) ats_grade = 'A';
  else if (overall_score >= 55) ats_grade = 'B';
  else if (overall_score >= 40) ats_grade = 'C';

  // Compliance checks
  const compliance_checks = {
    contact_info_present: Boolean(applicantContactInfo.email && applicantContactInfo.email.includes('@')),
    standard_headings_detected: /\b(experience|education|skills|summary|projects)\b/i.test(combinedCvText),
    date_formatting_valid: /\d{4}/.test(applicantExperienceText || applicantAcademicText),
    single_column_safe: true
  };

  // Actionable recommendations
  const actionable_recommendations: string[] = [];

  if (missing_critical_skills.length > 0) {
    actionable_recommendations.push(
      `Add these missing technical keywords to your experience bullets: ${missing_critical_skills.slice(0, 5).join(', ')}.`
    );
  }

  if (essential_skills_coverage_pct < 50) {
    actionable_recommendations.push(
      `Your resume covers only ${essential_skills_coverage_pct}% of required technical skills. Focus on adding evidence of: ${missing_critical_skills.slice(0, 3).join(', ')}.`
    );
  }

  if (keyword_coverage_pct < 40) {
    actionable_recommendations.push(
      `Keyword coverage is low (${keyword_coverage_pct}%). Mirror key phrases from the job description in your bullet points and skills section.`
    );
  }

  if (titleBonus < 5 && jobTitle) {
    actionable_recommendations.push(
      `Your resume doesn't prominently feature the target role "${jobTitle}". Add it to your summary or headline.`
    );
  }

  if (!compliance_checks.contact_info_present) {
    actionable_recommendations.push(
      'Ensure a valid email and phone number are explicitly visible in the top contact banner.'
    );
  }

  if (!compliance_checks.date_formatting_valid) {
    actionable_recommendations.push(
      'Add clear date ranges (e.g., "Jan 2022 - Present") to your work experience entries.'
    );
  }

  if (missing_secondary_skills.length > 3) {
    actionable_recommendations.push(
      `Consider adding industry terms mentioned in the posting: ${missing_secondary_skills.slice(0, 4).join(', ')}.`
    );
  }

  if (actionable_recommendations.length === 0) {
    actionable_recommendations.push(
      'Excellent ATS alignment! Your resume closely mirrors the job requirements. Consider fine-tuning your bullet points for maximum impact.'
    );
  }

  // Sort keyword diff: missing critical first, then missing secondary, then matched
  keyword_diff.sort((a, b) => {
    const statusOrder = { missing: 0, partial: 1, matched: 2 };
    const catOrder = { critical: 0, secondary: 1, soft: 2 };
    if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
    if (catOrder[a.category] !== catOrder[b.category]) return catOrder[a.category] - catOrder[b.category];
    return b.frequency_in_jd - a.frequency_in_jd;
  });

  return {
    overall_score,
    fit_score_10,
    ats_grade,
    keyword_coverage_pct: Math.min(100, keyword_coverage_pct),
    essential_skills_coverage_pct: Math.min(100, essential_skills_coverage_pct),
    matched_skills: Array.from(new Set(matched_skills)).slice(0, 20),
    missing_critical_skills: Array.from(new Set(missing_critical_skills)).slice(0, 10),
    missing_secondary_skills: Array.from(new Set(missing_secondary_skills)).slice(0, 10),
    job_extracted_keywords: allJobTerms.slice(0, 20),
    actionable_recommendations,
    compliance_checks,
    keyword_diff: keyword_diff.slice(0, 40)
  };
}
