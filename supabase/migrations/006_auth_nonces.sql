-- Replay protection for Phantom sign-message auth.
-- Each signature can only be redeemed once; old rows can be purged periodically.

create table auth_nonces (
  signature text primary key,
  wallet_address text not null,
  created_at timestamp with time zone default now()
);
create index auth_nonces_created_at_idx on auth_nonces(created_at);
