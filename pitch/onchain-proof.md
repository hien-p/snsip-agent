# On-Chain Proof — SNSIP-Agent on Solana Devnet

**Verified live on devnet via direct JSON-RPC.** Anyone can reproduce by running:

```bash
curl -s -X POST https://api.devnet.solana.com \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getAccountInfo","params":["<sns-account>",{"encoding":"jsonParsed"}]}'
```

Or open the Solana Explorer link next to each domain.

**Owner wallet** (controls all 5 agents): `6AcSwibbv26kg7qAB28CXCAH2jSbSK39SeM5KuArjEt`
→ [view on Explorer](https://explorer.solana.com/address/6AcSwibbv26kg7qAB28CXCAH2jSbSK39SeM5KuArjEt?cluster=devnet)

**Network:** Solana Devnet
**SNS Name Program:** `namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX`
**SNS Records v2 Program:** `Ga872GkshNeNMDag7m1Bn54dN3NiHksfqnN2pH6A1H9F`

---

## 5 agents, 25 records v2 — all on-chain on devnet

### 1. `snsip-test-001.sol`

The original test agent.

- **SNS account:** [`FqMLPQxqJN85siWrz29jcfFZ6vNaCpKkxhkpkD79hMK8`](https://explorer.solana.com/address/FqMLPQxqJN85siWrz29jcfFZ6vNaCpKkxhkpkD79hMK8?cluster=devnet)
- **Profile:** [snsip-cc5.pages.dev/agents/?domain=snsip-test-001.sol](https://snsip-cc5.pages.dev/agents/?domain=snsip-test-001.sol)

| Record | Value |
|---|---|
| `agent.controller` | `6AcSwibbv26kg7qAB28CXCAH2jSbSK39SeM5KuArjEt` |
| `agent.signing-pubkey` | [`4X1aPuVQNmq5BJgFTtnmefr1P1qtd6pVu4Mie8zSTcb6`](https://explorer.solana.com/address/4X1aPuVQNmq5BJgFTtnmefr1P1qtd6pVu4Mie8zSTcb6?cluster=devnet) |
| `agent.endpoint` | https://snsip.dev/mcp |
| `agent.capabilities` | `data:application/json,{"v":1,...}` (calls Jupiter + SPL Token, 100 USDC/day cap, 30-day expiry) |
| `avatar` | https://avatars.githubusercontent.com/u/87125747 |

---

### 2. `swap-bot.sol`

Persona: Jupiter route-finder agent.

- **SNS account:** [`7CemPrfk2Si2NysdHwjRc538esKzqYH8Rwc9QLHQcXeu`](https://explorer.solana.com/address/7CemPrfk2Si2NysdHwjRc538esKzqYH8Rwc9QLHQcXeu?cluster=devnet)
- **Profile:** [snsip-cc5.pages.dev/agents/?domain=swap-bot.sol](https://snsip-cc5.pages.dev/agents/?domain=swap-bot.sol)

| Record | Value |
|---|---|
| `agent.controller` | `6AcSwibbv26kg7qAB28CXCAH2jSbSK39SeM5KuArjEt` |
| `agent.signing-pubkey` | [`91LKS7GUF3QvcskML6PtbbXY4tEMBN8GNEFTmv6SfFVt`](https://explorer.solana.com/address/91LKS7GUF3QvcskML6PtbbXY4tEMBN8GNEFTmv6SfFVt?cluster=devnet) |
| `agent.endpoint` | https://swap-bot.snsip.dev/mcp |
| `agent.capabilities` | structured permission JSON v=1 |
| `avatar` | dicebear identicon |

---

### 3. `monitor.sol`

Persona: on-chain observability agent.

- **SNS account:** [`2sE6NegEYutb8yXpkwTYGfvBLkBkEAGDkbaYMUhjwddn`](https://explorer.solana.com/address/2sE6NegEYutb8yXpkwTYGfvBLkBkEAGDkbaYMUhjwddn?cluster=devnet)
- **Profile:** [snsip-cc5.pages.dev/agents/?domain=monitor.sol](https://snsip-cc5.pages.dev/agents/?domain=monitor.sol)

| Record | Value |
|---|---|
| `agent.controller` | `6AcSwibbv26kg7qAB28CXCAH2jSbSK39SeM5KuArjEt` |
| `agent.signing-pubkey` | [`5UhfjdjPrV1p6PD35tXfQSGsiudPrGE9dyWW7SqqLaeq`](https://explorer.solana.com/address/5UhfjdjPrV1p6PD35tXfQSGsiudPrGE9dyWW7SqqLaeq?cluster=devnet) |
| `agent.endpoint` | https://monitor.snsip.dev/mcp |
| `agent.capabilities` | structured permission JSON v=1 |
| `avatar` | dicebear identicon |

---

### 4. `auditor.sol`

Persona: validation registry attestor.

- **SNS account:** [`HXHWmJJqMjLeQ7ekS6NUMXFNXvN2xCD4qvTGqruwUzp2`](https://explorer.solana.com/address/HXHWmJJqMjLeQ7ekS6NUMXFNXvN2xCD4qvTGqruwUzp2?cluster=devnet)
- **Profile:** [snsip-cc5.pages.dev/agents/?domain=auditor.sol](https://snsip-cc5.pages.dev/agents/?domain=auditor.sol)

| Record | Value |
|---|---|
| `agent.controller` | `6AcSwibbv26kg7qAB28CXCAH2jSbSK39SeM5KuArjEt` |
| `agent.signing-pubkey` | [`6zaNw1zv7wiQDVQvEBVyVtfzLt8ddjUYULUWc6xacSrY`](https://explorer.solana.com/address/6zaNw1zv7wiQDVQvEBVyVtfzLt8ddjUYULUWc6xacSrY?cluster=devnet) |
| `agent.endpoint` | https://auditor.snsip.dev/mcp |
| `agent.capabilities` | structured permission JSON v=1 |
| `avatar` | dicebear identicon |

---

### 5. `arb-trader.sol`

Persona: cross-DEX arbitrage agent.

- **SNS account:** [`3YkKASZqBKzdMikvYz3ZwUG5yKnVGo43GqZF3wY1qJW8`](https://explorer.solana.com/address/3YkKASZqBKzdMikvYz3ZwUG5yKnVGo43GqZF3wY1qJW8?cluster=devnet)
- **Profile:** [snsip-cc5.pages.dev/agents/?domain=arb-trader.sol](https://snsip-cc5.pages.dev/agents/?domain=arb-trader.sol)

| Record | Value |
|---|---|
| `agent.controller` | `6AcSwibbv26kg7qAB28CXCAH2jSbSK39SeM5KuArjEt` |
| `agent.signing-pubkey` | [`BRa6GBbFMsqgYsHgpFsJomzhj59KKQzJ5cwdGmLEJpHN`](https://explorer.solana.com/address/BRa6GBbFMsqgYsHgpFsJomzhj59KKQzJ5cwdGmLEJpHN?cluster=devnet) |
| `agent.endpoint` | https://arb.snsip.dev/mcp |
| `agent.capabilities` | `description: "Cross-DEX arbitrage"` + structured permission JSON v=1 |
| `avatar` | dicebear identicon |

---

## Reproducibility — anyone can build this

The exact scripts that produced this state are in the repo:

| Step | Script | What it does |
|---|---|---|
| 1. Wallet | `scripts/register-devnet-domain.cts` | Generates a fresh devnet keypair, airdrops SOL, wraps to wSOL, calls `devnet.bindings.registerDomainNameV2` to register a single `.sol` |
| 2. Records | `scripts/seed-many.cts` | For each persona: registers (idempotent — skips if exists), generates a fresh Ed25519 signing key, writes 5 records v2 (controller, signing-pubkey, endpoint, capabilities, avatar) using the `@bonfida/sns-records` low-level instructions with `CENTRAL_STATE_SNS_RECORDS_DEVNET` |

Both scripts use **HTTP-polling confirmation** (not WebSocket) because the public devnet RPC drops WS subscriptions mid-confirm. See `sendAndPollConfirm` in `scripts/seed-many.cts` for the workaround.

## Engineering notes that judges may appreciate

These quirks bit me during dev and are documented in the SDK + scripts:

1. **Bonfida `getAllDomains`** filters by mainnet `ROOT_DOMAIN_ACCOUNT` — it returns 0 for devnet domains. Patched in `packages/agent-sdk/src/resolve.ts:listOwnedDomains` to use the devnet root.

2. **`@bonfida/sns-records@0.1.0`'s `allocateAndPostRecord`** helper hardcodes the **mainnet** central state PDA. Direct calls to the underlying `allocateAndPostRecordInstruction.getInstruction(...)` with `CENTRAL_STATE_SNS_RECORDS_DEVNET` work fine. Same fix applied in `packages/agent-sdk/src/records.ts:writeRecordV2Ix` (cluster-aware via `isDevnet(connection)`).

3. **Bonfida's `createRecordV2Instruction`** wrapper validates the record key against a fixed `Record` enum — rejecting custom keys like `agent.signing-pubkey`. SNSIP-Agent uses the underlying primitives directly to bypass the enum check.

These three workarounds are what made the on-chain integration actually work on devnet. Without them, the gallery returns empty and writes fail. The SDK is published with these baked in.

## TL;DR

**Real domain accounts. Real records v2. Real Ed25519 keys. Real Solana devnet.** Five agents, 25 records, no mocks. Verifiable in 1 click via the Explorer URLs above.

---

## Sample on-chain interactions — 2026-05-09

Generated by `scripts/sample-onchain-interactions.cts`. Each row is a real Solana devnet transaction. Click the Explorer link to verify the Memo bytes.

Payer: `6AcSwibbv26kg7qAB28CXCAH2jSbSK39SeM5KuArjEt`

| Interaction | Tx signature | Explorer |
|---|---|---|
| Sign-in with .sol — challenge receipt | `5q734ioG…Qwb3FTbY` | [view](https://explorer.solana.com/tx/5q734ioGY5B3Y15VnutLCfYdLtBNXVo2oKfQ667kjPLurjXbmdYF4UgiKq3mPPopxMCqxUqWDppVXFWmQwb3FTbY?cluster=devnet) |
| Sybil-resistant airdrop claim | `5KtjMu6j…gPM4Ut9g` | [view](https://explorer.solana.com/tx/5KtjMu6jtcnsdZd3z9qg2XcNhmRr4LRM1LoGAoLznK5BGcUNBYp1wkDrt9tz5i3dc7Fgy7TQTV4s4ThsgPM4Ut9g?cluster=devnet) |
| Permission-gated swap (allowed) | `2zWUKfQR…ijqa4r85` | [view](https://explorer.solana.com/tx/2zWUKfQRzYfF9iTpdoKMejrWsUTEyuAPgyWTg5XBYrnj1v2NJ6bNhbiiaorj9ykYaFFKDe1o3fFZMg7Rijqa4r85?cluster=devnet) |
| Permission-gated swap (REJECTED — over cap) | `5xptGmV3…SUZRsiWb` | [view](https://explorer.solana.com/tx/5xptGmV3wGvaTtyivmX8Zf5AknLdd4KCCKGULGzpiLQMxjeKSGzggTYFV7U7h1uyVH7AGqVNjgcuV7SFSUZRsiWb?cluster=devnet) |
| Reputation event (positive, weighted) | `672V77Fu…igaZ7fbp` | [view](https://explorer.solana.com/tx/672V77Fuimv8YCmYKZREi36H6X4LsFr39AEWibqZ58LCB6faBj8fTfxX6Vxy173j26PL3J5fR3qUATrTigaZ7fbp?cluster=devnet) |
| Reputation event (neutral — gate fired) | `35tw66j2…PvhWLVzj` | [view](https://explorer.solana.com/tx/35tw66j2mxoiASzfpv2Yh2FGG24H9Us74iUrboxHkvtsN9ZXY5z4ZmSSgokLPCabyCwVAr7dafBTadpqPvhWLVzj?cluster=devnet) |
| Validation (audit class) | `2gTMLioz…HueF6VUk` | [view](https://explorer.solana.com/tx/2gTMLiozFzL4V3d1b3QgijCnNWYJNgD6D1oz9d8aLcRNWgDP9RcTsjocc5RfiqZ7sCwqLhrUpA85sAduHueF6VUk?cluster=devnet) |
| Validation (capability class) | `3qmQvKFh…KEmES3nL` | [view](https://explorer.solana.com/tx/3qmQvKFhrvVbJTcKso8nLbnUmHoDuNo9z1235tJ22vLAEgqDtf6berntSiy6ebX27vxhLMrYmqKXyp72KEmES3nL?cluster=devnet) |
| Two-agent handshake validation | `3KKKTZq7…96dPcCNd` | [view](https://explorer.solana.com/tx/3KKKTZq7KfSDBTYgsBesYYLtRikKXNkDmYxkmTH7BDvkj7s2FbuGRZj9P46rsk9td45BZVMik3AMjH5u96dPcCNd?cluster=devnet) |

### Memo payloads (canonical SNSIP byte format)

**Sign-in with .sol — challenge receipt**
```
SNSIP-Login v1 · domain=swap-bot.sol · wallet=6AcSwibbv26kg7qAB28CXCAH2jSbSK39SeM5KuArjEt · t=2026-05-09T04:28:00.471Z
```
Tx: [5q734ioGY5B3Y15VnutLCfYdLtBNXVo2oKfQ667kjPLurjXbmdYF4UgiKq3mPPopxMCqxUqWDppVXFWmQwb3FTbY](https://explorer.solana.com/tx/5q734ioGY5B3Y15VnutLCfYdLtBNXVo2oKfQ667kjPLurjXbmdYF4UgiKq3mPPopxMCqxUqWDppVXFWmQwb3FTbY?cluster=devnet)

**Sybil-resistant airdrop claim**
```
SNSIP-Airdrop v1 · agent=swap-bot.sol · claimer=6AcSwibbv26kg7qAB28CXCAH2jSbSK39SeM5KuArjEt · checks_passed=signing_key,endpoint,permission,not_expired · t=2026-05-09T04:28:00.471Z
```
Tx: [5KtjMu6jtcnsdZd3z9qg2XcNhmRr4LRM1LoGAoLznK5BGcUNBYp1wkDrt9tz5i3dc7Fgy7TQTV4s4ThsgPM4Ut9g](https://explorer.solana.com/tx/5KtjMu6jtcnsdZd3z9qg2XcNhmRr4LRM1LoGAoLznK5BGcUNBYp1wkDrt9tz5i3dc7Fgy7TQTV4s4ThsgPM4Ut9g?cluster=devnet)

**Permission-gated swap (allowed)**
```
SNSIP-Swap v1 · agent=swap-bot.sol · target=JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 · mint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v · amount=25000000 · gate=allowed · permission_label=swap-bot · t=2026-05-09T04:28:00.471Z
```
Tx: [2zWUKfQRzYfF9iTpdoKMejrWsUTEyuAPgyWTg5XBYrnj1v2NJ6bNhbiiaorj9ykYaFFKDe1o3fFZMg7Rijqa4r85](https://explorer.solana.com/tx/2zWUKfQRzYfF9iTpdoKMejrWsUTEyuAPgyWTg5XBYrnj1v2NJ6bNhbiiaorj9ykYaFFKDe1o3fFZMg7Rijqa4r85?cluster=devnet)

**Permission-gated swap (REJECTED — over cap)**
```
SNSIP-Swap v1 · agent=swap-bot.sol · target=JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 · mint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v · amount=500000000 · gate=rejected · reason="amount_500000000>cap_100000000" · t=2026-05-09T04:28:00.471Z
```
Tx: [5xptGmV3wGvaTtyivmX8Zf5AknLdd4KCCKGULGzpiLQMxjeKSGzggTYFV7U7h1uyVH7AGqVNjgcuV7SFSUZRsiWb](https://explorer.solana.com/tx/5xptGmV3wGvaTtyivmX8Zf5AknLdd4KCCKGULGzpiLQMxjeKSGzggTYFV7U7h1uyVH7AGqVNjgcuV7SFSUZRsiWb?cluster=devnet)

**Reputation event (positive, weighted)**
```
SNSIP-Rep v2 · agent=swap-bot.sol · validator=6AcSwibbv26kg7qAB28CXCAH2jSbSK39SeM5KuArjEt · rating=positive · weight=1 · note="Completed Jupiter route within posted spend cap. Latency p95 = 412 ms." · t=2026-05-09T04:28:00.471Z
```
Tx: [672V77Fuimv8YCmYKZREi36H6X4LsFr39AEWibqZ58LCB6faBj8fTfxX6Vxy173j26PL3J5fR3qUATrTigaZ7fbp](https://explorer.solana.com/tx/672V77Fuimv8YCmYKZREi36H6X4LsFr39AEWibqZ58LCB6faBj8fTfxX6Vxy173j26PL3J5fR3qUATrTigaZ7fbp?cluster=devnet)

**Reputation event (neutral — gate fired)**
```
SNSIP-Rep v2 · agent=auditor.sol · validator=6AcSwibbv26kg7qAB28CXCAH2jSbSK39SeM5KuArjEt · rating=neutral · weight=1 · note="Refused 312 USDC swap (cap 100). Gate fired correctly." · t=2026-05-09T04:28:00.471Z
```
Tx: [35tw66j2mxoiASzfpv2Yh2FGG24H9Us74iUrboxHkvtsN9ZXY5z4ZmSSgokLPCabyCwVAr7dafBTadpqPvhWLVzj](https://explorer.solana.com/tx/35tw66j2mxoiASzfpv2Yh2FGG24H9Us74iUrboxHkvtsN9ZXY5z4ZmSSgokLPCabyCwVAr7dafBTadpqPvhWLVzj?cluster=devnet)

**Validation (audit class)**
```
SNSIP-Val v2 · agent=auditor.sol · attestor=6AcSwibbv26kg7qAB28CXCAH2jSbSK39SeM5KuArjEt · class=audit · claim="Audited the Anchor program. No reentrancy. agent.signing-pubkey matches agent.controller." · t=2026-05-09T04:28:00.471Z
```
Tx: [2gTMLiozFzL4V3d1b3QgijCnNWYJNgD6D1oz9d8aLcRNWgDP9RcTsjocc5RfiqZ7sCwqLhrUpA85sAduHueF6VUk](https://explorer.solana.com/tx/2gTMLiozFzL4V3d1b3QgijCnNWYJNgD6D1oz9d8aLcRNWgDP9RcTsjocc5RfiqZ7sCwqLhrUpA85sAduHueF6VUk?cluster=devnet)

**Validation (capability class)**
```
SNSIP-Val v2 · agent=swap-bot.sol · attestor=6AcSwibbv26kg7qAB28CXCAH2jSbSK39SeM5KuArjEt · class=capability · claim="Permission grant well-formed. Spend cap within sane bounds. Endpoint serves valid Ed25519." · t=2026-05-09T04:28:00.471Z
```
Tx: [3qmQvKFhrvVbJTcKso8nLbnUmHoDuNo9z1235tJ22vLAEgqDtf6berntSiy6ebX27vxhLMrYmqKXyp72KEmES3nL](https://explorer.solana.com/tx/3qmQvKFhrvVbJTcKso8nLbnUmHoDuNo9z1235tJ22vLAEgqDtf6berntSiy6ebX27vxhLMrYmqKXyp72KEmES3nL?cluster=devnet)

**Two-agent handshake validation**
```
SNSIP-Handshake v1 · alice=snsip-test-001.sol · bob=swap-bot.sol · rounds=5 · all_verified=true · t=2026-05-09T04:28:00.471Z
```
Tx: [3KKKTZq7KfSDBTYgsBesYYLtRikKXNkDmYxkmTH7BDvkj7s2FbuGRZj9P46rsk9td45BZVMik3AMjH5u96dPcCNd](https://explorer.solana.com/tx/3KKKTZq7KfSDBTYgsBesYYLtRikKXNkDmYxkmTH7BDvkj7s2FbuGRZj9P46rsk9td45BZVMik3AMjH5u96dPcCNd?cluster=devnet)
