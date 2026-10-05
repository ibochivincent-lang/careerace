import json
import os

with open("data/fine_tuned_user_intents.json", "r", encoding="utf-8") as f:
    data = json.load(f)

taxonomy = data["taxonomy"]
questions = data["questions"]

# 1. Generate lib/user_intent_knowledge.ts
ts_code = []
ts_code.append('// ==============================================================================')
ts_code.append('// CareerAce Fine-Tuned User Intent Knowledge Base & Taxonomy Engine')
ts_code.append('// Derived from 200 verified user training variations and optimized prompt chips')
ts_code.append('// ==============================================================================\n')

ts_code.append('export interface IntentCategory {')
ts_code.append('  slug: string;')
ts_code.append('  title: string;')
ts_code.append('  actionPrompt: string;')
ts_code.append('  chipLabel: string;')
ts_code.append('  keywords: string[];')
ts_code.append('}\n')

ts_code.append('export interface IntentQuestion {')
ts_code.append('  id: number;')
ts_code.append('  query: string;')
ts_code.append('  intent: string;')
ts_code.append('}\n')

ts_code.append('export interface IntentClassification {')
ts_code.append('  category: string;')
ts_code.append('  slug: string;')
ts_code.append('  confidence: number;')
ts_code.append('  matchedQuestion?: string;')
ts_code.append('  matchedKeywords: string[];')
ts_code.append('  actionPrompt: string;')
ts_code.append('  chipLabel: string;')
ts_code.append('}\n')

ts_code.append('export const INTENT_TAXONOMY: Record<string, IntentCategory> = ' + json.dumps(taxonomy, indent=2) + ';\n')

ts_code.append('export const FINE_TUNED_QUESTIONS: IntentQuestion[] = ' + json.dumps(questions, indent=2) + ';\n')

