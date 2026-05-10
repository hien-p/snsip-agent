# @snsip/mcp

**MCP server for SNSIP-Agent** — let any MCP-aware AI assistant (Claude Desktop, Cursor, Continue, Cline, etc.) read `.sol` agent identities and check their on-chain permissions.

This is the headline integration of the [SNSIP-Agent](https://snsip-cc5.pages.dev) project. The first agent identity protocol on Solana that speaks MCP natively — plug it into Claude Desktop and ask:

> *"What is `swap-bot.sol` allowed to do?"*

Claude calls `sns_check_permission`, parses the on-chain JSON, and answers in plain English. Ask it to swap 500 USDC and it refuses *as Claude* because the cap is 100. That's a verifiable, revocable agent identity, working through the standard agent protocol.

---

## Tools exposed

| Tool | Purpose |
|---|---|
| `sns_resolve_identity` | Pull every SNSIP record on a `.sol`: owner, signing pubkey, endpoint, controller, avatar, parsed permission grant. |
| `sns_check_permission` | Run the standard SNSIP gate against a proposed call — active? target whitelisted? amount within cap? Returns allow/deny with reason. |
| `sns_list_agents` | Every `.sol` owned by a wallet, plus which ones publish SNSIP identity records. |
| `sns_sign_in_with_sol` | Verify (a) wallet owns the domain on-chain AND (b) the Ed25519 signature over the challenge is valid. Drop-in passwordless login. |
| `sns_agent_activity` | Live mainnet activity (Dune SIM): 30-day tx count, last-seen, USD held, top tokens. Pass `domain` (resolves owner) or `walletOverride` (any mainnet pubkey). Requires `SIM_API_KEY`. |

Cluster defaults to **devnet** (where the demo agents live). Override with `SNSIP_CLUSTER=mainnet-beta` or `SNSIP_RPC=<url>`. SIM is mainnet-only — set `SIM_API_KEY` in env to enable `sns_agent_activity`.

---

## Install in Claude Desktop

1. Build the package:

   ```bash
   pnpm install
   pnpm --filter @snsip/mcp build
   ```

2. Open `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows). Easiest: in Claude Desktop go to **Settings → Developer → Edit Config**.

3. Add:

   ```json
   {
     "mcpServers": {
       "snsip-agent": {
         "command": "node",
         "args": ["/absolute/path/to/sns_prj/packages/snsip-mcp/dist/server.js"],
         "env": {
           "SNSIP_CLUSTER": "devnet",
           "SIM_API_KEY": "your-dune-sim-key-from-sim.dune.com (optional, enables sns_agent_activity)"
         }
       }
     }
   }
   ```

   Replace the path with your local checkout.

4. Restart Claude Desktop. You should see a 🔌 plug icon in the input bar showing **snsip-agent · 5 tools**.

---

## Demo prompts

Try these in Claude Desktop after install. Each one calls one of the five tools.

```
What is swap-bot.sol allowed to do?
```

```
List every .sol owned by 6AcSwibbv26kg7qAB28CXCAH2jSbSK39SeM5KuArjEt — only show ones with SNSIP identity.
```

```
Can swap-bot.sol call Jupiter (JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4) for 25 USDC?
```

```
Can swap-bot.sol call Jupiter for 500 USDC? (it should refuse)
```

```
Can swap-bot.sol call the System Program 11111111111111111111111111111111? (also refuse)
```

```
Show me 30-day activity for any active mainnet wallet (e.g. one of Jupiter's deployer keys)
```

```
Pull live SIM data for the wallet that owns swap-bot.sol — yes, SIM is mainnet-only, that's fine.
```

---

## Cursor / Continue / Cline

Any client that speaks the Model Context Protocol can use this server. Same `command` + `args` shape, just check your client's docs for where the config lives.

---

## Why this matters

The Frontier SNS Identity Track asks for "AI agents with distinct on-chain identities." This server is the one-line answer:

```
Any MCP-aware LLM client → SNSIP-MCP → devnet SNS records v2
```

A user can ask Claude Desktop *anything* about a `.sol` agent's identity, and Claude reads the answer from the same on-chain bytes any other dApp would. No central index, no API keys, no trust assumptions. The signing pubkey, the endpoint, the permission grant, the expiry — all enforced from the canonical record, all revocable by the parent `.sol` owner.

That's verifiable agent identity, not "trust the LLM."
