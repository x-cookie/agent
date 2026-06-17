-- Phase 1.5 uses custom Phantom-wallet auth (not Supabase Auth).
-- Wallet address (base58 text) is the user identity, not a uuid.
-- API routes use the service role key and enforce ownership manually,
-- so RLS (which relies on auth.uid()) is dropped here.

-- Drop old auth.uid()-based tables (empty at this stage).
drop table if exists capstone_progress cascade;
drop table if exists progress cascade;
drop table if exists agents cascade;
drop table if exists users cascade;

-- Users keyed by wallet address (text).
create table users (
  id text primary key,            -- Phantom wallet address (base58)
  email text,
  created_at timestamp with time zone default now(),
  last_seen timestamp with time zone default now()
);

-- Saved agents.
create table agents (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  lesson_id text not null,
  name text not null,
  code text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, lesson_id, name)
);
create index agents_user_id_idx on agents(user_id);
create index agents_lesson_id_idx on agents(lesson_id);

-- Lesson progress.
create table progress (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  lesson_id text not null,
  completed boolean default false,
  marked_at timestamp with time zone default now(),
  unique(user_id, lesson_id)
);
create index progress_user_id_idx on progress(user_id);

-- Capstone checkpoint progress.
create table capstone_progress (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  stage_id text not null,
  checkpoint_num int not null,
  completed boolean default false,
  completed_at timestamp with time zone,
  unique(user_id, stage_id, checkpoint_num)
);
create index capstone_user_id_idx on capstone_progress(user_id);
