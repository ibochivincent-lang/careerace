import { MemWal, MemWalMock } from "@mysten-incubation/memwal";

/**
 * Plain factory with no `server-only` guard, so both the Next app and the MCP
 * server can build a client. Next code should import ./memwal instead, which
 * re-exports this behind the guard.
 *
 * ZERO-CREDENTIAL MODE. With no MEMWAL_* keys the app falls back to the SDK's
 * in-memory mock so someone can clone this repo and see the contract work —
 * the write gate, duplicate skipping, supersede stamping and the misconception
 * screen are all real in mock mode, because none of them need a network.
 *
 * What mock mode is NOT: the mock scores by token overlap, not embeddings, so
 * "what am I weak at?" does not retrieve "thinks force = mass x velocity" the
 * way the real relayer does. Semantic recall — the actual product claim — only
 * exists on live credentials. Never film a demo against the mock.
 */

/**
 * The relayer answers a throttled account with `401 AUTH_REJECTED` — the same
 * code it uses for a wrong or unregistered delegate key. The two are not
 * distinguishable from the response, so this retries a bounded number of times
 * before giving up.
 *
 * If all attempts fail the original error is rethrown, so a genuinely bad key
 * still surfaces the message that tells you to go check it.
 */
const AUTH_RETRY_DELAYS_MS = [5_000, 15_000, 45_000, 90_000];

function isThrottle(error: unknown) {
  const e = error as { status?: number; serverCode?: string };
  return e?.status === 401 && e?.serverCode === "AUTH_REJECTED";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function withRelayerRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (!isThrottle(error) || attempt >= AUTH_RETRY_DELAYS_MS.length) throw error;
      const wait = AUTH_RETRY_DELAYS_MS[attempt];
      console.warn(
        `[careerace] ${label}: relayer returned 401 AUTH_REJECTED — ` +
          `retrying in ${wait / 1000}s (${attempt + 1}/${AUTH_RETRY_DELAYS_MS.length}). ` +
          `If every attempt fails, check the delegate key is registered on this account.`,
      );
      await sleep(wait);
    }
  }
}

const key = () => process.env.MEMWAL_PRIVATE_KEY?.trim();
const accountId = () => process.env.MEMWAL_ACCOUNT_ID?.trim();

export type MemWalMode = "live" | "mock";

export function memwalMode(): MemWalMode {
  return key() && accountId() ? "live" : "mock";
}

/**
 * ONE mock for the whole process, shared across namespaces.
 *
 * The mock keeps its records in instance memory, so a fresh instance per call
 * would silently forget every write. It takes a namespace per operation, and
 * namespace isolation still holds inside a single instance.
 */
let sharedMock: MemWalMock | null = null;
let warned = false;

function mock() {
  if (!sharedMock) {
    sharedMock = MemWalMock.create({ namespace: "default" });
  }
  if (!warned) {
    warned = true;
    console.warn(
      "[careerace] MEMWAL_PRIVATE_KEY / MEMWAL_ACCOUNT_ID not set — " +
        "running on the in-memory mock. Facts do not persist and recall is " +
        "token-overlap, not semantic. See .env.example.",
    );
  }
  return sharedMock;
}

/**
 * ONE live client per namespace, for the same reason there is one mock.
 *
 * `MemWal.create()` is not a cheap handle. Each instance builds and caches its
 * own ephemeral SEAL SessionKey (5-minute TTL, signed client-side and sent as
 * `x-seal-session`), plus its own single-flight guards and per-request nonces.
 * Constructing one per call throws all of that away every time and makes the
 * relayer issue a fresh session for each operation — which is what produces
 * intermittent `401 AUTH_REJECTED` on writes while reads keep working.
 */
const live = new Map<string, MemWal>();

export function createMemWal(namespace: string) {
  if (memwalMode() === "mock") return mock();

  const existing = live.get(namespace);
  if (existing) return existing;

  const client = MemWal.create({
    key: key()!,
    accountId: accountId()!,
    serverUrl: process.env.MEMWAL_SERVER_URL ?? "https://relayer-staging.memory.walrus.xyz",
    namespace,
  });
  live.set(namespace, client);
  return client;
}
