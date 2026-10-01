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
  const tailored_summary = `Results-oriented software engineer with proven expertise in ${cv.skills.slice(0, 4).join(", ")}, specializing in scalable web application development. Tailored for ${job.title} at ${job.company}.`;

  const aligned_highlights: string[] = [];
  for (const exp of cv.work_experience) {
    for (const highlight of exp.highlights) {
      aligned_highlights.push(`${highlight} (Aligned with ${job.company} requirements)`);
    }
  }

  const cover_letter = `Dear Hiring Manager at ${job.company},

I am writing to express my strong interest in the ${job.title} role. With a solid background in ${cv.skills.join(", ")}, I have built resilient web applications and high-throughput APIs.

At my previous role as ${cv.work_experience[0]?.role || "Engineer"} at ${cv.work_experience[0]?.company || "Software Firm"}, I successfully optimized system performance and delivered production-grade features using modern frameworks like ${cv.skills[0] || "React"} and ${cv.skills[1] || "Node.js"}.

I am particularly excited about ${job.company}'s mission and would welcome the opportunity to bring my technical skills and problem-solving experience to your engineering team.

Sincerely,
${cv.applicant_name}
${cv.email}
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
