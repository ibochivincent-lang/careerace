// ==============================================================================
// CareerAce Fine-Tuned User Intent Knowledge Base & Taxonomy Engine
// Derived from 200 verified user training variations and optimized prompt chips
// ==============================================================================

export interface IntentCategory {
  slug: string;
  title: string;
  action_prompt: string;
  actionPrompt?: string;
  chip_label: string;
  chipLabel?: string;
  keywords: string[];
}

export interface IntentQuestion {
  id: number;
  query: string;
  intent: string;
}

export interface IntentClassification {
  category: string;
  slug: string;
  confidence: number;
  matchedQuestion?: string;
  matchedKeywords: string[];
  actionPrompt: string;
  chipLabel: string;
}

export const INTENT_TAXONOMY: Record<string, IntentCategory> = {
  "Application Limits & Daily Goals": {
    "slug": "application_limits",
    "title": "Daily Application Limits",
    "action_prompt": "What is my daily application limit and today's goal?",
    "chip_label": "Daily Application Limits",
    "keywords": [
      "daily limit",
      "daily quota",
      "application goal",
      "daily target",
      "cap",
      "allowed",
      "maximum applications",
      "quota",
      "per day",
      "reset",
      "limit",
      "target for the day"
    ]
  },
  "Application Tracker, History & Follow-ups": {
    "slug": "application_tracker",
    "title": "Application Tracker & Follow-ups",
    "action_prompt": "Show my recent applied jobs and follow-up status",
    "chip_label": "Application Tracker",
    "keywords": [
      "applied jobs",
      "applied yesterday",
      "tracker",
      "status",
      "7-day follow-ups",
      "names of jobs",
      "history",
      "recruiter response",
      "follow up",
      "applications submitted",
      "pending follow-up"
    ]
  },
  "Personalized Job Discovery & Matching": {
    "slug": "job_discovery",
    "title": "Personalized Job Discovery",
    "action_prompt": "Show jobs matching my profile and qualifications",
    "chip_label": "Recommended Jobs",
    "keywords": [
      "available jobs for me",
      "job matching",
      "recommended jobs",
      "available roles",
      "roles for me",
      "match my skills",
      "best fit",
      "open positions",
      "hiring now",
      "job openings"
    ]
  },
  "Academic Eligibility & Unlisted Disciplines": {
    "slug": "academic_eligibility",
    "title": "Academic Eligibility & Unlisted Disciplines",
    "action_prompt": "Can I apply if my degree or discipline is not listed?",
    "chip_label": "Unlisted Disciplines",
    "keywords": [
      "disciplines",
      "course of study",
      "other disciplines",
      "degree eligibility",
      "unlisted major",
      "not listed",
      "conversion degree",
      "different field",
      "different background",
      "course of study is not here"
    ]
  },
  "Profile, CV & Credentials Management": {
    "slug": "profile_credentials",
    "title": "Profile & Qualifications",
    "action_prompt": "Review and update my complete profile & qualifications",
    "chip_label": "Profile & Qualifications",
    "keywords": [
      "profile",
      "cv",
      "resume",
      "work history",
      "education",
      "skills",
      "tools",
      "licenses",
      "certifications",
      "credentials",
      "background",
      "study",
      "qualifications",
      "experience",
      "how many cv",
      "how many cvs",
      "how many resumes",
      "how many resume",
      "uploaded cv",
      "uploaded cvs",
      "uploaded resume",
      "uploaded resumes",
      "cv upload",
      "cv uploaded",
      "resume upload",
      "uploaded here",
      "upload history",
      "ats stylish standard",
      "cv versions",
      "resume versions",
      "when did i upload",
      "upload date"
    ]
  },
  "Career Feedback & Profile Advisory": {
    "slug": "career_feedback",
    "title": "Career Feedback & Profile Advisory",
    "action_prompt": "Give me career feedback and role recommendations",
    "chip_label": "Career Feedback",
    "keywords": [
      "career feedback",
      "recommendations",
      "profile optimization",
      "critique",
      "ats score",
      "ats feedback",
      "how to improve",
      "advice",
      "career coaching",
      "suggestions"
    ]
  }
};

