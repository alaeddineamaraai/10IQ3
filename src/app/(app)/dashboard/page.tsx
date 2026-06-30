import { Mail, MailOpen, MessageCircle, Users, Clock } from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDashboardData, getSampleDashboardData } from "@/lib/data/dashboard";
import { getProfile } from "@/lib/data/profile";
import { StatCard } from "@/components/stat-card";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/glass-card";
import { OutreachActivityChart } from "@/components/dashboard/outreach-activity-chart";
import { DivisionBreakdownChart } from "@/components/dashboard/division-breakdown-chart";
import { OutboundFunnel } from "@/components/dashboard/outbound-funnel";
import { PerformanceMetrics } from "@/components/dashboard/performance-metrics";
import { SentEmailsList } from "@/components/dashboard/sent-emails-list";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";

async function loadDashboardData() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { data: getSampleDashboardData(), profileComplete: false };
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return { data: getSampleDashboardData(), profileComplete: false };
  }

  const [dashData, profile] = await Promise.all([
    getDashboardData(supabase, auth.user.id),
    getProfile(supabase, auth.user.id),
  ]);

  return { data: dashData, profileComplete: profile?.profile_complete ?? false };
}

export default async function DashboardPage() {
  const { data, profileComplete } = await loadDashboardData();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {data.isSample
            ? "Sample data — sign in to see your real activity."
            : "Your recruiting outreach at a glance."}
        </p>
      </div>

      {!data.isSample && (
        <OnboardingChecklist
          profileComplete={profileComplete}
          emailsSent={data.stats.sent}
          replied={data.stats.replied}
        />
      )}

      <div className="flex flex-wrap justify-center gap-4">
        <StatCard
          className="min-w-[42%] max-w-[47%] flex-1 basis-[200px] sm:max-w-[260px] sm:min-w-[180px]"
          label="Coaches"
          value={data.stats.coaches.toLocaleString()}
          icon={Users}
          accent="#3b7af5"
        />
        <StatCard
          className="min-w-[42%] max-w-[47%] flex-1 basis-[200px] sm:max-w-[260px] sm:min-w-[180px]"
          label="Sent"
          value={data.stats.sent}
          icon={Mail}
          accent="#7c3aed"
        />
        <StatCard
          className="min-w-[42%] max-w-[47%] flex-1 basis-[200px] sm:max-w-[260px] sm:min-w-[180px]"
          label="Opened"
          value={data.stats.opened}
          icon={MailOpen}
          accent="#f59e0b"
        />
        <StatCard
          className="min-w-[42%] max-w-[47%] flex-1 basis-[200px] sm:max-w-[260px] sm:min-w-[180px]"
          label="Replied"
          value={data.stats.replied}
          icon={MessageCircle}
          accent="#22c55e"
        />
        <StatCard
          className="min-w-[42%] max-w-[47%] flex-1 basis-[200px] sm:max-w-[260px] sm:min-w-[180px]"
          label="Pending"
          value={data.stats.pending.toLocaleString()}
          icon={Clock}
          accent="#f97316"
          cta={{ label: "Start sending →", href: "/coaches" }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <GlassCardHeader>
            <GlassCardTitle>7-Day Outreach Activity</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <OutreachActivityChart data={data.activity} />
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Outbound Funnel</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <OutboundFunnel stats={data.stats} />
          </GlassCardContent>
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Performance Metrics</GlassCardTitle>
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
            <DivisionBreakdownChart data={data.divisions} />
          </GlassCardContent>
        </GlassCard>
      </div>

      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>All Sent Emails</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <SentEmailsList rows={data.sentEmails} />
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
