-- 0004_drop_legacy_coach_columns.sql
--
-- Drops the shared-per-coach columns left over from the pre-outreach-table
-- design (see 0001_outreach_and_rls.sql's comment for the original bug:
-- one athlete emailing a coach marked that coach "contacted" for every
-- other athlete too, because send state lived directly on this shared row).
--
-- Confirmed unused: no application code reads or writes email_subject,
-- email_body, email_generated, email_sent, email_sent_at, replied,
-- email_opened, or plan on coaches_database — all per-user send state now
-- lives in the `outreach` table. Live data also confirmed every row
-- currently has email_sent = false, i.e. nothing is writing to these
-- columns anymore. Dropping them removes a column set that looks like the
-- source of cross-user leakage but isn't, so it can't cause confusion (or
-- get accidentally wired up again) in the future.
--
-- Run this in the Supabase SQL editor (or `supabase db push`).

alter table public.coaches_database
  drop column if exists email_subject,
  drop column if exists email_body,
  drop column if exists email_generated,
  drop column if exists email_sent,
  drop column if exists email_sent_at,
  drop column if exists replied,
  drop column if exists email_opened,
  drop column if exists plan;
