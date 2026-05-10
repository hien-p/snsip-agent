# SNSIP-Agent — Implementation Plan

**Project:** SNSIP-Agent — Verifiable AI Agent Identity for `.sol`
**Hackathon:** SNS Identity Track — Colosseum Hackathon (Frontier)
**Sponsors:** SNS, Superteam Malaysia (STMY), MagicBlock
**Track theme:** Agent Identity
**Deadline:** 2026-05-12 (T-6 days from 2026-05-06)
**Repo dir:** `/Users/harryphan/Documents/dev/soldev/sns_prj`

---

## Table of Contents
1. [Vision & Pitch](#vision--pitch)
2. [What We Ship](#what-we-ship)
3. [SNSIP-Agent Draft Spec](#snsip-agent-draft-spec)
4. [Solana Trust Stack (ERC-8004 Port)](#solana-trust-stack-erc-8004-port)
5. [Architecture](#architecture)
6. [Repo Structure](#repo-structure)
7. [Tech Stack](#tech-stack)
8. [6-Day Execution Plan](#6-day-execution-plan)
9. [Risk Register](#risk-register)
10. [Submission Deliverables](#submission-deliverables)
11. [Pitch Deck Outline](#pitch-deck-outline)
12. [References](#references)

---

## Vision & Pitch

**One-liner:**
> ENS just shipped ENSIP-25, a verifiable AI agent identity standard for `.eth`. Solana clears 77% of x402 transaction volume but has no equivalent for `.sol`. We're shipping it: **SNSIP-Agent**, plus a Solana port of the ERC-8004 trust stack (Identity, Reputation, Validation registries), with MagicBlock Ephemeral Rollups for high-frequency agent-to-agent settlement.

**Why this wins on the rubric:**
- **Innovation:** First SNS-native agent ID standard. Not an app — a standard *plus* reference impl.
- **Technical Merit:** Anchor programs (3 registries) + Ed25519 verifier + SNS records v2 + MagicBlock delegate macro.
- **Practicality:** Closes the gap that lets Solana keep its lead on agentic infra. Counter-narrative to Molt.id's namespace fork.
- **Completeness:** Spec doc + 3 programs + TS SDK + dashboard + demo flow. All achievable in 6 days.
- **UX:** "Add agent" is a 3-click flow on top of `.sol`. Resolver works the way devs already expect.
- **Founder Potential:** Standards are sticky. SNS team can adopt this directly post-hackathon.
- **Demo Quality:** Live agent-to-agent handshake with sub-50ms ER latency overlay.

**Counter to Molt.id (in the deck):**
> Molt.id forked the namespace with `.molt`. We extend the canonical one. `myagent.alice.sol` — same root, agent-aware records, attested capabilities, on-chain reputation.

---

## What We Ship

| Deliverable | Form | Owner of judging value |
|---|---|---|
| 1. **SNSIP-Agent draft spec** | `SNSIP-AGENT.md` in repo | Innovation, Founder Potential |
| 2. **Solana Identity Registry program** | Anchor program | Technical Merit |
| 3. **Solana Reputation Registry program** | Anchor program | Technical Merit |
| 4. **Solana Validation Registry program** | Anchor program | Technical Merit |
| 5. **Verifier (on-chain Ed25519 agent-msg verification)** | Anchor program (CPI-callable) | Technical Merit |
| 6. **TypeScript SDK** (`@snsip/agent-sdk`) | npm package + repo | Technical Merit, UX |
| 7. **Dashboard** | Next.js app, Vercel-deployed | UX, Demo Quality |
| 8. **MagicBlock ER integration** | `#[delegate]`-flagged accounts on the Reputation Registry | Sponsor alignment |
| 9. **Live A2A demo** | Two agent CLI binaries that handshake on-chain | Demo Quality |
| 10. **Pitch deck + 3-min video** | PDF + Loom | Submission Quality |

---

## SNSIP-Agent Draft Spec

### Faithful adaptation of ENSIP-25

ENSIP-25 introduces one text-record key (`agent-registration[<registry>][<agentId>]`) with value `"1"` to confirm bidirectional binding between an ENS name and an agent in an ERC-8004 registry. We mirror this exactly on SNS records v2 — same key shape, same semantics — so any ENS-aware tooling can be reused.

### Record key convention (SNS records v2)

```
agent-registration[<registry>][<agentId>]
```

- `<registry>`: a Solana program ID + registry PDA (encoded as base58 or as an ERC-7930-compatible interoperable address for cross-chain reuse).
- `<agentId>`: the agent's `u64` ID inside that registry, base-10 string.

Value:
- `"1"` (or any non-empty UTF-8 string) → owner confirms binding.
- Absent / empty → no binding.

### Auxiliary records (extend ENSIP-5 conventions)

Optional but recommended canonical keys on the agent's `.sol` (or sub-`.sol`):

| Key | Purpose | Example |
|---|---|---|
| `agent.controller` | `.sol` of the human/org that owns this agent | `alice.sol` |
| `agent.signing-pubkey` | Ed25519 pubkey the agent uses to sign messages | base58 32-byte |
| `agent.endpoint` | MCP / A2A URL | `https://agent.example.com/mcp` |
| `agent.capabilities` | URL or inline JSON capability card | `https://.../card.json` or `data:application/json,{...}` |
| `agent.attestations` | Comma-separated SAS attestation account addrs | `Aaa..., Bbb...` |
| `avatar` | Per ENSIP-12 | NFT URI or image URL |

### Verification flow

```
(off-chain)
  1. Verifier wants to confirm "agent #42 in registry R claims to be myagent.alice.sol".
  2. Resolve myagent.alice.sol via SNS SDK.
  3. Read records v2 for key `agent-registration[R][42]`.
  4. If value non-empty → binding confirmed.
  5. Optional: read `agent.signing-pubkey`, fetch a fresh signed nonce from the agent, verify Ed25519.
  6. Optional: query Reputation/Validation Registries for score and audit trail.

(on-chain)
  Same logic exposed as a CPI-callable Anchor program for programs that gate by agent identity.
```

### Why "bracket notation" over flat keys

- Compatibility with ENS tooling — same key shape.
- Multi-registry future: an agent can be claimed by multiple registries (one open, one curated, one app-specific). Brackets make this trivial; flat keys collide.

---

## Solana Trust Stack (ERC-8004 Port)

ERC-8004 specifies three registries. We port all three to Solana as Anchor programs. Minimal, but real.

### 1. Identity Registry (`programs/identity-registry`)

State (PDA per agent):
```rust
#[account]
pub struct Agent {
    pub id: u64,                  // sequential, registry-scoped
    pub controller: Pubkey,       // wallet that controls this agent
    pub sns_domain_hash: [u8; 32],// hash of the bound .sol (e.g., myagent.alice.sol)
    pub signing_pubkey: Pubkey,   // Ed25519 (32 bytes)
    pub metadata_uri: String,     // capability card / off-chain blob
    pub created_at: i64,
    pub revoked: bool,
}
```

Instructions:
- `register_agent(sns_domain_hash, signing_pubkey, metadata_uri)` → mints a new ID.
- `update_agent(agent_id, new_metadata_uri)` (controller-only).
- `revoke_agent(agent_id)` (controller-only).

### 2. Reputation Registry (`programs/reputation-registry`)

State (PDA per agent):
```rust
#[account]
pub struct ReputationAccount {
    pub agent_id: u64,
    pub interaction_count: u64,
    pub success_count: u64,
    pub failure_count: u64,
    pub last_active: i64,
    pub score: u32,               // bounded [0, 10_000]
}
```

Instructions:
- `record_interaction(agent_id, success: bool)`
- `attest_score(agent_id, score, signer_authority)` (only authorized issuers — single SAS-attested pubkey for the hackathon).

**MagicBlock integration goes here.** Mark `ReputationAccount` with `#[delegate]` so high-frequency `record_interaction` calls run inside an Ephemeral Rollup, then commit back. This is where the sub-50ms demo lives.

### 3. Validation Registry (`programs/validation-registry`)

State (PDA per validation):
```rust
#[account]
pub struct ValidationRecord {
    pub agent_id: u64,
    pub validator: Pubkey,        // who attested
    pub claim: [u8; 32],          // hash of claim content (off-chain JSON)
    pub uri: String,              // URI to full claim
    pub timestamp: i64,
}
```

Instructions:
- `submit_validation(agent_id, claim_hash, uri)`
- `revoke_validation(record_pda)` (validator-only)

### 4. Verifier (`programs/agent-verifier`)

A CPI-callable program with one entry:
```rust
verify_agent_signature(
    sns_domain_hash: [u8; 32],
    agent_id: u64,
    registry: Pubkey,
    message: Vec<u8>,
    signature: [u8; 64],
) -> Result<()>;
```

Internally:
1. CPI into Identity Registry → fetch `Agent` for `(registry, agent_id)`.
2. Assert `agent.sns_domain_hash == sns_domain_hash` and `!agent.revoked`.
3. Call Solana's Ed25519 sigverify precompile with `agent.signing_pubkey` + `message` + `signature`.
4. Emit `AgentVerified` event.

> **Optional CPI into SNS:** ideal version reads the actual `agent-registration[...]` record from SNS records v2 to confirm the binding live (not just stored). For 6 days, we cache `sns_domain_hash` at registration time and add a `refresh_binding` instruction. Document the trade-off in the spec.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   Dashboard (Next.js / Vercel)                   │
│   Connect wallet → list .sol → register agent → set records      │
│   View: identity, reputation timeline, validations               │
└────────────────┬────────────────────────────────────────────────┘
                 │
        ┌────────┴─────────┬──────────────────────┐
        │                  │                       │
        ▼                  ▼                       ▼
┌──────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ @snsip/      │   │ SNS records v2   │   │ Solana Agent CLI │
│ agent-sdk    │──▶│ (set agent-      │   │ (demo binaries)  │
│ (TS)         │   │  registration[…])│   │                  │
└──────┬───────┘   └──────────────────┘   └────────┬─────────┘
       │                                            │
       ▼                                            ▼
┌─────────────────────────────────────────────────────────────────┐
│               Solana programs (Anchor)                           │
│  ┌──────────────┐  ┌────────────────┐  ┌────────────────────┐  │
│  │  Identity    │  │  Reputation    │  │   Validation       │  │
│  │  Registry    │  │  Registry      │  │   Registry         │  │
│  └──────┬───────┘  └────────┬───────┘  └────────────────────┘  │
│         │                   │                                    │
│         │            ┌──────┴───────┐                           │
│         │            │ MagicBlock   │                           │
│         │            │ ER (sub-50ms)│                           │
│         │            └──────────────┘                           │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Agent Verifier (CPI-callable Ed25519 sigverify)         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Repo Structure

```
sns_prj/
├── README.md                     # one-page pitch + how to run
├── SNSIP-AGENT.md                # the standard (deliverable #1)
├── pnpm-workspace.yaml
├── turbo.json
├── Anchor.toml
├── programs/
│   ├── identity-registry/
│   ├── reputation-registry/
│   ├── validation-registry/
│   └── agent-verifier/
├── packages/
│   ├── agent-sdk/                # @snsip/agent-sdk — TS SDK
│   └── shared-types/             # types shared between SDK and app
├── apps/
│   ├── web/                      # Next.js dashboard (Vercel)
│   └── agent-cli/                # demo agents A and B (Node CLIs)
├── tests/
│   └── anchor/                   # mocha + @coral-xyz/anchor tests
├── plans/
│   └── sns-identity-hackathon/
│       ├── reports/              # research reports (already there)
│       └── PLAN.md               # this file
└── pitch/
    ├── deck.pdf
    ├── demo-script.md
    └── video.mp4
```

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Build/monorepo | pnpm workspaces + Turborepo | Standard, fast rebuilds |
| Programs | Anchor 0.31+ | Sponsor expectation; SAS/MagicBlock SDKs ship Anchor helpers |
| ER integration | `@magicblock-labs/ephemeral-rollups-sdk` | Sponsor SDK |
| SNS reads/writes | `@bonfida/spl-name-service` | Most complete JS SDK |
| Wallet | `@solana/wallet-adapter-react` | Standard |
| Frontend | Next.js 15 (App Router) + Tailwind + shadcn/ui | Fast, recognizable, accessible defaults |
| RPC | Helius devnet (free tier) | Reliable; falls back to public devnet |
| ER endpoint | MagicBlock devnet router | Per docs |
| Attestations | Solana Attestation Service if reachable; fallback = our Validation Registry | Hedge against permissioning risk |
| Hosting | Vercel (web), GitHub (code) | Frictionless |
| Demo capture | Loom or QuickTime + ffmpeg | Standard |

---

## Interaction Design Principles

Every day must end with **something a stranger can click in a browser and feel** — not a CLI log, not a Postman screenshot. The default is: deploy the day's work to a Vercel preview URL and tweet/share the link. If a feature can't be demoed by clicking on a public URL, it doesn't count for that day.

Three rules:

1. **Visible state, always.** Every chain interaction renders a tx hash + Solana Explorer link + tooltip-explained state ("delegating to ER…", "fetching record from SNS…", "verifying signature on-chain…"). No silent successes.
2. **User does the action — we don't fake it.** No demo wallets behind the scenes. The user signs with their own wallet (Phantom / Backpack), creates their own subdomain, watches their own reputation update.
3. **Replayable by anyone.** Every demo flow has a "Try it yourself" path — pre-funded devnet faucet button, sample .sol provided, share-link that pre-fills state.

Non-goals: real-time multiplayer, gamified UX, mobile-first. Hackathon judges are watching on a laptop.

---

## 6-Day Execution Plan

> Day = waking work block, not 24h. Cut the **bold optional** items first if behind. Reputation/MagicBlock and SAS are the cuttable scopes. Identity + verifier + dashboard are non-negotiable.

Each day's work is split into:
- **What the user can DO** at end of day (interactive, public URL)
- **What the user SEES** (visible UI + chain artifacts)
- **What we BUILD** (engineering tasks)
- **Demo moment** (the single screen recording / GIF for the deck)

---

### Day 1 (T-6) — Scaffold + Spec + Live SNS Explorer

**What the user can DO at end of day:**
- Open the deployed Vercel URL.
- Click "Connect Wallet" → connect Phantom/Backpack on devnet.
- See a list of `.sol` domains they own (reverse lookup, real-time).
- Paste any `.sol` (e.g. `bonfida.sol`) into a "Resolve" widget → see all records v2 rendered as a card (avatar, url, twitter, etc.).
- Click "Create Agent Subdomain" → flow that asks for a name, signs a tx, creates `<name>.<root>.sol` on devnet.
- See the new subdomain appear in their list, with 4 starter records pre-populated (`agent-registration[…]`, `agent.signing-pubkey`, `agent.endpoint`, `agent.capabilities`).

**What the user SEES:**
- A clean Next.js + shadcn/ui dashboard with: wallet connect, "My Domains", "Resolve Any .sol", "New Agent Subdomain" wizard.
- Per record: key, value, source ("SNS records v2"), staleness badge.
- Tx-progress toast: pending → confirmed, with explorer link.

**What we BUILD:**
- [ ] Init monorepo: pnpm workspaces, Turborepo, Anchor workspace, Next.js 15 app.
- [ ] Write `SNSIP-AGENT.md` v0 (record key spec + verification flow + 1 example).
- [ ] Wire `@solana/wallet-adapter-react` + `@bonfida/spl-name-service`.
- [ ] Reverse-lookup helper: `getOwnedDomains(wallet)`.
- [ ] Generic resolver helper: `resolveAllRecords(domain)`.
- [ ] Subdomain creation flow with 4 default records v2 set in one tx (or a small batch).
- [ ] Deploy to Vercel preview; share URL.
- [ ] Faucet button (calls devnet airdrop) for first-time users.

**Demo moment:**
- 20-second screencap: connect → "Resolve `bonfida.sol`" → records render → "Create `myagent.alice.sol`" → tx confirms → records show. Becomes Slide 6's video.

**Exit criteria:** Stranger with a Phantom wallet on devnet can create an agent subdomain end-to-end on the live URL without help.

---

### Day 2 (T-5) — Identity Registry + Verifier Playground

**What the user can DO at end of day:**
- On their agent's profile page, click "Register on Identity Registry" → signs tx → sees their on-chain `Agent` PDA appear with its assigned `agent_id`.
- The dashboard auto-rewrites the SNS record `agent-registration[<our_registry>][<agent_id>]` to its real value (replacing the Day-1 placeholder).
- Open a new tab `/playground/verify` (the **Verifier Playground**):
  - Paste any agent's `.sol` (theirs or someone else's).
  - Click "Sign challenge with my wallet" → wallet pops up, user signs a random nonce.
  - Click "Verify on-chain" → calls our verifier program, sees ✅/❌ + the on-chain log + tx link.
- Toggle a "Tamper" switch that mutates one byte → re-runs verification → sees ❌ live (proves it's real).

**What the user SEES:**
- Identity timeline on agent profile: `created_at`, `controller`, `signing_pubkey`, `metadata_uri`.
- Playground UI: 3 panels — input (domain + signature), action (sign / verify buttons), output (on-chain log, sigverify result, tx link, gas/CU used).
- Visible Ed25519 sigverify success/failure rendered as colored panel + Solana program log excerpt.

**What we BUILD:**
- [ ] Anchor program: `identity-registry` with `register_agent`, `update_agent`, `revoke_agent`.
- [ ] Anchor program: `agent-verifier` with `verify_agent_signature` using Solana Ed25519 sigverify precompile + CPI into Identity Registry.
- [ ] SDK: `registerAgent()`, `getAgent()`, `verifySignature()`.
- [ ] Dashboard wiring: post-subdomain → "Register" CTA; rewrite SNS record with real registry/id.
- [ ] `/playground/verify` page (the one URL judges will play with).

**Demo moment:**
- 30-second screencap: paste `myagent.alice.sol` → sign → ✅ → flip Tamper → ❌. The "tamper to break it" interaction is the proof-of-realness beat.

**Exit criteria:** End-to-end "register agent → SNS record set → verifier ✅" runs from one URL in under 60 seconds. Tamper-toggle visibly breaks it.

---

### Day 3 (T-4) — Reputation Registry + MagicBlock ER ⚡ Latency Theatre

**What the user can DO at end of day:**
- Open `/playground/latency`.
- Two big buttons side-by-side: **"Tap on L1"** | **"Tap on ER"**.
- Each tap hits `record_interaction(agent_id, success=true)`.
- Live counters under each button: tx count, last latency (ms), avg latency (ms), p95 (ms).
- A reputation gauge (0–10000) for the user's agent fills visibly with each tap, and the reputation timeline (sparkline) updates live.
- "Start ER session" button delegates the account, then taps run sub-50ms; "Commit & Undelegate" pulls state back to L1 and the gauge stays.
- Auto-tap mode: holds the button, fires 50 taps over 3 seconds — visible burst on ER, slow drip on L1.

**What the user SEES:**
- Side-by-side latency cards (L1 vs ER) — bar chart-style with actual numbers, not a fake stat.
- "Session" indicator pill (green when delegated, grey when not).
- Reputation gauge animating; sparkline filling in real time.
- Tx-by-tx log with hashes (or ER session signature, where applicable).

**What we BUILD:**
- [ ] Anchor program: `reputation-registry` with `record_interaction`, `attest_score`.
- [ ] `#[delegate]` macro on `ReputationAccount` + `delegate_to_er` / `commit_state` instructions.
- [ ] SDK: `recordInteraction({ useER: bool })`, `getReputation()`.
- [ ] Magic Router configured as alt RPC; auto-detect when delegated.
- [ ] `/playground/latency` page with the side-by-side and the auto-tap feature.

**Demo moment:**
- The auto-tap burst, side-by-side. ER fills the gauge in ~1s; L1 takes ~12s. This is the "wow" beat for MagicBlock sponsor judges.

**Exit criteria:** A non-technical person watching the latency page can describe in their own words why ER is faster.

---

### Day 4 (T-3) — Validation Registry + Two-Agent Handshake Theatre

**What the user can DO at end of day:**
- Open `/playground/handshake`.
- See two animated cards: **Agent A (`alice.sol`)** and **Agent B (`bob.sol`)**, each with avatar, capability tags, reputation gauge.
- Click "Start Handshake" → step-by-step animated flow appears:
  1. A resolves B's `.sol` → endpoint + signing pubkey shown.
  2. A sends signed challenge → check mark, signature preview.
  3. B verifies via on-chain verifier → ✅ pops on B's card.
  4. B replies with signed payload → A verifies → ✅.
  5. Both reputation gauges tick up (in ER → fast).
  6. After N=5 rounds, a "Validator" card appears, signs a `ValidationRecord`, gets posted on-chain. Both agents now show a "Validated ✓" badge.
- "Replay" button re-runs the whole flow.
- "Share replay" copies a URL with the run ID; opening it on another browser replays from on-chain logs.

**What the user SEES:**
- A "stage" with two agents and a validator. Each step is animated (signature → arrow → verifier → check). State changes are persisted on-chain — judges can hover any step and click into the explorer.
- After-state: agents both have a green "Validated" badge tied to the new `ValidationRecord` PDA.

**What we BUILD:**
- [ ] Anchor program: `validation-registry` with `submit_validation`, `revoke_validation`.
- [ ] Browser "agent simulator" — same crypto as a real CLI agent, but driven from the page (uses ephemeral keypairs stored in localStorage as the "agent's signing key", and the SNS record points to that pubkey for demo purposes).
- [ ] Optional: a small Node CLI binary doing the same flow, included in the repo as proof the protocol is not browser-locked. Recorded separately for the video.
- [ ] `/playground/handshake` page with animated steps + share-replay logic.

**Demo moment:**
- The full animated handshake → validation. This is **the** scene for the demo video's middle act.

**Exit criteria:** Anyone can open the handshake page on a fresh browser and watch two real agents complete a verifiable handshake → validation in under 30 seconds. Share-replay link works from a different machine.

---

### Day 5 (T-2) — Public Agent Gallery + Profile Pages + Polish

**What the user can DO at end of day:**
- Open `/agents` — a public gallery of all agents registered on our Identity Registry.
- Filter by capability tag, sort by reputation, search by `.sol`.
- Click an agent → `/agents/<domain>` profile page:
  - Header: avatar, `.sol`, controller, capability chips, reputation gauge.
  - Tabs: **Overview** (records v2, endpoint, attestations), **Reputation** (timeline + interactions), **Validations** (list of `ValidationRecord` PDAs), **Verify** (embedded Verifier Playground scoped to this agent).
  - "Talk to this agent" — if `agent.endpoint` is set, opens a small chat widget that hits the endpoint with a signed challenge first (proves the verification flow IRL).
- A Tutorial mode (first-time visitor): 4-step tour guiding through "create → register → handshake → see in gallery."

**What the user SEES:**
- A polished landing page with the pitch, the gallery, and the playground links pinned in the nav.
- Pre-seeded demo agents (we register 5–10 named ones on devnet so the gallery isn't empty).
- All copy/labels finalized; loading states; error states; mobile-decent (not mobile-first).

**What we BUILD:**
- [ ] `/agents` gallery list view (server component reads from program accounts via Helius RPC indexer, falls back to direct fetch).
- [ ] `/agents/<domain>` profile page with all four tabs.
- [ ] Tutorial overlay (`react-joyride` or similar) — only shows on first visit.
- [ ] **Optional:** SAS attestation flow if SAS is reachable on devnet without permissioning. Fallback: keep our Validation Registry as the attestation surface and document the swap in `SNSIP-AGENT.md`.
- [ ] Pre-seed script: `pnpm seed:agents` registers 5–10 demo agents under a parent `.sol` we own.
- [ ] Final Vercel prod deploy. Lock program IDs in README. Public demo URL.
- [ ] Open-source the repo (better than granting `contact@sns.id` private access).

**Demo moment:**
- Walking through the gallery, clicking a profile, hitting "Talk to this agent" → signed challenge round-trip → endpoint replies. End on the agent's reputation timeline ticking up.

**Exit criteria:** A judge can land on the home URL with no instructions and within 90 seconds: see a gallery, open a profile, run a verifier check, and understand what SNSIP-Agent is.

---

### Day 6 (T-1) — Submission package

**What the user can DO at end of day:**
- Watch a 2:30–3:00 demo video that is itself an interactive walkthrough mirror of the live URL.
- Open the deck PDF and immediately know the pitch in 90 seconds.
- Click into the GitHub repo and find a README that gets them running locally in <5 minutes.

**What we BUILD:**
- [ ] Polish `SNSIP-AGENT.md`: motivation, spec, examples, security considerations, references to ENSIP-25 and ERC-8004.
- [ ] Polish `README.md`: hero pitch, architecture diagram (PNG), demo URL, devnet program IDs + explorer links, "run locally" + "try the live demo" sections.
- [ ] Demo video (2:30 – 3:00):
  - 0:00 – 0:30 — Problem (ENS shipped ENSIP-25; SNS hasn't; Molt.id forked).
  - 0:30 – 1:00 — Solution (SNSIP-Agent + ERC-8004 port + ER).
  - 1:00 – 1:30 — Day-1 capture: create agent + records.
  - 1:30 – 1:55 — Day-3 latency theatre.
  - 1:55 – 2:30 — Day-4 handshake + validation.
  - 2:30 – 3:00 — Gallery walk + roadmap + ask.
- [ ] Pitch deck (8–10 slides), founder-first tone.
- [ ] Submit:
  - [ ] Colosseum (select **Global**).
  - [ ] Frontier hackathon entry on Colosseum (select **Global**).
  - [ ] Superteam Earn submission.

**Exit criteria:** All three submission portals confirmed; video URL public; live demo URL pinned in README.

---

## Pre-Staged Status (as of 2026-05-06)

Beyond planning, the following is on disk and verifiable now:

| Layer | Status |
|---|---|
| Spec — `SNSIP-AGENT.md` | ✅ Draft v1 (incl. permission shape + hierarchy revocation, ENSign prior art) |
| Anchor programs (4) | ✅ Skeletons compile-ready (Identity, Reputation, Validation, Verifier) |
| Anchor tests (4 files) | ✅ Happy + sad paths for each program; runs via `pnpm anchor:test` |
| TypeScript SDK | ✅ Real impls for SNS reads/writes, agent records, signing/verification, structured permissions (38 unit tests pass without network) |
| D1 dashboard pages | ✅ Hero + SNS Explorer + Create Agent Wizard staged in `apps/web-pages/` |
| D2 verifier playground | ✅ `/playground/verify` page staged; tamper toggle, local Ed25519 verify, on-chain stub |
| D3 latency theatre | ✅ `/playground/latency` staged; L1-vs-ER side-by-side, gauges + sparklines, auto-tap × 25, PREVIEW/REAL mode auto-detect |
| D4 handshake theatre | ✅ `/playground/handshake` staged; animated 7-step flow, 5-round validation cycle, replay |
| D5 agent gallery + profile | ✅ `/agents` (gallery + profile via ?domain= query) with overview/reputation/validations/verify tabs + Talk-to-Agent widget |
| D6 submission package | ✅ `pitch/{demo-script,deck-outline,submission-checklist}.md` ready to execute |
| Cloudflare deploy | ✅ `wrangler.toml` + `.github/workflows/deploy.yml` ready (Workers Static Assets) |
| Smoke test | ✅ `scripts/smoke-test.ts` — verifies SNS reads against live devnet |

What's NOT yet on disk (needs the user to act):
- Solana CLI + Anchor installed (modifies `$PATH`)
- `apps/web/` Next.js app bootstrap (one `pnpm create next-app` command)
- Real program IDs in `Anchor.toml` and program `declare_id!()` (needs `anchor keys sync` after install)
- `apps/web/package.json` deps (8 packages listed in `apps/web-pages/HOW-TO-INSTALL.md`)
- `KNOWN_REGISTRIES` constant in `packages/agent-sdk/src/resolve.ts` populated with real program ID after deploy
- GitHub repo secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`)

---

## Pre-flight: Before Day 1 Starts

These are 30-minute checks to do *before* the timer starts. Each one de-risks the plan; finding a blocker on Day 1 morning kills the schedule.

- [ ] **Phantom + Backpack on devnet** — both wallets installed, set to devnet, primed with airdropped SOL.
- [ ] **`.sol` domain owned on devnet** — if not, register one as the demo parent. Bonfida devnet endpoint check.
- [ ] **MagicBlock devnet ping** — send a no-op tx through Magic Router. If it 500s, surface this Day 1 morning, not Day 3 evening.
- [ ] **SAS program reachable** — try a no-op fetch; record fallback decision (use our Validation Registry).
- [ ] **Helius / Triton free-tier devnet RPC key** — public RPC will rate-limit during the demo.
- [ ] **Vercel project + GitHub repo** created and linked. CI building.
- [ ] **5 reserved domain names on devnet** for pre-seeded gallery agents (so Day 5 isn't waiting on registrations).

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| MagicBlock devnet flake during demo | Medium | High | Pre-record the latency segment; have a local-validator fallback recording |
| SAS not reachable / requires permissioning | Medium | Medium | Validation Registry is a drop-in; document swap |
| SNS records v2 SDK gotchas (RoA, staleness) | Medium | Medium | Test record write/read on day 1; reference sns.guide carefully |
| Anchor `#[delegate]` macro version mismatch | Low | Medium | Pin SDK version; test ER round trip on day 3 *before* building features |
| 6 days too tight for all 3 registries | High | Medium | Cut Reputation Registry → ship Identity + Validation only; keep ER demo on Identity (still demoable) |
| Judge confusion about Solana ↔ ENSIP-25 lineage | Medium | Medium | Address ENS comparison head-on in deck slide 2 |
| Repo discoverability (closed source missed) | Low | High | Keep repo public from day 1; add `contact@sns.id` to MAINTAINERS.md |
| Solo dev burnout | Medium | High | Day 5 cut list ready; sleep prioritized over polish |

---

## Submission Deliverables

Hard requirements from the listing:
- [x] Public GitHub repo (or read access for `contact@sns.id`)
- [x] Submission on Colosseum (**Global**)
- [x] Submission on Frontier hackathon entry on Colosseum (**Global**)
- [x] Submission on Superteam Earn
- [x] English content
- [x] Clear identity-track explanation
- [x] Pitch deck, video, documentation

What we'll have in the README:
- One-paragraph pitch
- Architecture diagram (PNG embedded)
- "Why this matters" section comparing to ENSIP-25 + Molt.id
- How to run locally (`pnpm i && pnpm dev`)
- Devnet program IDs and explorer links
- Live demo URL
- Roadmap (mainnet, SAS deeper integration, multi-registry support)

---

## Pitch Deck Outline

1. **Hook:** "ENS just shipped the AI agent identity standard for `.eth`. Solana — the chain that does 77% of x402 — has nothing equivalent. Until today."
2. **Gap:** Side-by-side ENS / SNS feature matrix. Highlight ENSIP-25 + ERC-8004.
3. **Solution:** SNSIP-Agent spec + Solana port of ERC-8004's three registries.
4. **Why now:** Agent infra wave (Pay.sh, Agent Registry, MoonAgents, x402). Molt.id forked the namespace; we extend it.
5. **Architecture:** the diagram from this plan.
6. **Demo:** screenshots of dashboard + ER latency overlay (then live demo or recorded fallback).
7. **What we shipped (in 6 days):** spec, 4 programs, SDK, dashboard, A2A demo, deployed.
8. **Roadmap:** mainnet, formalize SNSIP, ecosystem partner integrations (wallets, MCP servers).
9. **Team & ask:** team, post-hackathon plan, what we need from SNS.
10. **Close:** "We're not asking SNS to compete with ENS. We're shipping the missing piece so you don't have to."

---

## Day-1 Kickoff Commands

```bash
# from /Users/harryphan/Documents/dev/soldev/sns_prj
git init
echo "node_modules\n.next\ntarget\n.env.local\n.DS_Store" > .gitignore
pnpm init
mkdir -p programs packages apps
pnpm add -w -D turbo typescript @types/node

# Anchor workspace
anchor init --no-git agent-stack --javascript=false
# (then move into programs/ folder structure)

# Frontend
pnpm create next-app@latest apps/web --ts --tailwind --app --src-dir --import-alias "@/*"
cd apps/web && pnpm add @solana/web3.js @solana/wallet-adapter-react @solana/wallet-adapter-wallets @bonfida/spl-name-service
```

---

## Open Questions to Resolve Before Day 1

1. **Solo or team?** Plan assumes solo. With a teammate, parallelize: one on programs (Days 2–4), one on dashboard + SDK (Days 1–5).
2. **Mainnet stretch?** Default = devnet only. Mainnet only if Day 6 has slack.
3. **SAS availability check** — run on Day 1 in parallel with scaffolding (CLI ping to SAS program ID on devnet). Cuts risk early.
4. **Naming:** "SNSIP-Agent" vs "Solana Agent ID (SAID)" vs other? Pick before Day 1; affects package names.
5. **Domain registration cost on devnet** — verify the demo `.sol` registrations are free / fundable from a faucet. Pre-fund a wallet with several `.sol` parents to use as demo accounts.

---

## References

- [ENSIP-25 — Verifiable AI Agent Identity](https://ens.domains/blog/post/ensip-25)
- [ENS — Identity Problem in Agentic Commerce / ERC-8004](https://ens.domains/blog/post/ens-ai-agent-erc8004)
- [ENS v2 (official)](https://ens.domains/ensv2)
- [ENS Labs scraps Namechain L2](https://www.theblock.co/post/388932/ens-labs-scraps-namechain-l2-shifts-ensv2-fully-ethereum-mainnet)
- [NameStone — Gasless Subnames](https://namestone.com/blog/gasless-subnames)
- [Durin (GitHub)](https://github.com/namestonehq/durin)
- [ENS CCIP-Read docs](https://docs.ens.domains/learn/ccip-read/)
- [ERC-3668 (CCIP-Read)](https://eips.ethereum.org/EIPS/eip-3668)
- [ERC-7700 — Cross-chain Storage Router](https://eips.ethereum.org/EIPS/eip-7700)
- [ENSIP-5 — Text Records](https://docs.ens.domains/ens-improvement-proposals/ensip-5-text-records)
- [ENSIP-12 — Avatar Text Records](https://docs.ens.domains/ens-improvement-proposals/ensip-12-avatar-text-records)
- [SNS SDK monorepo](https://github.com/SolanaNameService/sns-sdk)
- [SNS Guide](https://sns.guide/)
- [MagicBlock Quickstart](https://docs.magicblock.gg/pages/get-started/how-integrate-your-program/quickstart)
- [MagicBlock Ephemeral Rollups SDK](https://github.com/magicblock-labs/ephemeral-rollups-sdk)
- [Solana Agent Registry](https://solana.com/agent-registry)
- [x402 on Solana](https://solana.com/x402/what-is-x402)
- [Solana Attestation Service (Range writeup)](https://www.range.org/blog/introducing-solana-attestation-service)
