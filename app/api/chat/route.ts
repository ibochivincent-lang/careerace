import { streamText, StreamData } from "ai";
import { chatModel, describeModel } from "@/lib/model.ts";
import { getOwnerAddress } from "@/lib/session.ts";
import {
  recallLearning, recallPreferences, recallFeedback, resolveConflicts,
  rememberFact, isOffTheRecord, claimsOfKind, unionFacts,
} from "@/lib/memory-contract.ts";
import { extractFacts } from "@/lib/extract.ts";
import { buildTeachingConstraintsText } from "@/lib/pedagogy.ts";

export const maxDuration = 60;

const BASE_PROMPT = [
  "You are ExamAce, a Socratic tutor for Nigerian students sitting JAMB, WAEC, NECO and Post-UTME.",
  "You teach by asking. Lead the student to the answer with one question at a time; never hand it over. When they get there, say so plainly and move on.",
  // The failure this exists to stop: a full topic explanation delivered to a
  // student whose misconception about that exact topic is sitting in the
  // record, unread. Explaining is the whole point of the app, so the rule has
  // to be explicit or the model does it anyway.
  "CHECK WHAT YOU ALREADY KNOW BEFORE YOU ASK. The block below is their own stored record, carried across every session. If it names a misconception, a weak topic or an exam target, you have already been told - use it and do not ask again. Making someone re-explain their own confusion every session is the one thing this app exists to prevent.",
  "ASK ONLY WHEN THE RECORD IS EMPTY. If it holds nothing about their exam or their weak topics, your first reply is a question, not a lesson. One short question covering both, and say they only have to tell you once.",
  "When you use a stored fact, say so in passing - 'last time you had force as mass times velocity, so let's test that' - so they can see the memory working and correct it if it is wrong.",
  "Do not pad that question with a sample lesson, a practice question, or 'in the meantime, try this'. Content attached to the question defeats it.",
  "Once you know - including when they tell you they have no exam date - teach normally and do not ask again.",
  "A stored misconception is never restated as true, not even to paraphrase them. Name it as the wrong model and find the case where it breaks.",
  "Respect their stated learning preferences. A preference changes how you explain, never whether you correct them.",
  "Hedging matters. If they answer with 'I think', 'maybe' or 'abi', treat the answer as unstable even when it is right, and ask them to justify it before you confirm.",
  "Keep every reply under 110 words.",
  "If the student says a stored fact is wrong or asks you to forget it, tell them to retract it on the memory page - deciding privately to stop mentioning it changes nothing, because the record outlives this conversation.",
].join(" ");

