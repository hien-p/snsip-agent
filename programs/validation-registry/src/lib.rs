use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod validation_registry {
    use super::*;

    pub fn submit_validation(
        ctx: Context<SubmitValidation>,
        agent_id: u64,
        claim_hash: [u8; 32],
        uri: String,
    ) -> Result<()> {
        require!(uri.len() <= ValidationRecord::MAX_URI_LEN, ValidationError::UriTooLong);

        let rec = &mut ctx.accounts.record;
        rec.agent_id = agent_id;
        rec.validator = ctx.accounts.validator.key();
        rec.claim_hash = claim_hash;
        rec.uri = uri;
        rec.timestamp = Clock::get()?.unix_timestamp;
        rec.revoked = false;
        rec.bump = ctx.bumps.record;

        emit!(ValidationSubmitted {
            agent_id,
            validator: rec.validator,
            claim_hash,
        });
        Ok(())
    }

    pub fn revoke_validation(ctx: Context<RevokeValidation>) -> Result<()> {
        let rec = &mut ctx.accounts.record;
        require_keys_eq!(rec.validator, ctx.accounts.validator.key(), ValidationError::Unauthorized);
        rec.revoked = true;
        Ok(())
    }
}

#[account]
pub struct ValidationRecord {
    pub agent_id: u64,
    pub validator: Pubkey,
    pub claim_hash: [u8; 32],
    pub uri: String,
    pub timestamp: i64,
    pub revoked: bool,
    pub bump: u8,
}

impl ValidationRecord {
    pub const MAX_URI_LEN: usize = 256;
    pub const SIZE: usize = 8 + 8 + 32 + 32 + 4 + Self::MAX_URI_LEN + 8 + 1 + 1;
    pub const SEED: &'static [u8] = b"validation";
}

#[derive(Accounts)]
#[instruction(agent_id: u64, claim_hash: [u8; 32])]
pub struct SubmitValidation<'info> {
    #[account(
        init,
        payer = validator,
        space = ValidationRecord::SIZE,
        seeds = [
            ValidationRecord::SEED,
            &agent_id.to_le_bytes(),
            validator.key().as_ref(),
            &claim_hash,
        ],
        bump
    )]
    pub record: Account<'info, ValidationRecord>,
    #[account(mut)]
    pub validator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevokeValidation<'info> {
    #[account(
        mut,
        seeds = [
            ValidationRecord::SEED,
            &record.agent_id.to_le_bytes(),
            record.validator.as_ref(),
            &record.claim_hash,
        ],
        bump = record.bump
    )]
    pub record: Account<'info, ValidationRecord>,
    pub validator: Signer<'info>,
}

#[event]
pub struct ValidationSubmitted {
    pub agent_id: u64,
    pub validator: Pubkey,
    pub claim_hash: [u8; 32],
}

#[error_code]
pub enum ValidationError {
    #[msg("Caller is not the original validator")]
    Unauthorized,
    #[msg("Validation URI too long")]
    UriTooLong,
}
