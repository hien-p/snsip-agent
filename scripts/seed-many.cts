// scripts/seed-many.cts
//
// Register multiple .sol domains on devnet AND populate them with the 5
// canonical SNSIP-Agent records. Idempotent: skips registration if the
// domain already exists; uses `editRecord` if records already exist.
//
// Usage:
//   pnpm tsx scripts/seed-many.cts                              # default personas
//   pnpm tsx scripts/seed-many.cts swap-bot monitor auditor    # custom names

/* eslint-disable @typescript-eslint/no-explicit-any */

const {
  Connection,
  Keypair,
  Transaction,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  ComputeBudgetProgram,
} = require("@solana/web3.js");

// Public devnet RPC keeps closing the WebSocket subscription used by
// sendAndConfirmTransaction. Replace the confirmation step with HTTP
// polling — same end result, no flaky WS dependency.
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
    try {
      const status = await conn.getSignatureStatus(sig, { searchTransactionHistory: false });
      const v = status?.value;
      if (v?.err) throw new Error(`tx ${sig} failed: ${JSON.stringify(v.err)}`);
      if (v?.confirmationStatus === "confirmed" || v?.confirmationStatus === "finalized") return sig;
    } catch (e) {
      // network blip; keep polling
    }
  }
  throw new Error(`tx ${sig} not confirmed within ${timeoutMs}ms`);
}
const {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
  createSyncNativeInstruction,
  NATIVE_MINT,
} = require("@solana/spl-token");
const {
  allocateAndPostRecordInstruction,
  editRecordInstruction,
  SNS_RECORD_ID_DEVNET,
  CENTRAL_STATE_SNS_RECORDS_DEVNET,
} = require("@bonfida/sns-records");
const {
  devnet,
  getHashedNameSync,
  getNameAccountKeySync,
  NAME_PROGRAM_ID,
} = require("@bonfida/spl-name-service");
const nacl = require("tweetnacl");
const bs58 = require("bs58").default ?? require("bs58");
const fs = require("node:fs");
const path = require("node:path");

const WALLET_PATH = path.join(process.cwd(), ".local", "devnet-wallet.json");
const RPC = "https://api.devnet.solana.com";

interface Persona {
  name: string;     // bare label, e.g. "swap-bot"
  endpoint: string; // MCP/A2A URL
  avatar: string;
  description: string;
}

const DEFAULT_PERSONAS: Persona[] = [
  {
    name: "swap-bot",
    endpoint: "https://swap-bot.snsip.dev/mcp",
    avatar: "https://api.dicebear.com/9.x/identicon/svg?seed=swap-bot",
    description: "Jupiter route-finder agent",
  },
  {
    name: "monitor",
    endpoint: "https://monitor.snsip.dev/mcp",
    avatar: "https://api.dicebear.com/9.x/identicon/svg?seed=monitor",
    description: "On-chain observability",
  },
  {
    name: "auditor",
    endpoint: "https://auditor.snsip.dev/mcp",
    avatar: "https://api.dicebear.com/9.x/identicon/svg?seed=auditor",
    description: "Validation registry attestor",
  },
  {
    name: "arb-trader",
    endpoint: "https://arb.snsip.dev/mcp",
    avatar: "https://api.dicebear.com/9.x/identicon/svg?seed=arb-trader",
    description: "Cross-DEX arbitrage",
  },
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

async function ensureWrappedSol(conn: any, payer: any, lamports: number) {
  const wsolAta = getAssociatedTokenAddressSync(NATIVE_MINT, payer.publicKey);
  const info = await conn.getAccountInfo(wsolAta);
  // Top up only if balance is below the wrap threshold
  const haveLamports = info?.lamports ?? 0;
  if (haveLamports >= lamports) return wsolAta;

  const tx = new Transaction();
  tx.add(
    createAssociatedTokenAccountIdempotentInstruction(
      payer.publicKey,
      wsolAta,
      payer.publicKey,
      NATIVE_MINT,
    ),
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: wsolAta,
      lamports,
    }),
    createSyncNativeInstruction(wsolAta),
  );
  await sendAndPollConfirm(conn, tx, [payer]);
  return wsolAta;
}

