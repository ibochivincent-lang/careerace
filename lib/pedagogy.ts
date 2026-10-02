/**
 * Deterministic teaching screen — the ExamAce equivalent of an allergen check.
 *
 * This runs AFTER the model speaks, so a question or explanation is screened
 * whether it came from a static bank or from the LLM. The three things it
 * catches are the three ways a tutor with a memory can still fail a student:
 *
 *   1. RE-ASSERTING a misconception the record says they already hold. An
 *      explanation that repeats the wrong model without naming it as wrong
 *      does not just fail to help — it confirms the error in the student's own
 *      words.
 *   2. GIVING THE ANSWER. A Socratic tutor that answers the question has
 *      stopped being one, and the student loses the only part of the session
 *      that was doing any work.
 *   3. GOING OFF SYLLABUS for the exam they are actually sitting.
 *
 * A fourth, softer flag — re-drilling a topic the record already marks as
 * mastered — is reported separately: it wastes a session rather than damaging
 * one, so it is a warning, not a refusal.
 *
 * None of it asks a model. That is the point: the guarantee does not depend on
 * the thing being guarded.
 */

import type { ErrorType } from "./types.ts";

/**
 * The wrong models students actually arrive with, and the tokens that betray
 * them. `wrong` matches text that ASSERTS the misconception; `correction`
 * matches text that is confronting it. A line carrying both is doing its job —
 * "force is not mass times velocity, it is mass times acceleration" must not
 * be flagged.
 */
export const MISCONCEPTIONS: Record<
  string,
  { label: string; wrong: string[]; correction: string[] }
> = {
  force_velocity: {
    label: "force = mass x velocity",
    wrong: ["force = mass x velocity", "force = mass times velocity", "f = mv", "force is mass times velocity"],
    correction: ["f = ma", "mass x acceleration", "mass times acceleration", "rate of change of velocity", "not velocity"],
  },
  mass_weight: {
    label: "mass and weight are the same thing",
    wrong: ["mass and weight are the same", "weight is measured in kilograms", "weight in kg", "mass is measured in newtons"],
    correction: ["w = mg", "newton", "gravitational field", "mass is in kilograms", "weight is a force"],
  },
  speed_velocity: {
    label: "speed and velocity are interchangeable",
    wrong: ["speed and velocity are the same", "velocity has no direction", "speed is a vector"],
    correction: ["vector", "scalar", "direction", "displacement"],
  },
  current_used_up: {
    label: "current is used up as it flows",
    wrong: ["current is used up", "current gets weaker after the bulb", "voltage flows through"],
    correction: ["conserved", "same current", "potential difference", "kirchhoff"],
  },
  mole_gram: {
    label: "a mole is a gram",
    wrong: ["one mole is one gram", "a mole is a gram", "molar mass is the same as mass"],
    correction: ["avogadro", "6.02", "moles = mass / molar mass", "mol/dm", "amount of substance"],
  },
  acid_strength_concentration: {
    label: "strong acid means concentrated acid",
    wrong: ["strong acid means concentrated", "a concentrated acid is a strong acid", "dilute means weak"],
    correction: ["degree of dissociation", "fully ionis", "fully ioniz", "concentration is about amount"],
  },
  osmosis_solute: {
    label: "osmosis moves the solute",
    wrong: ["osmosis moves the solute", "water moves from low to high water potential", "osmosis moves salt"],
    correction: ["solvent", "high to low water potential", "semi-permeable", "semipermeable", "water only"],
  },
  mitosis_gametes: {
    label: "mitosis produces gametes",
    wrong: ["mitosis produces gametes", "meiosis produces identical cells", "mitosis halves the chromosome"],
    correction: ["meiosis produces gametes", "haploid", "four daughter cells", "identical diploid"],
  },
  photosynthesis_night: {
    label: "plants respire only at night",
    wrong: ["plants respire only at night", "plants only respire at night", "respiration stops in the day"],
    correction: ["respire all the time", "both day and night", "net gas exchange"],
  },
  equals_sign_chain: {
    label: "chaining unequal expressions with one = sign",
    wrong: ["= = ", "x = 4 = 8"],
    correction: ["each line is its own equation", "separate step"],
  },
  probability_gambler: {
    label: "past outcomes change the next probability",
    wrong: ["it is due to come up", "due for a head", "has not come up so it is more likely"],
    correction: ["independent", "unchanged probability", "no memory"],
  },
  supply_demand_shift: {
    label: "a price change shifts the demand curve",
    wrong: ["a price change shifts the demand curve", "price shifts demand"],
    correction: ["movement along", "shift is caused by", "non-price factor"],
  },
};

