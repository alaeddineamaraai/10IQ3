export type Coach = {
  email: string;
  coach_name: string;
  school_name: string;
  division: string | null;
  gender: string | null;
  head_coach_name: string | null;
  assistant_coaches: string | null;
  team_utr: number | null;
  team_wtn: number | null;
  ita_team_ranking: number | null;
  region: string | null;
  conference: string | null;
  roster_size: number | null;
  indoor_courts: number | null;
  outdoor_courts: number | null;
  scholarships_offered: boolean | null;
  city: string | null;
  state: string | null;
  website: string | null;
  tuition_in_state: number | null;
  tuition_out_of_state: number | null;
  room_and_board: number | null;
  total_annual_cost: number | null;
  acceptance_rate: number | null;
  student_population: number | null;
  avg_sat_score: number | null;
  degrees_offered: string | null;
  housing_on_campus: boolean | null;
  setting: string | null;
  nearest_airport: string | null;
  distance_to_airport_miles: number | null;
  avg_temp_jan_f: number | null;
  avg_temp_july_f: number | null;
  climate_description: string | null;
  campus_description: string | null;
  notes: string | null;
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
  reply_viewed_at: string | null;
  resend_email_id: string | null;
  created_at: string;
};

/** A reply received via Resend Inbound, threaded to one outreach row. */
export type OutreachFollowup = {
  id: string;
  outreach_id: string;
  subject: string | null;
  body: string | null;
  sent_at: string;
  resend_email_id: string | null;
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

/** Full coach profile: coach data + outreach row with threaded replies. */
export type CoachProfile = Coach & {
  outreach: (Outreach & { replies: OutreachReply[] }) | null;
};
