import { FREE_PLAN_EMAIL_LIMIT, getPlan } from "@/lib/stripe/plans";
import type { AthleteProfile } from "@/lib/types/profile";

export type EmailAllowance =
  | { ok: true; source: "free_lifetime" }
  | { ok: true; source: "free_daily" }
  | { ok: true; source: "credit" }
  | { ok: false; reason: "lifetime_limit_reached" }
  | { ok: false; reason: "daily_cap_reached" }
  | { ok: false; reason: "no_credits" };

/**
 * Decides how (or whether) the next email send is allowed to go out.
 * `emailsSentToday` must be supplied by the caller (a count query scoped to
 * the athlete's own timezone-agnostic UTC day) — this function is pure so
 * it can be unit tested without touching Supabase.
 */
export function getEmailAllowance({
  profile,
  emailsSentToday,
}: {
  profile: Pick<AthleteProfile, "plan" | "emails_used" | "plan_started_at" | "email_credits">;
  emailsSentToday: number;
}): EmailAllowance {
  if (profile.plan === "free") {
    if (profile.emails_used >= FREE_PLAN_EMAIL_LIMIT) {
      return { ok: false, reason: "lifetime_limit_reached" };
    }
    return { ok: true, source: "free_lifetime" };
  }

  const plan = getPlan(profile.plan);
  if (!plan || plan.maxEmailsPerDay == null) {
    // Shouldn't happen for pro/elite, but fail closed rather than open.
    return { ok: false, reason: "daily_cap_reached" };
  }

  if (emailsSentToday >= plan.maxEmailsPerDay) {
    return { ok: false, reason: "daily_cap_reached" };
  }

  const daysSinceStart = profile.plan_started_at
    ? Math.floor((Date.now() - new Date(profile.plan_started_at).getTime()) / (24 * 60 * 60 * 1000))
    : 0;

  const inFreeWindow = plan.freePeriodDays != null && daysSinceStart < plan.freePeriodDays;
  const freeDailyLimit = inFreeWindow ? plan.freeEmailsPerDay ?? 0 : 0;

  if (emailsSentToday < freeDailyLimit) {
    return { ok: true, source: "free_daily" };
  }

  if (profile.email_credits > 0) {
    return { ok: true, source: "credit" };
  }

  return { ok: false, reason: "no_credits" };
}
