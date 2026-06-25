-- Education-linked skill badges: completing a lesson mints an on-chain badge.
-- Badges unlock stat bonuses for agents built from that lesson's pattern.
create table skill_badges (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  lesson_id text not null,
  badge_tx text,
  created_at timestamp with time zone default now(),
  unique(user_id, lesson_id)
);

create index skill_badges_user_id_idx on skill_badges(user_id);
