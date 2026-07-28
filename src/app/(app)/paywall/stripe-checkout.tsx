"use client";

import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { CheckoutElementsProvider } from "@stripe/react-stripe-js/checkout";

import { CheckoutForm } from "./checkout-form";

// Loaded lazily via next/dynamic from paywall-client.tsx, so @stripe/stripe-js
// and @stripe/react-stripe-js (a sizeable third-party bundle) only download
// once a checkout actually starts, not on every /paywall page load.
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise: Promise<Stripe | null> | null = publishableKey
  ? loadStripe(publishableKey)
  : null;

function stripeAppearance(dark: boolean) {
  return dark
    ? {
        theme: "night" as const,
        variables: {
          colorPrimary: "#ece5d3",
          colorBackground: "#38332b",
          colorText: "#f2ede1",
          colorTextSecondary: "#b0a591",
          colorDanger: "#ef4444",
          borderRadius: "12px",
        },
      }
    : {
        theme: "stripe" as const,
        variables: {
          colorPrimary: "#2a251d",
          colorBackground: "#fdf9ee",
          colorText: "#26211a",
          colorTextSecondary: "#85796a",
          colorDanger: "#dc2626",
          borderRadius: "12px",
        },
      };
}

export function StripeCheckout({
  clientSecret,
  dark,
  onSuccess,
}: {
  clientSecret: string;
  dark: boolean;
  onSuccess: () => void;
}) {
  if (!stripePromise) return null;

  return (
    <CheckoutElementsProvider
      stripe={stripePromise}
      options={{ clientSecret, elementsOptions: { appearance: stripeAppearance(dark) } }}
    >
      <CheckoutForm onSuccess={onSuccess} />
    </CheckoutElementsProvider>
  );
}
