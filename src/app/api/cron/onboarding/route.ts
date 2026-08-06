import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendOnboardingEmail } from "@/lib/email/notify";

function authorized(request: Request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  return token && token === process.env.CRON_SECRET;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// (minDays, maxDays] window for each step so an off-by-one cron run
// doesn't permanently miss users.
const STEPS: { step: 1 | 2 | 3; minDays: number; maxDays: number }[] = [
  { step: 1, minDays: 0, maxDays: 2 },   // send between day 1–2
  { step: 2, minDays: 2, maxDays: 5 },   // send between day 3–5
  { step: 3, minDays: 6, maxDays: 10 },  // send between day 7–10
];

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  let sent = 0;

  for (const { step, minDays, maxDays } of STEPS) {
    // Find users at this onboarding step whose account age falls in the window.
    const windowStart = new Date(Date.now() - maxDays * DAY_MS).toISOString();
    const windowEnd = new Date(Date.now() - minDays * DAY_MS).toISOString();

    const { data: users } = await admin
      .from("users")
      .select("id, email, name")
      .lt("onboarding_step", step)   // haven't received this step yet
      .gte("created_at", windowStart)
      .lte("created_at", windowEnd);

    if (!users?.length) continue;

    for (const user of users) {
      try {
        await sendOnboardingEmail({
          athleteEmail: user.email,
          athleteName: user.name,
          step,
        });

        // Advance the step so this email is never sent again.
        await admin.from("users").update({ onboarding_step: step }).eq("id", user.id);
        sent++;
      } catch {
        // Skip individual failures.
      }
    }
  }

  return NextResponse.json({ sent });
}
