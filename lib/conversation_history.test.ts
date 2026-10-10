import test from "node:test";
import assert from "node:assert/strict";
import {
  groupMessagesByDay,
  formatDayLabel,
  searchConversationSessions,
  formatTranscriptToMarkdown,
  getSampleHistoricalSessions,
  buildRollingSevenDaySessions,
  getTodayDateKey,
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
  assert.equal(sessions.length, 6, "Should pre-seed 6 historical daily sessions covering Days -1 through -6");

  const matched = searchConversationSessions(sessions, "amazon");
  assert.equal(matched.length, 1, "Should find session mentioning amazon");

  const none = searchConversationSessions(sessions, "nonexistentquery123");
  assert.equal(none.length, 0, "Should return empty array when no keyword matches");
});

test("Daily Conversation History: strictly prunes messages older than 7 calendar days", () => {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const validMessage: DailyChatMessage = {
    role: "user",
    content: "Valid 3-day old question",
    timestamp: now - 3 * dayMs,
  };

  const oldMessage: DailyChatMessage = {
    role: "user",
    content: "Expired 9-day old question that should be pruned",
    timestamp: now - 9 * dayMs,
  };

  const sessions = groupMessagesByDay([validMessage, oldMessage], now);
  assert.equal(sessions.length, 1, "Only the 3-day session should survive retention");
  assert.ok(sessions[0].firstQuery.includes("Valid 3-day old question"));
  assert.equal(sessions[0].messages.length, 1);
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

test("Daily Conversation History: buildRollingSevenDaySessions preserves all 7 calendar days even when selecting or restoring individual day", () => {
  const now = Date.now();
  const todayKey = getTodayDateKey(now);

  // User only has a single message from 2 days ago (e.g. October 8)
  const twoDaysAgoTs = now - 2 * 24 * 60 * 60 * 1000;
  const singleDayMessages: DailyChatMessage[] = [
    {
      role: "user",
      content: "Can I get a full list of jobs I applied for?",
      timestamp: twoDaysAgoTs,
    },
    {
      role: "assistant",
      content: "Here are all your sovereign applications.",
      timestamp: twoDaysAgoTs + 5000,
    },
  ];

  const rollingSessions = buildRollingSevenDaySessions(
    singleDayMessages,
    {},
    "Candidate",
    "Specialist",
    now
  );

  assert.equal(rollingSessions.length, 7, "Must contain all 7 days in the rolling retention window");

  const todaySession = rollingSessions.find((s) => s.isToday);
  assert.ok(todaySession, "Today (Day 0) must NEVER disappear when selecting/restoring past day");
  assert.equal(todaySession.dateKey, todayKey);

  const yesterdaySession = rollingSessions.find((s) => s.isYesterday);
  assert.ok(yesterdaySession, "Yesterday (Day 1) must be preserved");

  const twoDaysAgoSession = rollingSessions.find((s) => !s.isToday && !s.isYesterday && s.messages.some((m) => m.content.includes("full list of jobs")));
  assert.ok(twoDaysAgoSession, "Past session must contain the user messages");
  assert.equal(twoDaysAgoSession.messages.length, 2);
});

