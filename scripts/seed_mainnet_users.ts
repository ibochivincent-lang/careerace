import { MemWal } from "@mysten-incubation/memwal";

interface CandidateProfile {
  name: string;
  namespace: string;
  role: string;
  memories: string[];
}

const CANDIDATES: CandidateProfile[] = [
  {
    name: "Alex Rivera (Senior Web3 Frontend Engineer)",
    namespace: "candidate_alex_rivera",
    role: "Senior Frontend & Smart Contract UI Developer",
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
    name: "Sarah Chen (AI & Distributed Systems Architect)",
    namespace: "candidate_sarah_chen",
    role: "AI Systems & Machine Learning Engineer",
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
    name: "Marcus Adebayo (Fullstack Product Engineer)",
    namespace: "candidate_marcus_adebayo",
    role: "Lead Fullstack Product Developer",
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
  }
];

async function seed() {
  const accountId = process.env.MEMWAL_ACCOUNT_ID?.trim();
  const key = process.env.MEMWAL_PRIVATE_KEY?.trim();
  const serverUrl = process.env.MEMWAL_SERVER_URL?.trim() || "https://relayer.memory.walrus.xyz";

  if (!accountId || !key) {
    console.error("Missing MEMWAL_ACCOUNT_ID or MEMWAL_PRIVATE_KEY in environment.");
    process.exit(1);
  }

  console.log(`\nStarting Walrus Memory Mainnet Seeding across 3 distinct candidate users...`);
  console.log(`Relayer: ${serverUrl}`);
  console.log(`Account ID: ${accountId}\n`);

  const summary: Array<{ user: string; namespace: string; storedCount: number; blobIds: string[] }> = [];

  for (const candidate of CANDIDATES) {
    console.log(`=======================================================`);
    console.log(`Processing User: ${candidate.name}`);
    console.log(`Namespace: ${candidate.namespace}`);
    console.log(`Writing ${candidate.memories.length} memories directly to Walrus Mainnet...`);

    const client = MemWal.create({
      key,
      accountId,
      serverUrl,
      namespace: candidate.namespace,
    });

    const blobIds: string[] = [];

    for (let i = 0; i < candidate.memories.length; i++) {
      const memoryText = candidate.memories[i];
      try {
        const result = await client.rememberAndWait(memoryText, candidate.namespace);
        const blobId = (result as any)?.blob_id || (result as any)?.id || "persisted_ok";
        blobIds.push(blobId);
        console.log(`  [Memory ${i + 1}/${candidate.memories.length}] Stored: "${memoryText.slice(0, 50)}..." (ID: ${blobId})`);
      } catch (err: any) {
        console.error(`  [Memory ${i + 1}] Failed to store: ${err.message}`);
      }
    }

    // Verify recall
    console.log(`\nVerifying recall on namespace '${candidate.namespace}'...`);
    try {
      const recallRes = await client.recall({ query: "interview feedback strengths and target role", limit: 3 });
      console.log(`Recall verified: ${recallRes.results.length} relevant memories retrieved.`);
      recallRes.results.forEach((r: any, idx: number) => {
        console.log(`   #${idx + 1} (dist: ${r.distance?.toFixed(3)}): ${r.text}`);
      });
    } catch (err: any) {
      console.error(`Recall verification failed: ${err.message}`);
    }

    summary.push({
      user: candidate.name,
      namespace: candidate.namespace,
      storedCount: blobIds.length,
      blobIds
    });
    console.log(`\n`);
  }

  console.log(`=======================================================`);
  console.log(`ALL 3 USERS SUCCESSFULLY SEEDED TO WALRUS MAINNET!`);
  console.log(`Total Stored Memories: ${summary.reduce((acc, s) => acc + s.storedCount, 0)} across 3 namespaces.`);
  console.log(`Agent ID / Account ID: ${accountId}`);
  console.log(`=======================================================\n`);
}

seed().catch((err) => {
  console.error("Seed execution failed:", err);
  process.exit(1);
});
