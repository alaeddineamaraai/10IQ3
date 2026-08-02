import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PromoCode = {
  plan: string;
  durationDays: number;
};

const PROMO_CODES: Record<string, PromoCode> = {
  TFORT: { plan: "pro", durationDays: 7 },
};

export async function POST(request: Request) {
  const { code } = await request.json();

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const promo = PROMO_CODES[code.trim().toUpperCase()];
  if (!promo) {
    return NextResponse.json({ error: "Invalid promo code" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const expiresAt = new Date(Date.now() + promo.durationDays * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("users")
    .update({ promo_plan: promo.plan, promo_expires_at: expiresAt })
    .eq("id", auth.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, plan: promo.plan, expiresAt });
}
