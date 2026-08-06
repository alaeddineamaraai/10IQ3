import type { SupabaseClient } from "@supabase/supabase-js";

import type { AthleteProfile } from "@/lib/types/profile";

/** The minimal set of real signals that decide which achievement stories an
 * athlete has actually earned. Kept intentionally light — a single aggregate
 * query over `outreach` plus two profile fields — so it's cheap to compute on
 * any page that surfaces the story creator. */
export type AchievementStats = {
  sent: number;
  opened: number;
  replied: number;
  targetD1: boolean;
  hasRecord: boolean;
};

function fromProfile(profile: AthleteProfile | null) {
  return {
    targetD1: !!profile?.target_div?.toUpperCase().includes("D1"),
    hasRecord: !!profile?.singles_record?.trim(),
  };
}

export async function getAchievementStats(
  supabase: SupabaseClient,
  userId: string,
  profile: AthleteProfile | null
): Promise<AchievementStats> {
  const { data } = await supabase
    .from("outreach")
    .select("email_sent, opened, replied")
    .eq("user_id", userId)
    .returns<{ email_sent: boolean; opened: boolean; replied: boolean }[]>();

  const rows = data ?? [];
  return {
    sent: rows.filter((r) => r.email_sent).length,
    opened: rows.filter((r) => r.opened).length,
    replied: rows.filter((r) => r.replied).length,
    ...fromProfile(profile),
  };
}

/** Representative unlock state for the sample/preview session — mirrors the
 * sample dashboard (42 sent, 18 opened, 5 replied) so the story picker shows a
 * realistic mix of earned and still-locked achievements. */
export function getSampleAchievementStats(): AchievementStats {
  return { sent: 79, opened: 34, replied: 9, targetD1: true, hasRecord: true };
}
