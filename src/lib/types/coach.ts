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
  created_at: string;
};

/** coaches_database joined with the current user's outreach row, if any. */
export type CoachWithOutreach = Coach & {
  outreach: Outreach | null;
};
