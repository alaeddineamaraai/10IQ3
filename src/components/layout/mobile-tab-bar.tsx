"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Users,
  PenSquare,
  Mail,
  Menu,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/layout/app-sidebar";
import type { AthleteProfile } from "@/lib/types/profile";

type Tab = { href: string; label: string; icon: LucideIcon; badge?: boolean };

const TABS: Tab[] = [
  { href: "/dashboard", label: "Home",     icon: LayoutGrid },
  { href: "/contacts",  label: "Contacts", icon: Users },
  { href: "/compose",   label: "Compose",  icon: PenSquare },
  { href: "/inbox",     label: "Inbox",    icon: Mail, badge: true },
];

export function MobileTabBar({
  profile,
  unreadCount = 0,
}: {
  profile: AthleteProfile;
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || pathname?.startsWith(`${href}/`);
  }

  return (
    <>
      {/* Bottom tab bar */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-50 flex items-stretch border-t border-border/60 bg-panel"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {TABS.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;
          const showBadge = tab.badge && unreadCount > 0;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <span className="relative">
                <Icon
                  className="size-[22px]"
                  strokeWidth={active ? 2.2 : 1.8}
                />
                {showBadge && (
                  <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
              <span>{tab.label}</span>
            </Link>
          );
        })}

        {/* More — opens the full sidebar drawer */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className={cn(
            "relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
            drawerOpen ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Menu className="size-[22px]" strokeWidth={1.8} />
          <span>More</span>
        </button>
      </nav>

      {/* Sidebar drawer (behind the tab bar, slides in from left) */}
      <div
        className={cn(
          "fixed inset-0 z-[70] lg:hidden",
          drawerOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!drawerOpen}
      >
        <button
          type="button"
          tabIndex={drawerOpen ? 0 : -1}
          aria-label="Close navigation"
          onClick={() => setDrawerOpen(false)}
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity duration-300",
            drawerOpen ? "opacity-100" : "opacity-0"
          )}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-[17rem] max-w-[85vw] bg-panel shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <AppSidebar
            profile={profile}
            unreadCount={unreadCount}
            onNavigate={() => setDrawerOpen(false)}
          />
        </div>
      </div>
    </>
  );
}
