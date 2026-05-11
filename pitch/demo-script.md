# Demo Video Script — SNSIP-Agent (v6, story mode)

**Target:** 3:00. English. Single take + the Claude Desktop scene stitched at 2:15.

**Voice:** I'm telling a story to a friend who's never used Solana. No jargon. Use real analogies (passport, credit card limit, business card). Show, then say. If a 12-year-old wouldn't follow, simplify.

**Infographic style if you have time:** lime-on-black motion captions, simple icons (passport, lock, check, X), arrows between objects, a character named "Alice" who walks through the scenes. If you don't have time for that — just record the screen, the script still works.

---

## 0:00 – 0:15 · The problem (15s)

**Visual:** snsip-cc5.pages.dev home. Optional infographic overlay: a wallet icon → a robot icon → a hacker icon stealing the wallet, big red X.

**Say:**
> Imagine you have an AI helper on Solana. It trades for you. It pays bills for you. Right now, that AI is just a private key — like a wallet with no name on it, no rules, no off switch. If someone steals the key, they own your AI. You can't stop them. I built something to fix this. Watch.

---

## 0:15 – 0:35 · Your `.sol` is your passport (20s)

**Visual:** Click *Start the tour* → `/login-demo`. Click chip `snsip-test-001.sol`. Click **Sign in**. Wait. Click **Sign challenge**. Phantom → Approve. Green welcome card.
**Optional infographic:** a passport icon with `.sol` name → Solana logo verifies it → wallet stamps a signature → door opens.

**Say:**
> Think of a `.sol` name like a passport. I own `snsip-test-001.sol` on Solana — anyone in the world can check that. So when an app wants to log me in, it asks Solana: who owns this name? Solana answers. Then my wallet signs a quick message — like a customs stamp — to prove it's really me. I'm in. No password. No email. My name on Solana is who I am.

---

## 0:35 – 0:55 · Keeping bots out of the airdrop (20s)

**Visual:** Click *Next →* → `/airdrop-demo`. 5 rows render with green checks. Click **Claim airdrop** on the first row. Phantom → Approve. Green badge.
**Optional infographic:** 10,000 fake wallets pour in from the left, hit a wall labeled "4 identity checks", only a few pass through.

**Say:**
> Free token airdrops have a problem: bad actors create thousands of fake wallets to claim more. I built an airdrop that filters them out. Watch — every claimant has to show four things: a name, a signing key, a public endpoint, a list of rules. Real agents have all four. Fake wallets have none. So real ones claim. Fakes get rejected. Sybil farming dies.

---

## 0:55 – 1:20 · Every agent has a credit limit (25s)

**Visual:** Click *Next →* → `/swap-demo`. Form is pre-filled — `swap-bot`, Jupiter, USDC, 25. Click chip `✗ over cap` (jumps to 500, red). Click `✓ within cap` (back to 25, green). Click **Execute on Solana**. Phantom → Approve.
**Optional infographic:** a credit card with limit "$100/day" on it. An amount "$500" gets stamped REJECTED. Amount "$25" gets stamped APPROVED.

**Say:**
> Every agent has rules — like a credit card has a daily limit. `swap-bot` here can spend up to a hundred USDC a day, only through Jupiter, only for the next month. What if I ask it to swap five hundred? The system checks the rule, sees five hundred is over the hundred-dollar cap, and refuses — before any money moves. Drop to twenty-five — allowed. Receipt written to Solana. The owner makes the rules. The agent can't break them.

---

## 1:20 – 1:45 · Reputation, like Uber ratings (25s)

**Visual:** `/agents/?domain=auditor.sol`. Click **Reputation** tab. 3 demo events visible. Click chip `✓ Honored 30-day expiry…`. Click **Submit on-chain**. Phantom → Approve. New event lands. Click **Validations** tab briefly.
**Optional infographic:** a 5-star rating + a verified-badge icon. Star ratings stack up next to an agent's name. A security-firm logo with a check mark next to it.

**Say:**
> How do you know which agents to trust? Reputation. Every time someone uses an agent, they can leave a review — thumbs up, neutral, thumbs down — and that review gets written to Solana. Like Uber ratings, but the reviews are on a blockchain, anyone can read them. Plus, real-world authorities can vouch for an agent: a security firm signs a statement saying "I audited this code, it's safe." That vouch lives on-chain too. So agents build a track record over time.

---

## 1:45 – 2:00 · Two agents shake hands (15s)

**Visual:** `/playground/handshake/`. Click **Start handshake**. Five rounds animate. Both ✓ Verified at the end.
**Optional infographic:** two robot characters meet, exchange business cards, each card has a signature seal. Five seals stamp the cards. A receipt drops onto a blockchain ledger.

**Say:**
> Two agents meet on Solana. Before they trade with each other, they verify identity — five rounds. Each round, one signs a random number with their secret key, the other checks it. Five clean rounds, both proven real. The result gets stamped on Solana. So if someone asks later — did these two really meet? — anyone can check.

---

## 2:00 – 2:15 · Faster with MagicBlock (15s)

**Visual:** `/playground/latency/`. Click **Auto × 25** on L1. Click **Auto × 25** on ER. Two histograms.
**Optional infographic:** a stopwatch. Regular Solana = ~1000ms. MagicBlock = <50ms. Twenty-times speedup arrow.

