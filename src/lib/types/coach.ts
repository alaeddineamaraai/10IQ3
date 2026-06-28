export type Coach = {
  email: string;
  coach_name: string;
  school_name: string;
  division: string;
  team_utr: number | null;
  team_wtn: number | null;
  notes: string | null;
  /** Not in the documented coaches_database columns yet — selected via
   * `select("*")` so it's picked up automatically once the column exists. */
  region?: string | null;
};

export type Outreach = {
  id: string;
  user_id: string;
  coach_email: string;
  email_sent: boolean;
  sent_at: string | null;
  subject: string | null;
  body: string | null;
  opened: boolean;
  replied: boolean;
  opened_at: string | null;
  replied_at: string | null;
  resend_email_id: string | null;
  created_at: string;
};

/** A reply received via Resend Inbound, threaded to one outreach row. */
export type OutreachReply = {
  id: string;
  outreach_id: string;
  from_email: string;
  subject: string | null;
  body: string | null;
  received_at: string;
};

/** coaches_database joined with the current user's outreach row, if any. */
export type CoachWithOutreach = Coach & {
  outreach: Outreach | null;
};
