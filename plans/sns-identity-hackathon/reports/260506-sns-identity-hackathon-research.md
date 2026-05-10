# Research Report: SNS Identity Track — Colosseum Hackathon (Powered by SNS, STMY, MagicBlock)

**Date conducted:** 2026-05-06
**Time remaining at start:** ~6 days
**Sponsors:** SNS (Solana Name Service), Superteam Malaysia (STMY), MagicBlock
**Prize pool:** $5,000 USDC ($1,800 × 2 winners + $700 × 2 runners-up)

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Research Methodology](#research-methodology)
3. [Key Findings](#key-findings)
4. [Strategic Project Recommendations](#strategic-project-recommendations)
5. [Recommended Architecture (Top Pick)](#recommended-architecture-top-pick)
6. [6-Day Build Plan](#6-day-build-plan)
7. [Submission Checklist](#submission-checklist)
8. [Open Questions](#open-questions)
9. [Sources](#sources)

---

## Executive Summary

The SNS track wants identity-as-a-primitive on Solana, split into **Agent Identity** and **Social Identity**. Three sponsors → all three should be touched: **SNS** (.sol as identity root), **MagicBlock** (real-time ephemeral rollups for sub-50ms UX), **STMY** (community/distribution).

**Winning bet: Agent Identity, not Social Identity.** Reasons:
- 2026 momentum is firmly on agentic infra (77% of x402 volume on Solana, Agent Registry shipped, Pay.sh launched, MoonAgents Card, Molt.id gold-rush). Judges are reading the same headlines.
- Social identity space is more crowded with mature competitors (Civic, Solana ID, Lens, MetaMask Embedded Wallets + SNS) — harder to look novel.
- **Molt.id launched .molt as a competing TLD in Feb 2026.** SNS sponsors have a strategic interest in seeing builders prove `.sol` is the right primitive for AI agents — not a fork. This is the gap to fill.

**Top recommendation: "AgentSol" — a trust + reputation + payments layer for AI agents using `.sol` as the identity root, with SAS attestations for verifiable capabilities and MagicBlock ephemeral rollups for high-frequency agent-to-agent settlement.**

Differentiation vs Molt.id: open standard, uses canonical `.sol` (not a new TLD that fragments identity), composes with the official Solana Agent Registry, x402-compatible.

---

## Research Methodology

- **Sources consulted:** ~30 across 5 parallel WebSearches
- **Date range:** Q4 2025 – May 2026 (current within last 6 months)
- **Search terms:** SNS SDK 2026, MagicBlock Ephemeral Rollups SDK, AI agent identity Solana x402, Sign in with Solana .sol login, Solana on-chain reputation sybil resistance
- **Note:** `gemini` CLI not available in env → fell back to WebSearch (5 queries, skill cap respected)

---

## Key Findings

### 1. SNS — Current State of the Sponsor Stack

- **SDK monorepo:** `github.com/SolanaNameService/sns-sdk` — JS SDK is most complete (instructions, resolution, records v2), Rust SDK covers resolution.
- **Records v2** (`/record-v2/:domain/:record`) — supports staleness, RoA (right of association), ETH/BTC/IPFS/avatar/url/etc. records. This is the feature to lean on for "portable identity."
- **Tokenized domains:** Domains can be wrapped as NFTs (Metaplex). Owner of NFT controls the domain → composable with marketplaces, escrow, vesting.
- **Subdomains:** `agent.username.sol` works natively → key primitive for hierarchical agent identity (one human, many sub-agents).
- **Reverse lookup:** `getAllDomains(wallet)` resolves any wallet → all owned domains. Foundational for "Sign in with .sol."
- **Scale:** ~270k registered domains, 150+ ecosystem integrations. SNS is plumbing, not a destination — opportunity is in apps.
- **Q1 2026 roadmap:** New SDKs and APIs to lower integration friction. Submitting an opinionated agent SDK on top of SNS aligns with the sponsor's roadmap.

### 2. MagicBlock — Ephemeral Rollups (ER)

- **What:** Sub-50ms (sometimes 10ms) execution layer that hot-loads PDAs into a session-scoped validator, executes, then commits state back to Solana mainnet. Full SVM compatibility.
- **SDKs:** `@magicblock-labs/ephemeral-rollups-sdk` (web3.js) or `@magicblock-labs/ephemeral-rollups-kit` (@solana/kit). Anchor `#[delegate]` macro marks accounts that get rolled up.
- **Magic Router:** Single endpoint — it decides ER vs base layer. Drop-in replacement for an RPC URL.
- **Hackathon angle:** Easy points if your dApp has *any* high-frequency interaction (chat, real-time auctions, agent-to-agent calls, presence/heartbeat). Wire ER into one feature, demo the latency drop on stage.

### 3. AI Agent Identity — Hot Sector (2026)

- **Solana Agent Registry** (official): PDA-based onchain identifier per agent → resolves to a registration file with A2A agent cards, MCP endpoints, wallet, capability declarations. *This is the interop layer to plug into.*
- **x402:** HTTP 402 payment protocol. ~35M Solana txns by March 2026. Agent's wallet = identity; payment = auth.
- **Pay.sh** (Solana Foundation + Google Cloud): pay-as-you-go for agent calls.
- **MoonAgents Card** (MoonPay): stablecoin spending rails for agents.
- **Molt.id:** Direct competitor — `.molt` Metaplex Core NFT = "identity + wallet + storage + AI agent." Launched Feb 2026. **They picked a new TLD instead of `.sol` — that is the strategic opening for an SNS-aligned submission.**

### 4. Social Identity / Sign in with .sol

- **Sign in with SNS** flows exist (MojoAuth, SSOJet docs, MetaMask Embedded Wallets) but are fragmented across vendors. No single dominant SDK.
- **Standard pattern:** wallet connect → server requests SNS domains → user signs message → server verifies signature + reverse lookup → JWT/session.
- **Gap:** No widely-adopted "Sign in with .sol" library that does (a) auth, (b) profile resolution from records v2, (c) subdomain-scoped permissions, (d) verified-claim layer (SAS) — all in one.

### 5. Reputation / Sybil Resistance — New Primitive Available

- **Solana Attestation Service (SAS):** New official onchain primitive. Issuers attest claims (e.g., "wallet X is human", "agent Y completed task Z") → verifiable onchain. *This is the missing ingredient most identity projects need and few are using yet.*
- Existing: Civic ($500M TVL), DecideID (face liveness), Gitcoin Passport (modular stamps), Lens (social graph).
- **Hackathon angle:** SAS is new + official + sponsor-adjacent. Using SAS = looking technically sharp without writing a custom contract from scratch.

---

## Strategic Project Recommendations

Three viable shapes, ranked. All hit the SNS theme; differences are in differentiation and feasibility in 6 days.

### 🥇 Option A — **AgentSol: .sol identity + SAS reputation + MagicBlock for AI agents**
- **Theme:** Agent Identity (primary)
- **Pitch:** "Molt.id forked the namespace; we make `.sol` the canonical identity root for AI agents — open, composable, attestation-backed."
- **Hits all 3 sponsors:** SNS (root identity, subdomains for sub-agents, records v2 for capabilities/endpoints), MagicBlock (real-time agent-to-agent settlement / heartbeat), STMY (story).
- **Novelty:** High. Directly counters Molt.id with the SNS-aligned answer.
- **6-day feasibility:** Medium-high. Core demo is buildable; reputation depth is where you trim if running out of time.

### 🥈 Option B — **SolPass: Sign in with .sol + portable profile + SAS-verified credentials**
- **Theme:** Social Identity
- **Pitch:** "OAuth for Solana. One library — auth, profile, verified claims, subdomain scopes — that any dApp drops in."
- **Sponsors hit:** SNS (deep), MagicBlock (weaker — could use ER for real-time presence/notifications), STMY (story).
- **Novelty:** Medium. Space is crowded but no one has shipped the canonical SDK yet.
- **6-day feasibility:** High. Mostly TS/SDK work, less smart-contract risk.

### 🥉 Option C — **SolGraph: on-chain reputation + sybil-resistant airdrop tool**
- **Theme:** Social Identity (reputation angle)
- **Pitch:** "Gitcoin Passport for Solana — .sol-rooted reputation graph that DAOs use for airdrops + governance."
- **Sponsors hit:** SNS (medium), MagicBlock (weak), STMY (story).
- **Novelty:** Medium-low. Civic + DecideID + Lens are entrenched.
- **6-day feasibility:** High but commodity-feeling. Risk: judges have seen many of these.

**Recommendation: Build Option A.**

---

## Recommended Architecture (Top Pick)

### AgentSol — High-Level

```
┌─────────────────────────────────────────────────────────────┐
│                     AgentSol Frontend                        │
│  (Next.js + @solana/wallet-adapter + Agent dashboard)        │
└────────────────────────┬─────────────────────────────────────┘
                         │
        ┌────────────────┼─────────────────────────────┐
        │                │                              │
        ▼                ▼                              ▼
┌──────────────┐  ┌──────────────────┐         ┌────────────────┐
│  SNS SDK     │  │  AgentSol Anchor │         │  SAS Client    │
│ (resolve,    │  │  Program         │◄────────┤  (attest caps, │
│  register,   │  │  (delegate accts │         │   reputation)  │
│  records v2) │  │   to MagicBlock) │         └────────────────┘
└──────┬───────┘  └────────┬─────────┘
       │                   │
       ▼                   ▼
┌──────────────┐  ┌──────────────────┐
│ Solana L1    │  │ MagicBlock       │
│ (.sol state, │  │ Ephemeral Rollup │
│  SAS attest) │  │ (agent sessions, │
│              │  │  heartbeat, A2A) │
└──────────────┘  └──────────────────┘
```

### Identity Schema

For an agent owned by `alice.sol`:
- `alice.sol` → human root (existing SNS account)
- `myagent.alice.sol` → agent subdomain (SNS subdomain primitive)
- Records v2 on `myagent.alice.sol`:
  - `endpoint` → MCP / A2A URL
  - `capability` → JSON capability card
  - `pubkey` → agent's Ed25519 signing key (separate from owner)
  - `pay` → x402 payment endpoint
  - `agent_registry` → PDA pointer into Solana Agent Registry
- **SAS attestations** signed by AgentSol issuer or third parties:
  - "verified human owner"
  - "completed N tasks"
  - "behaviour score X" (computed off-chain, attested on-chain)

### Session Flow (uses MagicBlock)

1. Agent A wants to call agent B → resolve `b.bob.sol` via SNS SDK.
2. AgentSol program delegates relevant accounts to ER (Magic Router).
3. Inside ER: rapid back-and-forth (negotiate, sign, settle micro-payment via x402-style flow). Sub-50ms.
4. ER commits final state to L1; SAS attestation written for the completed interaction.

### Why this scores well on each judging criterion

| Criterion | How we score |
|---|---|
| **Innovation** | First open standard combining .sol + SAS + ER for agents; counter-narrative to Molt.id |
| **Technical Merit** | Anchor program with delegate macro, SAS integration, SDK with TS types |
| **Practicality** | Solves real pain: agent trust + reputation + composable identity |
| **Completeness** | E2E demo: register agent → sign attestation → A2A call inside ER → settled |
| **UX** | Next.js dashboard, one-click "Add agent to your .sol" |
| **Founder Potential** | Aligns with Solana Foundation's Agent Registry direction; clear post-hackathon plan |
| **Demo Quality** | Live ER latency demo on stage = unforgettable |

---

## 6-Day Build Plan

> Brutal but achievable. Cut the reputation/SAS layer first if behind by Day 4.

### Day 1 — Scaffold + SNS basics
- Init Next.js + Anchor monorepo (`pnpm` workspaces, Turborepo).
- Wire `@solana/wallet-adapter` + `@bonfida/spl-name-service` (or sns-sdk).
- Implement: connect wallet → list `.sol` domains owned (reverse lookup) → register subdomain `myagent.alice.sol`.
- Set 4–5 records v2 on the subdomain (endpoint, pubkey, capability JSON).

### Day 2 — Anchor program + MagicBlock delegate
- Anchor program: `AgentAccount` PDA keyed by SNS domain hash. Stores agent metadata pointer.
- Add `#[delegate]` from `ephemeral-rollups-sdk`. Implement `delegate_to_er` and `commit_state` instructions.
- Stand up local validator + magicblock devnet test. Confirm a no-op transaction round-trips through ER.

### Day 3 — A2A interaction inside ER
- Inside ER session: agent A signs message → agent B verifies signature against pubkey record on B's `.sol`.
- Tiny "ping/pong" + counter increment to *prove* the latency story.
- Capture trace + screen recording showing sub-50ms.

### Day 4 — SAS attestations
- Integrate Solana Attestation Service. Define schema: `{ agent_did, interaction_count, last_active, score }`.
- After each ER session commit, write/update SAS attestation.
- Frontend: render reputation badges from SAS for any `.sol` agent.

### Day 5 — UX polish + x402 hook
- Dashboard: "Your Agents", capability editor, reputation timeline.
- Stub x402 integration: agent `/pay` endpoint that quotes via the agent's `pay` record. Demoable, doesn't need full payment loop.
- Public hosted demo (Vercel + Solana devnet). Clean repo + README.

### Day 6 — Submission deliverables
- 2–3 min demo video (Loom/YouTube unlisted). Script:
  1. Problem (30s — agent identity fragmented, Molt.id forks the namespace)
  2. Solution architecture (40s)
  3. Live demo: register → set records → A2A call w/ latency overlay → SAS reputation update (60s)
  4. Roadmap + ask (20s)
- Pitch deck (8–10 slides). Use Colosseum founder-first template tone.
- README with: problem, architecture diagram, run instructions, env vars, devnet program IDs.
- Submit on Colosseum (select **Global**) AND Superteam Earn.
- Grant repo access to `contact@sns.id` (or open-source — better signal).

---

## Submission Checklist

- [ ] Public GitHub repo (or read access for `contact@sns.id`)
- [ ] Clear README explaining problem → product → architecture → why it matters
- [ ] Pitch deck
- [ ] Demo video (English, clear)
- [ ] Live deployment (devnet OK, mainnet better if time)
- [ ] Registered on Colosseum, **Global** track selected
- [ ] Submitted to Frontier hackathon on Colosseum, **Global** selected
- [ ] Submitted on Superteam Earn
- [ ] Explanation of how project addresses agent/social identity on Solana
- [ ] All content in English

---

## Common Pitfalls

- **Don't pick `.sol` then never use SNS SDK directly** — judges from SNS will spot lazy integration. Use records v2 + subdomains, not just resolution.
- **Don't ship a closed-source repo without granting access to `contact@sns.id`** — explicit submission requirement.
- **Don't over-scope smart contracts.** Anchor + MagicBlock delegate macro is enough; resist adding tokenomics / governance / treasuries.
- **Don't skip the demo video.** "Demo and Submission Quality" is a separate judging criterion.
- **Don't forget MagicBlock.** It's a sponsor — using ER even minimally signals you read the brief.
- **Don't pretend to compete with Molt.id without naming it.** Address it head-on: open standard vs walled garden.

---

## Quick Start Code Snippets

### Resolving + reading records v2 (SNS SDK)
```ts
import { Connection } from "@solana/web3.js";
import { resolve, getRecordV2 } from "@bonfida/spl-name-service";

const connection = new Connection("https://api.devnet.solana.com");
const owner = await resolve(connection, "myagent.alice.sol");
const endpoint = await getRecordV2(connection, "myagent.alice.sol", "url");
```

### Delegating an account to MagicBlock ER (Anchor)
```rust
use ephemeral_rollups_sdk::anchor::delegate;

#[delegate]
#[derive(Accounts)]
pub struct AgentSession<'info> {
    #[account(mut, del)]
    pub agent: Account<'info, AgentAccount>,
    pub signer: Signer<'info>,
}
```

### Sending tx via Magic Router
```ts
import { Connection } from "@solana/web3.js";
const conn = new Connection("https://devnet-router.magicblock.app");
// drop-in replacement; router auto-decides L1 vs ER
```

---

## Open Questions

1. **SAS availability on devnet?** Confirm program ID + that test issuers can be created without permissioning. If not — fallback: ship a custom attestation Anchor program (smaller in scope: append-only event log).
2. **MagicBlock devnet endpoint stability?** Plan B: record demo against testnet/local-validator if devnet flakes during pitch.
3. **Solana Agent Registry — is it permissionless?** If we can register an agent there for free, do it as part of demo. If gated → just store a pointer record on the SNS domain and explain composition.
4. **Team size?** Plan above assumes solo or 2-person dev. With 3+, parallelize Day 4 (SAS + UX) starting on Day 2.
5. **Mainnet vs devnet for final demo?** Devnet is fine for hackathons; only push to mainnet if there's spare time on Day 6.

---

## Sources

- [SNS Guide (official)](https://sns.guide/)
- [SNS SDK monorepo (GitHub)](https://github.com/SolanaNameService/sns-sdk)
- [SNS — Resolving Domains](https://sns.guide/domain-name/wallet-guide/resolving-domains)
- [Quicknode — Querying SNS .sol Domains](https://www.quicknode.com/guides/solana-development/accounts-and-data/how-to-query-solana-naming-service-domains-sol)
- [SNS — What it is and how it works (CMC)](https://coinmarketcap.com/cmc-ai/sns/what-is/)
- [SNS — Latest Updates (CMC)](https://coinmarketcap.com/cmc-ai/sns/latest-updates/)
- [MagicBlock Quickstart](https://docs.magicblock.gg/pages/get-started/how-integrate-your-program/quickstart)
- [MagicBlock GitHub](https://github.com/magicblock-labs)
- [MagicBlock Ephemeral Rollups SDK](https://github.com/magicblock-labs/ephemeral-rollups-sdk)
- [MagicBlock — Guide to Ephemeral Rollups](https://www.magicblock.xyz/blog/a-guide-to-ephemeral-rollups)
- [Solana Agent Registry — What is it](https://solana.com/agent-registry/what-is-agent-registry)
- [Solana Agent Registry — Trust Layer](https://solana.com/agent-registry)
- [x402 Payment Protocol on Solana](https://solana.com/x402/what-is-x402)
- [Alchemy — How to Build a Solana AI Agent in 2026](https://www.alchemy.com/blog/how-to-build-solana-ai-agents-in-2026)
- [Solana Foundation × Google Cloud — Pay.sh](https://www.theblock.co/post/400059/google-cloud-solana-foundation-ai-payments)
- [Molt.id — first AI agent domain on Solana](https://www.globenewswire.com/news-release/2026/02/25/3244797/0/en/Molt-id-The-First-AI-Agent-Domain-System-on-Solana-Where-One-NFT-Gives-You-Everything.html)
- [MoonAgents Card](https://genfinity.io/2026/05/01/moonpay-moonagents-card-ai-agents-solana-mastercard-stablecoins/)
- [awesome-solana-ai (Solana Foundation)](https://github.com/solana-foundation/awesome-solana-ai)
- [Sign-in with SNS (MojoAuth)](https://docs.mojoauth.com/web3/sns/)
- [MetaMask — Integrate SNS with Embedded Wallets](https://docs.metamask.io/tutorials/integrate-sns/)
- [Solana ID](https://www.solana.id/)
- [Quicknode — Authenticate Users with a Solana Wallet](https://www.quicknode.com/guides/solana-development/dapps/how-to-authenticate-users-with-a-solana-wallet)
- [Solana Attestation Service — Range](https://www.range.org/blog/introducing-solana-attestation-service)
- [Sybil Resistance & Onchain Identity 2026 (BlockXS)](https://blog.blockxs.com/sybil-resistance-and-onchain-identity-2026/)
- [DecideID on Solana (CryptoSlate)](https://cryptoslate.com/icp-identity-protocol-decideid-launches-on-solana-to-reduce-kyc-need-for-defi/)
- [Best Digital Identity Apps on Solana (Solana Compass)](https://solanacompass.com/projects/category/digital-identity)
