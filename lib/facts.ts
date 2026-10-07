/**
 * Pure fact algebra — no I/O, no `server-only`, no SDK. Everything here is
 * unit-testable without a network or a relayer, which is why the reconciliation
 * rules live in this file rather than next to the client.
 */

import { createHash } from "node:crypto";

export type FactKind =
  /**
   * Candidate work experience, role title, company, accomplishments, metrics.
   * e.g. "Senior Frontend Engineer at Acme Corp: reduced bundle size by 35% and built microfrontends."
   */
  | "experience"
  /**
   * Academic credentials, degrees, universities, certifications, honors.
   * e.g. "B.S. Computer Science from Stanford University, First Class Honours."
   */
  | "education"
  /**
   * Verified technical, architectural, or domain skills with demonstrated proficiency.
   * e.g. "Proficient in Next.js, TypeScript, Sui Move, and Walrus storage integration."
   */
  | "skill"
  /**
   * Desired career direction, target role titles, seniority, target compensation/markets.
   * e.g. "Targeting Staff AI Software Engineer or Web3 Protocols Lead."
   */
  | "target_role"
  /**
   * Tailored resume bullet points, cover letters, and custom project highlights.
   * e.g. "Tailored CV v2: emphasized distributed systems experience for Stripe Staff Backend role."
   */
  | "tailored_cv"
  /**
   * Stored job application records, company name, match score, routing outcome.
   * e.g. "Applied to Vercel for Senior Platform Engineer: 9.4/10 fit score via direct ATS."
   */
  | "application"
  /**
   * STAR+R interview coach assessments, simulated responses, interviewer critique, gaps to address.
   * e.g. "Demonstrated strong Situation & Task in distributed rollback question; needs stronger Results metric."
   */
  | "interview_feedback"
  /**
   * Candidate standing career preferences: remote/hybrid, tech stack, company size, communication style.
   * e.g. "Prefers remote-first engineering teams with asynchronous communication culture."
   */
  | "preference"
  /**
   * Candidate personal identity: verified full name, contact, phone, location.
   * e.g. "Candidate Name: John Doe, Location: London, UK"
   */
  | "candidate_identity"
  /**
   * Explicit clearance or absence of a constraint or restriction.
   * e.g. "No relocation restrictions", "open to any global time zone".
   */
  | "clearance"
  /** Legacy kinds retained for backward compatibility */
  | "misconception"
  | "mastery"
  | "weakness"
  | "goal"
  | "error_pattern";

/**
 * Not a kind you can ask for. A tombstone is written by `forgetFact` to retract
 * an earlier claim, because the SDK has no delete — see RETRACTION below.
 */
export const TOMBSTONE = "tombstone";

export type RecalledFact = { text: string; distance: number; blobId: string };

/** Below this, two facts are talking about the same thing. */
export const DUPLICATE_DISTANCE = 0.3;

/**
 * At or above this distance a recalled memory is noise and must not enter the
 * prompt. The SDK drops anything with `distance >= maxDistance` server-side;
 * we re-filter with `<` on the way back because mock mode does not.
 *
 * 0.6. MemWal's own guidance is `maxDistance < 0.7`, and the two failure modes
 * are not symmetric: a filler line that slips through is cleaned up downstream
 * by resolveConflicts and claimsOfKind, whereas a misconception phrased
 * differently from the question and left below the floor is simply gone, and
 * the tutor teaches straight into it. Tunable at demo time because embedding
 * distances are not portable across relayer versions.
 */
export const RELEVANCE_DISTANCE = clampDistance(
  process.env.EA_RELEVANCE_DISTANCE,
  0.6,
);

function clampDistance(raw: string | undefined, fallback: number) {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n <= 2 ? n : fallback;
}

/** Phrases meaning "do not persist anything from this turn". */
const OFF_THE_RECORD = [
  "don't save", "dont save", "do not save",
  "off the record",
  "don't remember", "dont remember", "do not remember",
  "forget i said",
];

export function isOffTheRecord(userText: string) {
  const haystack = userText.toLowerCase();
  return OFF_THE_RECORD.some((phrase) => haystack.includes(phrase));
}

/**
 * Sensitive patterns that must never be recorded into persistent Walrus memory.
 * Directly fulfills QA Checklist Section 1.10, 2.9, 11.2, and Test J.
 */
