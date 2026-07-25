import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProfile, getSampleProfile } from "@/lib/data/profile";
import { getAchievementStats, getSampleAchievementStats } from "@/lib/data/achievements";
import type { AthleteProfile } from "@/lib/types/profile";
import { SettingsClient } from "./settings-client";

async function loadProfile() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { profile: getSampleProfile() as AthleteProfile, stats: getSampleAchievementStats() };
  }
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { profile: getSampleProfile() as AthleteProfile, stats: getSampleAchievementStats() };
  const profile = (await getProfile(supabase, auth.user.id) ?? getSampleProfile()) as AthleteProfile;
  const stats = await getAchievementStats(supabase, auth.user.id, profile);
  return { profile, stats };
}

export default async function SettingsPage() {
  const { profile, stats } = await loadProfile();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account, billing, and preferences.</p>
      </div>
      <SettingsClient profile={profile} stats={stats} />
    </div>
  );
}
