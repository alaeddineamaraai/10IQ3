import { Mail, MailOpen, MessageCircle, Database, Clock } from "lucide-react";
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
import {
  OutreachActivityChartLoader,
  DivisionBreakdownChartLoader,
} from "@/components/dashboard/chart-loaders";
import { OutboundFunnel } from "@/components/dashboard/outbound-funnel";
import { PerformanceMetrics } from "@/components/dashboard/performance-metrics";
import { SentEmailsList } from "@/components/dashboard/sent-emails-list";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { getSampleProfile } from "@/lib/data/profile";

async function loadDashboardData() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { data: getSampleDashboardData(), profileComplete: false, firstName: null, profile: null };
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return { data: getSampleDashboardData(), profileComplete: false, firstName: null, profile: null };
  }

  const [dashData, profile] = await Promise.all([
    getDashboardData(supabase, auth.user.id),
    getProfile(supabase, auth.user.id),
  ]);

  const firstName = profile?.name?.split(" ")[0] ?? null;
  return { data: dashData, profileComplete: profile?.profile_complete ?? false, firstName, profile };
}

export default async function DashboardPage() {
  const { data, profileComplete, firstName, profile } = await loadDashboardData();

  const greeting = data.isSample
    ? "Sample data — sign in to see your real activity."
    : firstName
      ? `Hey ${firstName} — here's your recruiting status.`
      : "Here's your recruiting status.";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">{greeting}</p>
      </div>

      {!data.isSample && (
        <OnboardingChecklist
          profileComplete={profileComplete}
          emailsSent={data.stats.sent}
          replied={data.stats.replied}
        />
      )}

      {/* 2-up on phones, 5-up from lg — the Pending card spans the full
          bottom row on small screens instead of orphaning centered. */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="Available"
          value={data.stats.coaches.toLocaleString()}
          icon={Database}
          accent="#b8863f"
        />
        <StatCard
          label="Sent"
          value={data.stats.sent}
          icon={Mail}
          accent="#8a6f4d"
        />
        <StatCard
          label="Opened"
          value={data.stats.opened}
          icon={MailOpen}
          accent="#c9662d"
        />
        <StatCard
          label="Replied"
          value={data.stats.replied}
          icon={MessageCircle}
          accent="#7d9159"
        />
        <StatCard
          className="col-span-2 lg:col-span-1"
          label="Pending"
          value={data.stats.pending.toLocaleString()}
          icon={Clock}
          accent="#a85d43"
          cta={{ label: "Start sending →", href: "/contacts" }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <GlassCardHeader>
            <GlassCardTitle>7-Day Outreach Activity</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <OutreachActivityChartLoader data={data.activity} />
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
