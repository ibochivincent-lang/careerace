import { MemWal } from "@mysten-incubation/memwal";

async function testConnection() {
  const key = process.env.MEMWAL_PRIVATE_KEY?.trim();
  const accountId = process.env.MEMWAL_ACCOUNT_ID?.trim();
  const serverUrl = process.env.MEMWAL_SERVER_URL?.trim() || "https://relayer.memory.walrus.xyz";

  console.log("Checking Walrus Mainnet Connection...");
  console.log("Server URL:", serverUrl);
  console.log("Account ID:", accountId ? `${accountId.slice(0, 10)}...${accountId.slice(-6)}` : "MISSING");
  console.log("Private Key:", key ? "PRESENT (64 hex characters)" : "MISSING");

  if (!key || !accountId) {
    console.error("Missing MEMWAL_PRIVATE_KEY or MEMWAL_ACCOUNT_ID in environment.");
    process.exit(1);
  }

  const client = MemWal.create({
    key,
    accountId,
    serverUrl,
    namespace: "careerace_system_probe",
  });

  try {
    console.log("Probing relayer health()...");
    const health = await client.health();
    console.log("Relayer Health Response:", JSON.stringify(health));

    console.log("Probing recall on test namespace...");
    const recall = await client.recall({ query: "ping", limit: 1 });
    console.log("Recall Response status: OK, results length:", recall.results?.length ?? 0);
    console.log("CONNECTION VALIDATED! Credentials are fully working with Walrus Mainnet relayer.");
  } catch (err: any) {
    console.error("Connection check failed:", err.message);
    if (err.cause) console.error("Cause:", err.cause);
  }
}

testConnection();
