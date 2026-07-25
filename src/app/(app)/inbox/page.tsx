import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getInboxConversations, getSampleInboxConversations } from "@/lib/data/inbox";
import { getNotifications, getSampleNotifications } from "@/lib/data/notifications";
import { getProfile, getSampleProfile } from "@/lib/data/profile";
import { getAchievementStats, getSampleAchievementStats } from "@/lib/data/achievements";
import { InboxTabs } from "./inbox-tabs";
import type { AthleteProfile } from "@/lib/types/profile";

async function loadData() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      conversations: getSampleInboxConversations(),
      notifications: getSampleNotifications(),
      isSample: true,
      profile: getSampleProfile() as AthleteProfile,
      stats: getSampleAchievementStats(),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return {
      conversations: getSampleInboxConversations(),
      notifications: getSampleNotifications(),
      isSample: true,
      profile: getSampleProfile() as AthleteProfile,
      stats: getSampleAchievementStats(),
    };
  }

  const [conversations, notifications, profile] = await Promise.all([
    getInboxConversations(supabase, auth.user.id),
    getNotifications(supabase, auth.user.id),
    getProfile(supabase, auth.user.id),
  ]);
  const resolvedProfile = (profile ?? getSampleProfile()) as AthleteProfile;
  const stats = await getAchievementStats(supabase, auth.user.id, resolvedProfile);

  return { conversations, notifications, isSample: false, profile: resolvedProfile, stats };
}

export default async function InboxPage() {
  const { conversations, notifications, isSample, profile, stats } = await loadData();

  return (
    <InboxTabs conversations={conversations} notifications={notifications} isSample={isSample} profile={profile} stats={stats} />
  );
}
