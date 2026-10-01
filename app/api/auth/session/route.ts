import { NextResponse } from "next/server";
import { getOwnerAddress } from "@/lib/session.ts";

export async function GET() {
  try {
    const address = await getOwnerAddress();
    return NextResponse.json({
      authenticated: Boolean(address),
      address: address || null,
    });
  } catch (error) {
    return NextResponse.json(
      { authenticated: false, address: null },
      { status: 200 }
    );
  }
}
