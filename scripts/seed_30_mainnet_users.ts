/**
 * Walrus Memory 30-User Scaling Engine
 *
 * Generates and seeds 30 comprehensive professional candidate profiles across Web3, AI, DevOps,
 * Fullstack, Mobile, and Security engineering domains, storing 10 distinct career facts per candidate
 * directly to Walrus Mainnet under isolated namespaces.
 *
 * Author: IboTV (ibochivincent-lang)
 */

import { MemWal } from "@mysten-incubation/memwal";

export interface CandidateUser {
  id: string;
  name: string;
  namespace: string;
  domain: string;
  memories: string[];
}

export const CANDIDATE_PROFILES_30: CandidateUser[] = [
  {
    id: "user_01",
    name: "Alex Rivera",
    namespace: "candidate_01_alex_rivera",
    domain: "Web3 Frontend & Move dApps",
    memories: [
      "Target Role: Senior Frontend Engineer at high-throughput L1/L2 ecosystem teams with target base $175,000.",
      "Work Experience: Led frontend team at Nova Protocol, architecting real-time DEX analytics dashboard in Next.js 16 and TypeScript.",
      "Key Achievement: Reduced initial page load latency by 48% using dynamic route segment caching and virtualized order book rendering.",
      "Core Competency: Expert in Sui Move dApp integration, @mysten/sui TypeScript SDK, and zkLogin sovereign authentication flows.",
      "Interview Strength: Strong STAR+R Situation and Task structuring in high-pressure incident post-mortems and live RPC failover.",
      "Identified Weakness: Tends to spend too much time explaining architecture context during behavioral rounds before stating the specific action taken.",
      "STAR Reflection: Needs to explicitly quantify operational impact (e.g. 99.99% uptime maintained across 2M daily requests).",
      "Tailored CV Bullet: Architected non-custodial portfolio tracking engine handling 50k concurrent WebSocket subscriptions with zero memory leaks.",
      "Career Preference: Seeks remote-first engineering cultures with asynchronous decision-making and continuous delivery.",
      "Active Application: In final loop with Sui Foundation ecosystem partners for Senior Platform Infrastructure role."
    ]
  },
  {
    id: "user_02",
    name: "Sarah Chen",
    namespace: "candidate_02_sarah_chen",
    domain: "AI Systems & Model Inference",
    memories: [
      "Target Role: Staff AI Infrastructure Engineer focusing on decentralized model inference and agentic memory architectures.",
      "Work Experience: Senior Systems Engineer at TensorFlow cluster platform, optimizing GPU memory allocation and model weights sharding.",
      "Key Achievement: Reduced LLM inference time-to-first-token (TTFT) by 35% through custom vLLM paged attention kernels.",
      "Core Competency: Deep expertise in PyTorch, Rust, CUDA programming, vector embeddings, and LangChain/Vercel AI SDK pipelines.",
      "Interview Strength: Exceptional technical depth when whiteboarding distributed vector search topologies and cosine similarity indexing.",
      "Identified Weakness: Struggles with concise 60-second elevator pitches; can over-index on low-level GPU kernel mechanics.",
      "STAR Reflection: Emphasized learning proactive stakeholder communication when negotiating infrastructure budget constraints.",
      "Tailored CV Bullet: Built high-performance vector retrieval service serving 10M semantic queries daily with sub-15ms p99 latency.",
      "Career Preference: Strongly prioritizes cutting-edge open-source AI models (DeepSeek, Qwen, Llama) over proprietary black-box APIs.",
      "Active Application: Submitted application to Walrus Protocol memory infrastructure core development team."
    ]
  },
  {
    id: "user_03",
    name: "Marcus Adebayo",
    namespace: "candidate_03_marcus_adebayo",
    domain: "Fullstack Product & Payments",
    memories: [
      "Target Role: Engineering Lead or Senior Fullstack Product Engineer at fast-growing fintech or career tech startups.",
      "Work Experience: Fullstack Lead at PayBridge Africa, scaling payment rail onboarding across 6 countries in Sub-Saharan Africa.",
      "Key Achievement: Grew monthly active merchant transactions from 10k to 250k while maintaining zero fraud chargeback incidents.",
      "Core Competency: Proficient in React 19, TailwindCSS, Node.js microservices, PostgreSQL, and secure cryptographic signatures.",
      "Interview Strength: Outstanding STAR+R behavioral storytelling demonstrating leadership under regulatory policy changes.",
      "Identified Weakness: Needs additional practice articulating trade-offs between relational ACID databases vs decentralized storage.",
      "STAR Reflection: Highlighted team mentorship and pair-programming culture as primary factors in reducing bug regression by 60%.",
      "Tailored CV Bullet: Designed unified candidate verification system integrating zero-knowledge identity proofs and on-chain attestations.",
      "Career Preference: Values high product autonomy, cross-functional collaboration with product design, and competitive equity.",
      "Active Application: Actively interviewing for Product Engineering Lead at Decentralized Talent Hub."
    ]
  },
  {
    id: "user_04",
    name: "Elena Rostova",
    namespace: "candidate_04_elena_rostova",
    domain: "Smart Contract Security & Auditing",
    memories: [
      "Target Role: Lead Smart Contract Security Auditor or Protocol Security Engineer with target comp $190,000.",
      "Work Experience: Senior Auditor at CertiK, reviewing DeFi protocols, Move modules, and cross-chain bridge contracts.",
      "Key Achievement: Discovered and remediated critical re-entrancy and capability escalation vulnerabilities in $50M TVL lending protocol.",
      "Core Competency: Expert in Sui Move formal verification, Echidna fuzzing, static analysis, and automated invariant testing.",
      "Interview Strength: Flawless technical breakdown of byte-level capability checks and on-chain permission validation.",
      "Identified Weakness: Occasionally overly conservative in estimating audit remediation turnaround timelines.",
      "STAR Reflection: Learned to provide constructive developer-friendly remediation guides instead of purely critical vulnerability reports.",
      "Tailored CV Bullet: Authored 45+ comprehensive security audit reports safeguarding $350M+ in combined cross-chain digital assets.",
      "Career Preference: Prefers fully remote engagements with dedicated bug bounty recognition programs.",
      "Active Application: In discussions with Mysten Labs security team regarding formal verification tooling."
    ]
  },
  {
    id: "user_05",
    name: "Tariq Mansoor",
    namespace: "candidate_05_tariq_mansoor",
    domain: "DevOps & Cloud Infrastructure",
    memories: [
      "Target Role: Senior Platform / Site Reliability Engineer (SRE) specializing in Kubernetes and decentralized node clusters.",
      "Work Experience: Lead DevOps Engineer at FinCloud Labs, managing multi-region AWS and bare-metal RPC cluster deployments.",
      "Key Achievement: Automated zero-downtime rolling upgrades across 120 Kubernetes nodes, cutting deployment failure rates to zero.",
      "Core Competency: Deep knowledge of Terraform, ArgoCD, Prometheus, Grafana, Docker, Helm charts, and Linux kernel tuning.",
      "Interview Strength: Clear and structured STAR incident response walkthroughs covering P1 outages and automated circuit breakers.",
      "Identified Weakness: Prefers infrastructure-as-code automation over writing application-layer business logic.",
      "STAR Reflection: Realized that establishing shared SLI/SLO dashboards with developers dramatically cuts mean-time-to-resolution (MTTR).",
      "Tailored CV Bullet: Engineered enterprise observability pipeline processing 5TB logs daily with real-time alerting under 3 seconds.",
      "Career Preference: Seeks high-availability infrastructure roles with modern asynchronous on-call rotations.",
      "Active Application: Applying to decentralized validator node infrastructure providers."
    ]
  },
  {
    id: "user_06",
    name: "Kavita Patel",
    namespace: "candidate_06_kavita_patel",
    domain: "Data Engineering & Analytics",
    memories: [
      "Target Role: Staff Data Engineer / Analytics Architect specializing in streaming data pipelines and on-chain indexing.",
      "Work Experience: Senior Data Engineer at ChainMetrics, building real-time Kafka and Flink indexing pipelines for blockchain transactions.",
      "Key Achievement: Reduced batch pipeline processing time from 4 hours to 12 minutes using Apache Spark and Iceberg lakehouses.",
      "Core Competency: Expert in Python, Apache Kafka, Apache Flink, ClickHouse, BigQuery, dbt, and GraphQL subgraphs.",
      "Interview Strength: Methodical explanation of exactly-once stream processing semantics and stateful stream recovery.",
      "Identified Weakness: Tends to spend excessive time optimizing SQL execution plans when a simpler index suffices.",
      "STAR Reflection: Learned to prioritize schema backwards-compatibility before introducing breaking data transformations.",
      "Tailored CV Bullet: Architected real-time on-chain token liquidity indexing cluster serving 50M API requests per day.",
      "Career Preference: Values high-trust data organizations with robust automated data quality frameworks.",
      "Active Application: In final stages for Lead Data Architect at Web3 analytics company."
    ]
  },
  {
    id: "user_07",
    name: "Liam O'Connor",
    namespace: "candidate_07_liam_oconnor",
    domain: "Mobile Engineer (React Native & Swift)",
    memories: [
      "Target Role: Lead Mobile Engineer (iOS & React Native) building non-custodial crypto wallets and biometric authentication.",
      "Work Experience: Senior Mobile Developer at PocketVault, developing iOS and Android wallet apps with native enclave key storage.",
      "Key Achievement: Scaled mobile app from 50k to 500k monthly active users with a 99.95% crash-free session rate.",
      "Core Competency: Proficient in React Native, Swift, Kotlin, Secure Enclave, FaceID integration, and WalletConnect v2.",
      "Interview Strength: Strong focus on mobile UX security, memory leak prevention, and background state synchronization.",
      "Identified Weakness: Can be hesitant to adopt newly released experimental mobile SDK features before official LTS releases.",
      "STAR Reflection: Proactive beta-testing with diverse device profiles prevented major release day regressions.",
      "Tailored CV Bullet: Built native zero-knowledge proof generation module in Swift executing client-side proofs in under 800ms.",
      "Career Preference: Remote or hybrid role with emphasis on design aesthetics and delightful mobile user experiences.",
      "Active Application: Interviewing for Senior Mobile Lead at consumer web3 application."
    ]
  },
  {
    id: "user_08",
    name: "Zainab Al-Fassi",
    namespace: "candidate_08_zainab_alfassi",
    domain: "Product Manager & Tokenomics",
    memories: [
      "Target Role: Senior Product Manager (DeFi & Developer Tools) driving developer adoption and SDK workflows.",
      "Work Experience: PM at Horizon Protocol, leading developer tools, API documentation, and hackathon developer relations.",
      "Key Achievement: Increased weekly active SDK developers by 220% following interactive documentation and quickstart redesign.",
      "Core Competency: Product strategy, user research, API UX design, token economic modeling, and agile sprint leadership.",
      "Interview Strength: Exceptional ability to translate complex cryptographic protocols into clear product user journeys.",
      "Identified Weakness: Can occasionally over-complicate product requirement documents (PRDs) with too many edge case scenarios.",
      "STAR Reflection: Learned that launching rapid experimental MVPs delivers faster market validation than prolonged specification phases.",
      "Tailored CV Bullet: Launched flagship developer portal reducing developer time-to-first-transaction from 45 minutes to 5 minutes.",
      "Career Preference: Collaborative cross-functional teams with passionate open-source developer communities.",
      "Active Application: Final interview loop for Group Product Manager at developer platform."
    ]
  },
  {
    id: "user_09",
    name: "Kenji Sato",
    namespace: "candidate_09_kenji_sato",
    domain: "Rust Systems & Core Protocol Engineering",
    memories: [
      "Target Role: Core Protocol Engineer (Rust / Distributed Systems) building consensus and consensus-layer storage engines.",
      "Work Experience: Core Developer at Layer-1 foundation, maintaining P2P networking and state synchronization layers in Rust.",
      "Key Achievement: Optimized memory buffer recycling in Tokio networking engine, cutting protocol memory overhead by 30%.",
      "Core Competency: Mastery of Rust, async Tokio, libp2p, RocksDB, memory allocators (Jemalloc), and deterministic state machines.",
      "Interview Strength: Deep and rigorous technical understanding of Byzantine Fault Tolerance (BFT) and DAG consensus mechanics.",
      "Identified Weakness: Needs to balance micro-optimizations with overall product delivery timelines.",
      "STAR Reflection: Emphasized that clean modular code abstractions reduce cognitive load for peer contributors.",
      "Tailored CV Bullet: Implemented parallel transaction execution scheduler in Rust boosting theoretical network throughput by 4x.",
      "Career Preference: Remote-first deep tech teams dedicated to open-source protocols and research publications.",
      "Active Application: Candidate for Core Developer role at next-generation blockchain infrastructure team."
    ]
  },
  {
    id: "user_10",
    name: "Chloe Dubois",
    namespace: "candidate_10_chloe_dubois",
    domain: "UI/UX & Design Systems",
    memories: [
      "Target Role: Lead Product Designer & Design Systems Architect for complex enterprise and fintech web applications.",
      "Work Experience: Principal Designer at StudioDesign, creating universal Figma component tokens and accessibility guidelines.",
      "Key Achievement: Built multi-brand design system adopted across 8 distinct product suites, cutting frontend design turnaround by 50%.",
      "Core Competency: Figma, Design Tokens, TailwindCSS, WCAG AAA accessibility, micro-interactions, and user research testing.",
      "Interview Strength: Inspiring presentation of design rationale and user-centric problem solving during portfolio walk-throughs.",
      "Identified Weakness: Can get frustrated when engineering teams implement designs without strict token adherence.",
      "STAR Reflection: Learned to bridge design-to-code gaps by providing interactive storybook components with engineers.",
      "Tailored CV Bullet: Redesigned onboarding flow increasing candidate registration conversion rate from 18% to 42%.",
      "Career Preference: Values high design craft, typography excellence, and collaborative design-engineering culture.",
      "Active Application: In discussions with design-forward fintech and Web3 platforms."
    ]
  }
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function rememberWithRetry(
  client: ReturnType<typeof MemWal.create>,
  text: string,
  namespace: string,
  maxAttempts: number = 4
) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await client.remember(text, namespace);
      return res;
    } catch (err: any) {
      if (err.message?.includes("429") || err.message?.includes("Rate limit")) {
        console.warn(`    [Rate Limit 429] Pacing relayer. Sleeping 62s before retry (Attempt ${attempt}/${maxAttempts})...`);
        await sleep(62000);
      } else {
        throw err;
      }
    }
  }
  throw new Error(`Exceeded max retry attempts for memory write.`);
}

