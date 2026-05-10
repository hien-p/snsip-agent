// SNSIP-Agent record-key construction.
//
// We mirror ENSIP-25 bracket notation:
//   agent-registration[<registry>][<agentId>]
//
// On Solana, <registry> is the base58 program ID of the identity registry
// (or, for cross-chain interop, an ERC-7930 interoperable address).
// <agentId> is the base-10 string of the registry-scoped agent id.

export const RECORD_AGENT_REGISTRATION = "agent-registration";

export function agentRegistrationKey(registry: string, agentId: bigint | number | string): string {
  // Reject inputs that would corrupt the bracket-notation grammar so the key
  // round-trips cleanly through `parseAgentRegistrationKey` and on-chain hashing.
  if (!registry || registry.includes("[") || registry.includes("]")) {
    throw new Error(`agentRegistrationKey: registry must not contain '[' or ']' (got ${JSON.stringify(registry)})`);
  }
  const idStr = agentId.toString();
  if (!/^\d+$/.test(idStr)) {
    throw new Error(`agentRegistrationKey: agentId must be a non-negative integer (got ${JSON.stringify(idStr)})`);
  }
  return `${RECORD_AGENT_REGISTRATION}[${registry}][${idStr}]`;
}

const AGENT_REGISTRATION_RE = /^agent-registration\[([^\]]+)\]\[(\d+)\]$/;

export function parseAgentRegistrationKey(key: string): { registry: string; agentId: bigint } | null {
  const m = key.match(AGENT_REGISTRATION_RE);
  if (!m) return null;
  return { registry: m[1]!, agentId: BigInt(m[2]!) };
}

// Auxiliary canonical record keys (extend ENSIP-5 conventions).
export const RECORD_AGENT_CONTROLLER = "agent.controller";
export const RECORD_AGENT_SIGNING_PUBKEY = "agent.signing-pubkey";
export const RECORD_AGENT_ENDPOINT = "agent.endpoint";
export const RECORD_AGENT_CAPABILITIES = "agent.capabilities";
export const RECORD_AGENT_ATTESTATIONS = "agent.attestations";
export const RECORD_AVATAR = "avatar";

export const ALL_AGENT_RECORD_KEYS = [
  RECORD_AGENT_CONTROLLER,
  RECORD_AGENT_SIGNING_PUBKEY,
  RECORD_AGENT_ENDPOINT,
  RECORD_AGENT_CAPABILITIES,
  RECORD_AGENT_ATTESTATIONS,
  RECORD_AVATAR,
] as const;
