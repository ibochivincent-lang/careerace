/**
 * 5 Core System Design Architectural Pillars
 * Covers the fundamental system design trade-offs presented in Video 3:
 * 1. SQL vs NoSQL
 * 2. Authentication vs Authorization
 * 3. Monolith vs Microservices
 * 4. Vertical Scaling vs Horizontal Scaling
 * 5. Synchronous vs Asynchronous Communication
 * 
 * Maps directly to how CareerAce is constructed in production.
 */

export interface SystemDesignPillar {
  id: string
  title: string
  conceptA: {
    name: string
    tagline: string
    keyCharacteristics: string[]
    bestFor: string
    careerAceUsage: string
    codeSnippet: string
  }
  conceptB: {
    name: string
    tagline: string
    keyCharacteristics: string[]
    bestFor: string
    careerAceUsage: string
    codeSnippet: string
  }
  decisionRubric: string
}

export const SYSTEM_DESIGN_PILLARS: SystemDesignPillar[] = [
  {
    id: 'sql-vs-nosql',
    title: '1. SQL vs NoSQL',
    conceptA: {
      name: 'SQL (Relational)',
      tagline: 'Structured schema with strict table relationships & ACID transactions',
      keyCharacteristics: [
        'Predefined tables with strict column types and foreign keys',
        'ACID transactions ensure zero state corruption',
        'High-performance complex multi-table JOINs and aggregations',
        'Structured query language with rich indexing (B-Tree, GIN)',
      ],
      bestFor: 'Relational business entities, billing, applications, candidate profiles',
      careerAceUsage: 'Supabase PostgreSQL managing candidates, job_applications, and candidate_memories tables.',
      codeSnippet: `// CareerAce SQL Schema in PostgreSQL:
CREATE TABLE job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_wallet TEXT NOT NULL,
  company TEXT NOT NULL,
  role_title TEXT NOT NULL,
  status TEXT DEFAULT 'applied',
  fit_score NUMERIC(4, 2)
);`,
    },
    conceptB: {
      name: 'NoSQL / Decentralized Blobs',
      tagline: 'Flexible JSON documents & content-addressed erasure-coded storage',
      keyCharacteristics: [
        'Schema-free flexible structures that adapt without migrations',
        'Direct JSON object storage with horizontal partitioning',
        'Content-addressed cryptographic hashes (Walrus Blob IDs)',
        'Decentralized permanence across Byzantine storage nodes',
      ],
      bestFor: 'Polymorphic CV payloads, tailored dossiers, encrypted resumes',
      careerAceUsage: 'Walrus Protocol storing erasure-coded candidate JSON dossiers and encrypted STCW licenses.',
      codeSnippet: `// CareerAce NoSQL Blob on Walrus:
const blob = {
  version: "2.0.0-walrus",
  candidate: "0x123...abc",
  tailored_experience: [...skills],
  stcw_certifications: [...licenses]
};
const { blobId } = await storeBlobOnWalrus(JSON.stringify(blob));`,
    },
    decisionRubric:
      'Use SQL when data has strict relational integrity and transactional guarantees. Use NoSQL/Blobs when payloads are semi-structured, rapidly evolving, or require decentralized permanence.',
  },
  {
    id: 'authn-vs-authz',
    title: '2. Authentication vs Authorization',
    conceptA: {
      name: 'Authentication (AuthN)',
      tagline: 'Who you are (Verifying cryptographic or credential identity)',
      keyCharacteristics: [
        'Identity challenge via passwords, OTPs, or zero-knowledge proofs',
        'Establishes caller identity without granting implicit access rights',
        'Outputs a verifiable session token or public cryptographic address',
        'Sovereign Web3 zkLogin maps Web2 OAuth to blockchain keypairs',
      ],
      bestFor: 'Sign-in flows, biometric validation, OAuth/zkLogin handshakes',
      careerAceUsage: 'Sui Enoki zkLogin mapping Google ID tokens to sovereign Sui wallet addresses.',
      codeSnippet: `// CareerAce Authentication via zkLogin:
const { address } = await completeGoogleZkLogin(idToken);
// User identity verified: caller is 0x4f8...91a`,
    },
    conceptB: {
      name: 'Authorization (AuthZ)',
      tagline: 'What you can do (Enforcing permissions & resource ownership)',
      keyCharacteristics: [
        'Evaluates permissions on specific resources (Read / Write / Delete)',
        'Prevents Insecure Direct Object References (IDOR attacks)',
        'Role-Based Access Control (RBAC) and candidate subscription tiers',
        'Server-side validation ensures callers only mutate owned records',
      ],
      bestFor: 'Access control lists, administrative gating, feature quotas',
      careerAceUsage: 'validateRecordOwnership and server session verification in Route Handlers.',
      codeSnippet: `// CareerAce Authorization Guard (IDOR Defense):
const authorized = validateRecordOwnership(
  resource.candidate_wallet,
  session.authenticatedAddress
);
if (!authorized) return NextResponse.json({ error: "Forbidden" }, { status: 403 });`,
    },
    decisionRubric:
      'Authentication establishes identity. Authorization decides whether that identity has permission to perform an action on a specific resource.',
  },
  {
    id: 'monolith-vs-microservices',
    title: '3. Monolith vs Microservices',
    conceptA: {
      name: 'Modular Monolith',
      tagline: 'Single unified codebase with zero inter-service network overhead',
      keyCharacteristics: [
        'Single repository, single deployment pipeline, zero distributed latency',
        'Shared type definitions and immediate atomic refactoring',
        'Simple local development and synchronized release cycles',
        'Easier debugging with consolidated stack traces and logs',
      ],
      bestFor: 'Rapid product velocity, cohesive apps, low-latency API routes',
      careerAceUsage: 'Next.js unified App Router coordinating UI components, Server Components, and API Route Handlers.',
      codeSnippet: `// CareerAce Modular Monolith:
// Client UI + Server Route Handlers in a single repository
// /app/dashboard/page.tsx -> /app/api/candidate/sync/route.ts`,
    },
    conceptB: {
      name: 'Microservices & External Engines',
      tagline: 'Independent services with decoupled failure boundaries & scale',
      keyCharacteristics: [
        'Autonomous microservices communicating via HTTP/gRPC or message queues',
        'Independent scaling (e.g. mail dispatchers scale separately from UI)',
        'Fault isolation: an email provider outage never crashes the core app',
        'Decoupled technology stacks and dedicated databases',
      ],
      bestFor: 'Heterogeneous workloads, specialized pipelines, external services',
      careerAceUsage: 'Decoupled external micro-engines: Resend Email Worker, Walrus Aggregator, Sui Fullnode RPC.',
      codeSnippet: `// CareerAce External Micro-Service Dispatch:
await fetch("https://publisher.walrus-mainnet.walrus.space/v1/blobs", {
  method: "PUT",
  body: payloadStream
});`,
    },
    decisionRubric:
      'Start with a Modular Monolith for maximum speed and simplicity. Extract heavy, asynchronous, or isolated subsystems into Microservices when scaling demands it.',
  },
  {
    id: 'vertical-vs-horizontal',
    title: '4. Vertical vs Horizontal Scaling',
    conceptA: {
      name: 'Vertical Scaling (Scale Up)',
      tagline: 'Add more CPU, RAM, and SSD to an existing single machine',
      keyCharacteristics: [
        'Zero architectural redesign: standard app runs faster on larger hardware',
        'No distributed concurrency or network partitioning complexities',
        'Strict hardware ceilings: you cannot buy a machine beyond vendor limits',
        'Single point of failure (SPOF) during hardware maintenance or faults',
      ],
      bestFor: 'Relational databases, single-threaded compute tasks, initial MVPs',
      careerAceUsage: 'PostgreSQL instance compute scaling on Supabase dedicated tiers.',
      codeSnippet: `// Vertical Scale:
// Upgrade DB from 2 vCPU / 4GB RAM -> 16 vCPU / 64GB RAM
// No code changes required; throughput expands until hardware ceiling.`,
    },
    conceptB: {
      name: 'Horizontal Scaling (Scale Out)',
      tagline: 'Distribute traffic across multiple instances behind a load balancer',
      keyCharacteristics: [
        'Elastic scale: spin up 1 to 1,000+ instances based on incoming traffic spikes',
        'High availability: failed instances are replaced with zero downtime',
        'Stateless design requirement: shared state moved to external caches/DBs',
        'Near infinite scaling ceiling at cloud edge',
      ],
      bestFor: 'Stateless web apps, edge functions, high-concurrency API gateways',
      careerAceUsage: 'Vercel Serverless Edge Lambdas running stateless Next.js Route Handlers globally.',
      codeSnippet: `// Horizontal Scale in CareerAce:
// Route handlers are completely stateless.
// Each request is handled by an isolated Vercel Lambda:
export const dynamic = 'force-dynamic';
export async function GET(req: Request) { ... }`,
    },
    decisionRubric:
      'Scale vertically for database workloads where relational consistency is paramount. Scale horizontally for stateless API servers and web traffic.',
  },
  {
    id: 'sync-vs-async',
    title: '5. Synchronous vs Asynchronous',
    conceptA: {
      name: 'Synchronous Communication',
      tagline: 'Client calls service and blocks/waits until response completes',
      keyCharacteristics: [
        'Direct request-response model: client execution halts until answer arrives',
        'Immediate feedback: user receives result in the active HTTP transaction',
        'Cascading timeout risks: downstream latency directly delays the user',
        'Requires high availability on the receiving service',
      ],
      bestFor: 'Instant ATS score calculations, interactive chat, authentication handshakes',
      careerAceUsage: 'Real-time heuristic CV ATS scoring and instant prompt evaluation.',
      codeSnippet: `// Synchronous ATS Evaluation:
const score = calculateAtsBenchmark(resumeText, jobDescription);
// User receives score within 150ms in same request cycle.`,
    },
    conceptB: {
      name: 'Asynchronous Communication',
      tagline: 'Client emits event and continues immediately ("Keep Going")',
      keyCharacteristics: [
        'Fire-and-forget or deferred background processing via queues/workers',
        'Non-blocking user experience: client never waits for long batch jobs',
        'Buffered load: queues smooth traffic spikes, preventing DB meltdowns',
        'Completed results communicated via webhooks, polling, or email receipts',
      ],
      bestFor: 'Walrus epoch storage anchoring, multi-provider email dispatches, digests',
      careerAceUsage: 'Background Walrus blob replication and resilient Resend/Brevo email cascade.',
      codeSnippet: `// Asynchronous Dispatch in CareerAce:
sendApplicationDispatchEmail(applicationPayload)
  .then(() => logAudit("Email sent"))
  .catch(err => logAudit("Queued retry"));
// Client receives immediate 200 OK without waiting for SMTP handshakes.`,
    },
    decisionRubric:
      'Use Synchronous communication when the user cannot proceed without the immediate answer. Use Asynchronous communication for heavy I/O, external network calls, and long-running batch operations.',
  },
]
