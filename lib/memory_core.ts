import { createMemWal as getMemWal, memwalMode, withRelayerRetry } from "./memwal_client.ts";
import { profileNs, feedbackNs } from "./namespaces.ts";
import {
  DUPLICATE_DISTANCE,
  RELEVANCE_DISTANCE,
  TOMBSTONE,
  factBody,
  factKind,
  factProbe,
  formatFact,
  formatTombstone,
  idempotencyKeyFor,
  isOffTheRecord,
  sameFact,
  type FactKind,
  type RecalledFact,
} from "./facts.ts";

/**
 * THE MEMORY CONTRACT — the I/O half. The pure rules live in ./facts.
 *
 * Three SDK behaviours drive this whole design:
 *
 *  1. `remember()` is APPEND-ONLY. It is not an upsert. Writing the same fact
 *     twice produces two entries and both surface on recall. Recall ranks by
 *     vector distance, not recency — so a stale "thinks force = mass x
 *     velocity" can outrank a newer "now applies F = ma correctly". Every
 *     write reconciles.
 *
 *  2. `recall()` has NO default relevance threshold. In a small namespace it
 *     returns the nearest entries even when unrelated. For a tutor, filler
 *     means teaching against the wrong model of the student — so maxDistance
 *     is mandatory on every read.
 *
 *  3. There is NO delete, and no `list()`. Forgetting is a tombstone write
 *     (see ./facts) and listing is a pair of deliberately broad recalls.
 */

/**
 * How long to wait for a write to finish indexing.
 *
 * 120s, matching the SDK's own bulk-polling default. A write is heavy: embed,
 * SEAL-encrypt, upload to Walrus, transfer onchain, index.
 *
 * A timeout here does NOT mean the write failed. The relayer keeps processing
 * as a background job, which is why every write carries a deterministic
 * idempotency key — a retry collapses onto the original job instead of writing
 * the student's misconception to their record twice.
 */
const INDEX_TIMEOUT_MS = 120_000;

/**
 * Ceiling on the memory text handed to the model per namespace. Recall trims
 * to fit, keeping the closest hits (`high-relevance-only`). The record only
 * grows, and an unbounded memory block eventually crowds out the conversation
 * it is supposed to inform.
 */
const RECALL_TOKEN_BUDGET = 700;

/** How many missing blobs one warm-up pass will pull back from Walrus. */
const RESTORE_LIMIT = 25;

const KIND_NAMESPACE: Record<FactKind, (a: string) => string> = {
  candidate_identity: profileNs,
  experience: profileNs,
  education: profileNs,
  skill: profileNs,
  target_role: profileNs,
  tailored_cv: profileNs,
  application: feedbackNs,
  interview_feedback: feedbackNs,
  preference: feedbackNs,
  clearance: profileNs,
  // Legacy kinds mapped safely
  misconception: profileNs,
  mastery: profileNs,
  weakness: profileNs,
  goal: profileNs,
  error_pattern: feedbackNs,
};

export type { FactKind, RecalledFact };
export {
  resolveConflicts, isOffTheRecord, claimsOfKind,
  factBody, factDate, factKind, retractionTarget, RELEVANCE_DISTANCE, unionFacts,
} from "./facts.ts";

/** Read durable candidate career facts. Call ONCE per turn, never per route. */
export const recallProfile = (address: string, query: string) => recallFrom(profileNs(address), query);

/** Read session feedback, STAR+R coaching, and job application records. */
export const recallFeedback = (address: string, query: string) => recallFrom(feedbackNs(address), query);

/*
 * STABLE QUERIES FOR CAREER ACE.
 *
 * Recall is a similarity search with a relevance floor, so WHAT YOU ASK FOR
 * decides what the model gets to see. Asking with candidate credentials ensures
 * that target role, skills, work accomplishments, and interview prep feedback
 * come back on every turn.
 */
export const CAREER_QUERY =
  "candidate name, full name, identity, target role, work experience, education, technical skills and verified accomplishments";
export const COACHING_QUERY =
  "interview feedback, STAR+R coaching assessments, job application history and career preferences";

/** Target role, experiences, skills, education — retrieved on every turn. */
export const recallCareerProfile = (address: string) => recallFrom(profileNs(address), CAREER_QUERY);

/** Standing preferences and STAR+R interview coach assessments — always relevant. */
export const recallCareerCoaching = (address: string) => recallFrom(feedbackNs(address), COACHING_QUERY);

/** Legacy aliases */
export const LEARNING_QUERY = CAREER_QUERY;
export const PREFERENCE_QUERY = COACHING_QUERY;
export const recallLearning = recallCareerProfile;
export const recallPreferences = recallCareerCoaching;

