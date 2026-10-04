import { NextResponse } from "next/server";
import { getVerifiedCredentialsBySuins, resolveSuinsToAddress, resolveAddressToSuins } from "@/lib/suins";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get("domain") || searchParams.get("name");
    const address = searchParams.get("address");

    const target = domain || address;

    if (!target) {
      return NextResponse.json(
        { success: false, error: "Must provide either domain or address parameter" },
        { status: 400 }
      );
    }

    const passport = await getVerifiedCredentialsBySuins(target);

    if (!passport) {
      return NextResponse.json(
        { success: false, error: `Could not resolve SuiNS credentials for "${target}"` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      passport,
    });
  } catch (err: any) {
    console.error("[api/suins/resolve GET] error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to resolve SuiNS domain" },
      { status: 500 }
    );
  }
}
