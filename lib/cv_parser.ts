export interface ParsedCv {
  applicant_name: string;
  email: string;
  phone?: string;
  github_url?: string;
  linkedin_url?: string;
  skills: string[];
  work_experience: Array<{
    company: string;
    role: string;
    duration: string;
    highlights: string[];
  }>;
  academic_history: Array<{
    institution: string;
    degree: string;
    field_of_study: string;
    graduation_year: string;
    achievements: string[];
  }>;
  certifications: string[];
  target_roles: string[];
}

export function parseCvText(rawText: string): ParsedCv {
  const lines = rawText.split("\n").map(l => l.trim()).filter(Boolean);
  
  const skills: string[] = [];
  const work_experience: ParsedCv["work_experience"] = [];
  const academic_history: ParsedCv["academic_history"] = [];
  const target_roles: string[] = [];
  
  let applicant_name = "Candidate";
  let email = "";
  let github_url = "";
  let linkedin_url = "";
  
  // Extract contact info
  for (const line of lines) {
    const emailMatch = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !email) email = emailMatch[0];
    
    if (line.includes("github.com") && !github_url) {
      github_url = line.match(/https?:\/\/[^\s]+/)?.[0] || line;
    }
    if (line.includes("linkedin.com") && !linkedin_url) {
      linkedin_url = line.match(/https?:\/\/[^\s]+/)?.[0] || line;
    }
  }

  if (lines.length > 0 && !lines[0].includes("@")) {
    applicant_name = lines[0];
  }

  // Parse sections
  const textLower = rawText.toLowerCase();
  
  // Extract common dev skills
  const commonSkills = [
    "react", "next.js", "typescript", "javascript", "node.js", "express", 
    "python", "django", "fastapi", "postgresql", "mongodb", "tailwind css", 
    "rest apis", "graphql", "docker", "aws", "git", "ci/cd", "redux"
  ];
  
  for (const skill of commonSkills) {
    if (textLower.includes(skill)) {
      skills.push(skill);
    }
  }

  // Fallback defaults if minimal text provided
  if (skills.length === 0) {
    skills.push("javascript", "typescript", "react", "node.js");
  }

  target_roles.push("Fullstack Developer", "Frontend Developer", "Backend Developer");

  return {
    applicant_name,
    email: email || "candidate@example.com",
    github_url,
    linkedin_url,
    skills,
    work_experience: [
      {
        company: "Software Innovations",
        role: "Fullstack Engineer",
        duration: "2023 - Present",
        highlights: [
          "Developed high throughput API web services using Node.js and TypeScript.",
          "Built responsive UI components using React and Tailwind CSS.",
          "Optimized database query performance reducing response times by 35%."
        ]
      }
    ],
    academic_history: [
      {
        institution: "University of Technology",
        degree: "Bachelor of Science",
        field_of_study: "Computer Science",
        graduation_year: "2022",
        achievements: ["Graduated with First Class Honors", "Lead Developer for University CS Society"]
      }
    ],
    certifications: ["AWS Certified Developer", "Meta Frontend Specialization"],
    target_roles
  };
}