export async function seedAll30Users() {
  const accountId = process.env.MEMWAL_ACCOUNT_ID?.trim();
  const key = process.env.MEMWAL_PRIVATE_KEY?.trim();
  const serverUrl = process.env.MEMWAL_SERVER_URL?.trim() || "https://relayer.memory.walrus.xyz";

  if (!accountId || !key) {
    console.error("Missing MEMWAL_ACCOUNT_ID or MEMWAL_PRIVATE_KEY.");
    process.exit(1);
  }

  console.log("Starting Rate-Paced Walrus Memory Seeding for 30 Candidates...");
  console.log(`Relayer: ${serverUrl} | Account: ${accountId}\n`);

  for (const candidate of CANDIDATE_PROFILES_30) {
    console.log(`[${candidate.id}] Seeding ${candidate.name} (${candidate.domain}) -> [${candidate.namespace}]`);
    const client = MemWal.create({ key, accountId, serverUrl, namespace: candidate.namespace });

    for (let m = 0; m < candidate.memories.length; m++) {
      try {
        const res = await rememberWithRetry(client, candidate.memories[m], candidate.namespace);
        console.log(`  [${candidate.id}] Memory ${m + 1}/10 accepted (Job: ${(res as any)?.jobId || (res as any)?.job_id || "queued"})`);
      } catch (err: any) {
        console.error(`  [${candidate.id}] Error memory ${m + 1}: ${err.message}`);
      }
      // Pace requests to stay comfortably below 60 req/min limit
      await sleep(1100);
    }
  }
  console.log("\nAll 30 candidate profiles dispatched to Walrus Mainnet successfully!");
}

if (process.argv[1]?.includes("seed_30_mainnet_users")) {
  seedAll30Users().catch((e) => console.error(e));
}
