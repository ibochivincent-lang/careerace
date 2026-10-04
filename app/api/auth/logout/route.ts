import { cookies } from "next/headers";
import { SESSION_COOKIE, NONCE_COOKIE } from "@/lib/auth";

export async function POST() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(NONCE_COOKIE);
  jar.set(SESSION_COOKIE, "", { path: "/", maxAge: 0, expires: new Date(0) });
  jar.set(NONCE_COOKIE, "", { path: "/", maxAge: 0, expires: new Date(0) });
  return Response.json({ ok: true, success: true });
}
