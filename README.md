# SNSIP-Agent

**Verifiable AI agent identity for `.sol`** — a permission-scoped, revocable identity layer for AI agents on Solana, plus an MCP server so Claude Desktop, Cursor, and any MCP-aware assistant can read it natively.

> **Submission for the SNS Identity Track — Colosseum Frontier Hackathon**
> Sponsors: SNS · Superteam Malaysia · MagicBlock
> Dual-submitted to: Dune Frontier Data Sidetrack (Dune SIM integration)

**🌐 Live demo:** https://snsip-cc5.pages.dev
**📺 Demo video:** _record per `pitch/demo-script.md`_
**📜 Spec:** [`SNSIP-AGENT.md`](./SNSIP-AGENT.md)
**🔌 MCP install:** https://snsip-cc5.pages.dev/mcp

---

## The problem

AI agents already move real money on Solana every block. Every one of them today is a raw keypair — no name, no scope, no audit trail, no way for a counterparty dApp to know what the agent is allowed to do, no way for an owner to revoke it short of rotating keys. Identity is the missing primitive.

## What this ships

**A `.sol` becomes the verifiable, revocable identity for any AI agent on Solana.** The agent's signing key, endpoint, structured permissions, attestations, and avatar all live in SNS records v2. Anyone can verify them on-chain. The owner can rewrite or burn the parent `.sol` to revoke instantly.

| Layer | Path | What it does |
|---|---|---|
| Spec | `SNSIP-AGENT.md` | EIP-shaped draft. Defines the canonical record key shape and the permission grant schema. |
| TypeScript SDK | `packages/agent-sdk/` | Cluster-aware reads/writes for SNS records v2, Ed25519 sign/verify, structured permission JSON, Dune SIM helpers. **38 unit tests, all green.** |
| MCP server | `packages/snsip-mcp/` | Five tools any MCP-aware AI assistant can call: `sns_resolve_identity`, `sns_check_permission`, `sns_list_agents`, `sns_sign_in_with_sol`, `sns_agent_activity` (Dune SIM). |
| Web app | `apps/web/` | Static Next.js export deployed to Cloudflare Pages. Guided 4-stop tour: Sign-in → Airdrop → Swap → MCP. Plus public agent gallery, permission editor, weighted reputation, typed validations, two-agent handshake, L1-vs-ER latency theatre. |
| Anchor programs | `programs/` | Source-complete sketches for Identity / Reputation / Validation registries (post-hackathon deploy). The Memo program acts as the forward-compatible registry-prototype today. |

## On-chain proof

5 real `.sol` agents on devnet (`snsip-test-001`, `swap-bot`, `monitor`, `auditor`, `arb-trader`), 25 records v2 written, 9 sample interaction transactions ([Sign-in / Airdrop / Swap allowed / Swap rejected / Reputation positive / Reputation neutral / Validation audit / Validation capability / Handshake](./pitch/onchain-proof.md)). Every signature byte-verified on devnet via public RPC.

## Sample MCP demo

After installing the MCP server (see `packages/snsip-mcp/README.md`), in Claude Desktop:

```
You: What is swap-bot.sol allowed to do?
Claude (calls sns_check_permission): swap-bot.sol can call Jupiter Aggregator,
       spend up to 100 USDC per day, expires in 28 days.

You: Try to swap 500 USDC.
Claude (calls sns_check_permission with amountRaw=500000000):
       I can't — its on-chain permission caps spending at 100 USDC per day.
```

That refusal is the moment.

## Quick start

Prerequisites: Node ≥ 20, pnpm ≥ 10.

```bash
git clone <repo> sns_prj && cd sns_prj
pnpm install

# Run the dApp locally
pnpm --filter @snsip/web dev          # http://localhost:3000

# Build and run the MCP server
pnpm --filter @snsip/mcp build
node packages/snsip-mcp/dist/server.js   # listens on stdio
```

To wire the MCP server into Claude Desktop, see [`packages/snsip-mcp/README.md`](./packages/snsip-mcp/README.md).

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│   AI assistants (Claude Desktop / Cursor / Continue)            │
└────────────────┬────────────────────────────────────────────────┘
                 │ stdio · MCP
┌────────────────▼────────────────────────────────────────────────┐
│   @snsip/mcp — 5 tools wrapping the SDK                          │
└────────────────┬────────────────────────────────────────────────┘
                 │
   ┌─────────────┴─────────────┬──────────────────────┐
   ▼                           ▼                      ▼
@snsip/agent-sdk           Solana devnet          Dune SIM
(typed wrapper)            (records v2)           (live mainnet activity)
   │
   ▼
apps/web (Next.js static, Cloudflare Pages)
   ├─ /login-demo     Sign in with .sol
   ├─ /airdrop-demo   Sybil-resistant claim
   ├─ /swap-demo      Permission-gated action
   ├─ /agents         Public gallery + per-agent profile
   ├─ /mcp            MCP install docs
   └─ /playground/*   Handshake + Latency theatres
```

## Bounty themes covered

- **Social Identity** → `/login-demo`. `.sol` replaces email + password as universal Solana login.
- **Agent Identity** → `/swap-demo` + MCP. Permissions on-chain, scoped, revocable; AI assistants enforce them.
- **Sybil resistance** → `/airdrop-demo`. Claimants pass a four-check identity gate (signing key + endpoint + capability JSON + non-expired permission).

## Deploy

The dApp is a Next.js static export deployed to **Cloudflare Pages** at `https://snsip-cc5.pages.dev`. Manual:

```bash
pnpm --filter @snsip/web build      # → apps/web/out/
pnpm dlx wrangler pages deploy apps/web/out --project-name snsip
```

## License

MIT.
