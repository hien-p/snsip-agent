# Pitch Deck Outline — SNSIP-Agent

**Format:** 10 slides. 16:9. Dark background, lime accent `#a8d946`. Mono font for code, sans for headings, Georgia italic for accent lines.
**Tone:** founder-first per Colosseum guidance. Brutal clarity, no buzzwords. Solana-native framing — no comparison frames to other ecosystems.

> Use `pitch/deck-content.md` for the actual paste-ready slide copy. This file is the structure / production guide.

---

## Slide 1 · Hook

**Headline:** SNSIP-Agent — verifiable, revocable identity for every AI agent on Solana
**Subhead:** Readable natively by Claude Desktop, Cursor, and any MCP-aware AI assistant.
**Visual:** Lime logo dot + the `agent-registration[<registry>][<agentId>]` record key in mono.

---

## Slide 2 · Problem

**Headline:** AI agents move millions on Solana every day. None of them have a verifiable identity.
**Body:** three problem lines (raw keypairs, no audit trail, no revocation, no on-chain "what is this allowed to do" answer).
**Footer:** "Identity is the missing primitive."

---

## Slide 3 · Solution

**Headline:** Six things, shipped in eight days.
**Body:** 2×3 card grid: Spec / SDK / MCP / Web app / 5 live agents / MagicBlock ER.

---

## Slide 4 · Killer Demo (MCP)

**Headline:** First agent identity protocol on Solana that speaks MCP natively.
**Body:** Claude Desktop screencap — over-cap swap refusal scene.
**Footer:** "Claude refuses an over-cap swap *as Claude*, not as a form."

---

## Slide 5 · Architecture

**Headline:** One repo. Three consumption patterns.
**Visual:** ASCII architecture: AI assistants → MCP → SDK → Solana / Dune SIM, plus the Cloudflare Pages dApp.

---

## Slide 6 · Bounty themes hit

**Headline:** Both SNS bounty themes covered. Plus sybil-resistance.
**Body:** Social Identity → /login-demo · Agent Identity → /swap-demo + MCP · Sybil resistance → /airdrop-demo.

---

## Slide 7 · On-chain proof

**Headline:** Every claim verifiable on Solana Explorer.
**Body:** 5 agents · 25 records · 9 sample interaction txs (one per memo schema), all byte-verified.

---

## Slide 8 · Why this wins

**Headline:** Five reasons.
- Standard, not an app
- AI-assistant-native from day one
- Real Ed25519 cryptography end-to-end
- Bounty-aligned (both themes + sybil)
- Verifiable founder progress (38 tests · 9 sample txs · 5 agents · 9 routes)

---

## Slide 9 · Roadmap

**Headline:** Three columns. Q3 / Q4 / 2027.
- Q3: Formalize SNSIP, deploy Anchor registries, Phantom/Backpack adapter
- Q4: First three production agent operators, reputation indexer + API, Cursor / Continue first-class
- 2027: x402 monetization, cross-chain agent identity bridge

---

## Slide 10 · Team + Ask

**Headline:** Team.
**Body:** Name(s), one-line credibility, ask (review the draft SNSIP, two agent-operator intros, partner directory listing), contact.
**Closing line, large lime italic:** *Identity is the missing primitive on Solana. We built it.*

---

## Build notes

- Background `#0a0a0a`, text `#fafafa`, accent lime `#a8d946`, muted `#737373`
- Inter Bold for headings, Inter Regular for body, JetBrains Mono for code, Georgia italic for the closing accent line
- Pre-record the MCP demo scene first (`pitch/promo-claude-scene.mp4`) — it slots into Slide 4 + the demo video
- Export at 1920×1080 PDF, ≤ 5 MB, save as `pitch/deck.pdf`
- Commit, link from `README.md` and `pitch/submission-text.md`
