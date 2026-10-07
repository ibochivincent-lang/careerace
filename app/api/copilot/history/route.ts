import { NextResponse } from "next/server";
import {
  getChatHistory,
  getChatHistoryAsync,
  saveChatHistory,
  saveChatHistoryAsync,
  appendChatTurn,
  appendChatTurnAsync,
  clearChatHistory,
} from "@/lib/chat_history_store.ts";
import { resolveTargetAddress } from "@/lib/target_address.ts";
import {
  checkWalrusConsoleStatus,
  getCandidateWalrusVault,
  archiveChatSessionToWalrus,
  DIRECT_WALRUS_PUBLISHER_URL,
  DIRECT_WALRUS_AGGREGATOR_URL,
} from "@/lib/walrus_console_client.ts";

export const maxDuration = 30;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const rawAddress = url.searchParams.get("address");
    const channel = url.searchParams.get("channel") || "overview";
    const checkStatus = url.searchParams.get("status") === "1";

    const address = await resolveTargetAddress(rawAddress);

    let consoleStatus = undefined;
    if (checkStatus) {
      consoleStatus = await checkWalrusConsoleStatus();
    }

    const messages = await getChatHistoryAsync(address, channel);
    const vaultRecord = await getCandidateWalrusVault(address, channel);

    const walrusVault = {
      directWalrusActive: true,
      provider: "direct-walrus" as const,
      storageEngine: vaultRecord?.storageEngine || "direct-walrus",
      publisherUrl: DIRECT_WALRUS_PUBLISHER_URL,
      aggregatorUrl: DIRECT_WALRUS_AGGREGATOR_URL,
      latestBlobId: vaultRecord?.blobId || null,
      walrusUrl:
        vaultRecord?.walrusUrl ||
        (vaultRecord?.blobId
          ? `${DIRECT_WALRUS_AGGREGATOR_URL}/v1/blobs/${vaultRecord.blobId}`
          : null),
      suiObjectId: vaultRecord?.suiObjectId || null,
      archivedAt: vaultRecord?.timestamp
        ? new Date(vaultRecord.timestamp).toISOString()
        : null,
      messageCount: vaultRecord?.messageCount ?? messages.length,
      consoleStatus,
    };

    return NextResponse.json({
      ok: true,
      address,
      channel,
      messages,
      walrusVault,
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

    if (body.action === "archive_walrus" || body.action === "sync_walrus") {
      const messagesToArchive =
        Array.isArray(body.messages) && body.messages.length > 0
          ? body.messages
          : await getChatHistoryAsync(address, channel);

      const archiveRes = await archiveChatSessionToWalrus({
        address,
        channel,
        messages: messagesToArchive,
      });

      const vaultRecord = await getCandidateWalrusVault(address, channel);

      return NextResponse.json({
        ok: archiveRes.ok,
        storageEngine: archiveRes.storageEngine,
        blobId: archiveRes.blobId || vaultRecord?.blobId || null,
        walrusUrl: archiveRes.walrusUrl || vaultRecord?.walrusUrl || null,
        messageCount: messagesToArchive.length,
        error: archiveRes.error,
      });
    }

    if (body.userMessage && body.assistantReply) {
      const updated = await appendChatTurnAsync(
        address,
        body.userMessage,
        body.assistantReply,
        channel
      );
      const vaultRecord = await getCandidateWalrusVault(address, channel);
      return NextResponse.json({
        ok: true,
        messages: updated,
        walrusVault: {
          directWalrusActive: true,
          provider: "direct-walrus",
          latestBlobId: vaultRecord?.blobId || null,
          walrusUrl: vaultRecord?.walrusUrl || null,
        },
      });
    }

    if (Array.isArray(body.messages)) {
      const updated = await saveChatHistoryAsync(address, body.messages, channel);
      const vaultRecord = await getCandidateWalrusVault(address, channel);
      return NextResponse.json({
        ok: true,
        messages: updated,
        walrusVault: {
          directWalrusActive: true,
          provider: "direct-walrus",
          latestBlobId: vaultRecord?.blobId || null,
          walrusUrl: vaultRecord?.walrusUrl || null,
        },
      });
    }

    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  } catch (error) {
    console.error("[copilot_history] Error updating chat history:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

