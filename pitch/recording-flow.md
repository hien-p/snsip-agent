# Recording Flow — Click-by-click for the demo video

One document. Read while recording. **Two cuts to choose from** based on what's wired:

- **Cut A — Full 3:00** (needs SIM key set + MCP scene pre-recorded in Claude Desktop)
- **Cut B — Safe 2:00** (web demo only, no SIM, no Claude Desktop scene — still hits all bounty themes)

If you're tired or short on time, Cut B is fine and still wins on completeness.

---

## Pre-flight — do these BEFORE pressing Record

```
[ ] macOS DnD on. Phone DnD on. Slack/Discord muted.
[ ] Phantom wallet on devnet, ≥ 0.5 SOL (you have 2.78 — fine)
[ ] Wallet that owns the demo .sol agents is the ACTIVE Phantom account
    (wallet 6AcSwib…uArjEt)
[ ] Browser at 100% zoom in Incognito (cmd+shift+N)
[ ] Recording app open: Loom OR QuickTime → New Screen Recording
[ ] Mic test — say "testing" and listen back. No peaking.
[ ] All 9 site routes loaded once in tabs so they cache:
      tab 1:  https://snsip-cc5.pages.dev/
      tab 2:  https://snsip-cc5.pages.dev/login-demo/
      tab 3:  https://snsip-cc5.pages.dev/airdrop-demo/
      tab 4:  https://snsip-cc5.pages.dev/swap-demo/
      tab 5:  https://snsip-cc5.pages.dev/agents/?domain=auditor.sol
      tab 6:  https://snsip-cc5.pages.dev/playground/handshake/
      tab 7:  https://snsip-cc5.pages.dev/playground/latency/
      tab 8:  https://snsip-cc5.pages.dev/mcp/
      tab 9:  https://snsip-cc5.pages.dev/deck            ← optional opener
[ ] (Cut A only) Claude Desktop open, snsip-agent server connected
    (look for 🔌 5 tools in the input bar)
[ ] Bookmark bar HIDDEN (cmd+shift+B)
```

---

## CUT A — Full 3:00 demo (recommended if everything's wired)

### 0:00 – 0:15 · Hook (15s)

**TAB:** snsip-cc5.pages.dev/ (home)

**ACTION:** Just sit on the hero. Don't scroll yet.

**SAY (with the hero filling the screen):**
> "AI agents already move real money on Solana every block. Every one of them today is a raw keypair — no name, no scope, no audit trail. Identity is the missing primitive. SNSIP-Agent fixes that."

---

### 0:15 – 0:35 · Step 1 — Sign in with .sol (20s)

**ACTION:** Click the **"Start the tour"** button on the home page → lands on `/login-demo/`.

**ACTION:** Click the chip `snsip-test-001.sol` (it fills the input).

**ACTION:** Click **Sign in** button → wait 1-2 seconds for the resolve.

**SAY (while waiting):**
> "First, social identity. The dApp asks SNS who owns this name on-chain — no email, no password."

**ACTION:** When "Ownership confirmed" appears → click **Sign challenge** → Phantom popup appears.

**ACTION:** Click **Approve** in Phantom.

**SAY (when the green "Welcome back" card appears):**
> "Wallet signs, dApp verifies the signature, profile loads from records v2. Eight lines for any Solana app to drop in."

---

### 0:35 – 0:55 · Step 2 — Sybil-resistant airdrop (20s)

**ACTION:** Click the **"Next →"** button at the bottom (TourFooter) → lands on `/airdrop-demo/`.

**ACTION:** Wait 2 seconds for the 5 rows to load. Point at "5 of 5 agents pass identity gate".

**SAY:**
> "Same identity primitive solves sybil. Every claimant runs four checks — signing key, endpoint, capability JSON, non-expired permission. Sybil farmers can spawn ten thousand wallets. Not ten thousand `.sol` agents with valid records."

**ACTION:** Click **Claim airdrop** on the FIRST row (`snsip-test-001.sol`). Phantom popup.

**ACTION:** Click **Approve**. Wait for the green `claimed · 5xpt…` badge to appear.

**SAY (while it confirms):**
> "Verified ones claim with one click."

---

### 0:55 – 1:20 · Step 3 — Permission-gated swap (25s)

**ACTION:** Click **Next →** at the bottom → `/swap-demo/`.

