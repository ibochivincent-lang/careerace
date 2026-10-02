import type { ParsedCv } from "./cv_parser.ts";
import type { NormalizedJob } from "./job_normaliser.ts";

export interface TailoredPackage {
  job_id: string;
  tailored_summary: string;
  aligned_highlights: string[];
  cover_letter: string;
  formatted_cv_markdown: string;
}

export function generateTailoredCvAndCoverLetter(job: NormalizedJob, cv: ParsedCv): TailoredPackage {
  const jobKeywords = `${job.title} ${job.description}`.toLowerCase();
  const matchingSkills = (cv.skills || []).filter(s => jobKeywords.includes(s.toLowerCase()));
  const skillsToFeature = matchingSkills.length > 0 ? matchingSkills : (cv.skills || []).slice(0, 4);

  const tailored_summary = `Results-driven engineer with verified expertise in ${skillsToFeature.slice(0, 4).join(", ")}, specializing in high-performance production systems. Profile aligned for ${job.title} at ${job.company}.`;

  const aligned_highlights: string[] = [];
  for (const exp of cv.work_experience || []) {
    for (const highlight of exp.highlights || []) {
      // Pick out highlights that match role technologies or have quantified outcomes
      if (jobKeywords.split(/\s+/).some(kw => kw.length > 3 && highlight.toLowerCase().includes(kw)) || /\d+%|\bscalable\b|\boptimized\b/i.test(highlight)) {
        aligned_highlights.push(`${highlight}`);
      } else if (aligned_highlights.length < 3) {
        aligned_highlights.push(highlight);
      }
    }
  }

  const primarySkill = skillsToFeature[0] || "TypeScript";
  const secondarySkill = skillsToFeature[1] || "Modern Web Frameworks";
  const prevRole = cv.work_experience?.[0]?.role || "Software Engineer";
  const prevComp = cv.work_experience?.[0]?.company || "previous tech organization";

  const cover_letter = `Dear Hiring Team at ${job.company},

I am writing to express my strong interest in the ${job.title} position. With hands-on experience in ${skillsToFeature.join(", ")}, I have designed resilient production architectures and delivered high-throughput APIs.

In my recent experience as ${prevRole} at ${prevComp}, I led performance optimizations and built scalable features using ${primarySkill} and ${secondarySkill}. My technical background directly aligns with the key qualifications outlined for ${job.company}'s engineering objectives.

I would welcome the opportunity to discuss how my technical proficiencies and problem-solving background can contribute to your team.

Sincerely,
${cv.applicant_name || "Candidate"}
${cv.email || ""}
${cv.github_url || ""}
${cv.linkedin_url || ""}`;

  const formatted_cv_markdown = `# ${cv.applicant_name}
${cv.email} | ${cv.phone || ""} | ${cv.github_url || ""}

## Professional Summary
${tailored_summary}

## Technical Skills
${cv.skills.join(" • ")}

## Work Experience
${cv.work_experience.map(e => `### ${e.role} — ${e.company} (${e.duration})
${e.highlights.map(h => `- ${h}`).join("\n")}
`).join("\n")}

## Education
${cv.academic_history.map(a => `### ${a.degree} in ${a.field_of_study} — ${a.institution} (${a.graduation_year})
${a.achievements.map(ach => `- ${ach}`).join("\n")}
`).join("\n")}`;

  return {
    job_id: job.job_id,
    tailored_summary,
    aligned_highlights,
    cover_letter,
    formatted_cv_markdown
  };
}
