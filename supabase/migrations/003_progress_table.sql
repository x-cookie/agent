-- Lesson progress tracking
create table progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  lesson_id text not null,
  completed boolean default false,
  marked_at timestamp with time zone default now(),
  unique(user_id, lesson_id)
);

-- Enable RLS
alter table progress enable row level security;

-- RLS: users can only see/edit their own progress
create policy "progress_select_own" on progress
  for select using (auth.uid() = user_id);

create policy "progress_insert_own" on progress
  for insert with check (auth.uid() = user_id);

create policy "progress_update_own" on progress
  for update using (auth.uid() = user_id);

-- Index
create index progress_user_id_idx on progress(user_id);
