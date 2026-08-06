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
  const h = (n: number) => new Date(Date.now() - n * 60 * 60 * 1000).toISOString();
  const d = (n: number) => new Date(Date.now() - n * DAY_MS).toISOString();
  const sub = "2027 Recruit | Alex Player – WTN 6.2 / UTR 11.8";
  const base: Omit<Outreach, "id" | "coach_email" | "sent_at" | "subject" | "body" | "opened" | "replied" | "opened_at" | "replied_at" | "reply_viewed_at" | "created_at"> = {
    user_id: "sample", email_sent: true, resend_email_id: null,
    scheduled_for: null, schedule_attempts: 0, schedule_failed: false,
  };

  const raw: {
    outreach: Outreach;
    coach: Pick<Coach, "coach_name" | "school_name" | "division">;
    replies: OutreachReply[];
  }[] = [
    {
      outreach: { ...base, id: "si-1", coach_email: "sarah.mitchell@duke.edu", email_sent: true, sent_at: d(1), subject: sub, body: "Hi Coach Mitchell,\n\nMy name is Alex Player and I'm a 2027 student-athlete from San Jose, CA with a WTN of 6.2 and UTR of 11.8...", opened: true, replied: true, opened_at: h(20), replied_at: h(16), reply_viewed_at: h(15), created_at: d(1) },
      coach: { coach_name: "Sarah Mitchell", school_name: "Duke University", division: "D1" },
      replies: [
        { id: "r-1a", outreach_id: "si-1", from_email: "sarah.mitchell@duke.edu", subject: "Re: " + sub, body: "Hi Alex,\n\nThanks for reaching out — your UTR and singles record definitely stand out. Could you send over a recent match video and your fall tournament schedule? We'll be evaluating recruits heavily this fall.\n\nBest,\nCoach Mitchell", received_at: h(16) },
      ],
    },
    {
      outreach: { ...base, id: "si-2", coach_email: "james.park@ucla.edu", email_sent: true, sent_at: d(2), subject: sub, body: "Hi Coach Park,\n\nI'm reaching out ahead of the recruiting season to introduce myself as a prospective 2027 student-athlete...", opened: true, replied: true, opened_at: h(44), replied_at: h(38), reply_viewed_at: h(37), created_at: d(2) },
      coach: { coach_name: "James Park", school_name: "UCLA", division: "D1" },
      replies: [
        { id: "r-2a", outreach_id: "si-2", from_email: "james.park@ucla.edu", subject: "Re: " + sub, body: "Alex,\n\nAppreciate the note — we're actively building our 2027 class. Please fill out our official recruiting form on the UCLA Athletics site and send your UTR profile link when you get a chance.\n\nCoach Park", received_at: h(38) },
      ],
    },
    {
      outreach: { ...base, id: "si-3", coach_email: "marcus.webb@virginia.edu", email_sent: true, sent_at: d(5), subject: sub, body: "Hi Coach Webb,\n\nI'm very interested in Virginia's tennis program...", opened: true, replied: true, opened_at: h(112), replied_at: h(96), reply_viewed_at: h(90), created_at: d(5) },
      coach: { coach_name: "Marcus Webb", school_name: "University of Virginia", division: "D1" },
      replies: [
        { id: "r-3a", outreach_id: "si-3", from_email: "marcus.webb@virginia.edu", subject: "Re: " + sub, body: "Hi Alex — great timing. We have two roster spots available in the 2027 class. Would you be open to a campus visit sometime in October?\n\nCoach Webb", received_at: h(96) },
      ],
    },
    {
      outreach: { ...base, id: "si-4", coach_email: "aisha.johnson@ufl.edu", email_sent: true, sent_at: d(9), subject: sub, body: "Hi Coach Johnson,\n\nUF's track record in the SEC is exactly the competitive environment I'm looking for...", opened: true, replied: true, opened_at: h(208), replied_at: h(196), reply_viewed_at: h(195), created_at: d(9) },
      coach: { coach_name: "Aisha Johnson", school_name: "University of Florida", division: "D1" },
      replies: [
        { id: "r-4a", outreach_id: "si-4", from_email: "aisha.johnson@ufl.edu", subject: "Re: " + sub, body: "Alex, your stats look strong for our program. Let's set up a call next week — I'll have my assistant reach out with some times.\n\nCoach Johnson", received_at: h(196) },
      ],
    },
    {
      outreach: { ...base, id: "si-5", coach_email: "elena.torres@stanford.edu", email_sent: true, sent_at: d(3), subject: sub, body: "Hi Coach Torres,\n\nI've long admired Stanford's academic and athletic reputation...", opened: true, replied: false, opened_at: h(64), replied_at: null, reply_viewed_at: null, created_at: d(3) },
      coach: { coach_name: "Elena Torres", school_name: "Stanford University", division: "D1" },
      replies: [],
    },
    {
      outreach: { ...base, id: "si-6", coach_email: "priya.nair@vanderbilt.edu", email_sent: true, sent_at: d(6), subject: sub, body: "Hi Coach Nair,\n\nI've been following Vanderbilt's program closely and believe it's an ideal fit...", opened: true, replied: false, opened_at: h(134), replied_at: null, reply_viewed_at: null, created_at: d(6) },
      coach: { coach_name: "Priya Nair", school_name: "Vanderbilt University", division: "D1" },
      replies: [],
    },
    {
      outreach: { ...base, id: "si-7", coach_email: "david.chen@unc.edu", email_sent: true, sent_at: d(8), subject: sub, body: "Hi Coach Chen,\n\nI'm reaching out to introduce myself...", opened: false, replied: false, opened_at: null, replied_at: null, reply_viewed_at: null, created_at: d(8) },
      coach: { coach_name: "David Chen", school_name: "University of North Carolina", division: "D1" },
      replies: [],
    },
    {
      outreach: { ...base, id: "si-8", coach_email: "tyler.brooks@osu.edu", email_sent: true, sent_at: d(11), subject: sub, body: "Hi Coach Brooks,\n\nI'm a 2027 recruit with a strong interest in Ohio State's program...", opened: false, replied: false, opened_at: null, replied_at: null, reply_viewed_at: null, created_at: d(11) },
      coach: { coach_name: "Tyler Brooks", school_name: "Ohio State University", division: "D1" },
      replies: [],
    },
  ];

  return raw
    .map((r) => buildConversation(r.outreach, r.coach, r.replies, []))
    .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
}