export const FINE_TUNED_QUESTIONS: IntentQuestion[] = [
  {
    "id": 1,
    "query": "What is my daily job submission limit?",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 2,
    "query": "How many applications can I submit before the system cuts me off?",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 3,
    "query": "Did I reach my application cap for today?",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 4,
    "query": "How many more roles am I permitted to apply for before midnight?",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 5,
    "query": "Is there a restriction on how many resumes I can send daily?",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 6,
    "query": "What is my application target for the day?",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 7,
    "query": "How close am I to reaching today's application goal?",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 8,
    "query": "Can I apply to more jobs today or am I at the maximum?",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 9,
    "query": "What happens if I exceed my daily application quota?",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 10,
    "query": "At what time does my daily application count reset?",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 11,
    "query": "Is there a limit on how many job openings I can apply for in 24 hours?",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 12,
    "query": "How many applications have I submitted today so far?",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 13,
    "query": "How many more jobs do I need to apply for to hit my daily target?",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 14,
    "query": "Why is the apply button disabled for today?",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 15,
    "query": "Can I increase my daily job application allowance?",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 16,
    "query": "Does the platform have a cap on daily resume submissions?",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 17,
    "query": "Show my progress towards today's job application goal.",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 18,
    "query": "Am I still eligible to send more job applications today?",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 19,
    "query": "What is the maximum number of vacancies I can submit to per day?",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 20,
    "query": "Did I hit my application quota already?",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 21,
    "query": "How many open positions can an applicant apply to each day?",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 22,
    "query": "Can I set a personal daily goal for job applications?",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 23,
    "query": "Where can I see how many applications I have left for today?",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 24,
    "query": "Is there an hourly or daily throttle on applications?",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 25,
    "query": "How many submissions are remaining on my daily allowance?",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 26,
    "query": "What is the recommended daily application pace?",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 27,
    "query": "Did I complete my application checklist for today?",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 28,
    "query": "How many jobs did I apply to this morning?",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 29,
    "query": "Why am I getting a limit reached notification?",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 30,
    "query": "What is the threshold for daily candidate applications?",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 31,
    "query": "Can I save a draft if I have already reached my daily limit?",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 32,
    "query": "How many jobs are allowed per candidate per day?",
    "intent": "Application Limits & Daily Goals"
  },
  {
    "id": 33,
    "query": "Can you show me the list of jobs I submitted applications for?",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 34,
    "query": "Which companies did I apply to yesterday?",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 35,
    "query": "Where can I see my job submission history?",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 36,
    "query": "Are there any jobs I applied to last week that need a follow-up?",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 37,
    "query": "Show me the status of my pending job applications.",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 38,
    "query": "Did my applications from yesterday go through successfully?",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 39,
    "query": "Which roles have passed the 7-day mark without an employer response?",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 40,
    "query": "Can I get an update on all my active submissions?",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 41,
    "query": "What were the job titles of the positions I applied for recently?",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 42,
    "query": "Have any employers viewed my application from yesterday?",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 43,
    "query": "Show me my application log for the past 7 days.",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 44,
    "query": "Which jobs did I apply for over the weekend?",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 45,
    "query": "Is there an automatic follow-up reminder for applications older than a week?",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 46,
    "query": "How do I know if my submitted application was rejected or shortlisted?",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 47,
    "query": "Can I see a chronological list of every role I've applied to?",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 48,
    "query": "Are there any recruiter messages regarding my recent applications?",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 49,
    "query": "Did any of my applications from this week get reviewed?",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 50,
    "query": "Show me all jobs currently waiting for recruiter feedback.",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 51,
    "query": "Which company applications are due for a 7-day follow-up email?",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 52,
    "query": "Can I download a history report of all my applied jobs?",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 53,
    "query": "How many total applications did I complete yesterday?",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 54,
    "query": "Show me the names of all employers I reached out to this month.",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 55,
    "query": "Where can I check if an employer opened my resume?",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 56,
    "query": "What is the status of my submission to the last three companies?",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 57,
    "query": "Did I apply to this job already?",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 58,
    "query": "Can you verify if I submitted an application for the frontend position yesterday?",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 59,
    "query": "List every role where I haven't received a response in 7 days.",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 60,
    "query": "How can I send a polite follow-up for a pending application?",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 61,
    "query": "Are any of my active job applications under review right now?",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 62,
    "query": "Show me my job application dashboard and tracker.",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 63,
    "query": "How many total applications have I sent since joining?",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 64,
    "query": "Which applications were archived or closed by the employer?",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 65,
    "query": "Can I view the exact cover letter and resume I used for yesterday's application?",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 66,
    "query": "Has there been any status change on my pending submissions?",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 67,
    "query": "Show my application activity log.",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 68,
    "query": "Which applied jobs are still awaiting an interview decision?",
    "intent": "Application Tracker, History & Follow-ups"
  },
  {
    "id": 69,
    "query": "Which job vacancies currently match my skill set?",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 70,
    "query": "Show me recommended jobs based on my profile.",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 71,
    "query": "Are there any open roles that fit my background?",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 72,
    "query": "What positions am I eligible to apply for right now?",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 73,
    "query": "Find jobs where my experience matches the requirements.",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 74,
    "query": "What openings on the platform are best suited for me?",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 75,
    "query": "Can you list suitable job openings for my profile?",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 76,
    "query": "What new jobs match my qualifications today?",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 77,
    "query": "Are there remote jobs available that align with my skills?",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 78,
    "query": "Filter current vacancies to show only high-match positions.",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 79,
    "query": "What entry-level or mid-level roles fit my background?",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 80,
    "query": "Show me top job recommendations for my field.",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 81,
    "query": "Are there any urgent vacancies matching my professional expertise?",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 82,
    "query": "Which companies are currently hiring candidates with my profile?",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 83,
    "query": "Can I see jobs that require the specific tools listed on my CV?",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 84,
    "query": "Show me positions where my profile has a 90% or higher match score.",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 85,
    "query": "What are the best job opportunities available for me this week?",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 86,
    "query": "Find jobs that match my preferred work location and skills.",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 87,
    "query": "Which open positions best utilize my recent work experience?",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 88,
    "query": "Are there any job listings tailored to my specific industry?",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 89,
    "query": "Show me available vacancies that don't require 5+ years of experience.",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 90,
    "query": "Can you find roles where my certifications give me an advantage?",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 91,
    "query": "What openings are currently accepting applications that match my profile?",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 92,
    "query": "Give me a curated list of job openings suited to my qualifications.",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 93,
    "query": "Which jobs should I prioritize applying to based on my profile?",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 94,
    "query": "Are there any new postings in my area of expertise today?",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 95,
    "query": "Help me find roles that fit both my educational background and skills.",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 96,
    "query": "Show me vacancies that match my desired job title.",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 97,
    "query": "Can you recommend contract or full-time roles matching my resume?",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 98,
    "query": "What jobs are available right now that I am qualified for?",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 99,
    "query": "Which recruiters are seeking candidates with my exact tech stack?",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 100,
    "query": "Show me opportunities tailored to my career trajectory.",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 101,
    "query": "Are there matching openings with immediate start dates?",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 102,
    "query": "Filter the job feed to display only roles relevant to my CV.",
    "intent": "Personalized Job Discovery & Matching"
  },
  {
    "id": 103,
    "query": "My exact college degree isn't in the dropdown menu - can I still apply?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 104,
    "query": "What should I do if my major isn't listed among the options?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 105,
    "query": "Can candidates with non-traditional degrees apply for this role?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 106,
    "query": "Does this position accept related disciplines outside the listed requirements?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 107,
    "query": "How do I proceed if my course of study is missing from the list?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 108,
    "query": "Am I disqualified if my university degree has a different title?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 109,
    "query": "Can I substitute equivalent coursework if my exact major isn't provided?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 110,
    "query": "Is a degree in a related field accepted for this opening?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 111,
    "query": "Can I select 'Other' if my educational discipline is not listed?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 112,
    "query": "Does practical work experience waive the required degree discipline?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 113,
    "query": "Can I apply if I graduated from a polytechnic or non-university institution?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 114,
    "query": "My major is slightly different from the posting - will my application be screened out?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 115,
    "query": "How do I enter an unlisted foreign degree or international diploma?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 116,
    "query": "Are interdisciplinary degrees accepted for technical vacancies?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 117,
    "query": "What option should I choose if my field of study isn't in the platform's database?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 118,
    "query": "Can self-taught or bootcamp graduates apply without a listed degree?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 119,
    "query": "Is there an option to manually type my course of study if it's missing?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 120,
    "query": "Will an applicant tracking system automatically reject me for an unlisted major?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 121,
    "query": "Can I apply if my degree is in progress and not completed?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 122,
    "query": "How do I explain that my unlisted degree is equivalent to the required discipline?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 123,
    "query": "Can arts and humanities graduates apply for cross-functional tech roles?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 124,
    "query": "Are conversion degrees recognized for roles with strict discipline criteria?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 125,
    "query": "What should I write under 'Course of Study' if mine is not cataloged?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 126,
    "query": "Can I apply for engineering positions with an applied physics degree?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 127,
    "query": "Does the hiring team accept equivalent military or trade qualifications?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 128,
    "query": "Is there a contact person to request adding my university major to the list?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 129,
    "query": "How strictly are degree discipline requirements enforced by recruiters?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 130,
    "query": "Can certifications make up for having an unrelated college major?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 131,
    "query": "What if my program was renamed after I graduated?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 132,
    "query": "Can dual-major students submit their application using their second major?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 133,
    "query": "Is an unlisted associate degree eligible for bachelor-level postings?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 134,
    "query": "How do I bypass the required degree field if my exact study isn't there?",
    "intent": "Academic Eligibility & Unlisted Disciplines"
  },
  {
    "id": 135,
    "query": "Where can I update my work history and CV details?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 136,
    "query": "How do I add my latest certification and professional licenses to my account?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 137,
    "query": "Can I edit the tools and technical skills listed on my profile?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 138,
    "query": "Show me an overview of my current resume information.",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 139,
    "query": "Where do I add new employer experience to my candidate file?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 140,
    "query": "How do I update my school, degree, and graduation dates?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 141,
    "query": "Can I upload a revised copy of my resume?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 142,
    "query": "Is my profile missing any essential background or contact details?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 143,
    "query": "How do I delete an outdated job position from my profile?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 144,
    "query": "Where can I upload certificates or PDF verification documents?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 145,
    "query": "Can I reorder my skills to highlight the most relevant tools?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 146,
    "query": "How do I change my primary job title in my profile?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 147,
    "query": "What percentage of my profile is currently complete?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 148,
    "query": "How do I add a newly acquired technical license?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 149,
    "query": "Can I link my GitHub, portfolio, or LinkedIn profile to my CV?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 150,
    "query": "How do I update my years of work experience?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 151,
    "query": "Where do I write a professional bio or summary of qualifications?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 152,
    "query": "How many CVs have I uploaded here?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 153,
    "query": "How do I verify my education credentials on the platform?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 154,
    "query": "Can employers see my full work history before offering an interview?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 155,
    "query": "Where can I preview how my resume looks to hiring managers?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 156,
    "query": "How do I update my contact phone number and residential address?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 157,
    "query": "Can I add references or recommendation letters to my profile?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 158,
    "query": "How do I list freelance and contract projects under my work experience?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 159,
    "query": "Where do I input soft skills versus technical tools?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 160,
    "query": "Can I remove expired licenses from my candidate profile?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 161,
    "query": "How often should I refresh my skills and certifications?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 162,
    "query": "Can I import my work background directly from my LinkedIn profile?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 163,
    "query": "How do I mark a previous job as confidential on my resume?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 164,
    "query": "Where do I specify my language proficiencies and fluency levels?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 165,
    "query": "How many resumes have I uploaded to CareerAce?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 166,
    "query": "When was my CV uploaded and what changes were made?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 167,
    "query": "Can you remember how many CVs I uploaded and when?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 168,
    "query": "Can I download my profile as an ATS-formatted PDF resume?",
    "intent": "Profile, CV & Credentials Management"
  },
  {
    "id": 169,
    "query": "How can I improve my profile to get more interview invitations?",
    "intent": "Career Feedback & Profile Advisory"
  },
  {
    "id": 170,
    "query": "What feedback do you have on my resume and qualification summary?",
    "intent": "Career Feedback & Profile Advisory"
  },
  {
    "id": 171,
    "query": "Why am I not hearing back from the jobs I've applied to?",
    "intent": "Career Feedback & Profile Advisory"
  },
  {
    "id": 172,
    "query": "Which skills should I add to make my profile more competitive?",
    "intent": "Career Feedback & Profile Advisory"
  },
  {
    "id": 173,
    "query": "Can you audit my application profile and suggest areas for improvement?",
    "intent": "Career Feedback & Profile Advisory"
  },
  {
    "id": 174,
    "query": "What roles would give me the best probability of getting hired?",
    "intent": "Career Feedback & Profile Advisory"
  },
  {
    "id": 175,
    "query": "Do my qualifications align well with current industry expectations?",
    "intent": "Career Feedback & Profile Advisory"
  },
  {
    "id": 176,
    "query": "Give me a critical review of my candidate background.",
    "intent": "Career Feedback & Profile Advisory"
  },
  {
    "id": 177,
    "query": "How can I optimize my CV to pass Applicant Tracking Systems (ATS)?",
    "intent": "Career Feedback & Profile Advisory"
  },
  {
    "id": 178,
    "query": "What are the weakest areas in my job application materials?",
    "intent": "Career Feedback & Profile Advisory"
  },
  {
    "id": 179,
    "query": "Are my listed salary expectations aligned with market rates for my skills?",
    "intent": "Career Feedback & Profile Advisory"
  },
  {
    "id": 180,
    "query": "How can I present a career gap more favorably on my profile?",
    "intent": "Career Feedback & Profile Advisory"
  },
  {
    "id": 181,
    "query": "What certifications should I pursue next to advance my career?",
    "intent": "Career Feedback & Profile Advisory"
  },
  {
    "id": 182,
    "query": "Can you recommend keywords I should include in my work descriptions?",
    "intent": "Career Feedback & Profile Advisory"
  },
  {
    "id": 183,
    "query": "Why is my application conversion rate lower than average?",
    "intent": "Career Feedback & Profile Advisory"
  },
  {
    "id": 184,
    "query": "How can I make my project descriptions sound more impactful?",
    "intent": "Career Feedback & Profile Advisory"
  },
  {
    "id": 185,
    "query": "What feedback do recruiters typically have for candidates in my field?",
    "intent": "Career Feedback & Profile Advisory"
  },
  {
    "id": 186,
    "query": "Can you suggest alternative career paths based on my existing skill set?",
    "intent": "Career Feedback & Profile Advisory"
  },
  {
    "id": 187,
    "query": "How do I tailor my resume for senior leadership positions?",
    "intent": "Career Feedback & Profile Advisory"
  },
  {
    "id": 188,
    "query": "What is holding my profile back from appearing in top candidate searches?",
    "intent": "Career Feedback & Profile Advisory"
  },
  {
    "id": 189,
    "query": "Can you grade my profile summary on clarity and persuasiveness?",
    "intent": "Career Feedback & Profile Advisory"
  },
  {
    "id": 190,
    "query": "How can I transition into a new industry with my current background?",
    "intent": "Career Feedback & Profile Advisory"
  },
  {
    "id": 191,
    "query": "What are hiring managers looking for in my domain this year?",
    "intent": "Career Feedback & Profile Advisory"
  },
  {
    "id": 192,
    "query": "How do I effectively highlight quantifiable achievements in my past roles?",
    "intent": "Career Feedback & Profile Advisory"
  },
  {
    "id": 193,
    "query": "Can you suggest improvements to my portfolio presentation?",
    "intent": "Career Feedback & Profile Advisory"
  },
  {
    "id": 194,
    "query": "What steps can I take to stand out among dozens of applicants?",
    "intent": "Career Feedback & Profile Advisory"
  },
  {
    "id": 195,
    "query": "Is my work experience detailed enough to justify my target seniority level?",
    "intent": "Career Feedback & Profile Advisory"
  },
  {
    "id": 196,
    "query": "How can I improve my response rate after submitting applications?",
    "intent": "Career Feedback & Profile Advisory"
  },
  {
    "id": 197,
    "query": "What are the top three red flags in my current profile?",
    "intent": "Career Feedback & Profile Advisory"
  },
  {
    "id": 198,
    "query": "Can you give me personalized career coaching based on my application trends?",
    "intent": "Career Feedback & Profile Advisory"
  },
  {
    "id": 199,
    "query": "How does my profile compare against other candidates in the same field?",
    "intent": "Career Feedback & Profile Advisory"
  },
  {
    "id": 200,
    "query": "What strategic changes will help me land interviews faster?",
    "intent": "Career Feedback & Profile Advisory"
  }
];

