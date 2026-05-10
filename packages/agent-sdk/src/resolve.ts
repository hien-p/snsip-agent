import { PublicKey, type Connection } from "@solana/web3.js";
import {
  resolve as snsResolve,
  getAllDomains,
  getDomainKeySync,
  reverseLookup,
  devnet,
} from "@bonfida/spl-name-service";

// Devnet uses a different REVERSE_LOOKUP_CLASS than mainnet — the
// mainnet `reverseLookup` throws when called against devnet name
// accounts. Use the devnet-specific helper when the connection is
// pointed at devnet.
function isDevnet(connection: Connection): boolean {
  const ep = connection.rpcEndpoint;
  return ep.includes("devnet") || ep.includes("magicblock");
}

import {
  agentRegistrationKey,
  parseAgentRegistrationKey,
  RECORD_AGENT_CAPABILITIES,
  RECORD_AGENT_CONTROLLER,
  RECORD_AGENT_ENDPOINT,
  RECORD_AGENT_SIGNING_PUBKEY,
  RECORD_AGENT_ATTESTATIONS,
  RECORD_AVATAR,
} from "./record-keys.js";
import type { AgentRecords, ResolvedAgent } from "./types.js";
import { readRecordV2 } from "./records.js";

// listOwnedDomains: every .sol owned by `wallet`, resolved to readable strings.
export async function listOwnedDomains(
  connection: Connection,
  wallet: PublicKey | string,
): Promise<string[]> {
  const owner = typeof wallet === "string" ? new PublicKey(wallet) : wallet;
  const useDevnet = isDevnet(connection);

  let keys: PublicKey[];
  if (useDevnet) {
    // Bonfida's getAllDomains filters by `parent_name == mainnet ROOT_DOMAIN_ACCOUNT`,
    // which excludes devnet domains (different root). Run our own
    // getProgramAccounts with the devnet root.
    const accounts = await connection.getProgramAccounts(
      devnet.constants.NAME_PROGRAM_ID,
      {
        filters: [
          { memcmp: { offset: 32, bytes: owner.toBase58() } },
          { memcmp: { offset: 0, bytes: devnet.constants.ROOT_DOMAIN_ACCOUNT.toBase58() } },
        ],
        dataSlice: { offset: 0, length: 0 },
      },
    );
    keys = accounts.map((a) => a.pubkey);
  } else {
    keys = await getAllDomains(connection, owner);
  }

  const lookup = useDevnet ? devnet.utils.reverseLookup : reverseLookup;
  const names = await Promise.all(
    keys.map(async (k) => {
      try {
        const name = await lookup(connection, k);
        return ensureSolSuffix(name);
      } catch {
        return null;
      }
    }),
  );
  return names.filter((n): n is string => Boolean(n));
}

function ensureSolSuffix(name: string): string {
  // Lowercase first — SNS hashes the bytes, so callers passing "Alice.SOL"
  // and "alice.sol" must derive the same on-chain account. Match the
  // normalization the MCP server applies in loadIdentity().
  const lower = name.toLowerCase();
  return lower.endsWith(".sol") ? lower : `${lower}.sol`;
}

// resolveDomainOwner: SNS owner of a domain string.
//
// Bonfida's `resolve` derives the domain account using the *mainnet*
// ROOT_DOMAIN_ACCOUNT and SNS program ID, so it silently returns garbage
// (or throws) on devnet. For devnet connections we derive against the
// devnet root and read the owner field directly from the NameRecord
// header (offset 32, length 32).
//
// Tokenized domains on devnet are not yet a concern for our demo, so we
// keep this simple — extend if we ever burn a domain into an NFT.
export async function resolveDomainOwner(
  connection: Connection,
  domain: string,
): Promise<PublicKey> {
  if (!isDevnet(connection)) {
    return snsResolve(connection, domain);
  }
  const { pubkey } = devnet.utils.getDomainKeySync(domain);
  const acct = await connection.getAccountInfo(pubkey);
  if (!acct) {
    throw new Error(`SNS account not found on devnet for ${domain}`);
  }
  // NameRecordHeader layout: parent_name (32) + owner (32) + class (32) + ...
  const ownerBytes = acct.data.subarray(32, 64);
  return new PublicKey(ownerBytes);
}

// getDomainPubkey: derive the on-chain SNS account for a domain.
export function getDomainPubkey(domain: string): PublicKey {
  return getDomainKeySync(domain).pubkey;
}

// resolveAgent: read the SNSIP-Agent identity bound to `domain`, if any.
//
// Reads:
//   - agent-registration[…] records v2 (the canonical binding)
//   - agent.controller, agent.signing-pubkey, agent.endpoint,
//     agent.capabilities, agent.attestations, avatar
//
// Returns null if no `agent-registration[…]` record is set.
export async function resolveAgent(
  connection: Connection,
  domain: string,
): Promise<ResolvedAgent | null> {
  const records = await readAgentRecords(connection, domain);
  if (!records.agentRegistration) return null;

  return {
    domain,
    registry: records.agentRegistration.registry,
    agentId: records.agentRegistration.agentId,
    records,
  };
}

async function readAgentRecords(
  connection: Connection,
  domain: string,
): Promise<AgentRecords> {
  const auxKeys = [
    RECORD_AGENT_CONTROLLER,
    RECORD_AGENT_SIGNING_PUBKEY,
    RECORD_AGENT_ENDPOINT,
    RECORD_AGENT_CAPABILITIES,
    RECORD_AGENT_ATTESTATIONS,
    RECORD_AVATAR,
  ] as const;

  const [auxValues, agentRegistration] = await Promise.all([
    Promise.all(auxKeys.map((k) => readRecordV2(connection, domain, k).catch(() => null))),
    findAgentRegistrationRecord(connection, domain),
  ]);

  return {
    agentRegistration,
    controller: auxValues[0] ?? undefined,
    signingPubkey: auxValues[1] ?? undefined,
    endpoint: auxValues[2] ?? undefined,
    capabilities: auxValues[3] ?? undefined,
    attestations: auxValues[4]
      ? auxValues[4].split(",").map((s) => s.trim()).filter(Boolean)
      : undefined,
    avatar: auxValues[5] ?? undefined,
  };
}

// findAgentRegistrationRecord: look for the canonical `agent-registration[…]`
// binding record on `domain`.
//
// The challenge: the key contains the registry program ID and agent ID, so
// we cannot read it without knowing them upfront. Strategies:
//
//   - Day 1 (now): read against a small set of *candidate registries*
//     known to the dApp config. Returns the first non-empty match.
//   - Day 2+: replace with an indexed lookup once the Identity Registry
//     program is deployed and we maintain a `domain_hash → agentId`
//     reverse index on-chain.
//
// To extend: pass `KNOWN_REGISTRIES` from app config (an env var or a
// deployed registry constant).
const KNOWN_REGISTRIES: string[] = [
  // Identity Registry program ID — populated once `anchor keys sync` runs.
  // "RegistryReplaceMe111111111111111111111111111",
];

const MAX_AGENT_ID_PROBE = 16; // probe agentId 0..N-1 per registry on D1

async function findAgentRegistrationRecord(
  connection: Connection,
  domain: string,
): Promise<AgentRecords["agentRegistration"]> {
  for (const registry of KNOWN_REGISTRIES) {
    for (let id = 0n; id < BigInt(MAX_AGENT_ID_PROBE); id++) {
      const key = agentRegistrationKey(registry, id);
      const value = await readRecordV2(connection, domain, key);
      if (value) {
        return { registry, agentId: id, value };
      }
    }
  }
  void parseAgentRegistrationKey; // keep import alive for future use
  return null;
}
