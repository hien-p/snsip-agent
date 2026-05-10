// scripts/register-devnet-domain.mts
//
// Register a `.sol` domain on devnet using @bonfida/spl-name-service's
// `devnet.registerDomainNameV2`. Uses wSOL (wrapped SOL) for payment so we
// don't need to source devnet USDC from a third party.
//
// Usage:
//   pnpm tsx scripts/register-devnet-domain.mts <name>
//
// Example:
//   pnpm tsx scripts/register-devnet-domain.mts snsip-test-001
//   → registers snsip-test-001.sol on devnet, owned by the keypair in
//     .local/devnet-wallet.json (created on first run)
//
// What this proves:
//   - The wizard flow we built can register real .sol domains end-to-end
//   - Records v2 set on a real on-chain SNS domain are readable via SDK

// CommonJS to bypass an upstream borsh ESM export mismatch in
// @bonfida/spl-name-service's bundled ESM build. The CJS build is fine.
const {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  ComputeBudgetProgram,
} = require("@solana/web3.js");
const {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
  createSyncNativeInstruction,
  NATIVE_MINT,
} = require("@solana/spl-token");
const { devnet } = require("@bonfida/spl-name-service");
const fs = require("node:fs");
const path = require("node:path");

/* eslint-disable @typescript-eslint/no-explicit-any */

const WALLET_PATH = path.join(process.cwd(), ".local", "devnet-wallet.json");
const RPC = "https://api.devnet.solana.com";

function loadOrCreateWallet(): any {
  if (fs.existsSync(WALLET_PATH)) {
    const raw = JSON.parse(fs.readFileSync(WALLET_PATH, "utf8")) as number[];
    return Keypair.fromSecretKey(Uint8Array.from(raw));
  }
  const kp = Keypair.generate();
  fs.mkdirSync(path.dirname(WALLET_PATH), { recursive: true });
  fs.writeFileSync(WALLET_PATH, JSON.stringify(Array.from(kp.secretKey)));
  console.log(`✓ created new wallet at ${WALLET_PATH}`);
  console.log(`  pubkey: ${kp.publicKey.toBase58()}`);
  return kp;
}

async function ensureFunded(conn: any, pk: any, minSol = 1): Promise<number> {
  const have = (await conn.getBalance(pk)) / LAMPORTS_PER_SOL;
  if (have >= minSol) return have;
  console.log(`→ airdropping 2 SOL to ${pk.toBase58()}…`);
  try {
    const sig = await conn.requestAirdrop(pk, 2 * LAMPORTS_PER_SOL);
    await conn.confirmTransaction(sig, "confirmed");
  } catch (e) {
    console.log(`  airdrop failed (${(e as Error).message}); rate-limited?`);
    console.log(`  fund manually: https://faucet.solana.com  →  ${pk.toBase58()}`);
    process.exit(1);
  }
  const after = (await conn.getBalance(pk)) / LAMPORTS_PER_SOL;
  console.log(`  balance now ${after} SOL`);
  return after;
}

async function ensureWrappedSol(
  conn: any,
  payer: any,
  lamports: number,
): Promise<any> {
  const wsolAta = getAssociatedTokenAddressSync(NATIVE_MINT, payer.publicKey);
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
  const sig = await sendAndConfirmTransaction(conn, tx, [payer]);
  console.log(`✓ wrapped ${lamports / LAMPORTS_PER_SOL} SOL → wSOL ATA ${wsolAta.toBase58()}`);
  console.log(`  tx: https://explorer.solana.com/tx/${sig}?cluster=devnet`);
  return wsolAta;
}

async function main() {
  const name = process.argv[2];
  if (!name || !/^[a-z0-9-]{1,32}$/.test(name)) {
    console.error("usage: pnpm tsx scripts/register-devnet-domain.mts <name>");
    console.error("       (lowercase letters, digits, hyphens; 1–32 chars)");
    process.exit(2);
  }

  const conn = new Connection(RPC, "confirmed");
  const wallet = loadOrCreateWallet();
  console.log(`→ wallet: ${wallet.publicKey.toBase58()}`);

  await ensureFunded(conn, wallet.publicKey, 1);

  // Wrap 0.5 SOL into wSOL — covers ~$80 at typical prices, plenty for any
  // SNS V2 registration. Excess stays in the ATA, recoverable via close.
  const wsolAta = await ensureWrappedSol(conn, wallet, 0.5 * LAMPORTS_PER_SOL);

  console.log(`→ registering ${name}.sol on devnet…`);
  const ixs = await devnet.bindings.registerDomainNameV2(
    conn,
    name,
    1024, // 1 kB account, fine for records
    wallet.publicKey,
    wsolAta,
    NATIVE_MINT, // pay in wSOL instead of devnet USDC
  );

  const tx = new Transaction()
    .add(ComputeBudgetProgram.setComputeUnitLimit({ units: 600_000 }))
    .add(...ixs);

  try {
    const sig = await sendAndConfirmTransaction(conn, tx, [wallet], { commitment: "confirmed" });
    console.log(`\n✓ registered ${name}.sol`);
    console.log(`  owner: ${wallet.publicKey.toBase58()}`);
    console.log(`  tx:    https://explorer.solana.com/tx/${sig}?cluster=devnet`);
    console.log(`\nNow:`);
    console.log(`  - The wizard on the live URL can target this domain`);
    console.log(`  - Resolve at /agents/?domain=${name}.sol`);
    console.log(`  - Wallet keypair: ${WALLET_PATH}`);
  } catch (e) {
    console.error(`\n✗ registration failed:`);
    console.error((e as Error).message);
    if (e instanceof Error && e.stack) console.error(e.stack.split("\n").slice(0, 8).join("\n"));
    process.exit(1);
  }
}

void main();
