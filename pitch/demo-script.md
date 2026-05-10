# Demo Video Script — SNSIP-Agent (v4)

**Target:** 3:00. English, single take preferred but the MCP scene at 2:15 may need to be pre-recorded in Claude Desktop and stitched.

**Recording setup:**
- 1280×800 browser window, Incognito (clean chrome).
- Phantom on devnet, wallet `6AcSwib…uArjEt` imported (owns the 5 demo agents).
- Tabs in order: `/`, `/login-demo/`, `/airdrop-demo/`, `/swap-demo/`, `/agents/?domain=auditor.sol`, `/playground/handshake/`, `/playground/latency/`, `/mcp/`.
- Pre-record: the MCP scene in Claude Desktop (most fragile — see 2:15 below).
- Backup: also pre-record the latency Auto×25 segment if devnet RPC flakes.

---

## 0:00 – 0:15 · Hook (15s)

**Visual:** Open `https://snsip-cc5.pages.dev`. Hero visible — "Give your AI agent a verifiable .sol identity."

**Voiceover:**
> "AI agents already move real money on Solana every block. Every one of them today is a raw keypair — no name, no scope, no audit trail. Identity is the missing primitive. SNSIP-Agent is the open standard that fixes it — and covers both themes the SNS track asked for: agent identity *and* social identity."

---

## 0:15 – 0:35 · Social Identity — Sign in with .sol (20s)

**Visual:** Click "Start the tour" CTA → lands on `/login-demo`. Click `snsip-test-001.sol` chip → **Sign in** → "Ownership confirmed" → **Sign challenge** → Phantom popup → green "Welcome back" card.

**Voiceover:**
> "First — social identity. No password, no email, no OAuth. The dApp asks SNS who owns the name, the wallet signs a one-time challenge, the user's avatar and bio come straight from records v2. Eight lines for any Solana app to drop in."

---

## 0:35 – 0:55 · Sybil-resistant airdrop (20s)

**Visual:** `Next →` ribbon to `/airdrop-demo`. 5 rows render. Point at "5 of 5 agents pass identity gate." Click 👍 chip + Submit on `swap-bot.sol` → Phantom signs → green claimed badge with Explorer link.

**Voiceover:**
> "Same identity primitive solves the sybil problem. Every claimant runs a four-check gate — owner, signing key, endpoint, structured permission. Sybil farmers can spawn ten thousand wallets but can't fake ten thousand `.sol` names with valid records. Verified ones claim with one click."

---

## 0:55 – 1:20 · Permission-gated swap (25s)

**Visual:** `Next →` to `/swap-demo`. Click `✗ over cap` quick-scenario → red rejection list shows. Click `✓ within cap` → green allowed. Click **Execute on Solana** → Phantom → confirmation card with Memo tx Explorer link.

**Voiceover:**
> "Now agent identity. Every grant is scoped — only call X, only spend Y per period, only until Z. Five hundred USDC? The cap is one hundred — gate refuses. Drop to twenty-five, sign, the gated action lands on Solana with a permanent on-chain receipt. Revoke means rewriting the parent record."

---

## 1:20 – 1:45 · Reputation + Validations (25s)

**Visual:** Open `/agents/?domain=auditor.sol`. Click **Reputation** tab. Three demo events visible with `w=8`, `w=5`, `w=6` weights. Click "Honored 30-day expiry…" example chip → 👍 selected, note populated → **Submit on-chain** → Phantom signs → new event lands at top tagged `on-chain`. Click **Validations** tab briefly. Pick "audit" class → click "Audited the Anchor program" chip → submit.

**Voiceover:**
> "Reputation and validations — the third pillar. Every event is a real Solana memo, signed by the validator's wallet. The format is forward-compatible with the registry program: rating, weight, timestamp on reputation; class, claim, attestor on validations. Aggregated score is weighted by validator authority. The Anchor registries are the post-hackathon roadmap; the bytes already match."

---

## 1:45 – 2:00 · Two-agent handshake (15s)

**Visual:** Open `/playground/handshake/`. Click "Start handshake" — five rounds animate; final round submits the on-chain validation memo automatically.

**Voiceover:**
> "Two real agents resolve each other through SNS, exchange signed challenges, build reputation. After five clean rounds, a validation record is stamped on Solana. Composable agent-to-agent trust."

