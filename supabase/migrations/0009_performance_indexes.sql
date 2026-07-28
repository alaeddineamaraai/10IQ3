-- 0009_performance_indexes.sql
--
-- Performance audit: coaches_database has never had an index added since
-- it predates this migration history (see 0001's comment). Every one of
-- these columns is hit by a `where`/`order by` in application code:
--   - email        -> single-coach lookup for AI draft/followup/nudge
--                     (src/app/api/ai/{draft,followup,nudge}/route.ts)
--   - school_name  -> grouping in getSchoolDetails (src/lib/data/schools.ts)
--                     and the new paginated coaches API's school filter
--   - division     -> Coaches/Schools filter dropdowns
--   - region       -> Coaches filter dropdown
-- coaches_database is ~1,800+ rows today and growing (see fetchAllCoaches's
-- own comment), so these scans stop being "fast enough anyway" quickly.
--
-- Also adds:
--   - users(email)              -> the adopt-by-email fallback path in
--                                  src/lib/data/profile.ts (23505 conflict
--                                  re-keying) does a full-table scan today.
--   - outreach(user_id, sent_at) -> the new metered-plan daily-send-count
--                                  query in /api/outreach/send filters
--                                  user_id + email_sent + a sent_at range;
--                                  the existing single-column user_id index
--                                  still requires scanning every row for
--                                  that user to apply the date filter.
--
-- Run this in the Supabase SQL editor (or `supabase db push`).

create index if not exists coaches_database_email_idx
  on public.coaches_database (email);

create index if not exists coaches_database_school_name_idx
  on public.coaches_database (school_name);

create index if not exists coaches_database_division_idx
  on public.coaches_database (division);

create index if not exists coaches_database_region_idx
  on public.coaches_database (region);

-- Non-unique: the adopt-by-email fallback in profile.ts exists precisely
-- because this table can transiently hold a duplicate email during account
-- recreation (see that file's comment) — a unique index could fail to
-- apply against existing data, so this is a plain lookup index only.
create index if not exists users_email_idx
  on public.users (email);

create index if not exists outreach_user_sent_at_idx
  on public.outreach (user_id, sent_at);
