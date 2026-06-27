import type { SupabaseClient } from "@supabase/supabase-js";

import { fetchAllCoaches } from "@/lib/data/coaches";
import type { Coach, Outreach } from "@/lib/types/coach";
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
    fetchAllCoaches<Coach>(supabase, "email, coach_name, school_name, division"),
    supabase
      .from("outreach")
      .select("*")
      .eq("user_id", userId)
      .returns<Outreach[]>(),
  ]);

  const coachByEmail = new Map(coaches.map((c) => [c.email, c]));
  const rows = outreach ?? [];
  const sentRows = rows.filter((r) => r.email_sent);

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
  const divisions = [...divisionCounts.entries()]
    .map(([division, counts]) => ({ division, ...counts }))
    .sort((a, b) => b.sent - a.sent);

  const sentEmails = sentRows
    .slice()
    .sort((a, b) => (b.sent_at ?? "").localeCompare(a.sent_at ?? ""))
    .map((row) => {
      const coach = coachByEmail.get(row.coach_email);
      return {
        id: row.id,
        coach_name: coach?.coach_name ?? row.coach_email,
        school_name: coach?.school_name ?? "—",
        subject: row.subject ?? "(no subject)",
        sent_at: row.sent_at ?? row.created_at,
        opened: row.opened,
        replied: row.replied,
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
    sentEmails,
    isSample: false,
  };
}

/** Representative data shown when there's no authenticated session yet
 * (e.g. local dev before Supabase keys are configured) so the dashboard
 * layout can still be reviewed end to end. */
export function getSampleDashboardData(): DashboardData {
  const days = lastNDays(7);
  const sentByDay = [4, 7, 3, 9, 6, 2, 5];
  const openedByDay = [2, 3, 1, 4, 3, 1, 2];
  const repliedByDay = [0, 1, 0, 2, 1, 0, 1];

  return {
    stats: { coaches: 1820, sent: 42, opened: 18, replied: 5, pending: 1778 },
    rates: { sentRate: 2.3, openRate: 42.9, replyRate: 11.9 },
    activity: days.map(({ date, label }, i) => ({
      date,
      label,
      sent: sentByDay[i],
      opened: openedByDay[i],
      replied: repliedByDay[i],
    })),
    divisions: [
      { division: "D1", sent: 18, opened: 9, replied: 3 },
      { division: "D2", sent: 11, opened: 5, replied: 1 },
      { division: "D3", sent: 8, opened: 3, replied: 1 },
      { division: "NAIA", sent: 3, opened: 1, replied: 0 },
      { division: "JUCO", sent: 2, opened: 0, replied: 0 },
    ],
    sentEmails: [
      {
        id: "1",
        coach_name: "Sarah Mitchell",
        school_name: "Duke University",
        subject: "Introduction from a 2027 recruit",
        sent_at: new Date(Date.now() - 1 * DAY_MS).toISOString(),
        opened: true,
        replied: true,
      },
      {
        id: "2",
        coach_name: "James Park",
        school_name: "UC Berkeley",
        subject: "Tennis recruiting — UTR 9.8",
        sent_at: new Date(Date.now() - 2 * DAY_MS).toISOString(),
        opened: true,
        replied: false,
      },
      {
        id: "3",
        coach_name: "Elena Torres",
        school_name: "University of Michigan",
        subject: "Prospective student-athlete introduction",
        sent_at: new Date(Date.now() - 3 * DAY_MS).toISOString(),
        opened: false,
        replied: false,
      },
    ],
    isSample: true,
  };
}
