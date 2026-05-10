# Deck Content — Paste-ready (Pitch.com / Figma / Keynote)

Each slide below is one frame. Copy each block into a new slide, swap fonts/colors per `pitch/deck-outline.md`. Embedded screenshots from `pitch/screenshots/` are referenced by filename.

---

## Slide 1 — Hook

> # SNSIP-Agent
> ## Verifiable, revocable identity for every AI agent on Solana.
>
> Readable natively by Claude Desktop, Cursor, and any MCP-aware AI assistant.

**Visual:** dark background, lime accent dot, mono code key in the corner: `agent-registration[<registry>][<agentId>]`

---

## Slide 2 — The Problem

> # AI agents move millions on Solana every day.
> # None of them have a verifiable identity.

**Three-line problem:**

- Today every Solana agent is a raw keypair. No name. No scope. No audit trail.
- Anyone can spawn one. No one can stop one. Owners can't revoke without rotating keys.
- A counterparty dApp has no on-chain way to ask: *what is this agent allowed to do?*

**Footer line (small, lime):** "Identity is the missing primitive."

---

## Slide 3 — Solution

> # Six things, shipped in eight days.

**Two rows of three cards:**

1. **SNSIP-Agent draft spec**
   Records v2 keys, structured permission grant, six canonical memo schemas — all in one EIP-shaped doc.

2. **TypeScript SDK** (`@snsip/agent-sdk`)
   Cluster-aware records v2, Ed25519 sign/verify, permission gate logic, Dune SIM helpers. 38 unit tests.

3. **MCP server** (`@snsip/mcp`)
   Five tools any AI assistant can call. The killer integration. Single npm package.

4. **Web app** — guided 4-stop tour
   Sign-in → Sybil-resistant airdrop → Permission-gated swap → MCP install. Cloudflare Pages, 9 routes.

5. **5 live agents on Solana devnet**
   25 records v2 written. 9 sample interaction transactions, every byte verifiable on Explorer.

6. **MagicBlock ER integration**
   Sub-50ms agent-to-agent settlement. Critical for high-frequency agent ops.

**Caption (small):** "Open standard. MIT-licensed. One repo."

---

## Slide 4 — The Killer Demo (MCP)

**Visual:** screenshot or screen recording embed of Claude Desktop showing the MCP scene.

**Mono caption block (overlay):**

```
You:    What is swap-bot.sol allowed to do?
Claude: swap-bot.sol can call Jupiter Aggregator,
        spend up to 100 USDC per day,
        expires in 28 days.

You:    Try to swap 500 USDC.
Claude: I can't — its on-chain permission caps spending
        at 100 USDC per day.
```

**Footer:** "First agent identity protocol on Solana that speaks MCP natively. Claude refuses an over-cap swap *as Claude*, not as a form."

---

## Slide 5 — Architecture

**Diagram:**

```
   AI assistants (Claude Desktop / Cursor / Continue)
                       │  stdio · MCP
   ┌───────────────────▼───────────────────────┐
   │   @snsip/mcp — 5 tools wrapping the SDK   │
   └───────────────────┬───────────────────────┘
                       │
       ┌───────────────┼──────────────────┐
       ▼               ▼                  ▼
   Solana SDK     Solana devnet      Dune SIM
   (typed)        (records v2)       (live mainnet)
       │
       ▼
   apps/web (Next.js · Cloudflare Pages)
       └─ 4-stop tour: Login → Airdrop → Swap → MCP
```

**Footer:** "All open source. Devnet today. MIT licensed."

---

## Slide 6 — Three SNS bounty themes hit

> # Both bounty themes covered. Plus the listed sybil-resistance use case.

**Three rows:**

- **Social Identity** → `/login-demo`. Your `.sol` is your login. No password, no email, no OAuth.
- **Agent Identity** → `/swap-demo` + MCP. Permission-gated actions enforced by AI assistants.
- **Sybil resistance** → `/airdrop-demo`. Four-check identity gate. Sybil farmers can spawn 10k wallets. Not 10k `.sol` agents with valid records.

---

## Slide 7 — On-chain proof

> # Every claim verifiable on Solana Explorer.

- 5 real `.sol` agents on devnet (`snsip-test-001`, `swap-bot`, `monitor`, `auditor`, `arb-trader`)
- 25 SNS records v2 written
- 9 sample interaction transactions, one per memo schema (Login / Airdrop / Swap allowed / Swap rejected / Reputation positive / Reputation neutral / Validation audit / Validation capability / Handshake)
- All 9 byte-verified via public devnet RPC

**Footer (mono):** "pitch/onchain-proof.md ships every signature with an Explorer link."

---

## Slide 8 — Why this wins

- **Standard, not an app.** Spec + SDK + reference impl = ecosystem leverage, not a single product.
- **AI-assistant-native from day one.** Claude Desktop reads `.sol` agent identity *today* via MCP. No custom integrations.
- **Real cryptography end-to-end.** Ed25519 sign / verify, 32-byte pubkey validation, on-chain ownership check. Demonstrable in 30 seconds.
- **Bounty-aligned.** Hits both SNS Identity Track themes plus the sybil-resistance use case the listing cites.
- **Verifiable founder progress.** 38 unit tests. 9 on-chain sample transactions. 5 live agents. 9 routes deployed.

---

## Slide 9 — Roadmap

**Three columns, one per quarter:**

**Q3 2026**
- Formalize as an SNSIP via the SNS team's review process
- Deploy the Anchor `reputation-registry` and `validation-registry` programs (memo schemas already in production)
- Wallet integrations: Phantom + Backpack adapter SDK

**Q4 2026**
- First three production-grade agent operators on `.sol`
- Reputation indexer + public API
- Cursor / Continue MCP integrations as first-class

**2027**
- Agent monetization rails via x402
- Cross-chain agent identity bridge

---

## Slide 10 — Team + Ask

> # Team
> [your name(s)] · [one-line credibility]

> # What we want from SNS
>
> - **Adoption signal.** Review the draft SNSIP, surface for community feedback.
> - **Two intros.** Agent operators who would pilot the standard.
> - **Listing.** SNS partner directory once mainnet-ready.

> # Contact
> [email] · [twitter] · [github repo]

**Closing line, large lime italic:**
> *Identity is the missing primitive on Solana. We built it.*

---

## Production checklist

- [ ] Pitch.com or Figma project named `snsip-agent-pitch`
- [ ] Background `#0a0a0a`, text `#fafafa`, accent `#a8d946` (lime), muted `#737373`
- [ ] Inter (sans) + JetBrains Mono (code) + Georgia italic for accent line
- [ ] All 10 slides built, screenshots embedded where called for
- [ ] Export to PDF, save as `pitch/deck.pdf`
- [ ] Verify ≤ 5 MB, 16:9, layouts hold on dark mode
- [ ] Spot-check on second display
- [ ] Commit `pitch/deck.pdf`, link from README + submission-text.md
