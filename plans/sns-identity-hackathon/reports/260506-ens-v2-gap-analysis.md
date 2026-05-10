# Research Report: ENS v2 vs SNS — Gap Analysis & Hackathon Project Mapping

**Date conducted:** 2026-05-06
**Companion to:** `260506-sns-identity-hackathon-research.md`
**Question being answered:** What does ENS v2 / the broader ENS ecosystem ship that SNS doesn't, and which gaps map to the SNS Identity Track?

---

## TL;DR

ENS is ~3 years ahead of SNS in identity standards. The biggest gap, and the one that maps perfectly to the hackathon track, is:

**ENSIP-25 (Verifiable AI Agent Identity with ENS) — published by ENS Labs as a minimal standard for using ENS names as the trust root for on-chain AI agents. SNS has no equivalent.**

If you build this for SNS, you are:
1. Filling a real gap that the SNS sponsor cares about (they need the agent identity story to compete with ENS).
2. Riding the 2026 agentic infra wave (the same wave Molt.id, Solana Agent Registry, x402, Pay.sh are all riding).
3. Producing a *standard* — not just an app — which scores on Innovation and Founder Potential.
4. Doing something that maps 1:1 to the "Agent Identity" theme of the track.

Backup picks below in case this isn't the direction you want.

---

## ENS Ecosystem Capability Matrix

| # | ENS feature | What it is | SNS equivalent | Gap severity |
|---|---|---|---|---|
| 1 | **ENSIP-25** | Text-record standard binding ENS name → on-chain AI agent | None | 🔴 Massive |
| 2 | **ENSIP-10 + ERC-3668 (CCIP-Read)** | Wildcard resolution + offchain data retrieval → gasless subnames | None (subdomains require on-chain accounts) | 🔴 Massive |
| 3 | **NameStone / Durin** | SaaS infra for apps to issue subnames at scale, free for users | None | 🔴 Large |
| 4 | **ERC-7700** | Cross-chain Storage Router → write identity data to L2/offchain via L1 | None | 🟠 Medium |
| 5 | **ENSIP-5 / ERC-634 Text Records** | Canonical key taxonomy (avatar, url, email, com.twitter, com.github…) | Records v2 exists but no canonical taxonomy | 🟠 Medium |
| 6 | **ENSIP-12 Avatar Text Records** | Standard for NFT-as-avatar (ERC721/1155 metadata resolution) | Weak / inconsistent | 🟠 Medium |
| 7 | **EFP (Ethereum Follow Protocol)** | On-chain social graph rooted in ENS names → follow lists, mutuals | None | 🟠 Medium |
| 8 | **Primary Name (reverse record)** | Wallet-wide standard wired into every major wallet | Reverse lookup exists but inconsistent UX | 🟡 Small |
| 9 | **Hierarchical per-name registry (ENS v2)** | Each name gets its own registry contract → granular permissions | Flat-ish account structure | 🟡 Small |
| 10 | **EAS attestations on ENS profiles** | Verified-credential bundles tied to a name | SAS exists but no integration pattern with .sol records | 🟠 Medium |

