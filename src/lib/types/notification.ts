export type NotificationItem = {
  id: string; // outreach row id
  coach_name: string;
  school_name: string;
  coach_email: string;
  subject: string | null;
  division: string | null;
  replied_at: string;
  reply_viewed_at: string | null;
  preview: string | null;
};