/** Terms that identify a stored misconception claim as one of the keys above. */
const MISCONCEPTION_SYNONYMS: Record<string, string> = {
  "force = mass x velocity": "force_velocity", "f = mv": "force_velocity",
  "force and velocity": "force_velocity", "newton's second": "force_velocity",
  "mass and weight": "mass_weight", "weight and mass": "mass_weight",
  "speed and velocity": "speed_velocity", "scalar and vector": "speed_velocity",
  "current is used up": "current_used_up", "current and voltage": "current_used_up",
  "mole": "mole_gram", "molar mass": "mole_gram",
  "strong acid": "acid_strength_concentration", "concentration and strength": "acid_strength_concentration",
  "osmosis": "osmosis_solute", "water potential": "osmosis_solute",
  "mitosis": "mitosis_gametes", "meiosis": "mitosis_gametes",
  "photosynthesis": "photosynthesis_night", "respiration": "photosynthesis_night",
  "equals sign": "equals_sign_chain",
  "probability": "probability_gambler", "gambler": "probability_gambler",
  "demand curve": "supply_demand_shift", "supply and demand": "supply_demand_shift",
};

/** Topic tokens, used to spot a session about to re-drill something mastered. */
const TOPIC_TOKENS: Record<string, string[]> = {
  newton_laws: ["newton", "net force", "free body", "f = ma", "inertia"],
  kinematics: ["kinematic", "suvat", "acceleration", "displacement", "velocity-time"],
  projectile: ["projectile", "range of the projectile", "time of flight", "angle of projection"],
  electricity: ["ohm", "resistor", "circuit", "current", "potential difference", "emf"],
  waves: ["wavelength", "frequency", "amplitude", "refraction", "diffraction", "resonance"],
  thermodynamics: ["specific heat", "latent heat", "thermal", "calorimet", "gas law"],
  stoichiometry: ["mole", "molar mass", "limiting reagent", "empirical formula", "titration"],
  organic_chemistry: ["alkane", "alkene", "alkyne", "alcohol", "esterification", "isomer"],
  acids_bases: ["acid", "base", "ph", "neutralisation", "neutralization", "indicator"],
  electrochemistry: ["electrolysis", "electrode", "anode", "cathode", "faraday", "redox"],
  periodic_table: ["periodic table", "group ii", "electronic configuration", "ionisation energy", "ionization energy"],
  cell_division: ["mitosis", "meiosis", "chromosome", "cell division"],
  genetics: ["genotype", "phenotype", "punnett", "allele", "mendel", "inheritance"],
  ecology: ["food chain", "ecosystem", "trophic", "population", "habitat"],
  photosynthesis: ["photosynthesis", "chlorophyll", "stomata", "respiration"],
  digestion: ["digestion", "enzyme", "alimentary", "absorption", "villi"],
  quadratics: ["quadratic", "roots of the equation", "discriminant", "factorise", "factorize"],
  calculus: ["differentiat", "integrat", "derivative", "rate of change", "dy/dx"],
  trigonometry: ["sine rule", "cosine rule", "trigonometric", "bearing", "tan "],
  probability: ["probability", "outcomes", "mutually exclusive", "independent event"],
  indices_logs: ["indices", "logarithm", "surd", "exponent"],
  comprehension: ["comprehension", "passage", "inference", "main idea"],
  lexis_structure: ["antonym", "synonym", "lexis", "concord", "clause"],
  oral_english: ["oral english", "vowel sound", "consonant sound", "stress pattern", "rhyme"],
  demand_supply: ["demand curve", "supply curve", "equilibrium price", "market"],
  elasticity: ["elasticity", "elastic demand", "inelastic"],
  money_banking: ["central bank", "monetary policy", "commercial bank", "inflation"],
  system_design: ["system design", "architecture", "microservices", "scalability", "load balancer", "database scaling"],
  frontend_architecture: ["react", "frontend", "next.js", "nextjs", "css", "state management", "web vitals"],
  smart_contracts: ["smart contract", "sui move", "move", "blockchain", "web3", "walrus"],
  behavioral_star: ["star", "behavioral", "leadership", "incident", "conflict", "team"],
  career_strategy: ["negotiation", "salary", "compensation", "offer", "resume", "cv"],
};

