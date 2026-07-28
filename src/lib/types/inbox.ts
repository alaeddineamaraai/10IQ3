export type InboxMessage = {
  id: string;
  direction: "sent" | "received";
  subject: string | null;
  body: string | null;
  at: string;
};

export type InboxStatus = "sent" | "opened" | "replied";

export type InboxConversation = {
  id: string; // outreach row id
  coach_name: string;
  school_name: string;
  coach_email: string;
  division: string | null;
  status: InboxStatus;
  reply_viewed_at: string | null;
  lastActivityAt: string;
  lastMessagePreview: string;
  lastMessageDirection: "sent" | "received";
  daysSinceSent: number;
  // Sent 5+ days ago with no reply yet — a good candidate for a follow-up nudge.
  needsFollowUp: boolean;
  messages: InboxMessage[];
};
