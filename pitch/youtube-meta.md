# YouTube Upload Metadata — Demo Video

Paste these straight into the YouTube upload form. **Set visibility to Unlisted** (NOT private — judges need to view without a Google account).

---

## Title (max 100 chars)

```
SNSIP-Agent — verifiable AI agent identity for .sol (Frontier Hackathon submission)
```

## Description (paste exactly)

```
SNSIP-Agent makes a .sol the verifiable, revocable identity for any AI agent on Solana. Signing key, endpoint, structured permissions, reputation — all on-chain in SNS records v2. And the first identity protocol on Solana that speaks Model Context Protocol natively, so Claude Desktop, Cursor, and any MCP-aware AI assistant reads it live, no custom integration.

In this 3-minute demo:
0:00  AI agents move millions on Solana every day. None of them have a verifiable identity.
0:15  Sign in with .sol — your name replaces email and password
0:35  Sybil-resistant airdrop — four-check identity gate
0:55  Permission-gated swap — agent refuses an over-cap call
1:20  Reputation + validations — weighted timeline, typed claims, forward-compatible memo schemas
1:45  Two-agent handshake — composable trust on Solana
2:00  MagicBlock Ephemeral Rollups — sub-50ms agent settlement
2:15  Claude Desktop reads .sol agent permissions natively via MCP — refuses 500 USDC because the cap is 100
2:50  Five agents live on devnet, 38 tests passing, every interaction byte-verifiable on Solana Explorer

Live demo:      https://snsip-cc5.pages.dev
GitHub repo:    https://github.com/hien-p/snsip-agent
Spec doc:       https://github.com/hien-p/snsip-agent/blob/main/SNSIP-AGENT.md
MCP install:    https://snsip-cc5.pages.dev/mcp
On-chain proof: https://github.com/hien-p/snsip-agent/blob/main/pitch/onchain-proof.md

Submission for the SNS Identity Track and Dune Frontier Data Sidetrack on the Frontier Hackathon (Colosseum + Superteam Earn, Solana Network State Spring '26).

Sponsors: SNS · Superteam Malaysia · MagicBlock · Dune

Built in 8 days. Open standard. MIT-licensed.

#Solana #SNS #MCP #AIagents #Frontier2026 #SuperteamEarn
```

## Tags (paste in YouTube tag field, comma-separated)

```
solana, sns, snsip-agent, mcp, model context protocol, ai agents, claude desktop, cursor, frontier hackathon, colosseum, superteam earn, magicblock, dune sim, identity, ed25519, records v2, sybil resistance, anchor, hackathon 2026
```

## Thumbnail suggestion

Take a still from the video at the **MCP refusal scene** (~2:25): Claude Desktop showing the response *"I can't — its on-chain permission caps spending at 100 USDC per day"* with a lime overlay reading **"SNSIP-Agent · the moment Claude refuses an over-cap swap."**

If you don't have time to design a thumbnail, YouTube's auto-generated frame from that timestamp is fine — pick the frame that shows the red refusal text most clearly.

## Playlist / Category

- **Category:** Science & Technology
- **Playlist:** None needed (one-off submission video)
- **Recording date / Location:** leave blank
- **Captions:** auto-generated is fine for unlisted; the spoken voiceover is clear English

## After upload

1. Copy the unlisted YouTube URL (looks like `https://www.youtube.com/watch?v=XXXXXXXXXXX`).
2. Paste it into `pitch/submission-text.md` line 100 (`## Demo video URL` block).
3. `git add pitch/submission-text.md && git commit -m "Wire demo video URL" && git push`
4. Confirm the link opens in an incognito browser without a sign-in prompt.
