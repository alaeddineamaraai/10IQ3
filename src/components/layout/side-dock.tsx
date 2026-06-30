"use client";

import { usePathname } from "next/navigation";
import {
  Home,
  LayoutGrid,
  ListFilter,
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
  { title: "Schools", href: "/schools", icon: LayoutGrid },
  { title: "Coaches", href: "/coaches", icon: ListFilter },
  { title: "Compose", href: "/compose", icon: PenSquare },
  { title: "AI Advisor", href: "/advisor", icon: Sparkles },
];

export function SideDock({ profile }: { profile: AthleteProfile }) {
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
            isActive ? "text-primary-foreground" : "text-muted-foreground"
          )}
          strokeWidth={2}
        />
      ),
      className: isActive
        ? "bg-primary shadow-[0_4px_16px_rgba(59,122,245,0.35)]"
        : undefined,
    };
  });

  return (
    <>
      <div className="fixed inset-y-0 right-6 z-50 hidden flex-col items-center justify-center gap-6 md:flex">
        <ProfileMenu profile={profile} variant="dock" />
        <FloatingDock items={items} desktopClassName="glass-dock" orientation="vertical" />
      </div>
      <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 md:hidden">
        <FloatingDock items={items} mobileClassName="glass-dock" />
      </div>
    </>
  );
}