**ACTION:** The form should pre-fill (agent = `swap-bot.sol`, target = Jupiter, token = USDC, amount = 25). Point at the green verdict block.

**SAY:**
> "Now agent identity. Every grant is scoped — only call X, only spend Y per period, only until Z."

**ACTION:** Click the red chip **`✗ over cap`** in the Quick scenario row → amount jumps to 500 → verdict flips RED with the breakdown.

**SAY (while pointing at the red verdict):**
> "Five hundred USDC? The cap is one hundred. Gate refuses. Notice the four checks — active permission, target allowed, cap exists, amount within cap. Three green, one red, no shipment."

**ACTION:** Click chip **`✓ within cap`** → amount drops to 25 → verdict turns green.

**ACTION:** Click **Execute on Solana** → Phantom popup → Approve.

**SAY (when green confirmation card appears):**
> "Drop to twenty-five, sign, the gated action lands on Solana with a permanent receipt. Revoke means rewriting the parent record. The owner controls it."

---

### 1:20 – 1:45 · Reputation + Validations (25s)

**ACTION:** Open tab 5 (`/agents/?domain=auditor.sol`). Click the **Reputation** tab.

**ACTION:** Point at the 3 seeded events with their `w=8`, `w=5`, `w=6` weights.

**SAY:**
> "Reputation isn't just numbers. Every event is a real Solana memo, signed by the validator's wallet. The format is forward-compatible with the registry program — rating, weight, timestamp."

**ACTION:** Click the chip **`✓ Honored 30-day expiry…`** under "One-click examples" → both rating + note populate.

**ACTION:** Click **Submit on-chain** → Phantom → Approve → new event appears at top with the green `on-chain` tag.

**SAY (while it appears):**
> "Submit, wallet signs, lands on devnet. Aggregate score is weighted by validator authority."

**ACTION:** Click the **Validations** tab. Point briefly at the 2 demo attestations (audit class purple badge, capability class lime badge).

**SAY:**
> "Validations are typed — audit, KYC, capability, custom. The Anchor registries are post-hackathon roadmap; the bytes already match."

---

### 1:45 – 2:00 · Two-agent handshake (15s)

**ACTION:** Open tab 6 (`/playground/handshake/`). Click **Start handshake**.

**SAY (while the animation runs):**
> "Two real agents resolve each other through SNS, exchange signed challenges, build reputation. After five clean rounds, a validation record gets stamped on Solana."

**ACTION:** Let the 5 rounds play (~10 seconds). End-state shows both ✓ Validated.

**SAY:**
> "Composable agent-to-agent trust."

---

### 2:00 – 2:15 · MagicBlock latency (15s)

**ACTION:** Open tab 7 (`/playground/latency/`). Click **Auto × 25** on the L1 column.

**SAY (while the bars fill slowly):**
> "Agents transact constantly. L1 — about a second per tap."

**ACTION:** Click **Auto × 25** on the ER column. Bars fill instantly.

**SAY:**
> "MagicBlock Ephemeral Rollups — sub-fifty milliseconds once delegated. Real-time agent settlement."

---

### 2:15 – 2:50 · MCP — the killer scene (35s)

**OPTION 1:** You pre-recorded this. Stitch the pre-recorded clip in here during post.

**OPTION 2:** Live in the recording. Switch to Claude Desktop.

**ACTION:** In Claude Desktop, type:
```
What is swap-bot.sol allowed to do?
```

**ACTION:** Wait for the tool-call indicator. Claude returns the parsed permission in plain English.