async function ensureRegistered(
  conn: any,
  wallet: any,
  name: string,
  wsolAta: any,
): Promise<boolean> {
  const fullName = `${name}.sol`;
  const { pubkey } = devnetGetDomainKey(fullName);
  const info = await conn.getAccountInfo(pubkey);
  if (info) {
    console.log(`  ✓ already registered: ${fullName}`);
    return true;
  }
  const ixs = await devnet.bindings.registerDomainNameV2(
    conn,
    name,
    1024,
    wallet.publicKey,
    wsolAta,
    NATIVE_MINT,
  );
  const tx = new Transaction()
    .add(ComputeBudgetProgram.setComputeUnitLimit({ units: 600_000 }))
    .add(...ixs);
  const sig = await sendAndPollConfirm(conn, tx, [wallet]);
  console.log(`  ✓ registered ${fullName}  tx=${sig.slice(0, 24)}…`);
  return true;
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

  const InstrClass = exists ? editRecordInstruction : allocateAndPostRecordInstruction;
  return new InstrClass({ record: prefixedKey, content: Array.from(content) }).getInstruction(
    SNS_RECORD_ID_DEVNET,
    SystemProgram.programId,
    NAME_PROGRAM_ID,
    payer,
    recordPubkey,
    parent,
    domainOwner,
    CENTRAL_STATE_SNS_RECORDS_DEVNET,
  );
}

async function seedRecords(conn: any, wallet: any, p: Persona) {
  const fullName = `${p.name}.sol`;
  const agentKp = nacl.sign.keyPair();
  const agentPubkeyBase58 = bs58.encode(agentKp.publicKey);
  const agentSecretKeyBase58 = bs58.encode(agentKp.secretKey);
  fs.writeFileSync(
    path.join(process.cwd(), ".local", `agent-${fullName}.json`),
    JSON.stringify({ domain: fullName, secretKeyBase58: agentSecretKeyBase58 }, null, 2),
  );

  const parentSnsAccount = devnetGetDomainKey(fullName).pubkey.toBase58();
  const permission = {
    v: 1,
    agent: agentPubkeyBase58,
    parent: parentSnsAccount,
    label: p.name,
    expiresAt: Math.floor(Date.now() / 1000) + 30 * 86_400,
    calls: [
      { target: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4" },
      { target: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
    ],
    spends: [
      {
        mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        allowance: "100000000",
        periodSeconds: 86_400,
      },
    ],
    description: p.description,
  };

  const records: Array<[string, string]> = [
    ["agent.controller", wallet.publicKey.toBase58()],
    ["agent.signing-pubkey", agentPubkeyBase58],
    ["agent.endpoint", p.endpoint],
    ["agent.capabilities", `data:application/json,${JSON.stringify(permission)}`],
    ["avatar", p.avatar],
  ];

  for (const [key, value] of records) {
    try {
      const ix = await buildWriteIx(conn, fullName, key, value, wallet.publicKey, wallet.publicKey);
      const tx = new Transaction()
        .add(ComputeBudgetProgram.setComputeUnitLimit({ units: 600_000 }))
        .add(ix);
      const sig = await sendAndPollConfirm(conn, tx, [wallet]);
      console.log(`    ${key.padEnd(24)} ✓ ${sig.slice(0, 16)}…`);
    } catch (e) {
      console.error(`    ${key.padEnd(24)} ✗ ${(e as Error).message.slice(0, 80)}`);
    }
  }
}

async function main() {
  const argNames = process.argv.slice(2);
  const personas =
    argNames.length > 0
      ? argNames.map((n) => DEFAULT_PERSONAS.find((p) => p.name === n) ?? {
          name: n,
          endpoint: `https://${n}.snsip.dev/mcp`,
          avatar: `https://api.dicebear.com/9.x/identicon/svg?seed=${n}`,
          description: `Demo agent ${n}`,
        })
      : DEFAULT_PERSONAS;

  const conn = new Connection(RPC, "confirmed");
  const wallet = loadWallet();
  console.log(`→ wallet: ${wallet.publicKey.toBase58()}`);

  const balance = await conn.getBalance(wallet.publicKey);
  console.log(`  balance: ${balance / LAMPORTS_PER_SOL} SOL`);
  if (balance < 0.5 * LAMPORTS_PER_SOL) {
    console.error(`  insufficient balance — fund via https://faucet.solana.com`);
    process.exit(1);
  }

  console.log(`\n→ wrapping SOL into wSOL ATA…`);
  const wsolAta = await ensureWrappedSol(conn, wallet, personas.length * 0.4 * LAMPORTS_PER_SOL);

  for (const p of personas) {
    console.log(`\n=== ${p.name}.sol ===`);
    try {
      await ensureRegistered(conn, wallet, p.name, wsolAta);
    } catch (e) {
      console.error(`  ✗ register failed: ${(e as Error).message.slice(0, 80)}`);
      continue;
    }
    await seedRecords(conn, wallet, p);
  }

  console.log(`\n✓ done. Gallery refresh: https://snsip-cc5.pages.dev/agents/`);
  console.log(`  Add these to DEMO_DOMAINS in agent-gallery.tsx:`);
  for (const p of personas) console.log(`    "${p.name}.sol",`);
}

void main();
