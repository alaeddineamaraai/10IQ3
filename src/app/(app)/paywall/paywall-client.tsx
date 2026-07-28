"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardFooter,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/glass-card";
import { PLANS, getPlan, PAID_TIERS_LOCKED } from "@/lib/stripe/plans";
import type { Plan } from "@/lib/types/profile";

const isSampleMode = !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// @stripe/stripe-js + @stripe/react-stripe-js only download once a checkout
// actually starts (clientSecret is set), instead of on every /paywall load.
const StripeCheckout = dynamic(
  () => import("./stripe-checkout").then((m) => ({ default: m.StripeCheckout })),
  {
    ssr: false,
    loading: () => (
      <div className="h-40 animate-pulse rounded-lg bg-muted/30" />
    ),
  }
);

const MIN_CREDITS = 10;
const MAX_CREDITS = 500;
const CREDITS_STEP = 5;

// Free displayed in the middle for now (no "most popular" hero treatment) —
// a temporary layout while paid tiers are locked, see PAID_TIERS_LOCKED.
const DISPLAY_ORDER: Plan[] = ["pro", "free", "elite"];

type CheckoutTarget =
  | { type: "plan"; plan: Plan }
  | { type: "credits"; quantity: number };

export function PaywallClient({ currentPlan }: { currentPlan: Plan }) {
  const { resolvedTheme } = useTheme();
  const [checkoutTarget, setCheckoutTarget] = useState<CheckoutTarget | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [creditsQuantity, setCreditsQuantity] = useState(50);

  const currentPlanDef = getPlan(currentPlan);
  const canBuyCredits = currentPlanDef?.overagePricePerEmailCents != null;

  async function startPlanCheckout(planId: Plan) {
    setError(null);
    setDone(false);
    setCheckoutTarget({ type: "plan", plan: planId });

    if (isSampleMode) {
      setClientSecret("sample");
      return;
    }

    const res = await fetch("/api/stripe/create-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planId }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Couldn't start checkout");
      setCheckoutTarget(null);
      return;
    }

    setClientSecret(data.clientSecret);
  }

  async function startCreditsCheckout() {
    setError(null);
    setDone(false);
    setCheckoutTarget({ type: "credits", quantity: creditsQuantity });

    if (isSampleMode) {
      setClientSecret("sample");
      return;
    }

    const res = await fetch("/api/stripe/create-email-credits-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: creditsQuantity }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Couldn't start checkout");
      setCheckoutTarget(null);
      return;
    }

    setClientSecret(data.clientSecret);
  }

  const creditsPriceCents = (currentPlanDef?.overagePricePerEmailCents ?? 0) * creditsQuantity;

  return (
    <div className="flex flex-col gap-6">
      {isSampleMode && (
        <p className="w-fit rounded-lg border border-border/50 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
          Sample mode — Stripe isn&apos;t configured, so checkout is simulated.
        </p>
      )}

      {PAID_TIERS_LOCKED && (
        <p className="w-fit rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs text-foreground">
          Pro and Elite are launching very soon — free accounts are open now.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 pt-3 sm:grid-cols-3">
        {DISPLAY_ORDER.map((planId) => {
          const plan = PLANS.find((p) => p.id === planId)!;
          const isCurrent = currentPlan === plan.id;
          return (
            <GlassCard key={plan.id}>
              <GlassCardHeader>
                <div className="flex items-center justify-between">
                  <GlassCardTitle>{plan.name}</GlassCardTitle>
                  {isCurrent && (
                    <Badge variant="secondary" className="text-muted-foreground">
                      Current
                    </Badge>
                  )}
                </div>
                <p className="text-4xl font-bold tracking-[-0.02em]">
                  ${plan.priceMonthly}
                  <span className="text-sm font-normal tracking-normal text-muted-foreground">/mo</span>
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
                    variant="outline"
                    className="w-full"
                    disabled={isCurrent || PAID_TIERS_LOCKED}
                    onClick={() => startPlanCheckout(plan.id)}
                  >
                    {isCurrent
                      ? "Current plan"
                      : PAID_TIERS_LOCKED
                        ? "Coming soon"
                        : `Upgrade to ${plan.name}`}
                  </Button>
                )}
              </GlassCardFooter>
            </GlassCard>
          );
        })}
      </div>

      {canBuyCredits && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Buy extra emails</GlassCardTitle>
            <GlassCardDescription>
              Once your free daily emails run out, top up your balance at{" "}
              {currentPlanDef?.overagePricePerEmailCents ?? 0}¢ each — used
              automatically before your next sends.
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium">{creditsQuantity} emails</span>
              <span className="text-lg font-bold tracking-[-0.02em]">
                ${(creditsPriceCents / 100).toFixed(2)}
              </span>
            </div>
            <Slider
              min={MIN_CREDITS}
              max={MAX_CREDITS}
              step={CREDITS_STEP}
              value={creditsQuantity}
              onValueChange={(v) => setCreditsQuantity(v as number)}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{MIN_CREDITS}</span>
              <span>{MAX_CREDITS}</span>
            </div>
            <Button className="w-fit" onClick={startCreditsCheckout}>
              Buy {creditsQuantity} emails — ${(creditsPriceCents / 100).toFixed(2)}
            </Button>
          </GlassCardContent>
        </GlassCard>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {checkoutTarget && clientSecret && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>
              Checkout —{" "}
              {checkoutTarget.type === "plan"
                ? getPlan(checkoutTarget.plan)?.name
                : `${checkoutTarget.quantity} emails`}
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {done ? (
              <p className="text-sm text-muted-foreground">
                {checkoutTarget.type === "plan"
                  ? "Payment confirmed — your plan will update once the webhook processes it."
                  : "Payment confirmed — your email credits will land once the webhook processes it."}
              </p>
            ) : isSampleMode ? (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  No Stripe keys configured — this simulates a successful checkout.
                </p>
                <Button onClick={() => setDone(true)}>Simulate payment</Button>
              </div>
            ) : (
              <StripeCheckout
                clientSecret={clientSecret}
                dark={resolvedTheme === "dark"}
                onSuccess={() => setDone(true)}
              />
            )}
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  );
}
