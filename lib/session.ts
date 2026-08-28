import "server-only";
import { cookies } from "next/headers";
import { readSession, SESSION_COOKIE } from "./auth.ts";

/**
 * Identity boundary. Returns a Sui address only when the browser presented a
 * session cookie this server signed, which it only mints after verifying a
 * wallet signature over a server-issued nonce (app/api/auth/verify).
 *
 * DEV_FAKE_ADDRESS bypasses all of that and is refused in production.
 */
export async function getOwnerAddress(): Promise<string | null> {
  const dev = process.env.DEV_FAKE_ADDRESS;
  if (dev) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("DEV_FAKE_ADDRESS must not be set in production");
    }
    return dev.toLowerCase();
  }
  const jar = await cookies();
  return readSession(jar.get(SESSION_COOKIE)?.value);
}
