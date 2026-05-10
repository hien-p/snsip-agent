# STATUS

**Project:** SNSIP-Agent — Verifiable AI agent identity for `.sol`
**Hackathon:** SNS Identity Track — Colosseum Frontier (dual: Dune Frontier Data Sidetrack)
**Deadline:** 2026-05-12 · **Today:** 2026-05-10 · **T-2**
**Live demo:** https://snsip-cc5.pages.dev
**Spec:** [`SNSIP-AGENT.md`](./SNSIP-AGENT.md)
**On-chain proof:** [`pitch/onchain-proof.md`](./pitch/onchain-proof.md) — 5 agents × 5 records + 9 sample interaction transactions, every signature verifiable on Solana Explorer.

This file is the entry point. Read top to bottom.

---

## TL;DR

A `.sol` becomes the verifiable, revocable identity for any AI agent on Solana. Signing key, endpoint, structured permissions, attestations, and avatar live in SNS records v2. We ship the spec, a TypeScript SDK, an MCP server (so Claude Desktop / Cursor read it natively), a guided 4-stop tour dApp on Cloudflare Pages, and 9 sample on-chain interaction transactions on devnet that judges can independently verify.

---

## What's done

| Layer | Path | Notes |
|---|---|---|
| Spec | `SNSIP-AGENT.md` | EIP-shaped. Records v2 keys + permission grant schema + memo schemas (Appendix A). |
| TypeScript SDK | `packages/agent-sdk/` | Cluster-aware records v2 read/write, Ed25519 sign/verify, structured permission JSON, Dune SIM helpers. **38 unit tests passing.** |
| MCP server | `packages/snsip-mcp/` | 5 tools: `sns_resolve_identity`, `sns_check_permission`, `sns_list_agents`, `sns_sign_in_with_sol`, `sns_agent_activity`. Stdio transport. README has Claude Desktop install. |
| Web app | `apps/web/` | Next.js 16 static export → Cloudflare Pages. 9 routes. Guided 4-stop tour. |
| Anchor programs (sketches) | `programs/` | Identity / Reputation / Validation / Verifier — source-complete, not deployed. Memo program acts as the forward-compatible registry-prototype today. |
| Devnet seeded | 5 agents | `snsip-test-001`, `swap-bot`, `monitor`, `auditor`, `arb-trader` — 5 records each, owner `6AcSwib…uArjEt`. |
| Sample on-chain transactions | 9 sigs | One per shape (Login / Airdrop / Swap allowed / Swap rejected / Rep positive / Rep neutral / Val audit / Val capability / Handshake). |

## Live routes (https://snsip-cc5.pages.dev)

```
/                       Home + tour entry card + stats bar + How it works
/agents/                Public gallery of 5 demo agents
/agents/?domain=<sol>   Per-agent profile (Overview / Permissions / Reputation / Validations)
/login-demo/            Step 1 — Sign in with .sol (Social Identity)
/airdrop-demo/          Step 2 — Sybil-resistant airdrop
/swap-demo/             Step 3 — Permission-gated action
/mcp/                   Step 4 — MCP install docs (the killer integration)
/playground/handshake/  Two-agent handshake theatre
/playground/latency/    L1 vs MagicBlock ER latency
```

## Bounty themes hit

- **Social Identity** → `/login-demo` (`.sol` is the universal Solana login)
- **Agent Identity** → `/swap-demo` + MCP integration (scoped, revocable permissions; AI assistants enforce them)
- **Sybil resistance** → `/airdrop-demo` (4-check identity gate before claim)
- **Reputation** → Reputation tab on each profile (weighted timeline + memo-as-registry-prototype, schema in `SNSIP-AGENT.md` Appendix A)
- **Validations** → Validations tab (typed claim classes, same memo-as-prototype pattern)

## Test inventory

- 38 SDK unit tests across 4 suites (`record-keys` / `permissions` / `reputation` / `verify`) — all green
- 9 on-chain integration tx samples on devnet — all byte-verified via public RPC
- Workspace typecheck clean across 3 packages (`agent-sdk`, `snsip-mcp`, `web`)

---

## What's still on the team

| Task | ETA |
|---|---|
| Get a Dune SIM API key from sim.dune.com (enables `sns_agent_activity` + Live activity panel) | 5 min |
| Wire SIM key into `apps/web/.env.local` and `claude_desktop_config.json` | 2 min |
| Build pitch deck PDF from `pitch/deck-content.md` | 60 min |
| Pre-record 35-second MCP scene in Claude Desktop | 20 min |
| Record main demo video (~3:00) per `pitch/demo-script.md` v4, stitch the MCP scene | 90 min |
| Make GitHub repo public OR grant `contact@sns.id` read access | 2 min |
| Submit on Colosseum (Global) → Frontier → SNS Identity Track | 10 min |
| Submit on Superteam Earn (SNS track) | 10 min |
| Dual-submit on Superteam Earn (Dune Frontier Data Sidetrack) using the Dune section in `submission-text.md` | 10 min |

Total ~3.5 hours of human-only work to ship.

---

## Submission package files

```
pitch/
├── submission-text.md         Paste-ready blocks for all 3 portals (SNS + Dune)
├── demo-script.md             v4 — 3:00 main video, MCP climax at 2:15
├── promo-script.md            30s + 60s X/LinkedIn cuts (Solana-native framing)
├── deck-content.md            Slide-by-slide copy for the pitch deck
├── deck-outline.md            Original deck structure (predates MCP — refer for layout, content from deck-content.md)
├── onchain-proof.md           5×5 records + 9 sample interaction sigs (verified)
├── screenshot-checklist.md    Stills to grab for the deck
├── submission-checklist.md    Day-of submission checklist
└── screenshots/               Stills from the live site
```

## Codebase top-level

```
sns_prj/
├── apps/web/                  Next.js dApp (live on Cloudflare Pages)
├── packages/agent-sdk/        @snsip/agent-sdk
├── packages/snsip-mcp/        @snsip/mcp
├── programs/                  Anchor sketches (Identity / Reputation / Validation / Verifier)
├── scripts/                   Devnet seed + sample-interaction scripts
├── tests/anchor/              Anchor program tests (skeleton)
├── pitch/                     Submission package
├── plans/                     Research reports + day-by-day plan
├── SNSIP-AGENT.md             The spec
├── README.md                  Project overview
└── STATUS.md                  This file
```
