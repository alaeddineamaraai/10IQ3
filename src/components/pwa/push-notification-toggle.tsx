"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr.buffer;
}

type State = "loading" | "unsupported" | "denied" | "subscribed" | "unsubscribed";

export function PushNotificationToggle() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => {
        setState(sub ? "subscribed" : "unsubscribed");
      })
    );
  }, []);

  async function subscribe() {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      });
      const serialized = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: serialized.endpoint, keys: serialized.keys }),
      });
      setState("subscribed");
    } catch (err) {
      if (Notification.permission === "denied") setState("denied");
      console.error("Push subscribe failed:", err);
    } finally {
      setBusy(false);
    }
  }

  async function unsubscribe() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("unsubscribed");
    } catch (err) {
      console.error("Push unsubscribe failed:", err);
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading" || state === "unsupported") return null;

  if (state === "denied") {
    return (
      <p className="text-sm text-muted-foreground">
        Push notifications are blocked — enable them in your browser settings to get notified when coaches reply.
      </p>
    );
  }

  if (state === "subscribed") {
    return (
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 p-4">
        <div className="flex items-center gap-3">
          <Bell className="size-4 text-primary" />
          <div>
            <p className="text-sm font-medium">Push notifications on</p>
            <p className="text-xs text-muted-foreground">You'll be notified when a coach replies.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={unsubscribe} disabled={busy}>
          <BellOff className="size-4 mr-2" />
          Turn off
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 p-4">
      <div className="flex items-center gap-3">
        <BellOff className="size-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Push notifications off</p>
          <p className="text-xs text-muted-foreground">Get notified instantly when a coach replies.</p>
        </div>
      </div>
      <Button size="sm" onClick={subscribe} disabled={busy}>
        <Bell className="size-4 mr-2" />
        Enable
      </Button>
    </div>
  );
}