const TOPIC_SYNONYMS: Record<string, string> = Object.fromEntries(
  Object.entries(TOPIC_TOKENS).flatMap(([key, tokens]) => [
    [key.replace(/_/g, " "), key],
    ...tokens.map((t) => [t, key] as const),
  ]),
);

export const ERROR_TYPE_LABELS: Record<ErrorType, string> = {
  conceptual_misconception: "conceptual misconception",
  procedural_error: "procedural slips",
  unit_confusion: "unit confusion",
  sign_error: "sign errors",
  formula_misapplication: "misapplied formulas",
  distractor_susceptibility: "falling for distractors",
  language_barrier: "question wording",
  recall_gap: "recall gaps",
};

const ERROR_TYPE_SYNONYMS: Record<string, ErrorType> = {
  "conceptual misconception": "conceptual_misconception", concept: "conceptual_misconception",
  misconception: "conceptual_misconception",
  "procedural error": "procedural_error", procedure: "procedural_error", "working out": "procedural_error",
  "unit confusion": "unit_confusion", unit: "unit_confusion", units: "unit_confusion", conversion: "unit_confusion",
  "sign error": "sign_error", sign: "sign_error", negative: "sign_error",
  "formula misapplication": "formula_misapplication", formula: "formula_misapplication",
  "wrong formula": "formula_misapplication",
  "distractor susceptibility": "distractor_susceptibility", distractor: "distractor_susceptibility",
  trap: "distractor_susceptibility", "trap option": "distractor_susceptibility",
  "language barrier": "language_barrier", wording: "language_barrier", "command word": "language_barrier",
  english: "language_barrier",
  "recall gap": "recall_gap", recall: "recall_gap", forgets: "recall_gap", memorisation: "recall_gap",
};

/**
 * Content that is not on the syllabus for the exam the student is sitting.
 * A coarse net, deliberately: it catches a tutor drifting into university
 * material, not every scope error. The gap is named out loud in the
 * constraints block rather than papered over.
 */
const OFF_SYLLABUS_TOKENS: Record<string, string[]> = {
  JAMB: ["lagrangian", "hamiltonian", "tensor", "quantum field", "schrodinger", "fourier transform",
    "laplace transform", "eigenvalue", "linear algebra", "partial differential", "molecular orbital theory",
    "nmr spectroscopy", "mass spectrometry", "crystal field"],
  WAEC: ["lagrangian", "hamiltonian", "tensor", "quantum field", "schrodinger", "fourier transform",
    "laplace transform", "eigenvalue", "partial differential", "molecular orbital theory", "nmr spectroscopy"],
  NECO: ["lagrangian", "hamiltonian", "tensor", "quantum field", "schrodinger", "fourier transform",
    "laplace transform", "eigenvalue", "partial differential", "molecular orbital theory"],
  POST_UTME: ["lagrangian", "hamiltonian", "tensor", "quantum field", "fourier transform", "laplace transform"],
};

/**
 * A Socratic tutor may not hand over the answer. These are the phrasings that
 * do it outright; a model that wants to lead the student to it has to work
 * without them.
 */
