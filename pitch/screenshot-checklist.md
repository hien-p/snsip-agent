# Screenshot Checklist — for the Deck + Submission Portals

You'll need to capture these yourself (my browser session died). Use **Cmd+Shift+5** on macOS for selection capture, or any clean screen recorder.

**Browser setup:**
- Window width: ~1280px (so the layout uses the centered 1080px max-width without horizontal scroll bars)
- Browser zoom: 100%
- Hide bookmarks bar (`Cmd+Shift+B`)
- Use Incognito to avoid extension chrome
- Save all into `pitch/screenshots/`

## The 8 shots that go in the deck (in order)

### 1. `01-home-hero.png` — Slide 1 hero
**URL:** `https://snsip-cc5.pages.dev/`
**Frame:** Top of page through the two CTA buttons
**Look for:** Big "Give your AI agent a .sol identity." + "See live agents →" / "Run the handshake demo" buttons + stats bar visible

### 2. `02-how-it-works.png` — Slide 3 (Solution)
**URL:** `https://snsip-cc5.pages.dev/`
**Frame:** Scroll to the "How it works" section showing 3 numbered cards
**Look for:** ① Register · ② Verify · ③ Permission, with green numbers in circles

### 3. `03-live-agents.png` — Slide 5 (proof on-chain)
**URL:** `https://snsip-cc5.pages.dev/`
**Frame:** "Live agents on devnet" section — 3 agent cards visible
**Look for:** Avatars + green "on-chain" badges + endpoint URLs

### 4. `04-handshake-validated.png` — Slide 5b (D4 money shot, REUSE existing)
**URL:** `https://snsip-cc5.pages.dev/playground/handshake/`
**Steps:** Click "Start handshake" 5 times until both agents show ✓ Validated badge, gauges at 3,500 each
**Frame:** Whole page

### 5. `05-verify-tampered.png` — Slide 5c (REUSE or recapture)
**URL:** `https://snsip-cc5.pages.dev/playground/verify/`
**Steps:** Type any domain → Generate demo key + sign → toggle Tamper ON → Verify
**Frame:** The form + the red ✗ Rejected panel together

### 6. `06-latency-side-by-side.png` — Slide 5d (MagicBlock)
**URL:** `https://snsip-cc5.pages.dev/playground/latency/`
**Steps:** Connect Phantom (devnet) → click Auto × 25 on L1 → wait → click Auto × 25 on ER
**Frame:** Both gauges with sparklines + p95/avg numbers visible

### 7. `07-agent-profile.png` — Slide 6 (records on-chain)
**URL:** `https://snsip-cc5.pages.dev/agents/?domain=swap-bot.sol`
**Frame:** Profile header + the 5 record cards (controller, signing-pubkey, endpoint, capabilities, avatar all populated)

### 8. `08-permission-editor.png` — Slide 6b (the ENSign port)
**URL:** Same as 7, click **Permissions** tab
**Frame:** Editor on left + live JSON preview on right + "active" green pill

## Bonus shots (nice-to-have)

- `09-agents-gallery.png` — `https://snsip-cc5.pages.dev/agents/` showing all 5 cards in the grid
- `10-create-wizard.png` — Connect wallet on `/`, click "Create agent subdomain" → step 2 (review screen) before submit

## Recording the demo video — frames to hit

If you're doing screen capture for the video instead of stills, hit these moments:

| Time | Action | Frame |
|---|---|---|
| 0:00 | Open `/` | hero + CTAs |
| 0:30 | Scroll to "Live agents on devnet" | 3 cards visible |
| 0:45 | Click "See all 5" → `/agents/` | full gallery |
| 1:00 | Click `swap-bot.sol` card | profile with 5 records |
| 1:15 | Click Permissions tab | live JSON preview |
| 1:30 | Top nav → Verifier | Generate demo key + sign + ✓ Verified |
| 1:50 | Toggle Tamper → ✗ Rejected | red panel |
| 2:05 | Top nav → Handshake | click Start 5×, end on ✓ Validated |
| 2:30 | Top nav → Latency | Auto × 25 on both clusters |
| 2:50 | Cut back to home | hero + closing line |

Total: ~3:00. Trim ruthlessly to 2:30.
