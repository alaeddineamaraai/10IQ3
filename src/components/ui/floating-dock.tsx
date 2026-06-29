"use client";
/**
 * Note: Use position fixed according to your needs
 * Desktop navbar is better positioned at the bottom
 * Mobile navbar is better positioned at bottom right.
 **/

import { cn } from "@/lib/utils";
import { IconLayoutNavbarCollapse } from "@tabler/icons-react";
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

import { useRef, useState } from "react";

export type FloatingDockItem = {
  title: string;
  icon: React.ReactNode;
  href: string;
  className?: string;
};

export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
  orientation = "horizontal",
}: {
  items: FloatingDockItem[];
  desktopClassName?: string;
  mobileClassName?: string;
  orientation?: "horizontal" | "vertical";
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} orientation={orientation} />
      <FloatingDockMobile items={items} className={mobileClassName} />
    </>
  );
};

const FloatingDockMobile = ({
  items,
  className,
}: {
  items: FloatingDockItem[];
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("relative block md:hidden", className)}>
      <AnimatePresence>
        {open && (
          <motion.div
            layoutId="nav"
            className="absolute inset-x-0 bottom-full mb-2 flex flex-col gap-2"
          >
            {items.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: 10,
                  transition: {
                    delay: idx * 0.05,
                  },
                }}
                transition={{ delay: (items.length - 1 - idx) * 0.05 }}
              >
                <a
                  href={item.href}
                  key={item.title}
                  className={cn(
                    "glass-card-strong flex h-10 w-10 items-center justify-center rounded-full",
                    item.className,
                  )}
                >
                  <div className="h-4 w-4">{item.icon}</div>
                </a>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen(!open)}
        className="glass-card-strong flex h-10 w-10 items-center justify-center rounded-full"
      >
        <IconLayoutNavbarCollapse className="h-5 w-5 text-muted-foreground" />
      </button>
    </div>
  );
};

const FloatingDockDesktop = ({
  items,
  className,
  orientation = "horizontal",
}: {
  items: FloatingDockItem[];
  className?: string;
  orientation?: "horizontal" | "vertical";
}) => {
  const mouse = useMotionValue(Infinity);
  const vertical = orientation === "vertical";

  return (
    <motion.div
      onMouseMove={(e) => mouse.set(vertical ? e.pageY : e.pageX)}
      onMouseLeave={() => mouse.set(Infinity)}
      className={cn(
        "hidden items-center gap-5 rounded-2xl md:flex",
        vertical ? "w-20 flex-col px-3 py-5" : "mx-auto h-16 items-end gap-4 px-4 pb-3",
        className,
      )}
    >
      {items.map((item) => (
        <IconContainer mouse={mouse} vertical={vertical} key={item.title} {...item} />
      ))}
    </motion.div>
  );
};

function IconContainer({
  mouse,
  vertical,
  title,
  icon,
  href,
  className,
}: {
  mouse: MotionValue;
  vertical: boolean;
  title: string;
  icon: React.ReactNode;
  href: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouse, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, y: 0, width: 0, height: 0 };
    const center = vertical ? bounds.y + bounds.height / 2 : bounds.x + bounds.width / 2;

    return val - center;
  });

  const widthTransform = useTransform(distance, [-150, 0, 150], [48, 96, 48]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [48, 96, 48]);

  const widthTransformIcon = useTransform(distance, [-150, 0, 150], [24, 48, 24]);
  const heightTransformIcon = useTransform(
    distance,
    [-150, 0, 150],
    [24, 48, 24],
  );

  const width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const widthIcon = useSpring(widthTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const heightIcon = useSpring(heightTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const [hovered, setHovered] = useState(false);

  return (
    <a href={href}>
      <motion.div
        ref={ref}
        style={{ width, height }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "relative flex aspect-square items-center justify-center rounded-full bg-foreground/5",
          className,
        )}
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={vertical ? { opacity: 0, x: 10, y: "-50%" } : { opacity: 0, y: 10, x: "-50%" }}
              animate={vertical ? { opacity: 1, x: 0, y: "-50%" } : { opacity: 1, y: 0, x: "-50%" }}
              exit={vertical ? { opacity: 0, x: 2, y: "-50%" } : { opacity: 0, y: 2, x: "-50%" }}
              className={cn(
                "absolute w-fit rounded-md border border-border bg-popover px-2 py-0.5 text-xs whitespace-pre text-popover-foreground",
                vertical ? "top-1/2 right-full mr-3" : "-top-8 left-1/2",
              )}
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className="flex items-center justify-center"
        >
          {icon}
        </motion.div>
      </motion.div>
    </a>
  );
}
