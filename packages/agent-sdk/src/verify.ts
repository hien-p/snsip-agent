import { PublicKey, Ed25519Program, Transaction, type Connection, type TransactionInstruction } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";

// ---- Local (off-chain) sign / verify ----------------------------------
//
// Used by the verifier playground for instant feedback without paying for
// a transaction. The on-chain verifier program checks the same Ed25519
// signature using Solana's sysvar precompile.

export function generateNonce(length = 32): Uint8Array {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    return crypto.getRandomValues(new Uint8Array(length));
  }
  // Node fallback
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { randomBytes } = require("crypto");
  return new Uint8Array(randomBytes(length));
}

export function bytesToHex(b: Uint8Array): string {
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

export function hexToBytes(s: string): Uint8Array {
  const clean = s.startsWith("0x") ? s.slice(2) : s;
  if (clean.length % 2 !== 0) throw new Error("hex length must be even");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export interface LocalSignResult {
  signatureBase58: string;
  pubkeyBase58: string;
}

export function localSignMessage(
  agentSecretKey: Uint8Array | string,
  message: Uint8Array | string,
): LocalSignResult {
  const sk = typeof agentSecretKey === "string" ? bs58.decode(agentSecretKey) : agentSecretKey;
  const messageBytes =
    typeof message === "string" ? new TextEncoder().encode(message) : message;

  // tweetnacl's secretKey for `sign` is 64 bytes (sk32 || pk32)
  const kp = nacl.sign.keyPair.fromSecretKey(sk);
  const sig = nacl.sign.detached(messageBytes, kp.secretKey);
  return {
    signatureBase58: bs58.encode(sig),
    pubkeyBase58: bs58.encode(kp.publicKey),
  };
}

export function localVerifySignature(
  pubkeyBase58: string,
  message: Uint8Array | string,
  signatureBase58: string,
): boolean {
  try {
    const messageBytes =
      typeof message === "string" ? new TextEncoder().encode(message) : message;
    const sig = bs58.decode(signatureBase58);
    const pk = bs58.decode(pubkeyBase58);
    return nacl.sign.detached.verify(messageBytes, sig, pk);
  } catch {
    return false;
  }
}

// ---- localStorage stash for demo agent keys ---------------------------

export const AGENT_SK_STORAGE_PREFIX = "snsip:agent-sk:";

export function getStashedAgentKey(domain: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(`${AGENT_SK_STORAGE_PREFIX}${domain}`);
}

export function setStashedAgentKey(domain: string, secretKeyBase58: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${AGENT_SK_STORAGE_PREFIX}${domain}`, secretKeyBase58);
}

// ---- On-chain verify transaction builder ------------------------------
//
// Composes [Ed25519Program ix, agent_verifier::verify_agent_signature ix]
// into one transaction. The verifier program reads the previous
// instruction via the Instructions sysvar and asserts:
//   - it's the Ed25519Program,
//   - its (pubkey, message) match the on-chain Agent.signing_pubkey
//     and the message arg passed to verify_agent_signature.
//
// If `verifierProgramId` is null/zero (registry not yet deployed), this
// function throws — UI should fall back to localVerifySignature() for D1
// preview demos.

export interface BuildVerifyTxParams {
  agentPubkey: PublicKey;          // 32-byte Ed25519 pubkey
  agentAccountPubkey: PublicKey;   // PDA in IdentityRegistry
  message: Uint8Array;
  signature: Uint8Array;           // 64 bytes
  verifierProgramId: PublicKey;
}

export function buildVerifyAgentInstructions(
  params: BuildVerifyTxParams,
): TransactionInstruction[] {
  const ed25519Ix = Ed25519Program.createInstructionWithPublicKey({
    publicKey: params.agentPubkey.toBytes(),
    message: params.message,
    signature: params.signature,
  });

  // The verifier program is invoked with the Agent PDA + Instructions sysvar.
  // For the staged version we DO NOT directly construct the verifier ix
  // — Anchor IDL types are generated post-deploy. Instead, the dApp's
  // generated client (anchor TS types) builds it. We export only the
  // Ed25519 ix here and document the second-instruction shape in
  // SNSIP-AGENT.md § "On-chain verification flow".
  return [ed25519Ix];
}

// Helper: ensure 64-byte signature.
export function decodeSignatureBase58(sig: string): Uint8Array {
  const bytes = bs58.decode(sig);
  if (bytes.length !== 64) throw new Error(`expected 64-byte signature, got ${bytes.length}`);
  return bytes;
}

export function decodePubkeyBase58(pk: string): Uint8Array {
  const bytes = bs58.decode(pk);
  if (bytes.length !== 32) throw new Error(`expected 32-byte pubkey, got ${bytes.length}`);
  return bytes;
}

// Tamper helper for the playground: flip one byte in `bytes` at `index`.
export function tamperByte(bytes: Uint8Array, index = 0): Uint8Array {
  const out = new Uint8Array(bytes);
  out[index % out.length] = (out[index % out.length]! ^ 0x01) & 0xff;
  return out;
}

// Trivially expose connection/verifier helpers for TypeScript callers
// that want a one-shot local verification path:
export async function verifyAgentLocally(
  _connection: Connection,
  agentSigningPubkeyBase58: string,
  message: Uint8Array | string,
  signatureBase58: string,
): Promise<{ ok: boolean; reason?: string }> {
  const ok = localVerifySignature(agentSigningPubkeyBase58, message, signatureBase58);
  return ok ? { ok: true } : { ok: false, reason: "Ed25519 signature did not verify against agent.signing-pubkey" };
}

// Re-export Transaction so callers don't need to import @solana/web3.js
// to assemble.
export { Transaction };
