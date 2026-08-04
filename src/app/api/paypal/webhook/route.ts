import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { paypalFetch } from "@/lib/paypal/server";

async function verifyWebhook(
  headers: Headers,
  rawBody: string
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;

  const res = await paypalFetch("/v1/notifications/verify-webhook-signature", {
    method: "POST",
    body: JSON.stringify({
      auth_algo: headers.get("paypal-auth-algo"),
      cert_url: headers.get("paypal-cert-url"),
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      transmission_time: headers.get("paypal-transmission-time"),
      webhook_id: webhookId,
      webhook_event: JSON.parse(rawBody),
    }),
  });

  if (!res.ok) return false;
  const data = await res.json();
  return data.verification_status === "SUCCESS";
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  const isValid = await verifyWebhook(request.headers, rawBody).catch(() => false);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const admin = createSupabaseAdminClient();

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const capture = event.resource;
    let userId: string | undefined;
    let plan: string | undefined;

    try {
      const meta = JSON.parse(capture.custom_id ?? "{}");
      userId = meta.userId;
      plan = meta.plan;
    } catch {
      // custom_id not present or unparseable
    }

    if (userId && plan) {
      await admin
        .from("users")
        .update({
          plan,
          subscription_status: "active",
          plan_started_at: new Date().toISOString(),
        })
        .eq("id", userId);
    }
  }

  if (event.event_type === "BILLING.SUBSCRIPTION.CANCELLED") {
    // If you later switch to PayPal Subscriptions API, this handles plan removal.
    const subscription = event.resource;
    const userId = subscription.custom_id;

    if (userId) {
      await admin
        .from("users")
        .update({ plan: "free", subscription_status: "canceled" })
        .eq("id", userId);
    }
  }

  return NextResponse.json({ received: true });
}
