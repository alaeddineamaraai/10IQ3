import type { SupabaseClient } from "@supabase/supabase-js";

import { fetchAllCoaches } from "@/lib/data/coaches";
import type { Coach, Outreach, OutreachFollowup, OutreachReply } from "@/lib/types/coach";
import type { DashboardData } from "@/lib/types/dashboard";

const DAY_MS = 24 * 60 * 60 * 1000;

function lastNDays(n: number) {
  const days: { date: string; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY_MS);
    days.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
    });
  }
  return days;
}

export async function getDashboardData(
  supabase: SupabaseClient,
  userId: string
): Promise<DashboardData> {
  const [{ count: coachesCount }, coaches, { data: outreach }] = await Promise.all([
    supabase.from("coaches_database").select("*", { count: "exact", head: true }),
    fetchAllCoaches<Coach>(supabase, "email, coach_name, school_name, division, region"),
    supabase
      .from("outreach")
      .select("*")
      .eq("user_id", userId)
      .returns<Outreach[]>(),
  ]);

  const coachByEmail = new Map(coaches.map((c) => [c.email, c]));
  const rows = outreach ?? [];
  const sentRows = rows.filter((r) => r.email_sent);

  const outreachIds = sentRows.map((r) => r.id);

  const [{ data: replies }, { data: followups }] = sentRows.length
    ? await Promise.all([
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
      ])
    : [{ data: [] as OutreachReply[] }, { data: [] as OutreachFollowup[] }];

  const repliesByOutreachId = new Map<string, OutreachReply[]>();
  for (const reply of replies ?? []) {
    const list = repliesByOutreachId.get(reply.outreach_id) ?? [];
    list.push(reply);
    repliesByOutreachId.set(reply.outreach_id, list);
  }

  const followupsByOutreachId = new Map<string, OutreachFollowup[]>();
  for (const fu of followups ?? []) {
    const list = followupsByOutreachId.get(fu.outreach_id) ?? [];
    list.push(fu);
    followupsByOutreachId.set(fu.outreach_id, list);
  }

  const sent = sentRows.length;
  const opened = rows.filter((r) => r.opened).length;
  const replied = rows.filter((r) => r.replied).length;
  const totalCoaches = coachesCount ?? 0;
  const pending = Math.max(totalCoaches - sent, 0);

  const days = lastNDays(7);
  const activity = days.map(({ date, label }) => {
    const dayRows = sentRows.filter((r) => r.sent_at?.slice(0, 10) === date);
    return {
      date,
      label,
      sent: dayRows.length,
      opened: dayRows.filter((r) => r.opened).length,
      replied: dayRows.filter((r) => r.replied).length,
    };
  });

  const divisionCounts = new Map<string, { sent: number; opened: number; replied: number }>();
  for (const row of sentRows) {
    const division = coachByEmail.get(row.coach_email)?.division ?? "Unknown";
    const entry = divisionCounts.get(division) ?? { sent: 0, opened: 0, replied: 0 };
    entry.sent += 1;
    if (row.opened) entry.opened += 1;
    if (row.replied) entry.replied += 1;
    divisionCounts.set(division, entry);
  }
  const ALL_DIVISIONS = ["D1", "D2", "D3", "NAIA", "JUCO"];
  for (const div of ALL_DIVISIONS) {
    if (!divisionCounts.has(div)) divisionCounts.set(div, { sent: 0, opened: 0, replied: 0 });
  }
  const divisions = ALL_DIVISIONS.map((division) => ({
    division,
    ...divisionCounts.get(division)!,
  }));

  // Region breakdown: total coaches per region and how many have been contacted
  const regionTotals = new Map<string, number>();
  const regionSent = new Map<string, number>();
  for (const coach of coaches) {
    const r = coach.region ?? "Other";
    regionTotals.set(r, (regionTotals.get(r) ?? 0) + 1);
  }
  for (const row of sentRows) {
    const r = coachByEmail.get(row.coach_email)?.region ?? "Other";
    regionSent.set(r, (regionSent.get(r) ?? 0) + 1);
  }
  const regions = [...regionTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([region, total]) => ({ region, total, sent: regionSent.get(region) ?? 0 }));

  const sentEmails = sentRows
    .slice()
    .sort((a, b) => (b.sent_at ?? "").localeCompare(a.sent_at ?? ""))
    .map((row) => {
      const coach = coachByEmail.get(row.coach_email);
      return {
        id: row.id,
        coach_name: coach?.coach_name ?? row.coach_email,
        school_name: coach?.school_name ?? "—",
        coach_email: row.coach_email,
        subject: row.subject ?? "(no subject)",
        body: row.body ?? "",
        sent_at: row.sent_at ?? row.created_at,
        opened: row.opened,
        replied: row.replied,
        opened_at: row.opened_at,
        replied_at: row.replied_at,
        reply_viewed_at: row.reply_viewed_at,
        thread: [
          ...(repliesByOutreachId.get(row.id) ?? []).map((reply) => ({
            id: reply.id,
            from: "coach" as const,
            subject: reply.subject,
            body: reply.body,
            timestamp: reply.received_at,
          })),
          ...(followupsByOutreachId.get(row.id) ?? []).map((fu) => ({
            id: fu.id,
            from: "athlete" as const,
            subject: fu.subject,
            body: fu.body,
            timestamp: fu.sent_at,
          })),
        ].sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
      };
    });

  return {
    stats: { coaches: totalCoaches, sent, opened, replied, pending },
    rates: {
      sentRate: totalCoaches ? (sent / totalCoaches) * 100 : 0,
      openRate: sent ? (opened / sent) * 100 : 0,
      replyRate: sent ? (replied / sent) * 100 : 0,
    },
    activity,
    divisions,
    regions,
    sentEmails,
    isSample: false,
  };
}