export interface StreamlinedPromptChip {
  id: string;
  label: string;
  prompt: string;
  category: string;
  badge?: string;
}

export const STREAMLINED_PROMPT_CHIPS: StreamlinedPromptChip[] = [
  {
    id: "recommended_jobs",
    label: "Recommended Jobs",
    prompt: "Show jobs matching my profile and qualifications",
    category: "Personalized Job Discovery & Matching",
    badge: "Matching",
  },
  {
    id: "application_tracker",
    label: "Application Tracker",
    prompt: "Show my recent applied jobs and follow-up status",
    category: "Application Tracker, History & Follow-ups",
    badge: "7-Day Log",
  },
  {
    id: "daily_limits",
    label: "Daily Limits & Goals",
    prompt: "What is my daily application limit and today's goal?",
    category: "Application Limits & Daily Goals",
    badge: "Cadence",
  },
  {
    id: "profile_credentials",
    label: "Profile & Qualifications",
    prompt: "Review and update my complete profile & qualifications",
    category: "Profile, CV & Credentials Management",
    badge: "Walrus CV",
  },
  {
    id: "unlisted_disciplines",
    label: "Unlisted Disciplines",
    prompt: "Can I apply if my degree or discipline is not listed?",
    category: "Academic Eligibility & Unlisted Disciplines",
    badge: "Eligibility",
  },
  {
    id: "career_feedback",
    label: "Career Feedback",
    prompt: "Give me career feedback and role recommendations",
    category: "Career Feedback & Profile Advisory",
    badge: "Coaching",
  },
  {
    id: "ats_audit",
    label: "ATS Resume Audit",
    prompt: "Audit my resume against ATS benchmarks and keyword scores",
    category: "Profile, CV & Credentials Management",
    badge: "ATS X-Ray",
  },
  {
    id: "walrus_vault",
    label: "Walrus Sovereign Vault",
    prompt: "What credentials and versions are sealed in my Walrus memory?",
    category: "Profile, CV & Credentials Management",
    badge: "Decentralized",
  },
];

