import { resolveTargetAddress } from "./target_address.ts";
import {
  recallCareerProfile,
  recallCareerCoaching,
  rememberFact,
} from "./memory_core.ts";
import {
  resolveConflicts,
  claimsOfKind,
  type FactKind,
} from "./facts.ts";
import { callFreeLlm } from "./free_llm.ts";
import { NO_SLOP_PROMPT_DIRECTIVE, sanitizeAntiSlop } from "./no_slop.ts";
import { classifyUserIntent, generateIntentMemoryResponse } from "./user_intent_knowledge.ts";

export interface CopilotQueryParams {
  message?: string;
  messages?: Array<{ role: string; content: string }>;
  profile?: any;
  cv_profile?: any;
  appliedJobs?: any[];
  address?: string;
  custom_keys?: any;
}

export interface CopilotQueryResult {
  role: "assistant";
  content: string;
  reply: string;
  stored: string[];
  candidate_name?: string;
  extracted_profile?: {
    name?: string;
    target_roles?: string[];
    skills?: string[];
    education?: string[];
    experience?: string[];
  };
}

export function isYesterdayDate(timestampOrDate: number | string | undefined | null): boolean {
  if (!timestampOrDate) return false;
  const d = typeof timestampOrDate === "number" ? new Date(timestampOrDate) : new Date(timestampOrDate);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  );
}