**SAY (over Claude's response):**
> "Here's why this matters. SNSIP isn't just a website — it's an MCP server. Claude Desktop reads `.sol` agent permissions natively."

**ACTION:** Type:
```
Try to swap 500 USDC.
```

**ACTION:** Claude calls `sns_check_permission`, gets `allowed: false`, refuses with the reason.

**SAY (over the refusal):**
> "Five hundred USDC — Claude refuses, *as Claude*, because the on-chain cap is one hundred. No custom integration. Any AI assistant that speaks MCP can do this today. First identity protocol on Solana that ships this."

---

### 2:50 – 3:00 · Close (10s)

**ACTION:** Switch back to home tab. Pause on the stats bar.

**SAY:**
> "Five agents on-chain. Thirty-eight tests. One MCP server. Sign-in, airdrops, gated swaps, reputation — all live on devnet today. Open standard, MIT-licensed. Thanks."

**STOP RECORDING.**

---

## CUT B — Safe 2:00 (no SIM, no MCP scene, web-only)

Skip MCP if Claude Desktop isn't reliably showing the 🔌 5 tools indicator. The story still works without it — you just don't get the killer line.

### 0:00 – 0:12 · Hook (12s)

Same as Cut A 0:00.

### 0:12 – 0:30 · Sign in (18s)

Same as Cut A 0:15-0:35, but tighter.

### 0:30 – 0:50 · Airdrop (20s)

Same as Cut A 0:35-0:55.

### 0:50 – 1:15 · Swap with the gate refusal (25s)

Same as Cut A 0:55-1:20. **The over-cap refusal is your strongest moment in Cut B.** Emphasize it.

### 1:15 – 1:30 · Reputation tab (15s)

Same as Cut A 1:20-1:45, but skip the Validations tab and skip the user-submitted reputation event (just point at the 3 demo events).

### 1:30 – 1:45 · Handshake (15s)

Same as Cut A 1:45-2:00.

### 1:45 – 1:55 · MCP install page mention (10s)

**ACTION:** Open `/mcp/` page briefly. Don't try to live-demo it. Scroll past the install JSON.

**SAY:**
> "And anyone can install our MCP server to read these `.sol` agent permissions from Claude Desktop or Cursor — install in three steps, four tools — turning every AI assistant into a SNSIP-aware client."

### 1:55 – 2:00 · Close (5s)

**SAY (over home page hero):**
> "snsip dot pages dot dev. Five agents on devnet. Open standard. Thanks."

**STOP.**

---

## Failure plays (if something goes wrong mid-record)

| Failure | What to do |
|---|---|
| Phantom popup hangs > 5 sec | Pause narration, wait silently. Don't comment. Edit the dead air out in post. |
| Devnet RPC slow (Live activity panel stuck loading) | Skip the SIM scene entirely. Cut B doesn't need it. |
| You stumble on a sentence | Don't restart from 0:00. Pause 2 seconds, repeat the sentence cleanly. Edit the bad take in post. |
| "Sign in" returns "wallet doesn't own this domain" | You're on the wrong Phantom account. Switch to wallet `6AcSwib…uArjEt`. |
| Quick-scenario chips on swap don't update verdict | Refresh the page once. If still broken, just type 500 in the amount field manually. |
| Claude Desktop doesn't show the 5 tools | Restart Claude Desktop. If still missing → fall back to Cut B and stitch the MCP scene later (or skip it). |
| You go over time | The first thing to cut is the latency scene. Then the handshake. The Sign-in / Airdrop / Swap / MCP path is the spine. |

---

## After recording

```
[ ] Trim ruthlessly. Cut "uh"s. Edit each scene tight to its time budget.
[ ] (Cut A) Stitch the pre-recorded MCP scene at 2:15.
[ ] Add 2-second fade-in at start, fade-out at end.
[ ] Verify total length ≤ 3:00.
[ ] Export at 1080p, MP4, ≤ 200 MB.
[ ] Upload to YouTube — paste title/description/tags from pitch/youtube-meta.md.
[ ] Visibility: UNLISTED (not private).
[ ] Verify the link opens in an Incognito browser without sign-in prompt.
[ ] Paste the YouTube link into pitch/submission-text.md line 100.
[ ] git add pitch/submission-text.md && git commit -m "Wire video URL" && git push.
[ ] Follow pitch/portal-walkthrough.md for the 3 portal submissions.
```

---

## Bonus — the soundbite if you only have 30 seconds (X clip / Loom DM)

**TAB:** swap-demo at amount=500.

**SAY:**
> "Every AI agent on Solana today is a raw keypair. No name, no audit trail, no way to revoke. SNSIP-Agent fixes that — a `.sol` is the verifiable identity. Watch — `swap-bot.sol`'s permission caps spending at 100 USDC per day. Try 500" *(click execute)* "— gate refuses, on-chain, before the action lands. Claude Desktop reads the same permission natively via MCP. Five agents live on devnet. snsip dot pages dot dev."

Click execute, gate denies, end. Done in 25 seconds.
