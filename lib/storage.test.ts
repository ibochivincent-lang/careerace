import test from "node:test";
import assert from "node:assert/strict";

// Polyfill minimal localStorage for Node test runner environment if absent
if (typeof globalThis.localStorage === "undefined") {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, value: string) => { store.set(key, String(value)); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store.clear(); },
    key: (index: number) => Array.from(store.keys())[index] || null,
    length: 0,
  } as any;
}

import {
  getSessions,
  saveSessions,
  getStreak,
  updateStreakOnStudy,
  getStoredNotifications,
  addNotification,
  markNotificationRead,
  getDailyGoal,
  updateDailyGoal,
  clearAllData,
} from "./storage.ts";

test("Storage Engine: session management operates cleanly", () => {
  clearAllData();
  const initial = getSessions();
  assert.deepStrictEqual(initial, []);

  const sampleSession: any = {
    id: "sess_01",
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    durationMinutes: 45,
  };

  saveSessions([sampleSession]);
  const fetched = getSessions();
  assert.strictEqual(fetched.length, 1);
  assert.strictEqual(fetched[0].id, "sess_01");
});

test("Storage Engine: streak progression increments on daily study", () => {
  clearAllData();
  assert.strictEqual(getStreak(), 0);

  const newStreak = updateStreakOnStudy();
  assert.strictEqual(newStreak, 1);
  assert.strictEqual(getStreak(), 1);
});

test("Storage Engine: notifications and daily goals update cleanly", () => {
  clearAllData();
  addNotification({
    type: "streak",
    title: "Keep it up!",
    body: "You completed your daily study goal.",
  });

  const notifs = getStoredNotifications();
  assert.strictEqual(notifs.length, 1);
  assert.strictEqual(notifs[0].read, false);

  markNotificationRead(notifs[0].id);
  const afterRead = getStoredNotifications();
  assert.strictEqual(afterRead[0].read, true);

  // Goal updates
  const goal = getDailyGoal();
  assert.strictEqual(typeof goal.targetMinutes, "number");

  updateDailyGoal({ completedMinutes: 20 });
  const updatedGoal = getDailyGoal();
  assert.strictEqual(updatedGoal.completedMinutes, 20);

  clearAllData();
});
