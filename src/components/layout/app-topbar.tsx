"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Mail, Search, X } from "lucide-react";

import type { AthleteProfile } from "@/lib/types/profile";

const PAGE_TITLES: [string, string][] = [
  ["/dashboard", "Dashboard"],
  ["/contacts", "Contacts"],
  ["/coaches", "Coaches"],
  ["/schools", "Schools"],
  ["/compose", "Compose"],
  ["/inbox", "Inbox"],
  ["/notifications", "Notifications"],
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

import { cn } from "@/lib/utils";

function IconLink({
  href,
  label,
  badge,
  className,
  children,
}: {
  href: string;
  label: string;
  badge?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn("control-pill relative flex size-10 shrink-0 items-center justify-center text-muted-foreground transition-smooth hover:text-foreground", className)}
    >
      {children}
      {badge != null && badge > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  );
}

export function AppTopbar({
  profile,
  unreadCount = 0,
}: {
  profile: AthleteProfile;
  unreadCount?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  // ⌘K / Ctrl-K focuses search from anywhere in the app.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    const onSchools = pathname?.startsWith("/schools");
    const base = onSchools ? "/schools" : "/coaches";
    router.push(q ? `${base}?search=${encodeURIComponent(q)}` : base);
  }

  return (
    <header
      style={{ viewTransitionName: "site-topbar" }}
      className="flex items-center gap-3 px-4 py-3 sm:px-6"
    >
      {/* Mobile: page title (navigation is in the bottom tab bar) */}
      <span className="text-base font-semibold tracking-tight lg:hidden">
        {pageTitleFor(pathname)}
      </span>

      {/* Desktop: search bar */}
      <form onSubmit={handleSearch} className="hidden min-w-0 flex-1 lg:block">
        <div className="control-pill flex h-11 max-w-md items-center gap-2.5 px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search coaches or schools"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="text-muted-foreground transition-smooth hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <kbd className="hidden shrink-0 rounded-md border border-border px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground md:block">
              ⌘K
            </kbd>
          )}
        </div>
      </form>

      <div className="ml-auto flex items-center gap-2 lg:gap-3">
        {/* On mobile, only show notifications (inbox is in the bottom bar) */}
        <IconLink href="/inbox" label="Inbox" className="hidden lg:flex">
          <Mail className="size-[18px]" />
        </IconLink>
        <IconLink href="/notifications" label="Notifications" badge={unreadCount}>
          <Bell className="size-[18px]" />
        </IconLink>
      </div>
    </header>
  );
}
