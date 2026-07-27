"use client";

import { useState } from "react";
import { Mail, MailOpen, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

import { GlassCard, GlassCardContent } from "@/components/glass-card";
import { FollowUpReplyComposer } from "@/components/dashboard/followup-reply-composer";
import { cn } from "@/lib/utils";
import type { InboxConversation } from "@/lib/types/inbox";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ConversationCard({
  conversation,
  isSample,
}: {
  conversation: InboxConversation;
  isSample: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isUnread = conversation.lastMessageDirection === "received" && !conversation.reply_viewed_at;

  return (
    <GlassCard className={cn(isUnread && "border-[#7d9159]/30")}>
      <button
        className="flex w-full items-start gap-4 p-4 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className={cn(
          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
          isUnread ? "bg-[#7d9159]/15 text-[#7d9159]" : "bg-muted text-muted-foreground"
        )}>
          {isUnread ? <Mail className="size-4" /> : <MailOpen className="size-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate">
              <span className="truncate font-medium">{conversation.coach_name}</span>
              {isUnread && (
                <span className="shrink-0 rounded-full bg-[#7d9159]/20 px-2 py-0.5 text-[10px] font-semibold text-[#7d9159]">
                  New
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
              <span>{timeAgo(conversation.lastActivityAt)}</span>
              {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </div>
          </div>
          <p className="truncate text-xs text-muted-foreground">{conversation.school_name}</p>
          <p className="mt-1 truncate text-sm text-muted-foreground">{conversation.lastMessagePreview}</p>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/50 px-4 pb-4 pt-3">
          <div className="flex flex-col gap-3">
            {conversation.messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-sm",
                  msg.direction === "sent"
                    ? "ml-8 bg-primary/10 text-foreground"
                    : "mr-8 bg-muted text-foreground"
                )}
              >
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {msg.direction === "sent" ? "You" : conversation.coach_name} · {timeAgo(msg.at)}
                </p>
                {msg.subject && (
                  <p className="mb-1 text-xs font-medium">{msg.subject}</p>
                )}
                <p className="whitespace-pre-wrap">{msg.body ?? ""}</p>
              </div>
            ))}

            {!isSample && (
              <div className="pt-1">
                <FollowUpReplyComposer
                  outreachId={conversation.id}
                  coachEmail={conversation.coach_email}
                  mode={conversation.lastMessageDirection === "received" ? "reply" : "nudge"}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </GlassCard>
  );
}

export function InboxClient({
  conversations,
  isSample,
}: {
  conversations: InboxConversation[];
  isSample: boolean;
}) {
  if (conversations.length === 0) {
    return (
      <GlassCard>
        <GlassCardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <MessageSquare className="size-8 text-muted-foreground/40" />
          <p className="font-medium">No conversations yet</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Emails you send to coaches will appear here as threaded conversations.
          </p>
        </GlassCardContent>
      </GlassCard>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {conversations.map((c) => (
        <ConversationCard key={c.id} conversation={c} isSample={isSample} />
      ))}
    </div>
  );
}