/**
 * The relevance floor is an EMBEDDING distance, so it only means anything
 * against the real relayer. The offline mock scores by token overlap and
 * returns a flat 1.0 for anything that does not share a word with the query,
 * which would filter out every fact the moment you phrase a question naturally.
 * In mock mode we therefore take what the namespace has and let the caller's
 * conflict resolution do the rest.
 */
function relevanceFloor() {
  return memwalMode() === "mock" ? Number.POSITIVE_INFINITY : RELEVANCE_DISTANCE;
}

/**
 * INDEX WARMING. The relayer's vector index and the blobs on Walrus are two
 * different things, and only the second is durable. A namespace whose index
 * rows are missing recalls NOTHING while the record sits intact on Walrus —
 * and for this app an empty recall is indistinguishable from a brand-new
 * student with no history. That is the one failure this project exists to
 * prevent, so it does not get to fail silently.
 *
 * `restore()` re-downloads the owner's blobs for a namespace, decrypts them,
 * re-embeds and reinserts the index rows. It costs seconds per blob, so it runs
 * ONLY on an empty recall, ONCE per namespace per process, and never in front
 * of a recall that already returned something.
 */
const warmed = new Map<string, Promise<void>>();

function warmOnce(namespace: string, memwal: ReturnType<typeof getMemWal>) {
  const existing = warmed.get(namespace);
  if (existing) return existing;

  const run = withRelayerRetry(`restore ${namespace}`, () => memwal.restore(namespace, RESTORE_LIMIT))
    .then((r) => {
      console.warn(
        `[careerace] warmed ${namespace}: restored=${r.restored} ` +
          `skipped=${r.skipped} total=${r.total}`,
      );
    })
    .catch((error) => {
      // A failed warm-up must not fail the turn — the caller still gets the
      // empty result it already had, and fails closed on its own terms.
      console.error(`[careerace] restore failed for ${namespace}`, error);
    });

  warmed.set(namespace, run);
  return run;
}

async function recallFrom(namespace: string, query: string): Promise<RecalledFact[]> {
  const memwal = getMemWal(namespace);
  const floor = relevanceFloor();

  // The relayer rejects a blank query. `list_memory` and an empty opening turn
  // both reach here, so coerce rather than 400.
  const q = query.trim() || " ";

  const read = async () => {
    const result = await withRelayerRetry(`recall ${namespace}`, () => memwal.recall({
      query: q,
      namespace,
      limit: 10,
      maxTokens: RECALL_TOKEN_BUDGET,
      truncationStrategy: "high-relevance-only",
      ...(Number.isFinite(floor) ? { maxDistance: floor } : {}),
    }));
    return result.results
      .filter((r) => r.distance < floor)
      .map((r) => ({ text: r.text, distance: r.distance, blobId: r.blob_id }));
  };

  /**
   * Tombstones are swept separately, with NO relevance floor.
   *
   * A retraction must never be missed because of a distance threshold. The
   * claim and the tombstone that kills it do not sit at the same distance from
   * a given question, so filtering both through one floor means the fact
   * survives and the retraction does not — and a misconception the student
   * has already fixed goes on being taught around, depending on the phrasing
   * of the question.
   *
   * Tombstones are few and short, so sweeping them unconditionally is cheap.
   * resolveConflicts drops them from anything the model can read.
   */
  const sweepTombstones = async () => {
    const result = await withRelayerRetry(`tombstones ${namespace}`, () =>
      memwal.recall({ query: q, namespace, limit: 25 }),
    );
    return result.results
      .filter((r) => factKind(r.text) === TOMBSTONE)
      .map((r) => ({ text: r.text, distance: r.distance, blobId: r.blob_id }));
  };

  const [hits, tombstones] = await Promise.all([read(), sweepTombstones()]);
  if (hits.length) return [...hits, ...tombstones];

  await warmOnce(namespace, memwal);
  return [...(await read()), ...tombstones];
}

export type WriteOutcome =
  | { status: "skipped"; reason: "off-the-record" | "duplicate"; existing?: string }
  | { status: "written"; namespace: string; text: string; supersedes?: string };

/**
 * The only write path.
 *   - identical fact already stored -> skip, write nothing
 *   - near-duplicate that disagrees -> store the new fact, naming what it replaces
 *   - nothing similar               -> store it plain
 */