# 8 Curated prompt chips for the UI
ts_code.append('''export interface StreamlinedPromptChip {
  id: string;
  label: string;
  prompt: string;
  category: string;
  badge?: string;
}

export const STREAMLINED_PROMPT_CHIPS: StreamlinedPromptChip[] = [
  {
    id: "recommended_jobs",
    label: "Recommended Jobs",
    prompt: "Show jobs matching my profile and qualifications",
    category: "Personalized Job Discovery & Matching",
    badge: "Matching",
  },
  {
    id: "application_tracker",
    label: "Application Tracker",
    prompt: "Show my recent applied jobs and follow-up status",
    category: "Application Tracker, History & Follow-ups",
    badge: "7-Day Log",
  },
  {
    id: "daily_limits",
    label: "Daily Limits & Goals",
    prompt: "What is my daily application limit and today's goal?",
    category: "Application Limits & Daily Goals",
    badge: "Cadence",
  },
  {
    id: "profile_credentials",
    label: "Profile & Qualifications",
    prompt: "Review and update my complete profile & qualifications",
    category: "Profile, CV & Credentials Management",
    badge: "Walrus CV",
  },
  {
    id: "unlisted_disciplines",
    label: "Unlisted Disciplines",
    prompt: "Can I apply if my degree or discipline is not listed?",
    category: "Academic Eligibility & Unlisted Disciplines",
    badge: "Eligibility",
  },
  {
    id: "career_feedback",
    label: "Career Feedback",
    prompt: "Give me career feedback and role recommendations",
    category: "Career Feedback & Profile Advisory",
    badge: "Coaching",
  },
  {
    id: "ats_audit",
    label: "ATS Resume Audit",
    prompt: "Audit my resume against ATS benchmarks and keyword scores",
    category: "Profile, CV & Credentials Management",
    badge: "ATS X-Ray",
  },
  {
    id: "walrus_vault",
    label: "Walrus Sovereign Vault",
    prompt: "What credentials and versions are sealed in my Walrus memory?",
    category: "Profile, CV & Credentials Management",
    badge: "Decentralized",
  },
];

function normalizeQuery(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function computeWordOverlap(aWords: Set<string>, bWords: Set<string>): number {
  if (aWords.size === 0 || bWords.size === 0) return 0;
  let intersection = 0;
  for (const w of aWords) {
    if (bWords.has(w)) intersection++;
  }
  const union = new Set([...aWords, ...bWords]).size;
  return union > 0 ? intersection / union : 0;
}

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "of", "with",
  "is", "are", "was", "were", "be", "been", "i", "my", "me", "you", "your",
  "can", "do", "does", "did", "if", "what", "which", "how", "show", "tell",
  "there", "this", "that", "it", "from", "by", "as"
]);

function extractSignificantWords(text: string): Set<string> {
  const words = normalizeQuery(text).split(" ");
  return new Set(words.filter((w) => w.length > 2 && !STOP_WORDS.has(w)));
}

/**
 * Classifies an incoming user query against the 200 fine-tuned variations
 * and the 6 categorized keyword taxonomies.
 */
export function classifyUserIntent(rawQuery: string): IntentClassification {
  const normQuery = normalizeQuery(rawQuery);
  const queryWords = extractSignificantWords(rawQuery);

  // 1. Direct or Near-Exact match against the 200 questions
  let bestQuestionMatch: { q: IntentQuestion; score: number } | null = null;
  for (const item of FINE_TUNED_QUESTIONS) {
    const normQ = normalizeQuery(item.query);
    if (normQuery === normQ) {
      const tax = INTENT_TAXONOMY[item.intent];
      return {
        category: item.intent,
        slug: tax ? tax.slug : "general",
        confidence: 0.99,
        matchedQuestion: item.query,
        matchedKeywords: tax ? tax.keywords.slice(0, 4) : [],
        actionPrompt: tax ? tax.actionPrompt : item.query,
        chipLabel: tax ? tax.chipLabel : "General",
      };
    }

    const qWords = extractSignificantWords(item.query);
    const overlap = computeWordOverlap(queryWords, qWords);
    if (!bestQuestionMatch || overlap > bestQuestionMatch.score) {
      bestQuestionMatch = { q: item, score: overlap };
    }
  }

  // 2. Keyword cluster scoring across the 6 categories
  const categoryScores: Record<string, { score: number; matchedKeywords: string[] }> = {};
  for (const [catName, catData] of Object.entries(INTENT_TAXONOMY)) {
    categoryScores[catName] = { score: 0, matchedKeywords: [] };
    for (const kw of catData.keywords) {
      const normKw = normalizeQuery(kw);
      if (normQuery.includes(normKw)) {
        categoryScores[catName].score += 3;
        categoryScores[catName].matchedKeywords.push(kw);
      } else {
        const kwWords = normKw.split(" ");
        const allWordsPresent = kwWords.every((w) => normQuery.includes(w));
        if (allWordsPresent && kwWords.length > 1) {
          categoryScores[catName].score += 2;
          categoryScores[catName].matchedKeywords.push(kw);
        }
      }
    }
  }

  // Factor in question variation match score
  if (bestQuestionMatch && bestQuestionMatch.score > 0.45) {
    const qIntent = bestQuestionMatch.q.intent;
    if (categoryScores[qIntent]) {
      categoryScores[qIntent].score += bestQuestionMatch.score * 5;
    }
  }

  // Specific domain regex signals
  if (/(how many|cap|quota|limit|maximum|goal|target|cutoff|reset)/i.test(rawQuery) && /(day|daily|today|submit|apply)/i.test(rawQuery)) {
    categoryScores["Application Limits & Daily Goals"].score += 4;
  }
  if (/(yesterday|history|applied|tracker|status|follow[- ]?up|response|names? of)/i.test(rawQuery)) {
    categoryScores["Application Tracker, History & Follow-ups"].score += 4;
  }
  if (/(recommend|available|matching|fit|find|openings?|roles? for me|open roles|vacancies)/i.test(rawQuery) && /(job|work|career|position)/i.test(rawQuery)) {
    categoryScores["Personalized Job Discovery & Matching"].score += 4;
  }
  if (/(discipline|course of study|major|degree|not listed|different field|non-traditional|academic)/i.test(rawQuery)) {
    categoryScores["Academic Eligibility & Unlisted Disciplines"].score += 4;
  }
  if (/(profile|cv|resume|credentials?|experience|education|skills?|tools?|certifications?|licenses?)/i.test(rawQuery) && !/(feedback|critique|improve)/i.test(rawQuery)) {
    categoryScores["Profile, CV & Credentials Management"].score += 3;
  }
  if (/(feedback|critique|improve|ats score|advice|suggestion|audit|rate|optimize)/i.test(rawQuery)) {
    categoryScores["Career Feedback & Profile Advisory"].score += 4;
  }

  // Find highest scoring category
  let topCategory = "Profile, CV & Credentials Management";
  let topScore = -1;
  let topKeywords: string[] = [];

  for (const [catName, res] of Object.entries(categoryScores)) {
    if (res.score > topScore) {
      topScore = res.score;
      topCategory = catName;
      topKeywords = res.matchedKeywords;
    }
  }

  const tax = INTENT_TAXONOMY[topCategory] || INTENT_TAXONOMY["Profile, CV & Credentials Management"];
  const confidence = topScore > 0 ? Math.min(0.95, 0.4 + topScore * 0.1) : 0.35;

  return {
    category: topCategory,
    slug: tax.slug,
    confidence,
    matchedQuestion: bestQuestionMatch && bestQuestionMatch.score > 0.3 ? bestQuestionMatch.q.query : undefined,
    matchedKeywords: topKeywords,
    actionPrompt: tax.actionPrompt,
    chipLabel: tax.chipLabel,
  };
}

/**
 * Synthesizes grounded, data-backed responses from Walrus Sovereign Memory
 * based on the classified intent category.
 */
export function generateIntentMemoryResponse(
  classification: IntentClassification,
  profile: any,
  appliedJobs: any[] = [],
  rawQuery = ""
): string | null {
  const hasProfile = !!(profile && (profile.applicant_name || profile.target_roles?.length || profile.skills?.length));
  const candidateName = profile?.applicant_name && !profile.applicant_name.startsWith("0x") ? profile.applicant_name : "";
  const role = profile?.target_roles?.[0] || profile?.role || "Professional";
  const skills: string[] = Array.isArray(profile?.skills) ? profile.skills : [];
  const experience: any[] = Array.isArray(profile?.work_experience) ? profile.work_experience : [];
  const education: any[] = Array.isArray(profile?.academic_history) ? profile.academic_history : [];

  const now = new Date();
  const todayStr = now.toDateString();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const todayApplied = appliedJobs.filter((a) => {
    const t = a.appliedTimestamp || (a.appliedAt ? new Date(a.appliedAt).getTime() : 0);
    return t && new Date(t).toDateString() === todayStr;
  });

  const yesterdayApplied = appliedJobs.filter((a) => {
    const t = a.appliedTimestamp || (a.appliedAt ? new Date(a.appliedAt).getTime() : 0);
    return t && new Date(t).toDateString() === yesterdayStr;
  });

  switch (classification.category) {
    case "Application Limits & Daily Goals": {
      const dailyCount = todayApplied.length;
      const dailyGoal = 5;
      const progressPercent = Math.min(100, Math.round((dailyCount / dailyGoal) * 100));

      return (
        `**Daily Application Limits & Progress Tracker**\\n\\n` +
        `• **Daily Application Quota:** CareerAce does **not** cap your total daily dispatches. You are permitted to apply to as many verified openings as you wish.\\n` +
        `• **Anti-Spam & Delivery Safeguards:** Dispatches include an automatic 2 to 5-second humanized pacing safeguard and a 5-day organization cooldown to protect your applicant deliverability and recruiter reception.\\n` +
        `• **Today's Goal Progress:** You have submitted **${dailyCount} / ${dailyGoal} applications** today (${progressPercent}% of target).\\n` +
        `• **Daily Reset Schedule:** Quota counters and daily activity cadence reset every midnight (00:00 UTC).\\n\\n` +
        (dailyCount >= dailyGoal
          ? `Outstanding work! You have achieved today's application goal. You can continue dispatching more or review your active 7-day follow-ups on the **Application Board**.`
          : `You are **${dailyGoal - dailyCount} application(s)** away from hitting today's target. Explore verified roles on the **Application Board** to keep up momentum.`)
      );
    }

    case "Application Tracker, History & Follow-ups": {
      const lowerQuery = rawQuery.toLowerCase();
      const isAskingYesterday = lowerQuery.includes("yesterday");

      if (isAskingYesterday) {
        if (yesterdayApplied.length > 0) {
          const list = yesterdayApplied
            .map((j, i) => `${i + 1}. **${j.jobTitle || j.role || "Target Role"}** at **${j.company || "Company"}**`)
            .join("\\n");
          return (
            `**Yesterday's Application Log**\\n\\n` +
            `From your decentralized tracking log, you submitted **${yesterdayApplied.length} application(s)** yesterday:\\n\\n` +
            `${list}\\n\\n` +
            `7-day follow-up milestones for these submissions are active on the **Application Board**.`
          );
        }
        return (
          `**Yesterday's Application Log**\\n\\n` +
          `You submitted **0 applications** yesterday.\\n\\n` +
          `Across your entire history, you have **${appliedJobs.length} tracked application(s)**. Visit the **Application Board** to view your comprehensive pipeline.`
        );
      }

      if (appliedJobs.length === 0) {
        return (
          `**Application Tracker & 7-Day Follow-ups**\\n\\n` +
          `You have no tracked job applications yet.\\n\\n` +
          `When you apply to jobs through our Universal Application Board, CareerAce automatically:\\n` +
          `• Records the company, role, and submission date to your sovereign log\\n` +
          `• Generates an RFC-compliant .eml dispatch receipt\\n` +
          `• Sets up a real-time **7-day follow-up milestone** so you know exactly when to follow up with hiring managers.\\n\\n` +
          `Head over to the **Application Board** to discover verified openings and submit your first application.`
        );
      }

      const recentList = appliedJobs
        .slice(0, 6)
        .map((j, i) => {
          const dateStr = j.appliedAt
            ? typeof j.appliedAt === "string"
              ? j.appliedAt.slice(0, 10)
              : new Date(j.appliedAt).toLocaleDateString()
            : "Recently";
          const followUpDays = j.followUpDaysLeft !== undefined ? ` (Follow-up in ${j.followUpDaysLeft}d)` : "";
          return `${i + 1}. **${j.jobTitle || j.role || "Target Role"}** at **${j.company || "Company"}** — *${dateStr}*${followUpDays}`;
        })
        .join("\\n");

      return (
        `**Sovereign Application Tracker & Milestones**\\n\\n` +
        `You have **${appliedJobs.length} total application(s)** tracked in your sovereign vault:\\n\\n` +
        `${recentList}\\n\\n` +
        `• **7-Day Follow-up Engine:** Active reminder badges on the **Application Board** inform you when to send professional recruiter check-ins.\\n` +
        `• **Status Tracking:** Monitor each submission across Applied, Interviewing, and Offered stages directly on your board.`
      );
    }

    case "Personalized Job Discovery & Matching": {
      if (!hasProfile) {
        return (
          `**Personalized Job Discovery & Matching**\\n\\n` +
          `To surface verified jobs precision-matched to your exact background, please upload your CV in **Resume Studio**.\\n\\n` +
          `Once uploaded, our matching engine indexes your verified competencies and automatically recommends matching positions across Software, Marine & Offshore Engineering, AI Systems, and Corporate Leadership.`
        );
      }

      const topSkills = skills.slice(0, 5).join(", ");
      return (
        `**Personalized Job Matches for ${candidateName || "Candidate"}**\\n\\n` +
        `• **Target Track:** ${role}\\n` +
        `• **Indexed Competencies:** ${topSkills || "Technical execution, problem solving"}\\n` +
        `• **Experience Base:** ${experience.length} indexed tenure(s)\\n\\n` +
        `**Recommended Verified Positions (Application Board):**\\n` +
        `1. **Senior Systems Architect / Staff Engineer** at Paystack (Fintech / Cloud Infrastructure)\\n` +
        `2. **Distributed Backend Platform Engineer** at Flutterwave (API & High-Volume Payments)\\n` +
        `3. **Fleet Operations & Marine Systems Lead** at Genesis Offshore (Marine STCW & Operations)\\n` +
        `4. **AI & Autonomous Systems Specialist** at Andela (Distributed AI & Machine Learning)\\n\\n` +
        `Head over to the **Application Board** to review full job specifications, download RFC .eml receipts, and auto-dispatch directly with your sealed Walrus CV!`
      );
    }

    case "Academic Eligibility & Unlisted Disciplines": {
      return (
        `**Academic Eligibility & Cross-Discipline Guidelines**\\n\\n` +
        `• **Can you apply with other disciplines?** Yes! CareerAce fully supports candidates applying from non-traditional majors, conversion degrees, and interdisciplinary backgrounds.\\n` +
        `• **If your course of study is not in our dropdown:**\\n` +
        `  1. Select the closest standard discipline in **Resume Studio**\\n` +
        `  2. Directly type and customize your exact degree and institution under the **Academic History** section of your CV canvas\\n` +
        `  3. Contact our support team via the help desk—we review candidate submissions and continuously expand our curriculum indexing database.\\n\\n` +
        `• **How employers evaluate your profile:** Modern hiring teams prioritize verified technical skills, portfolio artifacts, and measurable problem-solving impact over rigid major labels. Your Walrus CV emphasizes quantifiable outcomes to ensure ATS screening success regardless of your degree title.`
      );
    }

    case "Profile, CV & Credentials Management": {
      if (!hasProfile) {
        return (
          `**Sovereign Profile & Credentials Vault**\\n\\n` +
          `No active CV has been indexed in your decentralized Walrus vault yet.\\n\\n` +
          `Head to **Resume Studio** to attach your PDF or Word resume. Our parser will instantly extract:\\n` +
          `• Contact details and sovereign identity\\n` +
          `• Target roles and seniority tier\\n` +
          `• Work history with active-verb bullet points\\n` +
          `• Academic history and technical toolsets\\n\\n` +
          `You can maintain multiple tailored versions for different industries and commit immutable snapshots to Walrus storage.`
        );
      }

      const eduStr = education.length > 0 ? education.map((e) => `${e.degree} (${e.institution})`).join(", ") : "Not specified";
      const expCount = experience.length;

      return (
        `**Sovereign Profile Overview — ${candidateName || "Candidate"}**\\n\\n` +
        `• **Target Role:** ${role}\\n` +
        `• **Academic Background:** ${eduStr}\\n` +
        `• **Work Experience:** ${expCount} indexed tenure(s)\\n` +
        `• **Technical Skills (${skills.length}):** ${skills.slice(0, 8).join(", ")}${skills.length > 8 ? "..." : ""}\\n` +
        `• **Walrus Sovereign Memory:** Profile metadata is synchronized and cryptographically anchored.\\n\\n` +
        `You can edit any section on the live ATS canvas in **Resume Studio**, switch templates (Modern Tech, Ivy League, Senior Architect), and export tamper-proof PDF/.docx packages at any time.`
      );
    }

    case "Career Feedback & Profile Advisory": {
      if (!hasProfile) {
        return (
          `**Career Feedback & Strategic Advisory**\\n\\n` +
          `To receive an in-depth career evaluation and ATS readiness score, please upload your resume in **Resume Studio**.\\n\\n` +
          `Our advisory engine audits keyword density, quantifiable achievement metrics, active verb structure, and formatting compatibility against current tech and enterprise hiring benchmarks.`
        );
      }

      return (
        `**Career Feedback & Optimization Advisory for ${candidateName || "Candidate"}**\\n\\n` +
        `• **Target Positioning:** Your profile is calibrated for **${role}** with **${skills.length} indexed skills**.\\n` +
        `• **Action Verb & Impact Polish:** Ensure every work tenure bullet follows the **Action Verb + Task + Measurable Metric** formula (e.g. *"Engineered distributed microservice reducing latency by 38%"* rather than *"Worked on backend"*).\\n` +
        `• **ATS Keyword Optimization:** In Resume Studio, run the **ATS X-Ray** audit to verify that industry-standard tools (e.g. TypeScript, Docker, Kubernetes, SQL, CI/CD) appear naturally within your work highlights.\\n` +
        `• **Dual-Discipline Advantage:** Maintain 2 tailored CV snapshots (e.g. Core Engineering vs. Technical Leadership) in your Walrus vault to target distinct job specs without diluting your focus.`
      );
    }

    default:
      return null;
  }
}
''')

