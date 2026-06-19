-- Agent Battle Arena: two of a player's own agents face the same scenario,
-- an LLM judge picks a winner, result is logged and win/loss counts tracked.

alter table agents add column wins int not null default 0;
alter table agents add column losses int not null default 0;

create table battles (
  id uuid primary key default gen_random_uuid(),
  agent_a_id uuid not null references agents(id) on delete cascade,
  agent_b_id uuid not null references agents(id) on delete cascade,
  scenario text not null,
  output_a text not null,
  output_b text not null,
  winner_agent_id uuid references agents(id) on delete set null,
  judge_reasoning text,
  proof_tx text,
  created_by text not null,
  created_at timestamp with time zone default now()
);
create index battles_agent_a_id_idx on battles(agent_a_id);
create index battles_agent_b_id_idx on battles(agent_b_id);
create index battles_created_by_idx on battles(created_by);
