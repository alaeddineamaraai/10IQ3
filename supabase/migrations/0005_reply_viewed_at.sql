-- 0005_reply_viewed_at.sql
--
-- Tracks whether the athlete has viewed a coach's reply, so replies can be
-- surfaced as "unread" notifications (distinct from opened/replied, which
-- describe the coach's behavior, not the athlete's own read state).
--
-- Run this in the Supabase SQL editor (or `supabase db push`).

alter table public.outreach
  add column if not exists reply_viewed_at timestamptz;

-- No new RLS policy needed: outreach already has an update policy scoped
-- to the owning user (see 0001_outreach_and_rls.sql), which covers writes
-- to this column from the mark-as-read route.