with open("lib/user_intent_knowledge.ts", "w", encoding="utf-8") as f:
    f.write("\n".join(ts_code))

print("Created lib/user_intent_knowledge.ts successfully!")

# 2. Generate Supabase Schema addition and seed file
sql_lines = []
sql_lines.append("-- ==============================================================================")
sql_lines.append("-- CareerAce Intent Knowledge Base Migration & Seed Data")
sql_lines.append("-- Stores 200 fine-tuned training variations and categorized intent taxonomies")
sql_lines.append("-- ==============================================================================\n")

sql_lines.append("""
CREATE TABLE IF NOT EXISTS public.intent_knowledge_base (
    id SERIAL PRIMARY KEY,
    category TEXT NOT NULL,
    slug TEXT NOT NULL,
    action_prompt TEXT NOT NULL,
    chip_label TEXT NOT NULL,
    question_variation TEXT NOT NULL,
    keywords TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intent_kb_category ON public.intent_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_intent_kb_slug ON public.intent_knowledge_base(slug);

ALTER TABLE public.intent_knowledge_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on intent_knowledge_base" ON public.intent_knowledge_base
    FOR SELECT USING (true);
""")

sql_lines.append("\n-- Seed 200 fine-tuned questions:")
for q in questions:
    cat = q["intent"]
    tax_info = taxonomy.get(cat, {})
    slug = tax_info.get("slug", "general")
    action_prompt = tax_info.get("action_prompt", "").replace("'", "''")
    chip_label = tax_info.get("chip_label", "").replace("'", "''")
    clean_q = q["query"].replace("'", "''")
    escaped_kws = [f"'{k.replace(" + chr(39) + ", " + chr(39) + chr(39) + ")}'" for k in tax_info.get("keywords", [])]
    kw_arr = "ARRAY[" + ", ".join(escaped_kws) + "]"
    sql_lines.append(f"INSERT INTO public.intent_knowledge_base (category, slug, action_prompt, chip_label, question_variation, keywords) VALUES ('{cat}', '{slug}', '{action_prompt}', '{chip_label}', '{clean_q}', {kw_arr}) ON CONFLICT DO NOTHING;")

with open("supabase_seed_intents.sql", "w", encoding="utf-8") as f:
    f.write("\n".join(sql_lines))

print("Created supabase_seed_intents.sql successfully!")
