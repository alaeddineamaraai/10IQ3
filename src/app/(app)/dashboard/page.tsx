import Link from "next/link";
import { Plus, Upload } from "lucide-react";

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
import { DivisionBreakdownChartLoader } from "@/components/dashboard/chart-loaders";
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

  const greeting = data.isSample
    ? "Sample data — sign in to see your real activity."
    : firstName
      ? `Plan, prioritise, and reach coaches with ease, ${firstName}.`
      : "Plan, prioritise, and reach coaches with ease.";

  return (
    <div className="flex flex-col gap-5">
      {/* Page heading + primary actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">{greeting}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <Link href="/compose" className={buttonVariants({ className: "rounded-full" })}>
            <Plus className="size-4" />
            New Email
          </Link>
          <Link
            href="/contacts"
            className={buttonVariants({ variant: "outline", className: "rounded-full" })}
          >
            <Upload className="size-4" />
            Import Coaches
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

      {/* Stat row — the coach database is the hero figure */}
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
          cta={{ label: "View sent →", href: "/inbox" }}
        />
        <StatCard
          label="Opened"
          value={data.stats.opened}
          href="/inbox"
          caption={
            data.stats.sent > 0
              ? `${((data.stats.opened / data.stats.sent) * 100).toFixed(0)}% of emails sent`
              : "No emails sent yet"
          }
        />
        <StatCard
          label="Replied"
          value={data.stats.replied}
          cta={{ label: "Read replies →", href: "/inbox" }}
        />
      </div>

      {/* Activity + response breakdown */}
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

      {/* Rates + division mix */}
      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Performance</GlassCardTitle>
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
