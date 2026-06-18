-- Phase 3: agent lineage. Tracks who created an agent and its on-chain
-- registration, plus parent_agent_id so forks form a traceable chain.

alter table agents add column lineage_tx text;
alter table agents add column parent_agent_id uuid references agents(id) on delete set null;
create index agents_parent_agent_id_idx on agents(parent_agent_id);
