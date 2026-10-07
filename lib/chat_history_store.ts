/**
 * Cross-Device Persistent Chat History Store for CareerAce
 *
 * Ensures candidate chat conversations persist seamlessly across devices,
 * browser reloads, and sessions tied to their canonical sovereign address.
 */

import fs from "node:fs";
import path from "node:path";
import {
  archiveChatSessionToWalrus,
  fetchChatSessionFromWalrus,
} from "./walrus_console_client.ts";

export interface ChatMessageRecord {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  channel?: string;
}

const HISTORY_STORE_FILE = path.join(process.cwd(), ".chat_history.json");
const MAX_MESSAGES_PER_USER = 100;

// In-memory cache for sub-millisecond retrieval
const memoryCache = new Map<string, ChatMessageRecord[]>();
let isDiskLoaded = false;

function loadFromDisk(): void {
  if (isDiskLoaded) return;
  try {
    if (fs.existsSync(HISTORY_STORE_FILE)) {
      const raw = fs.readFileSync(HISTORY_STORE_FILE, "utf-8");
      const data = JSON.parse(raw);
      if (typeof data === "object" && data !== null) {
        for (const [addr, msgs] of Object.entries(data)) {
          if (Array.isArray(msgs)) {
            memoryCache.set(addr.toLowerCase(), msgs);
          }
        }
      }
    }
  } catch (err) {
    console.warn("[chat_history] Notice loading history from disk:", err);
  } finally {
    isDiskLoaded = true;
  }
}

function flushToDisk(): void {
  try {
    const dataObj: Record<string, ChatMessageRecord[]> = {};
    for (const [addr, msgs] of memoryCache.entries()) {
      dataObj[addr] = msgs;
    }
    fs.writeFileSync(HISTORY_STORE_FILE, JSON.stringify(dataObj, null, 2), "utf-8");
  } catch (err) {
    // Tolerates serverless read-only filesystems safely
    console.warn("[chat_history] Notice writing history to disk:", err);
  }
}

/**
 * Normalizes user address for storage indexing
 */
export function normalizeHistoryAddress(address?: string | null): string {
  if (!address || typeof address !== "string") {
    return "0x434f860c828dc4320be447975b8283d7c5786c4a08b9ddc8f88540d9ea69aa00";
  }
  return address.trim().toLowerCase();
}

/**
 * Retrieves the full chat history for a candidate address (synchronous).
 */
export function getChatHistory(
  rawAddress?: string | null,
  channel = "overview"
): ChatMessageRecord[] {
  loadFromDisk();
  const address = normalizeHistoryAddress(rawAddress);
  const userMessages = memoryCache.get(address) || [];

  if (!channel || channel === "all") {
    return userMessages;
  }

  return userMessages.filter((m) => !m.channel || m.channel === channel);
}

/**
 * Retrieves chat history asynchronously, hydrating from Walrus Console if local is empty.
 */
export async function getChatHistoryAsync(
  rawAddress?: string | null,
  channel = "overview"
): Promise<ChatMessageRecord[]> {
  const local = getChatHistory(rawAddress, channel);
  if (local.length > 0) {
    return local;
  }

  const address = normalizeHistoryAddress(rawAddress);
  try {
    const remote = await fetchChatSessionFromWalrus({ address, channel });
    if (Array.isArray(remote) && remote.length > 0) {
      saveChatHistory(address, remote, channel);
      return getChatHistory(address, channel);
    }
  } catch (err) {
    console.warn("[chat_history] Notice restoring from Walrus Console:", err);
  }

  return local;
}

/**
 * Saves or replaces the complete chat history for an address and channel.
 */
export function saveChatHistory(
  rawAddress: string | null | undefined,
  messages: Array<{ role: "user" | "assistant"; content: string; timestamp?: number }>,
  channel = "overview"
): ChatMessageRecord[] {
  loadFromDisk();
  const address = normalizeHistoryAddress(rawAddress);
  const existing = memoryCache.get(address) || [];

  const otherChannelMessages = existing.filter((m) => m.channel && m.channel !== channel);

  const formatted: ChatMessageRecord[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
    timestamp: typeof m.timestamp === "number" ? m.timestamp : Date.now(),
    channel,
  }));

  const merged = [...otherChannelMessages, ...formatted].slice(-MAX_MESSAGES_PER_USER);
  memoryCache.set(address, merged);
  flushToDisk();

  // Background sovereign archive to Walrus Console
  archiveChatSessionToWalrus({
    address,
    channel,
    messages: formatted,
  }).catch((err) => {
    console.warn("[chat_history] Notice background Walrus Console archive:", err);
  });

  return formatted;
}

/**
 * Appends a complete user-assistant turn to the persistent history.
 */
export function appendChatTurn(
  rawAddress: string | null | undefined,
  userMessage: string,
  assistantReply: string,
  channel = "overview"
): ChatMessageRecord[] {
  loadFromDisk();
  const address = normalizeHistoryAddress(rawAddress);
  const existing = memoryCache.get(address) || [];
  const now = Date.now();

  const newRecords: ChatMessageRecord[] = [
    {
      role: "user",
      content: userMessage,
      timestamp: now,
      channel,
    },
    {
      role: "assistant",
      content: assistantReply,
      timestamp: now + 1,
      channel,
    },
  ];

  const updated = [...existing, ...newRecords].slice(-MAX_MESSAGES_PER_USER);
  memoryCache.set(address, updated);
  flushToDisk();

  // Background sovereign archive to Walrus Console
  archiveChatSessionToWalrus({
    address,
    channel,
    messages: updated.filter((m) => !m.channel || m.channel === channel),
  }).catch((err) => {
    console.warn("[chat_history] Notice background Walrus Console turn sync:", err);
  });

  return updated.filter((m) => !m.channel || m.channel === channel);
}

/**
 * Clears chat history for a specific address.
 */
export function clearChatHistory(rawAddress?: string | null, channel?: string): void {
  loadFromDisk();
  const address = normalizeHistoryAddress(rawAddress);
  if (!channel || channel === "all") {
    memoryCache.delete(address);
  } else {
    const existing = memoryCache.get(address) || [];
    const remaining = existing.filter((m) => m.channel !== channel);
    memoryCache.set(address, remaining);
  }
  flushToDisk();
}

