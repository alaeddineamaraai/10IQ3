"use client";

import { useMemo, useState } from "react";
import { Mail, MailOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ExpandableCard, type ExpandableCardItem } from "@/components/ui/expandable-card";
import { GlassCard, GlassCardContent } from "@/components/glass-card";
import { FollowUpReplyComposer } from "@/components/dashboard/followup-reply-composer";
import { AchievementStory } from "@/components/stories/achievement-story";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/lib/types/notification";
import type { AthleteProfile } from "@/lib/types/profile";
import type { AchievementStats } from "@/lib/data/achievements";

const isSampleGlobal = !process.env.NEXT_PUBLIC_SUPABASE_URL;

type Filter = "all" | "unread" | "read";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
];

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function NotificationsClient({
  notifications: initial,
  isSample,
  profile,
  stats,
}: {
  notifications: NotificationItem[];
  isSample: boolean;
  profile: AthleteProfile;
  stats: AchievementStats;
}) {
  const [notifications, setNotifications] = useState(initial);
  const [filter, setFilter] = useState<Filter>("all");

  const unreadCount = notifications.filter((n) => !n.reply_viewed_at).length;

  const filtered = useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.reply_viewed_at);
    if (filter === "read") return notifications.filter((n) => n.reply_viewed_at);
    return notifications;
  }, [notifications, filter]);

  async function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id && !n.reply_viewed_at ? { ...n, reply_viewed_at: new Date().toISOString() } : n))
    );
    if (isSampleGlobal || isSample) return;
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, reply_viewed_at: n.reply_viewed_at ?? new Date().toISOString() })));
    if (isSampleGlobal || isSample) return;
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    }).catch(() => {});
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <AchievementStory profile={profile} stats={stats} />
        </div>
        <GlassCard>
          <GlassCardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Mail className="size-8 text-muted-foreground/40" />
            <p className="font-medium">No replies yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              When a coach replies to one of your emails, you&apos;ll see it here.
            </p>
          </GlassCardContent>
        </GlassCard>
      </div>
    );
  }

  const items: ExpandableCardItem[] = filtered.map((n) => ({
    id: n.id,
    title: n.coach_name,
    description: `${n.school_name}${n.division ? ` · ${n.division}` : ""} · ${timeAgo(n.replied_at)}`,
    badge: n.reply_viewed_at ? undefined : "New",
    badgeVariant: "unread",
    icon: n.reply_viewed_at ? <MailOpen className="size-5" /> : <Mail className="size-5" />,
    ctaText: "Compose follow-up",
    ctaHref: `/compose?coaches=${encodeURIComponent(n.coach_email)}`,
    content: (
      <div className="flex flex-col gap-3 px-5 pb-5 text-sm">
        {n.subject && <p className="font-medium text-foreground">{n.subject}</p>}
        <p className="whitespace-pre-wrap text-muted-foreground">
          {n.preview ?? "No preview available."}
        </p>
        <FollowUpReplyComposer outreachId={n.id} coachEmail={n.coach_email} />
      </div>
    ),
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/20 p-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-smooth",
                filter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
              {f.value === "unread" && unreadCount > 0 && ` (${unreadCount})`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              Mark all as read
            </Button>
          )}
          <AchievementStory profile={profile} stats={stats} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <GlassCard>
          <GlassCardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No {filter === "unread" ? "unread" : "read"} notifications.
            </p>
          </GlassCardContent>
        </GlassCard>
      ) : (
        <ExpandableCard items={items} modalClassName="max-w-xl" onOpen={markRead} />
      )}
    </div>
  );
}
