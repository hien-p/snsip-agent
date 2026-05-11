# Submission Text — Paste-Ready for All 3 Portals

Copy each block exactly as-is into the portal field. Tweak the team / contact bits.

---

## Project name

```
SNSIP-Agent
```

## Tagline (one-liner, ≤ 80 chars)

```
Verifiable, revocable AI agent identity for .sol — readable by any MCP-aware AI assistant.
```

## Subtitle (≤ 200 chars, used by Colosseum + Superteam Earn)

```
Give your AI agent a .sol identity. SNSIP-Agent is the open standard + reference implementation that turns Solana name records into a verifiable, revocable identity layer for autonomous agents.
```

---

## Short description (200–400 chars)

```
SNSIP-Agent makes a .sol the verifiable, revocable identity for any AI agent on Solana. Signing key, endpoint, structured permissions, and reputation all live in SNS records v2. Ships with @snsip/mcp — Claude Desktop, Cursor, anything MCP-aware reads it live. 5 real agents on devnet today, every interaction byte-verifiable on Solana Explorer.
```

---

## Long description (Colosseum + Frontier "About" field)

```
SNSIP-Agent is the foundational protocol that lets a .sol name be the verifiable, revocable identity for any AI agent on Solana.

Why now: AI agents already move real money on Solana every block, and every one of them today is a raw keypair. No name, no scope, no audit trail, no way for a counterparty dApp to know what an agent is allowed to do, no way for an owner to revoke it short of rotating keys. Identity is the missing primitive on Solana. SNSIP-Agent is the standard layer that fills the gap — and is the first identity protocol on Solana that speaks MCP natively, so any AI assistant in the LLM ecosystem can read it without custom integrations.

What we shipped in 8 days:

1. SNSIP-Agent draft spec (SNSIP-AGENT.md, EIP-shaped) — defines a canonical SNS records v2 key for binding a `.sol` to an on-chain agent registry, plus a structured permission schema (target, selector, spend cap, period, expiry) and forward-compatible memo schemas for reputation, validation, and cross-agent handshakes.

2. ERC-8004 trust stack on Solana — Anchor programs sketched for Identity / Reputation / Validation registries, with the Memo program acting as a forward-compatible registry-prototype today (SNSIP-Rep v2 / SNSIP-Val v2 byte schemas already match the future Anchor account layouts).

3. TypeScript SDK (@snsip/agent-sdk) — cluster-aware reads/writes for SNS records v2, Ed25519 signing/verification, structured permission JSON, on-chain owner resolution patched for devnet, latency helpers. 38 unit tests, all green.

4. @snsip/mcp — Model Context Protocol server exposing five tools (sns_resolve_identity, sns_check_permission, sns_list_agents, sns_sign_in_with_sol, sns_agent_activity) so Claude Desktop, Cursor, Continue, and any MCP-aware AI assistant can read .sol agent identities live and pull real on-chain activity via Dune SIM. Single npm-installable workspace package wrapping the SDK.

5. MagicBlock Ephemeral Rollups integration — sub-50ms agent-to-agent settlement (preview mode in the demo, real mode after `anchor deploy`).

6. Live deployed dApp at https://snsip-cc5.pages.dev — guided 4-stop tour covering Sign-in with .sol, sybil-resistant airdrop, permission-gated swap, and the MCP integration; plus a public agent gallery with permission editor, reputation timeline (weighted), validation list (typed), two-agent handshake, and L1-vs-ER latency theatre. 5 real on-chain devnet agents (snsip-test-001, swap-bot, monitor, auditor, arb-trader) with 25 records v2 written.

Both SNS bounty themes covered:
- Social Identity → /login-demo (sign in with .sol replaces email/password)
- Agent Identity → /swap-demo + /mcp (permission-gated actions, AI-assistant-native)
- Sybil resistance → /airdrop-demo (the bounty's listed example use case)

Real Ed25519 cryptography end-to-end. Real on-chain Solana state. Open standard, MIT-licensed, single repo.
```

---

## Team

```
Team SNSIP-Agent
Harry Phan — solo builder · ships in Solana, TypeScript, MCP
```

## Contact

```
Email:   phanhoangvinhhien@gmail.com
Twitter: https://x.com/harry_phan06
GitHub:  https://github.com/hien-p/snsip-agent
```

---

## Repo URL (Colosseum + Frontier + Superteam Earn)

```
https://github.com/hien-p/snsip-agent
```

If the repo is still private at submission time, grant read access to **contact@sns.id** (the SNS team email — required by the listing).

## Live demo URL

```
https://snsip-cc5.pages.dev
```

## Demo video URL

```
[YouTube unlisted link — record per pitch/demo-script.md]
```

## Pitch deck URL or PDF upload

```
[Pitch.com link or pitch/deck.pdf]
```

---

## Dune Frontier Data Sidetrack — submission text (re-cut for the SIM track)

Dual-submit on Superteam Earn under the Dune SIM track. Same project, recast headline so SIM is the protagonist.

### Tagline (Dune track)

```
Reputation for AI agents on Solana, sourced live from Dune SIM.
```

### Long description (Dune track "About" field)

