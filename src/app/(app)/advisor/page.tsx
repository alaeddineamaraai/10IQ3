import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDashboardData, getSampleDashboardData } from "@/lib/data/dashboard";
import { AdvisorClient, AdvisorModeNotice } from "./advisor-client";

async function loadStats() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return getSampleDashboardData();
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return getSampleDashboardData();

  return getDashboardData(supabase, auth.user.id);
}

export default async function AdvisorPage() {
  const { stats, isSample } = await loadStats();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Advisor</h1>
        <AdvisorModeNotice />
      </div>

      <AdvisorClient stats={isSample ? undefined : stats} />
    </div>
  );
}
