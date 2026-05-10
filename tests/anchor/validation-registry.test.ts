import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

import { ValidationRegistry } from "../../target/types/validation_registry";
import { BN, newFunded, provider, validationPda } from "./_helpers";

describe("validation-registry", () => {
  void provider();
  const program = anchor.workspace.ValidationRegistry as Program<ValidationRegistry>;

  function randomClaimHash(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(32));
  }

  it("submits a validation record", async () => {
    const agentId = new BN(123);
    const claimHash = randomClaimHash();
    const validator = await newFunded();
    const [recordKey] = validationPda(program.programId, agentId, validator.publicKey, claimHash);

    await program.methods
      .submitValidation(agentId, Array.from(claimHash), "https://audit.example.com/report.json")
      .accounts({
        record: recordKey,
        validator: validator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([validator])
      .rpc();

    const rec = await program.account.validationRecord.fetch(recordKey);
    expect(rec.agentId.toString()).to.equal("123");
    expect(rec.validator.toBase58()).to.equal(validator.publicKey.toBase58());
    expect(rec.uri).to.equal("https://audit.example.com/report.json");
    expect(rec.revoked).to.equal(false);
  });

  it("only the original validator can revoke", async () => {
    const agentId = new BN(456);
    const claimHash = randomClaimHash();
    const validator = await newFunded();
    const stranger = await newFunded();
    const [recordKey] = validationPda(program.programId, agentId, validator.publicKey, claimHash);

    await program.methods
      .submitValidation(agentId, Array.from(claimHash), "x")
      .accounts({
        record: recordKey,
        validator: validator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([validator])
      .rpc();

    let threw = false;
    try {
      await program.methods
        .revokeValidation()
        .accounts({ record: recordKey, validator: stranger.publicKey })
        .signers([stranger])
        .rpc();
    } catch (e) {
      threw = true;
    }
    expect(threw).to.equal(true);

    await program.methods
      .revokeValidation()
      .accounts({ record: recordKey, validator: validator.publicKey })
      .signers([validator])
      .rpc();

    const rec = await program.account.validationRecord.fetch(recordKey);
    expect(rec.revoked).to.equal(true);
  });
});