---

## 2:00 – 2:15 · MagicBlock latency (15s)

**Visual:** Open `/playground/latency/`. Auto × 25 on L1 (slow drip). Auto × 25 on ER (fast burst). Two histograms render side by side.

**Voiceover:**
> "Agents transact constantly — so we wired MagicBlock Ephemeral Rollups directly into the SDK. L1: about a second. ER: sub-fifty milliseconds once delegated. Real-time agent settlement at scale."

---

## 2:15 – 2:50 · MCP — the killer scene (35s)

**Visual:** Pre-recorded segment in Claude Desktop. Show the 🔌 plug icon "snsip-agent · 5 tools" in the input bar.

Type: *"What is swap-bot.sol allowed to do?"*

Claude calls `sns_check_permission`, returns plain English: *"swap-bot.sol can call Jupiter Aggregator, spend up to 100 USDC per day, expires in 28 days."*

Type: *"Try to swap 500 USDC."*

Claude calls the tool, gets `{"allowed": false, "reason": "exceeds 100 USDC daily cap"}` — refuses **in its own voice**.

**Voiceover (over the pre-recorded segment):**
> "Here's the killer integration. SNSIP isn't just a website — it's an MCP server. Any AI assistant that speaks Model Context Protocol can read a `.sol` agent's permissions today. Claude Desktop, Cursor, anything. No custom integrations, no API translation layer. Watch — Claude reads the on-chain grant, answers in plain English, and refuses an over-cap swap *as Claude*, not as a form. This is the first agent identity protocol on Solana that speaks MCP natively."

---

## 2:50 – 3:00 · Close (10s)

**Visual:** Cut back to home page hero. Stats bar visible.

**Voiceover:**
> "Five agents on-chain. Twenty-five records v2. Thirty-eight tests. One draft SNSIP. One MCP server. Sign-in, airdrops, gated swaps, reputation, validations — all live on devnet today. The repo's in the description. Open standard, MIT-licensed. Thanks."

---

## Recording the MCP scene (separate prep)

This is the only segment that needs special setup. Do it FIRST before recording the main flow.

1. Build the MCP server: `pnpm install && pnpm --filter @snsip/mcp build`
2. Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "snsip-agent": {
         "command": "node",
         "args": ["/absolute/path/to/sns_prj/packages/snsip-mcp/dist/server.js"],
         "env": { "SNSIP_CLUSTER": "devnet" }
       }
     }
   }
   ```
3. Restart Claude Desktop. Confirm 🔌 icon shows "snsip-agent · 5 tools".
4. Record a clean 35-second segment of the two prompts above. Save as `pitch/mcp-scene.mp4`.
5. Stitch into the main video at the 2:15 mark.

If the MCP scene fails to record cleanly (devnet RPC slow, Phantom popup blocks the screen, etc.), fall back to a screenshot still + voiceover — judges still see the integration, just less viscerally.

---

## Failsafes

- Devnet drops mid-record: have `pitch/screenshots/` stills ready as 3-second fillers per scene.
- Phantom hangs: cancel and retry, or skip to next segment.
- Sign-in challenge fails: pre-record this segment separately (your wallet must own the demo .sol).
- Recording mistake past 0:30: cut from the next /route/ landing and stitch.

## Prep checklist

- [ ] Live URL loads cleanly in Incognito (snsip-cc5.pages.dev)
- [ ] Phantom on devnet, ~3+ SOL balance
- [ ] Wallet that owns the demo .sol domains
- [ ] All 5 agent cards visible on `/agents/`
- [ ] MCP server built and Claude Desktop wired up
- [ ] Loom/QuickTime tested, audio levels checked
- [ ] Browser zoom at 100%
- [ ] Tabs in the right order
- [ ] Phone on Do Not Disturb, macOS DnD on
- [ ] Mic gain set, no peaking

---

## Post-record

- Trim to 3:00 ruthlessly. Cut "uh"s and "like"s.
- Upload to YouTube **unlisted** (NOT private — judges need to view).
- Title: `SNSIP-Agent — verifiable AI agent identity for .sol`
- Description: paste the long description from `pitch/submission-text.md`.
- Add the YouTube link to `pitch/submission-text.md` field "Demo video URL".
- Submit on Colosseum (Global) → Frontier hackathon entry → Superteam Earn. All three.
