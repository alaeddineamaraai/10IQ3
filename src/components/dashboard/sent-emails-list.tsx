"use client";

import { Mail } from "lucide-react";

import { ExpandableCard, type ExpandableCardItem } from "@/components/ui/expandable-card";
import { EmailDetailContent } from "@/components/dashboard/email-detail-content";
import type { SentEmailRow } from "@/lib/types/dashboard";

export function SentEmailsList({ rows }: { rows: SentEmailRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No emails sent yet.
      </div>
    );
  }

  const items: ExpandableCardItem[] = rows.map((row) => ({
    id: row.id,
    title: row.coach_name,
    description: row.school_name,
    badge: row.replied ? "Replied" : row.opened ? "Opened" : "Sent",
    badgeVariant: row.replied ? "solid" : row.opened ? "muted" : "outline",
    icon: <Mail className="size-5" />,
    ctaText: "Compose follow-up",
    ctaHref: `/compose?coaches=${encodeURIComponent(row.coach_email)}`,
    content: <EmailDetailContent row={row} />,
  }));

  return <ExpandableCard items={items} modalClassName="max-w-xl" />;
}
