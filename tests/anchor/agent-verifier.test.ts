import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  Ed25519Program,
  Keypair,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import { expect } from "chai";
import nacl from "tweetnacl";

import { IdentityRegistry } from "../../target/types/identity_registry";
import { AgentVerifier } from "../../target/types/agent_verifier";
import {
  agentPda,
  BN,
  hashDomain,
  newFunded,
  provider,
  registryPda,
} from "./_helpers";

describe("agent-verifier", () => {
  const p = provider();
  const identity = anchor.workspace.IdentityRegistry as Program<IdentityRegistry>;
  const verifier = anchor.workspace.AgentVerifier as Program<AgentVerifier>;
  const [registryKey] = registryPda(identity.programId);

  // Reused agent registered once for all happy/fail tests
  let agentKey: anchor.web3.PublicKey;
  let signingKp: Keypair;
  let controller: Keypair;

  before(async () => {
    try {
      await identity.methods
        .initializeRegistry()
        .accounts({
          registry: registryKey,
          authority: p.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    } catch (e) {
      if (!(e as Error).message.includes("already in use")) throw e;
    }

    const reg = await identity.account.registry.fetch(registryKey);
    const id = new BN(reg.nextAgentId.toString());
    [agentKey] = agentPda(identity.programId, id);

    controller = await newFunded();
    signingKp = Keypair.generate();
    const domainHash = await hashDomain("verify.sol");

    await identity.methods
      .registerAgent(Array.from(domainHash), signingKp.publicKey, "x")
      .accounts({
        registry: registryKey,
        agent: agentKey,
        controller: controller.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([controller])
      .rpc();
  });

  function buildVerifyTx(opts: {
    message: Uint8Array;
    signer: Uint8Array; // 64-byte secret key
    pubkey: Uint8Array; // 32 bytes
  }): Transaction {
    const sig = nacl.sign.detached(opts.message, opts.signer);
    const ed25519Ix = Ed25519Program.createInstructionWithPublicKey({
      publicKey: opts.pubkey,
      message: opts.message,
      signature: sig,
    });

    const verifyIx = (
      // builder's typings vary by Anchor version; cast
      verifier.methods as any
    )
      .verifyAgentSignature(Buffer.from(opts.message))
      .accounts({
        agent: agentKey,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .instruction();

    return new Transaction().add(ed25519Ix as any).add(verifyIx as any);
  }

  it("verifies a valid agent signature", async () => {
    const message = Buffer.from("hello, agent");
    const tx = buildVerifyTx({
      message,
      signer: signingKp.secretKey,
      pubkey: signingKp.publicKey.toBytes(),
    });
    const sig = await p.sendAndConfirm(tx);
    expect(sig).to.be.a("string");
  });

  it("rejects when the pubkey doesn't match the agent record", async () => {
    const wrong = Keypair.generate();
    const message = Buffer.from("test");
    const tx = buildVerifyTx({
      message,
      signer: wrong.secretKey,
      pubkey: wrong.publicKey.toBytes(),
    });
    let threw = false;
    try {
      await p.sendAndConfirm(tx);
    } catch (e) {
      threw = true;
      expect((e as Error).message).to.match(/PubkeyMismatch/);
    }
    expect(threw).to.equal(true);
  });

  it("rejects when the message arg doesn't match the signed bytes", async () => {
    const sig = nacl.sign.detached(Buffer.from("real"), signingKp.secretKey);
    const ed25519Ix = Ed25519Program.createInstructionWithPublicKey({
      publicKey: signingKp.publicKey.toBytes(),
      message: Buffer.from("real"),
      signature: sig,
    });
    const verifyIx = await (verifier.methods as any)
      .verifyAgentSignature(Buffer.from("forged"))
      .accounts({
        agent: agentKey,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .instruction();

    const tx = new Transaction().add(ed25519Ix as any).add(verifyIx as any);
    let threw = false;
    try {
      await p.sendAndConfirm(tx);
    } catch (e) {
      threw = true;
      expect((e as Error).message).to.match(/MessageMismatch/);
    }
    expect(threw).to.equal(true);
  });

  it("rejects when the Ed25519 instruction is missing", async () => {
    const verifyIx = await (verifier.methods as any)
      .verifyAgentSignature(Buffer.from("anything"))
      .accounts({
        agent: agentKey,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .instruction();

    const tx = new Transaction().add(verifyIx as any);
    let threw = false;
    try {
      await p.sendAndConfirm(tx);
    } catch (e) {
      threw = true;
      // could be MissingEd25519Ix or "instruction at index 0 not found"
      expect((e as Error).message).to.match(/(MissingEd25519Ix|index)/i);
    }
    expect(threw).to.equal(true);
  });
});
