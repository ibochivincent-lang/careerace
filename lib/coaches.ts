import { normalizeErrorTypes, normalizeTopics, ERROR_TYPE_LABELS } from "./pedagogy.ts";
import type { ErrorType } from "./types.ts";

/**
 * Static seed. There is no database in this app on purpose: memory is the only
 * store, which is what lets a stranger clone the repo and run it with three env
 * vars. The memory feature here is the RANKING, not the list.
 */
export type Coach = {
  slug: string;
  name: string;
  role: string;
  /** Topic keys this coach is the right first call for. */
  topics: string[];
  /** Error patterns they specialise in unpicking. */
  patterns: ErrorType[];
};

export const COACHES: Coach[] = [
  {
    slug: "elena-rostova",
    name: "Elena Rostova",
    role: "Principal Distributed Systems & Cloud Architect",
    topics: ["system_design", "cloud_infrastructure", "microservices", "kubernetes", "database_scaling", "concurrency"],
    patterns: ["formula_misapplication", "procedural_error"],
  },
  {
    slug: "marcus-vance",
    name: "Marcus Vance",
    role: "Staff STAR+R Behavioral & Executive Leadership Coach",
    topics: ["behavioral_star", "leadership_principles", "conflict_resolution", "cross_functional", "executive_communication"],
    patterns: ["language_barrier", "distractor_susceptibility"],
  },
  {
    slug: "devon-chen",
    name: "Devon Chen",
    role: "Staff Frontend & Web Applications Specialist",
    topics: ["frontend_architecture", "react_performance", "typescript_patterns", "nextjs_optimization", "web_vitals"],
    patterns: ["unit_confusion", "sign_error"],
  },
  {
    slug: "aisha-bello",
    name: "Aisha Bello",
    role: "Web3, Smart Contracts & Sui Move Engineer",
    topics: ["smart_contracts", "sui_move", "defi_protocols", "cryptography", "decentralized_storage"],
    patterns: ["conceptual_misconception", "recall_gap"],
  },
  {
    slug: "sarah-jenkins",
    name: "Sarah Jenkins",
    role: "Executive Tech Recruiter & Compensation Strategist",
    topics: ["career_strategy", "salary_negotiation", "offer_evaluation", "resume_framing", "equity_rsus"],
    patterns: ["distractor_susceptibility", "language_barrier"],
  },
  {
    slug: "mr-obinna",
    name: "Obinna Eze",
    role: "Scientific Computing & Simulation Systems Coach",
    topics: ["projectile", "newton_laws", "kinematics", "electricity", "waves", "thermodynamics"],
    patterns: ["unit_confusion", "sign_error", "formula_misapplication"],
  },
];

export type RankedCoach = Coach & { score: number; reason: string };

/**
 * Rank coaches by what the student's own memory says they struggle with.
 * The `reason` string is rendered next to each result — the visible proof that
 * memory is driving the app, not just the chat.
 */
export function rankCoaches(weakTopics: string[], errorPatterns: string[]): RankedCoach[] {
  const topicKeys = normalizeTopics(weakTopics);
  const patternKeys = normalizeErrorTypes(errorPatterns);

  return COACHES.map((c) => {
    const matchedTopics = c.topics.filter((t) => topicKeys.includes(t));
    const matchedPatterns = c.patterns.filter((p) => patternKeys.includes(p));
    const reasons = [
      ...matchedTopics.map((t) => t.replace(/_/g, " ")),
      ...matchedPatterns.map((p) => ERROR_TYPE_LABELS[p]),
    ];
    return {
      ...c,
      // A topic hit is a stronger signal than a shared error pattern: the
      // pattern says how they get things wrong, the topic says where.
      score: matchedTopics.length * 2 + matchedPatterns.length,
      reason: reasons.length
        ? `Ranked for your ${reasons.join(" and ")}.`
        : "Nothing in your record points here yet.",
    };
  }).sort((a, b) => b.score - a.score);
}
