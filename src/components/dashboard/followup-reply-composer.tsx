"use client";

import { useState } from "react";
import { Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const isSampleMode = !process.env.NEXT_PUBLIC_SUPABASE_URL;

type Status = "idle" | "generating" | "streaming" | "ready" | "sending" | "sent" | "error";
type Mode = "reply" | "nudge";

const SAMPLE_REPLY =
  "Thanks so much for getting back to me! I've attached my highlight reel and can send over " +
  "my fall tournament schedule as well — happy to answer any other questions about my game.";

const SAMPLE_NUDGE =
  "I wanted to follow up in case my last email got buried — I'm still very interested in the " +
  "program and happy to send over anything else that would help, like updated match footage.";

const MODE_COPY: Record<Mode, { trigger: string; drafting: string; sentLabel: string }> = {
  reply: {
    trigger: "Reply with AI",
    drafting: "Drafting a reply that continues the conversation…",
    sentLabel: "Reply sent — it'll land in the same conversation.",
  },
  nudge: {
    trigger: "Draft follow-up",
    drafting: "Drafting a brief, low-pressure follow-up…",
    sentLabel: "Follow-up sent — it'll land in the same conversation.",
  },
};

/**
 * AI-assisted message that continues the same email thread: sending here
 * hits the same /api/outreach/send route keyed by coach_email, which
 * reuses the existing outreach row (and its reply+<id>@ Reply-To address),
 * so the coach sees it land in the same conversation rather than a new one.
 *
 * Two modes: "reply" responds to something the coach actually said
 * (/api/ai/followup); "nudge" is a polite bump for a coach who hasn't
 * replied yet (/api/ai/nudge) — different prompts, same UI.
 */
export function FollowUpReplyComposer({
  outreachId,
  coachEmail,
  mode = "reply",
}: {
  outreachId: string;
  coachEmail: string;
  mode?: Mode;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const copy = MODE_COPY[mode];
  const endpoint = mode === "nudge" ? "/api/ai/nudge" : "/api/ai/followup";

  async function generate() {
    setStatus("generating");
    setError(null);

    if (isSampleMode) {
      await new Promise((r) => setTimeout(r, 500));
      setSubject("Re: Introduction from a prospective recruit");
      setBody(mode === "nudge" ? SAMPLE_NUDGE : SAMPLE_REPLY);
      setStatus("ready");
      return;
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outreachId }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't draft a message");
      setStatus("error");
      return;
    }

    // Subject arrives immediately via header
    const subject = decodeURIComponent(res.headers.get("X-Draft-Subject") ?? "");
    if (subject) setSubject(subject);

    if (!res.body) {
      setError("Empty response");
      setStatus("error");
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let streamedBody = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      streamedBody += decoder.decode(value, { stream: true });
      setBody(streamedBody);
      setStatus("streaming");
    }

    setStatus("ready");
  }

  async function send() {
    setStatus("sending");
    setError(null);

    if (isSampleMode) {
      await new Promise((r) => setTimeout(r, 500));
      setStatus("sent");
      return;
    }

    const res = await fetch("/api/outreach/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coach_email: coachEmail, subject, body }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Send failed");
      setStatus("error");
      return;
    }

    setStatus("sent");
  }

  if (!expanded) {
    return (
      <Button variant="outline" size="sm" onClick={() => { setExpanded(true); generate(); }}>
        <Sparkles className="size-3.5" />
        {copy.trigger}
      </Button>
    );
  }

  if (status === "sent") {
    return <p className="text-sm font-medium text-[#7d9159]">{copy.sentLabel}</p>;
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 p-3">
      <Input
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        disabled={status === "generating" || status === "streaming"}
      />
      <Textarea
        placeholder={status === "generating" ? copy.drafting : "Message"}
        rows={5}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        disabled={status === "generating" || status === "streaming"}
        className={
          status === "generating"
            ? "animate-pulse bg-muted/40"
            : status === "streaming"
              ? "opacity-80"
              : undefined
        }
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={generate} disabled={status === "generating" || status === "streaming" || status === "sending"}>
          <Sparkles className="size-3.5" />
          {status === "generating" || status === "streaming" ? "Drafting…" : "Regenerate"}
        </Button>
        <Button
          size="sm"
          onClick={send}
          disabled={!subject || !body || status === "generating" || status === "streaming" || status === "sending"}
        >
          <Send className="size-3.5" />
          {status === "sending" ? "Sending…" : mode === "nudge" ? "Send follow-up" : "Send reply"}
        </Button>
      </div>
    </div>
  );
}
