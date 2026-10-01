import { decodeJwt } from "@mysten/sui/zklogin";
import { deriveUserSalt } from "@/lib/auth.ts";

export async function POST(req: Request) {
  try {
    const { jwt } = await req.json();
    if (!jwt || typeof jwt !== "string") {
      return new Response("Missing jwt parameter", { status: 400 });
    }

    const decoded = decodeJwt(jwt);
    if (!decoded.sub || !decoded.iss) {
      return new Response("Invalid JWT payload", { status: 400 });
    }

    const userSalt = deriveUserSalt(decoded.iss, decoded.sub);
    return Response.json({ userSalt });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to derive user salt";
    console.error("[zklogin] Salt route error:", message);
    return new Response(message, { status: 500 });
  }
}
