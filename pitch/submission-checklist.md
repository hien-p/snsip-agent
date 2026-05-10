# Submission Checklist — SNS Identity Track (Frontier — Colosseum)

**Sponsor:** SNS · **Track:** Identity · **Region:** Global · **Deadline:** 2026-05-12

---

## Hard requirements (from the listing)

- [ ] **Public GitHub repo** — code, README, spec
  - If private: grant read access to `contact@sns.id`
  - Recommendation: keep public; better signal for Innovation/Founder Potential
- [ ] **Submission on Colosseum platform**
  - Register, select **Global**
  - Submit project to Frontier hackathon entry, select **Global**
- [ ] **Submission on Superteam Earn** for the SNS Identity Track listing
- [ ] **All content in English**
- [ ] **Identity-track explanation** in the project description (1–2 paragraphs covering Agent Identity theme)

---

## What we're submitting

| Asset | Path | Status |
|---|---|---|
| Live demo URL | (Cloudflare Workers) | ⏳ deploy on D5 |
| GitHub repo URL | (push public) | ⏳ |
| README | `README.md` | ✅ done |
| Spec | `SNSIP-AGENT.md` | ✅ done |
| Pitch deck | `pitch/deck.pdf` | ⏳ build from `pitch/deck-outline.md` |
| Demo video | unlisted YouTube link | ⏳ record per `pitch/demo-script.md` |
| Architecture diagram | embed in README | ⏳ export PNG from PLAN.md |
| Devnet program IDs | README + Anchor.toml | ⏳ after `anchor keys sync` + deploy |

---

## Order of operations on D6

1. **Final repo polish (60 min)**
   - [ ] Top of README: live demo URL, video URL, deck URL
   - [ ] Architecture diagram embedded as PNG (export from the ASCII in PLAN.md → diagrams.net or excalidraw)
   - [ ] "How to run locally" section verified end-to-end on a clean clone
   - [ ] Devnet program IDs filled in
   - [ ] License confirmed (MIT)
   - [ ] Confirm `contact@sns.id` access if repo is private

2. **Deck (90 min)**
   - [ ] Build slides from `pitch/deck-outline.md`
   - [ ] Export `pitch/deck.pdf`, commit
   - [ ] Spot-check on one external display

3. **Video (90–120 min — most-cuttable scope)**
   - [ ] Pre-prep per `pitch/demo-script.md` checklist
   - [ ] Take 1 (full run)
   - [ ] Take 2 (cleanup)
   - [ ] Edit if needed; aim for 2:30–3:00
   - [ ] Upload to YouTube unlisted, copy link

4. **Submission portals (30 min)**
   - [ ] Colosseum platform: register, fill project info, attach repo + video URLs
   - [ ] Frontier hackathon entry: same metadata, **Global** track
   - [ ] Superteam Earn: SNS Identity Track listing — paste repo URL + video link
   - [ ] Take screenshots of each successful submission

5. **Buffer (60 min)**
   - For when the video re-records, the deck has typos, devnet flakes mid-record, or the deploy fails. Always something.

---

## Self-rubric vs the judging criteria

Score each 1–5; aim for ≥4 on every row before submitting.

- [ ] **Innovation** — first SNS-native agent ID standard; counter-narrative to Molt.id
- [ ] **Technical Merit** — 4 programs + SDK + 32 tests + Ed25519 sysvar pattern
- [ ] **Practicality** — clear unblocking value for the Solana agent ecosystem
- [ ] **Completeness** — full E2E flow demonstrable on a deployed URL
- [ ] **User Experience** — 4 interactive playgrounds, not CLI logs
- [ ] **Founder Potential** — spec + reference impl + SDK; standards-track narrative
- [ ] **Demo & Submission Quality** — 2:30 video, deck, deployed URL, spec PDF

---

## Things that will sink the submission (don't do)

- ❌ Private repo without `contact@sns.id` access granted
- ❌ Closed-source SDK
- ❌ Region not set to **Global** on Colosseum
- ❌ Submitting on only Colosseum or only Superteam Earn (must do both)
- ❌ Demo video > 5 minutes
- ❌ No live demo URL
- ❌ Hardcoded mainnet program IDs that don't match deployed ones
- ❌ Mocking the `.sol` write flow (records actually need to be set on devnet)
- ❌ Broken `pnpm install` from a clean clone
