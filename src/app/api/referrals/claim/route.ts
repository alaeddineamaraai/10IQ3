import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const CREDITS_PER_REFERRAL = 3;
const MAX_REFERRALS = 15;

export async function POST(request: Request) {
  const { code } = await request.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: self } = await supabase
    .from("users")
    .select("referred_by, email_credits")
    .eq("id", auth.user.id)
    .single();

  // Already claimed a referral
  if (self?.referred_by) return NextResponse.json({ ok: true, alreadyClaimed: true });

  const admin = createSupabaseAdminClient();

  // Look up referrer
  const { data: referrer } = await admin
    .from("users")
    .select("id, email_credits")
    .eq("referral_code", code.toUpperCase())
    .single();

  if (!referrer || referrer.id === auth.user.id) {
    return NextResponse.json({ ok: true, invalid: true });
  }

  // Count how many users this referrer has already referred
  const { count: referralCount } = await admin
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("referred_by", code.toUpperCase());

  if ((referralCount ?? 0) >= MAX_REFERRALS) {
    return NextResponse.json({ ok: true, maxReached: true });
  }

  // Mark the new user as referred
  await admin
    .from("users")
    .update({ referred_by: code.toUpperCase() })
    .eq("id", auth.user.id);

  // Credit the referrer
  await admin
    .from("users")
    .update({ email_credits: (referrer.email_credits ?? 0) + CREDITS_PER_REFERRAL })
    .eq("id", referrer.id);

  return NextResponse.json({ ok: true, credited: true });
}
