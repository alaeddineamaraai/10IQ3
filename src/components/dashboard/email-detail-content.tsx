import { Badge } from "@/components/ui/badge";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/glass-card";
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

      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="text-sm">{row.subject}</GlassCardTitle>
          <div className="text-xs text-muted-foreground">To {row.coach_email}</div>
        </GlassCardHeader>
        <GlassCardContent>
          <p className="whitespace-pre-wrap text-sm text-foreground">{row.body}</p>
        </GlassCardContent>
      </GlassCard>

      {row.replies.length > 0 ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            Replies
            <Badge>{row.replies.length}</Badge>
          </div>
          {row.replies.map((reply) => (
            <GlassCard key={reply.id} strong>
              <GlassCardHeader>
                <GlassCardTitle className="text-sm">
                  {reply.subject ?? `Re: ${row.subject}`}
                </GlassCardTitle>
                <div className="text-xs text-muted-foreground">
                  From {reply.from_email} · {formatDateTime(reply.received_at)}
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {reply.body ?? "(no content)"}
                </p>
              </GlassCardContent>
            </GlassCard>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No reply yet.</p>
      )}
    </div>
  );
}
