use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

// Day 3: import MagicBlock delegate macro and helpers.
// use ephemeral_rollups_sdk::anchor::{delegate, commit, ephemeral};

#[program]
pub mod reputation_registry {
    use super::*;

    pub fn init_reputation(ctx: Context<InitReputation>, agent_id: u64) -> Result<()> {
        let rep = &mut ctx.accounts.reputation;
        rep.agent_id = agent_id;
        rep.interaction_count = 0;
        rep.success_count = 0;
        rep.failure_count = 0;
        rep.last_active = Clock::get()?.unix_timestamp;
        rep.score = 0;
        rep.bump = ctx.bumps.reputation;
        Ok(())
    }

    pub fn record_interaction(ctx: Context<RecordInteraction>, success: bool) -> Result<()> {
        let rep = &mut ctx.accounts.reputation;
        rep.interaction_count = rep.interaction_count.saturating_add(1);
        if success {
            rep.success_count = rep.success_count.saturating_add(1);
        } else {
            rep.failure_count = rep.failure_count.saturating_add(1);
        }
        rep.last_active = Clock::get()?.unix_timestamp;
        // simple deterministic score: success_rate * 10000, clamped
        if rep.interaction_count > 0 {
            let s = (rep.success_count as u128) * 10_000u128 / rep.interaction_count as u128;
            rep.score = s.min(10_000) as u32;
        }
        Ok(())
    }

    pub fn attest_score(
        ctx: Context<AttestScore>,
        score: u32,
    ) -> Result<()> {
        require!(score <= 10_000, ReputationError::ScoreOutOfRange);
        let rep = &mut ctx.accounts.reputation;
        rep.score = score;
        Ok(())
    }

    // Day 3: add `delegate_to_er`, `commit`, `undelegate` instructions.
    // The MagicBlock SDK provides macros that generate these.
}

#[account]
pub struct ReputationAccount {
    pub agent_id: u64,
    pub interaction_count: u64,
    pub success_count: u64,
    pub failure_count: u64,
    pub last_active: i64,
    pub score: u32,
    pub bump: u8,
}

impl ReputationAccount {
    pub const SIZE: usize = 8 + 8 + 8 + 8 + 8 + 8 + 4 + 1;
    pub const SEED: &'static [u8] = b"reputation";
}

#[derive(Accounts)]
#[instruction(agent_id: u64)]
pub struct InitReputation<'info> {
    #[account(
        init,
        payer = payer,
        space = ReputationAccount::SIZE,
        seeds = [ReputationAccount::SEED, &agent_id.to_le_bytes()],
        bump
    )]
    pub reputation: Account<'info, ReputationAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RecordInteraction<'info> {
    #[account(
        mut,
        seeds = [ReputationAccount::SEED, &reputation.agent_id.to_le_bytes()],
        bump = reputation.bump
    )]
    pub reputation: Account<'info, ReputationAccount>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct AttestScore<'info> {
    #[account(
        mut,
        seeds = [ReputationAccount::SEED, &reputation.agent_id.to_le_bytes()],
        bump = reputation.bump
    )]
    pub reputation: Account<'info, ReputationAccount>,
    pub attester: Signer<'info>,
}

#[error_code]
pub enum ReputationError {
    #[msg("Score must be in [0, 10000]")]
    ScoreOutOfRange,
}
