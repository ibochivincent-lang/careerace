import { NextResponse } from "next/server";
import { triggerZapierWebhook, type ZapierEventType } from "@/lib/zapier";
import { getOwnerAddress } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const event = (body.event || "test_ping") as ZapierEventType;
    const webhookUrl = body.webhook_url as string | undefined;
    const customData = (body.data || {}) as Record<string, any>;

    const address = await getOwnerAddress();
    const candidateData = {
      address,
      username: body.candidate?.username || "Candidate",
      email: body.candidate?.email || null,
      phone: body.candidate?.phone || null,
      target_role: body.candidate?.target_role || "Software Engineer",
    };

    const result = await triggerZapierWebhook(
      event,
      candidateData,
      customData,
      webhookUrl
    );

    return NextResponse.json(result, {
      status: result.success ? 200 : result.status || 400,
    });
  } catch (error) {
    console.error("[api/zapier/trigger] Error:", error);
    return NextResponse.json(
      {
        success: false,
        status: 500,
        message: error instanceof Error ? error.message : "Internal error triggering Zapier action",
      },
      { status: 500 }
    );
  }
}
