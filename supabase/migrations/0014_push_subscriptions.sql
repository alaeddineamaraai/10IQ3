-- Push subscription storage for Web Push notifications.
-- One row per browser/device per user; endpoint is the unique key.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    text        NOT NULL UNIQUE,
  keys        jsonb       NOT NULL,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own push subscriptions"
  ON push_subscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON push_subscriptions (user_id);
