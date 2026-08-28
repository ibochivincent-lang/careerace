#!/usr/bin/env node
/**
 * ExamAce — MCP server.
 *
 * Exposes one student's learning memory to any MCP-speaking agent (Claude
 * Code, Cursor, a homework helper, another assistant) through the SAME
 * contract the web app uses. Nothing here reimplements the rules: recall
 * thresholds, duplicate detection, supersede stamping and the teaching screen
 * all come from ../lib.
 *
 * That is the point. Memory written by the web app is readable by your coding
 * agent; a misconception your coding agent spots is enforced by the web app's
 * teaching screen. The record is portable because it lives on Walrus, owned by
 * the student's own address — not inside either application.
 *
 *   MEMWAL_PRIVATE_KEY   delegate key (server-side only)
 *   MEMWAL_ACCOUNT_ID    the student's Walrus Memory account
 *   MEMWAL_SERVER_URL    relayer (defaults to staging)
 *   EA_OWNER_ADDRESS     whose memory this server speaks for
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
  recallProfile, recallFeedback, rememberFact, forgetFact, resolveConflicts,
  claimsOfKind, isOffTheRecord,
} from "../lib/memory-core.ts";
import { screenQuestion, buildTeachingConstraintsText, MISCONCEPTIONS } from "../lib/pedagogy.ts";
import { profileNs, feedbackNs } from "../lib/namespaces.ts";

const OWNER = process.env.EA_OWNER_ADDRESS;
if (!OWNER) {
  console.error("EA_OWNER_ADDRESS is required — the Sui address whose memory this server speaks for.");
  process.exit(1);
}
const owner: string = OWNER;

const text = (s: string) => ({ content: [{ type: "text" as const, text: s }] });
const fail = (s: string) => ({ content: [{ type: "text" as const, text: s }], isError: true });

/** Stored lines look like `2026-08-27 | misconception | thinks force = mass x velocity`. */
function render(facts: { text: string; distance: number }[]) {
  return facts.map((f) => `${f.text}   (distance ${f.distance.toFixed(3)})`).join("\n");
}

async function profile() {
  const learning = resolveConflicts(await recallProfile(owner, "exam target, misconceptions, weak and mastered topics")).active;
  const feedback = resolveConflicts(await recallFeedback(owner, "recurring mistakes and study preferences")).active;
  return {
    goal: claimsOfKind(learning, "goal"),
    misconceptions: claimsOfKind(learning, "misconception"),
    weaknesses: claimsOfKind(learning, "weakness"),
    mastery: claimsOfKind(learning, "mastery"),
    errorPatterns: claimsOfKind(feedback, "error_pattern"),
    preferences: claimsOfKind(feedback, "preference"),
    active: [...learning, ...feedback],
  };
}

const server = new McpServer(
  { name: "examace", version: "0.1.0" },
  { capabilities: { tools: {}, resources: {} } },
);

