# Video Script — SNSIP-Agent demo

**Target length:** 3:00 main cut · **Backup:** 2:00 if time pressure
**Format:** screen capture + voiceover. 1080p MP4, ≤ 200 MB.
**Tone:** I'm a builder explaining what I made and why. Plain words. Short sentences. Like I'm telling a friend.

> Read this on a second screen while recording. The narration is paste-ready — say it as written, or use your own words; the script just keeps the structure tight.

---

## Tone rules (read this once before recording)

1. **Say "I" not "we."** You built this. Own it.
2. **Plain words.** Say "private key" not "keypair." "Name" not "identity primitive." "Server" not "Model Context Protocol implementation."
3. **One idea per sentence.** When in doubt, cut.
4. **Show before claim.** Don't tell judges "this is innovative" — let them see the refusal and decide.
5. **Honest when it matters.** If the enforcement is in the app not on-chain (yet), say so — "the rules run in the app today, on-chain enforcement is the next step."
6. **No hype words.** "Killer," "revolutionary," "groundbreaking," "first in the world" — cut them all.

---

## MAIN CUT — 3:00

---

### Scene 1 · 0:00 – 0:15 · Hook

**Visual:** snsip-cc5.pages.dev home page. Hero text visible. Just sit on it.

**Say:**
> Every AI agent running on Solana today is just a private key. No name. No history. No rules. If it gets hacked, nobody can stop it. I built **SNSIP-Agent** to fix that — a name system for AI agents on Solana.

---

### Scene 2 · 0:15 – 0:35 · Your `.sol` is your login

**Visual:** Click *Start the tour* → `/login-demo/`. Click chip `snsip-test-001.sol`. Click **Sign in**. Wait for "Ownership confirmed". Click **Sign challenge**. Phantom popup → Approve. Green "Welcome back" card.

**Say:**
> Watch. I type my `.sol` name. The app asks Solana: who owns this name? My wallet signs a short message to prove I'm the owner. That's it — that's the login. No password, no email. Your name on Solana is who you are.

---

### Scene 3 · 0:35 – 0:55 · Sybil-resistant airdrop

**Visual:** Click *Next* → `/airdrop-demo/`. Wait for 5 rows. Point at "5 of 5 agents pass." Click **Claim airdrop** on the first row. Phantom → Approve. Green badge appears.

**Say:**
> Here's a simple use case — an airdrop. But it only goes to agents that have a real identity. A name. A signing key. An endpoint. A permission. Fake wallets are cheap — you can spawn ten thousand in an hour. Fake `.sol` names with full records? You can't fake those. So real agents claim. Fake ones get filtered out.

---

### Scene 4 · 0:55 – 1:20 · Every agent has rules

**Visual:** Click *Next* → `/swap-demo/`. Pre-filled `swap-bot.sol`, Jupiter, USDC, 25. Click chip `✗ over cap` (amount jumps to 500, red verdict). Click `✓ within cap` (back to 25, green). Click **Execute on Solana**. Phantom → Approve. Confirmation card.

**Say:**
> Every agent has rules. This one — `swap-bot` — can spend up to one hundred USDC a day, only through Jupiter, only for the next month. Watch: if I ask it to swap five hundred — the app refuses before any money moves. Cap is one hundred. Drop to twenty-five, it goes through and writes a receipt on Solana. The owner sets the rules. The agent can't break them.

> *(Brief honesty beat if you want it):* Today those rules run in the app. The next step is enforcing them directly in Solana smart contracts — the byte format is already ready for that.

---

### Scene 5 · 1:20 – 1:45 · Reputation + attestations

**Visual:** Open `/agents/?domain=auditor.sol`. Click **Reputation** tab. Point at the 3 demo events. Click chip `✓ Honored 30-day expiry…`. Click **Submit on-chain**. Phantom → Approve. New event lands. Click **Validations** tab briefly.

**Say:**
> Reputation. Every time someone reviews an agent — good, neutral, bad — the review gets written on Solana. Anyone can check it later. Same idea for attestations: a security firm or another agent can vouch for someone, and that vouch lives on-chain too. Audit, KYC, whatever class fits.

---

### Scene 6 · 1:45 – 2:00 · Two agents meet

**Visual:** `/playground/handshake/`. Click **Start handshake**. Let the 5 rounds play.

**Say:**
> Two agents meet. They check each other's identity five times. Both prove who they are by signing random numbers. After five clean rounds, the result gets stamped on Solana. So anyone — a third party, a dApp, a regulator — can come back later and verify: yes, these two really did handshake.

---

### Scene 7 · 2:00 – 2:15 · Faster with MagicBlock

**Visual:** `/playground/latency/`. Click **Auto × 25** on L1. Click **Auto × 25** on ER.

**Say:**
> Agents move fast, so I wired in MagicBlock. The left side is normal Solana — about a second per transaction. The right side is MagicBlock Ephemeral Rollups — under fifty milliseconds. That's the speed real-time agents need.

---

### Scene 8 · 2:15 – 2:50 · Claude reads it (the moment)

> Pre-record this in Claude Desktop, stitch in post.

**Visual:** Claude Desktop, 🔌 snsip-agent · 5 tools visible.

**Type into Claude:**
```
What is swap-bot.sol allowed to do?
```

Claude calls the tool, reads from Solana, answers:
> *swap-bot.sol can call Jupiter, spend up to 100 USDC per day, expires in 28 days.*

**Type:**
```
Try to swap 500 USDC.
```

Claude calls the tool again, gets a refusal, says:
> *I can't — its on-chain rule caps spending at 100 USDC per day.*