const ANSWER_REVEAL_TOKENS = [
  "the answer is", "the correct answer is", "the correct option is", "the right answer is",
  "answer: ", "so the answer would be", "option b is correct", "option a is correct",
  "option c is correct", "option d is correct",
];

export type LearnerProfile = {
  /** Target roles & job titles */
  targetRoles?: string[];
  /** Verified technical and professional skills */
  skills?: string[];
  /** Work experiences & achievements */
  experiences?: string[];
  /** Academic credentials */
  education?: string[];
  /** Tailored CV sections */
  tailoredCv?: string[];
  /** Applications submitted or queued */
  applications?: string[];
  /** Interview feedback and STAR+R assessments */
  interviewFeedback?: string[];
  /** Exam target and date, as stored: "JAMB - April 2026". */
  goal?: string[];
  /** Wrong models they hold. Never restate one as true. */
  misconceptions?: string[];
  /** Topics or skills they struggle with. */
  weaknesses?: string[];
  /** Topics or skills already demonstrated. */
  mastery?: string[];
  /** Recurring mistake shapes. */
  errorPatterns?: string[];
  /** Standing delivery preferences. Never a pedagogical override. */
  preferences?: string[];
  /** They explicitly told us they have no restrictions yet. */
  cleared?: boolean;
};

/**
 * Do we actually know what this candidate/student is preparing for?
 */
