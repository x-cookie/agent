-- Agent Job System: assign a saved agent to a background role (trader/warrior/researcher).
-- An external cron hits /api/cron/run-jobs periodically; each active job that's due
-- gets a short, cheap LLM call and the result is appended to job_logs.

create table agent_jobs (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id) on delete cascade,
  role text not null check (role in ('trader', 'warrior', 'researcher')),
  status text not null default 'active' check (status in ('active', 'paused')),
  last_run_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  unique(agent_id)
);

create table job_logs (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id) on delete cascade,
  role text not null,
  output text not null,
  created_at timestamp with time zone default now()
);

create index agent_jobs_status_idx on agent_jobs(status);
create index job_logs_agent_id_idx on job_logs(agent_id);
