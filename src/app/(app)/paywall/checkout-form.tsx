"use client";

import { useState } from "react";
import { PaymentElement, useCheckoutElements } from "@stripe/react-stripe-js/checkout";

import { Button } from "@/components/ui/button";

export function CheckoutForm({ onSuccess }: { onSuccess: () => void }) {
  const checkoutResult = useCheckoutElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (checkoutResult.type !== "success") return;

    setSubmitting(true);
    setError(null);

    const result = await checkoutResult.checkout.confirm({ redirect: "if_required" });

    setSubmitting(false);

    if (result.type === "error") {
      setError(result.error.message ?? "Payment failed");
      return;
    }

    onSuccess();
  }

  const ready = checkoutResult.type === "success";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={!ready || submitting}>
        {submitting ? "Processing…" : "Confirm payment"}
      </Button>
    </form>
  );
}
