-- 0007_favorite_schools.sql
--
-- Shortlist/favorites, keyed by school_name so the same set is shared by
-- both the Schools grid (favorite a school directly) and the Coaches table
-- (favoriting a coach favorites their school) — previously each page kept
-- its own local, unpersisted React state.
--
-- Run this in the Supabase SQL editor (or `supabase db push`).

create table if not exists public.favorite_schools (
  user_id uuid not null references auth.users(id) on delete cascade,
  school_name text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, school_name)
);

alter table public.favorite_schools enable row level security;

create policy "Users manage their own favorite schools"
  on public.favorite_schools
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
