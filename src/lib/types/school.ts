export type School = {
  school_name: string;
  division: string;
  coach_count: number;
  avg_utr: number | null;
  avg_wtn: number | null;
};

export type SchoolDetail = School & {
  coaches: {
    email: string;
    coach_name: string;
    team_utr: number | null;
    team_wtn: number | null;
    notes: string | null;
    email_sent: boolean;
    opened: boolean;
    replied: boolean;
  }[];
};
