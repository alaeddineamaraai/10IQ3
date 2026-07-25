import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getNotifications, getSampleNotifications } from "@/lib/data/notifications";
import { getProfile, getSampleProfile } from "@/lib/data/profile";
import { getAchievementStats, getSampleAchievementStats } from "@/lib/data/achievements";
import { NotificationsClient } from "./notifications-client";
import type { AthleteProfile } from "@/lib/types/profile";

async function loadNotifications() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { notifications: getSampleNotifications(), isSample: true, profile: getSampleProfile() as AthleteProfile, stats: getSampleAchievementStats() };
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return { notifications: getSampleNotifications(), isSample: true, profile: getSampleProfile() as AthleteProfile, stats: getSampleAchievementStats() };
  }

  const [notifications, profile] = await Promise.all([
    getNotifications(supabase, auth.user.id),
    getProfile(supabase, auth.user.id),
  ]);
  const resolvedProfile = (profile ?? getSampleProfile()) as AthleteProfile;
  const stats = await getAchievementStats(supabase, auth.user.id, resolvedProfile);

  return {
    notifications,
    isSample: false,
    profile: resolvedProfile,
    stats,
  };
}

export default async function NotificationsPage() {
  const { notifications, isSample, profile, stats } = await loadNotifications();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {isSample
              ? "Sample data — showing a preview of coach replies."
              : "Replies from coaches, newest first."}
          </p>
        </div>
      </div>

      <NotificationsClient notifications={notifications} isSample={isSample} profile={profile} stats={stats} />
    </div>
  );
}
