import { Badge } from "@/components/ui/badge";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/glass-card";
import { FollowUpReplyComposer } from "@/components/dashboard/followup-reply-composer";
import type { SentEmailRow } from "@/lib/types/dashboard";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function EmailDetailContent({ row }: { row: SentEmailRow }) {
  const hasReplies = row.thread.some((m) => m.from === "coach");

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <div className="text-xs text-muted-foreground">Sent</div>
          <div className="font-medium">{formatDateTime(row.sent_at)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Opened</div>
          <div className="font-medium">
            {row.opened_at ? formatDateTime(row.opened_at) : "—"}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Replied</div>
          <div className="font-medium">
            {row.replied_at ? formatDateTime(row.replied_at) : "—"}
          </div>
        </div>
      </div>

      {/* Initial email — always shown */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="text-sm">{row.subject}</GlassCardTitle>
          <div className="text-xs text-muted-foreground">
            You → {row.coach_email} · {formatDateTime(row.sent_at)}
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          <p className="whitespace-pre-wrap text-sm text-foreground">{row.body}</p>
        </GlassCardContent>
      </GlassCard>

      {/* Full chronological thread */}
      {row.thread.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            Thread
            <Badge>{row.thread.length}</Badge>
          </div>
          {row.thread.map((msg) => (
            <GlassCard key={msg.id} strong={msg.from === "coach"}>
              <GlassCardHeader>
                <GlassCardTitle className="text-sm">
                  {msg.subject ?? `Re: ${row.subject}`}
                </GlassCardTitle>
                <div className="text-xs text-muted-foreground">
                  {msg.from === "coach"
                    ? `${row.coach_email} → You`
                    : `You → ${row.coach_email}`}
                  {" · "}
                  {formatDateTime(msg.timestamp)}
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {msg.body ?? "(no content)"}
                </p>
              </GlassCardContent>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Compose area */}
      <div className="flex flex-col gap-2">
        {!hasReplies && (
          <p className="text-sm text-muted-foreground">No reply yet.</p>
        )}
        <FollowUpReplyComposer
          outreachId={row.id}
          coachEmail={row.coach_email}
          mode={hasReplies ? "reply" : "nudge"}
        />
      </div>
    </div>
  );
}
