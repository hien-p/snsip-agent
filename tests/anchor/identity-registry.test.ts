import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

import { IdentityRegistry } from "../../target/types/identity_registry";
import { agentPda, BN, hashDomain, newFunded, provider, registryPda } from "./_helpers";

describe("identity-registry", () => {
  const p = provider();
  const program = anchor.workspace.IdentityRegistry as Program<IdentityRegistry>;
  const [registryKey] = registryPda(program.programId);

  before(async () => {
    // Idempotent init — if already initialized in a previous test run, skip.
    try {
      await program.methods
        .initializeRegistry()
        .accounts({
          registry: registryKey,
          authority: p.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    } catch (e) {
      const msg = (e as Error).message;
      if (!msg.includes("already in use")) throw e;
    }
  });

  it("registers a new agent and stores all fields", async () => {
    const reg = await program.account.registry.fetch(registryKey);
    const nextId = new BN(reg.nextAgentId.toString());
    const [agentKey] = agentPda(program.programId, nextId);

    const controller = await newFunded();
    const signingKp = Keypair.generate();
    const domainHash = await hashDomain(`agent${nextId}.alice.sol`);

    await program.methods
      .registerAgent(Array.from(domainHash), signingKp.publicKey, "ipfs://capability-card")
      .accounts({
        registry: registryKey,
        agent: agentKey,
        controller: controller.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([controller])
      .rpc();

    const agent = await program.account.agent.fetch(agentKey);
    expect(agent.id.toString()).to.equal(nextId.toString());
    expect(agent.controller.toBase58()).to.equal(controller.publicKey.toBase58());
    expect(agent.signingPubkey.toBase58()).to.equal(signingKp.publicKey.toBase58());
    expect(agent.metadataUri).to.equal("ipfs://capability-card");
    expect(agent.revoked).to.equal(false);
    expect(Buffer.from(agent.snsDomainHash).toString("hex")).to.equal(
      Buffer.from(domainHash).toString("hex"),
    );

    const regAfter = await program.account.registry.fetch(registryKey);
    expect(regAfter.nextAgentId.toString()).to.equal(nextId.add(new BN(1)).toString());
  });

  it("only the controller can update", async () => {
    const reg = await program.account.registry.fetch(registryKey);
    const nextId = new BN(reg.nextAgentId.toString());
    const [agentKey] = agentPda(program.programId, nextId);
    const controller = await newFunded();
    const stranger = await newFunded();
    const sk = Keypair.generate();

    await program.methods
      .registerAgent(Array.from(await hashDomain("u.sol")), sk.publicKey, "x")
      .accounts({
        registry: registryKey,
        agent: agentKey,
        controller: controller.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([controller])
      .rpc();

    let threw = false;
    try {
      await program.methods
        .updateAgent("y", null)
        .accounts({ agent: agentKey, controller: stranger.publicKey })
        .signers([stranger])
        .rpc();
    } catch (e) {
      threw = true;
      expect((e as Error).message).to.match(/Unauthorized/);
    }
    expect(threw).to.equal(true);
  });

  it("revokes an agent", async () => {
    const reg = await program.account.registry.fetch(registryKey);
    const nextId = new BN(reg.nextAgentId.toString());
    const [agentKey] = agentPda(program.programId, nextId);
    const controller = await newFunded();

    await program.methods
      .registerAgent(Array.from(await hashDomain("r.sol")), Keypair.generate().publicKey, "x")
      .accounts({
        registry: registryKey,
        agent: agentKey,
        controller: controller.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([controller])
      .rpc();

    await program.methods
      .revokeAgent()
      .accounts({ agent: agentKey, controller: controller.publicKey })
      .signers([controller])
      .rpc();

    const agent = await program.account.agent.fetch(agentKey);
    expect(agent.revoked).to.equal(true);
  });
});
