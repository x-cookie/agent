-- Phase 2: public agent deployments. One deployment row per agent, toggled on/off.

create table deployments (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id) on delete cascade unique,
  public_url text not null unique,   -- short slug, e.g. "k3j9x2"
  is_public boolean default true,
  deployed_at timestamp with time zone default now(),
  metadata jsonb
);
create index deployments_public_url_idx on deployments(public_url);
