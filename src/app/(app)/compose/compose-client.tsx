"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PartyPopper, PenSquare, Send, Sparkles, X } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type Status = "idle" | "loading" | "streaming" | "ready" | "sending" | "sent" | "error";

type Draft = {
  coach: Coach;
  subject: string;
  body: string;
  status: Status;
  error?: string;
};

const ALL = "all";
const MAX_VISIBLE = 100;

// Five distinct, full-length variants so the demo doesn't look like the same
// email copy-pasted to every coach — each leads with a different angle
// (competitive results, academics, film, program fit, recruiting timeline).
// Picked deterministically per coach (stable across re-generates for the
// same coach, varied across different coaches) via a simple string hash.
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

// FNV-1a, not a plain "hash*31+c" accumulator — with 5 variants, a
// multiplier of 31 (≡ 1 mod 5) makes the multiply step contribute nothing to
// the result mod 5, so nearly every sample email clustered onto the same
// variant instead of spreading across all five.
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

  const sentCount = drafts.filter((d) => d.status === "sent").length;
  const allSent = drafts.length > 0 && sentCount === drafts.length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return coaches.filter((c) => {
      if (q && !`${c.coach_name} ${c.school_name}`.toLowerCase().includes(q)) return false;
      if (division !== ALL && c.division !== division) return false;
      return true;
    });
  }, [coaches, search, division]);

  const visible = filtered.slice(0, MAX_VISIBLE);

  useEffect(() => {
    // Sync drafts to the selected-coach set while preserving in-progress edits
    // for coaches that stay selected — not expressible as a pure render-time
    // derivation since draft.subject/body are independently user-editable.
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

      // Subject arrives instantly via header — no need to wait for the body stream
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
      await new Promise((r) => setTimeout(r, 500));
      updateDraft(email, { status: "sent" });
      return;
    }

    try {
      const res = await fetch("/api/outreach/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coach_email: email, subject: draft.subject, body: draft.body }),
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
          <span className="text-sm font-semibold">
            Coaches
            {filtered.length !== coaches.length && (
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                ({filtered.length})
              </span>
            )}
          </span>
          {selected.size > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                {selected.size}
              </span>
              <button
                onClick={() => setSelected(new Set())}
                className="rounded-full p-0.5 text-muted-foreground transition-smooth hover:text-foreground"
                title="Clear selection"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2 border-b border-border p-3">
          <Input
            placeholder="Search coach or school…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
          />
          <Select
            items={{ [ALL]: "All divisions", ...Object.fromEntries(divisions.map((d) => [d, d])) }}
            value={division}
            onValueChange={(v) => setDivision(v ?? ALL)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Division" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All divisions</SelectItem>
              {divisions.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Coach list */}
        <div className="flex-1 overflow-y-auto">
          {visible.map((coach) => {
            const isSelected = selected.has(coach.email);
            const status = outreachStatus(coach);
            return (
              <label
                key={coach.email}
                className={cn(
                  "flex cursor-pointer items-start gap-3 border-b border-border/40 px-4 py-3 transition-smooth last:border-0 hover:bg-muted/40",
                  isSelected && "bg-primary/5",
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
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {coach.division}
                    </span>
                    {status === "replied" && <span className="size-1.5 shrink-0 rounded-full bg-[var(--chart-1)]" />}
                    {status === "opened"  && <span className="size-1.5 shrink-0 rounded-full bg-orange-400" />}
                    {status === "sent"    && <span className="size-1.5 shrink-0 rounded-full bg-amber-400" />}
                  </div>
                </div>
              </label>
            );
          })}
          {filtered.length > MAX_VISIBLE && (
            <p className="p-3 text-center text-xs text-muted-foreground">
              Showing {MAX_VISIBLE} of {filtered.length} — refine your search
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
          <div className="glass-card flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl p-12 text-center">
            <PenSquare className="size-8 text-muted-foreground/40" />
            <p className="font-medium">No coaches selected</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Check coaches in the left panel to start drafting personalized emails.
            </p>
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
                {/* Goal-gradient: show momentum on multi-coach sends */}
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
                    {drafts.length} coach{drafts.length === 1 ? "" : "es"}
                  </span>
                )}
                <Button variant="outline" size="sm" onClick={generateAll}>
                  <Sparkles className="size-3.5" />
                  Generate all
                </Button>
                <Button size="sm" onClick={sendAll} disabled={allSent}>
                  <Send className="size-3.5" />
                  Send all
                </Button>
              </div>
            </div>

            {/* Peak-end: celebrate when every selected email is out the door */}
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
                // Without shrink-0, these cards are flex children of a
                // fixed-height, overflow-y-auto column — flexbox's default
                // flex-shrink: 1 squishes every card to fit the viewport
                // instead of letting the column scroll, and each card's own
                // overflow-hidden then clips the body Textarea and the
                // Generate/Send footer right off (no way to send).
                className={cn(
                  "shrink-0",
                  draft.status === "sent" && "border-[#7d9159]/40 opacity-80",
                )}
              >
                <GlassCardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <GlassCardTitle className="truncate">{draft.coach.coach_name}</GlassCardTitle>
                      <p className="truncate text-xs text-muted-foreground">
                        {draft.coach.school_name} · {draft.coach.division}
                      </p>
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
                <GlassCardContent className="flex flex-col gap-3">
                  <Input
                    placeholder="Subject"
                    value={draft.subject}
                    onChange={(e) => updateDraft(draft.coach.email, { subject: e.target.value })}
                  />
                  <Textarea
                    placeholder={draft.status === "loading" ? "Writing a personalized draft…" : "Email body"}
                    rows={6}
                    value={draft.body}
                    onChange={(e) => updateDraft(draft.coach.email, { body: e.target.value })}
                    className={cn(
                      draft.status === "loading" && "animate-pulse bg-muted/40",
                      draft.status === "streaming" && "opacity-80",
                    )}
                    disabled={draft.status === "loading" || draft.status === "streaming"}
                  />
                  {draft.error && <p className="text-xs text-destructive">{draft.error}</p>}
                </GlassCardContent>
                <GlassCardFooter className="flex justify-between bg-transparent">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => generate(draft.coach.email)}
                    disabled={draft.status === "loading" || draft.status === "streaming" || draft.status === "sending"}
                  >
                    <Sparkles className="size-3.5" />
                    {draft.status === "loading" || draft.status === "streaming" ? "Generating…" : "Generate"}
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
                  >
                    <Send className="size-3.5" />
                    {draft.status === "sending"
                      ? "Sending…"
                      : draft.status === "sent"
                        ? "Sent ✓"
                        : "Send"}
                  </Button>
                </GlassCardFooter>
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
    case "sending":   return <span className="text-xs text-muted-foreground">Sending…</span>;
    case "ready":     return <span className="text-xs text-muted-foreground">Draft ready</span>;
    case "loading":   return <span className="text-xs text-muted-foreground">Generating…</span>;
    case "streaming": return <span className="text-xs text-muted-foreground">Writing…</span>;
    case "error":     return <span className="text-xs text-destructive">Error</span>;
    default:        return null;
  }
}