function normalizeQuery(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function computeWordOverlap(aWords: Set<string>, bWords: Set<string>): number {
  if (aWords.size === 0 || bWords.size === 0) return 0;
  let intersection = 0;
  for (const w of aWords) {
    if (bWords.has(w)) intersection++;
  }
  const union = new Set([...aWords, ...bWords]).size;
  return union > 0 ? intersection / union : 0;
}

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "of", "with",
  "is", "are", "was", "were", "be", "been", "i", "my", "me", "you", "your",
  "can", "do", "does", "did", "if", "what", "which", "how", "show", "tell",
  "there", "this", "that", "it", "from", "by", "as"
]);

function extractSignificantWords(text: string): Set<string> {
  const words = normalizeQuery(text).split(" ");
  return new Set(words.filter((w) => w.length > 2 && !STOP_WORDS.has(w)));
}

/**
 * Classifies an incoming user query against the 200 fine-tuned variations
 * and the 6 categorized keyword taxonomies.
 */
export function classifyUserIntent(rawQuery: string): IntentClassification {
  const normQuery = normalizeQuery(rawQuery);
  const queryWords = extractSignificantWords(rawQuery);

  // 1. Direct or Near-Exact match against the 200 questions
  let bestQuestionMatch: { q: IntentQuestion; score: number } | null = null;
  for (const item of FINE_TUNED_QUESTIONS) {
    const normQ = normalizeQuery(item.query);
    if (normQuery === normQ) {
      const tax = INTENT_TAXONOMY[item.intent];
      return {
        category: item.intent,
        slug: tax ? tax.slug : "general",
        confidence: 0.99,
        matchedQuestion: item.query,
        matchedKeywords: tax ? tax.keywords.slice(0, 4) : [],
        actionPrompt: tax ? (tax.actionPrompt || tax.action_prompt) : item.query,
        chipLabel: tax ? (tax.chipLabel || tax.chip_label) : "General",
      };
    }

    const qWords = extractSignificantWords(item.query);
    const overlap = computeWordOverlap(queryWords, qWords);
    if (!bestQuestionMatch || overlap > bestQuestionMatch.score) {
      bestQuestionMatch = { q: item, score: overlap };
    }
  }

  // 2. Keyword cluster scoring across the 6 categories
  const categoryScores: Record<string, { score: number; matchedKeywords: string[] }> = {};
  for (const [catName, catData] of Object.entries(INTENT_TAXONOMY)) {
    categoryScores[catName] = { score: 0, matchedKeywords: [] };
    for (const kw of catData.keywords) {
      const normKw = normalizeQuery(kw);
      if (normQuery.includes(normKw)) {
        categoryScores[catName].score += 3;
        categoryScores[catName].matchedKeywords.push(kw);
      } else {
        const kwWords = normKw.split(" ");
        const allWordsPresent = kwWords.every((w) => normQuery.includes(w));
        if (allWordsPresent && kwWords.length > 1) {
          categoryScores[catName].score += 2;
          categoryScores[catName].matchedKeywords.push(kw);
        }
      }
    }
  }

  // Factor in question variation match score
  if (bestQuestionMatch && bestQuestionMatch.score > 0.45) {
    const qIntent = bestQuestionMatch.q.intent;
    if (categoryScores[qIntent]) {
      categoryScores[qIntent].score += bestQuestionMatch.score * 5;
    }
  }

  // Specific domain regex signals
  if (/(how many|cap|quota|limit|maximum|goal|target|cutoff|reset)/i.test(rawQuery) && /(day|daily|today|submit|apply)/i.test(rawQuery)) {
    categoryScores["Application Limits & Daily Goals"].score += 4;
  }
  if (/(yesterday|history|applied|tracker|status|follow[- ]?up|response|names? of)/i.test(rawQuery)) {
    categoryScores["Application Tracker, History & Follow-ups"].score += 4;
  }
  if (/(recommend|available|matching|fit|find|openings?|roles? for me|open roles|vacancies)/i.test(rawQuery) && /(job|work|career|position)/i.test(rawQuery)) {
    categoryScores["Personalized Job Discovery & Matching"].score += 4;
  }
  if (/(discipline|course of study|major|degree|not listed|different field|non-traditional|academic)/i.test(rawQuery)) {
    categoryScores["Academic Eligibility & Unlisted Disciplines"].score += 4;
  }
  if (/(profile|cv|resume|credentials?|experience|education|skills?|tools?|certifications?|licenses?)/i.test(rawQuery) && !/(feedback|critique|improve)/i.test(rawQuery)) {
    categoryScores["Profile, CV & Credentials Management"].score += 3;
  }
  if (!/(feedback|critique|improve|advice)/i.test(rawQuery) && (/(how many|count|number of|how much)/i.test(rawQuery) || /(upload|uploaded)/i.test(rawQuery) || /(when did|when was).*upload/i.test(rawQuery)) && /(cv|cvs|resume|resumes)/i.test(rawQuery)) {
    categoryScores["Profile, CV & Credentials Management"].score += 6;
  }
  if (/(feedback|critique|improve|ats score|advice|suggestion|audit|rate|optimize)/i.test(rawQuery)) {
    categoryScores["Career Feedback & Profile Advisory"].score += 4;
  }

  // Find highest scoring category
  let topCategory = "Profile, CV & Credentials Management";
  let topScore = -1;
  let topKeywords: string[] = [];

  for (const [catName, res] of Object.entries(categoryScores)) {
    if (res.score > topScore) {
      topScore = res.score;
      topCategory = catName;
      topKeywords = res.matchedKeywords;
    }
  }

  const tax = INTENT_TAXONOMY[topCategory] || INTENT_TAXONOMY["Profile, CV & Credentials Management"];
  const confidence = topScore > 0 ? Math.min(0.95, 0.4 + topScore * 0.1) : 0.35;

  return {
    category: topCategory,
    slug: tax.slug,
    confidence,
    matchedQuestion: bestQuestionMatch && bestQuestionMatch.score > 0.3 ? bestQuestionMatch.q.query : undefined,
    matchedKeywords: topKeywords,
    actionPrompt: tax.actionPrompt || tax.action_prompt,
    chipLabel: tax.chipLabel || tax.chip_label,
  };
}

