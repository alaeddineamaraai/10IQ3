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

const LIQUID = { type: "spring", stiffness: 260, damping: 30, mass: 0.9 } as const;

export type FloatingDockItem = {
  title: string;
  icon: React.ReactNode;
  href: string;
  className?: string;
  badgeCount?: number;
};

export const FloatingDock = ({
  items,
  mobileItems,
  desktopClassName,
  mobileClassName,
}: {
  items: FloatingDockItem[];
  mobileItems?: FloatingDockItem[];
  desktopClassName?: string;
  mobileClassName?: string;
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
    <div className={cn("flex items-center gap-1.5 rounded-full p-2 md:hidden", className)}>
      {items.map((item) => {
        const isActive = pathname?.startsWith(item.href) ?? false;
        return (
          <Link
            href={item.href}
            key={item.title}
            className="shrink-0 touch-manipulation select-none"
          >
            <div
              className={cn(
                "relative flex h-14 items-center justify-center rounded-full overflow-hidden",
                isActive ? "gap-2 px-5 text-foreground" : "w-14 text-muted-foreground",
              )}
            >
              {/* Lozenge wrapped in AnimatePresence so layoutId always has a
                  clean mount/unmount cycle — prevents the "ghost" glitch where
                  the indicator fails to appear after fast navigation. */}
              <AnimatePresence initial={false}>
                {isActive && (
                  <motion.div
                    key="mobile-lozenge"
                    layoutId="dock-lozenge-mobile"
                    className="nav-lozenge absolute inset-0 rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={LIQUID}
                  />
                )}
              </AnimatePresence>
              <motion.div
                whileTap={{ scale: 0.82 }}
                transition={LIQUID}
                className="relative z-10 flex size-6 shrink-0 items-center justify-center"
              >
                {item.icon}
                <Badge count={item.badgeCount} />
              </motion.div>
              {/* Animate maxWidth instead of width: "auto" — Framer reliably
                  interpolates numeric values; "auto" is layout-measured and
                  can flicker on first paint. */}
              <AnimatePresence initial={false}>
                {isActive && (
                  <motion.span
                    key="label"
                    initial={{ opacity: 0, maxWidth: 0 }}
                    animate={{ opacity: 1, maxWidth: 96 }}
                    exit={{ opacity: 0, maxWidth: 0 }}
                    transition={LIQUID}
                    className="relative z-10 overflow-hidden whitespace-nowrap text-[15px] font-medium"
                  >
                    {item.title}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
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
    <div className={cn("hidden flex-col items-start gap-1 rounded-[2rem] p-2 md:flex", className)}>
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
      <div
        className={cn(
          "relative flex h-14 w-14 items-center justify-center rounded-full",
          isActive ? "text-foreground" : "text-muted-foreground",
        )}
      >
        <AnimatePresence initial={false}>
          {isActive && (
            <motion.div
              key="desktop-lozenge"
              layoutId="dock-lozenge-desktop"
              className="nav-lozenge absolute inset-0 rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={LIQUID}
            />
          )}
        </AnimatePresence>
        <motion.div
          whileTap={{ scale: 0.82 }}
          transition={LIQUID}
          className="relative z-10 flex size-6 shrink-0 items-center justify-center"
        >
          {item.icon}
          <Badge count={item.badgeCount} />
        </motion.div>
      </div>

      {/* Tooltip: position is pure CSS (top-1/2 -translate-y-1/2 in a wrapper
          div) so Framer only animates opacity + x — no competing transforms. */}
      <div className="pointer-events-none absolute top-1/2 left-full ml-3 -translate-y-1/2">
        <AnimatePresence>
          {hovered && !isActive && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.15 }}
              className="glass-chip w-fit whitespace-pre rounded-lg px-3 py-1.5 text-[13px] font-medium text-foreground"
            >
              {item.title}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Link>
  );
}
