"use client";

import { useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GlassCard,
  GlassCardContent,
  GlassCardFooter,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/glass-card";
import { PLANS } from "@/lib/stripe/plans";
import type { Plan } from "@/lib/types/profile";
import { CheckoutForm } from "./checkout-form";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const isSampleMode = !publishableKey;
const stripePromise: Promise<Stripe | null> | null = publishableKey
  ? loadStripe(publishableKey)
  : null;

export function PaywallClient({ currentPlan }: { currentPlan: Plan }) {
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upgraded, setUpgraded] = useState<Plan | null>(null);

  async function startCheckout(planId: Plan) {
    setError(null);
    setCheckoutPlan(planId);

    if (isSampleMode) {
      setClientSecret("sample");
      return;
    }

    const res = await fetch("/api/stripe/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planId }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Couldn't start checkout");
      setCheckoutPlan(null);
      return;
    }

    setClientSecret(data.clientSecret);
  }

  return (
    <div className="flex flex-col gap-6">
      {isSampleMode && (
        <p className="text-sm text-muted-foreground">
          Sample mode — Stripe isn&apos;t configured, so checkout is simulated.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          return (
            <GlassCard key={plan.id} className={isCurrent ? "ring-2 ring-primary" : undefined}>
              <GlassCardHeader>
                <div className="flex items-center justify-between">
                  <GlassCardTitle>{plan.name}</GlassCardTitle>
                  {isCurrent && <Badge>Current</Badge>}
                </div>
                <p className="text-2xl font-semibold tracking-tight">
                  ${plan.priceMonthly}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </p>
              </GlassCardHeader>
              <GlassCardContent>
                <ul className="flex flex-col gap-2 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </GlassCardContent>
              <GlassCardFooter className="bg-transparent">
                {plan.id === "free" ? (
                  <Button variant="outline" className="w-full" disabled>
                    {isCurrent ? "Current plan" : "Downgrade"}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    disabled={isCurrent}
                    onClick={() => startCheckout(plan.id)}
                  >
                    {isCurrent ? "Current plan" : `Upgrade to ${plan.name}`}
                  </Button>
                )}
              </GlassCardFooter>
            </GlassCard>
          );
        })}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {checkoutPlan && clientSecret && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>
              Checkout — {PLANS.find((p) => p.id === checkoutPlan)?.name}
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {upgraded === checkoutPlan ? (
              <p className="text-sm text-muted-foreground">
                Payment confirmed — your plan will update once the webhook processes it.
              </p>
            ) : isSampleMode ? (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  No Stripe keys configured — this simulates a successful checkout.
                </p>
                <Button onClick={() => setUpgraded(checkoutPlan)}>Simulate payment</Button>
              </div>
            ) : stripePromise ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "night",
                    variables: {
                      colorPrimary: "#5b9bf7",
                      colorBackground: "#0d111c",
                      colorText: "#f1f5f9",
                      colorTextSecondary: "#94a3b8",
                      colorDanger: "#ef4444",
                      borderRadius: "12px",
                    },
                  },
                }}
              >
                <CheckoutForm onSuccess={() => setUpgraded(checkoutPlan)} />
              </Elements>
            ) : null}
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  );
}
