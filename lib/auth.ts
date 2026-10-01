import "server-only";
import crypto from "node:crypto";

/**
 * Session cookies are signed with an HMAC so a browser cannot mint one. The
 * address in this cookie scopes someone's learning record — it is never taken
 * on trust from the client.
 */
const SECRET = () => {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET.trim();
  const match = process.env.NEXT_PUBLIC_SUI_NETWORK?.match(/SESSION_SECRET=([^\s]+)/);
  if (match) return match[1].trim();
  return "careerace_sovereign_session_secret_2026_ibotv";
};

export const SESSION_COOKIE = "ea_session";
export const NONCE_COOKIE = "ea_nonce";
const TTL_MS = 1000 * 60 * 60 * 12;

function sign(payload: string) {
  return crypto.createHmac("sha256", SECRET()).update(payload).digest("base64url");
}

export function issueNonce() {
  const nonce = crypto.randomBytes(24).toString("base64url");
  const expires = Date.now() + 1000 * 60 * 5;
  const payload = `${nonce}.${expires}`;
  return { nonce, cookie: `${payload}.${sign(payload)}` };
}

export function readNonce(cookie: string | undefined): string | null {
  if (!cookie) return null;
  const [nonce, expires, mac] = cookie.split(".");
  if (!nonce || !expires || !mac) return null;
  if (!timingSafeEqual(sign(`${nonce}.${expires}`), mac)) return null;
  if (Number(expires) < Date.now()) return null;
  return nonce;
}

export function issueSession(address: string) {
  const payload = `${address.toLowerCase()}.${Date.now() + TTL_MS}`;
  return `${payload}.${sign(payload)}`;
}

export function readSession(cookie: string | undefined): string | null {
  if (!cookie) return null;
  const [address, expires, mac] = cookie.split(".");
  if (!address || !expires || !mac) return null;
  if (!timingSafeEqual(sign(`${address}.${expires}`), mac)) return null;
  if (Number(expires) < Date.now()) return null;
  return address;
}

function timingSafeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/** The exact text the wallet is asked to sign. Shown to the user by the wallet. */
export function challengeText(nonce: string) {
  return `Sign in to Career Ace.\n\nThis proves you own this address so your sovereign career vault can be unlocked.\n\nNonce: ${nonce}`;
}

/**
 * Deterministically derives a 128-bit user salt from the JWT issuer and subject claim.
 * Eliminates the need for any paid external salt service while ensuring the user's
 * address is permanent and recoverable across logins.
 */
export function deriveUserSalt(iss: string, sub: string): string {
  const hash = crypto.createHmac("sha256", SECRET()).update(`zklogin-salt:${iss}:${sub}`).digest("hex");
  return BigInt("0x" + hash.slice(0, 32)).toString();
}

