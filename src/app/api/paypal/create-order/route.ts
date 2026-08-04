import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPlan, PAID_TIERS_LOCKED } from "@/lib/stripe/plans";
import { paypalFetch } from "@/lib/paypal/server";

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

  try {
    const res = await paypalFetch("/v2/checkout/orders", {
      method: "POST",
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: plan.priceMonthly.toFixed(2),
            },
            description: `Netset ${plan.name} — first month`,
            custom_id: JSON.stringify({ userId: auth.user.id, plan: plan.id }),
          },
        ],
        application_context: {
          brand_name: "Netset",
          user_action: "PAY_NOW",
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.message ?? "PayPal error" },
        { status: 502 }
      );
    }

    const order = await res.json();
    return NextResponse.json({ orderId: order.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "PayPal error" },
      { status: 502 }
    );
  }
}
