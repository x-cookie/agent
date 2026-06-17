-- Users table to track metadata (Supabase Auth handles actual auth)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  created_at timestamp with time zone default now(),
  last_seen timestamp with time zone default now()
);

-- Enable RLS
alter table users enable row level security;

-- RLS: users can only read/write their own row
create policy "users_select_own" on users
  for select using (auth.uid() = id);

create policy "users_insert_own" on users
  for insert with check (auth.uid() = id);

create policy "users_update_own" on users
  for update using (auth.uid() = id);
