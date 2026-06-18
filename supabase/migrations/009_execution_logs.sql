-- Phase 3: record of paid agent runs from the marketplace.
-- tx_signature is unique so a payment can only ever be redeemed once (replay protection).

create table execution_logs (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id) on delete cascade,
  listing_id uuid references marketplace_listings(id) on delete set null,
  buyer_wallet text not null,
  tx_signature text unique,        -- null for free (price = 0) runs
  amount_lamports bigint not null default 0,
  executed_at timestamp with time zone default now()
);
create index execution_logs_agent_id_idx on execution_logs(agent_id);
