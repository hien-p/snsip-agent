#!/usr/bin/env node
// SNSIP-Agent MCP server — exposes .sol agent identity + permission tools
// to any MCP client (Claude Desktop, Cursor, etc.).
//
// Tools:
//   sns_resolve_identity  — pull all SNSIP records for a .sol
//   sns_check_permission  — gate a proposed call against agent.capabilities
//   sns_list_agents       — every .sol owned by a wallet (devnet)
//   sns_sign_in_with_sol  — verify a signed challenge against the on-chain owner
//
// Cluster: defaults to devnet (where the demo agents live). Override with
// `SNSIP_CLUSTER=mainnet` or `SNSIP_RPC=<url>` in env.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import {
  getAgentActivitySnapshot,
  isActive,
  listOwnedDomains,
  parsePermission,
  permitsCall,
  readRecordV2,
  resolveDomainOwner,
  spendCapFor,
  type AgentPermission,
} from "@snsip/agent-sdk";

// ─── Connection setup ───────────────────────────────────────────

const cluster = (process.env.SNSIP_CLUSTER ?? "devnet") as "devnet" | "mainnet-beta";
const rpcUrl = process.env.SNSIP_RPC ?? clusterApiUrl(cluster);
const connection = new Connection(rpcUrl, "confirmed");

// ─── Helpers ────────────────────────────────────────────────────

function ensureSolSuffix(name: string): string {
  return name.endsWith(".sol") ? name.toLowerCase() : `${name.toLowerCase()}.sol`;
}

interface IdentitySnapshot {
  domain: string;
  cluster: string;
  rpc: string;
  owner: string | null;
  signingPubkey: string | null;
  endpoint: string | null;
  controller: string | null;
  avatar: string | null;
  attestations: string | null;
  capabilities: AgentPermission | null;
  capabilitiesRaw: string | null;
  hasIdentity: boolean;
}

async function loadIdentity(domain: string): Promise<IdentitySnapshot> {
  const norm = ensureSolSuffix(domain);
  const [
    ownerKey,
    signingPubkey,
    endpoint,
    controller,
    avatar,
    attestations,
    capabilitiesRaw,
  ] = await Promise.all([
    resolveDomainOwner(connection, norm).catch((e) => {
      console.error(`[snsip-mcp] resolveDomainOwner(${norm}) failed:`, (e as Error).message);
      return null;
    }),
    readRecordV2(connection, norm, "agent.signing-pubkey").catch((e) => {
      console.error(`[snsip-mcp] read agent.signing-pubkey ${norm}:`, (e as Error).message);
      return null;
    }),
    readRecordV2(connection, norm, "agent.endpoint").catch((e) => {
      console.error(`[snsip-mcp] read agent.endpoint ${norm}:`, (e as Error).message);
      return null;
    }),
    readRecordV2(connection, norm, "agent.controller").catch((e) => {
      console.error(`[snsip-mcp] read agent.controller ${norm}:`, (e as Error).message);
      return null;
    }),
    readRecordV2(connection, norm, "avatar").catch((e) => {
      console.error(`[snsip-mcp] read avatar ${norm}:`, (e as Error).message);
      return null;
    }),
    readRecordV2(connection, norm, "agent.attestations").catch((e) => {
      console.error(`[snsip-mcp] read agent.attestations ${norm}:`, (e as Error).message);
      return null;
    }),
    readRecordV2(connection, norm, "agent.capabilities").catch((e) => {
      console.error(`[snsip-mcp] read agent.capabilities ${norm}:`, (e as Error).message);
      return null;
    }),
  ]);

  let capabilities: AgentPermission | null = null;
  if (capabilitiesRaw) {
    try {
      const json = capabilitiesRaw.replace(/^data:application\/json,/, "");
      capabilities = parsePermission(json);
    } catch {
      // leave null
    }
  }

  const hasIdentity = !!(signingPubkey || endpoint || capabilities);

  return {
    domain: norm,
    cluster,
    rpc: rpcUrl,
    owner: ownerKey?.toBase58() ?? null,
    signingPubkey,
    endpoint,
    controller,
    avatar,
    attestations,
    capabilities,
    capabilitiesRaw,
    hasIdentity,
  };
}

