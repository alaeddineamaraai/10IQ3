import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AthleteProfile } from "@/lib/types/profile";

const FREE_PLAN_EMAIL_LIMIT = 5;

async function sendViaResend(to: string, subject: string, body: string) {
  if (!process.env.RESEND_API_KEY) {
    return { delivered: false, reason: "RESEND_API_KEY not configured" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "10IQ <recruiting@mail.netset.pro>",
      to,
      subject,
      text: body,
    }),
  });

  if (!res.ok) {
    return { delivered: false, reason: `Resend error: ${res.status}` };
  }

  return { delivered: true };
}

export async function POST(request: Request) {
  const { coach_email, subject, body } = await request.json();

  if (!coach_email || !subject || !body) {
    return NextResponse.json({ error: "Missing coach_email, subject, or body" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", auth.user.id)
    .single<AthleteProfile>();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Could not load profile" }, { status: 500 });
  }

  if (profile.plan === "free" && profile.emails_used >= FREE_PLAN_EMAIL_LIMIT) {
    return NextResponse.json(
      { error: "Free plan limit reached", code: "PLAN_LIMIT_REACHED" },
      { status: 402 }
    );
  }

  const { delivered, reason } = await sendViaResend(coach_email, subject, body);

  const { error: outreachError } = await supabase.from("outreach").upsert(
    {
      user_id: auth.user.id,
      coach_email,
      email_sent: true,
      sent_at: new Date().toISOString(),
      subject,
      body,
    },
    { onConflict: "user_id,coach_email" }
  );

  if (outreachError) {
    return NextResponse.json({ error: outreachError.message }, { status: 500 });
  }

  await supabase
    .from("users")
    .update({ emails_used: profile.emails_used + 1 })
    .eq("id", auth.user.id);

  return NextResponse.json({ ok: true, delivered, reason });
}
