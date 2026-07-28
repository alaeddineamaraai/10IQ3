"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  X,
  Sparkles,
  PenSquare,
  Inbox,
  Users,
  BarChart2,
  ChevronRight,
  ChevronLeft,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: Users,
    color: "#7d9159",
    title: "Find your coaches",
    mobileDesc: "Tap Contacts in the bottom bar to browse 1,800+ coaches filtered by division, UTR, and location.",
    desktopDesc: "Open Contacts from the left dock to browse 1,800+ coaches. Filter by division, UTR range, and location. Star the ones you want to target.",
  },
  {
    icon: PenSquare,
    color: "#c9662d",
    title: "Draft & send emails",
    mobileDesc: "Tap Compose, pick coaches, and let the AI write a personalised email based on your profile. Review, edit, and hit Send.",
    desktopDesc: "Open Compose, select coaches from the left panel, and the AI drafts a unique email for each. You can edit any draft before sending.",
  },
  {
    icon: Inbox,
    color: "var(--primary)",
    title: "Track replies",
    mobileDesc: "The inbox icon in the top-left shows unread replies. Tap any thread to read and reply directly inside Netset.",
    desktopDesc: "Your Inbox (left dock) groups every conversation by coach. See who opened, replied, or needs a follow-up at a glance.",
  },
  {
    icon: BarChart2,
    color: "#7d9159",
    title: "Monitor your dashboard",
    mobileDesc: "Dashboard shows open rates, reply rates, and your outreach funnel. Use it to see what's working.",
    desktopDesc: "Dashboard gives you a 7-day activity chart, division breakdown, open/reply rates, and every email you've sent — all in one view.",
  },
  {
    icon: Sparkles,
    color: "#c9662d",
    title: "Ask the AI advisor",
    mobileDesc: "Tap the star icon in the bottom bar. Ask anything — which divisions fit your UTR, how to write a follow-up, timing strategy.",
    desktopDesc: "Open AI Advisor from the left dock. Ask about division fit, email strategy, timing, follow-up sequences — it knows your profile.",
  },
];

export function HowToGuide() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  return (
    <>
      <button
        onClick={() => { setOpen(true); setStep(0); }}
        className="flex items-center gap-1.5 rounded-full border border-border/40 bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-smooth hover:bg-muted/60 hover:text-foreground touch-manipulation"
        aria-label="How to use Netset"
      >
        <BookOpen className="size-3.5" />
        <span>Guide</span>
      </button>

      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {open && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm"
              />

              {/* Panel — slides up on mobile, fades in centered on desktop */}
              <motion.div
                initial={{ opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: "100%" }}
                transition={{ type: "spring", stiffness: 340, damping: 32, mass: 0.9 }}
                className="fixed inset-x-0 bottom-0 z-[301] flex flex-col rounded-t-3xl bg-card shadow-2xl md:hidden"
                style={{ maxHeight: "88dvh" }}
              >
                <MobileGuide step={step} setStep={setStep} onClose={() => setOpen(false)} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 340, damping: 30 }}
                className="fixed inset-0 z-[301] hidden items-center justify-center px-6 md:flex"
              >
                <DesktopGuide step={step} setStep={setStep} onClose={() => setOpen(false)} />
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

function MobileGuide({ step, setStep, onClose }: { step: number; setStep: (n: number) => void; onClose: () => void }) {
  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Handle */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="h-1 w-10 rounded-full bg-border" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3">
        <span className="text-sm font-semibold text-muted-foreground">
          How to use Netset
        </span>
        <button onClick={onClose} className="flex size-8 items-center justify-center rounded-full bg-muted touch-manipulation">
          <X className="size-4" />
        </button>
      </div>

      {/* Step dots */}
      <div className="flex justify-center gap-1.5 pb-4">
        {STEPS.map((_, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-200 touch-manipulation",
              i === step ? "w-6 bg-primary" : "w-1.5 bg-border"
            )}
          />
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.18 }}
          className="flex flex-col items-center gap-6 px-8 pb-8 pt-2 text-center"
        >
          <div
            className="flex size-20 items-center justify-center rounded-3xl"
            style={{ background: `${current.color}22` }}
          >
            <Icon className="size-10" style={{ color: current.color }} strokeWidth={1.5} />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold">{current.title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{current.mobileDesc}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Nav */}
      <div className="flex items-center justify-between border-t border-border px-5 py-4">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground disabled:opacity-30 touch-manipulation"
        >
          <ChevronLeft className="size-4" /> Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="flex items-center gap-1 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground touch-manipulation"
          >
            Next <ChevronRight className="size-4" />
          </button>
        ) : (
          <button
            onClick={onClose}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground touch-manipulation"
          >
            Got it
          </button>
        )}
      </div>
    </div>
  );
}

function DesktopGuide({ step, setStep, onClose }: { step: number; setStep: (n: number) => void; onClose: () => void }) {
  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <div className="glass-card-strong flex w-full max-w-2xl overflow-hidden rounded-3xl">
      {/* Sidebar */}
      <div className="flex w-52 shrink-0 flex-col gap-1 border-r border-border/50 p-4">
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
          Steps
        </p>
        {STEPS.map((s, i) => {
          const SIcon = s.icon;
          return (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-smooth",
                i === step
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <SIcon className="size-4 shrink-0" />
              {s.title}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="relative flex flex-1 flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-muted hover:bg-muted/80"
        >
          <X className="size-4" />
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.16 }}
            className="flex flex-1 flex-col gap-6 p-8"
          >
            <div
              className="flex size-16 items-center justify-center rounded-2xl"
              style={{ background: `${current.color}22` }}
            >
              <Icon className="size-8" style={{ color: current.color }} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold">{current.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{current.desktopDesc}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between border-t border-border/50 px-8 py-4">
          <span className="text-xs text-muted-foreground">{step + 1} / {STEPS.length}</span>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1 rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground hover:bg-muted/60"
              >
                <ChevronLeft className="size-4" /> Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground"
              >
                Next <ChevronRight className="size-4" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="rounded-full bg-primary px-5 py-1.5 text-sm font-semibold text-primary-foreground"
              >
                Got it
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
