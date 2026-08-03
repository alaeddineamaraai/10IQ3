-- team_utr and team_wtn were stored as text, causing lexicographic comparisons
-- that broke range filters (e.g. "9.5" > "11" as text). Cast to numeric so
-- gte/lte filters work correctly.
ALTER TABLE coaches_database
  ALTER COLUMN team_utr TYPE numeric USING NULLIF(team_utr, '')::numeric,
  ALTER COLUMN team_wtn TYPE numeric USING NULLIF(team_wtn, '')::numeric;
