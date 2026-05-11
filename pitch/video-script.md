# Video Script — SNSIP-Agent demo

**Target length:** 3:00 (main cut) · **Backup cuts:** 0:90 (X clip) · 0:30 (teaser)
**Format:** screen capture + voiceover. 1080p, MP4, ≤ 200 MB.
**Tone:** founder-first. Solana-native framing. Brutal clarity. No buzzwords.
**Recorder:** Loom or QuickTime → Incognito Chrome → unlisted YouTube.

> This file is paste-ready. Print it, or read it on a second screen while recording.

---

## A. MAIN CUT — 3:00

### Scene 1 · 0:00 – 0:15 · Hook

**Visual:** Open `https://snsip-cc5.pages.dev` in browser. Hero text visible: *"Give your AI agent a verifiable .sol identity."* Sit on the hero. Don't scroll.

**Voiceover:**
> AI agents already move real money on Solana every block. Every one of them today is a raw keypair — no name, no scope, no audit trail. Identity is the missing primitive on Solana. SNSIP-Agent fixes that.

**Tech callout (caption overlay if you have time):**
- 5 agents live on Solana devnet
- Open standard, MIT-licensed

---

### Scene 2 · 0:15 – 0:35 · Social Identity (Sign-in with .sol)

**Visual:** Click **"Start the tour"** card → lands on `/login-demo/`. Click chip `snsip-test-001.sol` → click **Sign in**. Wait for *"Ownership confirmed"*. Click **Sign challenge** → Phantom popup → Approve. Green *"Welcome back, snsip-test-001.sol"* card appears.

**Voiceover:**
> First — social identity. Your `.sol` is your login. The dApp asks SNS who owns this name on-chain. The wallet signs a one-time challenge. The user's profile — avatar, bio, endpoint — comes straight from records v2. No email, no password, no OAuth handshake.

**Tech callout:**
- `resolveDomainOwner(connection, "snsip-test-001.sol")` → wallet pubkey check
- `wallet.signMessage(challenge)` → Ed25519 signature, verified locally

---

### Scene 3 · 0:35 – 0:55 · Sybil-resistant airdrop

**Visual:** Click **Next →** at the bottom (TourFooter) → `/airdrop-demo/`. The 5-row table loads. Point at "5 of 5 agents pass identity gate". Click **Claim airdrop** on the first row. Phantom → Approve. Green `claimed · 5xpt…` badge appears with Explorer link.

**Voiceover:**
> Same identity primitive solves sybil. Every claimant runs four checks — signing key, endpoint, capability JSON, non-expired permission. Sybil farmers can spawn ten thousand wallets in an hour. Not ten thousand `.sol` agents with valid records. The gate is identity, not balance.

**Tech callout:**
- Four green chips per row → `signing-pubkey` ✓ `endpoint` ✓ `capability JSON` ✓ `non-expired` ✓
- Claim fires a real `MemoSq4gqA…cHr` transaction

---

### Scene 4 · 0:55 – 1:20 · Permission-gated swap

**Visual:** Click **Next →** → `/swap-demo/`. Pre-filled: `swap-bot.sol`, Jupiter, USDC, 25. Green verdict block. Click the chip `✗ over cap` — amount jumps to 500, verdict flips RED. Click `✓ within cap` — back to green. Click **Execute on Solana** → Phantom → Approve. Confirmation card with on-chain memo Explorer link appears.

**Voiceover:**
> Now agent identity. Every grant is scoped — only call X, only spend Y per period, only until Z. Five hundred USDC? The cap is one hundred. Gate refuses, with the four checks visible — active permission, target allowed, cap exists, amount within cap. Drop to twenty-five, sign, the gated action lands on Solana with a permanent receipt. Revoke means rewriting the parent record. The owner controls it.

**Tech callout:**
- Permission schema: `{ target, selector, spendCap, period, expiresAt }`
- Memo: `SNSIP-Swap v1 · agent=swap-bot.sol · gate=allowed · permission_label=swap-bot · t=<iso>`

---

### Scene 5 · 1:20 – 1:45 · Reputation + Validations

