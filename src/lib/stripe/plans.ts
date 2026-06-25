import type { Plan } from "@/lib/types/profile";

export type PlanDefinition = {
  id: Plan;
  name: string;
  priceMonthly: number;
  features: string[];
};

export const PLANS: PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    features: ["5 recruiting emails", "Browse all 1,800+ coaches", "Basic dashboard"],
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 30,
    features: [
      "Unlimited recruiting emails",
      "AI Advisor chat",
      "Full outreach analytics",
      "Bulk compose",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    priceMonthly: 75,
    features: [
      "Everything in Pro",
      "Priority email generation",
      "1:1 recruiting strategy session",
      "Early access to new features",
    ],
  },
];

export function getPlan(id: string): PlanDefinition | undefined {
  return PLANS.find((p) => p.id === id);
}
