import Link from "next/link";
import { Plus } from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDashboardData, getSampleDashboardData } from "@/lib/data/dashboard";
import { getProfile } from "@/lib/data/profile";
import { FREE_PLAN_EMAIL_LIMIT } from "@/lib/stripe/plans";
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
import { CoachRecommendations, type RecommendedCoach } from "@/components/dashboard/coach-recommendations";
import { EmailQuotaBar } from "@/components/dashboard/email-quota-bar";

const DEMO_RECOMMENDATIONS: RecommendedCoach[] = [
  { email: "c.hayes@northwestern.edu",  coach_name: "Christine Hayes",  school_name: "Northwestern University",   division: "NCAA Division I" },
  { email: "r.santos@georgetown.edu",   coach_name: "Rafael Santos",    school_name: "Georgetown University",      division: "NCAA Division I" },
  { email: "t.nguyen@rice.edu",         coach_name: "Tanya Nguyen",     school_name: "Rice University",            division: "NCAA Division I" },
  { email: "m.okafor@tulane.edu",       coach_name: "Michael Okafor",   school_name: "Tulane University",          division: "NCAA Division I" },
  { email: "s.brennan@pepperdine.edu",  coach_name: "Sean Brennan",     school_name: "Pepperdine University",      division: "NCAA Division I" },
  { email: "l.kim@wakeforest.edu",      coach_name: "Lisa Kim",         school_name: "Wake Forest University",     division: "NCAA Division I" },
];

async function loadDashboardData() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      data: getSampleDashboardData(),
      profileComplete: false,
      firstName: null,
      plan: null as string | null,
      emailsUsed: 0,
      recommendations: [] as RecommendedCoach[],
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return {
      data: getSampleDashboardData(),
      profileComplete: false,
      firstName: null,
      plan: null as string | null,
      emailsUsed: 0,
      recommendations: [] as RecommendedCoach[],
    };
  }

  const [dashData, profile] = await Promise.all([
    getDashboardData(supabase, auth.user.id),
    getProfile(supabase, auth.user.id),
  ]);

  // Already-contacted coach emails for exclusion.
  const contactedEmails = new Set(dashData.sentEmails.map((e) => e.coach_email));

  // Find up to 6 coaches matching the user's target division and gender
  // that they haven't contacted yet.
  let recommendations: RecommendedCoach[] = [];
  if (profile) {
    let query = supabase
      .from("coaches_database")
      .select("email, coach_name, school_name, division")
      .limit(50);

    if (profile.target_div) query = query.eq("division", profile.target_div);
    if (profile.gender) query = query.ilike("gender", `%${profile.gender}%`);

    const { data: candidates } = await query;
    recommendations = (candidates ?? [])
      .filter((c) => !contactedEmails.has(c.email))
      .slice(0, 6) as RecommendedCoach[];
  }

  const firstName = profile?.name?.split(" ")[0] ?? null;
  return {
    data: dashData,
    profileComplete: profile?.profile_complete ?? false,
    firstName,
    plan: profile?.plan ?? null,
    emailsUsed: profile?.emails_used ?? 0,
    recommendations,
  };
}

export default async function DashboardPage() {
  const { data, profileComplete, firstName, plan, emailsUsed, recommendations } = await loadDashboardData();

  const heading = data.isSample ? "Welcome back, Alex" : firstName ? `Welcome back, ${firstName}` : "Dashboard";
  const subtitle = "Track your outreach, monitor responses, and connect with coaches.";

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

      {/* Onboarding checklist — always shown in demo (all steps complete), conditionally for real users */}
      {data.isSample ? (
        <OnboardingChecklist profileComplete emailsSent={data.stats.sent} replied={data.stats.replied} />
      ) : (
        <OnboardingChecklist
          profileComplete={profileComplete}
          emailsSent={data.stats.sent}
          replied={data.stats.replied}
        />
      )}

      {!data.isSample && plan === "free" && (
        <EmailQuotaBar used={emailsUsed} limit={FREE_PLAN_EMAIL_LIMIT} />
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

      {(data.isSample || recommendations.length > 0) && (
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Suggested Outreach
          </p>
          {data.isSample ? (
            <CoachRecommendations coaches={DEMO_RECOMMENDATIONS} />
          ) : (
            <CoachRecommendations coaches={recommendations} />
          )}
        </div>
      )}
    </div>
  );
}
