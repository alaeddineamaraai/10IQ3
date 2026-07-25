"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";

import { useTour, TOUR_ROUTE, type TourStage } from "./tour-context";

// ─── Step copy ───────────────────────────────────────────────────────────────

type StepDef = {
  anchor: string; // data-tour attribute value of the real element to spotlight
  title: string;
  body: string;
  cta: string;
  next: TourStage;
  placement?: "top" | "bottom";
};

const STEPS: Record<Exclude<TourStage, "welcome" | "done">, StepDef> = {
  coaches: {
    anchor: "tour-coach",
    title: "Find a coach to email",
    body: "This is your coach list — 1,800+ verified programs you can filter by division, conference and region. Tap a coach to start an email.",
    cta: "Next: write the email",
    next: "compose",
    placement: "bottom",
  },
  compose: {
    anchor: "tour-send",
    title: "Your AI-written email",
    body: "The AI reads your profile and each coach's program to draft a personal email. Review it, then hit Send — that's the whole job.",
    cta: "Next: track replies",
    next: "inbox",
    placement: "top",
  },
  inbox: {
    anchor: "tour-reply",
    title: "Replies land here",
    body: "When a coach replies you'll see it in your inbox, threaded with your email. Open tracking tells you the moment a coach reads yours.",
    cta: "Finish — go to my dashboard",
    next: "done",
    placement: "bottom",
  },
};

type Rect = { top: number; left: number; width: number; height: number };

// ─── Welcome splash ──────────────────────────────────────────────────────────

function WelcomeSplash({ onBegin, onSkip }: { onBegin: () => void; onSkip: () => void }) {
  return (
    <motion.div
      key="welcome"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[600] flex flex-col items-center justify-center overflow-hidden px-6 backdrop-blur-2xl"
      style={{ background: "rgba(8,7,6,0.62)" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 70% 50% at 50% 36%, rgba(180,155,110,0.10) 0%, transparent 100%)" }}
      />
      <motion.img
        src="/icon.png"
        alt="Netset"
        initial={{ opacity: 0, scale: 0.8, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.08, type: "spring", stiffness: 260, damping: 22 }}
        className="mb-8 size-[80px] rounded-[26px] shadow-2xl"
      />
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-2 text-center text-[36px] font-semibold leading-tight tracking-tight text-white"
      >
        Welcome to Netset
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="mb-12 text-center text-[15px] text-white/50"
      >
        A quick 30-second tour of the real app
      </motion.p>
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42 }}
        onClick={onBegin}
        whileTap={{ scale: 0.97 }}
        className="rounded-full bg-white px-10 py-3.5 text-[15px] font-semibold text-black shadow-2xl transition-opacity hover:opacity-90 touch-manipulation"
      >
        Start the tour
      </motion.button>
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        onClick={onSkip}
        className="mt-5 text-[13px] text-white/30 transition-colors hover:text-white/55 touch-manipulation"
      >
        Skip intro
      </motion.button>
    </motion.div>
  );
}

// ─── Overlay driver ──────────────────────────────────────────────────────────

const STEP_ORDER: TourStage[] = ["coaches", "compose", "inbox"];

