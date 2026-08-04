"use client";

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import type { Plan } from "@/lib/types/profile";

interface PayPalCheckoutProps {
  plan: Plan;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export function PayPalCheckout({ plan, onSuccess, onError }: PayPalCheckoutProps) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";

  return (
    <PayPalScriptProvider options={{ clientId, currency: "USD", intent: "capture" }}>
      <PayPalButtons
        style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
        createOrder={async () => {
          const res = await fetch("/api/paypal/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plan }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Could not create order");
          return data.orderId;
        }}
        onApprove={async (data) => {
          const res = await fetch("/api/paypal/capture-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: data.orderID, plan }),
          });
          const result = await res.json();
          if (!res.ok) {
            onError(result.error ?? "Payment capture failed");
            return;
          }
          onSuccess();
        }}
        onError={(err) => {
          onError(err instanceof Error ? err.message : "PayPal error");
        }}
        onCancel={() => {
          onError("Payment cancelled");
        }}
      />
    </PayPalScriptProvider>
  );
}
