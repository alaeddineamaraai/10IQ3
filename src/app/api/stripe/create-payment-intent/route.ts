import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import { getPlan } from "@/lib/stripe/plans";
import type { AthleteProfile } from "@/lib/types/profile";

export async function POST(request: Request) {
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

  try {
    const stripe = getStripe();
    const admin = createSupabaseAdminClient();

    const { data: existing } = await admin
      .from("users")
      .select("stripe_customer_id")
      .eq("id", auth.user.id)
      .single<Pick<AthleteProfile, "stripe_customer_id">>();

    let customerId = existing?.stripe_customer_id ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: auth.user.email,
        metadata: { userId: auth.user.id },
      });
      customerId = customer.id;
      await admin.from("users").update({ stripe_customer_id: customerId }).eq("id", auth.user.id);
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: plan.priceMonthly * 100,
      currency: "usd",
      customer: customerId,
      setup_future_usage: "off_session",
      metadata: { userId: auth.user.id, plan: plan.id },
      payment_method_types: ["card"],
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Stripe error" },
      { status: 502 }
    );
  }
}
