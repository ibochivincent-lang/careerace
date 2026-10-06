import { MemWal } from "@mysten-incubation/memwal";

async function testSingleWrite() {
  const key = process.env.MEMWAL_PRIVATE_KEY?.trim();
  const accountId = process.env.MEMWAL_ACCOUNT_ID?.trim();
  const serverUrl = process.env.MEMWAL_SERVER_URL?.trim() || "https://relayer.memory.walrus.xyz";

  if (!key || !accountId) {
    console.error("Missing MEMWAL_PRIVATE_KEY or MEMWAL_ACCOUNT_ID.");
    process.exit(1);
  }

  const namespace = "careerace_system_test";
  const client = MemWal.create({ key, accountId, serverUrl, namespace });

  console.log("Testing live memory write to Walrus Mainnet...");
  console.log("Account ID:", accountId);
  console.log("Namespace:", namespace);

  const start = Date.now();
  const testFact = `System test verification at ${new Date().toISOString()}: CareerAce AI Agent initialized on Walrus Mainnet.`;

  try {
    const res = await client.rememberAndWait(testFact, namespace, { timeoutMs: 120000 });
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`Success! Memory committed to Walrus Mainnet in ${elapsed}s.`);
    console.log("Result object:", JSON.stringify(res, null, 2));

    console.log("Verifying recall...");
    const recall = await client.recall({ query: "System test verification", limit: 3 });
    console.log("Recall hit count:", recall.results?.length);
    if (recall.results?.length) {
      console.log("Recalled text:", recall.results[0].text);
      console.log("Distance:", recall.results[0].distance);
    }
  } catch (err: any) {
    console.error("Single write failed:", err.message);
    if (err.cause) console.error("Cause:", err.cause);
  }
}

testSingleWrite();
