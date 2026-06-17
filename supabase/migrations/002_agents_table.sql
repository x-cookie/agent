-- Saved agents table
create table agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  lesson_id text not null,
  name text not null,
  code text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, lesson_id, name)
);

-- Enable RLS
alter table agents enable row level security;

-- RLS: users can only see/edit their own agents
create policy "agents_select_own" on agents
  for select using (auth.uid() = user_id);

create policy "agents_insert_own" on agents
  for insert with check (auth.uid() = user_id);

create policy "agents_update_own" on agents
  for update using (auth.uid() = user_id);

create policy "agents_delete_own" on agents
  for delete using (auth.uid() = user_id);

-- Index for faster queries
create index agents_user_id_idx on agents(user_id);
create index agents_lesson_id_idx on agents(lesson_id);
