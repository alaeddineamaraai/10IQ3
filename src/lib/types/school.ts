export type School = {
  school_name: string;
  division: string;
  coach_count: number;
  avg_utr: number | null;
  avg_wtn: number | null;
};

export type SchoolCoach = {
  email: string;
  coach_name: string;
  gender: string | null;
  head_coach_name: string | null;
  assistant_coaches: string | null;
  team_utr: number | null;
  team_wtn: number | null;
  ita_team_ranking: number | null;
  conference: string | null;
  roster_size: number | null;
  indoor_courts: number | null;
  outdoor_courts: number | null;
  scholarships_offered: boolean | null;
  notes: string | null;
  email_sent: boolean;
  opened: boolean;
  replied: boolean;
};

export type SchoolInfo = {
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
};

export type SchoolDetail = School & {
  info: SchoolInfo;
  coaches: SchoolCoach[];
};
