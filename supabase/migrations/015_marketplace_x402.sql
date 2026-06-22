-- Migrate marketplace listings from SOL (price_lamports) to x402 USDC payments.
-- Seller must connect a Phantom EVM (Base) account to receive USDC payouts.
alter table marketplace_listings add column price_usd numeric(10, 4) not null default 0;
alter table marketplace_listings add column payout_evm_address text;

-- execution_logs.tx_signature/amount_lamports were Solana-specific; x402 settles off-chain via signature,
-- replay protection now comes from the facilitator, so we just track the USD amount charged.
alter table execution_logs add column amount_usd numeric(10, 4) not null default 0;
