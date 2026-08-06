import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { notifyCoachOpenedEmail } from "@/lib/email/notify";

const APP_BASE_URL = process.env.APP_BASE_URL ?? "https://www.netset.pro";
const MAX_ATTEMPTS = 5;

function authorized(request: Request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  return token && token === process.env.CRON_SECRET;
}

function htmlBody(text: string, outreachId: string) {
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const pixel = `<img src="${APP_BASE_URL}/api/track/open/${outreachId}" width="1" height="1" alt="" style="display:none" />`;
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escaped}</div>${pixel}`;
}

function buildFrom(name: string | null | undefined) {
  const domain = process.env.NETSET_SEND_DOMAIN ?? "mail.netset.pro";
  const display = name?.replace(/["<>\r\n]/g, "").trim().slice(0, 60) || "Netset";
  const local = display.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "").slice(0, 40) || "recruiting";
  return `${display} <${local}@${domain}>`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const now = new Date().toISOString();

  // Find all scheduled emails due to send
  const { data: due } = await admin
    .from("outreach")
    .select("id, user_id, coach_email, subject, body, schedule_attempts")
    .lte("scheduled_for", now)
    .eq("email_sent", false)
    .eq("schedule_failed", false)
    .not("scheduled_for", "is", null);

  if (!due?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;

  for (const row of due) {
    const { data: user } = await admin
      .from("users")
      .select("email, name, plan, emails_used")
      .eq("id", row.user_id)
      .single();

    if (!user) continue;

    const replyTo = process.env.RESEND_INBOUND_DOMAIN
      ? `reply+${row.id}@${process.env.RESEND_INBOUND_DOMAIN}`
      : undefined;

    const COMPLIANCE_FOOTER = `\n\n---\nThis email was sent via Netset on behalf of the athlete above.\n${process.env.NETSET_MAILING_ADDRESS ?? "Netset · 548 Market St PMB 72287 · San Francisco, CA 94104"}\nTo opt out of emails from this athlete, reply with "unsubscribe".`;

    const { data, error } = await resend.emails.send({
      from: buildFrom(user.name),
      to: row.coach_email,
      subject: row.subject ?? "(no subject)",
      text: (row.body ?? "") + COMPLIANCE_FOOTER,
      html: htmlBody((row.body ?? "") + COMPLIANCE_FOOTER, row.id),
      ...(replyTo ? { replyTo } : {}),
    });

    if (error || !data) {
      const newAttempts = (row.schedule_attempts ?? 0) + 1;
      const failed = newAttempts >= MAX_ATTEMPTS;

      await admin
        .from("outreach")
        .update({ schedule_attempts: newAttempts, schedule_failed: failed })
        .eq("id", row.id);

      if (failed && user.email) {
        // Notify the athlete their scheduled email permanently failed
        const notifyResend = new Resend(process.env.RESEND_API_KEY!);
        const NOTIFY_FROM = process.env.NETSET_NOTIFY_FROM ?? "noreply@netset.pro";
        const firstName = user.name?.split(" ")[0] ?? "there";
        await notifyResend.emails.send({
          from: `Netset <${NOTIFY_FROM}>`,
          to: user.email,
          subject: "A scheduled email failed to send",
          text: [
            `Hi ${firstName},`,
            "",
            `We weren't able to deliver your scheduled email to ${row.coach_email} after ${MAX_ATTEMPTS} attempts.`,
            "",
            "You can re-send it manually from your inbox, or try scheduling it again.",
            "",
            `Go to inbox: ${APP_BASE_URL}/inbox`,
            "",
            "— The Netset team",
          ].join("\n"),
        }).catch(() => {});
      }
      continue;
    }

    const sentAt = new Date().toISOString();
    await admin
      .from("outreach")
      .update({
        email_sent: true,
        sent_at: sentAt,
        resend_email_id: data.id,
        scheduled_for: null,
      })
      .eq("id", row.id);

    await admin
      .from("users")
      .update({ emails_used: (user.emails_used ?? 0) + 1 })
      .eq("id", row.user_id);

    sent++;
  }

  return NextResponse.json({ sent });
}