export function AppTour() {
  const router = useRouter();
  const { active, stage, goTo, end } = useTour();
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const [mobile, setMobile] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const step = stage === "welcome" || stage === "done" ? null : STEPS[stage];

  // Navigate to the real route for the current stage.
  useEffect(() => {
    if (!active) return;
    const route = TOUR_ROUTE[stage];
    if (route) router.push(route);
    setRect(null);
  }, [active, stage, router]);

  // Locate + measure the anchored real element, polling until it appears
  // (route change + data render are async), then keep it in sync on scroll.
  useEffect(() => {
    if (!active || !step) return;
    let cancelled = false;
    const start = Date.now();

    const measure = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.anchor}"]`);
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        const r = el.getBoundingClientRect();
        if (!cancelled) setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        return true;
      }
      return false;
    };

    const tick = () => {
      if (cancelled) return;
      if (measure()) return;
      if (Date.now() - start < 6000) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    const onScroll = () => measure();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [active, stage, step]);

  const handleNext = useCallback(() => {
    if (!step) return;
    if (step.next === "done") {
      end();
      router.push("/dashboard");
    } else {
      goTo(step.next);
    }
  }, [step, goTo, end, router]);

  const handleSkip = useCallback(() => {
    end();
    router.push("/dashboard");
  }, [end, router]);

  if (!mounted || !active) return null;

  const pad = 10;
  const spot = rect
    ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }
    : null;

  const currentIdx = STEP_ORDER.indexOf(stage);

  return createPortal(
    <AnimatePresence>
      {stage === "welcome" ? (
        <WelcomeSplash key="welcome" onBegin={() => goTo("coaches")} onSkip={handleSkip} />
      ) : step ? (
        <motion.div
          key="tour"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[600]"
          style={{ pointerEvents: "none" }}
        >
          {/* Spotlight hole (box-shadow scrim) */}
          {spot && (
            <motion.div
              className="absolute rounded-2xl"
              initial={false}
              animate={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              style={{
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.72)",
                outline: "2px solid rgba(255,255,255,0.85)",
                outlineOffset: "0px",
              }}
            />
          )}
          {/* Full scrim before the anchor is found, so nothing flashes */}
          {!spot && (
            <div
              className="absolute inset-0 backdrop-blur-sm"
              style={{ background: "rgba(0,0,0,0.62)" }}
            />
          )}

          {/* Tooltip card */}
          <TourCard
            rect={spot}
            mobile={mobile}
            placement={step.placement ?? "bottom"}
            index={currentIdx}
            total={STEP_ORDER.length}
            title={step.title}
            body={step.body}
            cta={step.cta}
            onNext={handleNext}
            onSkip={handleSkip}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

// ─── Tooltip card ────────────────────────────────────────────────────────────

function TourCard({
  rect,
  mobile,
  placement,
  index,
  total,
  title,
  body,
  cta,
  onNext,
  onSkip,
}: {
  rect: Rect | null;
  mobile: boolean;
  placement: "top" | "bottom";
  index: number;
  total: number;
  title: string;
  body: string;
  cta: string;
  onNext: () => void;
  onSkip: () => void;
}) {
  // On mobile, pin the card to the bottom of the screen. On desktop, place it
  // just above/below the spotlight, clamped into the viewport.
  const width = mobile ? undefined : 380;
  let style: React.CSSProperties;
  if (mobile || !rect) {
    style = { left: 16, right: 16, bottom: 24 };
  } else {
    const gap = 18;
    const vw = window.innerWidth;
    let left = rect.left + rect.width / 2 - width! / 2;
    left = Math.max(16, Math.min(left, vw - width! - 16));
    if (placement === "top") {
      style = { left, top: Math.max(16, rect.top - gap), transform: "translateY(-100%)", width };
    } else {
      style = { left, top: rect.top + rect.height + gap, width };
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 360, damping: 30 }}
      className="absolute rounded-2xl p-5 shadow-2xl"
      style={{
        ...style,
        pointerEvents: "auto",
        background: "rgba(20,17,13,0.68)",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), 0 20px 50px rgba(0,0,0,0.5)",
      }}
    >
      <div className="mb-3 flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-500"
            style={{
              width: i === index ? 18 : 6,
              height: 6,
              background: i === index ? "rgba(255,255,255,0.9)" : i < index ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)",
            }}
          />
        ))}
      </div>
      <h3 className="mb-2 text-[17px] font-semibold text-white">{title}</h3>
      <p className="mb-4 text-[13.5px] leading-relaxed text-white/55">{body}</p>
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onSkip}
          className="text-[12.5px] text-white/35 transition-colors hover:text-white/60 touch-manipulation"
        >
          Skip tour
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-[13px] font-semibold text-black transition-opacity hover:opacity-90 touch-manipulation"
        >
          {cta}
          <svg className="size-3.5" viewBox="0 0 14 14" fill="none">
            <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}
