"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CalendarClock, ChevronRight, PartyPopper, Send, Sparkles, X } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  GlassCard,
  GlassCardContent,
  GlassCardFooter,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/glass-card";
import { cn } from "@/lib/utils";
import { TourDemoCompose } from "@/components/welcome/tour-demo";
import type { Coach, CoachWithOutreach } from "@/lib/types/coach";

type Status = "idle" | "loading" | "streaming" | "ready" | "sending" | "sent" | "template" | "error";

type Draft = {
  coach: Coach;
  subject: string;
  body: string;
  status: Status;
  error?: string;
  scheduled_for?: string;
};

const ALL = "all";
const MAX_VISIBLE = 100;

const SAMPLE_VARIANTS: ((coach: Coach, lastName: string) => { subject: string; body: string })[] = [
  (coach, lastName) => ({
    subject: `${coach.school_name} ${coach.division} — recruiting interest from a [grad year] player`,
    body:
      `Hi Coach ${lastName},\n\n` +
      `My name is [Your Name] and I'm a [grad year] tennis player currently ranked around [national rank], ` +
      `with a UTR of [UTR] and a WTN of [WTN]. I've been following ${coach.school_name}'s ${coach.division} ` +
      `program for a while now, and the level of competition your team plays at is exactly what I'm looking ` +
      `for at the next level.\n\n` +
      `This past season I finished [singles record] in singles and [doubles record] in doubles, and I've ` +
      `been working specifically on my [playing style] game to get ready for college-level competition. ` +
      `I'd love the chance to send over my highlight video and full stats if you have a moment.\n\n` +
      `Would you be open to a quick call in the next couple of weeks to talk about the program and whether ` +
      `I might be a good fit for your roster?\n\nThanks so much for your time,\n[Your Name]`,
  }),
  (coach, lastName) => ({
    subject: `[grad year] recruit interested in ${coach.school_name} tennis`,
    body:
      `Dear Coach ${lastName},\n\n` +
      `I hope this email finds you well. I'm [Your Name], a [grad year] student-athlete from [location], ` +
      `and I wanted to reach out directly about the possibility of joining ${coach.school_name}'s tennis program.\n\n` +
      `Academically, I'm maintaining a [GPA] GPA and I'm targeting [target division] programs that take both ` +
      `the classroom and the court seriously — from what I've read, that's exactly the culture you've built ` +
      `at ${coach.school_name}. On the court, my current UTR is [UTR], and I play a [playing style] style that ` +
      `I think would translate well to your lineup.\n\n` +
      `I'd be glad to share my transcript, match footage, and references from my current coach whenever it's ` +
      `convenient. Please let me know if there's anything else you'd like to see from me at this stage.\n\n` +
      `Best regards,\n[Your Name]`,
  }),
  (coach, lastName) => ({
    subject: `Highlight video + recruiting profile — [Your Name] (${coach.division})`,
    body:
      `Hi Coach ${lastName},\n\n` +
      `I'm [Your Name], a [grad year] tennis player, and I just finished putting together an updated highlight ` +
      `reel from this season that I wanted to share directly with your program. A few quick stats: [UTR] UTR, ` +
      `[singles record] in singles this year, and I've spent most of the season working on becoming a more ` +
      `complete [playing style] player rather than relying on one shot.\n\n` +
      `${coach.school_name}'s ${coach.division} team has come up a few times when I've talked to my club coach ` +
      `about programs that would push me — both competitively and in terms of team culture — so I wanted to ` +
      `get on your radar early rather than wait until closer to signing periods.\n\n` +
      `Happy to send the full video and stat sheet over whenever works for you, and to answer any questions ` +
      `about my availability for camps or visits this year.\n\nThank you for your consideration,\n[Your Name]`,
  }),
  (coach, lastName) => ({
    subject: `Prospective ${coach.division} recruit — quick intro`,
    body:
      `Hello Coach ${lastName},\n\n` +
      `My name is [Your Name] — I'm a [grad year] recruit currently rated [UTR] UTR / [WTN] WTN, and I'm in ` +
      `the early stages of building my list of target programs. ${coach.school_name} stood out because of how ` +
      `your ${coach.division} team has performed the last couple of seasons, and I wanted to introduce myself ` +
      `before things get busier closer to the signing period.\n\n` +
      `A bit about my game: I'd describe myself as a [playing style] player, and this season I went ` +
      `[singles record] in singles and [doubles record] in doubles. I'm still improving quickly, and I think ` +
      `I'd have real room to grow inside a program like yours.\n\n` +
      `If it's useful, I can send over my UTR Sports profile and a recent match video — just let me know what ` +
      `would help most at this stage of your evaluation.\n\nAppreciate your time,\n[Your Name]`,
  }),
  (coach, lastName) => ({
    subject: `Interested recruit — ${coach.school_name} (${coach.division})`,
    body:
      `Hi Coach ${lastName},\n\n` +
      `I'm [Your Name], a [grad year] tennis player based in [location], and I'm reaching out because ` +
      `${coach.school_name} has consistently been near the top of my list as I start narrowing down where I'd ` +
      `like to play at the next level.\n\n` +
      `Right now I'm sitting at a [UTR] UTR with a [singles record] singles record this season, and my club ` +
      `coach has been helping me sharpen a [playing style] game plan that I think matches how your ${coach.division} ` +
      `team likes to compete. I'm also carrying a [GPA] GPA, since I know academics matter just as much as the ` +
      `athletics side of this decision.\n\n` +
      `I'd love to learn more about the program — team culture, what you look for in recruits, and whether ` +
      `there might be a fit for me on your roster in the coming cycle. Happy to send over film or stats ` +
      `whenever helpful.\n\nThanks for considering me,\n[Your Name]`,
  }),
];

