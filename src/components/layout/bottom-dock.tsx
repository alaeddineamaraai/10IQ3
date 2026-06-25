"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutGrid,
  ListFilter,
  PenSquare,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type DockItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const DOCK_ITEMS: DockItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Schools", href: "/schools", icon: LayoutGrid },
  { label: "Coaches", href: "/coaches", icon: ListFilter },
  { label: "Compose", href: "/compose", icon: PenSquare },
  { label: "AI Advisor", href: "/advisor", icon: Sparkles },
];

export function BottomDock() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
    >
      <div className="glass-dock flex items-center gap-1 px-2 py-2">
        {DOCK_ITEMS.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "transition-smooth group relative flex flex-col items-center gap-0.5 rounded-2xl px-4 py-2.5 text-xs font-medium",
                isActive
                  ? "bg-primary text-primary-foreground shadow-[0_4px_16px_rgba(59,122,245,0.35)]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-5" strokeWidth={2} />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
