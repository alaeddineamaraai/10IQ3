import Link from "next/link";
import { Sparkles } from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDashboardData, getSampleDashboardData } from "@/lib/data/dashboard";
import { getProfile } from "@/lib/data/profile";
import { GlassCard, GlassCardContent } from "@/components/glass-card";
import { AdvisorClient, AdvisorModeNotice } from "./advisor-client";

async function loadAdvisorData() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { stats: getSampleDashboardData(), plan: "free" as const, isSample: true };
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { stats: getSampleDashboardData(), plan: "free" as const, isSample: true };

  const [dashData, profile] = await Promise.all([
    getDashboardData(supabase, auth.user.id),
    getProfile(supabase, auth.user.id),
  ]);

  return { stats: dashData, plan: profile?.plan ?? "free", isSample: false };
}

export default async function AdvisorPage() {
  const { stats, plan, isSample } = await loadAdvisorData();
  const isLocked = !isSample && plan === "free";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Advisor</h1>
        <AdvisorModeNotice />
      </div>

      {isLocked ? (
        <GlassCard>
          <GlassCardContent className="flex flex-col items-center gap-5 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-7" />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold">AI Advisor is a Pro feature</h2>
              <p className="max-w-sm text-sm text-muted-foreground">
                Get personalized recruiting advice, email strategy, and division-fit analysis
                powered by AI — available on Pro and Elite plans.
              </p>
            </div>
            <Link
              href="/paywall"
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-smooth hover:opacity-90"
            >
              Upgrade to Pro
            </Link>
          </GlassCardContent>
        </GlassCard>
      ) : (
        <AdvisorClient stats={isSample ? undefined : stats.stats} />
      )}
    </div>
  );
}
