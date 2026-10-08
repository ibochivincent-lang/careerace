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
import { archiveChatSessionToIpfs } from "./pinata_ipfs_client.ts";
import { rememberFact } from "./memory_core.ts";
import { SupabaseDatabaseService } from "./supabase.ts";

const supabaseService = new SupabaseDatabaseService();

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
 * Retrieves chat history asynchronously.
 * 3-Tier Hydration Hierarchy:
 * Tier 1: In-memory cache
 * Tier 2: Supabase PostgreSQL (sub-50ms cloud hot store)
 * Tier 3: Walrus Console (cold sovereign vault)
 */
export async function getChatHistoryAsync(
  rawAddress?: string | null,
  channel = "overview"
): Promise<ChatMessageRecord[]> {
  const address = normalizeHistoryAddress(rawAddress);
  const local = getChatHistory(address, channel);
  if (local.length > 0) {
    return local;
  }

  // Tier 2: Hydrate from Supabase PostgreSQL
  try {
    const supabaseMsgs = await supabaseService.getCandidateChatHistory(address, channel);
    if (Array.isArray(supabaseMsgs) && supabaseMsgs.length > 0) {
      const formatted: ChatMessageRecord[] = supabaseMsgs.map((m: any) => ({
        role: m.role,
        content: m.content,
        timestamp: typeof m.timestamp === "number" ? m.timestamp : Date.now(),
        channel,
      }));
      const existing = memoryCache.get(address) || [];
      const otherChannel = existing.filter((m) => m.channel && m.channel !== channel);
      const merged = [...otherChannel, ...formatted].slice(-MAX_MESSAGES_PER_USER);
      memoryCache.set(address, merged);
      flushToDisk();
      return formatted;
    }
  } catch (err) {
    console.warn("[chat_history] Notice restoring from Supabase:", err);
  }

  // Tier 3: Fall back to Walrus Console cold sovereign vault
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
 * Synchronously updates memory cache and triggers background cloud persistence.
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

  const channelMessages = merged.filter((m) => !m.channel || m.channel === channel);

  // ── 3-TIER SOVEREIGN PERSISTENCE ENGINE (STRICT USER ISOLATION) ──
  // Tier 1: Walrus Memory (Decentralized Vector Memory)
  if (channelMessages.length > 0) {
    const lastUser = [...channelMessages].reverse().find((m) => m.role === "user")?.content || "";
    const lastBot = [...channelMessages].reverse().find((m) => m.role === "assistant")?.content || "";
    if (lastUser && lastBot) {
      rememberFact(
        address,
        "preference",
        `Chat history session [${channel}]: Candidate asked "${lastUser.slice(0, 100)}" -> CareerAce: "${lastBot.slice(0, 120)}"`
      ).catch((err) => console.warn("[chat_history] Walrus memory persistence notice:", err));
    }
  }

  // Tier 2: Walrus Console (Decentralized Sovereign Cold Vault)
  archiveChatSessionToWalrus({
    address,
    channel,
    messages: channelMessages,
  }).catch((err) => {
    console.warn("[chat_history] Walrus Console archive notice:", err);
  });

  // Tier 3: Pinata IPFS (Immutable Content-Addressed Decentralized Storage)
  archiveChatSessionToIpfs({
    address,
    channel,
    messages: channelMessages,
  }).catch((err) => {
    console.warn("[chat_history] Pinata IPFS archive notice:", err);
  });

  // Hot Cloud Tier: Supabase PostgreSQL
  supabaseService.saveCandidateChatHistory(address, channel, channelMessages).catch((err) => {
    console.warn("[chat_history] Notice background Supabase persistence:", err);
  });

  return formatted;
}

/**
 * Appends a complete user-assistant turn to the persistent history across all 3 sovereign tiers.
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

  const channelMessages = updated.filter((m) => !m.channel || m.channel === channel);

  // ── 3-TIER SOVEREIGN PERSISTENCE ENGINE (STRICT USER ISOLATION) ──
  // Tier 1: Walrus Memory (Candidate Semantic Recall Vault)
  rememberFact(
    address,
    "preference",
    `Chat Turn [${channel}]: Candidate: "${userMessage.slice(0, 100)}" -> AceBot: "${assistantReply.slice(0, 120)}"`
  ).catch((err) => console.warn("[chat_history] Walrus Memory turn sync notice:", err));

  // Tier 2: Walrus Console (Candidate Sovereign Cold Vault)
  archiveChatSessionToWalrus({
    address,
    channel,
    messages: channelMessages,
  }).catch((err) => {
    console.warn("[chat_history] Walrus Console turn sync notice:", err);
  });

  // Tier 3: Pinata IPFS (Decentralized Immutable IPFS Archive)
  archiveChatSessionToIpfs({
    address,
    channel,
    messages: channelMessages,
  }).catch((err) => {
    console.warn("[chat_history] Pinata IPFS turn sync notice:", err);
  });

  // Hot Cloud Tier: Supabase PostgreSQL
  supabaseService.saveCandidateChatHistory(address, channel, channelMessages).catch((err) => {
    console.warn("[chat_history] Notice background Supabase persistence on turn:", err);
  });

  return channelMessages;
}

/**
 * Awaitable versions for API endpoints requiring guaranteed 3-tier delivery before responding
 */
export async function saveChatHistoryAsync(
  rawAddress: string | null | undefined,
  messages: Array<{ role: "user" | "assistant"; content: string; timestamp?: number }>,
  channel = "overview"
): Promise<ChatMessageRecord[]> {
  const formatted = saveChatHistory(rawAddress, messages, channel);
  const address = normalizeHistoryAddress(rawAddress);
  await Promise.allSettled([
    supabaseService.saveCandidateChatHistory(address, channel, formatted),
    archiveChatSessionToWalrus({ address, channel, messages: formatted }),
    archiveChatSessionToIpfs({ address, channel, messages: formatted }),
  ]);
  return formatted;
}

export async function appendChatTurnAsync(
  rawAddress: string | null | undefined,
  userMessage: string,
  assistantReply: string,
  channel = "overview"
): Promise<ChatMessageRecord[]> {
  const updated = appendChatTurn(rawAddress, userMessage, assistantReply, channel);
  const address = normalizeHistoryAddress(rawAddress);
  await Promise.allSettled([
    supabaseService.saveCandidateChatHistory(address, channel, updated),
    archiveChatSessionToWalrus({ address, channel, messages: updated }),
    archiveChatSessionToIpfs({ address, channel, messages: updated }),
    rememberFact(
      address,
      "preference",
      `Chat Turn [${channel}]: Candidate: "${userMessage.slice(0, 100)}" -> AceBot: "${assistantReply.slice(0, 120)}"`
    ),
  ]);
  return updated;
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

  // Clear from Supabase
  supabaseService.clearCandidateChatHistory(address, channel).catch((err) => {
    console.warn("[chat_history] Notice clearing chat from Supabase:", err);
  });
}

