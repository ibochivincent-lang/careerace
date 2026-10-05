import zipfile
import xml.etree.ElementTree as ET
import json
import os

docx_questions_path = r"C:\Users\User\Downloads\200_Fine_Tuned_User_Intent_Questions.docx"
docx_chips_path = r"C:\Users\User\Downloads\Fine_Tuned_Prompt_Chips_and_Keywords.docx"

def extract_questions(path):
    with zipfile.ZipFile(path) as z:
        xml_content = z.read("word/document.xml")
        tree = ET.fromstring(xml_content)
        rows = []
        for p in tree.iter():
            if p.tag.endswith("}tr"):
                cells = []
                for tc in p.iter():
                    if tc.tag.endswith("}tc"):
                        text = "".join(t.text for t in tc.iter() if t.tag.endswith("}t") and t.text)
                        cells.append(text.strip())
                if cells and len(cells) >= 3 and cells[0].isdigit():
                    clean_query = (
                        cells[1]
                        .strip('"')
                        .strip()
                        .replace('\ufffd', ' - ')
                        .replace('—', ' - ')
                        .replace('–', ' - ')
                        .replace('“', '"')
                        .replace('”', '"')
                        .replace("’", "'")
                        .replace("‘", "'")
                    )
                    rows.append({
                        "id": int(cells[0]),
                        "query": clean_query,
                        "intent": cells[2].strip()
                    })
        return rows

def extract_chips_text(path):
    with zipfile.ZipFile(path) as z:
        xml_content = z.read("word/document.xml")
        tree = ET.fromstring(xml_content)
        texts = []
        for elem in tree.iter():
            if elem.tag.endswith("}t") and elem.text:
                texts.append(elem.text)
            elif elem.tag.endswith("}p"):
                texts.append("\n")
        return "".join(texts)

questions = extract_questions(docx_questions_path)
chips_text = extract_chips_text(docx_chips_path)

print(f"Total extracted questions: {len(questions)}")

# Intent categories mapping and keywords
taxonomy = {
    "Application Limits & Daily Goals": {
        "slug": "application_limits",
        "title": "Daily Application Limits",
        "action_prompt": "What is my daily application limit and today's goal?",
        "chip_label": "Daily Application Limits",
        "keywords": ["daily limit", "daily quota", "application goal", "daily target", "cap", "allowed", "maximum applications", "quota", "per day", "reset", "limit", "target for the day"]
    },
    "Application Tracker, History & Follow-ups": {
        "slug": "application_tracker",
        "title": "Application Tracker & Follow-ups",
        "action_prompt": "Show my recent applied jobs and follow-up status",
        "chip_label": "Application Tracker",
        "keywords": ["applied jobs", "applied yesterday", "tracker", "status", "7-day follow-ups", "names of jobs", "history", "recruiter response", "follow up", "applications submitted", "pending follow-up"]
    },
    "Personalized Job Discovery & Matching": {
        "slug": "job_discovery",
        "title": "Personalized Job Discovery",
        "action_prompt": "Show jobs matching my profile and qualifications",
        "chip_label": "Recommended Jobs",
        "keywords": ["available jobs for me", "job matching", "recommended jobs", "available roles", "roles for me", "match my skills", "best fit", "open positions", "hiring now", "job openings"]
    },
    "Academic Eligibility & Unlisted Disciplines": {
        "slug": "academic_eligibility",
        "title": "Academic Eligibility & Unlisted Disciplines",
        "action_prompt": "Can I apply if my degree or discipline is not listed?",
        "chip_label": "Unlisted Disciplines",
        "keywords": ["disciplines", "course of study", "other disciplines", "degree eligibility", "unlisted major", "not listed", "conversion degree", "different field", "different background", "course of study is not here"]
    },
    "Profile, CV & Credentials Management": {
        "slug": "profile_credentials",
        "title": "Profile & Qualifications",
        "action_prompt": "Review and update my complete profile & qualifications",
        "chip_label": "Profile & Qualifications",
        "keywords": ["profile", "cv", "resume", "work history", "education", "skills", "tools", "licenses", "certifications", "credentials", "background", "study", "qualifications", "experience"]
    },
    "Career Feedback & Profile Advisory": {
        "slug": "career_feedback",
        "title": "Career Feedback & Profile Advisory",
        "action_prompt": "Give me career feedback and role recommendations",
        "chip_label": "Career Feedback",
        "keywords": ["career feedback", "recommendations", "profile optimization", "critique", "ats score", "ats feedback", "how to improve", "advice", "career coaching", "suggestions"]
    }
}

os.makedirs("data", exist_ok=True)
with open("data/fine_tuned_user_intents.json", "w", encoding="utf-8") as f:
    json.dump({
        "taxonomy": taxonomy,
        "questions": questions
    }, f, indent=2, ensure_ascii=False)

print("Saved data/fine_tuned_user_intents.json successfully!")