**Visual:** Open `/agents/?domain=auditor.sol`. Click **Reputation** tab. Point at 3 demo events with `w=8`, `w=5`, `w=6` weights. Click chip `✓ Honored 30-day expiry…` — rating + note auto-populate. Click **Submit on-chain** → Phantom → Approve. New event appears at top with green `on-chain` badge + Explorer link. Click **Validations** tab. Show 2 demo attestations (audit class purple, capability class lime).

**Voiceover:**
> Reputation isn't just numbers. Every event is a real Solana memo, signed by the validator's wallet. Rating, weight, timestamp — the format is forward-compatible with the registry program. Aggregated score is weighted by validator authority. Validations are typed — audit, KYC, capability, custom. Anchor registries are post-hackathon; the bytes today already match.

**Tech callout:**
- `SNSIP-Rep v2` schema published in `SNSIP-AGENT.md` Appendix A
- 9 sample on-chain transactions in `pitch/onchain-proof.md` — every byte verifiable on Explorer

---

### Scene 6 · 1:45 – 2:00 · Two-agent handshake

**Visual:** Open `/playground/handshake/`. Click **Start handshake**. Let the 5-round animation play (~10s). Final state: both agents ✓ Verified, trust gauges filled, validation memo signature appears below.

**Voiceover:**
> Two real agents resolve each other through SNS, exchange signed Ed25519 challenges, build reputation across five clean rounds. The final round stamps a validation record on Solana — anyone querying later can verify these two really did handshake. Composable agent-to-agent trust.

**Tech callout:**
- Both agents loaded from devnet records v2
- Final memo: `SNSIP-Handshake v1 · alice=… · bob=… · rounds=5 · all_verified=true`

---

### Scene 7 · 2:00 – 2:15 · MagicBlock latency

**Visual:** Open `/playground/latency/`. Click **Auto × 25** on L1 column (slow drip, ~600-1200ms each). Click **Auto × 25** on ER column (fast burst, sub-50ms each). Two histograms land side by side.

**Voiceover:**
> Agents transact constantly. L1 — about a second per tap. MagicBlock Ephemeral Rollups — sub-fifty milliseconds once the account is delegated. Real-time agent settlement at scale.

**Tech callout:**
- Same transaction signed against two RPC endpoints
- Latency measured wall-clock, browser-side

---

### Scene 8 · 2:15 – 2:50 · MCP — the killer scene (Claude Desktop)

> ⚠️ Pre-record this segment separately in Claude Desktop and stitch in post. Most fragile take of the whole video.

**Visual:** Claude Desktop window. Visible 🔌 indicator showing *"snsip-agent · 5 tools"* in input bar.

**Action 1 — type into Claude:**
```
What is swap-bot.sol allowed to do?
```

Claude calls `sns_check_permission` / `sns_resolve_identity` (tool-call indicator shows). Claude answers in plain English:
> *swap-bot.sol can call Jupiter Aggregator, spend up to 100 USDC per day, and the permission expires in 28 days.*

**Action 2 — type into Claude:**
```
Try to swap 500 USDC.
```

Claude calls `sns_check_permission` with amount=500000000. Gets `{ allowed: false, reason: "requested 500000000 > cap 100000000" }`. Refuses in plain English:
> *I can't — its on-chain permission caps spending at 100 USDC per day.*

**Voiceover (over both actions):**
> Here's why this matters. SNSIP isn't just a website — it's a Model Context Protocol server. Claude Desktop reads `.sol` agent permissions natively. Watch — five hundred USDC, the cap is one hundred. Claude refuses, *as Claude*, because the on-chain gate said no. No custom integration. Any AI assistant that speaks MCP — Cursor, Continue, anything — can do this today. First identity protocol on Solana that ships this.

**Tech callout:**
- MCP tool: `sns_check_permission` — input schema documented in `packages/snsip-mcp/README.md`
- Install: paste 12 lines into `~/Library/Application Support/Claude/claude_desktop_config.json`, restart

---

### Scene 9 · 2:50 – 3:00 · Close

**Visual:** Cut back to home tab. Pause on the stats bar: *"5 agents on-chain · 25 records · 38 tests passing · 1 draft SNSIP."*

