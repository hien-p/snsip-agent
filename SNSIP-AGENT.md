# SNSIP-Agent: Verifiable AI Agent Identity for `.sol`

| Field | Value |
|---|---|
| **SNSIP** | Agent (draft) |
| **Title** | Verifiable AI Agent Identity for `.sol` |
| **Author** | (to fill) |
| **Status** | Draft |
| **Type** | Standards Track — Solana Name Service |
| **Created** | 2026-05-06 |
| **Mirrors** | [ENSIP-25 (Ethereum)](https://ens.domains/blog/post/ensip-25) |
| **Related** | [ERC-8004](https://ens.domains/blog/post/ens-ai-agent-erc8004), [ENSIP-5 — Text Records](https://docs.ens.domains/ensip/5/), [ENSIP-12 — Avatar Text Records](https://docs.ens.domains/ensip/12/) |

---

## Abstract

This proposal specifies a minimal, opinionated standard for binding a `.sol` Solana Name Service (SNS) domain to one or more on-chain AI agents. It is a faithful adaptation of [ENSIP-25](https://ens.domains/blog/post/ensip-25) — Ethereum's "Verifiable AI Agent Identity" standard — to SNS records v2.

The standard introduces:

1. A **canonical record key** on SNS records v2 — `agent-registration[<registry>][<agentId>]` — that confirms the bidirectional binding between a `.sol` domain and an entry in an on-chain agent registry.
2. A small set of **optional auxiliary records** (`agent.controller`, `agent.signing-pubkey`, `agent.endpoint`, `agent.capabilities`, `agent.attestations`) that mirror the canonical text-record taxonomy of [ENSIP-5](https://docs.ens.domains/ensip/5/) for human/social profiles, but specialised for agents.
3. A **verification flow** — both off-chain (resolver) and on-chain (CPI-callable verifier) — for proving that a presented agent identity is bound to a specific `.sol`.

The Solana port additionally references three companion registries (Identity, Reputation, Validation) modelled after [ERC-8004](https://ens.domains/blog/post/ens-ai-agent-erc8004). Those registries are NOT mandated by this proposal — they are a reference implementation that demonstrates how the standard composes with on-chain trust infrastructure.

## Motivation

Solana clears the majority of [x402 protocol](https://solana.com/x402/what-is-x402) volume and is the de-facto execution layer for autonomous AI agents in 2026. Yet `.sol` — Solana's canonical naming primitive — has no equivalent of ENSIP-25, and the agent identity surface area on Solana is fragmenting:

- [Molt.id](https://www.globenewswire.com/news-release/2026/02/25/3244797/0/en/Molt-id-The-First-AI-Agent-Domain-System-on-Solana-Where-One-NFT-Gives-You-Everything.html) launched `.molt` as a separate TLD specifically for AI agents.
- The [Solana Agent Registry](https://solana.com/agent-registry) provides identifiers but does not specify how those identifiers bind to a human-readable name.
- Wallet- and dApp-level integrations rely on ad-hoc record conventions.

A canonical, ENSIP-25-shaped standard for `.sol` solves this by:

- Reusing the **canonical SNS namespace** rather than forking it (no new TLDs, no separate registries-of-record).
- Using **SNS records v2** — already shipped, already widely indexed.
- Mirroring the bracket-notation key shape of ENSIP-25, so cross-chain tooling needs only to swap the resolution backend.
- Permitting (but not requiring) integration with on-chain trust infrastructure (reputation, third-party validation).

## Specification

### 1. Canonical record key

A `.sol` domain MAY assert that it is the human-readable identity for an agent registered in an on-chain agent registry by setting the following SNS records v2 entry:

```
key:   agent-registration[<registry>][<agentId>]
value: a non-empty UTF-8 string (canonically "1")
```

Where:

- **`<registry>`** is a UTF-8 identifier for the on-chain registry. Implementations MUST accept either of the following forms:
  - **Solana-native form (RECOMMENDED on Solana clients):** the **base58-encoded Solana account address** of the registry account (typically a Program-Derived Address, PDA). Example:
    ```
    agent-registration[7qV…wZk][42]
    ```
  - **Cross-chain form (ERC-7930-compatible):** the [ERC-7930](https://eips.ethereum.org/EIPS/eip-7930) interoperable address. This form is used when the registry lives on another chain (e.g. an ERC-8004 IdentityRegistry on Ethereum). Example:
    ```
    agent-registration[0x000100000101148004a169fb4a3325136eb29fa0ceb6d2e539a432][42]
    ```
- **`<agentId>`** is the registry-scoped agent identifier as a base-10 ASCII string of an unsigned integer. Implementations MUST treat the value as a `u64`.

A non-empty value indicates the `.sol` owner has explicitly confirmed the binding. An empty or unset value indicates no binding.

The same `.sol` MAY simultaneously hold multiple `agent-registration[…]` records (different registries, different `agentId`s), expressing membership in multiple registries.

### 2. Auxiliary records

A `.sol` representing an agent SHOULD set the following auxiliary records to enable richer client behaviour. None are required for the binding itself.

| Key | Value | Purpose |
|---|---|---|
| `agent.controller` | `.sol` of the human/organisation owner | Signals delegated control |
| `agent.signing-pubkey` | base58-encoded Ed25519 public key (32 bytes) | Used by the on-chain verifier (§4) |
| `agent.endpoint` | URL | MCP, A2A, or other agent endpoint |
| `agent.capabilities` | URL or `data:application/json,…` | A2A capability card / declared skills |
| `agent.attestations` | comma-separated base58 account addresses | SAS / on-chain attestation references |
| `avatar` | URL or NFT URI ([ENSIP-12](https://docs.ens.domains/ensip/12/)) | Reused as-is from ENSIP-12 |

Keys following the `agent.*` prefix follow ENSIP-5's reverse-dot convention. Implementations SHOULD ignore unknown `agent.*` keys to permit forward extensions.

#### Agent capability shape (`agent.capabilities`)

When the `agent.capabilities` record is set inline as a JSON `data:` URL or fetched from a URL, the value SHOULD conform to the following structured shape (mirroring the [ENSign](https://github.com/LeoFranklin015/ENSign) `Permission` tuple, adapted to Solana primitives):

```jsonc
{
  "v": 1,
  "agent":     "<base58 agent signing pubkey>",
  "parent":    "<base58 parent SNS account pubkey>",
  "label":     "<subdomain leaf, e.g. \"trader\">",
  "start":     1715000000,            // optional unix seconds
  "expiresAt": 1716000000,            // optional unix seconds
  "calls": [
    { "target": "<base58 program ID>", "selector": "<8-byte hex Anchor discriminator>" },
    { "target": "<base58 program ID>" }   // wildcard method
  ],
  "spends": [
    {
      "mint":          "<base58 SPL mint>",
      "allowance":     "<u64 stringified>",
      "periodSeconds": 86400              // optional; omit for lifetime cap
    }
  ]
}
```

`target` is a Solana program ID; `selector` is the Anchor 8-byte instruction discriminator (`first 8 bytes of sha256("global:<method>")`). Verifiers SHOULD reject calls outside `calls[]` and spends exceeding `spends[].allowance` per `periodSeconds`. The reference SDK exposes `serializePermission`, `parsePermission`, `isActive`, `permitsCall`, `spendCapFor` in `@snsip/agent-sdk`.

#### Solana adaptation note (PDA derivation)

SNS records v2 derives the record account address from a PDA seeded by the *raw key string* via `getHashedNameSync(\x02 + key)` (see [`getRecordV2Key`](https://github.com/SolanaNameService/sns-sdk/blob/master/js/src/record_v2/getRecordV2Key.ts) in the official SDK). Dots in keys are NOT segment-separators at the PDA layer — they are part of the hashed seed. This means `agent.signing-pubkey` and `agent-signing-pubkey` are *different* records, and either form is permitted by the underlying primitive.

**This SNSIP standardises on the dotted form** (`agent.signing-pubkey`) for parity with ENSIP-5. Implementations MUST avoid the high-level Bonfida wrapper `createRecordV2Instruction`, which builds the PDA via `getDomainKeySync(\`${key}.${domain}\`)` and rejects key strings containing dots (4+ segments after splitting). Use the lower-level primitives `allocateAndPostRecord` / `editRecord` from [`@bonfida/sns-records`](https://www.npmjs.com/package/@bonfida/sns-records) directly, deriving the PDA via `getRecordV2Key(domain, key)`. The reference SDK in this repository (`@snsip/agent-sdk`) does this; see `packages/agent-sdk/src/records.ts`.

### 3. Off-chain verification flow

To verify that an agent presenting itself as `<domain>` is the same agent identified by `(registry, agentId)`:

```
1. Resolve <domain> via SNS (records v2).
2. Look up key `agent-registration[<registry>][<agentId>]`.
3. If value is non-empty → binding is asserted by the .sol owner. CONTINUE.
   Otherwise → REJECT.
4. (Recommended) Read `agent.signing-pubkey`. Issue a fresh nonce challenge
   to the agent endpoint and verify its Ed25519 signature with that pubkey.
5. (Optional) Cross-check the registry: confirm that the agent at
   `(registry, agentId)` records the same `<domain>` (or a hash of it).
   This is the "bidirectional" guarantee — both sides explicitly point at
   each other.
```

### 4. On-chain verification flow (Solana)

Solana programs SHOULD verify agent signatures by composing two instructions in a single transaction:

```
ix[0]: Solana Ed25519 sigverify program — proves
       (signing_pubkey, message, signature) is a valid Ed25519 sig.
ix[1]: SNSIP-Agent verifier program — reads the immediately-preceding
       Ed25519 instruction via the Instructions sysvar, asserts:
         - the previous ix is the Ed25519 program,
         - its signing_pubkey == Agent.signing_pubkey
           (where Agent is the on-chain identity-registry account),
         - its message bytes == the expected message,
         - the Agent is not revoked.
```

This pattern mirrors Solana's canonical "verify sig in caller, then call program" idiom. It avoids Ed25519 verification inside the program (computationally expensive) while still providing a single CPI-callable interface for downstream programs to gate access on "is this a verified SNSIP-Agent?"

The reference implementation exposes:

```rust
verify_agent_signature(
    ctx: Context<VerifyAgentSignature>,
    message: Vec<u8>,
) -> Result<()>;
```

with `Agent` passed as the single account, and the Instructions sysvar in the account list.

### 5. Reference implementation: ERC-8004 trust stack

The companion reference implementation ports [ERC-8004](https://ens.domains/blog/post/ens-ai-agent-erc8004)'s three registries to Solana as Anchor programs:

- **Identity Registry** — the registry referenced by `<registry>` in the canonical record key. Stores `Agent { id, controller, sns_domain_hash, signing_pubkey, metadata_uri, created_at, revoked }` per agent.
- **Reputation Registry** — append-only-ish reputation accumulator per agent. Designed to be delegated to [MagicBlock Ephemeral Rollups](https://docs.magicblock.gg/) for high-frequency interaction logging.
- **Validation Registry** — third-party validation records signed by external auditors / validators.

The reference implementation is **not mandated** by this SNSIP. Other registries that implement the same `Agent` shape (or expose equivalent fields via CPI) are valid backends.

## Rationale

### Why bracket notation and not a flat key?

The bracket form `agent-registration[<registry>][<agentId>]` is taken verbatim from ENSIP-25. Reasons:

1. **Multi-registry future.** An agent may legitimately be registered in multiple registries (open registry, curated registry, app-specific registry). Bracket notation makes this trivial; flat keys collide.
2. **Cross-chain tooling parity.** Tools that already parse ENSIP-25 keys can reuse the same parser.

### Why mirror ENSIP-25 instead of inventing a new shape?

A standards-aligned port lowers the marginal cost of cross-chain agent tooling. An agent registered on both Ethereum (via ENSIP-25) and Solana (via SNSIP-Agent) presents the *same* binding semantics on both — only the resolution backend differs.

### Why not require cryptographic signing inside the binding record itself?

ENSIP-25 deliberately does not require a signature in the record value (see the original spec — value is just `"1"`). The trust comes from **bidirectional attestation**: the agent claims a name in its registry; the name owner confirms via the text record. Adding a signature requirement creates rotation problems (who re-signs when keys change?) and doesn't add trust beyond what the registry + name owner already provide.

### Why optional ERC-8004 backend?

We separate "binding record" (this SNSIP) from "trust infrastructure" (ERC-8004 stack) so the simplest possible client — one that just resolves a `.sol` and checks a record — works without needing to understand reputation or validation. Richer clients layer on top.

## Backwards Compatibility

This proposal introduces only new SNS record keys. It does not change:

- the SNS program,
- existing record keys,
- the SNS records v2 storage layout,
- domain registration mechanics.

Domains that do not set `agent-registration[…]` records are unaffected and continue to behave as today. Clients unaware of SNSIP-Agent that read records v2 will see the new keys as opaque strings, which is the existing records v2 contract.

## Security Considerations

### Key rotation

If `agent.signing-pubkey` is rotated, in-flight challenges signed under the previous key become invalid. Verifiers SHOULD re-resolve the record on each verification rather than caching. The Identity Registry's `update_agent` instruction provides the on-chain rotation surface; the SNS record SHOULD be updated atomically (or with a brief overlap window).

### Stale records

SNS records v2 expose a staleness flag and right-of-association (RoA) metadata. Verifiers MUST treat stale records as unverified and SHOULD warn the user. The reference SDK exposes the staleness flag via `ResolvedAgent.records.agentRegistration`.

### Revocation

The Identity Registry's `revoke_agent` instruction sets `Agent.revoked = true`. The on-chain verifier (§4) MUST reject verification of revoked agents. Off-chain clients SHOULD additionally treat the record as unverified if the on-chain Agent's `revoked` flag is true.

### Hierarchy revocation

The SNS subdomain hierarchy IS the capability tree. Revoking an agent does not require a separate revocation transaction:

- Transferring the parent `.sol` to a new owner orphans every subdomain agent under it. Verifiers MUST re-resolve `agent.controller` on each verification and MUST reject if the controller no longer matches `Agent.controller` in the on-chain Identity Registry.
- Burning (closing) the parent `.sol` removes all subdomain records in the same block; on-chain reads against the (now non-existent) records return null and the verifier rejects.
- A controller can revoke a single agent without affecting siblings by transferring or burning *only* the agent's subdomain.

This mirrors [ENSign](https://github.com/LeoFranklin015/ENSign)'s "burn parent → all children lose authority in the same block" property — it is intrinsic to any name-service-rooted identity scheme and requires no special-case logic in the verifier beyond re-resolving on each call.

### Squatting

A malicious actor cannot bind an agent they don't control: setting the `agent-registration[…]` record requires owning the `.sol`. Conversely, registering an agent in the Identity Registry without then setting the corresponding record on the named `.sol` produces a one-sided claim that verifiers MUST reject (no bidirectional binding).

### Cross-chain spoofing

When `<registry>` is given in ERC-7930 form pointing to a remote chain, verifiers cannot directly read the remote registry from a Solana program. Such verification MUST be performed off-chain or via a trusted indexer/oracle, and verifiers SHOULD clearly indicate the trust assumption to the user.

## Reference Implementation

A reference implementation is provided in this repository:

- **Programs (Anchor):** `programs/identity-registry/`, `programs/reputation-registry/`, `programs/validation-registry/`, `programs/agent-verifier/`.
- **TypeScript SDK:** `packages/agent-sdk/` (`@snsip/agent-sdk`).
- **Web dashboard + interactive playgrounds:** `apps/web/`.

See `README.md` for build/run instructions and `plans/sns-identity-hackathon/PLAN.md` for the day-by-day delivery plan.

## Prior art

- [ENSign](https://github.com/LeoFranklin015/ENSign) (ENS, May 2026) — Won "Most Creative Use of ENS" at Open Agents. Turns ENS subnames into passkey-signed ERC-4337 smart accounts with sub-subdomain agents bearing structured `Permission` records (target/selector/spendCap/period/expiry). SNSIP-Agent's `agent.capabilities` schema (§2) and hierarchy-revocation property (§ Security Considerations) are direct adaptations of ENSign's design, ported to Solana primitives.

## References

- [ENSIP-25 — Verifiable AI Agent Identity (ENS)](https://ens.domains/blog/post/ensip-25)
- [ENS — Identity Problem in Agentic Commerce / ERC-8004](https://ens.domains/blog/post/ens-ai-agent-erc8004)
- [ENSIP-5 — Text Records](https://docs.ens.domains/ensip/5/)
- [ENSIP-12 — Avatar Text Records](https://docs.ens.domains/ensip/12/)
- [ERC-3668 — CCIP Read](https://eips.ethereum.org/EIPS/eip-3668)
- [ERC-7700 — Cross-chain Storage Router Protocol](https://eips.ethereum.org/EIPS/eip-7700)
- [ERC-7930 — Interoperable Addresses](https://eips.ethereum.org/EIPS/eip-7930)
- [SNS Guide](https://sns.guide/)
- [SNS SDK](https://github.com/SolanaNameService/sns-sdk)
- [Solana Agent Registry](https://solana.com/agent-registry)
- [x402 on Solana](https://solana.com/x402/what-is-x402)
- [MagicBlock Ephemeral Rollups](https://docs.magicblock.gg/)
- [Solana Attestation Service writeup (Range)](https://www.range.org/blog/introducing-solana-attestation-service)
- [ENSign source — `ENSignAgentRegistry` Permission struct](https://github.com/LeoFranklin015/ENSign/blob/main/contracts/src/ENSignAgentRegistry.sol)

## Appendix A — Memo schemas (registry-prototype)

Until the Anchor `reputation-registry` and `validation-registry` programs ship, every registry-class event in the reference dApp is written as an SPL Memo with a canonical, line-oriented byte format. These shapes are forward-compatible with the future Anchor account layouts: the same fields will be parsed by the indexer when the registry programs land. Public RPC users can verify any event by fetching the tx and reading `meta.logMessages` for the Memo line.

All schemas use the middle-dot `·` (U+00B7) as a field separator, ASCII `=` for key/value pairs, and ISO-8601 timestamps in UTC.

```text
SNSIP-Login v1     · domain=<sol> · wallet=<base58> · t=<iso-8601>

SNSIP-Airdrop v1   · agent=<sol> · claimer=<base58>
                   · checks_passed=<csv: signing_key,endpoint,permission,not_expired>
                   · t=<iso-8601>

SNSIP-Swap v1      · agent=<sol> · target=<base58 program-id>
                   · mint=<base58 spl-mint> · amount=<u64 raw>
                   · gate=<allowed|rejected>
                   · permission_label=<utf-8>          (optional, on success)
                   · reason="<utf-8>"                  (optional, on rejection)
                   · t=<iso-8601>

SNSIP-Rep v2       · agent=<sol> · validator=<base58>
                   · rating=<positive|neutral|negative>
                   · weight=<u64>                      (registry will compute from validator
                                                        history; user-submitted defaults to 1)
                   · note="<utf-8, ≤240 chars>"
                   · t=<iso-8601>

SNSIP-Val v2       · agent=<sol> · attestor=<base58>
                   · class=<audit|kyc|capability|custom>
                   · claim="<utf-8, ≤280 chars>"
                   · t=<iso-8601>
                   // future: + claim_uri (off-chain evidence pointer), expiry, revoked

SNSIP-Handshake v1 · alice=<sol> · bob=<sol>
                   · rounds=<u8> · all_verified=<true|false>
                   · t=<iso-8601>
```

`pitch/onchain-proof.md` ships nine devnet transactions — one per shape — every byte independently verifiable on Solana Explorer.

## Copyright

Released under [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).
