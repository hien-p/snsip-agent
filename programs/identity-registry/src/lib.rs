use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod identity_registry {
    use super::*;

    pub fn initialize_registry(ctx: Context<InitializeRegistry>) -> Result<()> {
        let registry = &mut ctx.accounts.registry;
        registry.authority = ctx.accounts.authority.key();
        registry.next_agent_id = 0;
        registry.bump = ctx.bumps.registry;
        Ok(())
    }

    pub fn register_agent(
        ctx: Context<RegisterAgent>,
        sns_domain_hash: [u8; 32],
        signing_pubkey: Pubkey,
        metadata_uri: String,
    ) -> Result<()> {
        require!(metadata_uri.len() <= Agent::MAX_URI_LEN, AgentError::UriTooLong);

        let registry = &mut ctx.accounts.registry;
        let agent_id = registry.next_agent_id;
        registry.next_agent_id = registry
            .next_agent_id
            .checked_add(1)
            .ok_or(AgentError::IdOverflow)?;

        let agent = &mut ctx.accounts.agent;
        agent.id = agent_id;
        agent.controller = ctx.accounts.controller.key();
        agent.sns_domain_hash = sns_domain_hash;
        agent.signing_pubkey = signing_pubkey;
        agent.metadata_uri = metadata_uri;
        agent.created_at = Clock::get()?.unix_timestamp;
        agent.revoked = false;
        agent.bump = ctx.bumps.agent;

        emit!(AgentRegistered { id: agent_id, controller: agent.controller });
        Ok(())
    }

    pub fn update_agent(
        ctx: Context<UpdateAgent>,
        new_metadata_uri: Option<String>,
        new_signing_pubkey: Option<Pubkey>,
    ) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        require!(!agent.revoked, AgentError::Revoked);
        require_keys_eq!(agent.controller, ctx.accounts.controller.key(), AgentError::Unauthorized);

        if let Some(uri) = new_metadata_uri {
            require!(uri.len() <= Agent::MAX_URI_LEN, AgentError::UriTooLong);
            agent.metadata_uri = uri;
        }
        if let Some(pk) = new_signing_pubkey {
            agent.signing_pubkey = pk;
        }
        Ok(())
    }

    pub fn revoke_agent(ctx: Context<UpdateAgent>) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        require_keys_eq!(agent.controller, ctx.accounts.controller.key(), AgentError::Unauthorized);
        agent.revoked = true;
        emit!(AgentRevoked { id: agent.id });
        Ok(())
    }
}

#[account]
pub struct Registry {
    pub authority: Pubkey,
    pub next_agent_id: u64,
    pub bump: u8,
}

impl Registry {
    pub const SIZE: usize = 8 + 32 + 8 + 1;
    pub const SEED: &'static [u8] = b"registry";
}

#[account]
pub struct Agent {
    pub id: u64,
    pub controller: Pubkey,
    pub sns_domain_hash: [u8; 32],
    pub signing_pubkey: Pubkey,
    pub metadata_uri: String,
    pub created_at: i64,
    pub revoked: bool,
    pub bump: u8,
}

impl Agent {
    pub const MAX_URI_LEN: usize = 256;
    pub const SIZE: usize = 8 + 8 + 32 + 32 + 32 + 4 + Self::MAX_URI_LEN + 8 + 1 + 1;
    pub const SEED: &'static [u8] = b"agent";
}

#[derive(Accounts)]
pub struct InitializeRegistry<'info> {
    #[account(
        init,
        payer = authority,
        space = Registry::SIZE,
        seeds = [Registry::SEED],
        bump
    )]
    pub registry: Account<'info, Registry>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterAgent<'info> {
    #[account(mut, seeds = [Registry::SEED], bump = registry.bump)]
    pub registry: Account<'info, Registry>,
    #[account(
        init,
        payer = controller,
        space = Agent::SIZE,
        seeds = [Agent::SEED, &registry.next_agent_id.to_le_bytes()],
        bump
    )]
    pub agent: Account<'info, Agent>,
    #[account(mut)]
    pub controller: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateAgent<'info> {
    #[account(mut, seeds = [Agent::SEED, &agent.id.to_le_bytes()], bump = agent.bump)]
    pub agent: Account<'info, Agent>,
    pub controller: Signer<'info>,
}

#[event]
pub struct AgentRegistered {
    pub id: u64,
    pub controller: Pubkey,
}

#[event]
pub struct AgentRevoked {
    pub id: u64,
}

#[error_code]
pub enum AgentError {
    #[msg("Caller is not the agent controller")]
    Unauthorized,
    #[msg("Agent has been revoked")]
    Revoked,
    #[msg("Metadata URI too long")]
    UriTooLong,
    #[msg("Agent ID counter overflow")]
    IdOverflow,
}
