"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import type { InboxConversation } from "@/lib/types/inbox";
import type { NotificationItem } from "@/lib/types/notification";
import type { AthleteProfile } from "@/lib/types/profile";
import type { AchievementStats } from "@/lib/data/achievements";
import { InboxClient } from "./inbox-client";
import { NotificationsClient } from "../notifications/notifications-client";

type Tab = "messages" | "notifications";

// Messages and notifications used to be two separate nav entries — merged
// into one tabbed page so mobile has a single "Inbox" destination instead of
// two crowded bottom-nav icons (see side-dock.tsx / top-header.tsx).
export function InboxTabs({
  conversations,
  notifications,
  isSample,
  profile,
  stats,
}: {
  conversations: InboxConversation[];
  notifications: NotificationItem[];
  isSample: boolean;
  profile: AthleteProfile;
  stats: AchievementStats;
}) {
  const [tab, setTab] = useState<Tab>("messages");
  const unreadNotifications = notifications.filter((n) => !n.reply_viewed_at).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-fit rounded-xl border border-border/50 bg-muted/40 p-1 backdrop-blur-sm">
        {(["messages", "notifications"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-5 py-1.5 text-sm font-medium transition-all duration-200",
              tab === t
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "messages" ? "Messages" : "Notifications"}
            {t === "notifications" && unreadNotifications > 0 && (
              <span className="flex size-4 items-center justify-center rounded-full bg-[#7d9159] text-[9px] font-bold text-white">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "messages" ? (
        <InboxClient conversations={conversations} isSample={isSample} />
      ) : (
        <NotificationsClient notifications={notifications} isSample={isSample} profile={profile} stats={stats} />
      )}
    </div>
  );
}
