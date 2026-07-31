"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CircleHelp,
  GraduationCap,
  LayoutGrid,
  LogOut,
  type LucideIcon,
  Mail,
  PenSquare,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AthleteProfile } from "@/lib/types/profile";

type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Renders the unread pill on the right of the row. */
  badge?: boolean;
};

const MENU: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { title: "Contacts", href: "/contacts", icon: Users },
  { title: "Coaches", href: "/coaches", icon: GraduationCap },
  { title: "Compose", href: "/compose", icon: PenSquare },
  { title: "Inbox", href: "/inbox", icon: Mail, badge: true },
  { title: "AI Advisor", href: "/advisor", icon: Sparkles },
];

const GENERAL: NavItem[] = [
  { title: "Notifications", href: "/notifications", icon: Bell, badge: true },
  { title: "Settings", href: "/settings", icon: Settings },
  { title: "Help", href: "/settings#help", icon: CircleHelp },
];

function NavRow({
  item,
  active,
  unreadCount,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  unreadCount: number;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const showBadge = item.badge && unreadCount > 0;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-smooth",
        active
          ? "nav-active font-medium"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      )}
    >
      {/* Active marker rail, flush to the sidebar edge */}
      {active && (
        <span
          aria-hidden
          className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary"
        />
      )}
      <Icon className="size-[18px] shrink-0" strokeWidth={active ? 2.2 : 1.9} />
      <span className="truncate">{item.title}</span>
      {showBadge && (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}

export function AppSidebar({
  profile,
  unreadCount = 0,
  onNavigate,
}: {
  profile: AthleteProfile;
  unreadCount?: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  function isActive(href: string) {
    const base = href.split("#")[0];
    return pathname === base || pathname?.startsWith(`${base}/`);
  }

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col gap-6 px-5 py-6">
      {/* Wordmark */}
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="flex items-center gap-2.5 px-1 transition-smooth hover:opacity-80"
      >
        <Image
          src="/logo.png"
          alt=""
          width={34}
          height={34}
          priority
          style={{ filter: "var(--logo-filter, none)" }}
        />
        <span className="text-xl font-semibold tracking-tight">Netset</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto">
        <div className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Menu
          </p>
          {MENU.map((item) => (
            <NavRow
              key={item.href}
              item={item}
              active={isActive(item.href)}
              unreadCount={unreadCount}
              onNavigate={onNavigate}
            />
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            General
          </p>
          {GENERAL.map((item) => (
            <NavRow
              key={item.href}
              item={item}
              active={isActive(item.href)}
              unreadCount={unreadCount}
              onNavigate={onNavigate}
            />
          ))}
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-smooth hover:bg-muted/60 hover:text-foreground disabled:opacity-60"
          >
            <LogOut className="size-[18px] shrink-0" strokeWidth={1.9} />
            <span>{signingOut ? "Signing out…" : "Logout"}</span>
          </button>
        </div>
      </nav>

      {/* Upgrade card — only while the athlete is still on the free plan,
          so paying users don't stare at a dead promo slot. */}
      {profile.plan === "free" && (
        <div className="surface-card-accent relative shrink-0 overflow-hidden p-3.5">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-10 size-24 rounded-full bg-white/10"
          />
          <div className="relative flex items-center gap-3">
            <Sparkles className="size-4 shrink-0" />
            <p className="text-[13px] font-semibold leading-snug">
              Reach every coach
            </p>
          </div>
          <Link
            href="/paywall"
            onClick={onNavigate}
            /* Inverts against the accent fill: in light themes that's a white
               chip with accent text, in dark themes a dark chip with light
               text. A hardcoded white chip goes invisible on light accents. */
            className="relative mt-2.5 flex items-center justify-center rounded-full bg-[var(--primary-foreground)] px-3 py-1.5 text-xs font-semibold text-[var(--primary)] transition-smooth hover:opacity-90"
          >
            Upgrade
          </Link>
        </div>
      )}
    </div>
  );
}