const SENSITIVE_PATTERNS = [
  /\b(?:password|passwd|pwd)\b/i,
  /\b(?:api[_-]?key|secret[_-]?key|access[_-]?token|bearer\s+[a-zA-Z0-9_\-\.]+)\b/i,
  /\b(?:sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{20,}|xoxb-[a-zA-Z0-9_\-]+)\b/i,
  /\b(?:ssn|social\s*security\s*number)\b/i,
  /\b(?:credit\s*card|cvv|cvc|card\s*number)\b/i,
  /\b(?:\d{3}-\d{2}-\d{4})\b/,
  /\b(?:\d{4}[-\s]?){3}\d{4}\b/,
];

export function isSensitiveData(userText: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(userText));
}

const today = () => new Date().toISOString().slice(0, 10);

/** `2026-08-27 | misconception | thinks force = mass x velocity` */
export function formatFact(kind: FactKind, text: string, supersedes?: string) {
  const base = `${today()} | ${kind} | ${text.trim()}`;
  return supersedes ? `${base} - SUPERSEDES: ${supersedes}` : base;
}

/**
 * The query to use when looking for an existing copy of a claim.
 *
 * Search with the shape you store, or you are not comparing like with like.
 * Recall is an embedding distance over the WHOLE string, and everything in the
 * namespace carries a `date | kind |` prefix — so querying with the bare claim
 * against the stored, prefixed line lands well outside DUPLICATE_DISTANCE and
 * the duplicate is missed.
 *
 * The offline mock hides this completely: it scores by token overlap, where the
 * prefix is three cheap tokens and the two strings look nearly identical.
 */
export function factProbe(kind: FactKind, text: string) {
  return `${today()} | ${kind} | ${text.trim()}`;
}

/**
 * RETRACTION. `2026-08-27 | tombstone | thinks force = mass x velocity - RETRACTED`
 *
 * There is no delete in the SDK — `remember()` appends and nothing removes.
 * So "forget that" is written down rather than pretended: a tombstone is a
 * record that outranks the claim it names, and resolveConflicts drops that
 * claim from everything the tutor can read.
 *
 * What this does NOT do is erase. The original blob stays on Walrus, encrypted
 * under the owner's keys, until its storage period expires. Every piece of copy
 * that mentions forgetting has to say that.
 *
 * The claim leads and the boilerplate trails, deliberately: with `RETRACTS:`
 * first the whole line embeds closer to the word "retracts" than to the claim,
 * and the tombstone falls outside the relevance floor while the claim it kills
 * stays inside it.
 */
export function formatTombstone(factText: string) {
  return `${today()} | ${TOMBSTONE} | ${factBody(factText)} - RETRACTED`;
}

/** The claim a tombstone names, or "" if this line is not a tombstone. */
export function retractionTarget(stored: string) {
  if (factKind(stored) !== TOMBSTONE) return "";
  return factBody(stored)
    .replace(/^retracts:\s*/, "")
    .replace(/\s*-\s*retracted$/, "")
    .trim();
}

/**
 * A write key that is stable across retries of the SAME claim and different
 * for a different one.
 *
 * `remember()` is append-only, and the SDK keeps a pending key alive when a
 * transport times out after the server already accepted the job. Without this,
 * a timeout on a slow connection writes the same misconception twice and pays
 * for both. The date is in the key so a genuine re-assertion tomorrow still
 * lands as its own entry.
 */
export function idempotencyKeyFor(namespace: string, kind: string, text: string) {
  return createHash("sha256")
    .update(`${namespace} ${kind} ${text.trim().toLowerCase()} ${today()}`)
    .digest("hex");
}

/** Strip the `date | kind |` prefix so we compare claims, not timestamps. */
export function factBody(stored: string) {
  const parts = stored.split("|");
  const body = parts.length >= 3 ? parts.slice(2).join("|") : stored;
  return body.split(" - SUPERSEDES:")[0].trim().toLowerCase();
}

export function factKind(stored: string): string {
  return stored.split("|")[1]?.trim() ?? "";
}

export function factDate(stored: string) {
  return stored.split("|")[0]?.trim() ?? "";
}

export function sameFact(stored: string, incoming: string) {
  return factBody(stored) === incoming.trim().toLowerCase();
}

