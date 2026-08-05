"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Mail, Menu, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/layout/app-sidebar";
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

function IconLink({
  href,
  label,
  badge,
  children,
}: {
  href: string;
  label: string;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="control-pill relative flex size-10 shrink-0 items-center justify-center text-muted-foreground transition-smooth hover:text-foreground"
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
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  // The drawer is a route-level overlay; close it whenever navigation lands.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    const onSchools = pathname?.startsWith("/schools");
    const base = onSchools ? "/schools" : "/coaches";
    router.push(q ? `${base}?search=${encodeURIComponent(q)}` : base);
  }

  return (
    <>
      <header
        style={{ viewTransitionName: "site-topbar" }}
        className="flex items-center gap-3 px-4 py-3 sm:px-6"
      >
        {/* Mobile: hamburger + page title stand in for the sidebar */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          className="control-pill flex size-10 shrink-0 items-center justify-center text-muted-foreground lg:hidden"
        >
          <Menu className="size-[18px]" />
        </button>
        <span className="text-base font-semibold tracking-tight sm:hidden">
          {pageTitleFor(pathname)}
        </span>

        <form onSubmit={handleSearch} className="hidden min-w-0 flex-1 sm:block">
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

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <IconLink href="/inbox" label="Inbox">
            <Mail className="size-[18px]" />
          </IconLink>
          <IconLink href="/notifications" label="Notifications" badge={unreadCount}>
            <Bell className="size-[18px]" />
          </IconLink>
        </div>
      </header>

      {/* Mobile navigation drawer */}
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
