"use server";

import { revalidatePath } from "next/cache";
import { getOwnerAddress } from "@/lib/session.ts";
import {
  rememberFact,
  forgetFact as retract,
  recallProfile,
  recallFeedback,
  resolveConflicts,
  type FactKind,
} from "@/lib/memory-contract.ts";

async function requireAddress() {
  const address = await getOwnerAddress();
  if (!address) throw new Error("Not signed in");
  return address;
}

export async function saveFact(kind: FactKind, text: string, userTurn?: string) {
  const address = await requireAddress();
  return rememberFact(address, kind, text, { userTurn });
}

/** Everything currently stored about this student, conflicts already resolved. */
export async function listMemory() {
  const address = await requireAddress();
  const [profile, feedback] = await Promise.all([
    recallProfile(address, "exam target, misconceptions, weak topics and mastered topics"),
    recallFeedback(address, "recurring mistakes and study preferences"),
  ]);
  return {
    profile: resolveConflicts(profile),
    feedback: resolveConflicts(feedback),
  };
}

/**
 * Retracts a fact so nothing can recall it again.
 *
 * There is no delete anywhere in the SDK — only `MemWalMock` has a
 * `forget(blobId)`, so a delete-shaped call works offline and throws the first
 * time anyone presses the button against the live relayer. This writes a
 * tombstone that outranks the claim instead (see lib/facts.ts).
 *
 * It is not deletion and the copy must never call it that: the encrypted entry
 * stays on Walrus, under keys only the student holds, until its storage period
 * expires.
 */
export async function forgetFact(fact: string) {
  const address = await requireAddress();
  const outcome = await retract(address, fact);
  revalidatePath("/memory");
  revalidatePath("/tutor");
  return outcome;
}