**Say (over both prompts):**
> Last piece. I built a small server so AI assistants — Claude, Cursor, anything similar — can read these agent identities directly. Watch. I ask Claude what `swap-bot` is allowed to do. Claude reads the answer from Solana — one hundred USDC a day, Jupiter, expires in twenty-eight days. Now I tell it to swap five hundred. Claude refuses, in its own words: "I can't, the on-chain rule says one hundred max." That's the difference. The agent's rules aren't a doc you read — they're something every AI assistant can see and respect.

---

### Scene 9 · 2:50 – 3:00 · Close

**Visual:** Back to home, stats bar visible.

**Say:**
> Five agents live on Solana devnet right now. Open spec. Open SDK. Open MCP server. If you're building agents on Solana, you can use this today. Thanks for watching.

**End card:** snsip-cc5.pages.dev / github.com/hien-p/snsip-agent

**STOP.**

---

## SAFE 2:00 CUT (use this if recording goes sideways)

Drop Scene 7 (MagicBlock) and Scene 5b (Validations tab). Compress Scene 8 to just the second prompt — "Try to swap 500 USDC" → Claude refuses. Keep everything else. Order:

```
0:00  Hook                10s
0:10  Sign-in             18s
0:28  Airdrop             18s
0:46  Swap refusal        22s   ← strongest moment
1:08  Reputation          15s
1:23  Handshake           15s
1:38  Claude refuses 500  20s   ← second-strongest moment
1:58  Close               2s
```

---

## 30-SECOND X CLIP

**Visual:** Just the two refusals back to back — swap demo's over-cap rejection + Claude Desktop's refusal.

**Say:**
> Every AI agent on Solana today is a private key. No rules. If it gets hacked, nobody can stop it. I made it so each agent has a `.sol` name with rules attached — like a driver's license. `swap-bot` is capped at one hundred USDC a day. Try five hundred — refused, on Solana, before money moves. And Claude Desktop reads the same rule directly. Five agents live on devnet. snsip-cc5.pages.dev.

**X caption to post with the clip:**
> Every AI agent on Solana is a private key with no rules.
>
> I built SNSIP-Agent — a `.sol` name + on-chain rules for each agent. Try to break a rule, system refuses before money moves. And Claude Desktop reads the same rule directly.
>
> 5 agents live on devnet → snsip-cc5.pages.dev
> https://github.com/hien-p/snsip-agent

---

## SOUNDBITES WORTH KEEPING

If you only remember three sentences from this script, these are the ones:

1. *"Every AI agent on Solana today is just a private key. No name. No history. No rules."*
2. *"The owner sets the rules. The agent can't break them."*
3. *"That's the difference — the agent's rules aren't a doc you read, they're something every AI assistant can see and respect."*

Those three lines carry the pitch. Everything else is support.

---

## IF SOMETHING BREAKS WHILE RECORDING

| Failure | What to do |
|---|---|
| Stumble on a word | Pause 2 seconds. Repeat that sentence cleanly. Edit out the bad take. Don't restart from 0:00. |
| Phantom popup hangs | Wait silently. Don't comment on the loading. Edit dead air out. |
| Devnet RPC slow | Skip Scene 7 (latency) entirely. Or skip the Live activity panel in Scene 5. |
| Claude Desktop doesn't show 🔌 | Restart Claude Desktop. If still missing → use the Safe 2:00 cut and stitch the MCP scene later (or skip it). |
| Going over time | Cut Scene 7 (MagicBlock) first. Then trim Scene 5 (drop Validations). |

---

## JUDGE Q&A — IF SOMEONE ASKS

**Q: But what stops the agent from breaking the rules if it just signs the transaction itself?**

> Honest answer: today the rules are enforced in the app, the MCP server, and the SDK. Direct on-chain enforcement is the next milestone — I sketched the Anchor program for it, and the byte format I'm using today already matches what that program will read. So today is the spec, the toolchain, and the AI integration. Adoption is what makes it complete.

**Q: Why is this better than just using a wallet address?**

> Wallet addresses can't carry rules. A `.sol` name can — signing key, endpoint, what programs it's allowed to call, how much it can spend, when the permission expires, who validated it. Plus the owner can revoke or update by rewriting the on-chain record.

**Q: How is this different from existing Solana identity projects?**

> Two things: structured permissions with expiry built in, and the MCP integration. Any AI assistant can read this today. No existing Solana identity project ships an MCP server.

---

## POST-RECORD CHECKLIST

```
[ ] Trim ruthlessly. Cut "uh"s and repeated phrases.
[ ] Stitch the pre-recorded MCP scene at 2:15 (main cut only).
[ ] 2-sec fade in at start, 2-sec fade out at end.
[ ] Add one caption overlay during Scene 4 (the refusal):
    "swap-bot.sol cap: 100 USDC/day · requested: 500 USDC · denied"
[ ] One caption during Scene 8 (Claude):
    "Claude Desktop → SNSIP-Agent MCP → Solana devnet"
[ ] Export 1080p MP4, ≤ 200 MB.
[ ] Upload to YouTube — title/description from pitch/youtube-meta.md.
[ ] Visibility: UNLISTED. Not private.
[ ] Verify link opens in Incognito (no Google sign-in).
[ ] Paste YouTube URL into pitch/submission-text.md L100.
[ ] git add pitch/submission-text.md && git commit -m "Wire video URL" && git push.
```

Then follow `pitch/portal-walkthrough.md` for the 3-portal submissions.

Done.
