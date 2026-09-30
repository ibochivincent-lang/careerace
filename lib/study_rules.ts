import type { ErrorType } from "./types.ts";

// Positive guidance ("do this next") per recurring error pattern. Keys are the
// canonical ErrorType values produced by normalizeErrorTypes() in ./pedagogy.
export const studyRules: Record<ErrorType, string[]> = {
  conceptual_misconception: [
    "ask what the term means before any calculation",
    "contrast it with the concept it is being confused with",
    "find the case where their model gives the wrong answer",
  ],
  procedural_error: [
    "make them write every step, no skipping",
    "find the line where the value first goes wrong",
  ],
  unit_confusion: [
    "convert to SI before substituting",
    "carry units through every line of working",
  ],
  sign_error: [
    "fix a positive direction before substituting",
    "re-read the direction words in the stem",
  ],
  formula_misapplication: [
    "state the formula's conditions before using it",
    "name what every symbol stands for",
  ],
  distractor_susceptibility: [
    "predict the answer before reading the options",
    "say out loud why each wrong option is tempting",
  ],
  language_barrier: [
    "restate the stem in their own words first",
    "unpack the command word - state, explain, derive, account for",
  ],
  recall_gap: [
    "one-line summary in their own words at the end",
    "come back to it tomorrow, then in three days",
  ],
};
