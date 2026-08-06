import { NextResponse } from "next/server";
import { Resend } from "resend";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { getEmailAllowance } from "@/lib/billing/email-allowance";
import { FREE_PLAN_EMAIL_LIMIT } from "@/lib/stripe/plans";
import { notifyPlanLimitReached } from "@/lib/email/notify";
import type { AthleteProfile } from "@/lib/types/profile";

// 50 sends per user per 24 hours (guards against runaway bulk sending)
const SEND_RATE_LIMIT = 50;
const SEND_WINDOW_MS = 24 * 60 * 60 * 1000;

// CAN-SPAM / CASL compliance footer appended to every outgoing email.
// Update NETSET_MAILING_ADDRESS in your env if you have a physical address.
const COMPLIANCE_FOOTER = `

---
This email was sent via Netset on behalf of the athlete above.
${process.env.NETSET_MAILING_ADDRESS ?? "Netset · 548 Market St PMB 72287 · San Francisco, CA 94104"}
To opt out of emails from this athlete, reply with "unsubscribe".`;

const APP_BASE_URL = process.env.APP_BASE_URL ?? "https://www.netset.pro";

function htmlFromPlainText(text: string, outreachId: string) {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  // Self-hosted open-tracking pixel — see /api/track/open/[id]. Doesn't
  // depend on Resend's own open tracking being toggled on for the domain.
  const pixel = `<img src="${APP_BASE_URL}/api/track/open/${outreachId}" width="1" height="1" alt="" style="display:none" />`;
  return `<div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${escaped}</div>${pixel}`;
}

/**
 * Coaches see the email as coming from the athlete: display name is the
 * athlete's name and the address localpart is a slug of it, e.g.
 * "Alex Player <alex.player@mail.netset.pro>".
 * Resend only accepts a verified sending domain — set NETSET_SEND_DOMAIN
 * to "netset.pro" once the root domain is verified in Resend.
 */
function buildFrom(athleteName: string | null | undefined) {
  const domain = process.env.NETSET_SEND_DOMAIN ?? "mail.netset.pro";
  // Header-safe display name: no quotes, angle brackets, or line breaks
  const display =
    athleteName?.replace(/["<>\r\n]/g, "").trim().slice(0, 60) || "Netset";
  const local =
    display
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "") // strip accents
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "")
      .slice(0, 40) || "recruiting";
  return `${display} <${local}@${domain}>`;
}

async function sendViaResend(
  to: string,
  subject: string,
  body: string,
  replyTo: string | undefined,
  athleteName: string | null | undefined,
  outreachId: string
) {
  if (!process.env.RESEND_API_KEY) {
    return { delivered: false as const, reason: "RESEND_API_KEY not configured" };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: buildFrom(athleteName),
    to,
    subject,
    text: body,
    // The plain-text part keeps this looking identical to a normal email;
    // the HTML part carries our own open-tracking pixel (see
    // htmlFromPlainText) rather than depending on Resend's built-in open
    // tracking, which requires a separate per-domain dashboard toggle.
    html: htmlFromPlainText(body, outreachId),
    ...(replyTo ? { replyTo } : {}),
  });

  if (error || !data) {
    return { delivered: false as const, reason: `Resend error: ${error?.message ?? "unknown"}` };
  }

  return { delivered: true as const, emailId: data.id };
}

