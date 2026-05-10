import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import BN from "bn.js";

export function provider(): anchor.AnchorProvider {
  const p = anchor.AnchorProvider.env();
  anchor.setProvider(p);
  return p;
}

// Hash a .sol domain into the 32-byte sns_domain_hash used by the
// Identity Registry. For the test harness we use a deterministic
// keccak256 stand-in (sha256 — same shape, fine for tests).
export async function hashDomain(domain: string): Promise<Uint8Array> {
  const bytes = new TextEncoder().encode(domain);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return new Uint8Array(digest);
}

export function registryPda(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("registry")], programId);
}

export function agentPda(programId: PublicKey, agentId: BN): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("agent"), agentId.toArrayLike(Buffer, "le", 8)],
    programId,
  );
}

export function reputationPda(programId: PublicKey, agentId: BN): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("reputation"), agentId.toArrayLike(Buffer, "le", 8)],
    programId,
  );
}

export function validationPda(
  programId: PublicKey,
  agentId: BN,
  validator: PublicKey,
  claimHash: Uint8Array,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("validation"),
      agentId.toArrayLike(Buffer, "le", 8),
      validator.toBuffer(),
      Buffer.from(claimHash),
    ],
    programId,
  );
}

export async function airdrop(
  conn: anchor.web3.Connection,
  to: PublicKey,
  sol = 2,
): Promise<void> {
  const sig = await conn.requestAirdrop(to, sol * anchor.web3.LAMPORTS_PER_SOL);
  await conn.confirmTransaction(sig, "confirmed");
}

export function newFunded(): Promise<Keypair> {
  return (async () => {
    const kp = Keypair.generate();
    await airdrop(provider().connection, kp.publicKey);
    return kp;
  })();
}

export { BN };
