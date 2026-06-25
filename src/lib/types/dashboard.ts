export type DashboardStats = {
  coaches: number;
  sent: number;
  opened: number;
  replied: number;
  pending: number;
};

export type DashboardRates = {
  sentRate: number;
  openRate: number;
  replyRate: number;
};

export type ActivityPoint = {
  date: string;
  label: string;
  sent: number;
};

export type DivisionBreakdown = {
  division: string;
  sent: number;
};

export type SentEmailRow = {
  id: string;
  coach_name: string;
  school_name: string;
  subject: string;
  sent_at: string;
  opened: boolean;
  replied: boolean;
};

export type DashboardData = {
  stats: DashboardStats;
  rates: DashboardRates;
  activity: ActivityPoint[];
  divisions: DivisionBreakdown[];
  sentEmails: SentEmailRow[];
  isSample: boolean;
};
