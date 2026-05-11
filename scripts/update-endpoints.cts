// scripts/update-endpoints.cts
//
// Quick fix: the original seed used placeholder URLs like
// `https://swap-bot.snsip.dev/mcp` for the agent.endpoint records.
// `snsip.dev` doesn't resolve in DNS, so any judge clicking the
// endpoint link on the agent profile gets a DNS error page.
//
// Update each demo agent's agent.endpoint to a URL that actually
// resolves — its own profile page on the deployed dApp. Honest:
// "where do you talk to this agent?" → "here's the page that
// describes how to talk to it via MCP."
//
// Usage:  pnpm tsx scripts/update-endpoints.cts

/* eslint-disable @typescript-eslint/no-explicit-any */

const {
  Connection,
  Keypair,
  Transaction,
  SystemProgram,
  ComputeBudgetProgram,
} = require("@solana/web3.js");
const {
  editRecordInstruction,
  allocateAndPostRecordInstruction,
  SNS_RECORD_ID_DEVNET,
  CENTRAL_STATE_SNS_RECORDS_DEVNET,
} = require("@bonfida/sns-records");
const {
  devnet,
  getHashedNameSync,
  getNameAccountKeySync,
  NAME_PROGRAM_ID,
} = require("@bonfida/spl-name-service");
const fs = require("node:fs");
const path = require("node:path");

const WALLET_PATH = path.join(process.cwd(), ".local", "devnet-wallet.json");
const RPC = "https://api.devnet.solana.com";
const BASE = "https://snsip-cc5.pages.dev";

const AGENTS = [
  "snsip-test-001",
  "swap-bot",
  "monitor",
  "auditor",
  "arb-trader",
];

function loadWallet(): any {
  const raw = JSON.parse(fs.readFileSync(WALLET_PATH, "utf8"));
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

function devnetGetDomainKey(d: string) {
  return devnet.utils.getDomainKeySync(d);
}

function devnetGetRecordV2Key(d: string, recordKey: string) {
  const { pubkey: domainPubkey } = devnet.utils.getDomainKeySync(d);
  const hashed = getHashedNameSync(`\x02${recordKey}`);
  return getNameAccountKeySync(hashed, CENTRAL_STATE_SNS_RECORDS_DEVNET, domainPubkey);
}

async function sendAndPollConfirm(
  conn: any,
  tx: any,
  signers: any[],
  { timeoutMs = 60_000, pollMs = 1500 }: { timeoutMs?: number; pollMs?: number } = {},
): Promise<string> {
  const sig = await conn.sendTransaction(tx, signers, { skipPreflight: false });
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, pollMs));
    const status = await conn.getSignatureStatus(sig).catch(() => null);
    const v = status?.value;
    if (v?.err) throw new Error(`tx ${sig} failed: ${JSON.stringify(v.err)}`);
    if (v?.confirmationStatus === "confirmed" || v?.confirmationStatus === "finalized") return sig;
  }
  throw new Error(`tx ${sig} not confirmed within ${timeoutMs}ms`);
}

async function main() {
  const conn = new Connection(RPC, "confirmed");
  const wallet = loadWallet();
  console.log(`[update-endpoints] wallet = ${wallet.publicKey.toBase58()}`);
  console.log(`[update-endpoints] base = ${BASE}`);

  for (const name of AGENTS) {
    const domain = `${name}.sol`;
    const newEndpoint = `${BASE}/agents/?domain=${domain}`;
    process.stdout.write(`[update-endpoints] ${domain} → ${newEndpoint} ... `);

    const recordPubkey = devnetGetRecordV2Key(domain, "agent.endpoint");
    const parent = devnetGetDomainKey(domain).pubkey;
    const exists = (await conn.getAccountInfo(recordPubkey)) !== null;
    const prefixedKey = `\x02agent.endpoint`;
    const content = Buffer.from(newEndpoint, "utf-8");

    const InstrClass = exists ? editRecordInstruction : allocateAndPostRecordInstruction;
    const ix = new InstrClass({
      record: prefixedKey,
      content: Array.from(content),
    }).getInstruction(
      SNS_RECORD_ID_DEVNET,
      SystemProgram.programId,
      NAME_PROGRAM_ID,
      wallet.publicKey,
      recordPubkey,
      parent,
      wallet.publicKey,
      CENTRAL_STATE_SNS_RECORDS_DEVNET,
    );

    const tx = new Transaction()
      .add(ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }))
      .add(ix);
    const { blockhash } = await conn.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = wallet.publicKey;
    try {
      const sig = await sendAndPollConfirm(conn, tx, [wallet]);
      console.log(`tx=${sig.slice(0, 24)}…`);
    } catch (e) {
      console.error(`FAILED: ${(e as Error).message}`);
    }
  }

  console.log("[update-endpoints] done.");
}

main().catch((e) => {
  console.error("fatal:", e);
  process.exit(1);
});
