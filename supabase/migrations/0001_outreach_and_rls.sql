-- 0001_outreach_and_rls.sql
--
-- Fixes the cross-user contamination bug: email_sent / email_opened / replied
-- etc. used to be written directly onto the shared coaches_database row, so
-- one athlete emailing a coach marked that coach "contacted" for every other
-- athlete too. This migration introduces a per-user `outreach` table and
-- locks down RLS so client-side anon-key writes can no longer touch other
-- users' rows or the shared coach list.
--
-- Run this in the Supabase SQL editor (or via `supabase db push`) against
-- the existing netset.pro project. coaches_database and users already exist;
-- this migration does not drop or rename anything, only adds outreach and
-- tightens policies.

-- ---------------------------------------------------------------------------
-- 1. outreach table — per-user, per-coach send state
-- ---------------------------------------------------------------------------

create table if not exists public.outreach (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- No FK to coaches_database(email): that column isn't guaranteed unique
  -- in the existing 1,820-row table. Join in application code instead.
  coach_email text not null,
  email_sent boolean not null default false,
  sent_at timestamptz,
  subject text,
  body text,
  opened boolean not null default false,
  replied boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, coach_email)
);

create index if not exists outreach_user_id_idx on public.outreach (user_id);
create index if not exists outreach_coach_email_idx on public.outreach (coach_email);

alter table public.outreach enable row level security;

drop policy if exists "outreach_select_own" on public.outreach;
create policy "outreach_select_own"
  on public.outreach for select
  using (auth.uid() = user_id);

drop policy if exists "outreach_insert_own" on public.outreach;
create policy "outreach_insert_own"
  on public.outreach for insert
  with check (auth.uid() = user_id);

drop policy if exists "outreach_update_own" on public.outreach;
create policy "outreach_update_own"
  on public.outreach for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- No delete policy: athletes shouldn't be able to erase their own send
-- history client-side. Service role can still delete if ever needed.

-- ---------------------------------------------------------------------------
-- 2. coaches_database — read-only shared list from the client's perspective
-- ---------------------------------------------------------------------------

alter table public.coaches_database enable row level security;

drop policy if exists "coaches_select_all" on public.coaches_database;
create policy "coaches_select_all"
  on public.coaches_database for select
  using (true);

-- Intentionally no insert/update/delete policy for anon/authenticated.
-- The coach list is shared, admin-managed data; only the service role
-- (which bypasses RLS) should write to it, e.g. via an import script.

-- ---------------------------------------------------------------------------
-- 3. users — was fully permissive for anon key (any row, any operation).
--    Lock down to "you can only touch your own row".
-- ---------------------------------------------------------------------------

alter table public.users enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No client-side insert policy: the users row is created server-side
-- (service role, via /api/auth/signup-profile and /api/auth/confirm)
-- immediately after auth.signUp(), not by an anon-key client insert.
