import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";

/**
 * Stripe webhook — keeps users.plan / subscription_status in sync with real
 * Stripe Subscriptions (see /api/stripe/create-subscription). Plan
 * upgrades/downgrades and email-credit top-ups both land here; this is the
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

  let event: Stripe.Event;
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

  const admin = createSupabaseAdminClient();

  if (event.type === "payment_intent.succeeded") {
    // One-time email-credit top-up (see create-email-credits-checkout).
    // Subscription payments are invoices, not standalone PaymentIntents, so
    // this branch never fires for plan upgrades/renewals.
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const { userId, type, quantity } = paymentIntent.metadata;

    if (userId && type === "email_credits" && quantity) {
      const { data: current } = await admin
        .from("users")
        .select("email_credits")
        .eq("id", userId)
        .single<{ email_credits: number }>();

      await admin
        .from("users")
        .update({ email_credits: (current?.email_credits ?? 0) + Number(quantity) })
        .eq("id", userId);
    }
  }

  if (event.type === "checkout.session.completed") {
    // Primary signal for a brand-new subscription (see
    // /api/stripe/create-subscription, which now uses Checkout Sessions).
    // Unlike Invoice's internal fields, Session exposes `subscription` and
    // `metadata` directly at the top level — no nested-shape guessing.
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, plan } = session.metadata ?? {};
    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

    if (userId && plan && subscriptionId) {
      await admin
        .from("users")
        .update({
          plan,
          subscription_status: "active",
          stripe_subscription_id: subscriptionId,
          plan_started_at: new Date().toISOString(),
        })
        .eq("id", userId);
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;
    // As of recent Stripe API versions, invoices no longer carry a
    // top-level `subscription` field — it moved under
    // `parent.subscription_details.subscription`. The old field was always
    // undefined here, so this handler silently no-op'd on every real
    // payment and users.plan never updated after a successful card charge.
    const subscriptionRef = invoice.parent?.subscription_details?.subscription;
    const subscriptionId = typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id;
    if (!subscriptionId) return NextResponse.json({ received: true });

    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const { userId, plan } = subscription.metadata;
    if (!userId || !plan) return NextResponse.json({ received: true });

    // plan_started_at drives the free-daily-email window (see
    // lib/billing/email-allowance.ts) — only set it on the subscription's
    // first invoice, never on monthly renewals, or every renewal would
    // re-open the free window.
    const isFirstInvoice = invoice.billing_reason === "subscription_create";

    await admin
      .from("users")
      .update({
        plan,
        subscription_status: subscription.status,
        stripe_subscription_id: subscription.id,
        ...(isFirstInvoice ? { plan_started_at: new Date().toISOString() } : {}),
      })
      .eq("id", userId);
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    const { userId } = subscription.metadata;
    if (userId) {
      await admin
        .from("users")
        .update({ subscription_status: subscription.status })
        .eq("id", userId);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    // Stripe gives up after retrying a failed renewal (or the user canceled
    // via the billing portal) — drop them back to the free plan rather than
    // leaving them on a paid plan they're no longer being charged for.
    const subscription = event.data.object as Stripe.Subscription;
    const { userId } = subscription.metadata;
    if (userId) {
      await admin
        .from("users")
        .update({ plan: "free", subscription_status: "canceled" })
        .eq("id", userId);
    }
  }

  return NextResponse.json({ received: true });
}
