import type { SupabaseClient } from "@supabase/supabase-js";

import type { Coach, Outreach, OutreachReply } from "@/lib/types/coach";
import type { NotificationItem } from "@/lib/types/notification";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getNotifications(
  supabase: SupabaseClient,
  userId: string
): Promise<NotificationItem[]> {
  const { data: outreach } = await supabase
    .from("outreach")
    .select("*")
    .eq("user_id", userId)
    .eq("replied", true)
    .order("replied_at", { ascending: false })
    .returns<Outreach[]>();

  const rows = outreach ?? [];
  if (rows.length === 0) return [];

  const emails = rows.map((r) => r.coach_email);
  const { data: coaches } = await supabase
    .from("coaches_database")
    .select("email, coach_name, school_name, division")
    .in("email", emails)
    .returns<Pick<Coach, "email" | "coach_name" | "school_name" | "division">[]>();

  const coachByEmail = new Map((coaches ?? []).map((c) => [c.email, c]));

  const { data: replies } = await supabase
    .from("outreach_replies")
    .select("*")
    .in("outreach_id", rows.map((r) => r.id))
    .order("received_at", { ascending: false })
    .returns<OutreachReply[]>();

  const latestReplyByOutreachId = new Map<string, OutreachReply>();
  for (const reply of replies ?? []) {
    if (!latestReplyByOutreachId.has(reply.outreach_id)) {
      latestReplyByOutreachId.set(reply.outreach_id, reply);
    }
  }

  return rows.map((row) => {
    const coach = coachByEmail.get(row.coach_email);
    const latestReply = latestReplyByOutreachId.get(row.id);
    return {
      id: row.id,
      coach_name: coach?.coach_name ?? row.coach_email,
      school_name: coach?.school_name ?? "—",
      coach_email: row.coach_email,
      subject: row.subject,
      division: coach?.division ?? null,
      replied_at: row.replied_at ?? row.created_at,
      reply_viewed_at: row.reply_viewed_at,
      preview: latestReply?.body?.slice(0, 160) ?? null,
    };
  });
}

export function getSampleNotifications(): NotificationItem[] {
  return [
    {
      id: "n1",
      coach_name: "Sarah Mitchell",
      school_name: "Duke University",
      coach_email: "sarah.mitchell@duke.edu",
      subject: "Introduction from a 2027 recruit",
      division: "D1",
      replied_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      reply_viewed_at: null,
      preview:
        "Thanks for reaching out, Alex — your UTR and record stand out. Could you send over a highlight reel and your fall tournament schedule?",
    },
    {
      id: "n2",
      coach_name: "Marcus Webb",
      school_name: "Emory University",
      coach_email: "marcus.webb@emory.edu",
      subject: "Re: Prospective student-athlete introduction",
      division: "D3",
      replied_at: new Date(Date.now() - 3 * DAY_MS).toISOString(),
      reply_viewed_at: new Date(Date.now() - 2 * DAY_MS).toISOString(),
      preview:
        "Great to hear from you! We'd love to learn more — are you able to visit campus this fall?",
    },
  ];
}
