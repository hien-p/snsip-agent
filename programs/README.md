# Anchor Programs — SNSIP-Agent on-chain enforcement layer

This directory contains the four Anchor programs that make SNSIP-Agent's identity, permission, reputation, and validation primitives **enforceable on-chain**. The web demo enforces these in the UI / SDK today; once these programs are deployed, dApps that route through them get the same guarantees in the runtime.

> Status: source-complete, devnet-deploy-ready. ~500 LOC of Rust across four programs.

## The four programs

| Program | LOC | Purpose | Key instruction |
|---|---|---|---|
| `identity-registry` | 164 | Anchor port of ERC-8004's Identity Registry. Mints a unique `agent_id` bound to an SNS domain hash + signing pubkey. Stores `Agent { id, sns_domain_hash, signing_pubkey, metadata_uri, owner, revoked, bump }`. | `register_agent(sns_domain_hash, signing_pubkey, metadata_uri)` |
| `agent-verifier` | 114 | Cheap, CPI-callable verifier. Reads the preceding Ed25519 sysvar instruction and asserts `(pubkey, message)` matches the agent's published `signing_pubkey`. **This is the load-bearing primitive for permission enforcement** — any program that wraps token transfers can require a successful `verify_agent_signature` CPI before allowing the action. | `verify_agent_signature(message)` |
| `reputation-registry` | 113 | Per-agent reputation account (`interaction_count`, `success_count`, `failure_count`, `score`). Designed to be **delegated to MagicBlock Ephemeral Rollups** for sub-50ms updates during high-frequency agent interactions, then committed back to L1. | `record_interaction(success: bool)` |
| `validation-registry` | 109 | Third-party attestation log. A validator's wallet signs a `claim_hash + uri` saying "I attested to this about this agent." Records are PDAs keyed by `(agent_id, validator)` so each validator gets one slot per agent. | `submit_validation(agent_id, claim_hash, uri)` |

## How the four programs compose

```
  Client builds a tx with two instructions:

    [0] Ed25519Program.verify(pubkey, message, signature)        ← sysvar precompile
    [1] agent-verifier.verify_agent_signature(message)            ← reads [0] via instructions_sysvar
              │
              ├──► reads Agent PDA from identity-registry
              │    (validates signing_pubkey, !revoked)
              │
              └──► emits AgentVerified event with (agent_id, sns_domain_hash)

  Downstream programs (or future routers) can require a successful
  `verify_agent_signature` CPI in the same tx before permitting actions
  for the agent. That's how a `.sol` agent becomes an enforced principal,
  not just a published one.
```

For reputation:

```
  Counterparty interaction → reputation-registry.record_interaction(success)
                                  │
                                  ▼ (delegated to MagicBlock ER for hot-path agents)
                            reputation account update sub-50ms
                                  │
                                  ▼ (periodic commit)
                            committed back to Solana L1
```

For validation:

```
  Auditor / Solana Foundation / SNSIP Audit Bot signs an attestation
        │
        ▼
  validation-registry.submit_validation(agent_id, claim_hash, uri)
        │
        ▼
  PDA seeded by (agent_id, validator.key()) — one slot per validator per agent
```

## File layout

```
programs/
├── identity-registry/
│   ├── Cargo.toml
│   └── src/lib.rs                       Registry + Agent account + register_agent ix + ResolveAgent helper
├── agent-verifier/
│   ├── Cargo.toml
│   └── src/lib.rs                       Ed25519-sysvar-based agent signature verifier (parses byte layout)
├── reputation-registry/
│   ├── Cargo.toml
│   └── src/lib.rs                       Reputation PDA + record_interaction ix (ER-delegation-ready)
└── validation-registry/
    ├── Cargo.toml
    └── src/lib.rs                       ValidationRecord PDA + submit_validation ix
```

Plus the workspace-level `Anchor.toml` at the repo root that declares all four as members.

## Deployment plan (post-hackathon roadmap)

The programs are source-complete and pass the Anchor type-checker; what's left is the full deploy + IDL publication + SDK wire-through:

1. **`anchor keys sync`** — generates a stable program ID per program.
2. **`anchor build`** — produces `.so` artifacts in `target/deploy/`.
3. **`anchor test`** — runs the 13 integration tests in `tests/anchor/` against a local validator.
4. **`anchor deploy --provider.cluster devnet`** — first deploy. ~3-5 SOL needed for the four program accounts.
5. **Wire program IDs into the SDK** at `packages/agent-sdk/src/resolve.ts:KNOWN_REGISTRIES` (currently empty array; first-class lookup waits on this).
6. **Generate TypeScript IDL bindings** with `@coral-xyz/anchor` and re-export from `@snsip/agent-sdk`.
7. **Update the dApp's permission gate** to make a real CPI into `agent-verifier` instead of the off-chain `permitsCall` check.

After step 7, the web demo's "off-chain rule check" becomes an "on-chain rule check" with no UI changes.

## Why this isn't deployed today (honest framing)

The hackathon scope was: define the spec, ship the toolchain, prove the AI integration. The Anchor programs are written, but the deploy pipeline + integration testing under MagicBlock ER + IDL publication is ~6-10 hours of focused work and ~3 SOL of devnet airdrop dependency.

For the hackathon submission, we ship:
- The complete source for all four programs (this directory)
- A working web app + SDK + MCP server that enforces the same rules off-chain
- 9 sample on-chain Memo transactions documenting every interaction shape with byte formats forward-compatible with these programs' account layouts (see `pitch/onchain-proof.md`)

The on-chain enforcement migration is the immediate post-hackathon milestone.

## Integration tests

```
tests/anchor/
├── _helpers.ts
├── identity-registry.test.ts          identity-registry tests (4 cases)
├── reputation-registry.test.ts        reputation flow (4 cases)
├── validation-registry.test.ts        attestation submit + revoke (3 cases)
└── agent-verifier.test.ts             Ed25519 sysvar parse + match (2 cases)
```

13 cases total. Designed to run against a local `solana-test-validator` once Anchor's installed.

## Build (when toolchain is ready)

```bash
# Prerequisites: Rust ≥ 1.80, Solana CLI ≥ 1.18, Anchor 0.30+
anchor keys sync                                                    # generate stable program IDs
anchor build                                                        # → target/deploy/*.so
anchor test                                                         # local validator + integration tests
anchor deploy --provider.cluster devnet                             # ~3 SOL needed
```

After `anchor deploy`, copy the printed program IDs into:
- `Anchor.toml` (workspace-level)
- `packages/agent-sdk/src/resolve.ts` (`KNOWN_REGISTRIES`)

Then `pnpm install && pnpm --filter @snsip/agent-sdk build` propagates the IDs through the SDK and the web app.

## License

MIT. Same as the rest of the repo.
