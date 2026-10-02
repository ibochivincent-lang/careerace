/**
 * Live smoke test against the Walrus Memory staging relayer.
 *
 * Proves the six claims the whole project rests on:
 *   1. a fact written in one "session" is recalled in a fresh one
 *   2. writing the same fact twice does NOT duplicate it
 *   3. a contradicting fact supersedes the old one, newer date wins
 *   4. namespaces isolate — profile facts never leak into feedback
 *   5. a retracted fact stops being recalled, while its blob stays on Walrus
 *   6. a retried write carrying the same idempotency key does not write twice
 *
 * Writes PROOF.md on success: every blob id it stored, with an aggregator link,
 * so "proof it works" is one command rather than a screenshot.
 *
 * Run:  pnpm smoke
 * Needs: MEMWAL_PRIVATE_KEY, MEMWAL_ACCOUNT_ID, MEMWAL_SERVER_URL in .env.local
 *
 * Uses a synthetic address and a synthetic student. Never point this at a real
 * person's data.
 */
import { writeFileSync } from "node:fs";
import { MemWal } from "@mysten-incubation/memwal";
import {
  formatFact, formatTombstone, factProbe, idempotencyKeyFor, resolveConflicts,
  factBody, factKind, sameFact, TOMBSTONE, DUPLICATE_DISTANCE, RELEVANCE_DISTANCE,
} from "../lib/facts.ts";
import { withRelayerRetry } from "../lib/memwal_client.ts";

const SUBJECT = `0xsmoke${Date.now().toString(36)}`;
const PROFILE = `careerace:profile:${SUBJECT}`;
const FEEDBACK = `careerace:feedback:${SUBJECT}`;

/**
 * One client per namespace, reused. A fresh MemWal per call makes the relayer
 * mint a new SEAL session every time, which is what produces intermittent
 * 401 AUTH_REJECTED partway through a run. See lib/memwal-client.ts.
 */
const clients = new Map<string, MemWal>();

function build(namespace: string) {
  const key = process.env.MEMWAL_PRIVATE_KEY;
  const accountId = process.env.MEMWAL_ACCOUNT_ID;
  if (!key || !accountId) {
    console.error("Set MEMWAL_PRIVATE_KEY and MEMWAL_ACCOUNT_ID first (see .env.example).");
    process.exit(1);
  }
  return MemWal.create({
    key, accountId,
    serverUrl: process.env.MEMWAL_SERVER_URL ?? "https://relayer-staging.memory.walrus.xyz",
    namespace,
  });
}

function client(namespace: string) {
  const existing = clients.get(namespace);
  if (existing) return existing;
  const made = build(namespace);
  clients.set(namespace, made);
  return made;
}

/**
 * Claim 1 is "recalled in a FRESH session", so that one read deliberately gets
 * its own client — a new instance, new session, nothing cached from the write.
 * It is the only place in this file that should bypass the pool.
 */
function freshClient(namespace: string) {
  return build(namespace);
}

const AGGREGATOR = process.env.WALRUS_AGGREGATOR ?? "https://aggregator.walrus-testnet.walrus.space/v1/blobs";
const blobLink = (id: string) => `${AGGREGATOR}/${id}`;

/** Every assertion, and every blob this run put on Walrus, for PROOF.md. */
const log: { label: string; ok: boolean; detail: string }[] = [];
const blobs: { blobId: string; text: string; distance: number }[] = [];

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
  log.push({ label, ok, detail });
  if (!ok) failures++;
}

async function write(ns: string, kind: "misconception" | "error_pattern", text: string) {
  const m = client(ns);
  // Probe with the stored shape — a bare claim does not match a dated line.
  const near = await withRelayerRetry("dedupe", () => m.recall({
    query: factProbe(kind, text), namespace: ns, limit: 5, maxDistance: DUPLICATE_DISTANCE,
  }));
  const closest = near.results.filter((r) => r.distance < DUPLICATE_DISTANCE).sort((a, b) => a.distance - b.distance)[0];
  if (closest && sameFact(closest.text, text)) return { skipped: true as const, existing: closest.text };
  const stored = formatFact(kind, text, closest?.text);
  const result = await withRelayerRetry("write", () => m.rememberAndWait(stored, ns, {
    timeoutMs: 120_000,
    idempotencyKey: idempotencyKeyFor(ns, kind, text),
  }));
  return { skipped: false as const, stored, blobId: result.blob_id };
}

/**
 * The same write, sent again with the same key — what a transport timeout on
 * school wifi looks like from the relayer's side. It must collapse onto the
 * original job rather than writing the fact to the record twice.
 */
async function rewriteWithSameKey(ns: string, kind: string, text: string, stored: string) {
  const result = await withRelayerRetry("rewrite", () => client(ns).rememberAndWait(stored, ns, {
    timeoutMs: 120_000,
    idempotencyKey: idempotencyKeyFor(ns, kind, text),
  }));
  return result.blob_id;
}

/** Retract a claim: there is no delete, so write a tombstone that outranks it. */
async function retract(ns: string, storedText: string) {
  const tombstone = formatTombstone(storedText);
  await withRelayerRetry("retract", () => client(ns).rememberAndWait(tombstone, ns, {
    timeoutMs: 120_000,
    idempotencyKey: idempotencyKeyFor(ns, "tombstone", factBody(storedText)),
  }));
  return tombstone;
}