export async function rememberFact(
  address: string,
  kind: FactKind,
  text: string,
  opts: { userTurn?: string } = {},
): Promise<WriteOutcome> {
  if (opts.userTurn && isOffTheRecord(opts.userTurn)) {
    return { status: "skipped", reason: "off-the-record" };
  }

  const namespace = KIND_NAMESPACE[kind](address);
  const memwal = getMemWal(namespace);

  /*
   * Probe with the STORED shape, not the bare claim — see factProbe.
   *
   * THE PROBE MUST NEVER SINK THE WRITE. The SDK aborts a recall after a
   * hardcoded 15s, and withRelayerRetry only retries 401 throttles — so a slow
   * relayer throws an AbortError out of here, the caller catches it, and the
   * student's misconception is dropped on the floor. Deduplication is an
   * optimisation; recording the fact is the product.
   */
  let closest: { text: string; distance: number } | undefined;
  try {
    const nearby = await withRelayerRetry(`dedupe ${namespace}`, () => memwal.recall({
      query: factProbe(kind, text),
      namespace,
      limit: 5,
      maxDistance: DUPLICATE_DISTANCE,
    }));
    closest = nearby.results
      .filter((r) => r.distance < DUPLICATE_DISTANCE)
      .sort((a, b) => a.distance - b.distance)[0];
  } catch (error) {
    console.warn(
      `[careerace] dedupe probe failed for ${namespace} ` +
        `(${error instanceof Error ? error.message : String(error)}) — ` +
        "writing the fact anyway rather than losing it.",
    );
  }

  if (closest && sameFact(closest.text, text)) {
    return { status: "skipped", reason: "duplicate", existing: closest.text };
  }

  const supersedes = closest?.text;
  const stored = formatFact(kind, text, supersedes);

  // *AndWait, not remember(): plain remember() returns before indexing
  // finishes, and the very next recall would miss the fact we just wrote.
  //
  // The idempotency key makes the duplicate check above hold even when the
  // network lies to us — a timeout after the server accepted the job collapses
  // onto that job instead of writing the claim a second time.
  await withRelayerRetry(`write ${namespace}`, () =>
    memwal.rememberAndWait(stored, namespace, {
      timeoutMs: INDEX_TIMEOUT_MS,
      idempotencyKey: idempotencyKeyFor(namespace, kind, text),
    }),
  );

  return { status: "written", namespace, text: stored, supersedes };
}

export type ForgetOutcome =
  | { status: "not-found" }
  | { status: "retracted"; namespace: string; tombstone: string; target: string };

/**
 * RETRACT a fact. There is no delete in the SDK, so this writes a tombstone
 * that outranks the claim it names; resolveConflicts then keeps that claim out
 * of everything the tutor reads.
 *
 * It is not erasure and must never be described as erasure. The original blob
 * stays on Walrus, encrypted under the owner's keys, until its storage period
 * expires.
 *
 * The kind is unknown at this point — the student says "forget the force
 * thing", not "forget the misconception in examace:profile". So both
 * namespaces are searched and the tombstone lands wherever the claim lives.
 */
export async function forgetFact(address: string, text: string): Promise<ForgetOutcome> {
  const namespaces = [profileNs(address), feedbackNs(address)];

  /*
   * Unlike a write, there is no stored shape to probe with here. So this casts
   * a wider net at the relevance floor and then decides on the TEXT rather
   * than the distance — an exact claim match always wins, and a near miss only
   * counts if it is genuinely close.
   *
   * Retraction has to be precise. Retracting the wrong fact off a fuzzy vector
   * match would quietly remove a weakness the student still has, and the tutor
   * would stop working on it.
   */
  const wanted = text.trim().toLowerCase();

  const candidates = await Promise.all(
    namespaces.map(async (namespace) => {
      const found = await withRelayerRetry(`forget-search ${namespace}`, () =>
        getMemWal(namespace).recall({
          query: text,
          namespace,
          limit: 10,
          maxDistance: RELEVANCE_DISTANCE,
        }),
      );

      const usable = found.results
        .filter((r) => factKind(r.text) !== TOMBSTONE)
        .map((r) => ({ ...r, exact: factBody(r.text) === wanted }))
        .filter((r) => r.exact || r.distance < DUPLICATE_DISTANCE)
        .sort((a, b) => Number(b.exact) - Number(a.exact) || a.distance - b.distance);

      return usable[0] ? { namespace, nearest: usable[0] } : null;
    }),
  );

  const hit = candidates
    .filter((c) => c !== null)
    .sort(
      (a, b) =>
        Number(b.nearest.exact) - Number(a.nearest.exact) ||
        a.nearest.distance - b.nearest.distance,
    )[0];

  if (!hit) return { status: "not-found" };

  const tombstone = formatTombstone(hit.nearest.text);
  await withRelayerRetry(`retract ${hit.namespace}`, () =>
    getMemWal(hit.namespace).rememberAndWait(tombstone, hit.namespace, {
      timeoutMs: INDEX_TIMEOUT_MS,
      idempotencyKey: idempotencyKeyFor(hit.namespace, "tombstone", factBody(hit.nearest.text)),
    }),
  );

  return {
    status: "retracted",
    namespace: hit.namespace,
    tombstone,
    target: hit.nearest.text,
  };
}
