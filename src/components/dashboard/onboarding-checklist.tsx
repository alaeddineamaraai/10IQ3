"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronDown, ChevronUp, Circle, X } from "lucide-react";

import { GlassCard, GlassCardContent } from "@/components/glass-card";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "netset_checklist_dismissed_v1";

type Props = {
  profileComplete: boolean;
  emailsSent: number;
  replied: number;
};

export function OnboardingChecklist({ profileComplete, emailsSent, replied }: Props) {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Mount-only guard: localStorage isn't available during SSR, so this state
    // can't be computed via a lazy useState initializer without a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (localStorage.getItem(STORAGE_KEY) === "true") setDismissed(true);
  }, []);

  const steps = [
    {
      id: "profile",
      title: "Complete your profile",
      description: "Add your grad year, UTR, and target division so every email is personalized.",
      href: "/profile",
      cta: "Edit profile →",
      done: profileComplete,
    },
    {
      id: "first_email",
      title: "Send your first email",
      description: "Pick a coach from the Compose page and fire off your intro.",
      href: "/compose",
      cta: "Open Compose →",
      done: emailsSent >= 1,
    },
    {
      id: "ten_coaches",
      title: "Reach 10 coaches",
      description: "Students who contact 10+ programs see significantly more replies.",
      href: "/coaches",
      cta: "Browse coaches →",
      done: emailsSent >= 10,
    },
    {
      id: "first_reply",
      title: "Get your first reply",
      description: "A coach is interested — keep the conversation going.",
      href: "/dashboard",
      cta: "View dashboard →",
      done: replied >= 1,
    },
  ] as const;

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  }

  if (!mounted || dismissed) return null;

  if (allDone) {
    return (
      <GlassCard className="border-green-500/20">
        <GlassCardContent className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-5 shrink-0 text-green-500" />
            <div>
              <p className="text-sm font-semibold">You&apos;re all set!</p>
              <p className="text-xs text-muted-foreground">
                All getting-started steps complete — keep the momentum going.
              </p>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="shrink-0 rounded-full p-1 text-muted-foreground transition-smooth hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </GlassCardContent>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <GlassCardContent className="px-5 py-4">
        {/* Header row */}
        <div className="mb-3 flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Getting started</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                {doneCount} / {steps.length}
              </span>
            </div>
            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${(doneCount / steps.length) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="rounded-full p-1 text-muted-foreground transition-smooth hover:text-foreground"
              aria-label={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
            </button>
            <button
              onClick={dismiss}
              className="rounded-full p-1 text-muted-foreground transition-smooth hover:text-foreground"
              aria-label="Dismiss checklist"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Step list */}
        {!collapsed && (
          <div className="flex flex-col divide-y divide-border/50">
            {steps.map((step) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-start gap-3 py-3 first:pt-0 last:pb-0",
                  step.done && "opacity-50",
                )}
              >
                {step.done ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                ) : (
                  <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground/40" />
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm font-medium leading-snug",
                      step.done && "line-through decoration-muted-foreground/40",
                    )}
                  >
                    {step.title}
                  </p>
                  {!step.done && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
                  )}
                </div>
                {!step.done && (
                  <Link
                    href={step.href}
                    className="shrink-0 text-xs font-medium text-primary transition-smooth hover:underline"
                  >
                    {step.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}
