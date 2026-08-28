# ExamAce

A Socratic tutor for Nigerian students sitting JAMB, WAEC, NECO and Post-UTME —
built on a learning record the student owns outright.

The record lives on [Walrus Memory](https://memory.walrus.xyz)
(`@mysten-incubation/memwal`), encrypted under the student's own Sui address.
This app is a **delegate** they registered and can revoke onchain, without
asking the app's permission. Sign-in is [Enoki](https://portal.enoki.mystenlabs.com)
zkLogin: Google in, Sui address out, no wallet and no gas prompt.

**The deliverable is [`PROMPT.md`](PROMPT.md)** — the rules the tutor follows to
decide what enters a student's learning record. The code exists to enforce those
rules, not the other way round.

## Why a tutor needs memory

A tutor who forgets is not a tutor. The failure this project exists to remove is
specific: a student explains that they think force is mass times velocity, gets
corrected, comes back three weeks later, and is re-taught the same topic in the
same words that produced the confusion in the first place. Nothing carried over,
so nothing changed.

So the record holds what a good teacher would remember: the exam they are
sitting, the wrong models they actually hold, the topics they have proved they
understand, the mistakes they keep making, and how they like to be taught.

## What is real

| | |
|---|---|
| `pnpm test` | 30 assertions over the pure contract — no network, no keys |
| `pnpm mcp:probe` | the whole MCP contract end to end on the in-memory mock — no keys |
| `pnpm smoke` | the same claims against the live Walrus relayer; writes `PROOF.md` with blob ids |
| `pnpm typecheck` | `tsc --noEmit` |

`pnpm mcp:probe` is the one to run first. It writes a misconception, skips the
identical rewrite, recalls it, watches the deterministic screen flip to UNSAFE
on wording that restates the wrong model and stay SAFE on wording that breaks
it, refuses an off-the-record fact, then retracts the misconception and watches
the same tools change their minds again — with no credentials at all.

## Two things the SDK does that shape the whole design

1. **`remember()` is append-only.** It is not an upsert. Writing the same fact
   twice produces two entries and both surface on recall, and recall ranks by
   vector distance rather than recency — so a stale "thinks force = mass x
   velocity" can outrank a newer "applies F = ma correctly". Every write in
   `lib/memory-core.ts` therefore probes first: an identical claim is skipped, a
   near-duplicate that disagrees is stored stamped with what it supersedes, and
   `resolveConflicts` in `lib/facts.ts` keeps exactly one active claim per body,
   newest date wins.

2. **`recall()` has no default relevance threshold**, and there is **no delete
   and no `list()`**. In a small namespace recall returns the nearest entries
   even when they are unrelated, so `maxDistance` is mandatory on every read.
   "Forgetting" is a tombstone that outranks the claim it names — not erasure,
   and the UI says so. Listing is a pair of deliberately broad recalls, labelled
   as what recall can currently reach rather than as a printout of the record.

Two smaller ones, learned the hard way and worth keeping:

- **Recall with a stable query, never the student's turn.** Asking "explain
  projectile motion" as the query against their record pushes the stored
  misconception below the relevance floor, and the tutor teaches straight into
  it. `recallLearning()` and `recallPreferences()` use fixed queries so the
  facts that change how a topic must be taught come back on every turn.
- **Sweep tombstones with no floor.** A claim and the retraction that kills it do
  not sit at the same distance from a question. Filter both through one floor and
  the fact survives while the retraction does not.

## Architecture

```
lib/facts.ts          pure fact algebra — format, dedupe, tombstones, conflict resolution
lib/memory-core.ts    the I/O half of the contract: recall, write, retract
lib/namespaces.ts     examace:profile:<address> and examace:feedback:<address>
lib/pedagogy.ts       the deterministic teaching screen (misconceptions, answer leaks, scope)
lib/extract.ts        the write gate — one turn in, structured facts out
lib/model-select.ts   which provider, which key, which model (pure, tested)
lib/auth.ts           HMAC-signed session over an Enoki-verified zkLogin signature
mcp/server.mts        the same contract, exposed to any MCP client
app/api/chat/route.ts recall → screen → answer → write, per turn
```

Two namespaces, deliberately. `profile` holds the durable clinical-equivalent
facts — exam target, misconceptions, weaknesses, mastery, clearances. `feedback`
holds recurring error patterns and delivery preferences. A clearance ("no weak
topic yet") lives with the weaknesses it negates, or a recall for weak topics
would never see it.

**The chat route fails closed.** If the record is unreachable it refuses to
teach rather than quietly answering as though the student had no history.

**The tutor and the write gate run on the same model.** Splitting them means a
gate on a model nobody chose, which fails silently on every turn while the
conversation looks perfectly healthy. `EA_EXTRACT_MODEL` still splits them for
anyone who wants a cheaper tier on the gate.

## Running it

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

With no `MEMWAL_*` credentials the app runs on the SDK's in-memory mock: the
write gate, duplicate skipping, supersede stamping and the teaching screen are
all real, because none of them need a network. What the mock does **not** do is
semantic recall — it scores by token overlap. Never demo against the mock.

With no `NEXT_PUBLIC_ENOKI_API_KEY`, set `DEV_FAKE_ADDRESS` to try the memory
flow without zkLogin. It is refused in production.

A model key is needed for the web app only, and can come from either side: set
one of `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY` /
`XAI_API_KEY` / `GROQ_API_KEY` server-side, or let each visitor add their own in
the key panel — sealed with AES-256-GCM in an httpOnly cookie in their own
browser, spent on their own account. That is not protection against whoever runs
the server, and the UI says so.

Every variable is documented in [`.env.example`](.env.example).

## Routes

| Route | What it is |
|---|---|
| `/tutor` | the memory-backed Socratic chat, with the live memory rail beside it |
| `/memory` | the ledger: every fact, dated, with superseded and retracted entries shown separately, and a retract button |
| `/coaches` | human coaches ranked from the record — proof memory drives the app, not a search box |
| `/signin` | Enoki zkLogin |
| `/dashboard`, `/practice`, `/progress`, `/session/*` | the original study platform, unchanged, on local storage |

## Honest limits

- Revocation is **forward-only**. Removing the delegate key stops it reading
  anything saved afterwards; entries already saved stay readable to that key
  until they are re-encrypted. The revoke panel says exactly this.
- Retraction is **not deletion**. The encrypted blob stays on Walrus until its
  storage period expires.
- The misconception, topic and syllabus tables in `lib/pedagogy.ts` are a
  deterministic safety net for common cases, not the set of things a student is
  allowed to be confused about. Anything outside them is passed to the model
  verbatim, and the constraints block names the gap out loud rather than
  pretending the screen covers it.
- `app/actions/account.ts` still signs delegate registration with a raw private
  key. Swapping it for an Enoki sponsored transaction is the one piece of the
  stack that has not been run end to end.