export function targetKnown(profile: LearnerProfile = {}) {
  return (
    Boolean(profile.cleared) ||
    normalizeList(profile.targetRoles).length > 0 ||
    normalizeList(profile.skills).length > 0 ||
    normalizeList(profile.experiences).length > 0 ||
    normalizeList(profile.goal).length > 0 ||
    normalizeList(profile.weaknesses).length > 0 ||
    normalizeList(profile.misconceptions).length > 0
  );
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeList(value: string[] | string | undefined | null): string[] {
  if (Array.isArray(value)) return value.map(String).map((v) => v.trim()).filter(Boolean);
  if (!value) return [];
  return String(value).split(",").map((v) => v.trim()).filter(Boolean);
}

/**
 * Facts come out of memory as the student phrased them — "thinks force is mass
 * times velocity, said so in the mock test", not the bare synonym key. An
 * exact-match-only lookup would quietly return the raw string, which matches
 * no table, and the whole screen would pass an explanation it should have
 * stopped. So: exact match first, then look for a known term inside the claim.
 */
function matchTerms<T extends string>(value: string, synonyms: Record<string, T>): T[] {
  const exact = synonyms[value];
  if (exact) return [exact];
  const found = new Set<T>();
  for (const [term, key] of Object.entries(synonyms) as [string, T][]) {
    if (new RegExp(`\\b${escapeRegex(term)}`).test(value)) found.add(key);
  }
  return [...found];
}

export function normalizeMisconceptions(list: string[] | string | undefined): string[] {
  const keys = new Set<string>();
  for (const raw of normalizeList(list)) {
    const value = raw.toLowerCase().trim();
    const matched = matchTerms(value, MISCONCEPTION_SYNONYMS);
    if (matched.length) matched.forEach((k) => keys.add(k));
    else keys.add(value);
  }
  return [...keys];
}

export function normalizeTopics(list: string[] | string | undefined): string[] {
  const keys = new Set<string>();
  for (const raw of normalizeList(list)) {
    const value = raw.toLowerCase().trim();
    const matched = matchTerms(value, TOPIC_SYNONYMS);
    if (matched.length) matched.forEach((k) => keys.add(k));
    else keys.add(value);
  }
  return [...keys];
}

export function normalizeErrorTypes(list: string[] | string | undefined): ErrorType[] {
  const keys = new Set<ErrorType>();
  for (const raw of normalizeList(list)) {
    matchTerms(raw.toLowerCase().trim(), ERROR_TYPE_SYNONYMS).forEach((k) => keys.add(k));
  }
  return [...keys];
}

/** The exam target named in a stored goal, if it is one we hold a scope for. */
export function examTargetOf(goals: string[] | string | undefined): string | null {
  const haystack = normalizeList(goals).join(" ").toUpperCase();
  for (const target of Object.keys(OFF_SYLLABUS_TOKENS)) {
    if (haystack.includes(target.replace(/_/g, "-")) || haystack.includes(target)) return target;
  }
  if (/POST[\s-]?UTME/.test(haystack)) return "POST_UTME";
  return null;
}

export function findFlags(text: string, tokens: string[]): string[] {
  const haystack = ` ${String(text ?? "").toLowerCase()} `;
  const found = new Set<string>();
  for (const token of tokens) {
    if (haystack.includes(token.toLowerCase())) found.add(token);
  }
  return [...found];
}

export function buildBlocklist(profile: LearnerProfile = {}) {
  const misconceptionKeys = normalizeMisconceptions(profile.misconceptions);
  const masteredKeys = normalizeTopics(profile.mastery);
  const errorTypes = normalizeErrorTypes(profile.errorPatterns);
  const target = examTargetOf(profile.goal);

  return {
    misconceptionKeys,
    masteredKeys,
    errorTypes,
    target,
    masteredTokens: masteredKeys.flatMap((k) => TOPIC_TOKENS[k] ?? []),
    offSyllabusTokens: target ? OFF_SYLLABUS_TOKENS[target] ?? [] : [],
  };
}

/** Hard constraints folded into the system prompt — defence in depth, before screening. */
export function buildTeachingConstraintsText(profile: LearnerProfile) {
  const { misconceptionKeys, errorTypes, target } = buildBlocklist(profile);
  const lines = ["HARD COACHING & PEDAGOGICAL CONSTRAINTS - every reply must comply:"];

  // Career Ace specific profile elements
  const statedTargetRoles = normalizeList(profile.targetRoles);
  const statedSkills = normalizeList(profile.skills);
  const statedExperiences = normalizeList(profile.experiences);
  const statedEducation = normalizeList(profile.education);
  const statedInterviewFeedback = normalizeList(profile.interviewFeedback);
  const statedApplications = normalizeList(profile.applications);

  if (statedTargetRoles.length) {
    lines.push(`- Candidate is actively targeting: ${statedTargetRoles.join("; ")}. Tailor all interview simulations, role evaluations, and CV impact metrics directly to these target positions.`);
  }
  if (statedSkills.length) {
    lines.push(`- Candidate verified technical skills: ${statedSkills.join(", ")}. Reference and probe these skills in technical and architecture evaluations.`);
  }
  if (statedExperiences.length) {
    lines.push(`- Verified career background & accomplishments: ${statedExperiences.join("; ")}. Ground all behavioral questions and resume bullet points in these real achievements.`);
  }
  if (statedInterviewFeedback.length) {
    lines.push(`- Previous interview coaching feedback: ${statedInterviewFeedback.join("; ")}. Proactively drill candidate on these weak areas in STAR+R format.`);
  }
  if (statedApplications.length) {
    lines.push(`- Application history: ${statedApplications.join("; ")}.`);
  }

  const statedMisconceptions = normalizeList(profile.misconceptions);
  const statedWeaknesses = normalizeList(profile.weaknesses);
  const statedMastery = normalizeList(profile.mastery);
  const statedGoal = normalizeList(profile.goal);

  if (statedGoal.length) {
    lines.push(`- Target objective: ${statedGoal.join("; ")}. Keep every example inside that objective's scope and style.`);
  }
  if (statedMisconceptions.length) {
    lines.push(
      `- They currently believe these WRONG things: ${statedMisconceptions.join("; ")}. Never state any of them as true, not even to paraphrase the candidate/student. When the topic comes up, surface the wrong model and make them test it against a case where it fails.`,
    );
  }
  if (statedWeaknesses.length) {
    lines.push(`- They struggle with: ${statedWeaknesses.join("; ")}. Slow down here and ask more before explaining.`);
  }
  if (statedMastery.length) {
    lines.push(`- They have already demonstrated: ${statedMastery.join("; ")}. Do not re-teach these from scratch; build on them instead.`);
  }
  if (errorTypes.length) {
    lines.push(`- Recurring error patterns: ${errorTypes.map((e) => ERROR_TYPE_LABELS[e]).join(", ")}. Watch for these specifically in their responses.`);
  }

  for (const key of misconceptionKeys) {
    const known = MISCONCEPTIONS[key];
    if (known) {
      lines.push(`- On "${known.label}": your reply must contradict it explicitly if the topic arises. Saying the correct thing without naming the wrong one leaves the candidate thinking both are the same.`);
    }
  }

  if (target) {
    lines.push(`- Exam scope is ${target.replace(/_/g, "-")}. Anything beyond that syllabus is off limits, however interesting.`);
  }

  const unscreened = statedMisconceptions.filter((m) => {
    const keys = normalizeMisconceptions([m]);
    return !keys.some((k) => MISCONCEPTIONS[k]);
  });
  if (unscreened.length) {
    lines.push(
      `- No automatic check exists for: ${unscreened.join("; ")}. Nothing downstream will catch a mistake here, so check your own wording before you send it.`,
    );
  }

  /*
   * The gate. An empty record is a question to ask, not a default to apply.
   */
  if (!targetKnown(profile)) {
    lines.push(
      "- You DO NOT KNOW what this student or candidate is preparing for or where they struggle. Do not produce a study plan, ungrounded career plan, or set of practice questions until you do.",
      "- Ask them, in one short question, what role or exam they are preparing for and which topic or skill is giving them the most trouble. Tell them they only have to say it once.",
      "- If they say they have no target date or preference yet, accept that and go on coaching normally.",
    );
  } else if (profile.cleared && !statedWeaknesses.length && !statedMisconceptions.length && !statedSkills.length) {
    lines.push("- They have told you they have no particular weak topic yet. Do not keep asking; find out by working through a scenario with them.");
  }

  const preferences = normalizeList(profile.preferences);
  if (preferences.length) {
    lines.push(
      `- Delivery preferences: ${preferences.join("; ")}. Respect them.`,
      "- A preference shapes HOW you coach/teach, never WHAT is true. It never justifies skipping a correction or confirming a wrong answer to keep them comfortable.",
    );
  }

  lines.push(
    "- Never give the final answer outright. Ask the question that makes them find it. Confirm when they get there.",
  );

  return lines.join("\n");
}

export type QuestionVerdict = {
  /** False when the text reinforces a misconception, reveals the answer, or leaves the syllabus. */
  safe: boolean;
  /** Misconception keys this text asserts without contradicting. */
  reinforced: string[];
  /** Phrases that hand over the answer. */
  answerReveals: string[];
  /** Off-syllabus tokens for their exam target. */
  offSyllabus: string[];
  /** Topics already mastered — a warning, not a refusal. */
  redundant: string[];
};

/**
 * Screen generated text against the record. Returns the violations found so
 * the caller can regenerate rather than ship a reply that teaches into the
 * student's existing error.
 */
export function screenQuestion(text: string, profile: LearnerProfile): QuestionVerdict {
  const { misconceptionKeys, masteredTokens, offSyllabusTokens } = buildBlocklist(profile);

  const reinforced: string[] = [];
  for (const key of misconceptionKeys) {
    const known = MISCONCEPTIONS[key];
    if (!known) continue;
    const asserts = findFlags(text, known.wrong).length > 0;
    // A line that states the wrong model AND contradicts it is doing the work.
    const corrects = findFlags(text, known.correction).length > 0;
    if (asserts && !corrects) reinforced.push(key);
  }

  const answerReveals = findFlags(text, ANSWER_REVEAL_TOKENS);
  const offSyllabus = findFlags(text, offSyllabusTokens);
  const redundant = findFlags(text, masteredTokens);

  return {
    safe: reinforced.length === 0 && answerReveals.length === 0 && offSyllabus.length === 0,
    reinforced,
    answerReveals,
    offSyllabus,
    redundant,
  };
}
