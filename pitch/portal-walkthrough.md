# Portal Submission Walkthrough

Three portals, ~30 minutes total. Submit in this order. Every paste block lives in `pitch/submission-text.md` — this doc tells you exactly which block goes where.

---

## Before you start

- [ ] Repo public at https://github.com/hien-p/snsip-agent ✅ (already done)
- [ ] Live URL works in Incognito: https://snsip-cc5.pages.dev ✅ (already done)
- [ ] Demo video uploaded to YouTube **unlisted** — URL: `___________________________`
- [ ] Deck PDF exported to `pitch/deck.pdf` (or Pitch.com share link: `___________________________`)
- [ ] Team name + one-line credibility + email + Twitter handle ready

If any of the above isn't done, finish that first.

---

## Portal 1 — Colosseum (primary, required)

**URL:** https://www.colosseum.org → Frontier Hackathon → SNS Identity Track

### Steps

1. **Sign in** with the wallet you want associated with the submission (Phantom on mainnet is fine; the wallet is identity-only, no token cost).
2. **Register for Frontier Hackathon** if not already registered. **Region: Global** (NOT Malaysia, NOT Network State).
3. **Submit project** → SNS Identity Track.

### Fields to fill (in order they appear)

| Field | Source block in `submission-text.md` |
|---|---|
| Project name | L9-11 → `SNSIP-Agent` |
| Tagline | L13-17 |
| Subtitle / short description | L19-23 + L27-31 |
| Long description / About | L35-62 |
| Theme selector | **Agent Identity** (per L180) |
| "How does your project address identity?" | L186-196 |
| GitHub repo URL | L83-87 → `https://github.com/hien-p/snsip-agent` |
| Live demo URL | L91-95 → `https://snsip-cc5.pages.dev` |
| Demo video URL | The YouTube link you uploaded |
| Pitch deck (PDF upload or URL) | `pitch/deck.pdf` |
| Team / team members | L68-71 |
| Contact email | Your email |
| Skills used | L201 → `Blockchain, Frontend, Backend, Content` |
| Tags | L211 |

4. **Preview**, eyeball it once, then **Submit**.

---

## Portal 2 — Superteam Earn (SNS Identity Track listing)

**URL:** https://earn.superteam.fun → search "SNS Identity" → the bounty listing

### Steps

1. **Sign in** with email or wallet (same identity as Colosseum if possible — easier for sponsor cross-referencing).
2. Click **Apply** / **Submit** on the SNS Identity Track listing.

### Fields

| Field | Source block |
|---|---|
| Project name | `SNSIP-Agent` |
| Tagline | L13-17 |
| Description / About | L35-62 (the same long description) |
| Tweet link | (Optional — see L231-239 of `submission-text.md` for the draft, replace `[link]` with your repo URL) |
| GitHub link | `https://github.com/hien-p/snsip-agent` |
| Live demo | `https://snsip-cc5.pages.dev` |
| Video demo | YouTube link |
| Deck | Pitch.com link or upload PDF |
| Additional info / "How does your project address identity?" | L186-196 |
| Skills | `Blockchain, Frontend, Backend, Content` |
| Tags | L211 |

3. Hit **Submit**.

---

## Portal 3 — Superteam Earn (Dune Frontier Data Sidetrack)

**URL:** https://earn.superteam.fun → search "Dune Analytics" → "Frontier Data Sidetrack"

### Steps

1. Same Earn login.
2. Click **Apply** / **Submit** on the Dune sidetrack listing.

### What changes from Portal 2

The headline reframes to position **Dune SIM as the protagonist**. Use the dedicated Dune block in `pitch/submission-text.md`:

| Field | Source block |
|---|---|
| Project name | `SNSIP-Agent` (same) |
| Tagline | L117-119 → `Reputation for AI agents on Solana, sourced live from Dune SIM.` |
| Description / About | L123-142 (the Dune-track long description) |
| **"How does your project use SIM?"** (Dune-required field) | L146-156 |
| Live SIM demo instructions | L160-166 |
| GitHub link | Same repo URL |
| Live demo URL | Same |
| Video demo | Same YouTube link |
| Skills | `Backend` (the bounty page lists only Backend) |
| Tags | L211 |

3. Hit **Submit**.

---

## Confirmation checklist (after all 3 submissions)

- [ ] Colosseum: submission shows up in your project dashboard
- [ ] Superteam Earn SNS: green "Submitted" badge on the listing
- [ ] Superteam Earn Dune: same green badge on the Dune listing
- [ ] YouTube video opens in Incognito without a sign-in prompt
- [ ] All three portals link to the SAME GitHub URL (so judges can cross-reference)
- [ ] You've drafted the tweet (`pitch/submission-text.md` L229-239) and optionally fired it on X with the repo + live URL

---

## If something goes wrong

| Failure | Fix |
|---|---|
| Portal won't accept video URL | Verify YouTube visibility is **Unlisted**, not Private. Re-copy the URL from `youtu.be/SHORT_ID` format. |
| Repo "not accessible" error | Confirm it's public at https://github.com/hien-p/snsip-agent. If you decided to keep it private, grant read access to `contact@sns.id`. |
| Deck PDF too large (> 5 MB) | Compress via https://www.ilovepdf.com/compress_pdf or print again with "Save as PDF" at 1080p instead of 4K. |
| Theme dropdown shows only "Agent Identity" or only "Social Identity" | Pick Agent Identity (your strongest scene is the MCP refusal). Mention Social Identity coverage in the long description. |
| Region selector still defaults to "Malaysia" | Change to **Global**. The bounty was updated; the dropdown sometimes caches. |

---

## What submission day looks like (linear)

```
00:00  Open pitch/submission-text.md in one tab
00:01  Open Colosseum in a second tab
00:03  Sign in, register for Frontier if needed
00:05  Paste through Colosseum form (~10 min)
00:15  Submit → confirmation
00:16  Open Superteam Earn SNS listing
00:20  Paste (mostly the same content) → submit
00:25  Open Superteam Earn Dune sidetrack
00:28  Paste the Dune-specific block → submit
00:32  Fire the tweet
00:33  Refresh all 3 portals to confirm submissions logged
00:35  Done.
```

Then go to bed.
