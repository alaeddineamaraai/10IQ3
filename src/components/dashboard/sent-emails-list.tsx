"use client";

import Link from "next/link";
import { Mail, Plus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { ExpandableCard, type ExpandableCardItem } from "@/components/ui/expandable-card";
import { EmailDetailContent } from "@/components/dashboard/email-detail-content";
import type { SentEmailRow } from "@/lib/types/dashboard";

const isSampleMode = !process.env.NEXT_PUBLIC_SUPABASE_URL;

export function SentEmailsList({ rows }: { rows: SentEmailRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-muted">
          <Mail className="size-5 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">No outreach yet</p>
          <p className="max-w-[240px] text-xs text-muted-foreground">
            Your sent emails and coach responses will appear here once you start reaching out.
          </p>
        </div>
        <Link
          href="/compose"
          className={buttonVariants({ size: "sm", variant: "outline", className: "mt-1 rounded-full" })}
        >
          <Plus className="size-3.5" />
          Send your first email
        </Link>
      </div>
    );
  }

  const items: ExpandableCardItem[] = rows.map((row) => {
    // A reply is "unread" until the athlete has viewed it — distinct from
    // opened/replied, which describe the coach's behavior, not the
    // athlete's own read state.
    const unread = row.replied && !row.reply_viewed_at;
    return {
      id: row.id,
      title: row.coach_name,
      description: row.school_name,
      badge: row.replied ? "Replied" : row.opened ? "Opened" : "Sent",
      badgeVariant: unread ? "unread" : row.replied ? "solid" : row.opened ? "muted" : "outline",
      icon: <Mail className="size-5" />,
      content: <EmailDetailContent row={row} />,
    };
  });

  async function markRead(id: string) {
    if (isSampleMode) return;
    const row = rows.find((r) => r.id === id);
    if (!row?.replied || row.reply_viewed_at) return;
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }

  return <ExpandableCard items={items} modalClassName="max-w-xl" onOpen={markRead} />;
}
