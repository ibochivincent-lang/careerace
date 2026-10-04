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

export const SESSION_COOKIE = "careerace_session";
export const NONCE_COOKIE = "careerace_nonce";
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
 * Uses a persistent master key so candidate blockchain addresses remain stable
 * across session renewals and server restarts.
 */
export function deriveUserSalt(iss: string, sub: string): string {
  const masterKey = process.env.ZKLOGIN_SALT_MASTER_KEY?.trim() || SECRET();
  const hash = crypto.createHmac("sha256", masterKey).update(`zklogin-salt:${iss}:${sub}`).digest("hex");
  return BigInt("0x" + hash.slice(0, 32)).toString();
}

/**
 * Deterministically derives a 66-character sovereign hex address (0x...) from an email address.
 * Guarantees that logging in via Google OAuth, Email/Password, or Email OTP with the same email
 * resolves to the EXACT same candidate sovereign vault across all devices.
 */
export function deriveVaultAddressFromEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  const hash = crypto.createHash("sha256").update(`careerace:email:${normalized}`).digest("hex");
  return `0x${hash}`;
}

/**
 * Deterministically derives a 66-character sovereign hex address (0x...) from a user ID or email.
 * This guarantees consistent vault access and data isolation for username/email credentials.
 */
export function deriveVaultAddressFromUserId(userId: string): string {
  const hash = crypto.createHash("sha256").update(`careerace:user:${userId.trim().toLowerCase()}`).digest("hex");
  return `0x${hash}`;
}


