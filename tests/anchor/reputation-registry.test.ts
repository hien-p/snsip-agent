import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

import { ReputationRegistry } from "../../target/types/reputation_registry";
import { BN, newFunded, provider, reputationPda } from "./_helpers";

describe("reputation-registry", () => {
  const p = provider();
  const program = anchor.workspace.ReputationRegistry as Program<ReputationRegistry>;

  it("initializes a reputation account for an agent", async () => {
    const agentId = new BN(Math.floor(Math.random() * 1_000_000));
    const [repKey] = reputationPda(program.programId, agentId);

    await program.methods
      .initReputation(agentId)
      .accounts({
        reputation: repKey,
        payer: p.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const rep = await program.account.reputationAccount.fetch(repKey);
    expect(rep.agentId.toString()).to.equal(agentId.toString());
    expect(rep.interactionCount.toString()).to.equal("0");
    expect(rep.score).to.equal(0);
  });

  it("records interactions and updates the success-rate score", async () => {
    const agentId = new BN(Math.floor(Math.random() * 1_000_000));
    const [repKey] = reputationPda(program.programId, agentId);
    const authority = await newFunded();

    await program.methods
      .initReputation(agentId)
      .accounts({
        reputation: repKey,
        payer: p.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // 8 successes, 2 failures → score = 8000 / 10
    for (let i = 0; i < 8; i++) {
      await program.methods
        .recordInteraction(true)
        .accounts({ reputation: repKey, authority: authority.publicKey })
        .signers([authority])
        .rpc();
    }
    for (let i = 0; i < 2; i++) {
      await program.methods
        .recordInteraction(false)
        .accounts({ reputation: repKey, authority: authority.publicKey })
        .signers([authority])
        .rpc();
    }

    const rep = await program.account.reputationAccount.fetch(repKey);
    expect(rep.interactionCount.toString()).to.equal("10");
    expect(rep.successCount.toString()).to.equal("8");
    expect(rep.failureCount.toString()).to.equal("2");
    expect(rep.score).to.equal(8000);
  });

  it("attests an externally-computed score", async () => {
    const agentId = new BN(Math.floor(Math.random() * 1_000_000));
    const [repKey] = reputationPda(program.programId, agentId);
    const attester = await newFunded();

    await program.methods
      .initReputation(agentId)
      .accounts({
        reputation: repKey,
        payer: p.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    await program.methods
      .attestScore(7777)
      .accounts({ reputation: repKey, attester: attester.publicKey })
      .signers([attester])
      .rpc();

    const rep = await program.account.reputationAccount.fetch(repKey);
    expect(rep.score).to.equal(7777);
  });

  it("rejects an out-of-range score", async () => {
    const agentId = new BN(Math.floor(Math.random() * 1_000_000));
    const [repKey] = reputationPda(program.programId, agentId);
    const attester = await newFunded();

    await program.methods
      .initReputation(agentId)
      .accounts({
        reputation: repKey,
        payer: p.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    let threw = false;
    try {
      await program.methods
        .attestScore(99_999)
        .accounts({ reputation: repKey, attester: attester.publicKey })
        .signers([attester])
        .rpc();
    } catch (e) {
      threw = true;
      expect((e as Error).message).to.match(/ScoreOutOfRange/);
    }
    expect(threw).to.equal(true);
  });
});
