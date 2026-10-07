import { NextResponse } from "next/server";
import {
  getChatHistory,
  getChatHistoryAsync,
  saveChatHistory,
  appendChatTurn,
  clearChatHistory,
} from "@/lib/chat_history_store.ts";
import { resolveTargetAddress } from "@/lib/target_address.ts";
import { checkWalrusConsoleStatus } from "@/lib/walrus_console_client.ts";

export const maxDuration = 30;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const rawAddress = url.searchParams.get("address");
    const channel = url.searchParams.get("channel") || "overview";
    const checkStatus = url.searchParams.get("status") === "1";

    const address = await resolveTargetAddress(rawAddress);

    let walrusStatus = undefined;
    if (checkStatus) {
      walrusStatus = await checkWalrusConsoleStatus();
    }

    const messages = await getChatHistoryAsync(address, channel);
    return NextResponse.json({
      ok: true,
      address,
      channel,
      messages,
      walrusVault: walrusStatus,
    });
  } catch (error) {
    console.error("[copilot_history] Error fetching chat history:", error);
    return NextResponse.json({ ok: false, messages: [] }, { status: 500 });
  }
}


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const address = await resolveTargetAddress(body.address);
    const channel = body.channel || "overview";

    if (body.action === "clear") {
      clearChatHistory(address, channel);
      return NextResponse.json({ ok: true, cleared: true });
    }

    if (body.userMessage && body.assistantReply) {
      const updated = appendChatTurn(address, body.userMessage, body.assistantReply, channel);
      return NextResponse.json({ ok: true, messages: updated });
    }

    if (Array.isArray(body.messages)) {
      const updated = saveChatHistory(address, body.messages, channel);
      return NextResponse.json({ ok: true, messages: updated });
    }

    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  } catch (error) {
    console.error("[copilot_history] Error updating chat history:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