**Say:**
> AI agents move fast. Normal Solana takes about a second per transaction — too slow for real-time. So I plugged in MagicBlock, a special fast lane built on Solana. Under fifty milliseconds. Twenty times faster. That's the speed agents actually need.

---

## 2:15 – 2:50 · The moment: Claude reads the rules (35s)

> Pre-record this in Claude Desktop. Stitch in post.

**Visual:** Claude Desktop, 🔌 *snsip-agent · 5 tools* visible.
**Optional infographic:** Claude logo → arrow → Solana logo. Speech bubble from Claude with the answer.

**Type:**
```
What is swap-bot.sol allowed to do?
```

Claude reads from Solana, answers:
> *swap-bot.sol can call Jupiter, spend up to 100 USDC per day, expires in 28 days.*

**Type:**
```
Try to swap 500 USDC.
```

Claude refuses:
> *I can't — its on-chain rule caps spending at 100 USDC per day.*

**Say (over both prompts):**
> Last piece — and this is the part that matters most. I made it so AI assistants like Claude can read these agent rules directly. Watch. I ask Claude: what is `swap-bot` allowed to do? Claude reads the answer from Solana — one hundred USDC a day, Jupiter, expires in twenty-eight days. Now I tell Claude: try to swap five hundred. Claude refuses, in its own words: "I can't — the rule says max one hundred." That's the moment. The rules aren't a hidden doc. They live on Solana. Any AI assistant can see them. Any AI assistant can respect them.

---

## 2:50 – 3:00 · Close (10s)

**Visual:** Home page, stats bar visible.

**Say:**
> Five agents live on Solana right now. Open spec. Open code. If you're building AI agents on Solana, you can use this today. Thanks for watching.

**End card:** `snsip-cc5.pages.dev` · `github.com/hien-p/snsip-agent`

---

## Three anchor sentences

If you go off-script, lean on these:

1. *"Right now, every AI agent on Solana is just a private key — no name, no rules, no off switch."*
2. *"The owner makes the rules. The agent can't break them."*
3. *"The rules live on Solana. Any AI assistant can see them. Any AI assistant can respect them."*

---

## Honest answer if a judge asks "but what stops the agent from breaking the rule?"

Don't dodge:

> Today the rule check runs in the app, the AI assistant, and my SDK. Full enforcement directly inside Solana smart contracts is the next milestone — I sketched the program for it, and the rule format I'm using today already matches what that program will read. So today is the standard, the toolkit, and the AI integration. Adoption is what completes it.

Owning the gap is stronger than glossing over it.

---

## Infographic ideas if you have a designer / 2 extra hours

These are nice-to-have, not blocking:

- **Scene 1 (problem):** illustration of an AI bot's wallet getting stolen, red flash
- **Scene 2 (login):** passport icon next to `.sol` name, Solana logo verifies it
- **Scene 3 (airdrop):** funnel — many fake wallets in, identity gate, few real ones out
- **Scene 4 (rules):** credit card with "100 USDC/day" written on it; the number 500 hits a wall
- **Scene 5 (reputation):** five stars next to an agent's name, plus a "✓ audited by Security Firm X" badge
- **Scene 6 (handshake):** two stylized robots exchanging signed business cards
- **Scene 7 (speed):** stopwatch comparison, 1000ms vs 50ms
- **Scene 8 (Claude):** Claude logo + arrow + Solana logo + speech bubble with refusal text
- **Scene 9 (close):** the project logo over the stats bar

If you don't have a designer, just record clean screen captures. The script carries the story.

---

## Failsafes

| Problem | Fix |
|---|---|
| Stumble on a sentence | Pause 2 sec, repeat cleanly, cut bad take in post |
| Phantom popup hangs | Wait silently, edit dead air |
| Devnet slow | Skip Scene 7 (MagicBlock) entirely |
| Claude Desktop missing 🔌 | Use the 2:00 safe cut, skip the MCP scene |
| Over 3:00 | Cut Scene 7 first, then trim Scene 5 |

---

## Prep checklist

```
[ ] snsip-cc5.pages.dev opens in Incognito
[ ] Phantom on devnet, wallet 6AcSwib…uArjEt active (owns the demo agents)
[ ] All 8 tabs pre-loaded
[ ] (MCP scene) Claude Desktop restarted, 🔌 5 tools visible
[ ] DnD on (mac + phone), notifications muted
[ ] Loom or QuickTime ready, mic checked
[ ] Browser at 100% zoom, bookmark bar hidden
```

## Post-record

```
[ ] Trim to 3:00. Cut "uh"s.
[ ] Stitch MCP scene at 2:15.
[ ] 2-sec fade in/out.
[ ] One caption overlay at Scene 4:  "swap-bot cap: 100 USDC/day · requested: 500 · refused"
[ ] One caption at Scene 8:  "Claude → SNSIP-Agent server → Solana"
[ ] Export 1080p MP4, ≤ 200 MB.
[ ] Upload to YouTube → title + description from pitch/youtube-meta.md.
[ ] Visibility: UNLISTED, not Private.
[ ] Verify the URL opens in Incognito.
[ ] Paste URL into pitch/submission-text.md L100.
[ ] git add pitch/submission-text.md && git commit && git push.
```

Then follow `pitch/portal-walkthrough.md` for the 3-portal submission.

That's it. Go ship.
