// scripts/seed-agent-records.cts
//
// Writes the 5 canonical SNSIP-Agent records on a real on-chain `.sol`
// (defaults to snsip-test-001.sol that we registered earlier).
//
// Records written:
//   - agent.controller       (the wallet that controls the agent)
//   - agent.signing-pubkey   (Ed25519 pubkey, freshly generated and stashed)
//   - agent.endpoint         (MCP / A2A URL)
//   - agent.capabilities     (data:application/json,<permission JSON>)
//   - avatar                 (image URL)
//
// CommonJS to bypass an upstream borsh ESM export mismatch in
// @bonfida/spl-name-service's ESM bundle.
//
// Usage:
//   pnpm tsx scripts/seed-agent-records.cts                       # defaults to snsip-test-001.sol
//   pnpm tsx scripts/seed-agent-records.cts <domain>              # custom domain

/* eslint-disable @typescript-eslint/no-explicit-any */

const {
  Connection,
  Keypair,
  Transaction,
  PublicKey,
  sendAndConfirmTransaction,
  ComputeBudgetProgram,
} = require("@solana/web3.js");
const {
  // The wrapper helpers (`allocateAndPostRecord`, `editRecord`) hardcode the
  // mainnet central-state account. Call the underlying instruction classes
  // directly so we can pass the DEVNET central-state and program ID.
  allocateAndPostRecordInstruction,
  editRecordInstruction,
  SNS_RECORD_ID_DEVNET,
  CENTRAL_STATE_SNS_RECORDS_DEVNET,
} = require("@bonfida/sns-records");
const { SystemProgram } = require("@solana/web3.js");
const {
  // devnet uses a DIFFERENT ROOT_DOMAIN_ACCOUNT, so the mainnet
  // `getDomainKeySync` and `getRecordV2Key` derive the wrong PDAs. Use
  // `devnet.utils.getDomainKeySync` and replicate `getRecordV2Key` manually.
  devnet,
  getHashedNameSync,
  getNameAccountKeySync,
  NAME_PROGRAM_ID,
} = require("@bonfida/spl-name-service");

const devnetGetDomainKey = (d: string) => devnet.utils.getDomainKeySync(d);
const devnetGetRecordV2Key = (d: string, recordKey: string) => {
  const { pubkey: domainPubkey } = devnet.utils.getDomainKeySync(d);
  const hashed = getHashedNameSync(`\x02${recordKey}`);
  return getNameAccountKeySync(hashed, CENTRAL_STATE_SNS_RECORDS_DEVNET, domainPubkey);
};
const nacl = require("tweetnacl");
const bs58 = require("bs58").default ?? require("bs58");
const fs = require("node:fs");
const path = require("node:path");

const WALLET_PATH = path.join(process.cwd(), ".local", "devnet-wallet.json");
const RPC = "https://api.devnet.solana.com";

