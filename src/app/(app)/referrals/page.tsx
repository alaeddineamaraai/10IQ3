import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/data/profile";
import { ReferralsClient } from "./referrals-client";

async function loadData() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const [profile, { count: referralCount }] = await Promise.all([
    getProfile(supabase, auth.user.id),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("referred_by", "PLACEHOLDER"),
  ]);

  // Get actual count using the user's code
  let count = 0;
  if (profile?.referral_code) {
    const { count: c } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("referred_by", profile.referral_code);
    count = c ?? 0;
  }

  return { profile, referralCount: count };
}

export default async function ReferralsPage() {
  const data = await loadData();
  const profile = data?.profile ?? null;
  const referralCount = data?.referralCount ?? 0;
  const creditsEarned = referralCount * 3;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Referrals</h1>
        <p className="text-sm text-muted-foreground">
          Invite teammates and earn 3 free emails for every athlete who signs up through your link.
        </p>
      </div>

      <ReferralsClient
        existingCode={profile?.referral_code ?? null}
        referralCount={referralCount}
        creditsEarned={creditsEarned}
        maxReferrals={15}
      />
    </div>
  );
}