/**
 * Formats a timestamp or ISO string into a human-friendly date string.
 * Example: 'Monday, 5th of October, 2026'
 */
export function formatFriendlyDate(dateInput: any, defaultStr = "Monday, 5th of October, 2026"): string {
  if (!dateInput) return defaultStr;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return defaultStr;
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const day = d.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th";
  return `${dayNames[d.getDay()]}, ${day}${suffix} of ${monthNames[d.getMonth()]}, ${d.getFullYear()}`;
}

/**
 * Synthesizes grounded, data-backed responses from Walrus Sovereign Memory
 * based on the classified intent category.
 */
export function generateIntentMemoryResponse(
  classification: IntentClassification,
  profile: any,
  appliedJobs: any[] = [],
  rawQuery = ""
): string | null {
  const hasProfile = !!(profile && (profile.applicant_name || profile.target_roles?.length || profile.skills?.length));
  const candidateName = profile?.applicant_name && !profile.applicant_name.startsWith("0x") ? profile.applicant_name : "";
  const role = profile?.target_roles?.[0] || profile?.role || "Professional";
  const skills: string[] = Array.isArray(profile?.skills) ? profile.skills : [];
  const experience: any[] = Array.isArray(profile?.work_experience) ? profile.work_experience : [];
  const education: any[] = Array.isArray(profile?.academic_history) ? profile.academic_history : [];

  const now = new Date();
  const todayStr = now.toDateString();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const todayApplied = appliedJobs.filter((a) => {
    const t = a.appliedTimestamp || (a.appliedAt ? new Date(a.appliedAt).getTime() : 0);
    return t && new Date(t).toDateString() === todayStr;
  });

  const yesterdayApplied = appliedJobs.filter((a) => {
    const t = a.appliedTimestamp || (a.appliedAt ? new Date(a.appliedAt).getTime() : 0);
    return t && new Date(t).toDateString() === yesterdayStr;
  });

  switch (classification.category) {
    case "Application Limits & Daily Goals": {
      const dailyCount = todayApplied.length;
      const dailyGoal = 5;
      const progressPercent = Math.min(100, Math.round((dailyCount / dailyGoal) * 100));

      return (
        `**Daily Application Limits & Progress Tracker**\n\n` +
        `• **Daily Application Quota:** CareerAce does **not** cap your total daily dispatches. You are permitted to apply to as many verified openings as you wish.\n` +
        `• **Anti-Spam & Delivery Safeguards:** Dispatches include an automatic 2 to 5-second humanized pacing safeguard and a 5-day organization cooldown to protect your applicant deliverability and recruiter reception.\n` +
        `• **Today's Goal Progress:** You have submitted **${dailyCount} / ${dailyGoal} applications** today (${progressPercent}% of target).\n` +
        `• **Daily Reset Schedule:** Quota counters and daily activity cadence reset every midnight (00:00 UTC).\n\n` +
        (dailyCount >= dailyGoal
          ? `Outstanding work! You have achieved today's application goal. You can continue dispatching more or review your active 7-day follow-ups on the **Application Board**.`
          : `You are **${dailyGoal - dailyCount} application(s)** away from hitting today's target. Explore verified roles on the **Application Board** to keep up momentum.`)
      );
    }

    case "Application Tracker, History & Follow-ups": {
      const lowerQuery = rawQuery.toLowerCase();
      const isAskingYesterday = lowerQuery.includes("yesterday");

      if (isAskingYesterday) {
        if (yesterdayApplied.length > 0) {
          const list = yesterdayApplied
            .map((j, i) => `${i + 1}. **${j.jobTitle || j.role || "Target Role"}** at **${j.company || "Company"}**`)
            .join("\n");
          return (
            `**Yesterday's Application Log**\n\n` +
            `From your decentralized tracking log, you submitted **${yesterdayApplied.length} application(s)** yesterday:\n\n` +
            `${list}\n\n` +
            `7-day follow-up milestones for these submissions are active on the **Application Board**.`
          );
        }
        return (
          `**Yesterday's Application Log**\n\n` +
          `You submitted **0 applications** yesterday.\n\n` +
          `Across your entire history, you have **${appliedJobs.length} tracked application(s)**. Visit the **Application Board** to view your comprehensive pipeline.`
        );
      }

      if (appliedJobs.length === 0) {
        return (
          `**Application Tracker & 7-Day Follow-ups**\n\n` +
          `You have no tracked job applications yet.\n\n` +
          `When you apply to jobs through our Universal Application Board, CareerAce automatically:\n` +
          `• Records the company, role, and submission date to your sovereign log\n` +
          `• Generates an RFC-compliant .eml dispatch receipt\n` +
          `• Sets up a real-time **7-day follow-up milestone** so you know exactly when to follow up with hiring managers.\n\n` +
          `Head over to the **Application Board** to discover verified openings and submit your first application.`
        );
      }

      const recentList = appliedJobs
        .slice(0, 6)
        .map((j, i) => {
          const dateStr = j.appliedAt
            ? typeof j.appliedAt === "string"
              ? j.appliedAt.slice(0, 10)
              : new Date(j.appliedAt).toLocaleDateString()
            : "Recently";
          const followUpDays = j.followUpDaysLeft !== undefined ? ` (Follow-up in ${j.followUpDaysLeft}d)` : "";
          return `${i + 1}. **${j.jobTitle || j.role || "Target Role"}** at **${j.company || "Company"}** — *${dateStr}*${followUpDays}`;
        })
        .join("\n");

      return (
        `**Sovereign Application Tracker & Milestones**\n\n` +
        `You have **${appliedJobs.length} total application(s)** tracked in your sovereign vault:\n\n` +
        `${recentList}\n\n` +
        `• **7-Day Follow-up Engine:** Active reminder badges on the **Application Board** inform you when to send professional recruiter check-ins.\n` +
        `• **Status Tracking:** Monitor each submission across Applied, Interviewing, and Offered stages directly on your board.`
      );
    }

    case "Personalized Job Discovery & Matching": {
      if (!hasProfile) {
        return (
          `**Personalized Job Discovery & Matching**\n\n` +
          `To surface verified jobs precision-matched to your exact background, please upload your CV in **Resume Studio**.\n\n` +
          `Once uploaded, our matching engine indexes your verified competencies and automatically recommends matching positions across Software, Marine & Offshore Engineering, AI Systems, and Corporate Leadership.`
        );
      }

      const topSkills = skills.slice(0, 5).join(", ");
      return (
        `**Personalized Job Matches for ${candidateName || "Candidate"}**\n\n` +
        `• **Target Track:** ${role}\n` +
        `• **Indexed Competencies:** ${topSkills || "Technical execution, problem solving"}\n` +
        `• **Experience Base:** ${experience.length} indexed tenure(s)\n\n` +
        `**Recommended Verified Positions (Application Board):**\n` +
        `1. **Senior Systems Architect / Staff Engineer** at Paystack (Fintech / Cloud Infrastructure)\n` +
        `2. **Distributed Backend Platform Engineer** at Flutterwave (API & High-Volume Payments)\n` +
        `3. **Fleet Operations & Marine Systems Lead** at Genesis Offshore (Marine STCW & Operations)\n` +
        `4. **AI & Autonomous Systems Specialist** at Andela (Distributed AI & Machine Learning)\n\n` +
        `Head over to the **Application Board** to review full job specifications, download RFC .eml receipts, and auto-dispatch directly with your sealed Walrus CV!`
      );
    }

    case "Academic Eligibility & Unlisted Disciplines": {
      return (
        `**Academic Eligibility & Cross-Discipline Guidelines**\n\n` +
        `• **Can you apply with other disciplines?** Yes! CareerAce fully supports candidates applying from non-traditional majors, conversion degrees, and interdisciplinary backgrounds.\n` +
        `• **If your course of study is not in our dropdown:**\n` +
        `  1. Select the closest standard discipline in **Resume Studio**\n` +
        `  2. Directly type and customize your exact degree and institution under the **Academic History** section of your CV canvas\n` +
        `  3. Contact our support team via the help desk—we review candidate submissions and continuously expand our curriculum indexing database.\n\n` +
        `• **How employers evaluate your profile:** Modern hiring teams prioritize verified technical skills, portfolio artifacts, and measurable problem-solving impact over rigid major labels. Your Walrus CV emphasizes quantifiable outcomes to ensure ATS screening success regardless of your degree title.`
      );
    }

    case "Profile, CV & Credentials Management": {
      const lowerQ = rawQuery.toLowerCase();
      const isCvUploadQuery =
        lowerQ.includes("how many cv") ||
        lowerQ.includes("how many resume") ||
        lowerQ.includes("uploaded cv") ||
        lowerQ.includes("uploaded resume") ||
        lowerQ.includes("cv upload") ||
        lowerQ.includes("resume upload") ||
        lowerQ.includes("uploaded here") ||
        lowerQ.includes("upload history") ||
        lowerQ.includes("when did i upload") ||
        lowerQ.includes("when was my cv uploaded") ||
        lowerQ.includes("cv versions") ||
        lowerQ.includes("resume versions") ||
        lowerQ.includes("versions of my cv") ||
        lowerQ.includes("did i upload") ||
        lowerQ.includes("have i uploaded") ||
        (lowerQ.includes("cv") && (lowerQ.includes("count") || lowerQ.includes("uploaded") || lowerQ.includes("history"))) ||
        (lowerQ.includes("resume") && (lowerQ.includes("count") || lowerQ.includes("uploaded") || lowerQ.includes("history")));

      if (!hasProfile) {
        if (isCvUploadQuery) {
          return (
            `**Sovereign CV Upload & Version History**\n\n` +
            `From your sovereign records, you have uploaded **0 CVs** so far.\n\n` +
            `Your decentralized Walrus Sovereign Memory vault does not have an active resume on file yet. Head over to **Resume Studio** to upload and calibrate your resume—we will extract your experience, upgrade it to **ATS stylish standard**, and anchor tamper-proof snapshots to your decentralized vault. CareerAce allows you to maintain up to 3 distinct tailored versions once uploaded.`
          );
        }
        return (
          `**Sovereign Profile & Credentials Vault**\n\n` +
          `No active CV has been indexed in your decentralized Walrus vault yet.\n\n` +
          `Head to **Resume Studio** to attach your PDF or Word resume. Our parser will instantly extract:\n` +
          `• Contact details and sovereign identity\n` +
          `• Target roles and seniority tier\n` +
          `• Work history with active-verb bullet points\n` +
          `• Academic history and technical toolsets\n\n` +
          `You can maintain multiple tailored versions for different industries and commit immutable snapshots to Walrus storage.`
        );
      }

      // Sub-intent: CV Upload Count, Version History & ATS Calibration
      if (isCvUploadQuery) {
        const cvCount = Array.isArray(profile.versions) && profile.versions.length > 0
          ? profile.versions.length
          : (Array.isArray(profile.walrusVersions) && profile.walrusVersions.length > 0 ? profile.walrusVersions.length : 1);
        const uploadDateStr = formatFriendlyDate(profile.uploadedAt, "Monday, 5th of October, 2026");
        const editDateStr = formatFriendlyDate(profile.calibratedAt || profile.updatedAt, "Tuesday, 6th of October, 2026");
        const topSkills = skills.slice(0, 5).join(", ") || "core technical competencies";

        return (
          `**Sovereign CV Upload & Version History — ${candidateName || "Candidate"}**\n\n` +
          `From your sovereign records and Walrus Memory vault, you have uploaded **${cvCount} tailored CV** (${cvCount === 1 ? "1 active snapshot" : `${cvCount} active snapshots`}):\n\n` +
          `• **Initial Upload:** On the **${uploadDateStr}**, you uploaded your initial CV for **${role}** into CareerAce.\n` +
          `• **Calibration & ATS Upgrade:** On the **${editDateStr}**, we edited and calibrated this CV in Resume Studio, making targeted enhancements to upgrade it to **ATS stylish standard** with verified core competencies (${topSkills}), quantifiable achievements, and active-verb formatting.\n` +
          `• **Walrus Sovereign Memory Vault:** CareerAce allows you to maintain up to 3 distinct tailored CV snapshots in your decentralized Walrus vault (e.g., Software & Cloud Systems, Maritime & Offshore Engineering, or AI & Autonomous Systems). You can switch between snapshots, edit on the live canvas, or export ATS-optimized packages anytime in **Resume Studio**.`
        );
      }

      // Sub-intent: Education & Degree
      if (lowerQ.includes("study") || lowerQ.includes("education") || lowerQ.includes("degree") || lowerQ.includes("university") || lowerQ.includes("college") || lowerQ.includes("institution")) {
        if (education.length > 0) {
          const eduList = education
            .map((e: any) => `• **${e.degree || "Degree"}** from **${e.institution || "Institution"}**${e.field_of_study ? ` in ${e.field_of_study}` : ""}${e.graduation_year ? ` (${e.graduation_year})` : ""}`)
            .join("\n");
          return (
            `**Verified Academic Background — ${candidateName || "Candidate"}**\n\n` +
            `Based on your Walrus Sovereign Memory vault, you studied:\n\n` +
            `${eduList}\n\n` +
            `Educational credentials are cryptographically anchored to your decentralized profile and formatted for ATS compliance.`
          );
        }
        return `No formal academic degrees are currently indexed in your profile. You can add your institution and degree directly in **Resume Studio**.`;
      }

      // Sub-intent: Work Experience & Tenures
      if (lowerQ.includes("work") || lowerQ.includes("experience") || lowerQ.includes("companies") || lowerQ.includes("roles") || lowerQ.includes("career tenure")) {
        if (experience.length > 0) {
          const expList = experience
            .map((exp: any, i: number) => {
              const highlights = Array.isArray(exp.highlights) && exp.highlights.length > 0 ? `\n   *Key Achievement:* ${exp.highlights[0]}` : "";
              return `${i + 1}. **${exp.role || "Role"}** at **${exp.company || "Company"}** (${exp.duration || "Active"})${highlights}`;
            })
            .join("\n\n");
          return (
            `**Verified Work Tenures — ${candidateName || "Candidate"}**\n\n` +
            `Here is your indexed work history from your Walrus Memory vault:\n\n` +
            `${expList}\n\n` +
            `You can polish bullet points with active verbs or calibrate accomplishments against live job descriptions in **Resume Studio**.`
          );
        }
        return `No prior work experience is currently recorded. Head to **Resume Studio** to add your career history and accomplishments.`;
      }

      // Sub-intent: Skills & Tools
      if (lowerQ.includes("skill") || lowerQ.includes("tool") || lowerQ.includes("tech stack") || lowerQ.includes("competencies") || lowerQ.includes("technologies")) {
        if (skills.length > 0) {
          const topSkills = skills.slice(0, 20).join(", ");
          return (
            `**Verified Technical Skills & Tools — ${candidateName || "Candidate"}**\n\n` +
            `• **Core Competencies (${skills.length} indexed):** ${topSkills}\n` +
            `• **Target Alignment:** Calibrated for ${role}\n\n` +
            `CareerAce cross-references these keywords against live corporate job descriptions on the **Application Board** to ensure 85%+ ATS fit.`
          );
        }
        return `No skills have been registered yet. Add your programming languages, frameworks, or domain tools in **Resume Studio**.`;
      }

      // Sub-intent: Certifications & Licenses
      if (lowerQ.includes("certif") || lowerQ.includes("license") || lowerQ.includes("credential") || lowerQ.includes("stcw")) {
        const certs = Array.isArray(profile?.certifications) ? profile.certifications : (Array.isArray(profile?.licenses) ? profile.licenses : []);
        if (certs.length > 0) {
          const certList = certs.map((c: any) => typeof c === "string" ? `• **${c}**` : `• **${c.name || c.title || "Certification"}**${c.issuer ? ` (${c.issuer})` : ""}${c.year ? ` · ${c.year}` : ""}`).join("\n");
          return (
            `**Verified Licenses & Certifications — ${candidateName || "Candidate"}**\n\n` +
            `Here are your verified credentials registered in your sovereign Walrus vault:\n\n${certList}\n\n` +
            `These credentials are cryptographically anchored and highlighted across your ATS resume headers and cover letters.`
          );
        }
        return `No specific certifications or licenses have been recorded yet in your profile. You can add professional credentials (e.g. AWS/Azure, PMP, STCW marine certifications) in **Resume Studio**.`;
      }

      // Sub-intent: Walrus Vault & Storage Snapshots
      if (lowerQ.includes("walrus") || lowerQ.includes("vault") || lowerQ.includes("snapshot") || lowerQ.includes("blob") || lowerQ.includes("sealed")) {
        return (
          `**Decentralized Walrus Sovereign Memory Vault**\n\n` +
          `• **Candidate Identity:** ${candidateName || "Candidate"}\n` +
          `• **Primary Discipline:** ${role}\n` +
          `• **Decentralized Storage:** All profile schemas, ATS versions, and application receipts are cryptographically anchored to Walrus blobs.\n` +
          `• **Multiple CV Versions:** You can maintain up to 3 distinct snapshots (e.g. Senior Architect vs Engineering Lead) with distinct Walrus blob IDs.\n` +
          `• **Export & Verification:** You can export verified JSON Resume specs, compile ATS-friendly .docx files, or download RFC .eml dispatch receipts at any time.`
        );
      }

      const eduStr = education.length > 0 ? education.map((e) => `${e.degree} (${e.institution})`).join(", ") : "Not specified";
      const expCount = experience.length;

      return (
        `**Sovereign Profile Overview — ${candidateName || "Candidate"}**\n\n` +
        `• **Target Role:** ${role}\n` +
        `• **Academic Background:** ${eduStr}\n` +
        `• **Work Experience:** ${expCount} indexed tenure(s)\n` +
        `• **Technical Skills (${skills.length}):** ${skills.slice(0, 8).join(", ")}${skills.length > 8 ? " and more" : ""}\n` +
        `• **Walrus Sovereign Memory:** Profile metadata is synchronized and cryptographically anchored.\n\n` +
        `You can edit any section on the live ATS canvas in **Resume Studio**, switch templates (Modern Tech, Ivy League, Senior Architect), and export tamper-proof PDF/.docx packages at any time.`
      );
    }

    case "Career Feedback & Profile Advisory": {
      if (!hasProfile) {
        return (
          `**Career Feedback & Strategic Advisory**\n\n` +
          `To receive an in-depth career evaluation and ATS readiness score, please upload your resume in **Resume Studio**.\n\n` +
          `Our advisory engine audits keyword density, quantifiable achievement metrics, active verb structure, and formatting compatibility against current tech and enterprise hiring benchmarks.`
        );
      }

      return (
        `**Career Feedback & Optimization Advisory for ${candidateName || "Candidate"}**\n\n` +
        `• **Target Positioning:** Your profile is calibrated for **${role}** with **${skills.length} indexed skills**.\n` +
        `• **Action Verb & Impact Polish:** Ensure every work tenure bullet follows the **Action Verb + Task + Measurable Metric** formula (e.g. *"Engineered distributed microservice reducing latency by 38%"* rather than *"Worked on backend"*).\n` +
        `• **ATS Keyword Optimization:** In Resume Studio, run the **ATS X-Ray** audit to verify that industry-standard tools (e.g. TypeScript, Docker, Kubernetes, SQL, CI/CD) appear naturally within your work highlights.\n` +
        `• **Dual-Discipline Advantage:** Maintain 2 tailored CV snapshots (e.g. Core Engineering vs. Technical Leadership) in your Walrus vault to target distinct job specs without diluting your focus.`
      );
    }

    default:
      return null;
  }
}
