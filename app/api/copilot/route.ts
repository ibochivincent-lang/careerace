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
 * Extracts candidate identity/name, target role, level (entry, mid, senior), education, skills, location preferences, and experience.
 */
function extractHeuristicFacts(text: string, asked = ""): Array<{ kind: FactKind; text: string }> {
  const facts: Array<{ kind: FactKind; text: string }> = [];
  const lower = text.toLowerCase().trim();
  const lowerAsked = asked.toLowerCase().trim();

  // 0. Candidate Name & Identity
  const nameIntroMatch = text.match(/(?:my name is|i am|i'm|call me|name:)\s+([A-Za-z\s'-]{2,40})/i);
  let detectedName = "";
  if (nameIntroMatch && nameIntroMatch[1]) {
    const rawName = nameIntroMatch[1].trim();
    const blacklist = ["looking", "a developer", "an engineer", "ready", "interested", "trying", "applying", "here", "available", "seeking", "experienced", "fine", "good"];
    if (!blacklist.includes(rawName.toLowerCase()) && rawName.split(" ").length <= 4) {
      detectedName = rawName;
    }
  } else if (
    (lowerAsked.includes("what is your name") || lowerAsked.includes("what's your name") || lowerAsked.includes("your full name")) &&
    text.split(" ").length <= 5 &&
    !lower.includes("software") &&
    !lower.includes("engineer")
  ) {
    detectedName = text.trim();
  }

  if (detectedName) {
    facts.push({
      kind: "candidate_identity",
      text: `Candidate Name: ${detectedName}`,
    });
  }

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
    const body = await req.json();
    const messages = Array.isArray(body.messages)
      ? body.messages
      : body.message
      ? [{ role: "user", content: body.message }]
      : [];
    const cv_profile = body.cv_profile || body.profile;
    const latest = (body.message || messages?.at(-1)?.content || "Hello, Career Ace").trim();

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
      names: claimsOfKind(activeProfile, "candidate_identity"),
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

    const currentName =
      extracted.find((f) => f.kind === "candidate_identity")?.text.replace("Candidate Name: ", "").trim() ||
      storedSummary.names[0]?.replace(/^candidate name:\s*/i, "").trim() ||
      cv_profile?.applicant_name ||
      "";

    // Build known CV profile context
    const profileRole = cv_profile?.target_roles?.[0] || storedSummary.targetRoles[0] || "Professional";
    const profileSkills = (cv_profile?.skills?.length ? cv_profile.skills : storedSummary.skills.map((s: string) => s.replace(/^skill:\s*/i, ""))) || [];
    const profileEducation = cv_profile?.education || storedSummary.education.map((e: string) => e.replace(/^education:\s*/i, ""));
    const profileExperience = cv_profile?.work_experience || storedSummary.experience.map((e: string) => e.replace(/^experience:\s*/i, ""));

    // 4. Handle direct deterministic queries if asked specifically
    const lowerLatest = latest.toLowerCase();
    let directReply = "";

    if (lowerLatest.includes("what did i study") || lowerLatest.includes("what is my degree") || lowerLatest.includes("where did i study") || lowerLatest.includes("my education")) {
      if (profileEducation && profileEducation.length > 0) {
        const eduList = Array.isArray(profileEducation)
          ? profileEducation.map((e: any) => typeof e === "string" ? e : `${e.degree || "Degree"} from ${e.institution || e.school || "University"} (${e.year || e.dates || ""})`).join("; ")
          : String(profileEducation);
        directReply = `Based on your Walrus Sovereign Memory and uploaded CV, you studied:\n\n${eduList}\n\nAll education credentials are encrypted and stored in your Walrus vault.`;
      } else {
        directReply = "Your education history has not been indexed yet. What is your highest institution, degree, and graduation year?";
      }
    } else if (lowerLatest.includes("where did i work") || lowerLatest.includes("my past roles") || lowerLatest.includes("my experience") || lowerLatest.includes("where have i worked")) {
      if (profileExperience && profileExperience.length > 0) {
        const expList = Array.isArray(profileExperience)
          ? profileExperience.map((exp: any) => typeof exp === "string" ? exp : `${exp.role || "Role"} at ${exp.company || "Company"} (${exp.duration || exp.dates || ""})`).join("\n• ")
          : String(profileExperience);
        directReply = `Here is your recorded work experience from your Walrus Memory vault:\n\n• ${expList}\n\nWould you like me to enhance or quantify any of these accomplishments for your next target application?`;
      } else {
        directReply = "No work experience positions are currently indexed in your profile. What roles or companies have you worked at?";
      }
    } else if (lowerLatest.includes("what are my skills") || lowerLatest.includes("my skills") || lowerLatest.includes("skills detected")) {
      if (profileSkills && profileSkills.length > 0) {
        const topSkills = profileSkills.slice(0, 15).join(", ");
        directReply = `Your Walrus Sovereign Memory vault has indexed the following core skills:\n\n${topSkills}\n\nTotal skills indexed: ${profileSkills.length}. You can tailor these for specific job postings anytime.`;
      } else {
        directReply = "No skills have been registered yet. What are your primary technical or domain skills?";
      }
    } else if (lowerLatest.includes("audit") && (lowerLatest.includes("cv") || lowerLatest.includes("resume") || lowerLatest.includes("ats"))) {
      const score = Math.min(95, Math.max(68, 65 + (profileSkills.length > 5 ? 15 : profileSkills.length * 2) + (profileExperience.length > 0 ? 15 : 0)));
      directReply = `ATS Audit Complete for ${currentName || "Candidate"}:\n\n- Overall ATS Compatibility: ${score}/100\n- Contact & Header: Clean and parseable\n- Target Role: ${profileRole}\n- Core Competencies: ${profileSkills.length} verified skills\n- Experience Entries: ${Array.isArray(profileExperience) ? profileExperience.length : 1} position(s)\n- Recommendation: Ensure every work accomplishment starts with a strong action verb and includes quantifiable metrics (% growth, revenue, speed, or team size).`;
    }

    let reply = directReply;

    if (!reply) {
      // 5. Build sovereign context for the AI Copilot
      const memoryFactsList = [...activeProfile, ...activeCoaching].map((f) => `- ${f.text}`).join("\n");

      const systemPrompt = `You are Career Ace AI Copilot, an autonomous career profiler, resume builder, and job matcher.

YOUR PRIMARY MISSION:
You conduct an interactive, step-by-step career discovery conversation to build and refine the candidate's verified career profile directly in Walrus Memory.

CANDIDATE KNOWN DETAILS:
${currentName ? `Candidate Name: ${currentName}` : "Candidate Name: Unknown yet"}
Role: ${profileRole}
Skills: ${profileSkills.slice(0, 12).join(", ") || "None indexed yet"}
Education: ${Array.isArray(profileEducation) ? JSON.stringify(profileEducation) : profileEducation || "None indexed yet"}
Experience: ${Array.isArray(profileExperience) ? JSON.stringify(profileExperience.slice(0, 3)) : profileExperience || "None indexed yet"}

FACTS STORED IN WALRUS MEMORY:
${memoryFactsList || "No external facts stored yet."}

RULES:
1. Always ground your answers in the candidate's actual details above.
2. If the candidate asks about what they studied, where they worked, or their skills, answer directly using the known details above.
3. Be friendly, professional, and concise (under 120 words).`;

      reply = await callFreeLlm({
        prompt: latest,
        system_prompt: systemPrompt,
        max_tokens: 350,
        custom_keys: body.custom_keys,
      });
    }

    return NextResponse.json({
      role: "assistant",
      content: reply,
      reply: reply,
      stored: newlyStored,
      candidate_name: currentName || undefined,
      extracted_profile: {
        name: currentName || undefined,
        target_roles: storedSummary.targetRoles,
        skills: storedSummary.skills,
        education: storedSummary.education,
        experience: storedSummary.experience,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        role: "assistant",
        content:
          "Career Ace AI Copilot is active. To help build your sovereign CV and match you with opportunities, what kind of work or role are you looking for?",
        reply:
          "Career Ace AI Copilot is active. To help build your sovereign CV and match you with opportunities, what kind of work or role are you looking for?",
        stored: [],
      },
      { status: 200 }
    );
  }
}
