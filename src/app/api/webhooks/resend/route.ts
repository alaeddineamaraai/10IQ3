import { NextResponse } from "next/server";
import { Resend } from "resend";
import webpush from "web-push";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:hello@netset.pro",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

const REPLY_ADDRESS_RE = /^reply\+([0-9a-f-]{36})@/i;

const NOTIFY_FROM = process.env.NETSET_NOTIFY_FROM ?? "noreply@netset.pro";
const APP_BASE_URL = process.env.APP_BASE_URL ?? "https://www.netset.pro";

async function notifyAthleteOfReply({
  resend,
  admin,
  outreachId,
  coachEmail,
  subject,
  snippet,
}: {
  resend: Resend;
  admin: ReturnType<typeof import("@/lib/supabase/admin").createSupabaseAdminClient>;
  outreachId: string;
  coachEmail: string;
  subject: string;
  snippet: string;
}) {
  // Look up the athlete's email from the outreach row → user
  const { data: outreach } = await admin
    .from("outreach")
    .select("user_id")
    .eq("id", outreachId)
    .single();

  if (!outreach) return;

  const { data: user } = await admin
    .from("users")
    .select("email, name")
    .eq("id", outreach.user_id)
    .single();

  if (!user?.email) return;

  const firstName = user.name?.split(" ")[0] ?? "there";
  const trimmedSnippet = snippet.trim().replace(/\s+/g, " ");

  const text = [
    `Hi ${firstName},`,
    "",
    `You got a reply from ${coachEmail}.`,
    "",
    subject ? `Subject: ${subject}` : null,
    trimmedSnippet ? `\n"${trimmedSnippet}${trimmedSnippet.length >= 300 ? "…" : ""}"` : null,
    "",
    `View it and reply inside Netset: ${APP_BASE_URL}/dashboard`,
    "",
    "— The Netset team",
  ].filter((l) => l !== null).join("\n");

  await resend.emails.send({
    from: `Netset <${NOTIFY_FROM}>`,
    to: user.email,
    subject: `Coach replied: ${subject || coachEmail}`,
    text,
    headers: {
      "X-Entity-Ref-ID": outreachId,
    },
  });
}

async function sendPushNotificationsForReply({
  admin,
  outreachId,
  coachEmail,
  subject,
}: {
  admin: ReturnType<typeof import("@/lib/supabase/admin").createSupabaseAdminClient>;
  outreachId: string;
  coachEmail: string;
  subject: string;
}) {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

  const { data: outreach } = await admin
    .from("outreach")
    .select("user_id")
    .eq("id", outreachId)
    .single();

  if (!outreach) return;

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("endpoint, keys")
    .eq("user_id", outreach.user_id);

  if (!subs?.length) return;

  const payload = JSON.stringify({
    title: "Coach replied!",
    body: subject ? `Re: ${subject}` : `${coachEmail} sent you a reply`,
    icon: "/icon-192x192.png",
    url: `${APP_BASE_URL}/inbox`,
  });

  await Promise.allSettled(
    subs.map((sub) =>
      webpush
        .sendNotification({ endpoint: sub.endpoint, keys: sub.keys as { p256dh: string; auth: string } }, payload)
        .catch((err) => {
          // 410 Gone = subscription expired; clean it up
          if (err.statusCode === 410) {
            admin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint).then(() => {});
          }
        })
    )
  );
}

export async function POST(request: Request) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  const payload = await request.text();
  const resend = new Resend(process.env.RESEND_API_KEY);

  let event;
  try {
    event = resend.webhooks.verify({
      payload,
      headers: {
        id: request.headers.get("svix-id") ?? "",
        timestamp: request.headers.get("svix-timestamp") ?? "",
        signature: request.headers.get("svix-signature") ?? "",
      },
      webhookSecret: process.env.RESEND_WEBHOOK_SECRET,
    });
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  if (event.type === "email.opened") {
    // Only set opened_at on the first open; opened itself is already true
    // after that, so the filter just keeps the timestamp meaningful.
    await admin
      .from("outreach")
      .update({ opened: true, opened_at: event.created_at })
      .eq("resend_email_id", event.data.email_id)
      .eq("opened", false);
  }

  if (event.type === "email.received") {
    const recipients = [...event.data.to, ...event.data.received_for];
    const outreachId = recipients
      .map((address) => address.match(REPLY_ADDRESS_RE)?.[1])
      .find(Boolean);

    if (outreachId) {
      const { data: full } = await resend.emails.receiving.get(event.data.email_id);

      await admin.from("outreach_replies").insert({
        outreach_id: outreachId,
        from_email: event.data.from,
        subject: event.data.subject,
        body: full?.text ?? full?.html ?? null,
        received_at: event.created_at,
      });

      await admin
        .from("outreach")
        .update({ replied: true, replied_at: event.created_at })
        .eq("id", outreachId);

      // Notify the athlete via email and push notification
      await Promise.all([
        notifyAthleteOfReply({
          resend,
          admin,
          outreachId,
          coachEmail: event.data.from,
          subject: event.data.subject ?? "",
          snippet: (full?.text ?? "").slice(0, 300),
        }),
        sendPushNotificationsForReply({
          admin,
          outreachId,
          coachEmail: event.data.from,
          subject: event.data.subject ?? "",
        }),
      ]);
    }
  }

  return NextResponse.json({ received: true });
}