function loadWallet(): any {
  if (!fs.existsSync(WALLET_PATH)) {
    console.error(`✗ no wallet at ${WALLET_PATH}`);
    console.error(`  run: pnpm tsx scripts/register-devnet-domain.cts <name>  first`);
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(WALLET_PATH, "utf8")) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

function saveAgentKey(domain: string, secretKeyBase58: string): string {
  const file = path.join(process.cwd(), ".local", `agent-${domain}.json`);
  fs.writeFileSync(
    file,
    JSON.stringify({ domain, secretKeyBase58, createdAt: Date.now() }, null, 2),
  );
  return file;
}

async function buildWriteIx(
  conn: any,
  domain: string,
  recordKey: string,
  value: string,
  payer: any,
  domainOwner: any,
) {
  const recordPubkey = devnetGetRecordV2Key(domain, recordKey);
  const parent = devnetGetDomainKey(domain).pubkey;
  const exists = (await conn.getAccountInfo(recordPubkey)) !== null;

  const prefixedKey = `\x02${recordKey}`;
  const content = Buffer.from(value, "utf-8");

  // Account order from sns-records source (record_v2 program ABI):
  //   key 0: SystemProgram
  //   key 1: SNS NAME program (parent name service)
  //   key 2: payer (signer + writable)
  //   key 3: record account PDA (writable)
  //   key 4: parent SNS account (writable)
  //   key 5: domain owner (signer + writable)
  //   key 6: central state PDA  ← MUST be devnet variant on devnet
  const InstrClass = exists ? editRecordInstruction : allocateAndPostRecordInstruction;
  return new InstrClass({
    record: prefixedKey,
    content: Array.from(content),
  }).getInstruction(
    SNS_RECORD_ID_DEVNET,             // programId
    SystemProgram.programId,          // key 0
    NAME_PROGRAM_ID,                  // key 1
    payer,                            // key 2 (signer)
    recordPubkey,                     // key 3
    parent,                           // key 4
    domainOwner,                      // key 5 (signer)
    CENTRAL_STATE_SNS_RECORDS_DEVNET, // key 6 — the fix
  );
}

async function main() {
  const domain = process.argv[2] ?? "snsip-test-001.sol";
  const normalized = domain.endsWith(".sol") ? domain : `${domain}.sol`;
  const labelOnly = normalized.replace(/\.sol$/, "");

  const conn = new Connection(RPC, "confirmed");
  const wallet = loadWallet();
  console.log(`→ wallet: ${wallet.publicKey.toBase58()}`);
  console.log(`→ domain: ${normalized}`);

  // Generate a fresh agent signing keypair (separate from the wallet)
  const agentKp = nacl.sign.keyPair();
  const agentPubkeyBase58 = bs58.encode(agentKp.publicKey);
  const agentSecretKeyBase58 = bs58.encode(agentKp.secretKey);
  const agentKeyFile = saveAgentKey(normalized, agentSecretKeyBase58);
  console.log(`✓ generated agent signing key`);
  console.log(`  pubkey: ${agentPubkeyBase58}`);
  console.log(`  saved:  ${agentKeyFile}`);

  // Structured permission JSON, mirroring ENSign's Permission shape on Solana.
  const parentSnsAccount = devnetGetDomainKey(normalized).pubkey.toBase58();
  const permission = {
    v: 1,
    agent: agentPubkeyBase58,
    parent: parentSnsAccount,
    label: labelOnly,
    expiresAt: Math.floor(Date.now() / 1000) + 30 * 86_400, // 30 days
    calls: [
      { target: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4" }, // Jupiter v6 (wildcard)
      { target: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" }, // SPL Token (wildcard)
    ],
    spends: [
      {
        mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC mainnet (string, not enforced on devnet)
        allowance: "100000000", // 100 USDC (6 decimals)
        periodSeconds: 86_400,
      },
    ],
  };

  const records: Array<[string, string]> = [
    ["agent.controller", wallet.publicKey.toBase58()],
    ["agent.signing-pubkey", agentPubkeyBase58],
    ["agent.endpoint", "https://snsip.dev/mcp"],
    ["agent.capabilities", `data:application/json,${JSON.stringify(permission)}`],
    ["avatar", "https://avatars.githubusercontent.com/u/87125747?v=4"],
  ];

  console.log(`\n→ writing ${records.length} records on ${normalized}…\n`);
  const explorerLinks: string[] = [];

  for (const [key, value] of records) {
    try {
      const ix = await buildWriteIx(
        conn,
        normalized,
        key,
        value,
        wallet.publicKey,
        wallet.publicKey,
      );
      const tx = new Transaction()
        .add(ComputeBudgetProgram.setComputeUnitLimit({ units: 600_000 }))
        .add(ix);
      const sig = await sendAndConfirmTransaction(conn, tx, [wallet], {
        commitment: "confirmed",
      });
      const valuePreview = value.length > 60 ? value.slice(0, 57) + "…" : value;
      console.log(`  ✓ ${key.padEnd(24)} ${valuePreview}`);
      console.log(`    tx: https://explorer.solana.com/tx/${sig}?cluster=devnet`);
      explorerLinks.push(`${key}: https://explorer.solana.com/tx/${sig}?cluster=devnet`);
    } catch (e) {
      console.error(`  ✗ ${key.padEnd(24)} ${(e as Error).message}`);
      process.exit(1);
    }
  }

  console.log(`\n✓ all 5 records set on ${normalized}`);
  console.log(`\nView live:`);
  console.log(`  https://snsip-cc5.pages.dev/agents/?domain=${normalized}`);
}

void main();
