import { NextRequest, NextResponse } from "next/server";
import { callFreeLlm } from "@/lib/free_llm";
import { analyzeAtsMatch } from "@/lib/ats_engine";
import { generateTailoredCvAndCoverLetter, enforceGoogleXyzFormula } from "@/lib/resume_tailor";
import type { ParsedCv } from "@/lib/cv_parser";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { company = "Target Company", role = "Target Role", job_description = "", profile, custom_keys } = body;

    if (!profile) {
      return NextResponse.json({ error: "Candidate profile is required." }, { status: 400 });
    }

    const cv: ParsedCv = profile;

    // 1. Prepare candidate data context
    const candidateSkills = cv.skills || [];
    const candidateWork = cv.work_experience || [];
    const candidateName = cv.applicant_name || "Candidate";

    let tailoredSummary = "";
    let tailoredWorkExperience = candidateWork;
    let tailoredText = "";
    let coverLetterText = "";

    // 2. Try LLM Tailoring if we have a job description
    const hasJobDescription = job_description && job_description.trim().length > 20;

    let aiSuccess = false;
    if (hasJobDescription) {
      try {
        const systemPrompt = `You are a world-class Executive ATS Career Strategist.
Your goal is to tailor the candidate's real resume for the target job description to achieve maximum ATS score (90%+) on Taleo, Greenhouse, and Workday without hallucinating false credentials.
Guidelines:
1. Re-write the professional summary in 2-3 crisp, high-impact sentences highlighting exact keywords from the JD.
2. Optimize each work experience bullet point into Google XYZ formula: "Accomplished [X] as measured by [Y], by doing [Z]".
3. Incorporate critical hard technical keywords from the job description naturally into the accomplishments.
4. Output STRICT JSON only. Format:
{
  "summary": "Tailored 3-sentence summary",
  "work_experience": [
    {
      "company": "Company Name",
      "role": "Role Title",
      "duration": "Duration",
      "highlights": ["XYZ bullet 1", "XYZ bullet 2"]
    }
  ],
  "cover_letter": "Short 3-paragraph tailored cover letter"
}`;

        const userPrompt = `TARGET COMPANY: ${company}
TARGET ROLE: ${role}

JOB DESCRIPTION:
${job_description.slice(0, 3000)}

CANDIDATE PROFILE:
Name: ${candidateName}
Current Skills: ${candidateSkills.join(", ")}
Work History:
${candidateWork.map((w, idx) => `[${idx}] ${w.role} at ${w.company} (${w.duration}):\n${(w.highlights || []).map(h => ` - ${h}`).join("\n")}`).join("\n\n")}

Tailor the candidate's real experience specifically for this role. Output valid JSON only.`;

        const rawResponse = await callFreeLlm({
          prompt: userPrompt,
          system_prompt: systemPrompt,
          custom_keys,
          max_tokens: 2200,
        });

        // Parse JSON response
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.summary && Array.isArray(parsed.work_experience)) {
            tailoredSummary = parsed.summary;
            tailoredWorkExperience = parsed.work_experience;
            coverLetterText = parsed.cover_letter || "";
            aiSuccess = true;
          }
        }
      } catch (llmErr) {
        console.warn("LLM tailoring failed or rate limited, falling back to algorithmic synthesis:", llmErr);
      }
    }

    // 3. Fallback to algorithmic synthesis if AI did not run or parse
    if (!aiSuccess) {
      const normalizedJob = {
        job_id: `job_${Date.now()}`,
        title: role,
        company: company,
        location: "Remote",
        description: job_description || `${role} at ${company}. Required skills: ${candidateSkills.slice(0, 6).join(", ")}`,
        apply_url: "",
        source: "direct_tailor",
        posted_date: new Date().toISOString(),
        is_remote: true,
        job_type: "remote" as const,
      };

      const fallbackPackage = generateTailoredCvAndCoverLetter(normalizedJob, cv);
      tailoredSummary = fallbackPackage.tailored_summary;
      coverLetterText = fallbackPackage.cover_letter;

      // Apply Google XYZ formula to highlights
      tailoredWorkExperience = candidateWork.map((w) => ({
        ...w,
        highlights: (w.highlights || []).map((h) => enforceGoogleXyzFormula(h, candidateSkills[0])),
      }));
    }

    // 4. Construct tailored plain-text resume
    const contactLine = [
      (cv as any).contact_email || cv.email,
      (cv as any).contact_phone || cv.phone,
      (cv as any).location,
      cv.linkedin_url,
      cv.github_url,
    ].filter(Boolean).join(" · ");

    tailoredText = `${candidateName.toUpperCase()}
${contactLine}

TARGET POSITION: ${role} — ${company}

PROFESSIONAL SUMMARY
${tailoredSummary}

CORE COMPETENCIES & TECHNICAL PROFICIENCIES
${candidateSkills.join(" · ")}

PROFESSIONAL EXPERIENCE
${tailoredWorkExperience.map((exp) => `${exp.role.toUpperCase()} | ${exp.company}
${exp.duration}
${(exp.highlights || []).map((h) => `• ${h}`).join("\n")}`).join("\n\n")}

EDUCATION & CREDENTIALS
${(cv.academic_history || []).map((edu) => `• ${edu.degree || "Degree"} — ${edu.institution || "University"}${edu.graduation_year ? ` (${edu.graduation_year})` : ""}`).join("\n")}`;

    // 5. Build updated tailored profile object
    const tailoredProfile: ParsedCv = {
      ...cv,
      work_experience: tailoredWorkExperience,
      target_roles: [role],
    };

    // 6. Calculate real ATS scorecard against JD
    const atsScorecard = analyzeAtsMatch({
      jobTitle: role,
      jobDescription: job_description,
      applicantSkills: candidateSkills,
      applicantExperienceText: tailoredWorkExperience
        .map((e) => `${e.role} at ${e.company}. ${(e.highlights || []).join(" ")}`)
        .join("\n"),
      applicantAcademicText: (cv.academic_history || [])
        .map((a) => `${a.degree} ${a.institution}`)
        .join("\n"),
      applicantContactInfo: {
        email: (cv as any).contact_email || cv.email,
        phone: (cv as any).contact_phone || cv.phone,
        location: (cv as any).location,
      },
    });

    return NextResponse.json({
      success: true,
      tailored_resume: tailoredText,
      tailored_profile: tailoredProfile,
      tailored_summary: tailoredSummary,
      cover_letter: coverLetterText,
      ats_scorecard: atsScorecard,
    });
  } catch (error: any) {
    console.error("Error in /api/tailor:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to tailor resume" },
      { status: 500 }
    );
  }
}
