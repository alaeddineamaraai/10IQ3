import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import { getPlan, PAID_TIERS_LOCKED } from "@/lib/stripe/plans";
import type { AthleteProfile } from "@/lib/types/profile";

const ACTIVE_SUBSCRIPTION_STATUSES: Stripe.Subscription.Status[] = [
  "active",
  "trialing",
  "past_due",
];

/**
 * Stripe recommends Checkout Sessions (ui_mode: "elements") over the raw
 * Subscriptions + PaymentIntent API for collecting payment on most
 * integrations — less code, explicit `payment_method_types` (so Klarna/
 * Amazon Pay/Cash App etc. from the Dashboard's defaults don't leak into the
 * embedded form), and a stable top-level `client_secret`/`subscription`
 * shape instead of chasing Invoice's internal fields, which changed release
 * to release under the old approach (confirmation_secret, then
 * invoice.parent.subscription_details — see git history).
 *
 * Switching plans while already subscribed (e.g. Pro -> Elite) settles and
 * ends the old subscription first (prorated, invoiced immediately) rather
 * than running two active subscriptions in parallel — the new Checkout
 * Session then starts a clean one for the new plan.
 */
export async function POST(request: Request) {
  if (PAID_TIERS_LOCKED) {
    return NextResponse.json(
      { error: "Paid plans aren't open yet — check back soon." },
      { status: 423 }
    );
  }

  const { plan: planId } = await request.json();
  const plan = getPlan(planId);

  if (!plan || plan.id === "free") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const userId = auth.user.id;

  try {
    const stripe = getStripe();
    const admin = createSupabaseAdminClient();

    const { data: existing } = await admin
      .from("users")
      .select("stripe_customer_id, stripe_subscription_id")
      .eq("id", userId)
      .single<Pick<AthleteProfile, "stripe_customer_id" | "stripe_subscription_id">>();

    let customerId = existing?.stripe_customer_id ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: auth.user.email,
        metadata: { userId },
      });
      customerId = customer.id;
      await admin.from("users").update({ stripe_customer_id: customerId }).eq("id", userId);
    }

    if (existing?.stripe_subscription_id) {
      const current = await stripe.subscriptions.retrieve(existing.stripe_subscription_id);
      if (ACTIVE_SUBSCRIPTION_STATUSES.includes(current.status)) {
        await stripe.subscriptions.cancel(current.id, { prorate: true, invoice_now: true });
      }
    }

    const session = await stripe.checkout.sessions.create({
      ui_mode: "elements",
      mode: "subscription",
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: plan.priceMonthly * 100,
            recurring: { interval: "month" },
            product_data: { name: `Netset ${plan.name}` },
          },
        },
      ],
      subscription_data: { metadata: { userId, plan: plan.id } },
      metadata: { userId, plan: plan.id },
    });

    if (!session.client_secret) {
      return NextResponse.json({ error: "Could not start checkout" }, { status: 502 });
    }

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Stripe error" },
      { status: 502 }
    );
  }
}
