import { NextResponse } from "next/server";
import { Resend } from "resend";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AthleteProfile } from "@/lib/types/profile";

const FREE_PLAN_EMAIL_LIMIT = 5;

function htmlFromPlainText(text: string) {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${escaped}</div>`;
}

async function sendViaResend(
  to: string,
  subject: string,
  body: string,
  replyTo: string | undefined
) {
  if (!process.env.RESEND_API_KEY) {
    return { delivered: false as const, reason: "RESEND_API_KEY not configured" };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: "Netset <recruiting@mail.netset.pro>",
    to,
    subject,
    text: body,
    // HTML is required for Resend's open-tracking pixel; the plain-text
    // part keeps it looking identical to a normal email.
    html: htmlFromPlainText(body),
    ...(replyTo ? { replyTo } : {}),
  });

  if (error || !data) {
    return { delivered: false as const, reason: `Resend error: ${error?.message ?? "unknown"}` };
  }

  return { delivered: true as const, emailId: data.id };
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

  // The outreach row's id is needed *before* sending so the Reply-To address
  // can carry it (reply+<id>@...) and inbound replies thread back correctly.
  // Resolved ahead of the upsert rather than via upsert's own returned id, so
  // a re-send to the same coach keeps the original row id (and its replies)
  // instead of getting a fresh one.
  const { data: existingRow } = await supabase
    .from("outreach")
    .select("id")
    .eq("user_id", auth.user.id)
    .eq("coach_email", coach_email)
    .maybeSingle();

  let outreachId = existingRow?.id as string | undefined;
  if (!outreachId) {
    const { data: inserted, error: insertError } = await supabase
      .from("outreach")
      .insert({ user_id: auth.user.id, coach_email })
      .select("id")
      .single();

    if (insertError || !inserted) {
      return NextResponse.json(
        { error: insertError?.message ?? "Could not create outreach row" },
        { status: 500 }
      );
    }
    outreachId = inserted.id;
  }

  const replyTo = process.env.RESEND_INBOUND_DOMAIN
    ? `reply+${outreachId}@${process.env.RESEND_INBOUND_DOMAIN}`
    : undefined;

  const result = await sendViaResend(coach_email, subject, body, replyTo);

  const { error: outreachError } = await supabase
    .from("outreach")
    .update({
      email_sent: true,
      sent_at: new Date().toISOString(),
      subject,
      body,
      resend_email_id: result.delivered ? result.emailId : null,
    })
    .eq("id", outreachId);

  if (outreachError) {
    return NextResponse.json({ error: outreachError.message }, { status: 500 });
  }

  await supabase
    .from("users")
    .update({ emails_used: profile.emails_used + 1 })
    .eq("id", auth.user.id);

  return NextResponse.json({
    ok: true,
    delivered: result.delivered,
    reason: result.delivered ? undefined : result.reason,
  });
}
