/**
 * The contract, tested without a network.
 *
 * Everything asserted here is a rule the project claims in its own prompt and
 * README. They live in pure modules (./facts, ./pedagogy, ./model-select,
 * ./coaches) precisely so they can be pinned down without a relayer, a cookie
 * jar or a vendor SDK.
 *
 *   node --test --experimental-strip-types lib/contract.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  formatFact, formatTombstone, factBody, factKind, factDate, sameFact,
  isOffTheRecord, resolveConflicts, unionFacts, idempotencyKeyFor,
  retractionTarget, claimsOfKind, TOMBSTONE, type RecalledFact,
} from "./facts.ts";
import {
  screenQuestion, buildTeachingConstraintsText, targetKnown,
  normalizeMisconceptions, normalizeErrorTypes, examTargetOf,
} from "./pedagogy.ts";
import { keyFor, resolveProvider, modelId, resolveModels, type KeyBag } from "./model_select.ts";
import { NO_KEY_CODE } from "./providers.ts";
import { rankCoaches } from "./coaches.ts";

const today = new Date().toISOString().slice(0, 10);
const fact = (text: string, distance = 0.1): RecalledFact => ({ text, distance, blobId: `b-${text}` });

// ── the stored shape ─────────────────────────────────────────────────────────

test("a stored fact carries its date and kind", () => {
  const stored = formatFact("misconception", "thinks force = mass x velocity");
  assert.equal(factDate(stored), today);
  assert.equal(factKind(stored), "misconception");
  assert.equal(factBody(stored), "thinks force = mass x velocity");
});

test("a superseding write names what it replaces, and the claim still compares equal", () => {
  const old = formatFact("weakness", "titration calculations");
  const next = formatFact("mastery", "titration calculations", old);
  assert.match(next, / - SUPERSEDES: /);
  // The SUPERSEDES tail must not leak into the claim, or nothing dedupes.
  assert.equal(factBody(next), "titration calculations");
  assert.ok(sameFact(next, "Titration Calculations"));
});

test("the dedupe key is stable for the same claim and different for another", () => {
  const a = idempotencyKeyFor("examace:profile:0x1", "misconception", "thinks force = mass x velocity");
  const b = idempotencyKeyFor("examace:profile:0x1", "misconception", "  Thinks Force = Mass x Velocity  ");
  const c = idempotencyKeyFor("examace:profile:0x1", "misconception", "thinks weight is in kilograms");
  const d = idempotencyKeyFor("examace:profile:0x2", "misconception", "thinks force = mass x velocity");
  assert.equal(a, b, "same claim, any casing or padding, must collapse onto one job");
  assert.notEqual(a, c);
  assert.notEqual(a, d, "another student's namespace is a different write");
});

// ── the write gate's one hard rule ───────────────────────────────────────────

test("off-the-record covers the whole turn, however it is phrased", () => {
  for (const turn of [
    "I mix up mass and weight but don't save that",
    "off the record, I failed the mock",
    "do not remember this",
    "forget I said anything about physics",
  ]) {
    assert.ok(isOffTheRecord(turn), turn);
  }
  assert.equal(isOffTheRecord("I'm writing JAMB in April"), false);
});

// ── reconciliation ───────────────────────────────────────────────────────────

test("the newer date wins, and the loser is kept rather than dropped", () => {
  const older = `2026-01-01 | weakness | projectile motion`;
  const newer = `2026-06-01 | weakness | projectile motion`;
  const { active, superseded } = resolveConflicts([fact(older), fact(newer)]);
  assert.deepEqual(active.map((f) => f.text), [newer]);
  assert.deepEqual(superseded.map((f) => f.text), [older]);
});

test("a tombstone outranks the claim it names, at any distance", () => {
  const claim = `2026-01-01 | misconception | thinks force = mass x velocity`;
  // Deliberately far away: a retraction must never be lost to a relevance floor.
  const stone = fact(formatTombstone(claim), 0.9);
  const { active, retracted } = resolveConflicts([fact(claim, 0.05), stone]);
  assert.equal(active.length, 0, "a retracted claim must not survive into anything readable");
  assert.deepEqual(retracted.map((f) => f.text), [claim]);
});

test("a tombstone is never itself readable as a claim", () => {
  const claim = `2026-01-01 | weakness | organic chemistry`;
  const stone = formatTombstone(claim);
  assert.equal(factKind(stone), TOMBSTONE);
  assert.equal(retractionTarget(stone), "organic chemistry");
  const { active } = resolveConflicts([fact(stone)]);
  assert.equal(active.length, 0);
});

test("the legacy RETRACTS: tombstone shape is still honoured", () => {
  const claim = `2026-01-01 | weakness | organic chemistry`;
  const legacy = `2026-02-01 | ${TOMBSTONE} | RETRACTS: organic chemistry`;
  const { active, retracted } = resolveConflicts([fact(claim), fact(legacy)]);
  assert.equal(active.length, 0);
  assert.equal(retracted.length, 1);
});

test("a same-day retraction wins - you only retract something already written", () => {
  const claim = `${today} | misconception | thinks current is used up`;
  const { active, retracted } = resolveConflicts([fact(claim), fact(formatTombstone(claim))]);
  assert.equal(active.length, 0);
  assert.equal(retracted.length, 1);
});

test("re-asserting a retracted claim later brings it back", () => {
  const old = `2026-01-01 | weakness | trigonometry`;
  const stone = `2026-02-01 | ${TOMBSTONE} | trigonometry - RETRACTED`;
  const again = `2026-03-01 | weakness | trigonometry`;
  const { active } = resolveConflicts([fact(old), fact(stone), fact(again)]);
  assert.deepEqual(active.map((f) => f.text), [again]);
});

test("merging two recalls keeps one copy of a fact, at its best distance", () => {
  const line = `${today} | goal | JAMB - April 2026`;
  const merged = unionFacts([fact(line, 0.42)], [fact(line, 0.19)]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].distance, 0.19);
});

test("claimsOfKind reads only the kind asked for", () => {
  const facts = [
    fact(`${today} | misconception | thinks force = mass x velocity`),
    fact(`${today} | goal | JAMB - April 2026`),
    fact(`${today} | mastery | newton laws`),
  ];
  assert.deepEqual(claimsOfKind(facts, "goal"), ["jamb - april 2026"]);
  assert.deepEqual(claimsOfKind(facts, "misconception"), ["thinks force = mass x velocity"]);
});

// ── the teaching screen ──────────────────────────────────────────────────────

test("wording that restates a stored misconception is refused", () => {
  const verdict = screenQuestion(
    "Force is mass times velocity, so the car carries 20000 N.",
    { misconceptions: ["thinks force = mass x velocity"] },
  );
  assert.equal(verdict.safe, false);
  assert.deepEqual(verdict.reinforced, ["force_velocity"]);
});

test("naming the wrong model in order to break it is allowed", () => {
  const verdict = screenQuestion(
    "You had force is mass times velocity. It is mass times acceleration - so what is the acceleration here?",
    { misconceptions: ["thinks force = mass x velocity"] },
  );
  assert.equal(verdict.safe, true, "a correction must not be screened out as the error it corrects");
});

test("the same wording is fine for a student who does not hold that model", () => {
  assert.equal(screenQuestion("Force is mass times velocity, so...", {}).safe, true);
});

test("handing over the answer is refused whatever the record says", () => {
  const verdict = screenQuestion("The answer is B, 2000 N.", {});
  assert.equal(verdict.safe, false);
  assert.ok(verdict.answerReveals.length > 0);
});

test("content outside their exam scope is refused", () => {
  const verdict = screenQuestion(
    "Set up the Lagrangian for the system and vary the action.",
    { goal: ["JAMB - April 2026"] },
  );
  assert.equal(verdict.safe, false);
  assert.ok(verdict.offSyllabus.includes("lagrangian"));
});

test("re-drilling a mastered topic is a warning, not a refusal", () => {
  const verdict = screenQuestion("Let's start again from Newton's first law.", { mastery: ["newton laws"] });
  assert.equal(verdict.safe, true, "wasting a session is not the same as damaging one");
  assert.ok(verdict.redundant.length > 0);
});

// ── the empty-record gate ────────────────────────────────────────────────────

test("an empty record is a question to ask, never a default to apply", () => {
  assert.equal(targetKnown({}), false);
  const text = buildTeachingConstraintsText({});
  assert.match(text, /DO NOT KNOW/);
  assert.match(text, /Do not produce a study plan/);
});

test("an explicit clearance stops the tutor asking again", () => {
  assert.equal(targetKnown({ cleared: true }), true);
  const text = buildTeachingConstraintsText({ cleared: true });
  assert.doesNotMatch(text, /DO NOT KNOW/);
});

test("everything the student stated reaches the prompt verbatim, table or no table", () => {
  const text = buildTeachingConstraintsText({
    misconceptions: ["thinks quadratics always have two real roots"],
    weaknesses: ["bearings"],
    goal: ["WAEC - May 2026"],
  });
  assert.match(text, /thinks quadratics always have two real roots/);
  assert.match(text, /bearings/);
  assert.match(text, /WAEC - May 2026/);
  // And the gap is named rather than papered over.
  assert.match(text, /No automatic check exists for/);
});

test("a preference never outranks a correction", () => {
  const text = buildTeachingConstraintsText({
    goal: ["JAMB - April 2026"],
    preferences: ["keep it short, no long theory"],
  });
  assert.match(text, /keep it short, no long theory/);
  assert.match(text, /never justifies skipping a correction/);
});

test("stored claims are normalized out of the student's own phrasing", () => {
  assert.deepEqual(
    normalizeMisconceptions(["thinks force = mass x velocity, said it twice in the mock"]),
    ["force_velocity"],
  );
  assert.deepEqual(normalizeErrorTypes(["unit confusion in kinematics"]), ["unit_confusion"]);
  assert.equal(examTargetOf(["JAMB - April 2026"]), "JAMB");
  assert.equal(examTargetOf(["post-utme at UNILAG"]), "POST_UTME");
  assert.equal(examTargetOf([]), null);
});

// ── ranking from memory ──────────────────────────────────────────────────────

test("coaches are ranked by the record, and say why", () => {
  const ranked = rankCoaches(["projectile motion"], ["unit confusion"]);
  assert.equal(ranked[0].slug, "mr-obinna");
  assert.match(ranked[0].reason, /projectile/);
  // Nothing stored means nothing ranked — the list must not invent relevance.
  assert.ok(rankCoaches([], []).every((c) => c.score === 0));
});

// ── model selection ──────────────────────────────────────────────────────────

const bag = (over: Partial<KeyBag> = {}): KeyBag => ({ keys: {}, models: {}, ...over });

test("the student's own key beats the deployment's", () => {
  const env = { ANTHROPIC_API_KEY: "server-key" };
  assert.equal(keyFor("anthropic", bag({ keys: { anthropic: "my-key" } }), env), "my-key");
  assert.equal(keyFor("anthropic", bag(), env), "server-key");
});

test("the conversation and the write gate resolve to the SAME model", () => {
  const env = { OPENAI_API_KEY: "k" };
  const resolved = resolveModels(bag(), env);
  assert.equal(resolved.provider, "openai");
  assert.equal(
    resolved.chat, resolved.extract,
    "a gate running on a model nobody chose fails silently on every turn",
  );
});

test("EA_EXTRACT_MODEL is the only thing that splits them", () => {
  const env = { OPENAI_API_KEY: "k", EA_EXTRACT_MODEL: "gpt-4o-mini" };
  const resolved = resolveModels(bag(), env);
  assert.notEqual(resolved.chat, resolved.extract);
  assert.equal(resolved.extract, "gpt-4o-mini");
});

test("a pinned provider with no key fails loudly rather than falling through", () => {
  assert.throws(
    () => resolveProvider(bag(), { EA_MODEL_PROVIDER: "groq", OPENAI_API_KEY: "k" }),
    /no key for it is set/,
  );
  assert.throws(() => resolveProvider(bag(), { EA_MODEL_PROVIDER: "nonsense" }), /is not one of/);
});

test("no key at all returns a code the UI can branch on, not just a sentence", () => {
  assert.throws(() => resolveProvider(bag(), {}), new RegExp(NO_KEY_CODE));
});

test("the chosen model wins over the provider default", () => {
  const chosen = bag({ keys: { google: "k" }, models: { google: "gemini-2.5-flash" }, active: "google" });
  assert.equal(modelId("google", "chat", chosen, {}), "gemini-2.5-flash");
  assert.equal(modelId("google", "extract", chosen, {}), "gemini-2.5-flash");
});
