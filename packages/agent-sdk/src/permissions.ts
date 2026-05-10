// SNSIP-Agent permission shape.
//
// Mirrors ENSign's Permission tuple (target / selector / spendCap / period /
// expiry) — adapted to Solana primitives:
//
//   Ethereum            →  Solana
//   ─────────────────────────────────────────────────────
//   address target      →  base58 program ID
//   bytes4 selector     →  hex 8-byte Anchor discriminator
//                          (first 8 bytes of sha256("global:<method>"))
//   IERC20 token        →  base58 SPL mint
//   uint48 expiry       →  unix seconds
//   parentNode/tokenId  →  base58 parent SNS account pubkey
//
// Storage: serialize to JSON, write to the agent's `agent.capabilities`
// records v2 entry. Verifiers read it back at runtime. Hierarchy
// revocation is automatic: if `agent.controller`'s ownership of the
// parent .sol changes, every grant under the parent loses authority in
// the same block. No separate revocation tx.

export interface CallPermission {
  /** Base58 program ID the agent is allowed to call. */
  target: string;
  /** Optional Anchor 8-byte discriminator, hex-encoded. Omit for "any method". */
  selector?: string;
}

export interface SpendLimit {
  /** Base58 SPL token mint. Use `So11111…112` for native SOL/wSOL. */
  mint: string;
  /** Maximum spend per period, as a u64 stringified (avoids JS number precision loss). */
  allowance: string;
  /** Period length in seconds. Omit for lifetime cap. */
  periodSeconds?: number;
}

export interface AgentPermission {
  /** Base58 agent signing pubkey or wallet. */
  agent: string;
  /** Base58 SNS account pubkey of the parent .sol. Burning/transferring this revokes the agent. */
  parent: string;
  /** Subdomain leaf, e.g. "trader" for trader.alice.sol. */
  label: string;
  /** Unix seconds; omit to default to issuance time. */
  start?: number;
  /** Unix seconds; omit for no expiry. */
  expiresAt?: number;
  /** Allowed call targets. Empty array = no call permissions granted. */
  calls: CallPermission[];
  /** Optional spend limits per token. Omit for no spending allowed. */
  spends?: SpendLimit[];
}

export const PERMISSION_SCHEMA_VERSION = 1;

interface SerializedPermission extends AgentPermission {
  v: typeof PERMISSION_SCHEMA_VERSION;
}

export function serializePermission(p: AgentPermission): string {
  const out: SerializedPermission = { v: PERMISSION_SCHEMA_VERSION, ...p };
  return JSON.stringify(out);
}

export function parsePermission(json: string): AgentPermission {
  const parsed = JSON.parse(json) as Partial<SerializedPermission>;
  if (parsed.v !== PERMISSION_SCHEMA_VERSION) {
    throw new Error(`Unknown permission schema version: ${parsed.v}`);
  }
  if (!parsed.agent || !parsed.parent || !parsed.label || !Array.isArray(parsed.calls)) {
    throw new Error("Permission missing required fields");
  }
  // Validate inner shapes — a malicious on-chain blob with empty/typed-wrong
  // entries must not silently produce a permissive `permitsCall` result.
  for (let i = 0; i < parsed.calls.length; i++) {
    const c = parsed.calls[i] as Partial<CallPermission>;
    if (!c || typeof c.target !== "string" || c.target.length === 0) {
      throw new Error(`Permission calls[${i}].target must be a non-empty string`);
    }
    if (c.selector !== undefined && typeof c.selector !== "string") {
      throw new Error(`Permission calls[${i}].selector must be a string when present`);
    }
  }
  if (parsed.spends !== undefined) {
    if (!Array.isArray(parsed.spends)) {
      throw new Error("Permission spends must be an array");
    }
    for (let i = 0; i < parsed.spends.length; i++) {
      const s = parsed.spends[i] as Partial<SpendLimit>;
      if (!s || typeof s.mint !== "string" || s.mint.length === 0) {
        throw new Error(`Permission spends[${i}].mint must be a non-empty string`);
      }
      if (typeof s.allowance !== "string" || s.allowance.length === 0) {
        throw new Error(`Permission spends[${i}].allowance must be a non-empty string`);
      }
    }
  }
  return {
    agent: parsed.agent,
    parent: parsed.parent,
    label: parsed.label,
    start: parsed.start,
    expiresAt: parsed.expiresAt,
    calls: parsed.calls,
    spends: parsed.spends,
  };
}

export function isExpired(p: AgentPermission, nowSec: number = Math.floor(Date.now() / 1000)): boolean {
  if (p.expiresAt === undefined) return false;
  return nowSec >= p.expiresAt;
}

export function isStarted(p: AgentPermission, nowSec: number = Math.floor(Date.now() / 1000)): boolean {
  if (p.start === undefined) return true;
  return nowSec >= p.start;
}

export function isActive(p: AgentPermission, nowSec: number = Math.floor(Date.now() / 1000)): boolean {
  return isStarted(p, nowSec) && !isExpired(p, nowSec);
}

export function permitsCall(
  p: AgentPermission,
  target: string,
  selectorHex?: string,
  nowSec: number = Math.floor(Date.now() / 1000),
): boolean {
  if (!isActive(p, nowSec)) return false;
  return p.calls.some((c) => {
    if (c.target !== target) return false;
    if (c.selector === undefined) return true; // wildcard method
    if (selectorHex === undefined) return false; // caller asked for "any" but rule is specific
    return c.selector.toLowerCase() === selectorHex.toLowerCase();
  });
}

export function spendCapFor(
  p: AgentPermission,
  mint: string,
): SpendLimit | undefined {
  return p.spends?.find((s) => s.mint === mint);
}
