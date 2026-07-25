"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

// ─── Tour stages ─────────────────────────────────────────────────────────────
// The hybrid product tour walks the user through the REAL app pages. Each stage
// (after the welcome splash) corresponds to a real route the tour navigates to.

export type TourStage = "welcome" | "coaches" | "compose" | "inbox" | "done";

export const TOUR_ROUTE: Partial<Record<TourStage, string>> = {
  coaches: "/contacts",
  compose: "/compose",
  inbox: "/inbox",
};

// Demo content injected into the real list/compose components only while the
// tour is running, so a brand-new account with no data still has something to
// point at. Everything here is inert when `active` is false.

export const DEMO_COACH = {
  id: "tour-demo-coach",
  coach_name: "Sarah Mitchell",
  school_name: "Stanford University",
  division: "D1",
  conference: "Pac-12",
  email: "coach.mitchell@example.edu",
};

export const DEMO_DRAFT = `Dear Coach Mitchell,

My name is Alex Carter, a Class of 2027 athlete with a UTR of 11.8 and a 22–6 singles record. Stanford's academic rigor and your program's aggressive baseline style align perfectly with my game and goals.

I'd love the chance to discuss how I might contribute to your program.`;

export const DEMO_REPLY = {
  id: "tour-demo-reply",
  coach_name: "Sarah Mitchell",
  school_name: "Stanford University",
  division: "D1",
  body: `Hi Alex — your 11.8 UTR and 22–6 record caught our eye. Are you free for a call Tuesday or Wednesday afternoon?`,
};

type TourValue = {
  active: boolean;
  stage: TourStage;
  /** True only while the tour is active — components use this to decide whether
   * to inject their demo row. */
  injecting: boolean;
  start: () => void;
  goTo: (stage: TourStage) => void;
  end: () => void;
};

const TourContext = createContext<TourValue | null>(null);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);
  const [stage, setStage] = useState<TourStage>("welcome");

  const start = useCallback(() => {
    setStage("welcome");
    setActive(true);
  }, []);

  const goTo = useCallback((next: TourStage) => {
    if (next === "done") {
      setActive(false);
      setStage("done");
    } else {
      setStage(next);
    }
  }, []);

  const end = useCallback(() => {
    setActive(false);
    setStage("done");
  }, []);

  const value = useMemo<TourValue>(
    () => ({ active, stage, injecting: active, start, goTo, end }),
    [active, stage, start, goTo, end]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour(): TourValue {
  const ctx = useContext(TourContext);
  if (!ctx) {
    // Safe fallback so components that read the tour outside the provider (e.g.
    // during isolated tests) simply never inject demo content.
    return {
      active: false,
      stage: "done",
      injecting: false,
      start: () => {},
      goTo: () => {},
      end: () => {},
    };
  }
  return ctx;
}
