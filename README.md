# Career Ace

**Author:** IboTV (`ibochivincent-lang`) — Sole Author & Maintainer.

An AI-driven autonomous career assistant, job match evaluator, CV tailor, application automator, and post-application STAR+R interview coach — built on a decentralized student/candidate career memory vault stored on [Walrus Memory](https://memory.walrus.xyz).

---

## Architecture Overview

```
=============================================================================================================================
                                           CAREER ACE MASTER REFINED ARCHITECTURE
=============================================================================================================================

┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                          USER INTERFACE & INTERACTIVE CHATBOT                                            │
│                                              React + Next.js + Vanilla CSS                                               │
│                                                                                                                          │
│   ┌──────────────────────────────┐          ┌──────────────────────────────┐          ┌──────────────────────────────┐   │
│   │ 1. CV Upload & Academic      │          │ 2. Career Achievements &     │          │ 3. Universal Job Match &     │   │
│   │    Skill History Ingestion   │          │    Work Experience           │          │    Application Engine        │   │
│   └──────────────┬───────────────┘          └──────────────┬───────────────┘          └──────────────┬───────────────┘   │
└──────────────────┼─────────────────────────────────────────┼─────────────────────────────────────────┼───────────────────┘
                   │                                         │                                         │
                   └─────────────────────────────────────────┼─────────────────────────────────────────┘
                                                             │
                                                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                              CAREER ACE AGENT CONTROLLER                                                 │
│                                                (Vercel AI SDK Engine)                                                    │
├────────────────────────────────────────────────────────────┬─────────────────────────────────────────────────────────────┤
│  • Interactive Chat & Explanation Handler                  │  • Autonomous Multi-Source Job Scraper                      │
│  • Post-Application STAR+R Interview Coach                 │  • Automated CV Tailor & Formatting Engine                  │
│  • Candidate Vault Memory Core                             │  • Dual-Track Application Router & Email Agent              │
└─────────────────────────────┬──────────────────────────────┴──────────────────────────────┬──────────────────────────────┘
                              │                                                             │
                              ▼                                                             ▼
┌────────────────────────────────────────────────────────────┐    ┌────────────────────────────────────────────────────────┐
│             AUTOMATED HARVESTING & APPLICATION             │    │                 MODEL CONTEXT PROTOCOL                 │
│                      PIPELINE ENGINE                       │    │                       MCP SERVER                       │
├────────────────────────────────────────────────────────────┤    ├────────────────────────────────────────────────────────┤
│ [1. CV UPLOAD & INITIAL PARSING]                           │    │ • upload_resume_tool                                   │
│   • Parses uploaded PDF/Word CV into structured history    │    │ • recall_career_vault_tool                             │
│   • Accepts user role targets & suggests additional fits   │    │ • job_search_tool                                      │
│                                                            │    │ • evaluate_job_tool                                    │
│ [2. AUTONOMOUS MULTI-SOURCE HARVESTER]                     │    │ • tailor_cv_tool                                       │
│   • Continuous background search across public APIs        │    │ • fill_application_tool                                │
│   • Remote, Onsite, Hybrid, Local, International           │    └──────────────────────────┬─────────────────────────────┘
│                                                            │                               │
│ [3. DUAL-PROFILE MATCHING & FIT SCORER]                    │                               │
│   • Reads Academic History + Work Experience               │                               │
│   • Displays candidate fit score (1-10 Scale)              │                               │
│                                                            │                               │
│ [4. AUTOMATED CV TAILORING & FORMATTING]                   │                               │
│   • Formats & aligns CV bullets to job description         │                               │
│   • Generates evidence-grounded cover letters              │                               │
│                                                            │                               │
│ [5. DUAL TRACK ROUTER & POST-APPLY INTERVIEW PREP]         │                               │
│   ├── TRACK A (Auto-Apply): Score >= 6 & Direct URL        │                               │
│   │   ├── Auto-submits via Gmail / Web Form (Status: Applied)                              │
│   │   └── Triggers Post-Application Interview Coach        │                               │
│   └── TRACK B (Manual Queue): Score < 6 / Complex Form     │                               │
│       └── Flags with reason in UI Queue (Status: Manual)   │                               │
│                                                            │                               │
│ [6. NOTION SYNC & WALRUS VAULT STORAGE]                    │                               │
│   ├── Syncs applications to Notion Tracker                 │                               │
│   └── Encrypts & persists all data to Walrus Memory        │                               │
└─────────────────────────────┬──────────────────────────────┘                               │
                              │                                                              │
                              └──────────────────────────────┬───────────────────────────────┘
                                                             │
                                                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           DECENTRALIZED CAREER VAULT                                                     │
│                                          (Walrus Memory + Sui / Enoki)                                                   │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ • Encrypted Original Uploaded CVs & Parsed Academic/Work History                                                         │
│ • Encrypted Formatted & Tailored CV Versions for Applied Roles                                                           │
│ • Candidate Preferences, Match Scores, Application Records & Interview Prep Notes                                        │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Features

1. **Resume & CV Ingestion:** Parses candidate experience, education, and skills.
2. **Universal Multi-Source Job Harvester:** Harvests jobs across Remote, Onsite, and Hybrid modalities globally.
3. **AI Candidate Fit Scorer:** Computes a 1-10 fit score comparing job requirements against vault history.
4. **Automated CV Bullet Tailoring:** Aligns candidate experience with job description keywords without inventing facts.
5. **Dual-Track Router:** Auto-submits direct applications (Track A) while placing complex ATS portals in a manual review queue (Track B).
6. **Post-Application STAR+R Interview Coach:** Simulates role-specific technical and behavioral interviews.
7. **Model Context Protocol (MCP) Server:** Exposes tool endpoints for external agent workflows.

---

## Author & Attribution

* **Sole Author:** IboTV (`ibochivincent-lang`)
* **License:** Private & Proprietary to IboTV
