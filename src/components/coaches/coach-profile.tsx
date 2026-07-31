"use client";

import { useState } from "react";
import Link from "next/link";
import { Send, Eye, MessageSquare, Mail, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/glass-card";
import { FollowUpReplyComposer } from "@/components/dashboard/followup-reply-composer";
import type { CoachProfile, Outreach, OutreachReply } from "@/lib/types/coach";

// ─── Helpers ───────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function timeDelta(from: string, to: string): string {
  const ms = new Date(to).getTime() - new Date(from).getTime();
  if (ms <= 0) return "";
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return "less than a minute later";
  if (minutes < 60) return `${minutes}m later`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h later`;
  const days = Math.round(hours / 24);
  return `${days}d later`;
}

type StatusInfo = { text: string; bg: string; color: string };

function getStatusInfo(outreach: CoachProfile["outreach"]): StatusInfo {
  if (outreach?.replied) {
    return { text: "Replied", bg: "color-mix(in srgb, var(--chart-1) 13%, transparent)", color: "var(--chart-1)" };
  }
  if (outreach?.opened) {
    return { text: "Opened", bg: "color-mix(in srgb, var(--chart-4) 13%, transparent)", color: "var(--chart-4)" };
  }
  if (outreach?.email_sent) {
    return { text: "Sent", bg: "color-mix(in srgb, var(--chart-5) 13%, transparent)", color: "var(--chart-5)" };
  }
  return { text: "Not contacted", bg: "var(--muted)", color: "var(--muted-foreground)" };
}

// ─── Timeline event types ───────────────────────────────────────────────────

type SentEvent = {
  kind: "sent";
  sentAt: string;
  subject: string | null;
  body: string | null;
};

type OpenedEvent = {
  kind: "opened";
  openedAt: string;
  sentAt: string | null;
};

type ReplyEvent = {
  kind: "reply";
  reply: OutreachReply;
  sentAt: string | null;
};

type TimelineEvent = SentEvent | OpenedEvent | ReplyEvent;

function buildEvents(outreach: Outreach & { replies: OutreachReply[] }): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  if (outreach.email_sent && outreach.sent_at) {
    events.push({
      kind: "sent",
      sentAt: outreach.sent_at,
      subject: outreach.subject,
      body: outreach.body,
    });
  }

  if (outreach.opened && outreach.opened_at) {
    events.push({
      kind: "opened",
      openedAt: outreach.opened_at,
      sentAt: outreach.sent_at,
    });
  }

  for (const reply of outreach.replies) {
    events.push({ kind: "reply", reply, sentAt: outreach.sent_at });
  }

  return events;
}

// ─── Dot styles per event kind ──────────────────────────────────────────────

const DOT_STYLES = {
  sent:   { bg: "color-mix(in srgb, var(--chart-5) 13%, transparent)", color: "var(--chart-5)" },
  opened: { bg: "color-mix(in srgb, var(--chart-4) 13%, transparent)", color: "var(--chart-4)" },
  reply:  { bg: "color-mix(in srgb, var(--chart-1) 13%, transparent)", color: "var(--chart-1)" },
};

// ─── BodyBlock — expandable text ────────────────────────────────────────────

function BodyBlock({
  body,
  toggleKey,
  expanded,
  onToggle,
  expandLabel,
}: {
  body: string;
  toggleKey: string;
  expanded: boolean;
  onToggle: (key: string) => void;
  expandLabel: string;
}) {
  return (
    <div className="mt-2 rounded-xl bg-muted/20 p-3">
      <p
        className={cn(
          "whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground transition-smooth",
          !expanded && "line-clamp-4"
        )}
      >
        {body}
      </p>
      <button
        onClick={() => onToggle(toggleKey)}
        className="mt-1.5 text-xs text-muted-foreground transition-smooth hover:text-foreground"
      >
        {expanded ? "Show less" : expandLabel}
      </button>
    </div>
  );
}

// ─── Timeline dot + line wrapper ────────────────────────────────────────────

function TimelineDot({
  dotBg,
  dotColor,
  isLast,
  children,
}: {
  dotBg: string;
  dotColor: string;
  isLast: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-full"
          style={{ background: dotBg, color: dotColor }}
        >
          {children}
        </div>
        {!isLast && <div className="mt-1 w-px flex-1 bg-border/50" />}
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function CoachProfileView({
  profile,
  isSample: _isSample,
}: {
  profile: CoachProfile;
  isSample: boolean;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function toggleExpanded(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const statusInfo = getStatusInfo(profile.outreach);
  const events = profile.outreach ? buildEvents(profile.outreach) : [];
  const totalEvents = events.length;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">{profile.coach_name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">{profile.school_name}</span>
            <Badge variant="secondary">{profile.division}</Badge>
          </div>
          {(profile.team_utr != null || profile.team_wtn != null || profile.region) && (
            <div className="mt-1 flex flex-wrap gap-2">
              {profile.team_utr != null && (
                <span className="rounded-full bg-muted/40 px-3 py-1 text-xs text-foreground/80">
                  UTR {profile.team_utr.toFixed(1)}
                </span>
              )}
              {profile.team_wtn != null && (
                <span className="rounded-full bg-muted/40 px-3 py-1 text-xs text-foreground/80">
                  WTN {profile.team_wtn.toFixed(1)}
                </span>
              )}
              {profile.region && (
                <span className="rounded-full bg-muted/40 px-3 py-1 text-xs text-foreground/80">
                  {profile.region}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span
            className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ background: statusInfo.bg, color: statusInfo.color }}
          >
            {statusInfo.text}
          </span>
          <Link
            href={`/compose?coaches=${encodeURIComponent(profile.email)}`}
            className={buttonVariants({ size: "sm" })}
          >
            <Mail className="size-3.5" />
            Compose
          </Link>
        </div>
      </div>

      {/* ── Correspondence timeline ── */}
      <GlassCard>
        <GlassCardHeader>
          <div className="flex items-center gap-2.5">
            <GlassCardTitle>Correspondence</GlassCardTitle>
            {totalEvents > 0 && (
              <span className="rounded-full bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
                {totalEvents} event{totalEvents !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </GlassCardHeader>

        <GlassCardContent>
          {!profile.outreach ? (
            /* Empty state */
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted/40">
                <Mail className="size-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-medium">No correspondence yet</p>
                <p className="text-sm text-muted-foreground">
                  Send your first email to start a conversation with this coach.
                </p>
              </div>
              <Link
                href={`/compose?coaches=${encodeURIComponent(profile.email)}`}
                className={buttonVariants({ size: "sm" })}
              >
                <Mail className="size-3.5" />
                Compose email
              </Link>
            </div>
          ) : (
            <div className="flex flex-col">
              {events.map((event) => {
                // The composer always follows all events, so no event is truly
                // the last visual item — keep the connecting line on every one.
                const isLast = false;

                if (event.kind === "sent") {
                  const key = "sent";
                  const isExpanded = expanded[key] ?? false;
                  const dot = DOT_STYLES.sent;
                  return (
                    <div key={key} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className="flex size-8 shrink-0 items-center justify-center rounded-full"
                          style={{ background: dot.bg, color: dot.color }}
                        >
                          <Send className="size-3.5" />
                        </div>
                        {!isLast && <div className="mt-1 w-px flex-1 bg-border/50" />}
                      </div>
                      <div className="min-w-0 flex-1 pb-6">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-sm font-medium">Email sent</span>
                          <span className="text-xs text-muted-foreground">{fmtDate(event.sentAt)}</span>
                        </div>
                        {event.subject && (
                          <p className="mt-1 text-sm font-semibold">{event.subject}</p>
                        )}
                        {event.body ? (
                          <BodyBlock
                            body={event.body}
                            toggleKey={key}
                            expanded={isExpanded}
                            onToggle={toggleExpanded}
                            expandLabel="Show full email"
                          />
                        ) : null}
                      </div>
                    </div>
                  );
                }

                if (event.kind === "opened") {
                  const dot = DOT_STYLES.opened;
                  return (
                    <div key="opened" className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className="flex size-8 shrink-0 items-center justify-center rounded-full"
                          style={{ background: dot.bg, color: dot.color }}
                        >
                          <Eye className="size-3.5" />
                        </div>
                        {!isLast && <div className="mt-1 w-px flex-1 bg-border/50" />}
                      </div>
                      <div className="min-w-0 flex-1 pb-6">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-sm font-medium">Coach opened</span>
                          <span className="text-xs text-muted-foreground">{fmtDate(event.openedAt)}</span>
                        </div>
                        {event.sentAt && timeDelta(event.sentAt, event.openedAt) && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {timeDelta(event.sentAt, event.openedAt)} after sending
                          </p>
                        )}
                      </div>
                    </div>
                  );
                }

                if (event.kind === "reply") {
                  const key = `reply-${event.reply.id}`;
                  const isExpanded = expanded[key] ?? false;
                  const dot = DOT_STYLES.reply;
                  return (
                    <div key={key} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className="flex size-8 shrink-0 items-center justify-center rounded-full"
                          style={{ background: dot.bg, color: dot.color }}
                        >
                          <MessageSquare className="size-3.5" />
                        </div>
                        {!isLast && <div className="mt-1 w-px flex-1 bg-border/50" />}
                      </div>
                      <div className="min-w-0 flex-1 pb-6">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-sm font-medium">Coach replied</span>
                          <span className="text-xs text-muted-foreground">
                            {fmtDate(event.reply.received_at)}
                          </span>
                        </div>
                        {event.sentAt && timeDelta(event.sentAt, event.reply.received_at) && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {timeDelta(event.sentAt, event.reply.received_at)} after sending
                          </p>
                        )}
                        {event.reply.subject && (
                          <p className="mt-1 text-sm font-semibold">{event.reply.subject}</p>
                        )}
                        {event.reply.body ? (
                          <BodyBlock
                            body={event.reply.body}
                            toggleKey={key}
                            expanded={isExpanded}
                            onToggle={toggleExpanded}
                            expandLabel="Show full reply"
                          />
                        ) : null}
                      </div>
                    </div>
                  );
                }

                return null;
              })}

              {/* Follow-up composer — always shown when outreach exists */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted/40">
                    <ArrowUpRight className="size-3.5 text-muted-foreground" />
                  </div>
                </div>
                <div className="min-w-0 flex-1 pb-2">
                  <p className="mb-3 text-sm font-medium text-muted-foreground">
                    {profile.outreach.replied
                      ? "Continue the conversation"
                      : "Send a follow-up"}
                  </p>
                  <FollowUpReplyComposer
                    outreachId={profile.outreach.id}
                    coachEmail={profile.email}
                    mode={profile.outreach.replied ? "reply" : "nudge"}
                  />
                </div>
              </div>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* ── Notes ── */}
      {profile.notes && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Notes</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">{profile.notes}</p>
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  );
}
