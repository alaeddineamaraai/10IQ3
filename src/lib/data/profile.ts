import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AthleteProfile, Plan } from "@/lib/types/profile";

const PLAN_RANK: Record<Plan, number> = { free: 0, pro: 1, elite: 2 };

function applyPromo(profile: AthleteProfile): AthleteProfile {
  if (
    profile.promo_plan &&
    profile.promo_expires_at &&
    new Date(profile.promo_expires_at) > new Date()
  ) {
    const promoRank = PLAN_RANK[profile.promo_plan as Plan] ?? 0;
    if (promoRank > PLAN_RANK[profile.plan]) {
      return { ...profile, plan: profile.promo_plan as Plan };
    }
  }
  return profile;
}

export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<AthleteProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle<AthleteProfile>();

  if (error) throw error;
  if (data) return applyPromo(data);

  // Self-heal: the auth session is valid but the users row is missing
  // (failed insert during OAuth signup, partial account deletion, etc.).
  // Recreate it with defaults instead of crashing every page render.
  const admin = createSupabaseAdminClient();
  const { data: authUser } = await admin.auth.admin.getUserById(userId);
  if (!authUser?.user) return null;

  const { data: created, error: insertError } = await admin
    .from("users")
    .upsert(
      {
        id: userId,
        email: authUser.user.email,
        plan: "free",
        emails_used: 0,
        email_credits: 0,
        profile_complete: false,
      },
      { onConflict: "id" }
    )
    .select("*")
    .single<AthleteProfile>();

  if (!insertError) return created ? applyPromo(created) : null;

  // 23505 = unique email violation: a row with this email already exists
  // under a previous auth identity (account deleted and re-created).
  // Adopt it — re-key to the new auth id, keeping its profile data.
  if (insertError.code === "23505" && authUser.user.email) {
    const { data: adopted, error: adoptError } = await admin
      .from("users")
      .update({ id: userId })
      .eq("email", authUser.user.email)
      .select("*")
      .single<AthleteProfile>();

    if (adoptError) throw adoptError;
    return adopted ? applyPromo(adopted) : null;
  }

  throw insertError;
}

export function getSampleProfile(): AthleteProfile {
  return {
    id: "sample",
    email: "alex.player@example.com",
    name: "Alex Player",
    plan: "free",
    emails_used: 3,
    plan_started_at: null,
    email_credits: 0,
    utr: 11.8,
    grad_year: 2027,
    gpa: 3.7,
    rank: 180,
    wtn: 6.2,
    gender: "Female",
    school: "Lincoln High School",
    academy: "Bay Area Tennis Academy",
    location: "San Jose, CA",
    singles_record: "22-6",
    doubles_record: "14-9",
    style: "Aggressive baseliner",
    target_div: "D1",
    region: "West",
    video_link: "https://youtube.com/watch?v=sample",
    utr_sports_link: "https://app.utrsports.net/profiles/sample",
    ai_notes: null,
    instagram_token: null,
    profile_complete: true,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    subscription_status: null,
    promo_plan: null,
    promo_expires_at: null,
    limit_notified: false,
    created_at: new Date().toISOString(),
  };
}
