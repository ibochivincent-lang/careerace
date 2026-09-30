import { ProcessedApplication } from "./application_router";
import { ParsedCv } from "./cv_parser";

export interface StarQuestion {
  question_id: string;
  category: "technical" | "behavioral" | "leadership" | "architecture";
  question_text: string;
  suggested_star_angle: {
    situation: string;
    task: string;
    action: string;
    result: string;
    reflection: string;
  };
}

export function generatePostApplicationInterviewPrep(
  application: ProcessedApplication,
  cv: ParsedCv
): StarQuestion[] {
  return [
    {
      question_id: `q_${application.job_id}_1`,
      category: "technical",
      question_text: `Can you describe a challenging technical problem you solved using ${cv.skills[0] || "React"} at your previous role?`,
      suggested_star_angle: {
        situation: `Working at ${cv.work_experience[0]?.company || "previous company"}, system latency was impacting user retention.`,
        task: "Refactor core API response handling and optimize component rendering.",
        action: "Implemented memoization, virtualized lists, and asynchronous query caching.",
        result: "Reduced page load time by 40% and improved throughput.",
        reflection: "Learned the value of proactive performance profiling during early architecture planning."
      }
    },
    {
      question_id: `q_${application.job_id}_2`,
      category: "behavioral",
      question_text: `How do you approach aligning code implementations with tight business deadlines at ${application.company}?`,
      suggested_star_angle: {
        situation: `During the launch phase for ${cv.work_experience[0]?.role || "Engineering team"}, requirements shifted close to deadline.`,
        task: "Deliver core features on time without compromising production quality or security.",
        action: "Prioritized MVP features, set up automated integration tests, and maintained continuous communication with product managers.",
        result: "Successfully shipped key features on schedule with zero critical bugs.",
        reflection: "Demonstrated that transparent scope management is key to delivering high quality software under tight deadlines."
      }
    }
  ];
}
