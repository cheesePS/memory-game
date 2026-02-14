-- ============================================================
-- Scripture Memory Game — Supabase Schema
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================

-- 1. User Stats (one row per user, JSONB for complex nested data)
create table if not exists user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stats   jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 2. User Settings (one row per user)
create table if not exists user_settings (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 3. Global Leaderboard
create table if not exists leaderboard (
  id      bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name    text not null,
  score   integer not null,
  mode    text not null,
  date    text not null,
  created_at timestamptz not null default now()
);

-- ── Row Level Security ─────────────────────────────────

-- Enable RLS on all tables
alter table user_stats    enable row level security;
alter table user_settings enable row level security;
alter table leaderboard   enable row level security;

-- user_stats: users can only read/write their own row
create policy "Users can read own stats"
  on user_stats for select
  using (auth.uid() = user_id);

create policy "Users can insert own stats"
  on user_stats for insert
  with check (auth.uid() = user_id);

create policy "Users can update own stats"
  on user_stats for update
  using (auth.uid() = user_id);

-- user_settings: users can only read/write their own row
create policy "Users can read own settings"
  on user_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on user_settings for update
  using (auth.uid() = user_id);

-- leaderboard: everyone can read, users can insert their own entries
create policy "Anyone can read leaderboard"
  on leaderboard for select
  using (true);

create policy "Users can insert own leaderboard entries"
  on leaderboard for insert
  with check (auth.uid() = user_id);
