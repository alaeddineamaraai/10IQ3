import { NextResponse } from "next/server";
import { Resend } from "resend";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Matches the reply+<outreach_id>@<inbound-domain> address set as Reply-To
// when an outreach email is sent (see /api/outreach/send), so an inbound
// reply can be threaded back to the right outreach row without relying on
// fragile subject-line "Re:" matching.
const REPLY_ADDRESS_RE = /^reply\+([0-9a-f-]{36})@/i;

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
    }
  }

  return NextResponse.json({ received: true });
}
