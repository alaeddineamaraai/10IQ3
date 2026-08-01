import type { SupabaseClient } from "@supabase/supabase-js";

import type { Coach, Outreach, OutreachFollowup, OutreachReply } from "@/lib/types/coach";
import type { InboxConversation, InboxMessage, InboxStatus } from "@/lib/types/inbox";

const DAY_MS = 24 * 60 * 60 * 1000;
const FOLLOW_UP_AFTER_DAYS = 5;

function truncate(text: string | null | undefined, max = 140): string {
  if (!text) return "";
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function buildConversation(
  row: Outreach,
  coach: Pick<Coach, "coach_name" | "school_name" | "division"> | undefined,
  replies: OutreachReply[],
  followups: OutreachFollowup[]
): InboxConversation {
  const messages: InboxMessage[] = [
    {
      id: row.id,
      direction: "sent" as const,
      subject: row.subject,
      body: row.body,
      at: row.sent_at ?? row.created_at,
    },
    ...replies.map((r) => ({
      id: r.id,
      direction: "received" as const,
      subject: r.subject,
      body: r.body,
      at: r.received_at,
    })),
    ...followups.map((f) => ({
      id: f.id,
      direction: "sent" as const,
      subject: f.subject,
      body: f.body,
      at: f.sent_at,
    })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  const last = messages[messages.length - 1];
  const status: InboxStatus = row.replied ? "replied" : row.opened ? "opened" : "sent";
  const sentAt = row.sent_at ?? row.created_at;
  const daysSinceSent = Math.floor((Date.now() - new Date(sentAt).getTime()) / DAY_MS);

  return {
    id: row.id,
    coach_name: coach?.coach_name ?? row.coach_email,
    school_name: coach?.school_name ?? "—",
    coach_email: row.coach_email,
    division: coach?.division ?? null,
    status,
    reply_viewed_at: row.reply_viewed_at,
    lastActivityAt: last.at,
    lastMessagePreview: truncate(last.body),
    lastMessageDirection: last.direction,
    daysSinceSent,
    needsFollowUp: !row.replied && daysSinceSent >= FOLLOW_UP_AFTER_DAYS,
    messages,
  };
}

export async function getInboxConversations(
  supabase: SupabaseClient,
  userId: string
): Promise<InboxConversation[]> {
  const { data: outreach } = await supabase
    .from("outreach")
    .select("*")
    .eq("user_id", userId)
    .eq("email_sent", true)
    .returns<Outreach[]>();

  const rows = outreach ?? [];
  if (rows.length === 0) return [];

  const emails = [...new Set(rows.map((r) => r.coach_email))];
  const { data: coaches } = await supabase
    .from("coaches_database")
    .select("email, coach_name, school_name, division")
    .in("email", emails)
    .returns<Pick<Coach, "email" | "coach_name" | "school_name" | "division">[]>();

  const coachByEmail = new Map((coaches ?? []).map((c) => [c.email, c]));

  const outreachIds = rows.map((r) => r.id);

  const [{ data: replies }, { data: followups }] = await Promise.all([
    supabase
      .from("outreach_replies")
      .select("*")
      .in("outreach_id", outreachIds)
      .order("received_at", { ascending: true })
      .returns<OutreachReply[]>(),
    supabase
      .from("outreach_followups")
      .select("*")
      .in("outreach_id", outreachIds)
      .order("sent_at", { ascending: true })
      .returns<OutreachFollowup[]>(),
  ]);

  const repliesByOutreachId = new Map<string, OutreachReply[]>();
  for (const reply of replies ?? []) {
    const list = repliesByOutreachId.get(reply.outreach_id) ?? [];
    list.push(reply);
    repliesByOutreachId.set(reply.outreach_id, list);
  }

  const followupsByOutreachId = new Map<string, OutreachFollowup[]>();
  for (const followup of followups ?? []) {
    const list = followupsByOutreachId.get(followup.outreach_id) ?? [];
    list.push(followup);
    followupsByOutreachId.set(followup.outreach_id, list);
  }

  return rows
    .map((row) =>
      buildConversation(
        row,
        coachByEmail.get(row.coach_email),
        repliesByOutreachId.get(row.id) ?? [],
        followupsByOutreachId.get(row.id) ?? []
      )
    )
    .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
}

export function getSampleInboxConversations(): InboxConversation[] {
  const daysAgo = (n: number) => new Date(Date.now() - n * DAY_MS).toISOString();

  const raw: {
    outreach: Outreach;
    coach: Pick<Coach, "coach_name" | "school_name" | "division">;
    replies: OutreachReply[];
  }[] = [
    {
      outreach: {
        id: "sample-1",
        user_id: "sample",
        coach_email: "sarah.mitchell@duke.edu",
        email_sent: true,
        sent_at: daysAgo(1),
        subject: "2027 Recruit | Alex Player - UTR 11.8",
        body: "Dear Coach Mitchell,\n\nI'm excited about Duke's program...",
        opened: true,
        replied: true,
        opened_at: daysAgo(1),
        replied_at: daysAgo(0.3),
        reply_viewed_at: null,
        resend_email_id: null,
        created_at: daysAgo(1),
      },
      coach: { coach_name: "Sarah Mitchell", school_name: "Duke University", division: "D1" },
      replies: [
        {
          id: "reply-1",
          outreach_id: "sample-1",
          from_email: "sarah.mitchell@duke.edu",
          subject: "Re: 2027 Recruit | Alex Player - UTR 11.8",
          body: "Thanks for reaching out, Alex — your UTR and record stand out. Could you send over a highlight reel and your fall tournament schedule?",
          received_at: daysAgo(0.3),
        },
      ],
    },
    {
      outreach: {
        id: "sample-2",
        user_id: "sample",
        coach_email: "james.park@berkeley.edu",
        email_sent: true,
        sent_at: daysAgo(2),
        subject: "2027 Recruit | Alex Player - UTR 11.8",
        body: "Dear Coach Park,\n\nI've been following UC Berkeley's program...",
        opened: true,
        replied: false,
        opened_at: daysAgo(2),
        replied_at: null,
        reply_viewed_at: null,
        resend_email_id: null,
        created_at: daysAgo(2),
      },
      coach: { coach_name: "James Park", school_name: "UC Berkeley", division: "D2" },
      replies: [],
    },
    {
      outreach: {
        id: "sample-3",
        user_id: "sample",
        coach_email: "elena.torres@umich.edu",
        email_sent: true,
        sent_at: daysAgo(8),
        subject: "2027 Recruit | Alex Player - UTR 11.8",
        body: "Dear Coach Torres,\n\nI'm reaching out to introduce myself...",
        opened: false,
        replied: false,
        opened_at: null,
        replied_at: null,
        reply_viewed_at: null,
        resend_email_id: null,
        created_at: daysAgo(8),
      },
      coach: { coach_name: "Elena Torres", school_name: "University of Michigan", division: "D3" },
      replies: [],
    },
    {
      outreach: {
        id: "sample-4",
        user_id: "sample",
        coach_email: "marcus.webb@emory.edu",
        email_sent: true,
        sent_at: daysAgo(6),
        subject: "2027 Recruit | Alex Player - UTR 11.8",
        body: "Dear Coach Webb,\n\nI'm very interested in Emory's program...",
        opened: true,
        replied: true,
        opened_at: daysAgo(6),
        replied_at: daysAgo(4),
        reply_viewed_at: daysAgo(3),
        resend_email_id: null,
        created_at: daysAgo(6),
      },
      coach: { coach_name: "Marcus Webb", school_name: "Emory University", division: "D3" },
      replies: [
        {
          id: "reply-4",
          outreach_id: "sample-4",
          from_email: "marcus.webb@emory.edu",
          subject: "Re: 2027 Recruit | Alex Player - UTR 11.8",
          body: "Great to hear from you! We'd love to learn more — are you able to visit campus this fall?",
          received_at: daysAgo(4),
        },
      ],
    },
  ];

  return raw
    .map((r) => buildConversation(r.outreach, r.coach, r.replies, []))
    .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
}
