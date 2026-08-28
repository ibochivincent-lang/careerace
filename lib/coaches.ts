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
    slug: "mr-obinna",
    name: "Obinna Eze",
    role: "Physics & Further Maths coach",
    topics: ["newton_laws", "kinematics", "projectile", "electricity", "waves", "thermodynamics"],
    patterns: ["unit_confusion", "sign_error", "formula_misapplication"],
  },
  {
    slug: "mrs-adaeze",
    name: "Adaeze Okonkwo",
    role: "Chemistry & Biology coach",
    topics: ["stoichiometry", "organic_chemistry", "acids_bases", "electrochemistry", "cell_division", "genetics", "photosynthesis"],
    patterns: ["conceptual_misconception", "recall_gap"],
  },
  {
    slug: "mr-tunde",
    name: "Tunde Bakare",
    role: "Mathematics coach",
    topics: ["quadratics", "calculus", "trigonometry", "probability", "indices_logs"],
    patterns: ["procedural_error", "sign_error"],
  },
  {
    slug: "ms-halima",
    name: "Halima Yusuf",
    role: "Use of English & exam technique",
    topics: ["comprehension", "lexis_structure", "oral_english"],
    patterns: ["language_barrier", "distractor_susceptibility"],
  },
  {
    slug: "mr-chidi",
    name: "Chidi Nwankwo",
    role: "Economics & Commerce coach",
    topics: ["demand_supply", "elasticity", "national_income", "money_banking"],
    patterns: ["conceptual_misconception", "distractor_susceptibility"],
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
