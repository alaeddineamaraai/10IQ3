"use client";

import { usePathname } from "next/navigation";
import {
  Bell,
  Home,
  Inbox,
  Users,
  PenSquare,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { FloatingDock, type FloatingDockItem } from "@/components/ui/floating-dock";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { cn } from "@/lib/utils";
import type { AthleteProfile } from "@/lib/types/profile";

type DockItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

const DOCK_ITEMS: DockItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: Home },
  { title: "Contacts", href: "/contacts", icon: Users },
  { title: "Compose", href: "/compose", icon: PenSquare },
  { title: "Inbox", href: "/inbox", icon: Inbox },
  { title: "Notifications", href: "/notifications", icon: Bell },
  { title: "AI Advisor", href: "/advisor", icon: Sparkles },
];

export function SideDock({
  profile,
  unreadCount = 0,
}: {
  profile: AthleteProfile;
  unreadCount?: number;
}) {
  const pathname = usePathname();

  const items: FloatingDockItem[] = DOCK_ITEMS.map(({ title, href, icon: Icon }) => {
    const isActive = pathname?.startsWith(href);
    return {
      title,
      href,
      icon: (
        <Icon
          className={cn(
            "h-full w-full",
            isActive ? "text-foreground" : "text-muted-foreground"
          )}
          strokeWidth={2}
        />
      ),
      badgeCount: href === "/notifications" ? unreadCount : undefined,
    };
  });

  // Mobile carries fewer items than desktop — Inbox and Notifications moved
  // into a single merged entry in the top header (see top-header.tsx) so the
  // bottom bar isn't crowded with 6 small icons on a phone-width screen.
  const mobileItems = items.filter(
    (item) => item.href !== "/inbox" && item.href !== "/notifications"
  );

  return (
    <>
      {/* pointer-events-none on the full-height/width strips so they don't
          swallow clicks on content beneath; re-enabled on the widgets. */}
      <div
        style={{ viewTransitionName: "site-dock-desktop" }}
        className="pointer-events-none fixed inset-y-0 left-6 z-50 hidden flex-col items-start justify-center gap-6 md:flex"
      >
        <div className="pointer-events-auto">
          <ProfileMenu profile={profile} variant="dock" />
        </div>
        <div className="pointer-events-auto">
          <FloatingDock items={items} desktopClassName="glass-dock" orientation="vertical" />
        </div>
      </div>
      <div
        style={{ viewTransitionName: "site-dock-mobile" }}
        className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 md:hidden"
      >
        <div className="pointer-events-auto">
          <FloatingDock items={items} mobileItems={mobileItems} mobileClassName="glass-dock" />
        </div>
      </div>
    </>
  );
}
