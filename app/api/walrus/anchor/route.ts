import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth";
import { anchorWalrusCredentialOnchain, getCandidateOnchainAnchors } from "@/lib/walrus_anchor";

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const sessionCookie = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("careerace_session="));

    const token = sessionCookie ? sessionCookie.split("=")[1] : undefined;
    const sessionAddress = readSession(token);

    const { searchParams } = new URL(req.url);
    const queryAddress = searchParams.get("address");

    const targetAddress = (queryAddress || sessionAddress || "").toLowerCase().trim();

    if (!targetAddress) {
      return NextResponse.json({ success: false, error: "Unauthorized or missing candidate address" }, { status: 401 });
    }

    const anchors = await getCandidateOnchainAnchors(targetAddress);
    return NextResponse.json({ success: true, candidateAddress: targetAddress, anchors });
  } catch (err: any) {
    console.error("[api/walrus/anchor GET] error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

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
    const { blobId, sha256Digest, credentialType, candidateAddress, fileName, metadata } = body;

    const targetAddress = (candidateAddress || sessionAddress || "").toLowerCase().trim();

    if (!blobId) {
      return NextResponse.json({ success: false, error: "Missing required parameter: blobId" }, { status: 400 });
    }

    if (!targetAddress) {
      return NextResponse.json({ success: false, error: "Unauthorized session or missing candidate address" }, { status: 401 });
    }

    const anchorResult = await anchorWalrusCredentialOnchain({
      blobId,
      sha256Digest,
      credentialType: credentialType || "sovereign_resume",
      candidateAddress: targetAddress,
      fileName,
      metadata,
    });

    return NextResponse.json({ success: true, anchor: anchorResult });
  } catch (err: any) {
    console.error("[api/walrus/anchor POST] error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
