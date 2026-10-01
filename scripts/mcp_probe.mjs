/**
 * Verifies the ExamAce MCP server actually speaks MCP: handshake, tool
 * discovery, and one call of each tool.
 *
 *   pnpm mcp:probe
 *
 * Without MEMWAL credentials the server runs on the in-memory mock, so every
 * tool is exercised for real — write, recall, screen — with no network and no
 * keys. With credentials in .env.local it runs against the live relayer
 * instead. Either way the whole contract is checked end to end.
 */
import { spawn } from "node:child_process";

const owner = process.env.EA_OWNER_ADDRESS ?? "0xprobe0000000000000000000000000000000000";
const live = Boolean(process.env.MEMWAL_PRIVATE_KEY && process.env.MEMWAL_ACCOUNT_ID);

// Pass the environment through untouched. Injecting placeholder MEMWAL values
// here would read as real credentials and send the server down the live path
// with a key it cannot parse, instead of onto the mock.
const child = spawn("node", ["--experimental-strip-types", "mcp/server.mts"], {
  env: { ...process.env, EA_OWNER_ADDRESS: owner },
  stdio: ["pipe", "pipe", "pipe"],
});

let buffer = "";
const waiters = new Map();
child.stdout.on("data", (chunk) => {
  buffer += chunk;
  let i;
  while ((i = buffer.indexOf("\n")) !== -1) {
    const line = buffer.slice(0, i).trim();
    buffer = buffer.slice(i + 1);
    if (!line) continue;
    const msg = JSON.parse(line);
    const resolve = waiters.get(msg.id);
    if (resolve) { waiters.delete(msg.id); resolve(msg); }
  }
});
child.stderr.on("data", (d) => {
  const s = String(d);
  if (!s.includes("MODULE_TYPELESS") && !s.includes("Reparsing") && !s.includes("trace-warnings") && !s.includes("eliminate this warning")) {
    process.stderr.write(`  [server] ${s}`);
  }
});

let nextId = 1;
function call(method, params) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    waiters.set(id, resolve);
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    setTimeout(() => reject(new Error(`${method} timed out`)), 30_000);
  });
}

const first = (m) => m.result?.content?.[0]?.text ?? JSON.stringify(m.result ?? m.error);
const line = (s) => String(s).split("\n")[0].slice(0, 96);

let failures = 0;
function check(label, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
  if (!ok) failures++;
}

const WRONG =
  "Force is mass times velocity, so a 1000 kg car moving at 20 m/s carries 20000 N.";
const CORRECTED =
  "You had it as force is mass times velocity. Test that: it is mass times acceleration, so what is the acceleration here?";

try {
  const init = await call("initialize", {
    protocolVersion: "2024-11-05", capabilities: {},
    clientInfo: { name: "careerace-probe", version: "1" },
  });
  check("handshake", init.result?.serverInfo?.name === "careerace", init.result?.protocolVersion);

  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");

  const tools = await call("tools/list", {});
  const names = tools.result.tools.map((t) => t.name).sort();
  check(
    "tools advertised",
    names.includes("upload_resume_tool") &&
    names.includes("recall_career_vault_tool") &&
    names.includes("tailor_cv_tool") &&
    names.includes("fill_application_tool"),
    names.join(", ")
  );

  const resources = await call("resources/list", {});
  check("resource advertised", resources.result.resources.length === 1, resources.result.resources[0]?.uri);

  console.log(`\nmode: ${live ? "LIVE (MEMWAL credentials present)" : "MOCK (no credentials — in-memory store)"}\n`);

  // An explanation that is fine until the student tells us what they believe.
  const before = await call("tools/call", { name: "check_question", arguments: { text: WRONG } });
  check("check_question clears the wording while nothing is stored",
    first(before).startsWith("SAFE"), line(first(before)));

  const wrote = await call("tools/call", {
    name: "remember_fact",
    arguments: {
      kind: "misconception",
      fact: "thinks force = mass x velocity",
      user_turn: "force is mass times velocity abi?",
    },
  });
  check("remember_fact stores an asserted misconception", first(wrote).startsWith("Stored in"), line(first(wrote)));

  const again = await call("tools/call", {
    name: "remember_fact",
    arguments: {
      kind: "misconception",
      fact: "thinks force = mass x velocity",
      user_turn: "force is mass times velocity abi?",
    },
  });
  check("identical fact is skipped, not duplicated", first(again).startsWith("Already known"), line(first(again)));

  const recall = await call("tools/call", {
    name: "recall_memory", arguments: { query: "force", scope: "both" },
  });
  check("recall_memory returns the stored fact",
    first(recall).includes("thinks force = mass x velocity"), line(first(recall)));

  // Same wording, same tool — the verdict flips because the memory changed.
  const after = await call("tools/call", { name: "check_question", arguments: { text: WRONG } });
  check("check_question now blocks wording that restates their wrong model",
    first(after).startsWith("UNSAFE") && first(after).includes("force = mass x velocity"),
    line(first(after)));

  const corrected = await call("tools/call", { name: "check_question", arguments: { text: CORRECTED } });
  check("naming the wrong model in order to break it passes",
    first(corrected).startsWith("SAFE"), line(first(corrected)));

  const spoiler = await call("tools/call", {
    name: "check_question", arguments: { text: "The answer is B, 2000 N." },
  });
  check("check_question refuses text that hands over the answer",
    first(spoiler).startsWith("UNSAFE") && first(spoiler).includes("Hands over the answer"),
    line(first(spoiler)));

  const off = await call("tools/call", {
    name: "remember_fact",
    arguments: {
      kind: "weakness",
      fact: "titration calculations",
      user_turn: "titration kills me but don't save that",
    },
  });
  check("off-the-record refused before any write", first(off).includes("off the record"), line(first(off)));

  const list = await call("tools/call", { name: "list_memory", arguments: {} });
  check("list_memory shows it and not the refused one",
    first(list).includes("force") && !first(list).includes("titration"), line(first(list)));

  // RETRACTION. There is no delete in the SDK, so forgetting is a tombstone
  // that outranks the claim. The proof is the same three tools disagreeing
  // with themselves afterwards.
  const missing = await call("tools/call", {
    name: "forget_fact", arguments: { fact: "an economics thing nobody mentioned" },
  });
  check("forget_fact retracts nothing when nothing matches",
    first(missing).includes("nothing to retract"), line(first(missing)));

  const forgot = await call("tools/call", {
    name: "forget_fact", arguments: { fact: "thinks force = mass x velocity" },
  });
  check("forget_fact retracts the stored misconception",
    first(forgot).startsWith("Retracted in"), line(first(forgot)));

  check("retraction is honest that Walrus still holds the entry",
    first(forgot).includes("not erased"), line(first(forgot)));

  const gone = await call("tools/call", {
    name: "recall_memory", arguments: { query: "force", scope: "both" },
  });
  check("recall_memory no longer returns a retracted fact",
    !first(gone).includes("misconception | thinks force = mass x velocity"), line(first(gone)));

  const cleared = await call("tools/call", { name: "check_question", arguments: { text: WRONG } });
  check("check_question clears the wording again once the fact is retracted",
    first(cleared).startsWith("SAFE"), line(first(cleared)));

  const listAfter = await call("tools/call", { name: "list_memory", arguments: {} });
  check("list_memory still shows the retracted entry, in its own section",
    first(listAfter).includes("RETRACTED"), line(first(listAfter)));

  console.log(`\n${failures === 0 ? "all green" : `${failures} failing`}`);
} catch (e) {
  console.error("probe error:", e.message);
  failures++;
} finally {
  child.kill();
}
process.exit(failures === 0 ? 0 : 1);
