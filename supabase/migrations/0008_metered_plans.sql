-- 0008_metered_plans.sql
--
-- New pricing model: Pro/Elite get a limited-time daily free-email
-- allowance starting from when they upgrade (plan_started_at), plus a
-- prepaid pool of overage email credits purchased via a quantity slider
-- (see /api/stripe/create-email-credits-checkout).
--
-- Run this in the Supabase SQL editor (or `supabase db push`).

alter table public.users
  add column if not exists plan_started_at timestamptz,
  add column if not exists email_credits integer not null default 0;