```
SNSIP-Agent is the verifiable identity layer for AI agents on Solana — and we use Dune SIM as the on-chain truth source for an agent's live activity, the data layer that lets dApps and AI assistants distinguish a real agent from a stub.

Where SIM is integrated:

1. Agent profile → "Live activity" panel (apps/web/src/components/agent-activity.tsx)
   Calls SIM's /beta/svm/balances and /beta/svm/transactions endpoints in parallel to render: 30-day tx count, last-seen timestamp, total USD held, top token holdings. Surfaces an Explorer link for verification. Rendered inside the Reputation tab so it sits alongside the (subjective) attestation events as the (objective) on-chain counterpart.

2. MCP tool → sns_agent_activity (packages/snsip-mcp/src/server.ts)
   Any MCP-aware AI assistant — Claude Desktop, Cursor, Continue — can call this tool with a .sol or any mainnet wallet pubkey and receive a structured activity snapshot. Pulls from the same SIM endpoints, returns the snapshot as JSON the LLM can reason over. This is the killer SIM use case: Claude Desktop natively answering "how active is swap-bot.sol's owner on Solana?" with live SIM data, no custom integration.

3. SDK wrapper (packages/agent-sdk/src/sim.ts)
   Typed wrapper exporting simSvmBalances, simSvmTransactions, and getAgentActivitySnapshot. Anyone consuming @snsip/agent-sdk can drop SIM into their own Solana app with one import.

Quality of SIM use: SIM is the data source for the most reputation-relevant signal an agent has — its own behavior history. Reputation memos can be gamed; on-chain transaction counts and holdings cannot. The integration is load-bearing, not bolt-on.

Creativity & UX: SIM data is exposed via three surfaces simultaneously — a polished web panel, an MCP tool any AI assistant can use, and a typed SDK function. Same Dune endpoint, three idiomatic consumption patterns for the Solana stack.

Innovation: This is the first MCP server in the Solana ecosystem to expose SIM-sourced agent activity to AI assistants. ChatGPT desktop apps with MCP support, Cursor, Continue — all can now ask Claude / their LLM to reason about a Solana wallet's on-chain reality through the standard agent protocol, sourced from Dune.
```

### "How does your project use SIM?" (Dune-required field)

```
Three places, all load-bearing:

(1) Reputation tab on every agent profile renders a "Live activity" panel powered by SIM's /beta/svm/balances and /beta/svm/transactions. 30-day tx count, last-seen, USD held, top tokens — pulled live, not cached.

(2) MCP server exposes sns_agent_activity tool that any MCP-aware AI assistant can call to receive the same SIM snapshot as JSON. Claude Desktop, Cursor, Continue → all wired up.

(3) @snsip/agent-sdk exports simSvmBalances, simSvmTransactions, getAgentActivitySnapshot as a typed npm-installable wrapper.

SIM is mainnet-only as of beta. Our demo agents live on devnet, so the Reputation panel accepts a mainnet wallet override (defaults to a known active program author) — explicit "mainnet activity" badge so judges see real SIM data without configuration.
```

### Live SIM demo

```
Web: open https://snsip-cc5.pages.dev/agents/?domain=auditor.sol → Reputation tab → scroll to the "Live activity" panel. Click Fetch.

MCP (Claude Desktop): after wiring the snsip-agent MCP server (see packages/snsip-mcp/README.md), ask:
"Pull SIM activity for [any mainnet wallet]"
Claude calls sns_agent_activity, returns a JSON snapshot.
```

---

## Track-specific fields

### Colosseum platform — Region selector

**Select: Global**

(NOT Malaysia, NOT Network State — the listing was updated to Global.)

### "Which theme does your project address?" (SNS Identity Track has two themes)

**Select: Agent Identity**

If a free-text follow-up: paste the long description above.

### "How does your project address identity, social identity, or agent identity on Solana?" (SNS-required field)

```
SNSIP-Agent is the protocol layer for AI agent identity on Solana. It defines and ships:

- A canonical SNS records v2 key (agent-registration[<registry>][<agentId>]) that binds a .sol to an on-chain agent registry.
- A structured permission schema (target, selector, spend cap, period, expiry) stored in the agent.capabilities record.
- A reference Solana implementation of ERC-8004's three registries (Identity, Reputation, Validation) as Anchor programs, plus an Ed25519 sysvar verifier.
- A TypeScript SDK that reads and writes these records cluster-aware (mainnet ↔ devnet), so wallets and dApps can adopt it with a single dependency.
- A live deployed dApp showing 5 real on-chain devnet agents with full record sets.

This solves the "agents need names, names need verifiable identity, identity needs structured permissions" trio in one open standard. Burning the parent .sol revokes every sub-agent in the same block — no separate revocation transaction, no off-chain coordination. Hierarchy is the capability tree.
```

### Skills used

```
Blockchain, Frontend, Backend, Content
```

(All 4 listed skills from the bounty page — we hit each.)

---

## Skills/tags (Superteam Earn loves these)

```
Solana, SNS, AI Agents, MCP, Model Context Protocol, MagicBlock, Anchor, Identity, Verifiable Credentials, Ed25519, Records v2, Claude Desktop, Dune SIM, Sybil Resistance
```

---

## Submission checklist before hitting "Submit"

- [ ] Repo public OR access granted to contact@sns.id
- [ ] README has the live demo URL pinned at the top
- [ ] `SNSIP-AGENT.md` is in the repo root
- [ ] Live URL works (open in incognito and walk a stranger through it)
- [ ] Demo video is unlisted on YouTube (NOT private — judges need to view)
- [ ] Pitch deck PDF ≤ 5 MB
- [ ] All long-form descriptions are in English
- [ ] Region = Global on Colosseum
- [ ] Same project submitted on Colosseum AND Superteam Earn (NOT one or the other)
- [ ] Tweet-style announcement drafted (optional but nice for sponsor visibility)

## Optional: tweet draft

```
Built SNSIP-Agent for the @SNS_id Identity Track this week.

AI agents already move real money on Solana every block. None of them have a verifiable identity. SNSIP-Agent makes a `.sol` the verifiable, revocable identity for any agent — and Claude Desktop reads it natively via MCP.

5 agents live on devnet right now: snsip-cc5.pages.dev

GitHub: https://github.com/hien-p/snsip-agent
```
