import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProfile, getSampleProfile } from "@/lib/data/profile";
import { PaywallClient } from "./paywall-client";

async function loadCurrentPlan() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return getSampleProfile().plan;
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return getSampleProfile().plan;
  }

  const profile = await getProfile(supabase, auth.user.id);
  return profile?.plan ?? "free";
}

export default async function PaywallPage() {
  const currentPlan = await loadCurrentPlan();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Plans</h1>
        <p className="text-sm text-muted-foreground">
          Unlock unlimited recruiting emails and the AI Advisor.
        </p>
      </div>

      <PaywallClient currentPlan={currentPlan} />
    </div>
  );
}
