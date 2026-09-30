import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { ORDER, PROVIDERS, isProvider, type Provider } from "./providers.ts";
import type { KeyBag } from "./model_select.ts";

/**
 * Bring-your-own-key storage.
 *
 * A provider key is a bearer credential that bills someone's card, so where it
 * lives matters more than the convenience of putting it anywhere.
 *
 * It is sealed with AES-256-GCM under a key derived from SESSION_SECRET and
 * kept in an httpOnly cookie. That means:
 *   - It never reaches our disk or logs. The only copy is in the person's own
 *     browser, and we cannot read it without their request.
 *   - httpOnly puts it out of reach of `document.cookie`, so a script injected
 *     into the page cannot exfiltrate it — which localStorage would not stop.
 *   - GCM authenticates, so a tampered cookie fails to open rather than
 *     decrypting into rubbish that we then send to a vendor.
 *
 * It is NOT protection against someone who already controls this server. Say
 * that plainly in the UI rather than implying the key is beyond our reach.
 */

export const KEYS_COOKIE = "ea_keys";

export type { KeyBag };

const EMPTY: KeyBag = { keys: {}, models: {} };

function cipherKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is required to store API keys");
  // Same secret as the session HMAC, but domain-separated so the two uses can
  // never be substituted for one another.
  return crypto.createHash("sha256").update(`ea-provider-keys:${secret}`).digest();
}

export function seal(bag: KeyBag): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", cipherKey(), iv);
  const body = Buffer.concat([
    cipher.update(JSON.stringify(bag), "utf8"),
    cipher.final(),
  ]);
  return [iv, cipher.getAuthTag(), body]
    .map((b) => b.toString("base64url"))
    .join(".");
}

export function open(cookie: string | undefined): KeyBag {
  if (!cookie) return EMPTY;
  try {
    const [iv, tag, body] = cookie.split(".").map((p) => Buffer.from(p, "base64url"));
    if (!iv || !tag || !body) return EMPTY;
    const decipher = crypto.createDecipheriv("aes-256-gcm", cipherKey(), iv);
    decipher.setAuthTag(tag);
    const json = Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
    const parsed = JSON.parse(json) as KeyBag;
    return {
      keys: parsed.keys ?? {},
      models: parsed.models ?? {},
      active: parsed.active && isProvider(parsed.active) ? parsed.active : undefined,
    };
  } catch {
    // A rotated SESSION_SECRET invalidates every stored key. That is the
    // correct outcome — better than serving a half-decrypted credential.
    return EMPTY;
  }
}

/**
 * Reads the bag for the current request. Falls back to an empty bag outside a
 * request context (scripts, build-time evaluation) rather than throwing, so
 * server-side env keys keep working there.
 */
export async function readKeyBag(): Promise<KeyBag> {
  try {
    const jar = await cookies();
    return open(jar.get(KEYS_COOKIE)?.value);
  } catch {
    return EMPTY;
  }
}

export const KEYS_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
} as const;

/**
 * Which providers are usable, and from where. A key set in the environment by
 * whoever deployed the app is shown as such and cannot be edited from the
 * browser — the UI should not imply the visitor can change the operator's key.
 */
export function sources(bag: KeyBag) {
  const fromCookie = ORDER.filter((p) => Boolean(bag.keys[p]?.trim()));
  const fromEnv = ORDER.filter((p) => Boolean(process.env[envOf(p)]?.trim()));
  return { fromCookie, fromEnv };
}

export function envOf(provider: Provider): string {
  return PROVIDERS[provider].env;
}
