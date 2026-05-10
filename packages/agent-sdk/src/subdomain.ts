import {
  type Connection,
  type PublicKey,
  type TransactionInstruction,
} from "@solana/web3.js";
import { createSubdomain } from "@bonfida/spl-name-service";

// createAgentSubdomainIx: build the instructions that create a subdomain
// `<sub>.<parent>.sol` to host an SNSIP-Agent identity.
//
// Wraps Bonfida's `createSubdomain` which returns 1–2 instructions:
//   1. The subdomain creation itself.
//   2. (Conditional) the reverse-lookup record so the subdomain resolves
//      back to its name when queried by pubkey.
export async function createAgentSubdomainIx(
  connection: Connection,
  params: {
    parentDomain: string; // e.g. "alice.sol" (with or without ".sol")
    subdomain: string;    // e.g. "myagent" — the leaf only, no dots
    owner: PublicKey;
    payer: PublicKey;
    feePayer?: PublicKey;
    /** Bytes of space allocated for the subdomain account (default 2KB). */
    space?: number;
  },
): Promise<TransactionInstruction[]> {
  if (!/^[a-z0-9-]{1,32}$/.test(params.subdomain)) {
    throw new Error("subdomain must be 1–32 lowercase letters, digits, or hyphens");
  }
  const fullSubdomain = fullSubdomainName(params.parentDomain, params.subdomain);
  return await createSubdomain(
    connection,
    fullSubdomain,
    params.owner,
    params.space ?? 2_000,
    params.feePayer ?? params.payer,
  );
}

export function fullSubdomainName(parentDomain: string, sub: string): string {
  const parent = parentDomain.endsWith(".sol") ? parentDomain : `${parentDomain}.sol`;
  return `${sub}.${parent}`;
}
