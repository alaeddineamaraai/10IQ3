"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Inbox } from "lucide-react";

import { ProfileMenu } from "@/components/layout/profile-menu";
import { HowToGuide } from "@/components/guide/how-to-guide";
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
      className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 backdrop-blur-md rounded-b-3xl sm:px-6 lg:px-10"
      style={{
        viewTransitionName: "site-header",
        background: "linear-gradient(135deg, rgba(18,13,9,0.94) 0%, rgba(10,8,6,0.88) 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Desktop: logo + wordmark + guide button */}
      <div className="hidden items-center gap-4 md:flex">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 transition-smooth hover:opacity-70"
        >
          <Image src="/logo.png" alt="Netset" width={38} height={38} priority style={{ filter: "grayscale(1) brightness(1.8) contrast(1.1)" }} />
          <span className="text-lg font-semibold tracking-tight">Netset</span>
        </Link>
        <HowToGuide />
      </div>

      {/* Mobile: logo is replaced by the merged Inbox/Notifications entry on
          the left and the current page name centered — the dock at the
          bottom no longer carries these two, see side-dock.tsx. */}
      <Link
        href="/inbox"
        className="relative flex size-11 shrink-0 items-center justify-center rounded-full transition-smooth hover:bg-muted md:hidden"
        aria-label="Inbox and notifications"
      >
        <Inbox className="size-5 text-muted-foreground" strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-[#7d9159] text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Link>
      <span className="absolute left-1/2 -translate-x-1/2 text-base font-semibold tracking-tight md:hidden">
        {title}
      </span>

      <div className="flex items-center gap-2 md:hidden">
        <HowToGuide />
        <ProfileMenu profile={profile} />
      </div>
    </header>
  );
}
