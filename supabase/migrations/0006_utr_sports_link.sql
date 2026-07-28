-- 0006_utr_sports_link.sql
--
-- Adds a spot for the athlete's UTR Sports profile link, referenced in
-- outreach emails as the "view my complete recruiting profile" link.
--
-- Run this in the Supabase SQL editor (or `supabase db push`).

alter table public.users
  add column if not exists utr_sports_link text;