export async function POST(req: Request) {
  const address = await getOwnerAddress();
  if (!address) return new Response("Not signed in", { status: 401 });

  const { messages } = await req.json();
  const latest: string = messages.at(-1)?.content ?? "";
  /*
   * The tutor's previous turn. Needed because it ASKS what they are preparing
   * for before it teaches anything, so the reply that matters most is often a
   * bare "JAMB, April" — meaningless to the extractor on its own.
   */
  const asked: string = [...messages]
    .slice(0, -1)
    .reverse()
    .find((m: { role: string }) => m.role === "assistant")?.content ?? "";

  /*
   * ONE recall pass per turn, in parallel. Never recall per-route.
   *
   * The profile namespace is read with a STABLE query, never the student's
   * turn. Recall is a similarity search with a relevance floor, so querying
   * with "explain projectile motion" pushes `misconception | thinks force =
   * mass x velocity` below the floor and the tutor teaches straight into it.
   * A misconception is not relevant only when it is mentioned.
   *
   * Feedback is read twice and merged: a stable query so standing preferences
   * and error patterns always apply, plus the student's own words so something
   * from a past session surfaces when it comes up again.
   *
   * This FAILS CLOSED. If the record is unreachable we do not quietly teach as
   * though the student had no history — re-teaching into a misconception is
   * exactly the hazard this app exists to remove. Say so and stop.
   */
  let learning, feedback;
  try {
    const [durable, standing, topical] = await Promise.all([
      recallLearning(address),
      recallPreferences(address),
      recallFeedback(address, latest),
    ]);
    learning = durable;
    feedback = unionFacts(standing, topical);
  } catch (error) {
    console.error("recall failed", error);
    return new Response(
      "I can't reach your learning record right now, so I won't guess at what you already know. Try again in a moment.",
      { status: 503 },
    );
  }

  const activeLearning = resolveConflicts(learning).active;
  const activeFeedback = resolveConflicts(feedback).active;
  const profile = {
    goal: claimsOfKind(activeLearning, "goal"),
    misconceptions: claimsOfKind(activeLearning, "misconception"),
    weaknesses: claimsOfKind(activeLearning, "weakness"),
    mastery: claimsOfKind(activeLearning, "mastery"),
    errorPatterns: claimsOfKind(activeFeedback, "error_pattern"),
    preferences: claimsOfKind(activeFeedback, "preference"),
    // An explicit "I have no exam date yet" is a fact we stored. Without
    // reading it back, the tutor cannot distinguish "they told us" from "we
    // never asked", and would interrogate them again every session.
    cleared: claimsOfKind(activeLearning, "clearance").length > 0,
  };

  const memoryBlock = [...activeLearning, ...activeFeedback].length
    ? `WHAT YOU ALREADY KNOW ABOUT THIS STUDENT (from their own stored memory, carried across sessions):\n${
        [...activeLearning, ...activeFeedback].map((f) => `- ${f.text}`).join("\n")
      }\nThese were retrieved for THIS turn regardless of what was asked. Use them without asking the student to repeat them. If two facts disagree, trust the newer date and say so out loud.`
    : "You have no stored facts about this student yet. This is a genuinely empty record, not a failed lookup - the exam target and misconceptions are fetched every turn with a fixed query, so an empty list means they have never told you.";

  const system = [
    BASE_PROMPT,
    memoryBlock,
    buildTeachingConstraintsText(profile),
  ].join("\n\n");

  // Resolve the model BEFORE starting the write path, so a missing provider key
  // is one readable sentence instead of an opaque 500. This is the first thing
  // anyone running the project from a fresh clone will hit.
  let model, described;
  try {
    model = await chatModel();
    described = await describeModel();
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "No model provider configured.",
      { status: 503 },
    );
  }

  /*
   * Ship the provenance with the answer. The UI renders one chip per fact the
   * reply was actually built from, so "it remembered" is something the student
   * can see and check rather than take on trust — and if the tutor gets it
   * wrong, the chips show exactly which stored fact misled it.
   */
  const data = new StreamData();
  data.appendMessageAnnotation({
    recalled: [...activeLearning, ...activeFeedback].map((f) => ({
      text: f.text,
      distance: f.distance,
    })),
    provider: described.provider,
    model: described.chat,
  });

  // Write path runs alongside generation, gated by the extraction rules. It is
  // started now so extraction overlaps the answer, but AWAITED before the
  // stream closes: the client refreshes its memory rail on finish, and a rail
  // read that races the write shows "nothing stored yet" for a fact that is
  // about to land.
  const writing = persist(address, latest, asked);

  const result = streamText({
    model,
    system,
    messages,
    onFinish: async () => {
      const stored = await writing;
      // Report what the turn actually did with memory. Silence here is what
      // makes a failed write indistinguishable from a turn with nothing to save.
      data.appendMessageAnnotation({ stored });
      data.close();
    },
  });
  return result.toDataStreamResponse({ data });
}

type StoredReport = { written: string[]; failed: string | null };

/**
 * Returns what happened rather than swallowing it. A write that fails silently
 * in a learning record is worse than one that fails loudly: the student carries
 * on believing the tutor has understood where they went wrong.
 */
async function persist(address: string, userTurn: string, asked: string): Promise<StoredReport> {
  const written: string[] = [];
  try {
    if (!userTurn.trim() || isOffTheRecord(userTurn)) return { written, failed: null };
    const facts = await extractFacts(userTurn, asked);
    for (const fact of facts) {
      const outcome = await rememberFact(address, fact.kind, fact.text, { userTurn });
      if (outcome.status === "written") written.push(`${fact.kind}: ${fact.text}`);
    }
    return { written, failed: null };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[examace] memory write failed:", detail);
    return { written, failed: detail };
  }
}
