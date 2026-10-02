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
      kind: z.enum([
        "experience",
        "education",
        "skill",
        "target_role",
        "tailored_cv",
        "application",
        "interview_feedback",
        "preference",
        "clearance",
        "misconception",
        "mastery",
        "weakness",
        "goal",
        "error_pattern",
      ]),
      text: z.string().describe("The fact in plain words, third person, no date."),
    }),
  ),
});

const EXTRACTION_PROMPT = `You extract durable career facts from one turn of a career coaching, STAR+R interview prep, or CV review conversation with a candidate.

WRITE a fact only when the turn gives you one of these:
- experience:         a specific work role, project, accomplishment, or metric the candidate
                      describes ("led frontend migration to Next.js 16 reducing load times by 40%").
- education:          degree, certification, bootcamp, or university credential
                      ("B.S. in Computer Science from Stanford University").
- skill:              a demonstrated or claimed technical, engineering, or leadership skill
                      ("TypeScript, React, Sui Move, and distributed systems").
- target_role:        the role title, seniority, industry, or compensation target they seek
                      ("Senior Fullstack Engineer in Web3 or AI platforms").
- tailored_cv:        a refined bullet point or tailored section approved by the candidate.
- application:        a specific job application status or company applied to
                      ("applied to Vercel for Senior Platform Engineer").
- interview_feedback: a STAR+R interview prep assessment, identified gap, or demonstrated strength
                      ("demonstrated strong Situation & Task in incident management; needs quantified Result metric").
- preference:         a standing career preference regarding remote work, team culture, or tech stack
                      ("prefers remote-first teams with asynchronous workflows").
- clearance:          an explicit statement that they have no restrictions or no preferences
                      ("open to worldwide remote roles", "no salary floor stated").
- weakness:           a skill, interview question, or technical area they say they struggle with.
- mastery:            a domain or topic they demonstrate complete mastery of.

NEVER write one-off moods, conversational pleasantries, or assistant suggestions. Only record facts asserted or demonstrated by the candidate.
Return an empty array when the turn contains none of the above.`;

/**
 * `assistantAsked` is the copilot's previous turn.
 *
 * Without it a short answer is unextractable. The copilot asks what role or seniority
 * they are targeting, so a concise reply like "Staff AI Engineer, Remote" can be
 * resolved against the question. The question is passed as context so the answer
 * is accurately classified without treating the question itself as a candidate fact.
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
