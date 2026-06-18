-- Phase 3: marketplace listings. A deployed agent can be listed for sale/use.
-- Price is in lamports (1 SOL = 1_000_000_000 lamports); 0 = free to run.

create table marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id) on delete cascade unique,
  seller_wallet text not null,
  price_lamports bigint not null default 0,
  description text,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);
create index marketplace_listings_active_idx on marketplace_listings(is_active);
