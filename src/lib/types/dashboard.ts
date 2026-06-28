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
  opened: number;
  replied: number;
};

export type DivisionBreakdown = {
  division: string;
  sent: number;
  opened: number;
  replied: number;
};

export type SentEmailReply = {
  id: string;
  from_email: string;
  subject: string | null;
  body: string | null;
  received_at: string;
};

export type SentEmailRow = {
  id: string;
  coach_name: string;
  school_name: string;
  coach_email: string;
  subject: string;
  body: string;
  sent_at: string;
  opened: boolean;
  replied: boolean;
  opened_at: string | null;
  replied_at: string | null;
  replies: SentEmailReply[];
};

export type DashboardData = {
  stats: DashboardStats;
  rates: DashboardRates;
  activity: ActivityPoint[];
  divisions: DivisionBreakdown[];
  sentEmails: SentEmailRow[];
  isSample: boolean;
};
