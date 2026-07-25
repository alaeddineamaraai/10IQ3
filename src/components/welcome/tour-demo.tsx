"use client";

import { useTour, DEMO_COACH, DEMO_DRAFT, DEMO_REPLY } from "./tour-context";

// Demo cards rendered at the top of real pages ONLY while the product tour is
// running (guarded by `injecting`), so a brand-new account still has something
// for the tour to spotlight. Each card carries the `data-tour` anchor the
// AppTour overlay looks for. When the tour is off these render nothing.

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export function TourDemoCoach() {
  const { injecting } = useTour();
  if (!injecting) return null;
  return (
    <div
      data-tour="tour-coach"
      className="mb-4 flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/[0.06] px-4 py-3.5"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
        {initials(DEMO_COACH.coach_name)}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-foreground">{DEMO_COACH.coach_name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {DEMO_COACH.school_name} · {DEMO_COACH.conference}
        </span>
      </div>
      <span className="shrink-0 rounded-md bg-primary/12 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
        {DEMO_COACH.division}
      </span>
    </div>
  );
}

export function TourDemoCompose() {
  const { injecting } = useTour();
  if (!injecting) return null;
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
          {initials(DEMO_COACH.coach_name)}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{DEMO_COACH.coach_name}</p>
          <p className="text-xs text-muted-foreground">{DEMO_COACH.school_name} · {DEMO_COACH.division}</p>
        </div>
      </div>
      <p className="line-clamp-4 whitespace-pre-wrap text-[12.5px] leading-relaxed text-muted-foreground">
        {DEMO_DRAFT}
      </p>
      <button
        data-tour="tour-send"
        type="button"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
      >
        <svg className="size-4" viewBox="0 0 16 16" fill="none">
          <path d="M14 2L7 9M14 2L9.5 14l-2.5-5L2 6.5l12-4.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Send to {DEMO_COACH.coach_name.split(" ")[0]}
      </button>
    </div>
  );
}

export function TourDemoReply() {
  const { injecting } = useTour();
  if (!injecting) return null;
  return (
    <div
      data-tour="tour-reply"
      className="mb-4 rounded-2xl p-4"
      style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)" }}
    >
      <div className="mb-2 flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold" style={{ background: "rgba(74,222,128,0.15)", color: "#4ADE80" }}>
          {initials(DEMO_REPLY.coach_name)}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">{DEMO_REPLY.coach_name}</p>
            <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: "rgba(74,222,128,0.15)", color: "#4ADE80" }}>
              New reply
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{DEMO_REPLY.school_name} · just now</p>
        </div>
      </div>
      <p className="text-[12.5px] leading-relaxed text-muted-foreground">{DEMO_REPLY.body}</p>
    </div>
  );
}
