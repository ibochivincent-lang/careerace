import { NextResponse } from "next/server";
import { getOwnerAddress } from "@/lib/session.ts";
import {
  recallCareerProfile,
  recallCareerCoaching,
  resolveConflicts,
  rememberFact,
  claimsOfKind,
  type FactKind,
} from "@/lib/memory_contract.ts";
import { callFreeLlm } from "@/lib/free_llm.ts";

export const maxDuration = 60;

/**
 * Intelligent extraction of career facts from candidate answers.
 * Extracts target role, level (entry, mid, senior), education, skills, location preferences, and experience.
 */
function extractHeuristicFacts(text: string, asked = ""): Array<{ kind: FactKind; text: string }> {
  const facts: Array<{ kind: FactKind; text: string }> = [];
  const lower = text.toLowerCase();
  const lowerAsked = asked.toLowerCase();

  // 1. Target Role & Seniority Level
  if (
    lowerAsked.includes("role") ||
    lowerAsked.includes("work are you looking for") ||
    lowerAsked.includes("kind of work") ||
    lowerAsked.includes("position") ||
    lower.includes("looking for") ||
    lower.includes("targeting") ||
    lower.includes("entry-level") ||
    lower.includes("entry level") ||
    lower.includes("junior") ||
    lower.includes("senior") ||
    lower.includes("engineer") ||
    lower.includes("developer")
  ) {
    let roleText = text.trim();
    // Clean up conversational filler if present
    roleText = roleText.replace(/^(i am looking for|i'm looking for|i want|targeting|i target)\s+/i, "");
    if (roleText.length > 2 && roleText.length < 100) {
      facts.push({
        kind: "target_role",
        text: `Target role: ${roleText}`,
      });
    }
  }

  // 2. Education & Highest Institution
  if (
    lowerAsked.includes("institution") ||
    lowerAsked.includes("education") ||
    lowerAsked.includes("university") ||
    lowerAsked.includes("degree") ||
    lower.includes("university") ||
    lower.includes("college") ||
    lower.includes("bachelor") ||
    lower.includes("master") ||
    lower.includes("b.s.") ||
    lower.includes("b.sc") ||
    lower.includes("degree") ||
    lower.includes("bootcamp") ||
    lower.includes("graduated from")
  ) {
    let eduText = text.trim();
    eduText = eduText.replace(/^(i graduated from|i attended|my highest institution is|my degree is)\s+/i, "");
    if (eduText.length > 3 && eduText.length < 120) {
      facts.push({
        kind: "education",
        text: `Education: ${eduText}`,
      });
    }
  }

  // 3. Technical Skills & Tools
  if (
    lowerAsked.includes("skill") ||
    lowerAsked.includes("tech stack") ||
    lowerAsked.includes("tools") ||
    lowerAsked.includes("languages") ||
    lower.includes("skills are") ||
    lower.includes("proficient in") ||
    lower.includes("experience with react") ||
    lower.includes("typescript") ||
    lower.includes("python")
  ) {
    let skillText = text.trim();
    skillText = skillText.replace(/^(my skills are|i am proficient in|i know|skills:|tech stack:)\s+/i, "");
    if (skillText.length > 2 && skillText.length < 150) {
      facts.push({
        kind: "skill",
        text: `Skill: ${skillText}`,
      });
    }
  }

  // 4. Where they want to work / Preferences
  if (
    lowerAsked.includes("where you want to work") ||
    lowerAsked.includes("where do you want to work") ||
    lowerAsked.includes("location") ||
    lowerAsked.includes("remote") ||
    lower.includes("remote") ||
    lower.includes("hybrid") ||
    lower.includes("on-site") ||
    lower.includes("located in")
  ) {
    let prefText = text.trim();
    prefText = prefText.replace(/^(i want to work|i prefer|i am located in)\s+/i, "");
    if (prefText.length > 2 && prefText.length < 120) {
      facts.push({
        kind: "preference",
        text: `Workplace preference: ${prefText}`,
      });
    }
  }

  // 5. Work Experience & Projects
  if (
    lowerAsked.includes("experience") ||
    lowerAsked.includes("past roles") ||
    lowerAsked.includes("projects") ||
    lower.includes("worked at") ||
    lower.includes("i have worked") ||
    lower.includes("years of experience") ||
    lower.includes("built a")
  ) {
    let expText = text.trim();
    expText = expText.replace(/^(i worked at|i have experience as|experience:)\s+/i, "");
    if (expText.length > 4 && expText.length < 180) {
      facts.push({
        kind: "experience",
        text: `Experience: ${expText}`,
      });
    }
  }

  return facts;
}

export async function POST(req: Request) {
  try {
    const { messages, cv_profile } = await req.json();
    const latest = messages?.at(-1)?.content || "Hello, Career Ace";

    const asked =
      [...messages]
        .slice(0, -1)
        .reverse()
        .find((m: { role: string }) => m.role === "assistant")?.content || "";

    // 1. Resolve owner address for sovereign Walrus Memory
    let address = await getOwnerAddress();
    if (!address) {
      address = "0x0000000000000000000000000000000000000000000000000000000000000001";
    }

    // 2. Recall existing facts from Walrus Memory
    const [profileFacts, coachingFacts] = await Promise.all([
      recallCareerProfile(address).catch(() => []),
      recallCareerCoaching(address).catch(() => []),
    ]);

    const activeProfile = resolveConflicts(profileFacts).active;
    const activeCoaching = resolveConflicts(coachingFacts).active;

    const storedSummary = {
      targetRoles: claimsOfKind(activeProfile, "target_role"),
      skills: claimsOfKind(activeProfile, "skill"),
      education: claimsOfKind(activeProfile, "education"),
      experience: claimsOfKind(activeProfile, "experience"),
      preferences: claimsOfKind(activeCoaching, "preference"),
    };

    // 3. Extract facts from current user turn and persist to Walrus Memory
    const newlyStored: string[] = [];
    const extracted = extractHeuristicFacts(latest, asked);

    for (const fact of extracted) {
      try {
        const outcome = await rememberFact(address, fact.kind, fact.text, { userTurn: latest });
        if (outcome.status === "written") {
          newlyStored.push(`${fact.kind.replace("_", " ")}: ${fact.text}`);
        }
      } catch (err) {
        console.warn("[careerace] memory persistence notice:", err);
      }
    }

    // 4. Build sovereign context for the AI Copilot
    const memoryFactsList = [...activeProfile, ...activeCoaching].map((f) => `- ${f.text}`).join("\n");

    const systemPrompt = `You are Career Ace AI Copilot, an autonomous career profiler, resume builder, and job matcher.

YOUR PRIMARY MISSION:
You conduct an interactive, step-by-step CV discovery conversation to build the candidate's complete, verified career profile directly into Walrus Memory.

EXPLAIN THE REASON TRANSPARENTLY:
In your opening or when introducing questions, explain clearly to the candidate:
"The reason I am asking these questions is to get to know you, your background, and your career goals so we can construct your verified CV in Walrus Memory, tailor your applications, and match you with real job opportunities."

INTERACTIVE CV INTERVIEW FLOW (Ask 1 or 2 connected questions at a time, like filling out a CV):
1. IDENTITY & LOCATION: What is their full name, and where are they located (city/country/address)?
2. TARGET WORK & SENIORITY LEVEL (CRITICAL HIGHLIGHT): What kind of work are they looking for? (e.g. Software Engineer, Frontend/Backend, Product Manager, Data/AI) and what seniority level (Entry-level / New Grad, Mid-level, Senior, or Lead)?
3. WHERE THEY WANT TO WORK: Remote-first, hybrid, on-site, specific countries or cities, or dream tech companies?
4. HIGHEST EDUCATIONAL INSTITUTION: What is their highest institution (university, college, school, or bootcamp), degree, and field of study?
5. CORE SKILLS & TECH STACK: What are their primary technical skills, tools, programming languages, and frameworks?
6. WORK EXPERIENCE & NOTABLE PROJECTS: What past roles, internships, or notable projects have they worked on, and what were 1 or 2 key accomplishments or challenges?

CHECK WHAT IS ALREADY KNOWN (DO NOT RE-ASK):
The following facts are already safely stored in the candidate's Walrus Memory vault:
${memoryFactsList || "No facts stored yet."}
${cv_profile ? `Attached CV profile: Name=${cv_profile.applicant_name}, Skills=${cv_profile.skills?.slice(0, 8).join(", ")}, TargetRoles=${cv_profile.target_roles?.join(", ")}` : ""}

If a detail is already known, do not ask for it again! Instead, acknowledge it warmly and ask for the next missing piece.

CONFIRM SAVES:
Whenever the candidate shares an answer, acknowledge in passing that it is being cryptographically sealed and saved to their sovereign Walrus Memory vault.

TONE & CONCISENESS:
Keep responses friendly, encouraging, and under 130 words per turn.`;

    const reply = await callFreeLlm({
      prompt: latest,
      system_prompt: systemPrompt,
      max_tokens: 350,
    });

    return NextResponse.json({
      role: "assistant",
      content: reply,
      stored: newlyStored,
    });
  } catch (error) {
    return NextResponse.json(
      {
        role: "assistant",
        content:
          "Career Ace AI Copilot is active. To help build your sovereign CV and match you with live tech jobs, what kind of work or role are you looking for, and what seniority level (e.g. Entry-level or Senior)?",
        stored: [],
      },
      { status: 200 }
    );
  }
}
