import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";

/**
 * Stripe webhook → updates users.plan on successful payment. This is the
 * integration the migration brief flagged as "never fully verified
 * end-to-end" — kept here as a real implementation (not a stub) so it's
 * ready to test against a real Stripe webhook + a funded test charge.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Invalid signature: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 400 }
    );
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as {
      metadata: Record<string, string>;
      customer: string | null;
    };
    const { userId, plan } = paymentIntent.metadata;

    if (userId && plan) {
      const admin = createSupabaseAdminClient();
      await admin
        .from("users")
        .update({
          plan,
          ...(paymentIntent.customer ? { stripe_customer_id: paymentIntent.customer } : {}),
        })
        .eq("id", userId);
    }
  }

  return NextResponse.json({ received: true });
}