/** Pull the raw claims of one kind out of a set of stored lines. */
export function claimsOfKind(facts: { text: string }[], kind: FactKind): string[] {
  return facts.filter((f) => factKind(f.text) === kind).map((f) => factBody(f.text)).filter(Boolean);
}

/**
 * When two recalled facts disagree, the newer date wins. The loser is returned
 * too, so the UI can show it rather than silently dropping it — a student who
 * has just fixed a misconception is entitled to see that the old version is
 * still on the record and no longer being acted on.
 *
 * A tombstone outranks every claim it names, regardless of distance. Retracted
 * facts come back in their own bucket for the same reason.
 */
export function resolveConflicts(facts: RecalledFact[]) {
  /** newest tombstone date per retracted claim */
  const retractions = new Map<string, string>();
  for (const fact of facts) {
    const target = retractionTarget(fact.text);
    if (!target) continue;
    const date = factDate(fact.text);
    if (date >= (retractions.get(target) ?? "")) retractions.set(target, date);
  }

  /** Superseding entries with order tracking */
  const supersedingEntries: Array<{ target: string; supBody: string; date: string; order: number }> = [];
  facts.forEach((fact, order) => {
    if (fact.text.includes(" - SUPERSEDES:")) {
      const parts = fact.text.split(" - SUPERSEDES:");
      const target = parts[1]?.trim().toLowerCase();
      const supBody = factBody(fact.text);
      if (target) {
        supersedingEntries.push({ target, supBody, date: factDate(fact.text), order });
      }
    }
  });

  const byBody = new Map<string, Array<{ fact: RecalledFact; order: number }>>();
  facts.forEach((fact, order) => {
    if (factKind(fact.text) === TOMBSTONE) return; // never readable as a claim
    const key = factBody(fact.text);
    byBody.set(key, [...(byBody.get(key) ?? []), { fact, order }]);
  });

  const active: RecalledFact[] = [];
  const superseded: RecalledFact[] = [];
  const retracted: RecalledFact[] = [];
  for (const [body, group] of byBody) {
    const sorted = [...group].sort((a, b) => {
      const dCmp = factDate(b.fact.text).localeCompare(factDate(a.fact.text));
      return dCmp !== 0 ? dCmp : b.order - a.order;
    });

    const newestEntry = sorted[0];

    // A same-day retraction wins: you only retract a claim that already exists.
    const killed = retractions.get(body);
    if (killed !== undefined && killed >= factDate(newestEntry.fact.text)) {
      retracted.push(...sorted.map((g) => g.fact));
      continue;
    }

    // Check if superseded by an explicit SUPERSEDES directive from a newer/later claim
    let isSuperseded = false;
    for (const sup of supersedingEntries) {
      if (body === sup.supBody) continue; // A claim cannot supersede itself

      const bodyLower = body.toLowerCase();
      const matchesTarget =
        bodyLower === sup.target ||
        bodyLower.startsWith(sup.target) ||
        sup.target.startsWith(bodyLower);

      if (matchesTarget) {
        const isNewer =
          sup.date > factDate(newestEntry.fact.text) ||
          (sup.date === factDate(newestEntry.fact.text) && sup.order > newestEntry.order);

        if (isNewer) {
          isSuperseded = true;
          break;
        }
      }
    }
    if (isSuperseded) {
      superseded.push(...sorted.map((g) => g.fact));
      continue;
    }

    active.push(newestEntry.fact);
    superseded.push(...sorted.slice(1).map((g) => g.fact));
  }
  return { active, superseded, retracted };
}

/**
 * Merge recall results, keeping one entry per stored line at its best (lowest)
 * distance.
 *
 * Needed because a turn reads a namespace with more than one query: a stable
 * query that must always return the exam target and the misconceptions, and
 * the student's own words for whatever is topical. The two overlap, and the
 * same fact arriving twice would be listed to the model twice.
 */
export function unionFacts(...groups: RecalledFact[][]): RecalledFact[] {
  const best = new Map<string, RecalledFact>();
  for (const fact of groups.flat()) {
    const seen = best.get(fact.text);
    if (!seen || fact.distance < seen.distance) best.set(fact.text, fact);
  }
  return [...best.values()].sort((a, b) => a.distance - b.distance);
}
