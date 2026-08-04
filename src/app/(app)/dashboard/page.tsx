import Link from "next/link";
import { Plus } from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDashboardData, getSampleDashboardData } from "@/lib/data/dashboard";
import { getProfile } from "@/lib/data/profile";
import { buttonVariants } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/glass-card";
import { DivisionBreakdownChartLoader, RegionChartLoader } from "@/components/dashboard/chart-loaders";
import { ActivityBars } from "@/components/dashboard/activity-bars";
import { ProgressGauge } from "@/components/dashboard/progress-gauge";
import { PerformanceMetrics } from "@/components/dashboard/performance-metrics";
import { SentEmailsList } from "@/components/dashboard/sent-emails-list";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";

async function loadDashboardData() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { data: getSampleDashboardData(), profileComplete: false, firstName: null };
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return { data: getSampleDashboardData(), profileComplete: false, firstName: null };
  }

  const [dashData, profile] = await Promise.all([
    getDashboardData(supabase, auth.user.id),
    getProfile(supabase, auth.user.id),
  ]);

  const firstName = profile?.name?.split(" ")[0] ?? null;
  return {
    data: dashData,
    profileComplete: profile?.profile_complete ?? false,
    firstName,
  };
}

export default async function DashboardPage() {
  const { data, profileComplete, firstName } = await loadDashboardData();

  const heading = firstName && !data.isSample ? `Welcome back, ${firstName}` : "Dashboard";
  const subtitle = data.isSample
    ? "Sample data — sign in to see your real activity."
    : "Track your outreach, monitor responses, and connect with coaches.";

  return (
    <div className="flex flex-col gap-6">
      {/* Page heading + primary action */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight">{heading}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-2">
          <Link href="/compose" className={buttonVariants({ size: "sm", className: "rounded-full" })}>
            <Plus className="size-4" />
            New Email
          </Link>
        </div>
      </div>

      {!data.isSample && (
        <OnboardingChecklist
          profileComplete={profileComplete}
          emailsSent={data.stats.sent}
          replied={data.stats.replied}
        />
      )}

      {/* KPI overview */}
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Overview</p>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            featured
            label="Coaches Available"
            value={data.stats.coaches.toLocaleString()}
            cta={{ label: "Browse database →", href: "/coaches" }}
          />
          <StatCard
            label="Emails Sent"
            value={data.stats.sent}
            cta={data.stats.sent > 0 ? { label: "View sent →", href: "/inbox" } : undefined}
            caption={data.stats.sent === 0 ? "Start reaching out to coaches" : undefined}
          />
          <StatCard
            label="Opened"
            value={data.stats.opened}
            href={data.stats.sent > 0 ? "/inbox" : undefined}
            caption={
              data.stats.sent > 0
                ? `${((data.stats.opened / data.stats.sent) * 100).toFixed(0)}% of emails sent`
                : "Shows % once emails are sent"
            }
          />
          <StatCard
            label="Replied"
            value={data.stats.replied}
            cta={data.stats.replied > 0 ? { label: "Read replies →", href: "/inbox" } : undefined}
            caption={data.stats.replied === 0 ? "Avg coach reply rate is ~8%" : undefined}
          />
        </div>
      </div>

      {/* Activity + response breakdown */}
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Activity</p>
        <div className="grid gap-4 lg:grid-cols-3">
          <GlassCard className="lg:col-span-2">
            <GlassCardHeader>
              <GlassCardTitle>Outreach Activity</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <ActivityBars data={data.activity} />
            </GlassCardContent>
          </GlassCard>

          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Response Breakdown</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="pt-2">
              <ProgressGauge stats={data.stats} />
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>

      {/* Performance + division mix */}
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Performance</p>
        <div className="grid gap-4 lg:grid-cols-3">
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Email Rates</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <PerformanceMetrics rates={data.rates} />
            </GlassCardContent>
          </GlassCard>

          <GlassCard className="lg:col-span-2">
            <GlassCardHeader>
              <GlassCardTitle>Division Breakdown</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <DivisionBreakdownChartLoader data={data.divisions} />
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>

      {/* Region coverage */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Region Coverage</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <p className="mb-3 text-xs text-muted-foreground">
            Gray = total schools per region · Colored = schools contacted
          </p>
          <RegionChartLoader data={data.regions} />
        </GlassCardContent>
      </GlassCard>

      {/* Recent outreach */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Recent Outreach</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <SentEmailsList rows={data.sentEmails} />
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
