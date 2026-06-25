"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Send, Sparkles } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSampleCoaches } from "@/lib/data/coaches";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  GlassCard,
  GlassCardContent,
  GlassCardFooter,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/glass-card";
import type { Coach } from "@/lib/types/coach";

type Status = "idle" | "loading" | "ready" | "sending" | "sent" | "error";

type Draft = {
  coach: Coach;
  subject: string;
  body: string;
  status: Status;
  error?: string;
};

const isSampleMode = !process.env.NEXT_PUBLIC_SUPABASE_URL;

function sampleDraftFor(coach: Coach): { subject: string; body: string } {
  return {
    subject: `Introduction from a prospective recruit — ${coach.school_name}`,
    body:
      `Hi Coach ${coach.coach_name.split(" ").pop()},\n\n` +
      `My name is [Your Name], a [grad year] tennis player interested in ${coach.school_name}'s ` +
      `${coach.division} program. I'd love to share my UTR, match record, and highlight video if ` +
      `you have a roster spot open.\n\n` +
      `Thanks for your time,\n[Your Name]`,
  };
}

export function ComposeClient() {
  const searchParams = useSearchParams();
  const coachEmails = (searchParams.get("coaches") ?? "")
    .split(",")
    .map((e) => decodeURIComponent(e.trim()))
    .filter(Boolean);

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loadingCoaches, setLoadingCoaches] = useState(coachEmails.length > 0);
  const [planLimitReached, setPlanLimitReached] = useState(false);

  useEffect(() => {
    if (coachEmails.length === 0) {
      return;
    }

    (async () => {
      let coaches: Coach[] = [];

      if (isSampleMode) {
        const all = getSampleCoaches();
        coaches = all.filter((c) => coachEmails.includes(c.email));
      } else {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase
          .from("coaches_database")
          .select("*")
          .in("email", coachEmails)
          .returns<Coach[]>();
        coaches = data ?? [];
      }

      setDrafts(
        coaches.map((coach) => ({ coach, subject: "", body: "", status: "idle" as Status }))
      );
      setLoadingCoaches(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateDraft(email: string, patch: Partial<Draft>) {
    setDrafts((prev) =>
      prev.map((d) => (d.coach.email === email ? { ...d, ...patch } : d))
    );
  }

  async function generate(email: string) {
    updateDraft(email, { status: "loading", error: undefined });
    const draft = drafts.find((d) => d.coach.email === email);
    if (!draft) return;

    if (isSampleMode) {
      await new Promise((r) => setTimeout(r, 600));
      const sample = sampleDraftFor(draft.coach);
      updateDraft(email, { ...sample, status: "ready" });
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
      await generate(draft.coach.email);
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
        body: JSON.stringify({
          coach_email: email,
          subject: draft.subject,
          body: draft.body,
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

  if (loadingCoaches) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        Loading coaches…
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <GlassCard>
        <GlassCardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No coaches selected. Pick coaches from the Coaches page to start composing.
          </p>
          <Link href="/coaches" className={buttonVariants({ variant: "default" })}>
            Browse coaches
          </Link>
        </GlassCardContent>
      </GlassCard>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {isSampleMode && (
        <p className="text-sm text-muted-foreground">
          Sample mode — drafts are generated locally and Send doesn&apos;t deliver real email.
        </p>
      )}

      {planLimitReached && (
        <GlassCard className="border-destructive/30">
          <GlassCardContent className="text-sm text-destructive">
            You&apos;ve used all 5 free emails. Upgrade to Pro or Elite to send more.
          </GlassCardContent>
        </GlassCard>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={generateAll}>
          <Sparkles className="size-4" />
          Generate all drafts
        </Button>
      </div>

      {drafts.map((draft) => (
        <GlassCard key={draft.coach.email}>
          <GlassCardHeader>
            <div className="flex items-center justify-between">
              <GlassCardTitle>
                {draft.coach.coach_name} — {draft.coach.school_name}
              </GlassCardTitle>
              <StatusBadge status={draft.status} />
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
            {draft.error && <p className="text-sm text-destructive">{draft.error}</p>}
          </GlassCardContent>
          <GlassCardFooter className="flex justify-between bg-transparent">
            <Button
              variant="ghost"
              onClick={() => generate(draft.coach.email)}
              disabled={draft.status === "loading" || draft.status === "sending"}
            >
              <Sparkles className="size-4" />
              {draft.status === "loading" ? "Generating…" : "Generate"}
            </Button>
            <Button
              onClick={() => send(draft.coach.email)}
              disabled={
                !draft.subject ||
                !draft.body ||
                draft.status === "sending" ||
                draft.status === "sent"
              }
            >
              <Send className="size-4" />
              {draft.status === "sending"
                ? "Sending…"
                : draft.status === "sent"
                  ? "Sent"
                  : "Send"}
            </Button>
          </GlassCardFooter>
        </GlassCard>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  switch (status) {
    case "sent":
      return <Badge>Sent</Badge>;
    case "sending":
      return <Badge variant="secondary">Sending…</Badge>;
    case "ready":
      return <Badge variant="secondary">Draft ready</Badge>;
    case "loading":
      return <Badge variant="secondary">Generating…</Badge>;
    case "error":
      return <Badge variant="destructive">Error</Badge>;
    default:
      return <Badge variant="outline">Not drafted</Badge>;
  }
}