/** Representative data shown when there's no authenticated session yet
 * (e.g. local dev before Supabase keys are configured) so the dashboard
 * layout can still be reviewed end to end. */
export function getSampleDashboardData(): DashboardData {
  const h = (n: number) => new Date(Date.now() - n * 60 * 60 * 1000).toISOString();
  const d = (n: number) => new Date(Date.now() - n * DAY_MS).toISOString();

  const days = lastNDays(14);
  const sentByDay =    [0, 8, 12, 6, 0, 14, 9, 3, 0, 11, 7, 0, 5, 4];
  const openedByDay =  [0, 4,  5, 2, 0,  6, 4, 1, 0,  5, 3, 0, 2, 2];
  const repliedByDay = [0, 1,  2, 0, 0,  2, 1, 0, 0,  1, 1, 0, 0, 1];

  return {
    stats: { coaches: 1847, sent: 79, opened: 34, replied: 9, pending: 1768 },
    rates: { sentRate: 4.3, openRate: 43.0, replyRate: 11.4 },
    activity: days.map(({ date, label }, i) => ({
      date, label,
      sent: sentByDay[i],
      opened: openedByDay[i],
      replied: repliedByDay[i],
    })),
    regions: [
      { region: "Southeast", total: 423, sent: 28 },
      { region: "Northeast", total: 312, sent: 19 },
      { region: "West",      total: 384, sent: 17 },
      { region: "Midwest",   total: 291, sent: 11 },
      { region: "Southwest", total: 253, sent: 4 },
      { region: "New England", total: 184, sent: 0 },
    ],
    divisions: [
      { division: "D1",   sent: 38, opened: 17, replied: 5 },
      { division: "D2",   sent: 21, opened:  9, replied: 2 },
      { division: "D3",   sent: 14, opened:  6, replied: 2 },
      { division: "NAIA", sent:  4, opened:  2, replied: 0 },
      { division: "JUCO", sent:  2, opened:  0, replied: 0 },
    ],
    sentEmails: [
      {
        id: "s1",
        coach_name: "Sarah Mitchell",
        school_name: "Duke University",
        coach_email: "sarah.mitchell@duke.edu",
        subject: "2027 Recruit | Alex Player – WTN 6.2 / UTR 11.8",
        body: "Hi Coach Mitchell,\n\nMy name is Alex Player and I'm a 2027 student-athlete from San Jose, CA. I'm currently ranked WTN 6.2 with a UTR of 11.8 and went 22-6 in singles this season. Duke's academic reputation combined with the level of your D1 program is exactly what I'm looking for.\n\nI'd love to send over my highlight reel and schedule a brief call if you have availability.\n\nThank you for your time,\nAlex",
        sent_at: d(1),
        opened: true,
        replied: true,
        opened_at: h(20),
        replied_at: h(16),
        reply_viewed_at: h(15),
        thread: [
          {
            id: "r-s1-a",
            from: "coach" as const,
            subject: "Re: 2027 Recruit | Alex Player – WTN 6.2 / UTR 11.8",
            body: "Hi Alex,\n\nThanks for reaching out — your UTR and singles record definitely stand out. Could you send over a recent match video and your fall tournament schedule? We'll be evaluating recruits heavily this fall.\n\nBest,\nCoach Mitchell",
            timestamp: h(16),
          },
          {
            id: "r-s1-b",
            from: "athlete" as const,
            subject: "Re: 2027 Recruit | Alex Player – WTN 6.2 / UTR 11.8",
            body: "Hi Coach Mitchell,\n\nThank you so much for getting back to me! I've linked my highlight reel below and my schedule starts September 6th at the Bay Area Open. Would love to connect for a quick call anytime that week.\n\nAlex",
            timestamp: h(12),
          },
        ],
      },
      {
        id: "s2",
        coach_name: "James Park",
        school_name: "UCLA",
        coach_email: "james.park@ucla.edu",
        subject: "2027 Recruit | Alex Player – WTN 6.2 / UTR 11.8",
        body: "Hi Coach Park,\n\nI'm reaching out ahead of the recruiting season to introduce myself as a prospective 2027 student-athlete...",
        sent_at: d(2),
        opened: true,
        replied: true,
        opened_at: h(44),
        replied_at: h(38),
        reply_viewed_at: h(37),
        thread: [
          {
            id: "r-s2-a",
            from: "coach" as const,
            subject: "Re: 2027 Recruit | Alex Player – WTN 6.2 / UTR 11.8",
            body: "Alex,\n\nAppreciate the note — we're actively building our 2027 class. Please fill out our official recruiting form on the UCLA Athletics site and send your UTR profile link when you get a chance.\n\nCoach Park",
            timestamp: h(38),
          },
        ],
      },
      {
        id: "s3",
        coach_name: "Elena Torres",
        school_name: "Stanford University",
        coach_email: "elena.torres@stanford.edu",
        subject: "2027 Recruit | Alex Player – WTN 6.2 / UTR 11.8",
        body: "Hi Coach Torres,\n\nI'm reaching out to introduce myself as a prospective D1 student-athlete...",
        sent_at: d(3),
        opened: true,
        replied: false,
        opened_at: h(64),
        replied_at: null,
        reply_viewed_at: null,
        thread: [],
      },
      {
        id: "s4",
        coach_name: "Marcus Webb",
        school_name: "University of Virginia",
        coach_email: "marcus.webb@virginia.edu",
        subject: "2027 Recruit | Alex Player – WTN 6.2 / UTR 11.8",
        body: "Hi Coach Webb,\n\nI'm very interested in Virginia's tennis program...",
        sent_at: d(5),
        opened: true,
        replied: true,
        opened_at: h(112),
        replied_at: h(96),
        reply_viewed_at: h(90),
        thread: [
          {
            id: "r-s4-a",
            from: "coach" as const,
            subject: "Re: 2027 Recruit | Alex Player – WTN 6.2 / UTR 11.8",
            body: "Hi Alex — great timing. We have two roster spots available in the 2027 class. Would you be open to a campus visit sometime in October?\n\nCoach Webb",
            timestamp: h(96),
          },
          {
            id: "r-s4-b",
            from: "athlete" as const,
            subject: "Re: 2027 Recruit | Alex Player – WTN 6.2 / UTR 11.8",
            body: "Coach Webb,\n\nAbsolutely — October works great. I'm free the 12th–15th and would love to see the facilities and meet the team.\n\nAlex",
            timestamp: h(88),
          },
        ],
      },
      {
        id: "s5",
        coach_name: "Priya Nair",
        school_name: "Vanderbilt University",
        coach_email: "priya.nair@vanderbilt.edu",
        subject: "2027 Recruit | Alex Player – WTN 6.2 / UTR 11.8",
        body: "Hi Coach Nair,\n\nI've been following Vanderbilt's program closely...",
        sent_at: d(6),
        opened: true,
        replied: false,
        opened_at: h(134),
        replied_at: null,
        reply_viewed_at: null,
        thread: [],
      },
      {
        id: "s6",
        coach_name: "David Chen",
        school_name: "University of North Carolina",
        coach_email: "david.chen@unc.edu",
        subject: "2027 Recruit | Alex Player – WTN 6.2 / UTR 11.8",
        body: "Hi Coach Chen,\n\nI'm reaching out to introduce myself...",
        sent_at: d(8),
        opened: false,
        replied: false,
        opened_at: null,
        replied_at: null,
        reply_viewed_at: null,
        thread: [],
      },
      {
        id: "s7",
        coach_name: "Aisha Johnson",
        school_name: "University of Florida",
        coach_email: "aisha.johnson@ufl.edu",
        subject: "2027 Recruit | Alex Player – WTN 6.2 / UTR 11.8",
        body: "Hi Coach Johnson,\n\nUF's track record in the SEC is exactly the competitive environment I'm looking for...",
        sent_at: d(9),
        opened: true,
        replied: true,
        opened_at: h(208),
        replied_at: h(196),
        reply_viewed_at: h(195),
        thread: [
          {
            id: "r-s7-a",
            from: "coach" as const,
            subject: "Re: 2027 Recruit | Alex Player – WTN 6.2 / UTR 11.8",
            body: "Alex, your stats look strong for our program. Let's set up a call next week — I'll have my assistant reach out with some times.\n\nCoach Johnson",
            timestamp: h(196),
          },
        ],
      },
      {
        id: "s8",
        coach_name: "Tyler Brooks",
        school_name: "Ohio State University",
        coach_email: "tyler.brooks@osu.edu",
        subject: "2027 Recruit | Alex Player – WTN 6.2 / UTR 11.8",
        body: "Hi Coach Brooks,\n\nI'm a 2027 recruit with a strong interest in Ohio State's program...",
        sent_at: d(11),
        opened: false,
        replied: false,
        opened_at: null,
        replied_at: null,
        reply_viewed_at: null,
        thread: [],
      },
    ],
    isSample: true,
  };
}
