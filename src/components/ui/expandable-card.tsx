"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

import { useOutsideClick } from "@/hooks/use-outside-click";
import { cn } from "@/lib/utils";

export type ExpandableCardItem = {
  id: string;
  title: string;
  description: string;
  badge?: string;
  badgeVariant?: "solid" | "muted" | "outline" | "unread";
  icon?: React.ReactNode;
  ctaText?: string;
  ctaHref?: string;
  action?: React.ReactNode;
  content: React.ReactNode;
};

function badgeClasses(variant: ExpandableCardItem["badgeVariant"]) {
  switch (variant) {
    case "solid":
      return "bg-primary text-primary-foreground";
    case "outline":
      return "border border-border text-muted-foreground";
    // Unread replies get a distinct green so they stand out from the rest
    // of the (warm/neutral) palette — Von Restorff effect.
    case "unread":
      return "bg-primary text-primary-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function ExpandableCard({
  items,
  modalClassName,
  onOpen,
}: {
  items: ExpandableCardItem[];
  modalClassName?: string;
  /** Called with an item's id when its card is expanded — e.g. to mark an
   * unread notification as read. */
  onOpen?: (id: string) => void;
}) {
  const [active, setActive] = useState<ExpandableCardItem | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActive(null);
    }

    // scrollbar-gutter: stable on <html> keeps layout stable; no overflow manipulation needed
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useOutsideClick(ref, () => setActive(null));

  return (
    <>
      {typeof document !== "undefined" && createPortal(
        <>
          <AnimatePresence>
            {active && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] h-full w-full bg-black/50"
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {active ? (
              <div className="fixed inset-0 z-[201] grid place-items-center px-4">
                <motion.button
                  key={`button-${active.id}-${id}`}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.05 } }}
                  className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-card touch-manipulation"
                  onClick={() => setActive(null)}
                >
                  <CloseIcon />
                </motion.button>
                <motion.div
                  layoutId={`card-${active.id}-${id}`}
                  ref={ref}
                  transition={{ type: "spring", stiffness: 320, damping: 30, mass: 0.8 }}
                  className={cn(
                    "glass-card-strong flex h-full max-h-[90dvh] w-full max-w-[500px] flex-col overflow-hidden md:h-fit",
                    modalClassName
                  )}
                >
                  <div className="flex items-start justify-between gap-4 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        {active.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{active.title}</h3>
                          {active.badge && (
                            <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", badgeClasses(active.badgeVariant))}>
                              {active.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{active.description}</p>
                      </div>
                    </div>

                    {active.ctaHref && (
                      <a
                        href={active.ctaHref}
                        className="transition-smooth shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                      >
                        {active.ctaText}
                      </a>
                    )}
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-1 min-h-0 flex-col gap-4 overflow-auto overscroll-contain px-5 pb-6 text-sm text-muted-foreground [scrollbar-width:none] [-ms-overflow-style:none]"
                  >
                    {active.content}
                  </motion.div>
                </motion.div>
              </div>
            ) : null}
          </AnimatePresence>
        </>,
        document.body
      )}
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <motion.li
            layoutId={`card-${item.id}-${id}`}
            key={item.id}
            onClick={() => { setActive(item); onOpen?.(item.id); }}
            transition={{ type: "spring", stiffness: 320, damping: 30, mass: 0.8 }}
            whileTap={{ scale: 0.985 }}
            className="transition-smooth flex cursor-pointer items-center justify-between gap-4 rounded-2xl p-4 touch-manipulation select-none hover:bg-muted"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                {item.icon}
              </div>
              <div>
                <h3 className="font-medium text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {item.badge && (
                <span className={cn("rounded-full px-3 py-1.5 text-xs font-semibold", badgeClasses(item.badgeVariant))}>
                  {item.badge}
                </span>
              )}
              {item.action && (
                <div onClick={(e) => e.stopPropagation()}>
                  {item.action}
                </div>
              )}
            </div>
          </motion.li>
        ))}
      </ul>
    </>
  );
}

function CloseIcon() {
  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.05 } }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-foreground"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
}
