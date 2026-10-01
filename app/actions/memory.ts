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
} from "@/lib/memory_contract.ts";

async function requireAddress() {
  const address = await getOwnerAddress();
  if (!address) throw new Error("Not signed in");
  return address;
}

export async function saveFact(kind: FactKind, text: string, userTurn?: string) {
  const address = await requireAddress();
  return rememberFact(address, kind, text, { userTurn });
}

/** Everything currently stored in this candidate's career vault, conflicts already resolved. */
export async function listMemory() {
  const address = await requireAddress();
  const [profile, feedback] = await Promise.all([
    recallProfile(address, "target role, work experience, education, technical skills and verified accomplishments"),
    recallFeedback(address, "interview feedback, STAR+R coaching assessments, job application history and career preferences"),
  ]);
  return {
    profile: resolveConflicts(profile),
    feedback: resolveConflicts(feedback),
  };
}

/**
 * Batch-index candidate profile attributes (skills, experience, education, target roles)
 * into Walrus Memory.
 */
export async function indexCandidateProfile(profileData: {
  skills?: string[];
  target_roles?: string[];
  work_experience?: Array<{ role: string; company: string; duration?: string; highlights?: string[] }>;
  academic_history?: Array<{ degree: string; institution: string; graduation_year?: string }>;
}) {
  const address = await requireAddress();
  const writes: Promise<any>[] = [];

  if (profileData.target_roles && Array.isArray(profileData.target_roles)) {
    for (const role of profileData.target_roles.slice(0, 3)) {
      if (role && role.trim()) {
        writes.push(rememberFact(address, "target_role", `Target role: ${role.trim()}`));
      }
    }
  }

  if (profileData.skills && Array.isArray(profileData.skills)) {
    for (const skill of profileData.skills.slice(0, 10)) {
      if (skill && skill.trim()) {
        writes.push(rememberFact(address, "skill", `Skill: ${skill.trim()}`));
      }
    }
  }

  if (profileData.work_experience && Array.isArray(profileData.work_experience)) {
    for (const exp of profileData.work_experience.slice(0, 3)) {
      if (exp.role && exp.company) {
        const summary = `${exp.role.trim()} at ${exp.company.trim()}${exp.duration ? ` (${exp.duration.trim()})` : ""}`;
        writes.push(rememberFact(address, "experience", summary));
      }
    }
  }

  if (profileData.academic_history && Array.isArray(profileData.academic_history)) {
    for (const edu of profileData.academic_history.slice(0, 2)) {
      if (edu.degree && edu.institution) {
        const summary = `${edu.degree.trim()} from ${edu.institution.trim()}${edu.graduation_year ? ` (${edu.graduation_year.trim()})` : ""}`;
        writes.push(rememberFact(address, "education", summary));
      }
    }
  }

  await Promise.allSettled(writes);
  revalidatePath("/memory");
  revalidatePath("/application_board");
  revalidatePath("/interview_room");
  revalidatePath("/");
  return { success: true, count: writes.length };
}

/**
 * Retracts a fact so nothing can recall it again.
 *
 * There is no delete anywhere in the SDK — this writes a tombstone that outranks
 * the claim instead (see lib/facts.ts).
 *
 * It is not deletion: the encrypted entry stays on Walrus, under keys only the candidate
 * holds, until its storage period expires.
 */
export async function forgetFact(fact: string) {
  const address = await requireAddress();
  const outcome = await retract(address, fact);
  revalidatePath("/memory");
  revalidatePath("/application_board");
  revalidatePath("/interview_room");
  revalidatePath("/tutor");
  revalidatePath("/");
  return outcome;
}