function sampleVariantIndex(email: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < email.length; i++) {
    hash ^= email.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return Math.abs(hash) % SAMPLE_VARIANTS.length;
}

function sampleDraftFor(coach: Coach): { subject: string; body: string } {
  const lastName = coach.coach_name.split(" ").pop() ?? "Coach";
  const variant = SAMPLE_VARIANTS[sampleVariantIndex(coach.email)];
  return variant(coach, lastName);
}

function outreachStatus(coach: CoachWithOutreach) {
  if (coach.outreach?.replied) return "replied";
  if (coach.outreach?.opened) return "opened";
  if (coach.outreach?.email_sent) return "sent";
  return null;
}

const DIV_LABELS: Record<string, string> = {
  all: "All",
  "NCAA Division I": "D1",
  "NCAA Division II": "D2",
  "NCAA Division III": "D3",
  NAIA: "NAIA",
  JUCO: "JUCO",
};

const DIV_ORDER: Record<string, number> = {
  "NCAA Division I": 0, D1: 0,
  "NCAA Division II": 1, D2: 1,
  "NCAA Division III": 2, D3: 2,
  NAIA: 3,
  JUCO: 4,
};

function divLabel(d: string) {
  return DIV_LABELS[d] ?? d;
}

export function ComposeClient({
  coaches,
  isSampleMode,
}: {
  coaches: CoachWithOutreach[];
  isSampleMode: boolean;
}) {
  const searchParams = useSearchParams();

  const initialEmails = useMemo(
    () =>
      new Set(
        (searchParams.get("coaches") ?? "")
          .split(",")
          .map((e) => decodeURIComponent(e.trim()))
          .filter(Boolean),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [selected, setSelected] = useState<Set<string>>(initialEmails);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [planLimitReached, setPlanLimitReached] = useState(false);
  const [search, setSearch] = useState("");
  const [division, setDivision] = useState(ALL);
  const [mobileTab, setMobileTab] = useState<"coaches" | "drafts">(
    initialEmails.size > 0 ? "drafts" : "coaches",
  );

  const divisions = useMemo(
    () => [...new Set(coaches.map((c) => c.division))].sort(),
    [coaches],
  );

  const sentCount = drafts.filter((d) => d.status === "sent" || d.status === "template").length;
  const allSent = drafts.length > 0 && sentCount === drafts.length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return coaches
      .filter((c) => {
        if (q && !`${c.coach_name} ${c.school_name}`.toLowerCase().includes(q)) return false;
        if (division !== ALL && c.division !== division) return false;
        return true;
      })
      .sort((a, b) => (DIV_ORDER[a.division ?? ""] ?? 9) - (DIV_ORDER[b.division ?? ""] ?? 9));
  }, [coaches, search, division]);

  const visible = filtered.slice(0, MAX_VISIBLE);

  const allVisibleSelected =
    visible.length > 0 && visible.every((c) => selected.has(c.email));
  const someVisibleSelected =
    visible.some((c) => selected.has(c.email)) && !allVisibleSelected;

  function toggleAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visible.forEach((c) => next.delete(c.email));
      } else {
        visible.forEach((c) => next.add(c.email));
        if (visible.length > 0) setMobileTab("drafts");
      }
      return next;
    });
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDrafts((prev) => {
      const prevMap = new Map(prev.map((d) => [d.coach.email, d]));
      return [...selected]
        .map((email) => {
          const coach = coaches.find((c) => c.email === email);
          if (!coach) return null;
          return prevMap.get(email) ?? { coach, subject: "", body: "", status: "idle" as Status };
        })
        .filter(Boolean) as Draft[];
    });
  }, [selected, coaches]);

  function toggleCoach(email: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
        setMobileTab("drafts");
      }
      return next;
    });
  }

  function updateDraft(email: string, patch: Partial<Draft>) {
    setDrafts((prev) =>
      prev.map((d) => (d.coach.email === email ? { ...d, ...patch } : d)),
    );
  }

  async function generate(email: string) {
    updateDraft(email, { status: "loading", error: undefined });
    const draft = drafts.find((d) => d.coach.email === email);
    if (!draft) return;

    if (isSampleMode) {
      await new Promise((r) => setTimeout(r, 600));
      updateDraft(email, { ...sampleDraftFor(draft.coach), status: "ready" });
      return;
    }

    try {
      const res = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachEmail: email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        updateDraft(email, { status: "error", error: data.error ?? "Generation failed" });
        return;
      }

      const subject = decodeURIComponent(res.headers.get("X-Draft-Subject") ?? "");
      if (subject) updateDraft(email, { subject });

      if (!res.body) {
        updateDraft(email, { status: "error", error: "Empty response" });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let body = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        body += decoder.decode(value, { stream: true });
        updateDraft(email, { body, status: "streaming" });
      }

      updateDraft(email, { status: "ready" });
    } catch {
      updateDraft(email, { status: "error", error: "Network error" });
    }
  }

  async function generateAll() {
    for (const draft of drafts) {
      if (draft.status === "idle" || draft.status === "error") {
        await generate(draft.coach.email);
      }
    }
  }

  async function sendAll() {
    for (const draft of drafts) {
      if (draft.subject && draft.body && draft.status !== "sent" && draft.status !== "sending") {
        await send(draft.coach.email);
      }
    }
  }

  async function send(email: string) {
    const draft = drafts.find((d) => d.coach.email === email);
    if (!draft) return;
    updateDraft(email, { status: "sending" });

    if (isSampleMode) {
      await new Promise((r) => setTimeout(r, 400));
      updateDraft(email, { status: "template" });
      return;
    }

    try {
      const res = await fetch("/api/outreach/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coach_email: email,
          subject: draft.subject,
          body: draft.body,
          ...(draft.scheduled_for ? { scheduled_for: draft.scheduled_for } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "PLAN_LIMIT_REACHED") setPlanLimitReached(true);
        updateDraft(email, { status: "error", error: data.error ?? "Send failed" });
        return;
      }
      updateDraft(email, { status: "sent" });
    } catch {
      updateDraft(email, { status: "error", error: "Network error" });
    }
  }

  return (
    <>
      <TourDemoCompose />
      <div className="flex flex-col gap-3 md:h-[calc(100dvh-172px)] md:flex-row md:gap-4">

        {/* Mobile tab switcher */}
        <div className="glass-card flex shrink-0 gap-1 p-1 md:hidden">
          <button
            onClick={() => setMobileTab("coaches")}
            className={cn(
              "flex-1 rounded-xl py-2 text-sm font-medium transition-smooth",
              mobileTab === "coaches"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground",
            )}
          >
            Coaches{selected.size > 0 && ` (${selected.size})`}
          </button>
          <button
            onClick={() => setMobileTab("drafts")}
            className={cn(
              "flex-1 rounded-xl py-2 text-sm font-medium transition-smooth",
              mobileTab === "drafts"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground",
            )}
          >
            Drafts{drafts.length > 0 && ` (${drafts.length})`}
          </button>
        </div>

        {/* ── LEFT: Coach selector ─────────────────────────── */}
        <div
          className={cn(
            "glass-card h-[calc(100dvh-320px)] w-full flex-col overflow-hidden md:h-auto md:w-72 md:shrink-0 md:flex",
            mobileTab === "coaches" ? "flex" : "hidden",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Coaches</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums transition-smooth",
                  selected.size > 0
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {selected.size}
              </span>
            </div>
            {selected.size > 0 && (
              <button
                onClick={() => setSelected(new Set())}
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] text-muted-foreground transition-smooth hover:text-foreground"
                title="Clear all selections"
              >
                <X className="size-3" />
                Clear
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-2 border-b border-border p-3">
            <Input
              placeholder="Search by name, school, or region…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 text-sm"
            />
            {/* Division pills */}
            <div className="flex flex-wrap gap-1">
              {[ALL, ...divisions].map((d) => (
                <button
                  key={d}
                  onClick={() => setDivision(d ?? ALL)}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-smooth",
                    division === d
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  {divLabel(d ?? ALL)}
                </button>
              ))}
            </div>
            {/* Filter summary */}
            <p className="text-[11px] text-muted-foreground">
              {filtered.length === coaches.length
                ? `${coaches.length.toLocaleString()} coaches`
                : `${filtered.length.toLocaleString()} of ${coaches.length.toLocaleString()} coaches`}
              {filtered.length > MAX_VISIBLE && ` · showing first ${MAX_VISIBLE}`}
            </p>
          </div>

          {/* Select-all row */}
          {visible.length > 0 && (
            <label className="flex cursor-pointer items-center gap-3 border-b border-border/60 bg-muted/30 px-4 py-2 hover:bg-muted/50">
              <Checkbox
                checked={someVisibleSelected ? undefined : allVisibleSelected}
                onCheckedChange={toggleAllVisible}
                className="shrink-0"
              />
              <span className="text-[11px] text-muted-foreground">
                {allVisibleSelected ? "Deselect" : "Select"} all {visible.length} visible
              </span>
            </label>
          )}

          {/* Coach list */}
          <div className="flex-1 overflow-y-auto">
            {visible.map((coach) => {
              const isSelected = selected.has(coach.email);
              const status = outreachStatus(coach);
              return (
                <label
                  key={coach.email}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 border-b border-border/40 px-4 py-3.5 transition-smooth last:border-0",
                    isSelected
                      ? "bg-primary/10 hover:bg-primary/10"
                      : "hover:bg-muted/40",
                  )}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleCoach(coach.email)}
                    className="mt-0.5 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-tight">{coach.coach_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{coach.school_name}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {divLabel(coach.division ?? "")}
                      </span>
                      {status === "replied" && (
                        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          Replied
                        </span>
                      )}
                      {status === "opened" && (
                        <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                          Opened
                        </span>
                      )}
                      {status === "sent" && (
                        <span className="rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                          Sent
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              );
            })}
            {filtered.length > MAX_VISIBLE && (
              <p className="p-3 text-center text-xs text-muted-foreground">
                Refine your search to see more coaches
              </p>
            )}
            {filtered.length === 0 && (
              <p className="p-6 text-center text-xs text-muted-foreground">No coaches match.</p>
            )}
          </div>
        </div>

        {/* ── RIGHT: Draft panel ───────────────────────────── */}
        <div
          className={cn(
            "flex-1 flex-col gap-4 overflow-y-auto pb-2 md:flex",
            mobileTab === "drafts" ? "flex" : "hidden",
          )}
        >
          {drafts.length === 0 ? (
            /* ── Empty state ── */
            <div className="glass-card flex flex-1 flex-col items-center justify-center gap-6 rounded-2xl p-8 sm:p-10 text-center">

              {/* Workflow steps — step 1 active */}
              <div className="flex items-center gap-1">
                {(["Select", "AI Draft", "Edit", "Send"] as const).map((step, i) => (
                  <div key={step} className="flex items-center gap-1">
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={cn(
                          "flex size-7 items-center justify-center rounded-full text-[11px] font-bold tabular-nums transition-smooth",
                          i === 0
                            ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                            : "bg-muted text-muted-foreground/40",
                        )}
                      >
                        {i + 1}
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-medium",
                          i === 0 ? "text-primary" : "text-muted-foreground/35",
                        )}
                      >
                        {step}
                      </span>
                    </div>
                    {i < 3 && (
                      <ChevronRight className="mb-4 size-3.5 shrink-0 text-muted-foreground/20" />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-1.5">
                <p className="text-base font-semibold">Select coaches to get started</p>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Choose coaches from the{" "}
                  <span className="font-medium text-foreground/70 md:hidden">Coaches tab</span>
                  <span className="hidden font-medium text-foreground/70 md:inline">list on the left</span>
                  {" "}— AI drafts a personalized email for each one in seconds.
                </p>
              </div>

              {/* Sample email preview */}
              <div
                aria-hidden
                className="pointer-events-none w-full max-w-sm select-none rounded-xl border border-border bg-card p-4 text-left opacity-40"
              >
                <p className="mb-2 truncate text-[11px] font-semibold text-muted-foreground">
                  Duke University D1 — recruiting interest from a 2025 player
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">
                  Hi Coach Mitchell, my name is Alex and I&apos;m a 2025 tennis player currently
                  ranked around 450 nationally with a UTR of 12.5. I&apos;ve been following Duke&apos;s D1
                  program for a while and the level of competition your team plays at is exactly
                  what I&apos;m looking for at the next level…
                </p>
              </div>

              {/* Token hint */}
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {["[Your Name]", "[UTR]", "[grad year]"].map((t) => (
                  <code
                    key={t}
                    className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                  >
                    {t}
                  </code>
                ))}
                <span className="text-[11px] text-muted-foreground/50">auto-filled by AI</span>
              </div>
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground">
                  {isSampleMode && "Sample mode — Send won't deliver real email."}
                  {planLimitReached && (
                    <span className="text-destructive">
                      Free limit reached.{" "}
                      <a href="/paywall" className="underline">Upgrade →</a>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {drafts.length > 1 && sentCount > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${(sentCount / drafts.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {sentCount} of {drafts.length} sent
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {drafts.length} coach{drafts.length === 1 ? "" : "es"} selected
                    </span>
                  )}
                  <Button variant="outline" size="sm" onClick={generateAll}>
                    <Sparkles className="size-3.5" />
                    AI Draft all
                  </Button>
                  <Button size="sm" onClick={sendAll} disabled={allSent}>
                    <Send className="size-3.5" />
                    Send all
                  </Button>
                </div>
              </div>

              {/* All-sent celebration */}
              {allSent && (
                <div className="animate-in fade-in-0 zoom-in-95 glass-card flex items-center justify-between gap-4 rounded-2xl border-primary/40 p-4 duration-300">
                  <div className="flex items-center gap-3">
                    <PartyPopper className="size-5 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-semibold">
                        {drafts.length === 1 ? "Email sent!" : `All ${drafts.length} emails sent!`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Coaches usually reply within a few days — you&apos;ll see opens and replies on your dashboard.
                      </p>
                    </div>
                  </div>
                  <Link href="/dashboard" className={buttonVariants({ variant: "outline", size: "sm" })}>
                    View dashboard →
                  </Link>
                </div>
              )}

              {/* Draft cards */}
              {drafts.map((draft) => (
                <GlassCard
                  key={draft.coach.email}
                  className={cn(
                    "shrink-0",
                    draft.status === "sent" && "border-[#7d9159]/40 opacity-80",
                  )}
                >
                  <GlassCardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <GlassCardTitle className="truncate">{draft.coach.coach_name}</GlassCardTitle>
                        <div className="mt-0.5 flex items-center gap-2">
                          <p className="truncate text-xs text-muted-foreground">
                            {draft.coach.school_name}
                          </p>
                          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {divLabel(draft.coach.division ?? "")}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <StatusLabel status={draft.status} />
                        <button
                          onClick={() => toggleCoach(draft.coach.email)}
                          className="rounded-full p-1 text-muted-foreground transition-smooth hover:text-foreground"
                          title="Remove"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </GlassCardHeader>

                  <GlassCardContent className="flex flex-col gap-4">
                    {/* Demo template preview — replaces edit fields when "sent" in sample mode */}
                    {draft.status === "template" ? (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/8 px-4 py-3">
                          <span className="mt-0.5 shrink-0 text-base">⚠️</span>
                          <div className="flex flex-col gap-0.5">
                            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                              This is a demo preview — real emails don&apos;t look like this
                            </p>
                            <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
                              When you send for real, your email lands in the coach&apos;s inbox as a normal email — no banners, no templates, just your message.{" "}
                              <a href="/auth" className="font-semibold underline">Sign up free →</a>
                            </p>
                          </div>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/30 px-4 py-4">
                          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            To: {draft.coach.coach_name} · {draft.coach.school_name}
                          </p>
                          <p className="mb-3 text-sm font-semibold">{draft.subject || "(no subject)"}</p>
                          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/80">
                            {draft.body || "(empty)"}
                          </pre>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateDraft(draft.coach.email, { status: "ready" })}
                          className="self-start text-xs text-muted-foreground underline hover:text-foreground"
                        >
                          ← Back to editing
                        </button>
                      </div>
                    ) : (
                    <>
                    {/* Subject field */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Subject
                        </label>
                        <span
                          className={cn(
                            "text-[11px] tabular-nums",
                            draft.subject.length > 80
                              ? "text-amber-500"
                              : "text-muted-foreground/40",
                          )}
                        >
                          {draft.subject.length}/100
                        </span>
                      </div>
                      <Input
                        placeholder="What's your email about?"
                        value={draft.subject}
                        onChange={(e) => updateDraft(draft.coach.email, { subject: e.target.value })}
                      />
                    </div>

                    {/* Body field */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Email body
                        </label>
                        <span
                          className={cn(
                            "text-[11px] tabular-nums",
                            draft.body.length > 0 && draft.body.length < 50
                              ? "text-amber-500"
                              : "text-muted-foreground/40",
                          )}
                        >
                          {draft.body.length} chars
                          {draft.body.length > 0 && draft.body.length < 50 && " · too short"}
                        </span>
                      </div>
                      <Textarea
                        placeholder={
                          draft.status === "loading"
                            ? "Writing a personalized draft…"
                            : "Write your email here, or use AI Draft to generate a personalized intro."
                        }
                        rows={7}
                        value={draft.body}
                        onChange={(e) => updateDraft(draft.coach.email, { body: e.target.value })}
                        className={cn(
                          draft.status === "loading" && "animate-pulse bg-muted/40",
                          draft.status === "streaming" && "opacity-80",
                        )}
                        disabled={draft.status === "loading" || draft.status === "streaming"}
                      />
                      {draft.error && (
                        <p className="text-xs text-destructive">{draft.error}</p>
                      )}
                    </div>
                    </>
                    )}
                  </GlassCardContent>

                  {draft.status !== "template" && <GlassCardFooter className="flex flex-col gap-3 bg-transparent">
                    {/* Schedule picker */}
                    <SchedulePicker
                      value={draft.scheduled_for ?? ""}
                      onChange={(v) => updateDraft(draft.coach.email, { scheduled_for: v || undefined })}
                      disabled={draft.status === "sent" || draft.status === "sending"}
                    />
                    <div className="flex items-center justify-between gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generate(draft.coach.email)}
                      disabled={
                        draft.status === "loading" ||
                        draft.status === "streaming" ||
                        draft.status === "sending"
                      }
                    >
                      <Sparkles className="size-3.5" />
                      {draft.status === "loading" || draft.status === "streaming"
                        ? "Generating…"
                        : "AI Draft"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => send(draft.coach.email)}
                      disabled={
                        !draft.subject ||
                        !draft.body ||
                        draft.status === "loading" ||
                        draft.status === "streaming" ||
                        draft.status === "sending" ||
                        draft.status === "sent"
                      }
                      className="gap-1.5"
                    >
                      {draft.scheduled_for ? <CalendarClock className="size-3.5" /> : <Send className="size-3.5" />}
                      {draft.status === "sending"
                        ? "Scheduling…"
                        : draft.status === "sent"
                          ? draft.scheduled_for ? "Scheduled ✓" : "Sent ✓"
                          : draft.scheduled_for ? "Schedule" : "Send"}
                    </Button>
                    </div>
                  </GlassCardFooter>}
                </GlassCard>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function StatusLabel({ status }: { status: Status }) {
  switch (status) {
    case "sent":      return <span className="text-xs font-medium text-primary">Sent ✓</span>;
    case "template":  return <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Demo preview</span>;
    case "sending":   return <span className="text-xs text-muted-foreground">Sending…</span>;
    case "ready":     return <span className="text-xs text-muted-foreground">Draft ready</span>;
    case "loading":   return <span className="text-xs text-muted-foreground">Generating…</span>;
    case "streaming": return <span className="text-xs text-muted-foreground">Writing…</span>;
    case "error":     return <span className="text-xs text-destructive">Error</span>;
    default:          return null;
  }
}

function SchedulePicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);

  // Build min datetime (now + 1 min) in local ISO for the input
  const minLocal = (() => {
    const d = new Date(Date.now() + 60_000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  })();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="flex items-center gap-1.5 self-start rounded-lg border border-border/60 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-40"
      >
        <CalendarClock className="size-3.5" />
        {value ? `Scheduled: ${new Date(value).toLocaleString()}` : "Schedule for later"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="datetime-local"
        min={minLocal}
        value={value ? new Date(value).toLocaleString("sv-SE", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(" ", "T") : ""}
        onChange={(e) => {
          // Convert local datetime-local value to UTC ISO string
          const local = new Date(e.target.value);
          onChange(isNaN(local.getTime()) ? "" : local.toISOString());
        }}
        className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        disabled={disabled}
      />
      {value && (
        <button
          type="button"
          onClick={() => { onChange(""); setOpen(false); }}
          className="text-xs text-muted-foreground hover:text-destructive"
        >
          Clear
        </button>
      )}
      <button
        type="button"
        onClick={() => { if (!value) setOpen(false); }}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        {value ? "Done" : "Cancel"}
      </button>
    </div>
  );
}
