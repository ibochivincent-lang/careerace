/**
 * Anti-AI-Slop Writing & Sanitization Engine
 * Grounded in the no-ai-slop specification (https://github.com/petergyang/no-ai-slop).
 *
 * Enforces authentic, human, metric-driven communication by eliminating AI cliches,
 * throat-clearing openers, fake-insight setups, and robotic corporate speak.
 */

export const BANNED_SLOP_WORDS = [
  "delve",
  "foster",
  "leverage",
  "utilize",
  "facilitate",
  "empower",
  "streamline",
  "robust",
  "cutting-edge",
  "paradigm shift",
  "game changer",
  "this is huge",
  "this changes everything",
  "tapestry",
  "realm",
  "beacon",
  "multifaceted",
  "meticulous",
  "intricate",
  "paramount",
  "transformative",
  "elevate",
  "embark",
  "supercharge",
  "harness",
  "ever-evolving",
] as const;

export const THROAT_CLEARING_PATTERNS = [
  /^i hope this (email|message) finds you well[.,!]?\s*/i,
  /^i hope you('re| are) having a (great|wonderful|good) (week|day)[.,!]?\s*/i,
  /^i hope this week is treating you well[.,!]?\s*/i,
  /^i am writing to (inform you that|express my interest in)\s*/i,
  /^here('s| is) the thing[:.]\s*/i,
  /^let me be clear[:.]\s*/i,
  /^the truth is[:.]\s*/i,
  /^at the end of the day[,.]\s*/i,
  /^it('s| is) worth noting that\s*/i,
  /^in today's (fast-paced|dynamic|ever-changing) world[,.]\s*/i,
];

/**
 * Prompt injection snippet enforcing strict anti-slop guidelines in LLM calls
 */
export const NO_SLOP_PROMPT_DIRECTIVE = `
ANTI-SLOP CONSTRAINTS (STRICT):
1. Banned words: Do NOT use any of these words under any circumstances:
   - delve, foster, leverage, utilize, facilitate, empower, streamline, robust, cutting-edge
   - paradigm shift, game changer, tapestry, realm, beacon, multifaceted, meticulous, intricate
   - paramount, transformative, elevate, embark, supercharge, harness, ever-evolving.
2. Cut throat-clearing: NEVER start with greetings like "I hope this finds you well", "I hope you are having a great week", or conversational filler ("Here's the thing", "Let me be clear"). State the concrete purpose in the very first sentence.
3. Active voice and concrete verbs: Replace weak phrases ("has the ability to", "was responsible for") with direct action verbs ("built", "shipped", "reduced", "led").
4. No binary contrasts: Avoid "This is not X, it's Y". State the conclusion directly.
5. No fake-insight drama: Avoid "What most people miss", "The key takeaway", or colon reveals.
6. Specifics over abstractions: Use actual numbers, tools, durations, and observable outcomes.
`;

/**
 * Sanitizes generated text to strip throat-clearing openers and replace banned AI slop words.
 */
export function sanitizeAntiSlop(text: string): string {
  if (!text) return "";

  let cleaned = text.trim();

  // 1. Remove throat-clearing openers
  for (const pattern of THROAT_CLEARING_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }

  // Capitalize the first letter if stripped
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // 2. Replace banned words with natural human alternatives
  const wordReplacements: Record<string, string> = {
    "streamlined": "accelerated",
    "streamline": "speed up",
    "streamlining": "speeding up",
    "leveraged": "used",
    "leverage": "use",
    "leveraging": "using",
    "utilized": "used",
    "utilize": "use",
    "utilizing": "using",
    "fostered": "built",
    "foster": "build",
    "fostering": "building",
    "empowered": "enabled",
    "empower": "enable",
    "empowering": "enabling",
    "robust": "resilient",
    "cutting-edge": "modern",
    "transformative": "critical",
    "supercharged": "amplified",
    "supercharge": "accelerate",
    "delve into": "examine",
    "delve": "investigate",
    "tapestry of": "range of",
    "realm of": "field of",
    "beacon of": "standard for",
    "paramount": "vital",
    "game changer": "major milestone",
    "game-changer": "major milestone",
    "paradigm shift": "shift",
    "multifaceted": "broad",
    "meticulous": "rigorous",
    "intricate": "complex",
    "harness": "apply",
    "harnessed": "applied",
    "harnessing": "applying",
    "elevate": "raise",
    "elevated": "raised",
  };

  for (const [slop, natural] of Object.entries(wordReplacements)) {
    const regex = new RegExp(`\\b${slop}\\b`, "gi");
    cleaned = cleaned.replace(regex, natural);
  }

  return cleaned;
}
