import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import type { AthleteProfile } from "@/lib/types/profile";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("stripe_customer_id")
    .eq("id", auth.user.id)
    .single<Pick<AthleteProfile, "stripe_customer_id">>();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No billing account yet — upgrade to a paid plan first." },
      { status: 400 }
    );
  }

  const { returnUrl } = await request.json().catch(() => ({ returnUrl: undefined }));
  const origin = new URL(request.url).origin;

  try {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl ?? `${origin}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Stripe error" },
      { status: 502 }
    );
  }
}
