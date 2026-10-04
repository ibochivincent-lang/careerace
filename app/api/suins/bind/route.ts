import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth";
import { bindSuinsDomain } from "@/lib/suins";

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const sessionCookie = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("careerace_session="));

    const token = sessionCookie ? sessionCookie.split("=")[1] : undefined;
    const sessionAddress = readSession(token);

    const body = await req.json();
    const { domain, candidateAddress, walrusBlobId } = body;

    const targetAddress = (candidateAddress || sessionAddress || "").toLowerCase().trim();

    if (!targetAddress) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session or missing candidate address" },
        { status: 401 }
      );
    }

    if (!domain || typeof domain !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing required parameter: domain" },
        { status: 400 }
      );
    }

    const result = await bindSuinsDomain({
      candidateAddress: targetAddress,
      domain,
      walrusBlobId,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[api/suins/bind POST] error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to bind SuiNS domain" },
      { status: 500 }
    );
  }
}
