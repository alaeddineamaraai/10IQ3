"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PenSquare, Send, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import type { Coach, CoachWithOutreach } from "@/lib/types/coach";

type Status = "idle" | "loading" | "ready" | "sending" | "sent" | "error";

type Draft = {
  coach: Coach;
  subject: string;
  body: string;
  status: Status;
  error?: string;
};

const isSampleMode = !process.env.NEXT_PUBLIC_SUPABASE_URL;
const ALL = "all";
const MAX_VISIBLE = 100;

function sampleDraftFor(coach: Coach): { subject: string; body: string } {
  return {
    subject: `Introduction from a prospective recruit — ${coach.school_name}`,
    body:
      `Hi Coach ${coach.coach_name.split(" ").pop()},\n\n` +
      `My name is [Your Name], a [grad year] tennis player interested in ${coach.school_name}'s ` +
      `${coach.division} program. I'd love to share my UTR, match record, and highlight video ` +
      `if you have a roster spot open.\n\nThanks for your time,\n[Your Name]`,
  };
}

function outreachStatus(coach: CoachWithOutreach) {
  if (coach.outreach?.replied) return "replied";
  if (coach.outreach?.opened) return "opened";
  if (coach.outreach?.email_sent) return "sent";
  return null;
}

export function ComposeClient({ coaches }: { coaches: CoachWithOutreach[] }) {
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
      const data = await res.json();
      if (!res.ok) {
        updateDraft(email, { status: "error", error: data.error ?? "Generation failed" });
        return;
      }
      updateDraft(email, { subject: data.subject, body: data.body, status: "ready" });
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
    <div className="flex flex-col gap-3 md:h-[calc(100vh-172px)] md:flex-row md:gap-4">

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
          "glass-card h-[calc(100vh-260px)] w-full flex-col overflow-hidden md:h-auto md:w-72 md:shrink-0 md:flex",
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
                    {status === "replied" && <span className="size-1.5 shrink-0 rounded-full bg-green-500" />}
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
                <span className="text-xs text-muted-foreground">
                  {drafts.length} coach{drafts.length === 1 ? "" : "es"}
                </span>
                <Button variant="outline" size="sm" onClick={generateAll}>
                  <Sparkles className="size-3.5" />
                  Generate all
                </Button>
              </div>
            </div>

            {/* Draft cards */}
            {drafts.map((draft) => (
              <GlassCard key={draft.coach.email}>
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
                    placeholder="Email body"
                    rows={6}
                    value={draft.body}
                    onChange={(e) => updateDraft(draft.coach.email, { body: e.target.value })}
                  />
                  {draft.error && <p className="text-xs text-destructive">{draft.error}</p>}
                </GlassCardContent>
                <GlassCardFooter className="flex justify-between bg-transparent">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => generate(draft.coach.email)}
                    disabled={draft.status === "loading" || draft.status === "sending"}
                  >
                    <Sparkles className="size-3.5" />
                    {draft.status === "loading" ? "Generating…" : "Generate"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => send(draft.coach.email)}
                    disabled={
                      !draft.subject ||
                      !draft.body ||
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
  );
}

function StatusLabel({ status }: { status: Status }) {
  switch (status) {
    case "sent":    return <span className="text-xs font-medium text-green-500">Sent ✓</span>;
    case "sending": return <span className="text-xs text-muted-foreground">Sending…</span>;
    case "ready":   return <span className="text-xs text-muted-foreground">Draft ready</span>;
    case "loading": return <span className="text-xs text-muted-foreground">Generating…</span>;
    case "error":   return <span className="text-xs text-destructive">Error</span>;
    default:        return null;
  }
}