export async function POST(request: Request) {
  const { coach_email, subject, body, scheduled_for } = await request.json();

  if (!coach_email || !subject || !body) {
    return NextResponse.json({ error: "Missing coach_email, subject, or body" }, { status: 400 });
  }

  // Validate scheduled_for if provided
  if (scheduled_for) {
    const scheduledDate = new Date(scheduled_for);
    if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      return NextResponse.json({ error: "scheduled_for must be a future date" }, { status: 400 });
    }
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!rateLimit(`send:${auth.user.id}`, SEND_RATE_LIMIT, SEND_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Daily send limit reached — try again tomorrow" },
      { status: 429 }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", auth.user.id)
    .single<AthleteProfile>();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Could not load profile" }, { status: 500 });
  }

  const startOfTodayUtc = new Date();
  startOfTodayUtc.setUTCHours(0, 0, 0, 0);
  const { count: emailsSentToday } = await supabase
    .from("outreach")
    .select("*", { count: "exact", head: true })
    .eq("user_id", auth.user.id)
    .eq("email_sent", true)
    .gte("sent_at", startOfTodayUtc.toISOString());

  const allowance = getEmailAllowance({ profile, emailsSentToday: emailsSentToday ?? 0 });

  if (!allowance.ok) {
    const messages: Record<typeof allowance.reason, string> = {
      lifetime_limit_reached: "Free plan limit reached",
      daily_cap_reached: "Daily email cap reached — try again tomorrow",
      no_credits: "You're out of email credits — buy more to keep sending today",
    };

    // Notify the athlete once when they first hit the free plan limit.
    if (allowance.reason === "lifetime_limit_reached" && !profile.limit_notified && profile.email) {
      const admin = createSupabaseAdminClient();
      await admin.from("users").update({ limit_notified: true }).eq("id", auth.user.id);
      notifyPlanLimitReached({
        athleteEmail: profile.email,
        athleteName: profile.name,
        emailLimit: FREE_PLAN_EMAIL_LIMIT,
      }).catch(() => {});
    }

    return NextResponse.json(
      { error: messages[allowance.reason], code: allowance.reason.toUpperCase() },
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

  if (!outreachId) {
    return NextResponse.json({ error: "Could not resolve outreach row" }, { status: 500 });
  }

  // Scheduled email: store it for the cron to pick up, no Resend call now.
  if (scheduled_for) {
    const { error: scheduleError } = await supabase
      .from("outreach")
      .update({
        subject,
        body,
        scheduled_for,
        schedule_attempts: 0,
        schedule_failed: false,
      })
      .eq("id", outreachId);

    if (scheduleError) {
      return NextResponse.json({ error: scheduleError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, delivered: false, scheduled: true });
  }

  const replyTo = process.env.RESEND_INBOUND_DOMAIN
    ? `reply+${outreachId}@${process.env.RESEND_INBOUND_DOMAIN}`
    : undefined;

  const result = await sendViaResend(
    coach_email,
    subject,
    body + COMPLIANCE_FOOTER,
    replyTo,
    profile.name,
    outreachId
  );

  const sentAt = new Date().toISOString();
  const isFollowUp = !!existingRow;

  if (isFollowUp) {
    // Thread continues — record the athlete's reply without overwriting the
    // original outreach body so the inbox can show the full conversation.
    const { error: followupError } = await supabase
      .from("outreach_followups")
      .insert({
        outreach_id: outreachId,
        subject,
        body,
        sent_at: sentAt,
        resend_email_id: result.delivered ? result.emailId : null,
      });

    if (followupError) {
      return NextResponse.json({ error: followupError.message }, { status: 500 });
    }
  } else {
    // First send — write subject/body onto the outreach row as before.
    const { error: outreachError } = await supabase
      .from("outreach")
      .update({
        email_sent: true,
        sent_at: sentAt,
        subject,
        body,
        resend_email_id: result.delivered ? result.emailId : null,
      })
      .eq("id", outreachId);

    if (outreachError) {
      return NextResponse.json({ error: outreachError.message }, { status: 500 });
    }
  }

  await supabase
    .from("users")
    .update({
      emails_used: profile.emails_used + 1,
      ...(allowance.source === "credit" ? { email_credits: profile.email_credits - 1 } : {}),
    })
    .eq("id", auth.user.id);

  return NextResponse.json({
    ok: true,
    delivered: result.delivered,
    reason: result.delivered ? undefined : result.reason,
  });
}
