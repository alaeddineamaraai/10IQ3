import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendWeeklyDigest } from "@/lib/email/notify";

// Vercel Cron sends Authorization: Bearer ${CRON_SECRET}.
function authorized(request: Request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  return token && token === process.env.CRON_SECRET;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Load all users who have been active (sent at least one email ever) or
  // signed up within the last 30 days (still in the onboarding window).
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: users } = await admin
    .from("users")
    .select("id, email, name, emails_used, created_at")
    .or(`emails_used.gt.0,created_at.gte.${thirtyDaysAgo}`);

  if (!users?.length) return NextResponse.json({ sent: 0 });

  // Fetch total coach count once.
  const { count: totalCoaches } = await admin
    .from("coaches_database")
    .select("*", { count: "exact", head: true });

  let sent = 0;
  for (const user of users) {
    try {
      // Get this week's outreach stats.
      const { data: weekRows } = await admin
        .from("outreach")
        .select("opened, replied")
        .eq("user_id", user.id)
        .eq("email_sent", true)
        .gte("sent_at", weekAgo);

      const weekSent = weekRows?.length ?? 0;
      const weekOpened = weekRows?.filter((r) => r.opened).length ?? 0;
      const weekReplied = weekRows?.filter((r) => r.replied).length ?? 0;

      // Skip users who signed up >30 days ago and sent nothing this week.
      const isNew = new Date(user.created_at) >= new Date(thirtyDaysAgo);
      if (!isNew && weekSent === 0) continue;

      // Find a recently-opened coach to highlight as a follow-up nudge.
      const { data: hotRow } = await admin
        .from("outreach")
        .select("coach_email, coaches_database!inner(coach_name)")
        .eq("user_id", user.id)
        .eq("opened", true)
        .eq("replied", false)
        .order("opened_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hotCoachName = (hotRow as any)?.coaches_database?.coach_name ?? hotRow?.coach_email ?? null;

      await sendWeeklyDigest({
        athleteEmail: user.email,
        athleteName: user.name,
        weekSent,
        weekOpened,
        weekReplied,
        totalSent: user.emails_used ?? 0,
        totalCoaches: totalCoaches ?? 0,
        hotCoach: hotCoachName,
      });

      sent++;
    } catch {
      // Skip failed individual sends — don't abort the whole batch.
    }
  }

  return NextResponse.json({ sent });
}
