# Career Ace

**Author:** IboTV (`ibochivincent-lang`) — Sole Author and Maintainer.
**Repository:** [https://github.com/ibochivincent-lang/careerace](https://github.com/ibochivincent-lang/careerace)
**Stack:** Next.js 16 (Turbopack), React 19, TypeScript 5, Tailwind CSS, Walrus Protocol, Sui Blockchain, Mysten Labs SDK

---

## Overview

Career Ace is an autonomous career copilot, dual-track application harvester, executive and maritime CV tailor, decentralized career vault, and STAR+R interview coach. It solves the critical problem of platform lock-in and opaque ATS screening by anchoring candidate career records into an encrypted, self-sovereign vault hosted on the [Walrus Protocol](https://walrus.xyz) and cryptographically anchored to the [Sui blockchain](https://sui.io) via Sui Move smart contracts and the Sui Name Service (SuiNS).

Whether applying to global shipping conglomerates, subsea engineering operators, or frontier artificial intelligence labs, Career Ace provides candidates with end-to-end tooling: from heuristic multi-format CV ingestion and multi-ATS scoring simulation to a two-box dispatch console with decentralized attachment delivery and live inline application customization.

---

## Master Architecture

```
=============================================================================================================
                                     CAREER ACE MASTER SYSTEM TOPOLOGY
=============================================================================================================

+-----------------------------------------------------------------------------------------------------------+
|                                    CANDIDATE INTERFACE & WORKSPACE                                        |
|                                       Next.js 16 + React 19 + Tailwind                                    |
|                                                                                                           |
|  +---------------------------+   +---------------------------+   +-------------------------------------+  |
|  | 1. Executive CV Ingestion |   | 2. Verified 382+ Directory|   | 3. Two-Box Dispatch Board           |  |
|  |    & Multi-Format Parser  |   |    & Target Scraper       |   |    Box 1: Document Upload & Walrus  |  |
|  |    (STCW Maritime Gating) |   |    (Zero Mock Contacts)   |   |    Box 2: Inline Pitch Editor       |  |
|  +-------------+-------------+   +-------------+-------------+   +------------------+------------------+  |
+----------------|-------------------------------|------------------------------------|---------------------+
                 |                               |                                    |
                 +-------------------------------+------------------------------------+
                                                 |
                                                 v
+-----------------------------------------------------------------------------------------------------------+
|                                     CAREER ACE CORE AGENT CONTROLLER                                      |
|                                         (App Router API Engine)                                           |
+------------------------------------------------+----------------------------------------------------------+
| - Heuristic Multi-Section CV Parser            | - Multi-ATS Benchmark Simulator (Workday, Taleo, Lever)  |
| - STCW Maritime License Gating Engine          | - Evidence-Grounded CV Tailoring Engine (No AI Slop)     |
| - Verified Hiring Directory Indexer (382+)     | - Authenticated Email Relay Agent (DKIM / SPF Signed)    |
| - STAR+R Pedagogical Interview Coach           | - SuiNS Domain Resolver & Move Anchoring Service         |
+-----------------------+------------------------+------------------------------------+---------------------+
                        |                                                             |
                        v                                                             v
+------------------------------------------------+    +-----------------------------------------------------+
|        APPLICATION & DISPATCH PIPELINE         |    |              MODEL CONTEXT PROTOCOL (MCP)           |
+------------------------------------------------+    +-----------------------------------------------------+
| - Box 1: Multi-file native document upload     |    | - upload_resume_tool                                |
|   (/api/attachment/upload -> Walrus Blob)      |    | - recall_career_vault_tool                          |
| - Box 2: Live inline message editing           |    | - job_search_tool                                   |
|   (Dynamic company salutations & pitch reset)  |    | - evaluate_job_tool                                 |
| - Action Toolbar: 1-Click Relay, Mailto,       |    | - tailor_cv_tool                                    |
|   SPF/DKIM Settings, RFC 5545 ICS Reminders    |    | - fill_application_tool                             |
+-----------------------+------------------------+    +---------------------------------+-------------------+
                        |                                                               |
                        +-------------------------------+-------------------------------+
                                                        |
                                                        v
+-----------------------------------------------------------------------------------------------------------+
|                                      DECENTRALIZED CAREER VAULT                                           |
|                                       (Walrus Protocol + Sui)                                             |
+-----------------------------------------------------------------------------------------------------------+
| - Encrypted raw CVs, tailored resumes, and multi-file credential attachments stored as Walrus blobs       |
| - Verifiable onchain cryptographic anchors generated via Sui Move smart contracts                        |
| - Human-readable .sui handles resolved via SuiNS for public verifiable candidate passports (/p/[username])|
+-----------------------------------------------------------------------------------------------------------+
```

For complete sequence diagrams, data schemas, and API contracts, see [ARCHITECTURE.md](file:///c:/Users/User/.gemini/antigravity-ide/scratch/careerace/ARCHITECTURE.md).

---

## Key Capabilities

### 1. Heuristic Executive & Maritime CV Parser
- **Multi-Format Extraction**: Parses diverse layout styles including Company-first, Role-first, inline expressions (`Role at Company (Dates)`), compound dash structures (`Company - Role`), and pipe-delimited multi-column rows.
- **Non-Standard Section Handling**: Automatically identifies and structures non-traditional sections such as Leadership Activities, Academic Conferences, Maritime Licensure, Dynamic Positioning Logs, and Honors.
- **Zero Placeholder Guarantee**: Rejects and sanitizes phantom strings like `"the Organization"`, defaulting strictly to extracted company identities or verified domain entities.
- **STCW Marine Gating**: Automatically inspects credentials against Standards of Training, Certification and Watchkeeping (STCW) requirements, identifying Basic Safety Training (BST), Certificate of Competency (CoC Class 1/2/3/4), ENG1 Medical certificates, Seaman's Discharge Books, Dynamic Positioning (DP), and BOSIET survival certifications.

### 2. Verified 382+ Employer Directory (Zero Mock Data)
- Built-in index of 382+ verified maritime, offshore energy, and technology hiring departments across Rotterdam, Singapore, Houston, Aberdeen, Lagos, London, and Dubai.
- Direct corporate crewing, technical recruitment, and engineering contacts for operators such as Maersk, American Bureau of Shipping (ABS), Stolt-Nielsen, Bourbonese, Tidewater, Subsea 7, TechnipFMC, DNV, Lloyd's Register, AWS, Google Cloud, Cloudflare, and Datadog.
- Zero fake placeholder addresses (`example.com` or `test@test.com`).

### 3. Multi-ATS Benchmark Simulator
- Simulates parsing and ranking algorithms across enterprise ATS platforms: Workday, Greenhouse, Taleo, and Lever.
- Evaluates CV parseability, keyword match density, active verb frequency, and quantified metric density, providing concrete remediation steps before submission.

### 4. Two-Box Auto-Apply Dispatch Console
- **Box 1 (CV & Document Attachments)**:
  - Native multi-file upload (`.pdf`, `.docx`, `.doc`, `.png`, `.jpg`).
  - Files are processed via `/api/attachment/upload`, stored as decentralized Walrus blobs, and cached in browser storage.
  - Displays file name, size in KB, Walrus storage status, and immediate removal controls.
  - Active CV version dropdown selector to toggle between uploaded CV drafts and Walrus snapshots.
  - Credential quick-toggles for instant inclusion of BST, CoC, ENG1, Seaman's Book, DP, and BOSIET.
- **Box 2 (Cover Letter & Application Pitch)**:
  - Directly editable full-width textarea (`rows={11}`) with live character count.
  - Eliminated disruptive page redirects; candidates compose and customize their pitch directly on the board.
  - Dynamic company greeting (`Dear [Company] Hiring Team,` or `Dear Hiring Team,`).
  - Manual edits are strictly preserved via the `isBodyUserEdited` state lock.
  - Inline Reset Draft button to re-calibrate pitch to target company without losing attachments.
  - One-click Copy Draft button.
- **Action Toolbar**:
  - Send Application via 1-Click Relay (`/api/email/dispatch`) passing attachments, Walrus blob IDs, role, and company.
  - Open in Mail App fallback (`mailto:` with pre-populated subject and encoded body).
  - Email Relay Settings modal (DKIM/SPF status, Gmail OAuth, Outlook, Sovereign SMTP).
  - Automated 7-Day Follow-Up Reminder generation via RFC 5545 `.ics` calendar events.

### 5. Decentralized Career Vault & Onchain Identity
- **Walrus Protocol Storage**: Encrypted resumes, tailored variations, and uploaded credential documents are permanently stored on decentralized Walrus storage nodes across multiple epochs.
- **Sui Move Onchain Anchoring**: Cryptographic transaction digests anchor Walrus blob IDs directly to candidate sovereign addresses on the Sui blockchain.
- **Sui Name Service (SuiNS)**: Resolves `.sui` human-readable handles (e.g., `maritime-chief.sui`) and serves verifiable public candidate passports at `/p/[username]`.

### 6. STAR+R Pedagogical Interview Coach
- Real-time multi-turn simulation framework evaluating candidate responses across:
  - **Situation**: Contextual setting and scope.
  - **Task**: Explicit objective and responsibility.
  - **Action**: Concrete technical execution.
  - **Result**: Quantified operational metrics (efficiency gains, safety records, latency reductions).
  - **Reflection**: Architectural tradeoffs and retrospective insights.
- Includes refusal guards to prevent handing over answers, prompting candidates to uncover insights through Socratic follow-up questions.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend Framework | Next.js 16 (App Router, Turbopack), React 19, Vanilla CSS & Tailwind CSS |
| Programming Language | TypeScript 5 (Strict Mode) |
| Decentralized Storage | Walrus Protocol (Mysten Labs) |
| Blockchain & Identity | Sui Network (Testnet & Mainnet), Sui Move, SuiNS, zkLogin |
| Parsing & Processing | PDFParse, Mammoth (DOCX), Heuristic Regex Multi-Pass Engine |
| Communication Relay | Authenticated SMTP, Resend API, RFC 5545 ICS Generator |
| Testing Suite | Node.js Test Runner, TypeScript 5, Zero External Test Framework Bloat |

---

## Local Development & Setup

### Prerequisites
- Node.js 20.x or higher
- pnpm (recommended) or npm
- Git

### Installation

```bash
# 1. Clone repository
git clone https://github.com/ibochivincent-lang/careerace.git
cd careerace

# 2. Install dependencies
pnpm install

# 3. Configure environment variables
cp .env.example .env.local

# 4. Run development server with Turbopack
pnpm run dev
```

The application will be available at `http://localhost:3000`.

---

## Environment Variables Reference

Configure the following variables in your `.env.local` file:

```env
# Application Host
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your-32-character-secret-key-goes-here

# Walrus Protocol Decentralized Storage
WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space

# Sui Blockchain & SuiNS Configuration
SUI_NETWORK=testnet
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
SUI_PACKAGE_ID=0x...

# Email Relay (Resend / SMTP)
RESEND_API_KEY=re_...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-app-password
SMTP_FROM=CareerAce Applications <applications@careerace.io>

# Google zkLogin / OAuth (Optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## Testing & Verification

The project includes an automated test suite verifying CV parsing, STCW gating, SuiNS normalization, Walrus anchoring, ATS scoring, and RFC 5545 calendar generation:

```bash
# Run full unit test suite (65 tests across 7 test suites)
npm test

# Run TypeScript static type checking
npx tsc --noEmit

# Run Next.js production build verification
npm run build
```

---

## Deployment Guide: What and Where to Deploy

### Target Platform 1: Vercel (Recommended)
- **What to deploy**: The Next.js 16 App Router repository directly connected to the `main` branch.
- **Why**: Native support for Turbopack builds, Edge API routes, streaming responses, and zero-configuration serverless function execution.
- **Deployment Steps**:
  1. Import `ibochivincent-lang/careerace` in the Vercel Dashboard.
  2. Set Framework Preset to **Next.js**.
  3. Add the production environment variables listed above.
  4. Trigger deployment via `git push origin main` or via the Vercel CLI:
     ```bash
     npx vercel --prod
     ```

### Target Platform 2: Containerized Deployment (Railway / Render / AWS ECS)
- **What to deploy**: A multi-stage Docker container serving Next.js standalone output.
- **Dockerfile Reference**:
  ```dockerfile
  FROM node:20-alpine AS builder
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci
  COPY . .
  RUN npm run build

  FROM node:20-alpine AS runner
  WORKDIR /app
  ENV NODE_ENV=production
  COPY --from=builder /app/public ./public
  COPY --from=builder /app/.next/standalone ./
  COPY --from=builder /app/.next/static ./.next/static
  EXPOSE 3000
  CMD ["node", "server.js"]
  ```

---

## World-Class Standard Recommendations

To maintain and expand CareerAce as a global category leader in career automation:

1. **Integrated Recruiter Response Webhook**:
   - Establish an inbound webhook endpoint (`/api/email/inbound`) that captures recruiter replies, parses interview requests, and automatically updates the Application Tracker status.

2. **Decentralized Verifiable Credential Badges (W3C VC / Sui Kiosk)**:
   - Allow maritime academies, universities, and classification societies to issue signed onchain Soulbound Tokens (SBT) directly into candidate Walrus vaults.

3. **Multi-Recipient Crewing Dispatch**:
   - Enable candidates to dispatch applications simultaneously to both the vessel manager and the crewing superintendent while tracking distinct open and delivery rates.

4. **Biometric WebRTC Speech Practice**:
   - Upgrade the STAR+R Interview Coach with real-time audio latency analysis and filler-word detection (`um`, `uh`, `like`) during verbal simulation rounds.

---

## Author & Attribution

- **Sole Author:** IboTV (`ibochivincent-lang`)
- **License:** Private and Proprietary to IboTV