function asJsonContent(payload: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

// ─── Server ─────────────────────────────────────────────────────

const server = new McpServer({
  name: "snsip-agent",
  version: "0.1.0",
});

// Tool 1: sns_resolve_identity
server.registerTool(
  "sns_resolve_identity",
  {
    title: "Resolve a .sol agent identity",
    description:
      "Look up everything published on-chain about a .sol agent: owner wallet, signing pubkey, endpoint, controller, avatar, attestations, and the parsed permission grant. Returns hasIdentity:false if the domain has no SNSIP records.",
    inputSchema: {
      domain: z
        .string()
        .min(1)
        .describe("The .sol name (with or without the .sol suffix). e.g. \"swap-bot.sol\""),
    },
  },
  async ({ domain }) => {
    const snap = await loadIdentity(domain);
    return asJsonContent(snap);
  },
);

// Tool 2: sns_check_permission
server.registerTool(
  "sns_check_permission",
  {
    title: "Check whether an agent's permission allows a proposed call",
    description:
      "Read agent.capabilities for the .sol and run the standard SNSIP gate: permission active, target program in calls, token mint covered by spend cap, requested amount within cap. Returns a structured allow/deny verdict with the reason.",
    inputSchema: {
      domain: z.string().describe("The agent's .sol (e.g. \"swap-bot.sol\")"),
      target: z
        .string()
        .describe(
          "Base58 program ID the agent would call (e.g. \"JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4\" for Jupiter)",
        ),
      mint: z
        .string()
        .optional()
        .describe(
          "Optional SPL mint of the token being moved (e.g. \"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v\" for USDC)",
        ),
      amountRaw: z
        .string()
        .optional()
        .describe(
          "Optional requested amount in token base units (string to avoid number precision loss). Required if `mint` provided.",
        ),
      selector: z
        .string()
        .optional()
        .describe("Optional method/instruction selector (hex string) for finer-grained gating"),
    },
  },
  async ({ domain, target, mint, amountRaw, selector }) => {
    const snap = await loadIdentity(domain);
    if (!snap.capabilities) {
      return asJsonContent({
        allowed: false,
        reason: "agent has no agent.capabilities record on-chain",
        domain: snap.domain,
        cluster: snap.cluster,
      });
    }

    const perm = snap.capabilities;
    const reasons: string[] = [];

    if (!isActive(perm)) reasons.push("permission expired or not yet started");
    const callOk = permitsCall(perm, target, selector);
    if (!callOk) reasons.push(`target ${target} not in agent.calls`);

    let capRaw: bigint | null = null;
    let withinCap = true;
    if (mint) {
      const cap = spendCapFor(perm, mint);
      if (!cap) {
        reasons.push(`no spend cap for mint ${mint}`);
        withinCap = false;
      } else {
        try {
          capRaw = BigInt(cap.allowance);
        } catch {
          reasons.push(`spend cap allowance not a valid integer: ${cap.allowance}`);
          withinCap = false;
        }
        if (capRaw !== null && amountRaw !== undefined) {
          let req: bigint;
          try {
            req = BigInt(amountRaw);
          } catch {
            reasons.push(`amountRaw not a valid integer: ${amountRaw}`);
            req = -1n;
          }
          if (req >= 0n && req > capRaw) {
            reasons.push(`requested ${req} > cap ${capRaw} (raw units)`);
            withinCap = false;
          }
        }
      }
    }

    const allowed = reasons.length === 0;
    return asJsonContent({
      allowed,
      reason: allowed ? "all checks passed" : reasons.join("; "),
      domain: snap.domain,
      permissionLabel: perm.label,
      expiresAt: perm.expiresAt ?? null,
      callAllowed: callOk,
      capRaw: capRaw?.toString() ?? null,
      withinCap,
      cluster: snap.cluster,
    });
  },
);

// Tool 3: sns_list_agents
server.registerTool(
  "sns_list_agents",
  {
    title: "List every .sol owned by a wallet",
    description:
      "Scans on-chain for all SNS domains owned by the given wallet. Returns the domain names plus a one-line summary of which ones have SNSIP-Agent identity records published.",
    inputSchema: {
      wallet: z.string().describe("Base58 wallet pubkey"),
      withIdentityOnly: z
        .boolean()
        .optional()
        .default(false)
        .describe("If true, only return domains that publish SNSIP records"),
    },
  },
  async ({ wallet, withIdentityOnly }) => {
    let owner: PublicKey;
    try {
      owner = new PublicKey(wallet);
    } catch {
      return asJsonContent({ error: `Invalid wallet pubkey: ${wallet}` });
    }
    const domains = await listOwnedDomains(connection, owner);
    const summaries = await Promise.all(
      domains.map(async (d) => {
        const sig = await readRecordV2(connection, d, "agent.signing-pubkey").catch(() => null);
        const endpoint = await readRecordV2(connection, d, "agent.endpoint").catch(() => null);
        return {
          domain: d,
          hasIdentity: !!(sig || endpoint),
          signingPubkey: sig,
          endpoint,
        };
      }),
    );
    const filtered = withIdentityOnly ? summaries.filter((s) => s.hasIdentity) : summaries;
    return asJsonContent({
      wallet: owner.toBase58(),
      cluster,
      total: domains.length,
      withIdentity: summaries.filter((s) => s.hasIdentity).length,
      domains: filtered,
    });
  },
);

// Tool 4: sns_sign_in_with_sol
server.registerTool(
  "sns_sign_in_with_sol",
  {
    title: "Verify a Sign-in-with-.sol challenge",
    description:
      "Verifies (a) the wallet owns the .sol on-chain, AND (b) the wallet's Ed25519 signature over the challenge bytes is valid. Use to drop SNSIP login into any MCP-aware app.",
    inputSchema: {
      domain: z.string().describe("The .sol the user claims to own"),
      walletPubkey: z.string().describe("Base58 wallet pubkey that signed the challenge"),
      challenge: z
        .string()
        .describe(
          "The exact UTF-8 challenge string the user signed (must include a fresh nonce in production)",
        ),
      signatureBase58: z.string().describe("Ed25519 signature, base58-encoded"),
    },
  },
  async ({ domain, walletPubkey, challenge, signatureBase58 }) => {
    const norm = ensureSolSuffix(domain);
    let wallet: PublicKey;
    try {
      const decoded = bs58.decode(walletPubkey);
      if (decoded.length !== 32) {
        return asJsonContent({
          verified: false,
          reason: `walletPubkey must decode to exactly 32 bytes (got ${decoded.length})`,
        });
      }
      wallet = new PublicKey(walletPubkey);
    } catch {
      return asJsonContent({ verified: false, reason: "walletPubkey is not valid base58" });
    }

    // 1. On-chain ownership
    const owner = await resolveDomainOwner(connection, norm).catch(() => null);
    if (!owner) {
      return asJsonContent({
        verified: false,
        reason: `no on-chain SNS record found for ${norm}`,
        domain: norm,
      });
    }
    if (owner.toBase58() !== wallet.toBase58()) {
      return asJsonContent({
        verified: false,
        reason: `wallet does not own ${norm}`,
        domain: norm,
        onChainOwner: owner.toBase58(),
        claimedBy: wallet.toBase58(),
      });
    }

    // 2. Signature validity
    let sigBytes: Uint8Array;
    try {
      sigBytes = bs58.decode(signatureBase58);
    } catch {
      return asJsonContent({ verified: false, reason: "signatureBase58 not valid base58" });
    }
    if (sigBytes.length !== 64) {
      return asJsonContent({
        verified: false,
        reason: `signature must be exactly 64 bytes (got ${sigBytes.length})`,
      });
    }
    const challengeBytes = new TextEncoder().encode(challenge);
    const sigOk = nacl.sign.detached.verify(challengeBytes, sigBytes, wallet.toBytes());
    if (!sigOk) {
      return asJsonContent({
        verified: false,
        reason: "signature does not verify against challenge + wallet pubkey",
        domain: norm,
      });
    }

    return asJsonContent({
      verified: true,
      domain: norm,
      wallet: wallet.toBase58(),
      cluster,
    });
  },
);

// Tool 5: sns_agent_activity (Dune SIM-powered)
//
// SVM endpoints on SIM are mainnet-only as of beta. Pass `walletOverride`
// to query a specific mainnet wallet — typical use: pass the wallet
// reported by sns_resolve_identity to get its real-world activity.
server.registerTool(
  "sns_agent_activity",
  {
    title: "Agent live activity (Dune SIM)",
    description:
      "Returns recent on-chain activity for an agent's wallet via Dune SIM: 30-day tx count, last-seen timestamp, total USD held, top token holdings. SIM SVM is mainnet-only — pass `walletOverride` to query any mainnet wallet, otherwise the agent's on-chain owner is used. Requires SIM_API_KEY env var.",
    inputSchema: {
      domain: z.string().optional().describe("The agent's .sol (used to resolve the owner wallet if no override)"),
      walletOverride: z.string().optional().describe("Base58 mainnet wallet to query directly (skip the .sol lookup)"),
    },
  },
  async ({ domain, walletOverride }) => {
    const apiKey = process.env.SIM_API_KEY;
    if (!apiKey) {
      return asJsonContent({
        error: "SIM_API_KEY not set in MCP server env. Get one at https://sim.dune.com.",
        hint: "Add `\"env\": { \"SIM_API_KEY\": \"...\" }` to your claude_desktop_config.json",
      });
    }

    let wallet = walletOverride;
    if (!wallet) {
      if (!domain) {
        return asJsonContent({ error: "Pass either `domain` or `walletOverride`." });
      }
      const owner = await resolveDomainOwner(connection, domain).catch(() => null);
      if (!owner) {
        return asJsonContent({
          error: `Could not resolve owner for ${domain}. Pass walletOverride directly or check the domain.`,
        });
      }
      wallet = owner.toBase58();
    }

    try {
      const snapshot = await getAgentActivitySnapshot(wallet, { apiKey });
      return asJsonContent({
        wallet: snapshot.wallet,
        chain: "solana-mainnet (SIM)",
        txCount30d: snapshot.txCount30d,
        lastSeen:
          snapshot.lastSeenSecondsAgo !== null
            ? `${Math.round(snapshot.lastSeenSecondsAgo / 60)} minutes ago`
            : "never",
        totalUsdHeld: Number(snapshot.totalUsdHeld.toFixed(2)),
        topTokens: snapshot.topTokens,
        sourcedFrom: "Dune SIM · /beta/svm/{balances,transactions}",
        note:
          domain && !walletOverride
            ? `Resolved owner of ${domain} on devnet, queried activity on Solana mainnet (SIM does not support devnet).`
            : undefined,
      });
    } catch (e) {
      return asJsonContent({
        error: (e as Error).message,
        wallet,
        hint: "If this is a 401, check SIM_API_KEY. If 404, the wallet may have no mainnet activity.",
      });
    }
  },
);

// ─── Boot ───────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stderr only — stdout is the MCP transport channel
  console.error(`[snsip-mcp] listening on stdio · cluster=${cluster} · rpc=${rpcUrl}`);
}

main().catch((err) => {
  console.error("[snsip-mcp] fatal:", err);
  process.exit(1);
});
