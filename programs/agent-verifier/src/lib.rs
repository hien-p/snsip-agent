use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    ed25519_program,
    instruction::Instruction,
    sysvar::instructions::{load_instruction_at_checked, ID as IX_SYSVAR_ID},
};
use identity_registry::Agent;

declare_id!("11111111111111111111111111111111");

// Verifies that the previous instruction in the transaction is a valid
// Ed25519 signature instruction over `message` using the agent's stored
// signing pubkey. This is the canonical on-chain pattern on Solana — we do
// NOT call expensive signature checks inside the program; instead, the
// client precedes our instruction with the sysvar Ed25519 program, and
// we verify it ran with the expected (pubkey, message, signature) tuple.
#[program]
pub mod agent_verifier {
    use super::*;

    pub fn verify_agent_signature(
        ctx: Context<VerifyAgentSignature>,
        message: Vec<u8>,
    ) -> Result<()> {
        let agent = &ctx.accounts.agent;
        require!(!agent.revoked, VerifierError::AgentRevoked);

        let ix_sysvar = &ctx.accounts.instructions_sysvar;
        let prev_ix: Instruction = load_instruction_at_checked(0, ix_sysvar)?;
        require_keys_eq!(
            prev_ix.program_id,
            ed25519_program::ID,
            VerifierError::MissingEd25519Ix
        );

        verify_ed25519_ix_matches(&prev_ix, &agent.signing_pubkey, &message)?;

        emit!(AgentVerified {
            agent_id: agent.id,
            sns_domain_hash: agent.sns_domain_hash,
        });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct VerifyAgentSignature<'info> {
    pub agent: Account<'info, Agent>,
    /// CHECK: validated by address constraint
    #[account(address = IX_SYSVAR_ID)]
    pub instructions_sysvar: AccountInfo<'info>,
}

// Parses the Ed25519 sysvar instruction layout and asserts that
// (signer, message) match what we expect. Layout reference:
// https://docs.anza.xyz/runtime/programs#ed25519-program
fn verify_ed25519_ix_matches(
    ix: &Instruction,
    expected_pubkey: &Pubkey,
    expected_message: &[u8],
) -> Result<()> {
    let data = &ix.data;
    require!(data.len() >= 16, VerifierError::MalformedEd25519Ix);

    let num_sigs = data[0];
    require!(num_sigs == 1, VerifierError::ExpectedSingleSig);

    let pubkey_offset = u16::from_le_bytes([data[6], data[7]]) as usize;
    let message_data_offset = u16::from_le_bytes([data[10], data[11]]) as usize;
    let message_data_size = u16::from_le_bytes([data[12], data[13]]) as usize;

    require!(
        data.len() >= pubkey_offset + 32,
        VerifierError::MalformedEd25519Ix
    );
    let pubkey_bytes: [u8; 32] = data[pubkey_offset..pubkey_offset + 32]
        .try_into()
        .map_err(|_| VerifierError::MalformedEd25519Ix)?;
    require!(
        Pubkey::from(pubkey_bytes) == *expected_pubkey,
        VerifierError::PubkeyMismatch
    );

    require!(
        data.len() >= message_data_offset + message_data_size,
        VerifierError::MalformedEd25519Ix
    );
    let signed_msg = &data[message_data_offset..message_data_offset + message_data_size];
    require!(signed_msg == expected_message, VerifierError::MessageMismatch);

    Ok(())
}

#[event]
pub struct AgentVerified {
    pub agent_id: u64,
    pub sns_domain_hash: [u8; 32],
}

#[error_code]
pub enum VerifierError {
    #[msg("Agent has been revoked")]
    AgentRevoked,
    #[msg("Previous instruction is not the Ed25519 sigverify program")]
    MissingEd25519Ix,
    #[msg("Ed25519 instruction layout malformed")]
    MalformedEd25519Ix,
    #[msg("Expected exactly one signature")]
    ExpectedSingleSig,
    #[msg("Signing pubkey does not match agent record")]
    PubkeyMismatch,
    #[msg("Signed message does not match expected payload")]
    MessageMismatch,
}
