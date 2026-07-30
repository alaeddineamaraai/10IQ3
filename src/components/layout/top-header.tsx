"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Inbox } from "lucide-react";

import { ProfileMenu } from "@/components/layout/profile-menu";
import type { AthleteProfile } from "@/lib/types/profile";

const PAGE_TITLES: [string, string][] = [
  ["/dashboard", "Dashboard"],
  ["/contacts", "Contacts"],
  ["/coaches", "Coaches"],
  ["/schools", "Schools"],
  ["/compose", "Compose"],
  ["/inbox", "Inbox"],
  ["/notifications", "Inbox"],
  ["/advisor", "AI Advisor"],
  ["/settings", "Settings"],
  ["/profile", "Profile"],
  ["/paywall", "Plans"],
];

function pageTitleFor(pathname: string | null): string {
  if (!pathname) return "Netset";
  const match = PAGE_TITLES.find(([path]) => pathname.startsWith(path));
  return match ? match[1] : "Netset";
}

export function TopHeader({
  profile,
  unreadCount = 0,
}: {
  profile: AthleteProfile;
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const title = pageTitleFor(pathname);

  return (
    <header
      className="sticky top-0 z-40"
      style={{ viewTransitionName: "site-header" }}
    >
      {/* Blur-only layer: no visible fill, just a gentle blur of whatever
          scrolls under the top edge, faded out toward the bottom. Kept behind
          the controls so it never dims the header content itself. */}
      <div
        aria-hidden
        className="top-fade-blur pointer-events-none absolute inset-x-0 top-0 h-[calc(100%+1.75rem)]"
      />

      <div className="relative flex items-center justify-between px-4 py-3 sm:px-6 lg:px-10">
        {/* Desktop: logo + wordmark */}
        <div className="hidden items-center md:flex">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 opacity-75 transition-smooth hover:opacity-100"
          >
            <Image src="/logo.png" alt="Netset" width={38} height={38} priority style={{ filter: "var(--logo-filter, none)" }} />
            <span className="text-lg font-semibold tracking-tight text-muted-foreground">Netset</span>
          </Link>
        </div>

        {/* Mobile: logo is replaced by the merged Inbox/Notifications entry on
            the left and the current page name centered — the dock at the
            bottom no longer carries these two, see side-dock.tsx. */}
        <Link
          href="/inbox"
          className="glass-chip relative flex size-11 shrink-0 items-center justify-center rounded-full md:hidden"
          aria-label="Inbox and notifications"
        >
          <Inbox className="size-5 text-muted-foreground" strokeWidth={2} />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
        <span className="absolute left-1/2 -translate-x-1/2 text-base font-semibold tracking-tight md:hidden">
          {title}
        </span>

        <div className="flex items-center gap-2 md:hidden">
          <ProfileMenu profile={profile} />
        </div>
      </div>
    </header>
  );
}
