import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import { getPlan } from "@/lib/stripe/plans";
import type { AthleteProfile } from "@/lib/types/profile";

const MIN_CREDITS = 10;
const MAX_CREDITS = 500;

export async function POST(request: Request) {
  const { quantity } = await request.json();

  if (!Number.isInteger(quantity) || quantity < MIN_CREDITS || quantity > MAX_CREDITS) {
    return NextResponse.json(
      { error: `Choose between ${MIN_CREDITS} and ${MAX_CREDITS} emails` },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const admin = createSupabaseAdminClient();
    const { data: profile } = await admin
      .from("users")
      .select("plan, stripe_customer_id")
      .eq("id", auth.user.id)
      .single<Pick<AthleteProfile, "plan" | "stripe_customer_id">>();

    const plan = profile ? getPlan(profile.plan) : undefined;

    if (!plan || plan.overagePricePerEmailCents == null) {
      return NextResponse.json(
        { error: "Upgrade to Pro or Elite to buy extra emails" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    let customerId = profile?.stripe_customer_id ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: auth.user.email,
        metadata: { userId: auth.user.id },
      });
      customerId = customer.id;
      await admin.from("users").update({ stripe_customer_id: customerId }).eq("id", auth.user.id);
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: quantity * plan.overagePricePerEmailCents,
      currency: "usd",
      customer: customerId,
      metadata: { userId: auth.user.id, type: "email_credits", quantity: String(quantity) },
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