server.registerTool(
  "recall_memory",
  {
    title: "Recall learning memory",
    description:
      "Search this student's own learning memory by meaning. Returns dated facts — the exam they " +
      "are sitting, misconceptions they hold, weak topics, topics already mastered, recurring " +
      "mistakes and study preferences. Call this BEFORE explaining any topic, setting a question " +
      "or planning a session. Results are already filtered for relevance and conflict-resolved, " +
      "so a newer fact has already beaten an older contradicting one.",
    inputSchema: {
      query: z.string().describe("What you want to know, in plain words. e.g. 'where do they go wrong in physics?'"),
      scope: z.enum(["profile", "feedback", "both"]).default("both")
        .describe("profile = exam target, misconceptions, weaknesses, mastery; feedback = error patterns and preferences"),
    },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  async ({ query, scope }) => {
    try {
      const want = scope ?? "both";
      const [p, f] = await Promise.all([
        want === "feedback" ? [] : recallProfile(owner, query),
        want === "profile" ? [] : recallFeedback(owner, query),
      ]);
      const active = [...resolveConflicts(p).active, ...resolveConflicts(f).active];
      if (!active.length) {
        return text(
          "No relevant memory found. Do not assume they have no difficulties — it usually means " +
          "nobody has asked them yet. Ask once before teaching.",
        );
      }
      return text(`${active.length} fact(s) recalled for ${owner}:\n\n${render(active)}`);
    } catch (e) {
      return fail(`Recall failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  },
);

server.registerTool(
  "remember_fact",
  {
    title: "Remember a learning fact",
    description:
      "Store a durable fact about this student. Write ONLY: a wrong model they hold " +
      "(misconception), a topic they just demonstrated (mastery), a topic they say they struggle " +
      "with (weakness), the exam they are sitting (goal), a recurring mistake shape " +
      "(error_pattern), or a standing teaching preference (preference); or an explicit statement " +
      "that they have none of these yet (clearance). NEVER write moods, small talk, your own " +
      "explanations, a single slip that is not yet a pattern, or anything from a turn where they " +
      "said not to save it. Writes reconcile automatically: an identical fact is skipped rather " +
      "than duplicated, and a contradicting one supersedes the old.",
    inputSchema: {
      kind: z.enum(["misconception", "mastery", "weakness", "goal", "error_pattern", "preference", "clearance"]),
      fact: z.string().describe("The fact in plain words, third person, no date. e.g. 'thinks force = mass x velocity'"),
      user_turn: z.string().optional()
        .describe("The student's own words this came from. Used to honour 'don't save that'."),
    },
    annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async ({ kind, fact, user_turn }) => {
    try {
      if (user_turn && isOffTheRecord(user_turn)) {
        return text("Not stored — they asked for this to stay off the record.");
      }
      const r = await rememberFact(owner, kind, fact, { userTurn: user_turn });
      if (r.status === "skipped") {
        return text(
          r.reason === "duplicate"
            ? `Already known, nothing written:\n${r.existing}`
            : "Not stored — they asked for this to stay off the record.",
        );
      }
      return text(
        `Stored in ${r.namespace}:\n${r.text}` +
        (r.supersedes ? `\n\nThis supersedes:\n${r.supersedes}` : ""),
      );
    } catch (e) {
      return fail(`Write failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  },
);

server.registerTool(
  "check_question",
  {
    title: "Check an explanation or question against their memory",
    description:
      "Screen a question, explanation or study plan against everything stored about this student. " +
      "This is a DETERMINISTIC check — it matches text against their recorded misconceptions, " +
      "mastered topics and exam scope, it does not ask a model. Run it on anything you are about " +
      "to send. UNSAFE means: it restates a misconception they hold without contradicting it, it " +
      "hands over the answer, or it leaves their exam syllabus. Do not send it; rewrite and " +
      "screen again.",
    inputSchema: {
      text: z.string().describe("The question or explanation to screen, e.g. 'Force is mass times velocity, so...'"),
    },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  async ({ text: candidate }) => {
    try {
      const p = await profile();
      const verdict = screenQuestion(candidate, p);

      const redundantNote = verdict.redundant.length
        ? `\nNote: this covers ground they have already mastered (${verdict.redundant.join(", ")}). ` +
          `Not unsafe, just a wasted session — build on it instead of re-teaching it.`
        : "";

      if (verdict.safe) {
        return text(
          `SAFE — nothing in this collides with their stored record.\n` +
          `Screened against misconceptions [${p.misconceptions.join(", ") || "none"}], ` +
          `mastery [${p.mastery.join(", ") || "none"}] and goal [${p.goal.join(", ") || "none"}].` +
          redundantNote,
        );
      }

      return text(
        `UNSAFE — do not send this.\n` +
        (verdict.reinforced.length
          ? `Restates a misconception they hold without contradicting it: ` +
            `${verdict.reinforced.map((k) => MISCONCEPTIONS[k]?.label ?? k).join(", ")}\n`
          : "") +
        (verdict.answerReveals.length
          ? `Hands over the answer: "${verdict.answerReveals.join('", "')}". Ask the question that makes them find it.\n`
          : "") +
        (verdict.offSyllabus.length
          ? `Outside their exam scope: ${verdict.offSyllabus.join(", ")}\n`
          : "") +
        redundantNote +
        `\nConstraints on file:\n${buildTeachingConstraintsText(p)}`,
      );
    } catch (e) {
      return fail(`Screening failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  },
);

server.registerTool(
  "forget_fact",
  {
    title: "Retract a stored fact",
    description:
      "Retract a fact this student says is no longer true, or has asked you to forget. Going " +
      "quiet about a fact is NOT the same as retracting it — an un-retracted fact comes back " +
      "on the next recall, in the next session, forever. " +
      "This writes a retraction that outranks the claim, so nothing can read it again. It does " +
      "NOT erase: the original entry stays encrypted on Walrus under their own keys until its " +
      "storage period expires. Say that plainly if they ask. " +
      "Do NOT use this for a misconception they have since fixed — that is a NEW mastery fact " +
      "with a newer date, and the newer date wins on its own.",
    inputSchema: {
      fact: z.string().describe("The claim to retract, in their words. e.g. 'the force thing'"),
    },
    annotations: { destructiveHint: true, idempotentHint: true, openWorldHint: true },
  },
  async ({ fact }) => {
    try {
      const r = await forgetFact(owner, fact);
      if (r.status === "not-found") {
        return text(`Nothing close to "${fact}" is stored, so there is nothing to retract.`);
      }
      return text(
        `Retracted in ${r.namespace}:\n${r.target}\n\n` +
        `Written as:\n${r.tombstone}\n\n` +
        `It will not be recalled again. The original entry is still on Walrus, encrypted, ` +
        `until its storage period expires — it is out of reach, not erased.`,
      );
    } catch (e) {
      return fail(`Retraction failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  },
);

server.registerTool(
  "list_memory",
  {
    title: "List what recall can reach",
    description:
      "Everything two deliberately broad recalls can reach across both namespaces, with " +
      "superseded and retracted entries shown separately. Use when they ask what the tutor " +
      "knows. Note this is a recall, not an index dump — the SDK has no list operation, so " +
      "present it as what the tutor can currently see rather than as a complete record.",
    inputSchema: {},
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  async () => {
    try {
      const [p, f] = await Promise.all([
        recallProfile(owner, "exam target, misconceptions, weak topics and mastered topics"),
        recallFeedback(owner, "recurring mistakes and study preferences"),
      ]);
      const P = resolveConflicts(p);
      const F = resolveConflicts(f);
      const superseded = [...P.superseded, ...F.superseded];
      const retracted = [...P.retracted, ...F.retracted];
      const active = [...P.active, ...F.active];

      if (!active.length && !superseded.length && !retracted.length) {
        return text(`Nothing stored yet for ${owner}.`);
      }
      return text(
        `Memory for ${owner} — what recall can reach right now, not an index dump.\n` +
        `  ${profileNs(owner)}\n  ${feedbackNs(owner)}\n\n` +
        `ACTIVE (${active.length})\n${render(active) || "  none"}` +
        (superseded.length ? `\n\nSUPERSEDED (${superseded.length}) — kept, but outranked by a newer fact\n${render(superseded)}` : "") +
        (retracted.length ? `\n\nRETRACTED (${retracted.length}) — they took these back; still on Walrus, never read\n${render(retracted)}` : ""),
      );
    } catch (e) {
      return fail(`Listing failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  },
);

server.registerResource(
  "learner-profile",
  "examace://profile",
  {
    title: "Learner profile",
    description: "The student's exam target, misconceptions, weaknesses and mastery, distilled from their memory.",
    mimeType: "application/json",
  },
  async (uri) => {
    const { goal, misconceptions, weaknesses, mastery, errorPatterns, preferences } = await profile();
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(
          { owner, goal, misconceptions, weaknesses, mastery, errorPatterns, preferences },
          null,
          2,
        ),
      }],
    };
  },
);

// stdout carries the MCP protocol — anything we say goes to stderr.
await server.connect(new StdioServerTransport());
console.error(`examace MCP ready for ${owner}`);
