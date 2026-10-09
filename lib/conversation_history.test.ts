import test from "node:test";
import assert from "node:assert/strict";
import {
  groupMessagesByDay,
  formatDayLabel,
  searchConversationSessions,
  formatTranscriptToMarkdown,
  getSampleHistoricalSessions,
  type DailyChatMessage,
} from "./conversation_history.ts";

test("Daily Conversation History: correctly groups messages into day sessions", () => {
  const now = new Date();
  const todayTs = now.getTime();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayTs = yesterday.getTime();

  const sampleMessages: DailyChatMessage[] = [
    {
      role: "user",
      content: "What jobs can I apply for today?",
      timestamp: todayTs - 10000,
    },
    {
      role: "assistant",
      content: "Found 8 corporate hiring desks.",
      timestamp: todayTs,
    },
    {
      role: "user",
      content: "Can you review my marine qualifications?",
      timestamp: yesterdayTs - 20000,
    },
    {
      role: "assistant",
      content: "Marine engineering qualifications verified.",
      timestamp: yesterdayTs,
    },
  ];

  const sessions = groupMessagesByDay(sampleMessages);
  assert.equal(sessions.length, 2, "Should group into exactly 2 daily sessions (Today & Yesterday)");

  const todaySession = sessions.find((s) => s.isToday);
  assert.ok(todaySession, "Must include Today's session");
  assert.equal(todaySession.messageCount, 2);
  assert.equal(todaySession.turnCount, 1);
  assert.ok(todaySession.firstQuery.includes("What jobs can I apply for today?"));

  const yesterdaySession = sessions.find((s) => s.isYesterday);
  assert.ok(yesterdaySession, "Must include Yesterday's session");
  assert.equal(yesterdaySession.messageCount, 2);
  assert.ok(yesterdaySession.firstQuery.includes("marine qualifications"));
});

test("Daily Conversation History: searches sessions across queries and keywords", () => {
  const sessions = getSampleHistoricalSessions("Alex Candidate", "Cloud Engineer");
  assert.equal(sessions.length, 1);

  const matched = searchConversationSessions(sessions, "amazon");
  assert.equal(matched.length, 1, "Should find session mentioning amazon");

  const none = searchConversationSessions(sessions, "nonexistentquery123");
  assert.equal(none.length, 0, "Should return empty array when no keyword matches");
});

test("Daily Conversation History: formats transcript into clean markdown", () => {
  const sessions = getSampleHistoricalSessions("Vincent", "Cloud Architect");
  const md = formatTranscriptToMarkdown(sessions[0], "Vincent");

  assert.ok(md.includes("# CareerAce Copilot – Daily Conversation Transcript"));
  assert.ok(md.includes("Vincent"));
  assert.ok(md.includes("Walrus Sovereign Memory Sealed"));
  assert.ok(md.includes("Cloud Architect"));
});

test("Daily Conversation History: formats day labels accurately", () => {
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const info = formatDayLabel(todayKey);

  assert.equal(info.isToday, true);
  assert.equal(info.isYesterday, false);
  assert.ok(info.label.startsWith("Today"));
});
