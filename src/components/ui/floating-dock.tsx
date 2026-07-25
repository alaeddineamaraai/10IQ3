"use client";
/**
 * Liquid-glass navigation dock.
 * - Desktop: a calm vertical glass rail on the left. The active item carries a
 *   soft "lozenge" highlight that slides between items on navigation (shared
 *   layoutId). Labels appear on hover. No macOS-style magnification.
 * - Mobile: a floating bottom glass pill. The active tab expands to show its
 *   label behind a matching lozenge.
 **/

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";

export type FloatingDockItem = {
  title: string;
  icon: React.ReactNode;
  href: string;
  className?: string;
  /** Small unread-count dot shown on the icon, e.g. for notifications. */
  badgeCount?: number;
};

export const FloatingDock = ({
  items,
  mobileItems,
  desktopClassName,
  mobileClassName,
}: {
  items: FloatingDockItem[];
  /** Overrides `items` for the mobile bar only — lets mobile carry fewer
   * entries (more room per touch target) without touching the desktop rail. */
  mobileItems?: FloatingDockItem[];
  desktopClassName?: string;
  mobileClassName?: string;
  /** Kept for call-site compatibility; the desktop rail is always vertical. */
  orientation?: "horizontal" | "vertical";
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} />
      <FloatingDockMobile items={mobileItems ?? items} className={mobileClassName} />
    </>
  );
};

function Badge({ count }: { count?: number }) {
  if (!count) return null;
  return (
    <span className="absolute -top-1 -right-1.5 z-20 flex size-4 items-center justify-center rounded-full bg-[#7d9159] text-[9px] font-bold text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

// ── Mobile: floating bottom pill ────────────────────────────────────────────

const FloatingDockMobile = ({
  items,
  className,
}: {
  items: FloatingDockItem[];
  className?: string;
}) => {
  const pathname = usePathname();

  return (
    <div className={cn("flex items-center gap-1.5 rounded-full p-1.5 md:hidden", className)}>
      {items.map((item) => {
        const isActive = pathname?.startsWith(item.href) ?? false;
        return (
          <Link
            href={item.href}
            key={item.title}
            className="shrink-0 touch-manipulation select-none"
          >
            <motion.div
              layout
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className={cn(
                "relative flex h-11 items-center justify-center rounded-full",
                isActive ? "gap-2 px-4 text-foreground" : "w-11 text-muted-foreground",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="dock-lozenge-mobile"
                  className="nav-lozenge absolute inset-0 rounded-full"
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center">
                {item.icon}
                <Badge count={item.badgeCount} />
              </div>
              <AnimatePresence initial={false}>
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.18 }}
                    className="relative z-10 overflow-hidden whitespace-nowrap text-sm font-medium"
                  >
                    {item.title}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </Link>
        );
      })}
    </div>
  );
};

// ── Desktop: vertical glass rail ────────────────────────────────────────────

const FloatingDockDesktop = ({
  items,
  className,
}: {
  items: FloatingDockItem[];
  className?: string;
}) => {
  const pathname = usePathname();

  return (
    <div className={cn("hidden flex-col items-center gap-1.5 rounded-full p-2 md:flex", className)}>
      {items.map((item) => {
        const isActive = pathname?.startsWith(item.href) ?? false;
        return <DesktopRailItem key={item.title} item={item} isActive={isActive} />;
      })}
    </div>
  );
};

function DesktopRailItem({ item, isActive }: { item: FloatingDockItem; isActive: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={item.href}
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className={cn(
          "relative flex size-12 items-center justify-center rounded-full",
          isActive ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {isActive && (
          <motion.div
            layoutId="dock-lozenge-desktop"
            className="nav-lozenge absolute inset-0 rounded-full"
            transition={{ type: "spring", stiffness: 350, damping: 32 }}
          />
        )}
        <div className="relative z-10 flex size-5 items-center justify-center">
          {item.icon}
          <Badge count={item.badgeCount} />
        </div>
      </motion.div>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, x: -6, y: "-50%" }}
            animate={{ opacity: 1, x: 0, y: "-50%" }}
            exit={{ opacity: 0, x: -4, y: "-50%" }}
            transition={{ duration: 0.16 }}
            className="glass-chip pointer-events-none absolute top-1/2 left-full ml-3 w-fit whitespace-pre rounded-lg px-2.5 py-1 text-xs font-medium text-foreground"
          >
            {item.title}
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  );
}
