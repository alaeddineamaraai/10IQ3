import type { Plan } from "@/lib/types/profile";

// Free plan gets a lifetime cap (not a daily one) — tracked via emails_used.
export const FREE_PLAN_EMAIL_LIMIT = 5;

/**
 * Launch gate: ship the free tier now, keep Pro/Elite checkout locked until
 * Stripe is switched to live mode and a real charge has been verified
 * end-to-end. Flip to `false` when ready to accept real payments — this
 * disables the paywall's upgrade buttons AND blocks the checkout API
 * server-side (belt and suspenders, in case someone hits the endpoint
 * directly while the UI is locked).
 */
export const PAID_TIERS_LOCKED = true;

export type PlanDefinition = {
  id: Plan;
  name: string;
  priceMonthly: number;
  features: string[];
  /**
   * Pro/Elite only: for `freePeriodDays` days after `plan_started_at`, the
   * athlete gets `freeEmailsPerDay` emails/day at no extra cost. Once that
   * window closes, every send draws from the athlete's purchased
   * `email_credits` balance instead. `null` on the free plan — it doesn't
   * use the daily model at all.
   */
  freeEmailsPerDay: number | null;
  freePeriodDays: number | null;
  /** Cost of one overage email once the free window/allowance is spent. */
  overagePricePerEmailCents: number | null;
  /** Hard ceiling on sends per day, free + paid combined. */
  maxEmailsPerDay: number | null;
};

export const PLANS: PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    features: [
      `${FREE_PLAN_EMAIL_LIMIT} recruiting emails total`,
      "Limited coach data",
      "Limited AI drafting",
    ],
    freeEmailsPerDay: null,
    freePeriodDays: null,
    overagePricePerEmailCents: null,
    maxEmailsPerDay: null,
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 50,
    features: [
      "5 free emails/day for your first week",
      "24¢/email after that, up to 20/day",
      "Full coach data",
      "AI Advisor chat",
      "Full outreach analytics",
    ],
    freeEmailsPerDay: 5,
    freePeriodDays: 7,
    overagePricePerEmailCents: 24,
    maxEmailsPerDay: 20,
  },
  {
    id: "elite",
    name: "Elite",
    priceMonthly: 75,
    features: [
      "5 free emails/day for your first 2 weeks",
      "17¢/email after that, up to 30/day",
      "Everything in Pro",
      "Priority email generation",
      "1:1 recruiting strategy session",
    ],
    freeEmailsPerDay: 5,
    freePeriodDays: 14,
    overagePricePerEmailCents: 17,
    maxEmailsPerDay: 30,
  },
];

export function getPlan(id: string): PlanDefinition | undefined {
  return PLANS.find((p) => p.id === id);
}
