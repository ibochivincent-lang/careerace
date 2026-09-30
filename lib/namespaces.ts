/**
 * Namespaces are flat, opaque, exact-match strings. There is no hierarchy and
 * no normalization: "ExamAce:Profile" and "examace:profile" are two different
 * namespaces that can never see each other. Build them only through these
 * helpers so the convention holds everywhere.
 *
 * THE PREFIX IS A STORAGE KEY, NOT A NAME. Every fact already written lives
 * under `examace:profile:<address>` and nothing can reach it under any other
 * prefix. Renaming this would not migrate those memories — it would orphan
 * them, silently, leaving the record intact on Walrus and unreadable by the
 * app. There is no rename operation to undo it with.
 */
function scope(kind: string, address: string) {
  const addr = address.trim().toLowerCase();
  if (!addr) throw new Error("address required to build a namespace");
  return `careerace:${kind}:${addr}`;
}

/** Durable learner facts: exam target, misconceptions, weaknesses, mastery. */
export const profileNs = (address: string) => scope("profile", address);

/** Session evidence and standing study preferences. */
export const feedbackNs = (address: string) => scope("feedback", address);
