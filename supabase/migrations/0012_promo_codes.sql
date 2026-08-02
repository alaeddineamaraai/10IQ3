-- Tracks an active promo-code grant for a user.
-- promo_plan holds the plan level unlocked by the code; promo_expires_at is
-- when it lapses. The application computes the effective plan at read time
-- (max of plan vs promo_plan while the expiry is in the future) so no cleanup
-- job is needed — expired promos are simply ignored.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS promo_plan   text,
  ADD COLUMN IF NOT EXISTS promo_expires_at timestamptz;
