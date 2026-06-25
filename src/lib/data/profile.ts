import type { SupabaseClient } from "@supabase/supabase-js";

import type { AthleteProfile } from "@/lib/types/profile";

export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<AthleteProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single<AthleteProfile>();

  if (error) throw error;
  return data;
}

export function getSampleProfile(): AthleteProfile {
  return {
    id: "sample",
    email: "alex.player@example.com",
    name: "Alex Player",
    plan: "free",
    emails_used: 3,
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
    profile_complete: true,
    created_at: new Date().toISOString(),
  };
}
