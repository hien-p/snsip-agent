import type { PublicKey } from "@solana/web3.js";

// On-chain Agent account, mirror of `programs/identity-registry::Agent`.
export interface Agent {
  id: bigint;
  controller: PublicKey;
  snsDomainHash: Uint8Array; // 32 bytes
  signingPubkey: PublicKey;
  metadataUri: string;
  createdAt: bigint;
  revoked: boolean;
}

export interface ResolvedAgent {
  // The .sol that owns this agent identity.
  domain: string;
  // Base58 program ID of the identity registry (per ENSIP-25 bracket notation).
  registry: string;
  // Agent ID inside that registry.
  agentId: bigint;
  // Records v2 set on the .sol.
  records: AgentRecords;
}

export interface AgentRecords {
  // Bidirectional ENSIP-25 binding marker.
  agentRegistration: { registry: string; agentId: bigint; value: string } | null;
  // Optional canonical agent metadata records.
  controller?: string;       // .sol of human/org owner
  signingPubkey?: string;    // base58 Ed25519 pubkey
  endpoint?: string;         // MCP / A2A URL
  capabilities?: string;     // URL or data: URL of capability card JSON
  attestations?: string[];   // SAS attestation account addresses
  avatar?: string;           // ENSIP-12 compatible
}

export interface VerifyResult {
  ok: boolean;
  reason?: string;
  txSignature?: string;
}
