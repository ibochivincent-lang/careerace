import "server-only";
import { z } from "zod";
import { generateObject } from "ai";
import { extractModel, chatModel, describeModel } from "./model.ts";
import type { FactKind } from "./memory_contract.ts";

/**
 * The WRITE GATE.
 *
 * Deliberately NOT `withMemWal({ autoSave: true })`. Auto-save extracts facts
 * from every turn, which would happily persist "I'm tired, let's do this
 * tomorrow" into a learning record. The rules below are the graded part of
 * this project, so they are enforced explicitly rather than delegated to
 * middleware.
 */

const FactSchema = z.object({
  facts: z.array(
    z.object({
      kind: z.enum(["misconception", "mastery", "weakness", "goal", "error_pattern", "preference", "clearance"]),
      text: z.string().describe("The fact in plain words, third person, no date."),
    }),
  ),
});

const EXTRACTION_PROMPT = `You extract durable facts from one turn of a tutoring conversation with a Nigerian secondary-school student preparing for JAMB, WAEC, NECO or Post-UTME.

WRITE a fact only when the turn gives you one of these:
- misconception: a wrong mental model the STUDENT holds, shown either by them
                 saying it outright ("force is mass times velocity, abi?") or by
                 them describing their own confusion ("I always think weight is
                 in kilograms"). Write it as what they think:
                 "thinks force = mass x velocity". This is the most valuable
                 thing you can record - a tutor that does not know it will
                 re-explain the topic in the exact words that produced it.
- mastery:       a topic they have just DEMONSTRATED they understand, by
                 explaining it correctly or correcting themselves. Not "I get
                 it" - that is a feeling. Write the topic: "newton's second law".
- weakness:      a topic or skill they say they struggle with ("I'm terrible at
                 titration calculations"). Write the topic, not a sentence.
- goal:          the exam they are sitting and when ("JAMB - April 2026"), or
                 the subjects they are taking.
- error_pattern: a recurring MISTAKE SHAPE rather than a topic - unit confusion,
                 sign errors, misreading the command word, always falling for
                 the same distractor. Write it plainly: "unit confusion",
                 "sign errors in kinematics".
- preference:    a STANDING preference about how they want to be taught ("give
                 me the worked example first", "don't write long paragraphs",
                 "explain it in pidgin"). Durable, not a mood.
- clearance:     an explicit statement that they have NO exam date yet, or no
                 particular weak topic ("I haven't registered for anything",
                 "nothing is really giving me trouble"). Write it as "no exam
                 date set" or "no weak topic reported". This is a real fact, not
                 an absence of one. Recording it is what stops the tutor asking
                 the same question every session.

A WRONG ASSERTION IS A MISCONCEPTION. If the student states something about the
subject that is simply false - "current gets used up in the bulb", "mitosis
gives you gametes" - that is evidence about their model, and you write it as
"thinks current is used up in the bulb". Do not skip it because they were
guessing; a guess they reached for twice is exactly the thing that costs them
marks.

CARRY THE HEDGE. "I think I mix up mass and weight" is real and gets written,
with the doubt kept in the text: "may confuse mass and weight". Do not discard
it as vagueness. The cost of storing an uncertainty that turns out to be
nothing is that they correct it later.

TELL A PREFERENCE FROM A MOOD. A preference is durable and about them ("I learn
better from diagrams", "I never do theory before questions"). A mood is about
right now ("I'm tired", "not in the mood for chemistry today"). Write the first,
never the second.

NEVER write:
- one-off moods, tiredness, "let's stop for today"
- small talk, greetings, thanks
- anything the ASSISTANT said. Only what the STUDENT asserted or demonstrated.
  Your own explanation is not evidence about their understanding.
- a single wrong answer on its own. One slip is not a pattern. Write an
  error_pattern only when they say it keeps happening, or the turn shows the
  same mistake shape they already described.
- hypotheticals about a state they do NOT claim ("what if someone thought force
  was mv?"). The line is whether they are talking about their own head.

ANCHOR TIME. They speak in relative time; a record read a year later cannot.
Resolve "my exam is next month" or "after third term" to an absolute date and
store the resolved form ("JAMB - April 2026"). If you cannot tell which year
they mean, leave the date out. Never guess a date.

ONE TURN CAN CARRY TWO FACTS. "I'm writing JAMB in April but chemistry
calculations kill me" is a goal AND a weakness - return both. Do not stop at
the first.

RESOLVE SHORT ANSWERS AGAINST THE QUESTION. You may be given the assistant's
previous question. A reply like "none really", "no", "April" or "just physics"
only means something next to what was asked. If the question asked which exam
and which topic is hardest and they answer "none really", that is a clearance:
"no weak topic reported".

The question is CONTEXT ONLY. Never write a fact the assistant suggested or
implied - only what the STUDENT asserted about themselves in their own turn.

Return an empty array when the turn contains none of the above. An empty array
is the correct and common answer. Do not invent facts to seem useful.`;

/**
 * `assistantAsked` is the tutor's previous turn.
 *
 * Without it a short answer is unextractable. The tutor asks what they are
 * preparing for before it plans anything, so the most important turn in the
 * whole conversation is often a bare "JAMB, April" — which, read on its own,
 * asserts very little. The question is passed as context so the answer can be
 * resolved against it, and the prompt forbids treating anything in the
 * question itself as a fact.
 */
export async function extractFacts(
  userTurn: string,
  assistantAsked?: string,
): Promise<Array<{ kind: FactKind; text: string }>> {
  const prompt = assistantAsked?.trim()
    ? `The assistant asked:\n"""\n${assistantAsked.trim()}\n"""\n\nThe student replied:\n"""\n${userTurn}\n"""`
    : userTurn;

  const run = async (model: Awaited<ReturnType<typeof extractModel>>) => {
    const { object } = await generateObject({
      model,
      schema: FactSchema,
      system: EXTRACTION_PROMPT,
      prompt,
    });
    return object.facts;
  };

  const described = await describeModel().catch(() => null);

  try {
    return await run(await extractModel());
  } catch (error) {
    // Extraction follows the chosen chat model, so the two ids are usually
    // identical. Retrying the same model on the same prompt is not a fallback,
    // it is just a second bill — only retry when EA_EXTRACT_MODEL actually
    // pointed the gate somewhere else.
    if (!described || described.extract === described.chat) throw error;
    /*
     * When that id is retired or unavailable on the account, every single turn
     * fails to save while the conversation itself looks perfectly healthy.
     * That is exactly the failure this fallback exists for. The chat model is
     * known good: it just answered.
     */
    console.warn(
      `[examace] extraction model ${described?.extract ?? "(unknown)"} failed ` +
        `(${error instanceof Error ? error.message : String(error)}) — ` +
        `retrying on the chat model ${described?.chat ?? ""}.`,
    );
    try {
      return await run(await chatModel());
    } catch (fallbackError) {
      const first = error instanceof Error ? error.message : String(error);
      const second = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      throw new Error(
        `extraction failed on ${described?.extract ?? "extract model"} (${first}); ` +
          `retry on ${described?.chat ?? "chat model"} also failed (${second})`,
      );
    }
  }
}
