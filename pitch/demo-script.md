# Demo Video Script — SNSIP-Agent (v7, honest cut)

**Target:** 2:00. English. Single take if possible.

**Voice:** I'm a builder showing the four things I made. Plain words. No "AI is the future" hype. No "we solved trust" overselling. Show, then say.

**The honest pitch in one line:**
> *"I built four things on `.sol`: a passwordless login, a sybil filter for airdrops, a visualizer for agent identities, and an MCP server so AI assistants can read it all."*

That's it. Don't claim more. The judges score Honesty + Practicality higher than Vision.

---

## 0:00 – 0:12 · The problem (12s)

**Visual:** snsip-cc5.pages.dev home page.

**Say:**
> If you sign in to a Solana app today, it asks for your wallet address — a string of 44 characters nobody can read. If you run an AI agent on Solana, it has no name, no rules attached, no audit trail. I think identity on Solana should look more like the rest of the internet — names, profiles, rules. So I built it on top of `.sol`.

---

## 0:12 – 0:32 · One — Sign in with .sol (20s)

**Visual:** Click *Start the tour* → `/login-demo`. Click chip `snsip-test-001.sol`. Click **Sign in**. Click **Sign challenge**. Phantom → Approve. Green welcome card.

**Say:**
> Number one — Sign in with `.sol`. I type my name. The app asks Solana who owns it. My wallet signs a short message. I'm in. No password, no email. Any Solana app could ship this in eight lines of code. That's the social identity story.

---

## 0:32 – 0:52 · Two — Sybil filter for airdrops (20s)

**Visual:** Click *Next →* → `/airdrop-demo`. Wait for 5 rows. Click **Claim airdrop** on row 1. Phantom → Approve.

**Say:**
> Number two — sybil resistance, which the bounty literally listed. Anyone can spawn fake wallets for free. Spawning real `.sol` names with records costs SOL and effort. So an airdrop that requires a `.sol` with identity records filters most fakes out. Bots in, bots filtered, real claimants pass. That's the use case.

---

## 0:52 – 1:15 · Three — Agent identity, visualized (23s)

**Visual:** Open `/graph/` — the constellation page. Show the owner + 5 satellite nodes. Click `swap-bot.sol` satellite → detail panel opens. Briefly switch to `/agents/?domain=swap-bot.sol` and show the Overview tab with permission JSON parsed.

**Say:**
> Number three — agent identities, on-chain. Every dot here is a real `.sol` agent registered on Solana devnet. Owner in the middle, agents around the rim. Each one publishes its signing key, its endpoint, the rules it operates under — what it can call, how much it can spend, until when. This is what an agent identity actually looks like on Solana. The graph is rendered from data any Solana RPC will serve. Anyone can reproduce it.

---

## 1:15 – 1:40 · Four — Claude reads it (25s)

> Pre-record this in Claude Desktop and stitch.

**Visual:** Claude Desktop, 🔌 *snsip-agent · 5 tools* visible.

**Type:**
```
What is swap-bot.sol allowed to do?
```

**Type:**
```
Try to swap 500 USDC.
```

Claude refuses.

**Say:**
> Number four — I built a small server that exposes this to AI assistants. Watch. Claude reads from Solana, tells me `swap-bot` is capped at 100 USDC a day on Jupiter. Now I tell Claude to spend 500. Claude refuses, in its own words. Same code works in Cursor and any other tool that speaks MCP. So if you're building agents on Solana and want LLMs to know about them, you don't have to write a custom integration for each one.

---

## 1:40 – 1:55 · What's roadmap, what's not (15s)

> This is the honesty beat — don't skip it. Founders who own gaps win.

**Visual:** Show README on github.com/hien-p/snsip-agent (or stay on Claude Desktop).

**Say:**
> A note on what's done versus what's next. The login, the sybil filter, the visualizer, and the MCP integration work today. The on-chain enforcement of agent rules — meaning a Solana program that checks the rules before any transfer — is sketched in the repo but not deployed. That's the next milestone. I'm shipping the spec, the toolkit, and the AI integration today. Adoption is what makes it complete.

---

## 1:55 – 2:00 · Close (5s)

**Visual:** Back to home, stats bar visible.

**Say:**
> Five agents live, open spec, open code, MIT licensed. snsip dot pages dot dev. Thanks.

**End card:** `snsip-cc5.pages.dev` · `github.com/hien-p/snsip-agent`

---

## Three sentences worth memorizing

If you go off-script, lean on these:

1. *"Identity on Solana should look more like the rest of the internet — names, profiles, rules."*
2. *"Real `.sol` names cost SOL to mint. Sybil farmers can fake wallets, not names."*
3. *"The on-chain enforcement is the next milestone — I'm shipping the spec, the toolkit, and the AI integration today."*

---

## If a judge asks the hard question

**Q: But what stops the agent from breaking the rules if it just signs the transaction itself?**

> Today the rule check runs in the app, the MCP server, and the SDK. Full on-chain enforcement requires a Solana program that wraps token transfers — I sketched that program in the repo, the byte format I'm using today already matches what it'll read. So today is the spec, the toolkit, and the AI integration. The enforcement program is the next milestone.

Don't dodge. The judges will respect this answer more than vague claims.

---

## Failsafes

| Problem | Fix |
|---|---|
| Stumble | Pause 2s, repeat sentence cleanly, cut bad take in post |
| Phantom hangs | Wait silently |
| Devnet RPC slow | Skip the graph detail panel (just show the constellation) |
| Claude Desktop missing 🔌 | Skip scene 4, point at /mcp page instead |
| Over 2:00 | Cut scene 5 (roadmap honesty). The four scenes stand on their own. |

---

## Pre-flight

```
[ ] Live URL loads in Incognito: snsip-cc5.pages.dev
[ ] Phantom on devnet, wallet 6AcSwib…uArjEt active
[ ] All routes pre-loaded: /, /login-demo, /airdrop-demo, /graph, /agents, /mcp
[ ] (MCP scene) Claude Desktop restarted, 🔌 5 tools visible
[ ] DnD on, mic levels checked, browser at 100% zoom
```

## Post-record

```
[ ] Trim to 2:00. Cut "uh"s.
[ ] Stitch MCP scene at 1:15.
[ ] 2-sec fade in/out.
[ ] One caption at scene 2: "10,000 fake wallets — but 10,000 fake .sol names cost real SOL"
[ ] One caption at scene 4: "Claude → SNSIP-Agent server → Solana"
[ ] Export 1080p MP4, ≤ 200 MB.
[ ] Upload to YouTube → title/description from pitch/youtube-meta.md.
[ ] Visibility: UNLISTED. Not private.
[ ] Verify in Incognito.
[ ] Paste URL into pitch/submission-text.md L100.
[ ] git add pitch/submission-text.md && git commit && git push.
```

Then follow `pitch/portal-walkthrough.md`.

---

## Why this cut is honest

What I dropped from the 3:00 v6:
- The reputation tab demo (speculative — no real reviewers)
- The validation tab demo (speculative — same)
- The handshake theater (cool but doesn't solve a real problem today)
- The MagicBlock latency comparison (interesting but tangential to identity)

What I kept (all four are real):
- Sign-in with `.sol` (works today, any Solana app)
- Sybil-resistant airdrop (the bounty's listed example — real signal)
- Agent identity graph (visual proof, hits two bounty bullets)
- MCP integration (the only novel piece — first on Solana)

Plus the roadmap-honesty beat that owns the enforcement gap.

Total runtime: 2:00. Tighter. More credible. Same judging-criteria coverage minus the parts that overclaim.