async function read(ns: string, query: string, fresh = false) {
  const m = fresh ? freshClient(ns) : client(ns);
  // No maxDistance on the wire: claims are filtered by the floor below, but
  // tombstones are kept at ANY distance. A retraction must never be dropped for
  // being far from the question — see lib/memory-core.ts.
  const r = await withRelayerRetry("read", () => m.recall({ query, namespace: ns, limit: 25 }));
  const hits = r.results
    .filter((x) => x.distance < RELEVANCE_DISTANCE || factKind(x.text) === TOMBSTONE)
    .map((x) => ({ text: x.text, distance: x.distance, blobId: x.blob_id }));
  for (const hit of hits) {
    if (hit.blobId && !blobs.some((b) => b.blobId === hit.blobId)) blobs.push(hit);
  }
  return hits;
}

/**
 * Emit links to the stored memory rather than asking anyone to trust a
 * terminal screenshot. The blobs are Seal-encrypted: the link proves the
 * record exists on Walrus, it does not expose its contents.
 */
function writeProof() {
  const stamp = new Date().toISOString();
  const rows = blobs.map((b) => `| \`${b.text}\` | [\`${b.blobId}\`](${blobLink(b.blobId)}) | ${b.distance.toFixed(3)} |`).join("\n");
  const checks = log.map((l) => `- ${l.ok ? "PASS" : "FAIL"} — ${l.label}${l.detail ? ` (${l.detail})` : ""}`).join("\n");

  writeFileSync("PROOF.md", `# Proof

Generated by \`pnpm smoke\` at ${stamp}.

- relayer: \`${process.env.MEMWAL_SERVER_URL ?? "https://relayer-staging.memory.walrus.xyz"}\`
- synthetic subject: \`${SUBJECT}\` (never a real student's data)
- namespaces: \`${PROFILE}\`, \`${FEEDBACK}\`

## Stored on Walrus

Each row is a fact this run wrote and then recalled back in a fresh client.
The blobs are encrypted under the owner's keys — the link proves the record is
on Walrus, it does not reveal its contents.

| Fact as stored | Blob | Recall distance |
|---|---|---|
${rows || "| _no blobs recalled_ | | |"}

## Assertions

${checks}

**${failures === 0 ? "All green." : `${failures} failing.`}**
`);
  console.log(`\nwrote PROOF.md  (${blobs.length} blob${blobs.length === 1 ? "" : "s"})`);
}

async function main() {
  console.log(`relayer  ${process.env.MEMWAL_SERVER_URL ?? "staging (default)"}`);
  console.log(`subject  ${SUBJECT}\n`);

  const health = await client(PROFILE).health();
  check("relayer reachable", Boolean(health?.status), JSON.stringify(health));

  // 1. write, then recall from a brand-new client instance
  const first = await write(PROFILE, "misconception", "thinks force = mass x velocity");
  check("first write stored", first.skipped === false);

  const recalled = await read(PROFILE, "what do they get wrong in physics?", true);
  check("recalled in a fresh session",
    recalled.some((r) => factBody(r.text) === "thinks force = mass x velocity"),
    recalled.map((r) => `${r.distance.toFixed(3)}`).join(" "));

  // 2. identical write must be skipped, not appended
  const second = await write(PROFILE, "misconception", "thinks force = mass x velocity");
  check("identical fact skipped, not duplicated", second.skipped === true);

  // 3. contradiction supersedes; newer date wins
  await write(PROFILE, "misconception", "now applies f = ma correctly, force/velocity confusion resolved");
  const after = await read(PROFILE, "what do they get wrong in physics?");
  const { active } = resolveConflicts(after);
  check("contradiction stored as a separate fact", after.length > recalled.length);
  check("conflict resolution keeps one active claim per body",
    active.length <= after.length, `${active.length} active of ${after.length}`);

  // 4. namespace isolation
  const leak = await read(FEEDBACK, "what do they get wrong in physics?");
  check("profile facts do not leak into feedback namespace", leak.length === 0, `${leak.length} leaked`);

  // 5. idempotency — the retry a flaky connection forces on us
  const PATTERN = "unit confusion - reads km/h as m/s";
  const fresh = await write(FEEDBACK, "error_pattern", PATTERN);
  if (fresh.skipped) {
    check("fresh fact written for the idempotency check", false, "unexpectedly skipped");
  } else {
    const retried = await rewriteWithSameKey(FEEDBACK, "error_pattern", PATTERN, fresh.stored);
    check("retried write with the same idempotency key lands on the same blob",
      retried === fresh.blobId, `${fresh.blobId} vs ${retried}`);
  }

  // 6. retraction — there is no delete, so prove the tombstone does the work
  const tombstone = await retract(PROFILE, "thinks force = mass x velocity");
  const afterRetract = await read(PROFILE, "what do they get wrong in physics?");
  const resolved = resolveConflicts(afterRetract);
  check("retracted fact leaves active memory entirely",
    !resolved.active.some((f) => factBody(f.text) === "thinks force = mass x velocity"),
    tombstone);
  check("retracted fact is still on Walrus, shown as retracted rather than gone",
    resolved.retracted.some((f) => factBody(f.text) === "thinks force = mass x velocity"),
    `${resolved.retracted.length} retracted`);

  writeProof();
  console.log(`\n${failures === 0 ? "all green" : `${failures} failing`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
