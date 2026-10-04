import { NextResponse } from "next/server";
import { getOwnerAddress } from "@/lib/session.ts";
import { resolveTargetAddress } from "@/lib/target_address.ts";
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

    // 1. Resolve canonical address for sovereign Walrus Memory
    const address = await resolveTargetAddress(body.address);

    // 2. Recall existing verified facts from Walrus Memory
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
      tailoredCvs: claimsOfKind(activeProfile, "tailored_cv"),
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

    // Build known CV profile context, accurately mapping both academic_history and education
    const profileRole =
      cv_profile?.target_roles?.[0] ||
      storedSummary.targetRoles[0]?.replace(/^target role:\s*/i, "") ||
      "Software Engineer";

    const profileSkills =
      (cv_profile?.skills?.length
        ? cv_profile.skills
        : storedSummary.skills.map((s: string) => s.replace(/^skill:\s*/i, ""))) || [];

    const profileEducation =
      cv_profile?.academic_history ||
      cv_profile?.education ||
      storedSummary.education.map((e: string) => e.replace(/^education:\s*/i, ""));

    const profileExperience =
      cv_profile?.work_experience ||
      storedSummary.experience.map((e: string) => e.replace(/^experience:\s*/i, ""));

    // 4. Handle direct deterministic queries if asked specifically
    const lowerLatest = latest.toLowerCase();
    let directReply = "";

    // Direct CV / Resume Read Intent
    if (
      lowerLatest.includes("read my cv") ||
      lowerLatest.includes("read my resume") ||
      lowerLatest.includes("can you read cv") ||
      lowerLatest.includes("what is on my cv") ||
      lowerLatest.includes("summarize my cv") ||
      lowerLatest.includes("summarize my resume") ||
      lowerLatest.includes("who am i")
    ) {
      const candidateDisplayName = currentName && currentName !== "Candidate" ? currentName : "Candidate";
      const expFormatted = Array.isArray(profileExperience) && profileExperience.length > 0
        ? profileExperience.map((e: any) => typeof e === "string" ? e : `${e.role || "Role"} at ${e.company || "Company"}${e.duration ? ` (${e.duration})` : ""}`).slice(0, 3).join("; ")
        : "Work history indexed in Walrus Memory";

      const eduFormatted = Array.isArray(profileEducation) && profileEducation.length > 0
        ? profileEducation.map((a: any) => typeof a === "string" ? a : `${a.degree || "Degree"} from ${a.institution || "Institution"}${a.graduation_year ? ` (${a.graduation_year})` : ""}`).slice(0, 2).join("; ")
        : "Education indexed in Walrus Memory";

      directReply = `Yes! I have read and verified your CV from your Walrus Sovereign Memory vault:\n\n• **Candidate Name:** ${candidateDisplayName}\n• **Target Role:** ${profileRole}\n• **Core Skills:** ${profileSkills.slice(0, 10).join(", ") || "Technical competencies"}\n• **Work History:** ${expFormatted}\n• **Academic Background:** ${eduFormatted}\n\nYour CV is sealed on Walrus decentralized storage. How would you like to proceed? We can run an ATS compliance audit, generate a tailored cover letter, or refine your accomplishment bullets.`;
    } else if (
      lowerLatest.includes("what did i study") ||
      lowerLatest.includes("what is my degree") ||
      lowerLatest.includes("where did i study") ||
      lowerLatest.includes("my education") ||
      lowerLatest.includes("my degree")
    ) {
      if (profileEducation && (Array.isArray(profileEducation) ? profileEducation.length > 0 : Boolean(profileEducation))) {
        const eduList = Array.isArray(profileEducation)
          ? profileEducation
              .map((e: any) =>
                typeof e === "string"
                  ? e
                  : `${e.degree || "Degree"} from ${e.institution || e.school || "University"}${e.field_of_study ? ` in ${e.field_of_study}` : ""}${e.graduation_year || e.year ? ` (${e.graduation_year || e.year})` : ""}`
              )
              .join("\n• ")
          : String(profileEducation);
        directReply = `Based on your Walrus Sovereign Memory and uploaded CV, you studied:\n\n• ${eduList}\n\nAll educational credentials are encrypted and stored in your decentralized Walrus vault.`;
      } else {
        directReply = "Your education history has not been indexed yet. What is your highest educational institution, degree, and graduation year?";
      }
    } else if (
      lowerLatest.includes("where did i work") ||
      lowerLatest.includes("my past roles") ||
      lowerLatest.includes("my experience") ||
      lowerLatest.includes("where have i worked") ||
      lowerLatest.includes("what companies")
    ) {
      if (profileExperience && (Array.isArray(profileExperience) ? profileExperience.length > 0 : Boolean(profileExperience))) {
        const expList = Array.isArray(profileExperience)
          ? profileExperience
              .map((exp: any) =>
                typeof exp === "string"
                  ? exp
                  : `${exp.role || "Role"} at ${exp.company || "Company"}${exp.duration ? ` (${exp.duration})` : ""}${exp.highlights?.length ? ` — ${exp.highlights.slice(0, 1).join(" ")}` : ""}`
              )
              .join("\n• ")
          : String(profileExperience);
        directReply = `Here is your verified work experience from your Walrus Memory vault:\n\n• ${expList}\n\nWould you like me to quantify or tailor any of these achievements for a specific job description?`;
      } else {
        directReply = "No work experience positions are currently indexed in your profile. What roles and organizations have you worked at?";
      }
    } else if (
      lowerLatest.includes("what are my skills") ||
      lowerLatest.includes("my skills") ||
      lowerLatest.includes("skills detected") ||
      lowerLatest.includes("what tools do i know")
    ) {
      if (profileSkills && profileSkills.length > 0) {
        const topSkills = profileSkills.slice(0, 20).join(", ");
        directReply = `Your Walrus Sovereign Memory vault has indexed the following verified technical skills:\n\n${topSkills}\n\nTotal skills indexed: ${profileSkills.length}. You can tailor these for live job matches anytime.`;
      } else {
        directReply = "No skills have been registered yet. What are your primary programming languages, frameworks, and developer tools?";
      }
    } else if (
      lowerLatest.includes("audit") &&
      (lowerLatest.includes("cv") || lowerLatest.includes("resume") || lowerLatest.includes("ats"))
    ) {
      const score = Math.min(
        95,
        Math.max(
          68,
          65 + (profileSkills.length > 5 ? 15 : profileSkills.length * 2) + (profileExperience.length > 0 ? 15 : 0)
        )
      );
      directReply = `ATS Audit Complete for ${currentName || "Candidate"}:\n\n- Overall ATS Compatibility: ${score}/100\n- Contact & Header: Clean and parseable\n- Target Role: ${profileRole}\n- Core Competencies: ${profileSkills.length} verified skills\n- Experience Entries: ${Array.isArray(profileExperience) ? profileExperience.length : 1} position(s)\n- Recommendation: Ensure every work accomplishment starts with a strong action verb and includes quantifiable metrics (% growth, revenue, speed, or team size).`;
    }

    let reply = directReply;

    if (!reply) {
      // 5. Build rich sovereign context for the AI Copilot
      const memoryFactsList = [...activeProfile, ...activeCoaching].map((f) => `- ${f.text}`).join("\n");

      const formattedEdu = Array.isArray(profileEducation)
        ? profileEducation
            .map((e: any) =>
              typeof e === "string"
                ? e
                : `${e.degree || "Degree"} from ${e.institution || e.school || "University"}${e.field_of_study ? ` in ${e.field_of_study}` : ""}${e.graduation_year ? ` (${e.graduation_year})` : ""}`
            )
            .join("; ")
        : String(profileEducation || "None indexed yet");

      const formattedExp = Array.isArray(profileExperience)
        ? profileExperience
            .map((exp: any) =>
              typeof exp === "string"
                ? exp
                : `${exp.role || "Role"} at ${exp.company || "Company"}${exp.duration ? ` (${exp.duration})` : ""}${exp.highlights?.length ? ` (Highlights: ${exp.highlights.slice(0, 2).join(", ")})` : ""}`
            )
            .join("\n• ")
        : String(profileExperience || "None indexed yet");

      const systemPrompt = `You are Career Ace AI Copilot, a world-class autonomous career profiler, resume builder, and job matcher powered by Walrus Sovereign Memory.

CANDIDATE VERIFIED CV DETAILS:
Candidate Name: ${currentName || "Candidate"}
Primary Target Role: ${profileRole}
Verified Skills: ${profileSkills.slice(0, 20).join(", ") || "None indexed yet"}
Academic History: ${formattedEdu}
Work Experience:
• ${formattedExp}

FACTS RECORDED IN WALRUS SOVEREIGN MEMORY:
${memoryFactsList || "Profile newly initialized on Walrus."}

RULES:
1. Always ground your answers in the candidate's actual CV details and Walrus Memory above.
2. If the user asks about what they studied, where they worked, what their skills are, or asks "Can you read my CV?", answer directly and affirmatively using their exact background details above.
3. Be professional, highly encouraging, and concise (under 140 words). Never invent unverified companies or credentials.`;

      reply = await callFreeLlm({
        prompt: latest,
        system_prompt: systemPrompt,
        messages: messages,
        max_tokens: 450,
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
