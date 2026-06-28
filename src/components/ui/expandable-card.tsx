"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { useOutsideClick } from "@/hooks/use-outside-click";
import { cn } from "@/lib/utils";

export type ExpandableCardItem = {
  id: string;
  title: string;
  description: string;
  badge?: string;
  badgeVariant?: "solid" | "muted" | "outline";
  icon?: React.ReactNode;
  ctaText?: string;
  ctaHref?: string;
  content: React.ReactNode;
};

function badgeClasses(variant: ExpandableCardItem["badgeVariant"]) {
  switch (variant) {
    case "solid":
      return "bg-primary text-primary-foreground";
    case "outline":
      return "border border-border text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function ExpandableCard({
  items,
  modalClassName,
}: {
  items: ExpandableCardItem[];
  modalClassName?: string;
}) {
  const [active, setActive] = useState<ExpandableCardItem | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActive(null);
    }

    document.body.style.overflow = active ? "hidden" : "auto";

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useOutsideClick(ref, () => setActive(null));

  return (
    <>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-10 h-full w-full bg-black/20"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active ? (
          <div className="fixed inset-0 z-100 grid place-items-center px-4">
            <motion.button
              key={`button-${active.id}-${id}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
              className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full bg-card lg:hidden"
              onClick={() => setActive(null)}
            >
              <CloseIcon />
            </motion.button>
            <motion.div
              layoutId={`card-${active.id}-${id}`}
              ref={ref}
              className={cn(
                "glass-card-strong flex h-full max-h-[90%] w-full max-w-[500px] flex-col overflow-hidden md:h-fit",
                modalClassName
              )}
            >
              <div className="flex items-start justify-between gap-4 p-5">
                <div className="flex items-center gap-3">
                  <motion.div
                    layoutId={`icon-${active.id}-${id}`}
                    className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"
                  >
                    {active.icon}
                  </motion.div>
                  <div>
                    <div className="flex items-center gap-2">
                      <motion.h3
                        layoutId={`title-${active.id}-${id}`}
                        className="font-semibold text-foreground"
                      >
                        {active.title}
                      </motion.h3>
                      {active.badge && (
                        <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", badgeClasses(active.badgeVariant))}>
                          {active.badge}
                        </span>
                      )}
                    </div>
                    <motion.p
                      layoutId={`description-${active.id}-${id}`}
                      className="text-sm text-muted-foreground"
                    >
                      {active.description}
                    </motion.p>
                  </div>
                </div>

                {active.ctaHref && (
                  <motion.a
                    layoutId={`cta-${active.id}-${id}`}
                    href={active.ctaHref}
                    className="transition-smooth shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                  >
                    {active.ctaText}
                  </motion.a>
                )}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-4 overflow-auto px-5 pb-6 text-sm text-muted-foreground [scrollbar-width:none] [-ms-overflow-style:none]"
              >
                {active.content}
              </motion.div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <motion.li
            layoutId={`card-${item.id}-${id}`}
            key={item.id}
            onClick={() => setActive(item)}
            className="transition-smooth flex cursor-pointer items-center justify-between gap-4 rounded-2xl p-4 hover:bg-muted"
          >
            <div className="flex items-center gap-3">
              <motion.div
                layoutId={`icon-${item.id}-${id}`}
                className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"
              >
                {item.icon}
              </motion.div>
              <div>
                <motion.h3
                  layoutId={`title-${item.id}-${id}`}
                  className="font-medium text-foreground"
                >
                  {item.title}
                </motion.h3>
                <motion.p
                  layoutId={`description-${item.id}-${id}`}
                  className="text-sm text-muted-foreground"
                >
                  {item.description}
                </motion.p>
              </div>
            </div>
            {item.badge && (
              <motion.span
                layoutId={item.ctaHref ? `cta-${item.id}-${id}` : undefined}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold",
                  badgeClasses(item.badgeVariant)
                )}
              >
                {item.badge}
              </motion.span>
            )}
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