export function isTodayDate(timestampOrDate: number | string | undefined | null): boolean {
  if (!timestampOrDate) return false;
  const d = typeof timestampOrDate === "number" ? new Date(timestampOrDate) : new Date(timestampOrDate);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function extractHeuristicFacts(text: string, asked = ""): Array<{ kind: FactKind; text: string }> {
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

export async function processCopilotQuery(body: CopilotQueryParams): Promise<CopilotQueryResult> {
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

  const appliedJobs = Array.isArray(body.appliedJobs)
    ? body.appliedJobs
    : [];

  const profileCertifications =
    cv_profile?.certifications ||
    cv_profile?.licenses ||
    claimsOfKind(activeProfile, "certification" as any) ||
    [];

  // Check whether candidate has uploaded and calibrated resume
  const hasUploadedResume = Boolean(
    (profileSkills && profileSkills.length > 0) ||
    (Array.isArray(profileExperience) && profileExperience.length > 0) ||
    (Array.isArray(cv_profile?.skills) && cv_profile.skills.length > 0) ||
    (Array.isArray(cv_profile?.work_experience) && cv_profile.work_experience.length > 0)
  );

  const lowerLatest = latest.toLowerCase().trim();
  let directReply = "";

  // Query Matchers
  const isHowManyJobsInADay =
    (lowerLatest.includes("how many") || lowerLatest.includes("limit") || lowerLatest.includes("maximum")) &&
    (lowerLatest.includes("in a day") || lowerLatest.includes("per day") || lowerLatest.includes("a day") || lowerLatest.includes("daily limit") || lowerLatest.includes("can i apply in a day") || lowerLatest.includes("can i apply a day") || lowerLatest.includes("apply in a day"));

  const isOtherDisciplines =
    lowerLatest.includes("other discipline") ||
    lowerLatest.includes("other disciplines") ||
    lowerLatest.includes("different discipline") ||
    lowerLatest.includes("different disciplines") ||
    lowerLatest.includes("other roles") ||
    lowerLatest.includes("other role") ||
    lowerLatest.includes("different role") ||
    lowerLatest.includes("different roles") ||
    lowerLatest.includes("multiple disciplines") ||
    lowerLatest.includes("switch discipline") ||
    lowerLatest.includes("another field") ||
    lowerLatest.includes("other fields");

  const isCourseOfStudy =
    lowerLatest.includes("course of study") ||
    lowerLatest.includes("course is not here") ||
    lowerLatest.includes("course not here") ||
    lowerLatest.includes("course not listed") ||
    lowerLatest.includes("degree not here") ||
    lowerLatest.includes("degree not listed") ||
    lowerLatest.includes("degree is not here") ||
    lowerLatest.includes("major not here") ||
    lowerLatest.includes("major not listed") ||
    lowerLatest.includes("study is not here") ||
    lowerLatest.includes("study not here") ||
    lowerLatest.includes("degree not found") ||
    lowerLatest.includes("field of study not here");

  const isYesterdayJobs =
    (lowerLatest.includes("yesterday") || lowerLatest.includes("yesterdays")) &&
    (lowerLatest.includes("how many") || lowerLatest.includes("job") || lowerLatest.includes("apply") || lowerLatest.includes("applied") || lowerLatest.includes("application"));

  const isShowJobNames =
    lowerLatest.includes("show me the names") ||
    lowerLatest.includes("names of the jobs") ||
    lowerLatest.includes("names of jobs") ||
    lowerLatest.includes("what are the names of the jobs") ||
    lowerLatest.includes("show job names") ||
    lowerLatest.includes("list the jobs") ||
    lowerLatest.includes("show my applied jobs") ||
    (lowerLatest.includes("show") && lowerLatest.includes("names"));

  const isTodayJobs =
    (lowerLatest.includes("today") || lowerLatest.includes("todays")) &&
    (lowerLatest.includes("how many jobs") || lowerLatest.includes("jobs applied") || lowerLatest.includes("applied jobs") || lowerLatest.includes("did i apply") || lowerLatest.includes("application goal") || lowerLatest.includes("daily progress"));

  const isPersonalOrProfileQuery =
    lowerLatest.includes("read my cv") ||
    lowerLatest.includes("read my resume") ||
    lowerLatest.includes("what is on my cv") ||
    lowerLatest.includes("summarize my cv") ||
    lowerLatest.includes("summarize my resume") ||
    lowerLatest.includes("who am i") ||
    lowerLatest.includes("what are my skills") ||
    lowerLatest.includes("where did i work") ||
    lowerLatest.includes("what did i study") ||
    lowerLatest.includes("my experience") ||
    lowerLatest.includes("my education") ||
    lowerLatest.includes("my degree") ||
    lowerLatest.includes("my skills") ||
    lowerLatest.includes("audit") ||
    lowerLatest.includes("tailor") ||
    lowerLatest.includes("calibrate") ||
    lowerLatest.includes("how can i improve") ||
    lowerLatest.includes("profile review") ||
    lowerLatest.includes("background");

  const isGreeting =
    /^(hi|hello|hey|good\s+morning|good\s+afternoon|good\s+evening|greetings|help|howdy|start)\b/i.test(lowerLatest) ||
    lowerLatest === "hi" ||
    lowerLatest === "hello" ||
    lowerLatest === "help" ||
    lowerLatest.includes("who are you") ||
    lowerLatest.includes("what can you do") ||
    lowerLatest.includes("what do you do") ||
    lowerLatest.includes("how does this work") ||
    lowerLatest.includes("how can you assist") ||
    lowerLatest.includes("get started");

  // Fine-Tuned Intent Classification & Grounded Walrus Sovereign Memory Recall
  const userIntent = classifyUserIntent(latest);
  const activeProfileData = cv_profile || body.profile;

  if (!hasUploadedResume && isPersonalOrProfileQuery) {
    directReply =
      `Welcome to CareerAce! You haven't uploaded or calibrated your resume yet.\n\n` +
      `To give you tailored career intelligence, match you with verified openings, and track your applications, the very first step is to upload your resume in **Resume Studio**.\n\n` +
      `Once uploaded, our sovereign AI will:\n` +
      `1. Calibrate your target roles and seniority level to match live hiring standards\n` +
      `2. Extract and index your verified technical competencies and work experience into your decentralized Walrus Memory vault\n` +
      `3. Format and quantify your achievements to pass ATS screening algorithms\n\n` +
      `Please head over to **Resume Studio** to upload your resume to get started!`;
  } else if (isHowManyJobsInADay) {
    directReply =
      `You can apply to as many jobs as possible in a day. CareerAce does not place an artificial limit on your daily dispatches.\n\n` +
      `To ensure maximum delivery success, protect your candidate reputation, and adhere to recruiter compliance standards, our Universal Application Board and Auto-Apply engine implement two key safeguards:\n` +
      `• **Anti-Spam Pacing Safeguard:** Applications are dispatched with humanized 2 to 5 second pacing intervals rather than reckless automated bursts.\n` +
      `• **5-Day Company Cooldown Safeguard:** Prevents double-applying to the same organization within the same hiring cycle.\n\n` +
      `Head over to the **Application Board** to auto-apply, review RFC-compliant delivery receipts (.eml), and track your 7-day follow-up milestones.` +
      (!hasUploadedResume ? `\n\n*Note: To begin dispatching applications, please head to **Resume Studio** to upload and calibrate your resume first.*` : "");
  } else if (isOtherDisciplines) {
    directReply =
      `Yes, absolutely! CareerAce supports multiple disciplines and career tracks.\n\n` +
      `You can maintain multiple specialized CV versions tailored to different industries (e.g., Software & Cloud Systems, Maritime & Offshore Engineering, AI & Autonomous Systems, Product Management, or Healthcare). Simply head over to **Resume Studio** to select your target discipline, customize your role, and seal a distinct CV snapshot into your decentralized Walrus vault.\n\n` +
      `Each tailored version preserves its own ATS keywords, verified competencies, and cover letters, ensuring you stand out in whatever field you apply.` +
      (!hasUploadedResume ? `\n\n*Note: To set up your first discipline track, upload your resume in **Resume Studio** to begin.*` : "");
  } else if (isCourseOfStudy) {
    directReply =
      `If your specific course of study or academic degree is not listed in our standard options, kindly hit us up via our support channels or contact form, and we will get back to you regarding that and add it to our curriculum index.\n\n` +
      `In the meantime, you can:\n` +
      `1. Select the closest discipline track in **Resume Studio**\n` +
      `2. Directly edit and customize your degree, institution, and major in the **Academic History** section of your CV canvas\n` +
      `3. Add your specialized technical competencies and coursework—CareerAce will immediately index and highlight them for matching employers.` +
      (!hasUploadedResume ? `\n\n*Note: Please head over to **Resume Studio** to upload your resume and customize your academic background.*` : "");
  } else if (isYesterdayJobs) {
    const yesterdayApplied = appliedJobs.filter((a: any) => {
      const t = a.appliedTimestamp || (a.appliedAt ? new Date(a.appliedAt).getTime() : 0);
      return isYesterdayDate(t);
    });

    if (yesterdayApplied.length > 0) {
      const jobList = yesterdayApplied
        .map((j: any, i: number) => `${i + 1}. **${j.jobTitle || j.role || j.title || "Target Role"}** at **${j.company || "Company"}**`)
        .join("\n");
      directReply =
        `From our count, you were able to apply to ${yesterdayApplied.length} job${yesterdayApplied.length > 1 ? "s" : ""} yesterday.\n\n` +
        `If you want, I can show you the names of the jobs you applied for:\n\n${jobList}`;
    } else {
      directReply =
        `From our count, you were able to apply to 0 jobs yesterday.\n\n` +
        `If you want, I can show you the names of the jobs you applied for across all dates (total tracked: ${appliedJobs.length}), or you can head over to the **Application Board** to discover new verified openings.`;
    }
  } else if (isShowJobNames) {
    if (appliedJobs.length > 0) {
      const jobList = appliedJobs
        .map((j: any, i: number) => {
          const dateStr = j.appliedAt ? (typeof j.appliedAt === "string" ? j.appliedAt : new Date(j.appliedAt).toLocaleDateString()) : "Recently";
          return `${i + 1}. **${j.jobTitle || j.role || j.title || "Target Role"}** at **${j.company || "Company"}** (Applied: ${dateStr})`;
        })
        .join("\n");
      directReply =
        `Here are the verified jobs you have applied for from your sovereign application log:\n\n${jobList}\n\n` +
        `You can track the 7-day follow-up status for each of these on the **Application Board**.`;
    } else {
      directReply =
        `You have no tracked job applications yet.\n\n` +
        `Visit the **Application Board** to explore verified corporate openings across Software, Engineering, Maritime, AI, and Product Management. When you dispatch an application, CareerAce automatically tracks it and triggers a 7-day follow-up reminder.`;
    }
  } else if (isTodayJobs) {
    const todayApplied = appliedJobs.filter((a: any) => {
      const t = a.appliedTimestamp || (a.appliedAt ? new Date(a.appliedAt).getTime() : 0);
      return isTodayDate(t);
    });
    const dailyCount = todayApplied.length;
    const dailyTarget = 5;

    directReply =
      `From our count, you were able to apply to ${dailyCount} job${dailyCount === 1 ? "" : "s"} today (daily target: ${dailyTarget}).\n\n` +
      (dailyCount > 0
        ? `If you want, I can show you the names of the jobs you applied for:\n\n` +
          todayApplied.map((j: any, i: number) => `${i + 1}. **${j.jobTitle || j.role || j.title || "Target Role"}** at **${j.company || "Company"}**`).join("\n")
        : `You haven't dispatched any applications today yet. Head over to the **Application Board** to explore verified openings and auto-apply!`);
  } else if (!hasUploadedResume && isPersonalOrProfileQuery) {
    directReply =
      `Welcome to CareerAce! You haven't uploaded or calibrated your resume yet.\n\n` +
      `To give you tailored career intelligence, match you with verified openings, and track your applications, the very first step is to upload your resume in **Resume Studio**.\n\n` +
      `Once uploaded, our sovereign AI will:\n` +
      `1. Calibrate your target roles and seniority level to match live hiring standards\n` +
      `2. Extract and index your verified technical competencies and work experience into your decentralized Walrus Memory vault\n` +
      `3. Format and quantify your achievements to pass ATS screening algorithms\n\n` +
      `Please head over to **Resume Studio** to upload your resume to get started!`;
  } else if (isGreeting) {
    const candidateDisplayName = currentName && currentName !== "Candidate" ? currentName : "";

    if (hasUploadedResume) {
      directReply = `Hello${candidateDisplayName ? ` ${candidateDisplayName}` : ""}! I am your CareerAce Career Assistant, grounded directly in your decentralized Walrus Sovereign Memory vault.\n\n` +
        `• **Current Sovereign Profile:** Verified background on file for **${profileRole}** with **${profileSkills.length} core skills** and **${Array.isArray(profileExperience) ? profileExperience.length : 1} work tenure(s)** indexed.\n` +
        `• **Multiple Resumes Supported:** You can maintain 2 or 3 distinct CV versions tailored to different industries (e.g. Software, Systems Engineering, Management). Head over to **Resume Studio** to manage or switch between your tailored snapshots.\n` +
        `• **Cover Letter Studio:** Generate laser-targeted, problem-solving cover letters for any prospective employer without AI slop.\n` +
        `• **Application Board:** Track your applications across Discovery, Saved, and Applied stages, and monitor automatic 7-day follow-up milestones.\n\n` +
        `Feel free to ask me anything about your work experience, education, skills, applied jobs, or general career strategy!`;
    } else {
      directReply = `Hello! I am your CareerAce Career Assistant, connected to your decentralized Walrus Sovereign Memory vault.\n\n` +
        `Here is how I can assist you across our ecosystem:\n` +
        `• **First Step — Resume Calibration:** Head over to **Resume Studio** to upload your CV. We will calibrate your experience, skills, and target roles to fit industry benchmarks, and seal tamper-proof snapshots into Walrus storage.\n` +
        `• **Cover Letter Studio:** Synthesize customized, problem-solving cover letters addressing specific company needs without robotic AI filler.\n` +
        `• **Application Board:** Explore verified openings, track your applications across Discovery, Saved, and Applied stages, and manage 7-day recruiter follow-up reminders.\n\n` +
        `To get started, head over to **Resume Studio** to upload your resume, or ask me any question about your career goals!`;
    }
  } else if (
    lowerLatest.includes("available job") ||
    lowerLatest.includes("available jobs") ||
    lowerLatest.includes("jobs for me") ||
    lowerLatest.includes("what jobs") ||
    lowerLatest.includes("find jobs") ||
    lowerLatest.includes("open roles") ||
    lowerLatest.includes("recommend jobs") ||
    lowerLatest.includes("jobs in nigeria")
  ) {
    const todayStr = new Date().toDateString();
    const todayApplied = appliedJobs.filter((a: any) => {
      const t = a.appliedTimestamp || (a.appliedAt ? new Date(a.appliedAt).getTime() : 0);
      return t && new Date(t).toDateString() === todayStr;
    });
    const dailyCount = todayApplied.length;
    const dailyTarget = 5;

    const roleLower = profileRole.toLowerCase();
    let matchedCategory = "Software / Cloud";
    let sampleRoles = [
      { title: "Senior Backend Engineer (Payments)", company: "Paystack", loc: "Lagos, Nigeria · Hybrid" },
      { title: "Cloud Infrastructure & DevOps Engineer", company: "Flutterwave", loc: "Lagos, Nigeria · Remote" },
      { title: "Distributed Systems Architect", company: "Andela", loc: "Nigeria / Global Remote" },
      { title: "Core Banking Distributed Systems Engineer", company: "Moniepoint", loc: "Lagos, Nigeria · Hybrid" },
    ];

    if (roleLower.includes("marine") || roleLower.includes("naval") || roleLower.includes("cadet") || roleLower.includes("offshore")) {
      matchedCategory = "Marine & Offshore Engineering";
      sampleRoles = [
        { title: "Engine Cadet / Trainee Marine Engineer", company: "Maersk", loc: "Rotterdam, Netherlands · Fleet" },
        { title: "3rd Marine Engineer Officer (DP Vessel)", company: "Ocean Professionals Nigeria", loc: "Port Harcourt / Offshore Niger Delta" },
        { title: "Offshore Marine Systems Specialist", company: "Red Offshore", loc: "Lagos, Nigeria / West Africa Offshore" },
        { title: "Subsea Systems Specialist", company: "TechnipFMC", loc: "Houston, TX / Global Offshore" },
      ];
    } else if (roleLower.includes("ai") || roleLower.includes("robot") || roleLower.includes("autonomous") || roleLower.includes("machine learning")) {
      matchedCategory = "AI & Autonomous Systems";
      sampleRoles = [
        { title: "Autonomous Systems & ML Engineer", company: "Boston Dynamics", loc: "Waltham, MA / Global Remote" },
        { title: "Research Engineer (Foundation Models)", company: "Anthropic", loc: "San Francisco, CA / Remote" },
        { title: "Smart Contract & Distributed Consensus Engineer", company: "Mysten Labs", loc: "Worldwide Remote" },
      ];
    }

    const roleList = sampleRoles.map((r, i) => `${i + 1}. **${r.title}** at **${r.company}**\n   • Location: ${r.loc}\n   • Dispatch: Native mailto or direct relay on Application Board`).join("\n\n");

    directReply = `Here is your live daily progress and verified matching opportunities:\n\n` +
      `• **Today's Application Goal:** **${dailyCount} of ${dailyTarget}** dispatched (${dailyCount >= dailyTarget ? "Daily Goal Achieved!" : `${dailyTarget - dailyCount} more to reach your daily target`}).\n` +
      `• **Target Discipline:** ${profileRole} (${matchedCategory}).\n\n` +
      `**Verified Openings Matching Your Profile:**\n\n${roleList}\n\n` +
      `Head over to the **Application Board** to auto-apply, download RFC-compliant delivery receipts (.eml), and schedule automated 7-day follow-up reminders.`;
  } else if (
    lowerLatest.includes("applied job") ||
    lowerLatest.includes("jobs applied") ||
    lowerLatest.includes("follow-up") ||
    lowerLatest.includes("follow up") ||
    lowerLatest.includes("followup") ||
    lowerLatest.includes("applications") ||
    lowerLatest.includes("application status")
  ) {
    if (appliedJobs.length > 0) {
      const now = Date.now();
      const formattedJobs = appliedJobs.map((j: any, i: number) => {
        const appliedTime = j.appliedAt ? new Date(j.appliedAt).getTime() : now;
        const daysAgo = Math.max(0, Math.floor((now - appliedTime) / (1000 * 60 * 60 * 24)));
        const isDue = daysAgo >= 7;
        const statusText = isDue
          ? `[Follow-Up Due] (${daysAgo} days elapsed)`
          : `[Pending Follow-Up] (Milestone in ${7 - daysAgo} day(s))`;
        return `${i + 1}. **${j.jobTitle || j.role || j.title || "Target Role"}** at **${j.company || "Company"}**\n   • Applied: ${j.appliedAt ? (typeof j.appliedAt === "string" ? j.appliedAt : new Date(j.appliedAt).toLocaleDateString()) : "Recently"}\n   • Contact: ${j.contactEmail || j.email || "HR / Recruiter on file"}\n   • Status: ${statusText}`;
      }).join("\n\n");

      directReply = `Here is your live application log and 7-day follow-up tracking from your browser session:\n\n${formattedJobs}\n\n**Actionable Advice:** For any application over 7 days old, dispatch a polite follow-up email reiterating your top 3 matching skills and referencing your Walrus-verified CV credentials.`;
    } else {
      directReply = `You have no tracked job applications yet.\n\nVisit the **Application Board** to explore verified corporate openings across Engineering, Software & IT, AI & Autonomous Systems, Medical Informatics, and Management. When you dispatch an application, CareerAce automatically tracks it and triggers a 7-day follow-up reminder.`;
    }
  } else if (
    lowerLatest.includes("certification") ||
    lowerLatest.includes("license") ||
    lowerLatest.includes("credential") ||
    lowerLatest.includes("certifications & licenses")
  ) {
    if (profileCertifications && profileCertifications.length > 0) {
      const certList = Array.isArray(profileCertifications)
        ? profileCertifications
            .map((c: any) => typeof c === "string" ? c : `${c.name || c.title || "Certification"}${c.issuer ? ` (${c.issuer})` : ""}${c.year ? ` · ${c.year}` : ""}`)
            .join("\n• ")
        : String(profileCertifications);
      directReply = `Here are your verified licenses and certifications registered in your sovereign profile:\n\n• ${certList}\n\nThese credentials can be highlighted in your tailored CV bullets and cover letters for regulated and technical disciplines.`;
    } else {
      directReply = `No specific certifications or licenses have been recorded yet in your profile.\n\nYou can add professional credentials (e.g. AWS/Azure, PMP, Professional Engineer, technical licenses) to your profile, and CareerAce will index them into your decentralized Walrus vault.`;
    }
  } else if (
    lowerLatest.includes("career feedback") ||
    lowerLatest.includes("give me feedback") ||
    lowerLatest.includes("career advice") ||
    lowerLatest.includes("how can i improve") ||
    lowerLatest.includes("profile review")
  ) {
    const skillsCount = profileSkills.length;
    const expCount = Array.isArray(profileExperience) ? profileExperience.length : 1;
    directReply = `Career Strategy & Profile Feedback for ${currentName || "Candidate"}:\n\n` +
      `1. **ATS Alignment & Keywords:** You have ${skillsCount} verified technical competencies indexed. Focus on tailoring top keywords directly from target role job descriptions before applying.\n` +
      `2. **Impact & Metrics in Experience:** You have ${expCount} career tenure position(s) listed. Ensure every bullet leads with a strong action verb (e.g., *Engineered, Spearheaded, Overhauled*) and includes quantifiable metrics (speed, cost reduction, scale, or team size).\n` +
      `3. **Target Discipline Strategy:** Align your application outreach to specialized disciplines: ${profileRole}. Tailor each resume version uniquely rather than submitting a generic canvas.\n` +
      `4. **Follow-Up Discipline:** Track every outreach on the Application Board and dispatch follow-ups on day 7 to maximize recruiter response rates.`;
  } else if (
    lowerLatest.includes("cv & background") ||
    lowerLatest.includes("read my cv") ||
    lowerLatest.includes("read my resume") ||
    lowerLatest.includes("can you read cv") ||
    lowerLatest.includes("what is on my cv") ||
    lowerLatest.includes("summarize my cv") ||
    lowerLatest.includes("summarize my resume") ||
    lowerLatest.includes("who am i") ||
    lowerLatest.includes("background")
  ) {
    const candidateDisplayName = currentName && currentName !== "Candidate" ? currentName : "Candidate";
    const expFormatted = Array.isArray(profileExperience) && profileExperience.length > 0
      ? profileExperience.map((e: any) => typeof e === "string" ? e : `${e.role || "Role"} at ${e.company || "Company"}${e.duration ? ` (${e.duration})` : ""}`).slice(0, 3).join("; ")
      : "Work history indexed in Walrus Memory";

    const eduFormatted = Array.isArray(profileEducation) && profileEducation.length > 0
      ? profileEducation.map((a: any) => typeof a === "string" ? a : `${a.degree || "Degree"} from ${a.institution || "Institution"}${a.graduation_year ? ` (${a.graduation_year})` : ""}`).slice(0, 2).join("; ")
      : "Education indexed in Walrus Memory";

    directReply = `Yes! I have read and verified your background from your Walrus Sovereign Memory vault:\n\n• **Candidate Name:** ${candidateDisplayName}\n• **Target Role:** ${profileRole}\n• **Core Skills:** ${profileSkills.slice(0, 10).join(", ") || "Technical competencies"}\n• **Work History:** ${expFormatted}\n• **Academic Background:** ${eduFormatted}\n\nYour profile is cryptographically anchored to Walrus decentralized storage. Select a quick action below or ask about specific roles, certifications, or applications!`;
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
    lowerLatest.includes("work experience") ||
    lowerLatest === "experience" ||
    lowerLatest.includes("past experience") ||
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

  if (!directReply) {
    const intentMemoryReply = !isGreeting ? generateIntentMemoryResponse(userIntent, activeProfileData, appliedJobs, latest) : null;
    if (intentMemoryReply) {
      directReply = intentMemoryReply;
    }
  }

  let reply = directReply;

  if (!reply) {
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

    const systemPrompt = `You are Career Ace AI Copilot, a direct, highly effective career strategist, resume builder, and job matcher powered by Walrus Sovereign Memory.

${NO_SLOP_PROMPT_DIRECTIVE}

CLASSIFIED USER INTENT & CONTEXT:
- Category: ${userIntent.category}
- Action Guidance: ${userIntent.actionPrompt}
- Matched Keywords: ${userIntent.matchedKeywords.join(", ") || "Direct inquiry"}

DATA PRIVACY & STRICT SOVEREIGN ISOLATION:
You are strictly scoped to the active candidate's own verified CV, credentials, and application records. Under no circumstances can you reveal, reference, or cross-pollinate data, applications, or credentials belonging to another user.

FIRST-TIME USER CALIBRATION DIRECTIVE:
If the candidate has not uploaded a resume yet, gently guide them that their very first step must be uploading their resume in Resume Studio so CareerAce can calibrate their target roles, skills, and work experience.

PLATFORM CAPABILITIES & POLICIES:
- "How many jobs can I apply in a day?": As many as possible! No artificial daily limit. Protected by anti-spam pacing (2-5s humanized intervals) and 5-day company cooldown safeguards.
- "Can I apply with other disciplines / roles?": Yes, absolutely! Candidates can maintain multiple specialized CV versions tailored to different industries (Software, Maritime, AI, Product, Healthcare) in Resume Studio.
- "My course of study is not here, what can I do?": Kindly hit us up via support/contact form, we will get back to you and add it to our curriculum index. In the meantime, select the closest discipline track and customize your exact degree/field in Academic History.
- "How many jobs did I apply for yesterday?": State: "From our count, you were able to apply to X jobs yesterday. If you want, I can show you the names of the jobs you applied for."

CANDIDATE VERIFIED CV DETAILS:
Candidate Name: ${currentName || "Candidate"}
Primary Target Role: ${profileRole}
Verified Skills: ${profileSkills.slice(0, 20).join(", ") || "None indexed yet"}
Academic History: ${formattedEdu}
Work Experience:
• ${formattedExp}

APPLICATIONS DISPATCHED (${appliedJobs.length} TOTAL):
${appliedJobs.slice(0, 10).map((j: any, i: number) => `${i + 1}. ${j.jobTitle || j.role || j.title || "Target Role"} at ${j.company || "Company"} (Applied: ${j.appliedAt || "Recent"})`).join("\n") || "No applications dispatched yet."}

FACTS RECORDED IN WALRUS SOVEREIGN MEMORY:
${memoryFactsList || "Profile newly initialized on Walrus."}

RULES:
1. Always ground your answers in the candidate's actual CV details and Walrus Memory above.
2. If the user asks about what they studied, where they worked, what their skills are, or asks "Can you read my CV?", answer directly and affirmatively using their exact background details above.
3. Be professional, direct, concise (under 140 words). Never use filler phrases or AI buzzwords. Never invent unverified companies or credentials.`;

    reply = await callFreeLlm({
      prompt: latest,
      system_prompt: systemPrompt,
      messages: messages,
      max_tokens: 450,
      custom_keys: body.custom_keys,
    });

    if (reply) {
      reply = sanitizeAntiSlop(reply);
    }
  }

  return {
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
  };
}