**Voiceover:**
> Five agents on Solana devnet. Twenty-five records v2 written. Thirty-eight tests. One MCP server. Sign-in, airdrops, gated swaps, reputation — all live today. Open standard. MIT-licensed. The repo's in the description. Thanks.

**Final frame:** end card showing **snsip-cc5.pages.dev** in big serif italic, lime accent. Below: `github.com/hien-p/snsip-agent`.

**STOP RECORDING.**

---

## B. SAFE 2:00 CUT — drop if anything mid-record breaks

Same 8 scenes minus Scene 7 (latency) and Scene 5b (Validations tab). Compress Scene 8 (MCP) to a single prompt: just *"Try to swap 500 USDC as swap-bot.sol"* → Claude refuses. Keep total time to 2:00. The MCP refusal is non-negotiable — it's the strongest moment.

Order: Hook (12s) → Sign-in (18s) → Airdrop (20s) → Swap with refusal (25s) → Reputation (15s) → Handshake (15s) → MCP refusal (25s) → Close (10s) = 2:00.

---

## C. X CLIP — 0:30 teaser

**Visual:** Loop the over-cap refusal scene from the swap demo + the MCP refusal scene back-to-back.

**Voiceover:**
> Every AI agent on Solana today is a raw keypair. No name. No audit trail. No way to revoke. SNSIP-Agent fixes that — a `.sol` is the verifiable, revocable identity for any agent. Watch — `swap-bot.sol`'s permission caps spending at 100 USDC per day. Try 500. *[click execute]* Gate refuses on-chain, before the action lands. And Claude Desktop reads the same permission natively via MCP. Five agents live on devnet. snsip dot pages dot dev.

**Caption to post with the clip:**
> Every AI agent on Solana is a raw keypair. No name. No scope. No way for a dApp to know what it's allowed to do — or for an owner to revoke it.
>
> SNSIP-Agent makes a `.sol` the verifiable, revocable identity for any agent on Solana. On-chain permissions. Live MCP integration. Open standard.
>
> 5 agents live on devnet → snsip-cc5.pages.dev
> https://github.com/hien-p/snsip-agent

---

## D. RECORDER NOTES

**Words to absolutely keep in the cut (the soundbite):**
- *"Identity is the missing primitive on Solana."*
- *"Claude refuses, as Claude, because the on-chain gate said no."*
- *"Open standard. MIT-licensed. Live on devnet today."*

**Words you can cut if running long:**
- The bracketed technical callouts (those are for caption overlays, not narration)
- The MagicBlock latency narration (drop the whole scene first if needed)

**Stumble recovery:**
- Don't restart from 0:00. Pause 2 seconds. Repeat the sentence cleanly. Edit the bad take out in post.

**Honest framing (don't oversell):**
- If a judge asks *"but what stops the agent from acting outside its permission?"* — answer: *"Today, the gate runs in the dApp / MCP / SDK. Full on-chain enforcement via the Anchor verifier program is the Q3 roadmap. The byte formats today are forward-compatible with it."*
- Don't claim the Anchor programs are deployed. They're sketched, not deployed.

---

## E. POST-RECORD CHECKLIST

```
[ ] Trim to 3:00 ruthlessly. Cut "uh"s, repeated phrases.
[ ] (Main cut) Stitch the pre-recorded MCP scene at 2:15.
[ ] Add 2-sec fade-in at start, fade-out at end.
[ ] Add a single-line caption overlay during Scene 4 (the refusal):
    "swap-bot.sol cap: 100 USDC/day · requested: 500 USDC · denied on-chain"
[ ] Add a single-line caption during Scene 8 (MCP):
    "Claude Desktop → SNSIP-Agent MCP → Solana devnet"
[ ] Export 1080p MP4, ≤ 200 MB.
[ ] Upload to YouTube — title/description/tags from pitch/youtube-meta.md.
[ ] Visibility: UNLISTED. NOT private.
[ ] Verify link works in Incognito (no sign-in prompt).
[ ] Paste YouTube URL into pitch/submission-text.md line 100.
[ ] git add pitch/submission-text.md && git commit -m "Wire video URL" && git push.
```

Then follow `pitch/portal-walkthrough.md` for the 3-portal submission.

Go ship.
