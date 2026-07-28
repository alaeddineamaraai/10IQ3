import Link from "next/link";

import { Progress } from "@/components/ui/progress";
import { FREE_PLAN_EMAIL_LIMIT, getPlan } from "@/lib/stripe/plans";
import type { AthleteProfile } from "@/lib/types/profile";

function daysSince(iso: string | null): number {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * Free plan shows a lifetime-cap bar; Pro/Elite show today's free-daily
 * allowance (while the introductory window lasts) plus the purchased
 * credit balance that covers everything after it. Used in Settings,
 * Profile, and the dock's profile menu — kept in one place so the plan
 * math doesn't drift across three copies.
 */
export function PlanUsageSummary({ profile }: { profile: AthleteProfile }) {
  if (profile.plan === "free") {
    const remaining = Math.max(FREE_PLAN_EMAIL_LIMIT - profile.emails_used, 0);
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium">Free emails used</span>
          <span className="text-muted-foreground">
            {profile.emails_used} / {FREE_PLAN_EMAIL_LIMIT}
          </span>
        </div>
        <Progress value={(profile.emails_used / FREE_PLAN_EMAIL_LIMIT) * 100} />
        {remaining === 0 && (
          <Link href="/paywall" className="text-sm text-primary hover:underline">
            Upgrade to send more emails →
          </Link>
        )}
      </div>
    );
  }

  const plan = getPlan(profile.plan);
  const daysSinceStart = daysSince(profile.plan_started_at);
  const inFreeWindow = !!plan?.freePeriodDays && daysSinceStart < plan.freePeriodDays;
  const daysLeft = plan?.freePeriodDays ? Math.max(plan.freePeriodDays - daysSinceStart, 0) : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">Email credits</span>
        <span className="text-muted-foreground">{profile.email_credits} left</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {inFreeWindow
          ? `${plan?.freeEmailsPerDay}/day free for ${daysLeft} more day${daysLeft === 1 ? "" : "s"}, then ${plan?.overagePricePerEmailCents}¢/email`
          : `${plan?.overagePricePerEmailCents}¢/email, up to ${plan?.maxEmailsPerDay}/day`}
      </p>
      {profile.email_credits === 0 && !inFreeWindow && (
        <Link href="/paywall" className="text-sm text-primary hover:underline">
          Buy more emails →
        </Link>
      )}
    </div>
  );
}
