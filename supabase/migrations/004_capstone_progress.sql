-- Capstone checkpoint progress (for future phase 1.5+)
create table capstone_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  stage_id text not null, -- "fundamentals", "agent-patterns", "advanced-reasoning"
  checkpoint_num int not null,
  completed boolean default false,
  completed_at timestamp with time zone,
  unique(user_id, stage_id, checkpoint_num)
);

-- Enable RLS
alter table capstone_progress enable row level security;

-- RLS: users can only see/edit their own capstone progress
create policy "capstone_select_own" on capstone_progress
  for select using (auth.uid() = user_id);

create policy "capstone_insert_own" on capstone_progress
  for insert with check (auth.uid() = user_id);

create policy "capstone_update_own" on capstone_progress
  for update using (auth.uid() = user_id);

-- Index
create index capstone_user_id_idx on capstone_progress(user_id);
