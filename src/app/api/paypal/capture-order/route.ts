import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPlan } from "@/lib/stripe/plans";
import { paypalFetch } from "@/lib/paypal/server";

export async function POST(request: Request) {
  const { orderId, plan: planId } = await request.json();

  if (!orderId || !planId) {
    return NextResponse.json({ error: "Missing orderId or plan" }, { status: 400 });
  }

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
    const res = await paypalFetch(`/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.message ?? "Capture failed" },
        { status: 502 }
      );
    }

    const order = await res.json();
    if (order.status !== "COMPLETED") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
    }

    const admin = createSupabaseAdminClient();

    await admin
      .from("users")
      .update({
        plan: plan.id,
        subscription_status: "active",
        plan_started_at: new Date().toISOString(),
      })
      .eq("id", auth.user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "PayPal error" },
      { status: 502 }
    );
  }
}
