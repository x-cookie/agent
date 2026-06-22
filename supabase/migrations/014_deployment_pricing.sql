-- x402: per-deployment USDC price for public agent runs. 0 = free (no payment gate).
alter table deployments add column price_usd numeric(10, 4) not null default 0;
  