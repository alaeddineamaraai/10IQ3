-- Stores athlete-sent follow-up replies within an existing email thread.
-- Each row is one outgoing message after the original outreach was sent,
-- so the inbox thread can show the full back-and-forth conversation.
CREATE TABLE IF NOT EXISTS outreach_followups (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  outreach_id  uuid        NOT NULL REFERENCES outreach(id) ON DELETE CASCADE,
  subject      text,
  body         text,
  sent_at      timestamptz NOT NULL DEFAULT now(),
  resend_email_id text
);

ALTER TABLE outreach_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own outreach followups"
  ON outreach_followups
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM outreach
      WHERE outreach.id = outreach_followups.outreach_id
        AND outreach.user_id = auth.uid()
    )
  );

CREATE INDEX outreach_followups_outreach_id_idx ON outreach_followups(outreach_id);
