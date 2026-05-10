import { Connection, PublicKey, SystemProgram, type TransactionInstruction } from "@solana/web3.js";

// Latency-tracking sample. Used by the D3 playground.
export interface LatencySample {
  latencyMs: number;
  cluster: "l1" | "er";
  sentAt: number;     // ms epoch when tx was sent
  signature?: string; // present iff a real tx was confirmed
}

export interface RollingStats {
  count: number;
  last: number | null;
  avg: number | null;
  p95: number | null;
}

export function rollingStats(samples: LatencySample[]): RollingStats {
  if (samples.length === 0) {
    return { count: 0, last: null, avg: null, p95: null };
  }
  const lats = samples.map((s) => s.latencyMs);
  const sum = lats.reduce((a, b) => a + b, 0);
  const sorted = [...lats].sort((a, b) => a - b);
  const p95Index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  return {
    count: lats.length,
    last: lats[lats.length - 1] ?? null,
    avg: sum / lats.length,
    p95: sorted[p95Index] ?? null,
  };
}

// timeAsync: measure wall-time of an async op. Use for raw client-side
// latency including RPC + confirm time.
export async function timeAsync<T>(fn: () => Promise<T>): Promise<{ result: T; latencyMs: number }> {
  const t0 = (typeof performance !== "undefined" ? performance.now() : Date.now());
  const result = await fn();
  const t1 = (typeof performance !== "undefined" ? performance.now() : Date.now());
  return { result, latencyMs: t1 - t0 };
}

// MAGIC_ROUTER_DEVNET — same constant exported from client.ts; re-exported
// here for callers that want to construct an ER-routed Connection directly.
export const MAGIC_ROUTER_DEVNET = "https://devnet-router.magicblock.app";

export function makeERConnection(commitment: "processed" | "confirmed" = "processed"): Connection {
  return new Connection(MAGIC_ROUTER_DEVNET, commitment);
}

// noopTransferIx: emit a self-transfer of 0 lamports as a cheap "tap"
// payload. Used by the latency playground when the real
// reputation-registry program isn't deployed yet, so the demo is
// runnable on Day 1 before the user has run `anchor deploy`.
//
// Uses SystemProgram.transfer to avoid bundler-polyfill issues with
// Buffer.writeBigUInt64LE in browser builds.
export function noopTransferIx(payer: PublicKey): TransactionInstruction {
  return SystemProgram.transfer({
    fromPubkey: payer,
    toPubkey: payer,
    lamports: 0,
  });
}

// REPUTATION_PROGRAM_NOT_DEPLOYED — sentinel used by the playground.
// When the published program ID still equals the placeholder, the UI
// falls back to noopTransferIx + simulated reputation gauge to keep the
// demo moving. Replace this constant in app config once `anchor keys
// sync` has run.
export const REPUTATION_PROGRAM_PLACEHOLDER = "11111111111111111111111111111111";

export function isProgramDeployed(programId: string): boolean {
  return Boolean(programId) && programId !== REPUTATION_PROGRAM_PLACEHOLDER;
}