Notable bonus context:
- **ENS killed Namechain L2 in Feb 2026** — gas dropped 99% on L1, killed the L2 thesis. So "L2 for naming" is a dead-end direction (don't pitch it).
- ENS v2 keeps cross-chain interop via CCIP-Read, not via owning an L2.

---

## Gap → Project Mapping (Hackathon-Ranked)

### 🥇 Project A — **"SAS-Agent" / "AgentSol": ENSIP-25 ported to SNS**
- **Theme:** Agent Identity (primary)
- **Gap closed:** #1, #5, #10
- **The pitch:** ENS just shipped a minimal standard so any ENS name can verifiably represent an on-chain AI agent. SNS has nothing equivalent. We propose **SNSIP-Agent** — the same thing for `.sol` — and ship the reference contract, SDK, and dashboard in one repo.
- **Concrete deliverables in 6 days:**
  1. Spec doc: standardized SNS records v2 keys (`agent.controller`, `agent.endpoint`, `agent.capabilities`, `agent.signing_pubkey`, `agent.attestation`).
  2. Anchor verification program: given a `.sol` and a presented agent signature, on-chain verifies "this agent is bound to this domain."
  3. SDK: `bindAgent(domain, agentKey)` / `verifyAgent(domain, signature)` in TS.
  4. Dashboard: connect wallet → register agent under a subdomain → set capability records → SAS attestation flow.
  5. Live demo: agent A signs a message → verifier resolves A's `.sol`, fetches signing pubkey, verifies signature, returns capability list. Done in <1s.
- **Why it wins:**
  - **Innovation:** first SNS-native agent ID standard, modeled after the just-published ENSIP-25.
  - **Technical Merit:** spec + program + SDK + UI is a real piece of infra, not a toy.
  - **Founder Potential:** standards work is sticky; sponsor can adopt it directly.
  - **Demo Quality:** "ENS just did this for ETH agents. Here's the same primitive for the chain that does 77% of x402 volume."
  - **Counter-Molt.id:** Molt forked the namespace. We extend the canonical one with a real standard.

### 🥈 Project B — **"SubSol": Gasless `.sol` subnames (Durin / NameStone for Solana)**
- **Theme:** Social Identity (onboarding)
- **Gap closed:** #2, #3, #8
- **The pitch:** ENS apps issue millions of free subnames (`jesse.base.eth`) via CCIP-Read + wildcard resolution. Solana apps can't do this. We build the protocol + SDK + hosted gateway for `username.myapp.sol` — free to issue, free to update, no signature needed for end users.
- **Mechanism on Solana:**
  - On-chain: a *catch-all resolver* program that owns a `.sol` and overrides resolution for arbitrary subdomain reads via off-chain pointer.
  - Off-chain: a gateway (Cloudflare Worker / Bun server) that signs resolution responses with a key that the on-chain resolver trusts.
  - Wallet integration: a small library wallets opt into for "extended resolution" (Solana lacks a native CCIP-Read analog, so we ship a `resolve()` helper).
- **6-day feasibility:** Tighter than A. The hard part is convincing wallets/apps to call your resolver wrapper — but for a hackathon demo, you control the demo dApp.
- **Why it could win:**
  - **Practicality:** unblocks "every dApp gives every user a free name."
  - **Innovation:** brings a battle-tested ENS pattern to Solana with non-trivial adaptation.
- **Why it might not:**
  - Less aligned with the agent-identity tailwind.
  - Risk that judges read "gasless" and shrug — Solana txns are already cheap.

### 🥉 Project C — **"SolGraph": Solana Follow Protocol (port of EFP)**
- **Theme:** Social Identity (social graph + reputation)
- **Gap closed:** #7, partially #5
- **The pitch:** EFP gave Ethereum an open social graph rooted in ENS. Solana has no equivalent. SolGraph is `.sol` follow lists + indexer + reputation signal API.
- **Risk:** lots of failed Solana social graph attempts. Judges may pattern-match to those. Also: this competes with Lens (already cross-chain) — harder to differentiate.

### Honorable mentions (don't lead with these, can be features inside A)
- **SNSIP-Avatar** — port ENSIP-12 cleanly so wallets render NFT avatars from `.sol` records. Half-day add-on.
- **Canonical text-record taxonomy** — port ENSIP-5 keys. Two-hour add-on.
- **EAS-style attestation overlay** — already covered via SAS in Project A.

---

## Why "Port ENSIP-25" is the Right Bet

Three reasons it's the strongest line through the data:

1. **It's a fresh, public ENS announcement.** The blog post "ENSIP-25: Verifiable AI Agent Identity with ENS" is recent and on-narrative. Judges read crypto Twitter — they will recognize the move and respect a well-executed Solana counterpart.

2. **It addresses the structural problem the SNS team is facing.** Agentic infra is the hottest sector in 2026. ENS is positioning itself as *the* agent identity layer with ENSIP-25. If SNS has no answer, .sol becomes "the consumer naming chain" — which is fine but not where the volume is going. The SNS team needs builders to prove the agent thesis on `.sol`. That's literally why this track exists.

3. **It's a standard, not just an app.** Track judging weighs Founder Potential and Innovation heavily. Shipping a *spec + reference impl + SDK* signals ecosystem ambition. An app is one product; a standard is leverage on every other product.

---

## Differentiation Story for the Pitch

Open with the ENS comparison head-on. Don't hide it. Judges will see through "we invented this from nothing" pitches.

> **Slide 1 (hook):** "In April 2026, ENS Labs published ENSIP-25 — a minimal standard for verifiable AI agent identity rooted in `.eth` names. Solana, which clears 77% of x402 transaction volume and is the de-facto execution layer for autonomous agents, doesn't have this. Today we're proposing — and shipping — SNSIP-Agent."

> **Slide 2 (gap):** Side-by-side. Left column: ENS — ENSIP-25, EAS attestations, ENSIP-10 wildcard resolution, EFP social graph. Right column: SNS — none, none, none, none. "We close one of these. Properly. In 6 days."

> **Slide 3 (the wedge vs Molt.id):** "Molt.id launched `.molt` as a new TLD. We don't fork the namespace. We extend it. `myagent.alice.sol` — same identity root, agent-aware records, SAS-attested capabilities."

---

## Implementation Notes Specific to Porting ENSIP-25

ENSIP-25 (per ENS docs) does roughly this:
- Set a text record on the ENS name pointing to the agent's contract / signing key.
- Verifier resolves the name → reads the text record → checks claim.
- Optionally add EAS attestations for capabilities, audits, deployment provenance.

The Solana port using SNS records v2 + SAS:
- Define record keys (proposed):
  - `agent.controller` → the `.sol` owner who controls the agent (often the parent domain)
  - `agent.signing_pubkey` → Ed25519 pubkey the agent signs messages with (separate from the SNS account)
  - `agent.endpoint` → MCP/A2A URL
  - `agent.capabilities` → JSON capability card (or pointer to one)
  - `agent.attestations` → list of SAS attestation account addresses
  - `agent.registry` → optional pointer to Solana Agent Registry PDA
- Verification flow (TS SDK):
  ```ts
  import { resolveAgent, verifyAgentSignature } from "snsip-agent";

  const agent = await resolveAgent(connection, "myagent.alice.sol");
  // → { controller, signingPubkey, endpoint, capabilities, attestations }

  const ok = verifyAgentSignature(agent, message, signature);
  ```
- On-chain verifier (Anchor) — optional but high-signal:
  - Program `verify_agent(domain_hash, message, signature)` that:
    1. Resolves SNS account (CPI into SNS program).
    2. Reads `agent.signing_pubkey` record.
    3. Verifies Ed25519 signature on-chain.
    4. Returns / events the verification result.
  - Lets *other* Solana programs gate access by "is this call from a verified agent?"

This is a meaty but achievable 6-day build.

---

## What NOT to Build (Despite Being Tempting)

- **Namechain port** — ENS just killed their own L2 for naming. Don't ship something they explicitly walked away from.
- **A new TLD** — Molt.id already did `.molt`. Sponsor (SNS) does not want builders fragmenting the namespace.
- **A full social network** — too big for 6 days, will look unfinished.
- **Cross-chain ENS↔SNS bridge** — interesting but operational complexity is high; demo will be flaky.
- **A wallet** — saturated, not what the track is about.

---

## Open Questions

1. Has SNS published any agent-identity record key conventions yet? Worth checking `sns.guide` and the SDK repo for a 2026 changelog before finalizing record names.
2. Is ENSIP-25 finalized or still in draft? If draft, mirroring it is even higher leverage (you're shaping the standard alongside).
3. Does the SNS team have a public records-v2 schema registry we should write to / coordinate with?
4. SAS issuer authority — can a hackathon team self-issue or do we need permissioning? (Same open question from the previous report.)

---

## Sources

- [ENS — Goodbye Namechain (Bit2Me)](https://news.bit2me.com/en/Goodbye-to-Namechain--Ens-abandons-its-Layer-2)
- [The Block — ENS scraps Namechain L2](https://www.theblock.co/post/388932/ens-labs-scraps-namechain-l2-shifts-ensv2-fully-ethereum-mainnet)
- [ENS v2 official page](https://ens.domains/ensv2)
- [CoinDesk — Ethereum's ENS scraps planned rollup](https://www.coindesk.com/tech/2026/02/06/ethereum-s-ens-identity-system-scraps-planned-rollup-amid-vitalik-s-warning-about-layer-2-networks)
- [NameStone — Gasless ENS Subdomains](https://namestone.com/blog/gasless-subnames)
- [NameStone — ENS Global Adoption](https://namestone.com/blog/ens-global-adoption)
- [Durin (GitHub) — L2 ENS subnames](https://github.com/namestonehq/durin)
- [ENS Docs — Subdomains](https://docs.ens.domains/web/subdomains/)
- [ENS Docs — Layer 2 & Offchain Resolution (CCIP-Read)](https://docs.ens.domains/learn/ccip-read/)
- [ENS Docs — Offchain / L2 Resolvers](https://docs.ens.domains/resolvers/ccip-read/)
- [ERC-3668 — CCIP-Read (EIPs)](https://eips.ethereum.org/EIPS/eip-3668)
- [ENS offchain-resolver (GitHub)](https://github.com/ensdomains/offchain-resolver)
- [ENSIP-16 — Offchain Metadata](https://docs.ens.domains/ens-improvement-proposals/ensip-16-offchain-metadata)
- [ERC-634 — Text Records in ENS](https://eips.ethereum.org/EIPS/eip-634)
- [ENSIP-5 — Text Records](https://docs.ens.domains/ens-improvement-proposals/ensip-5-text-records)
- [ENSIP-12 — Avatar Text Records](https://docs.ens.domains/ens-improvement-proposals/ensip-12-avatar-text-records)
- [ERC-7700 — Cross-chain Storage Router Protocol](https://eips.ethereum.org/EIPS/eip-7700)
- [**ENSIP-25 — Verifiable AI Agent Identity with ENS**](https://ens.domains/blog/post/ensip-25)
- [ENS Blog — Identity Problem in Agentic Commerce / ERC-8004](https://ens.domains/blog/post/ens-ai-agent-erc8004)
- [arXiv — AI Agents with DIDs and Verifiable Credentials (2511.02841)](https://arxiv.org/abs/2511.02841)
