"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export function DashboardPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-smooth mx-auto w-full max-w-3xl duration-700",
        visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      )}
      style={{ transitionDuration: "800ms" }}
    >
      {/* Laptop bezel */}
      <div className="glass-card-strong rounded-3xl p-3 pb-1">
        <div className="overflow-hidden rounded-2xl bg-background ring-1 ring-foreground/10">
          {/* Browser chrome */}
          <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
            <span className="size-2.5 rounded-full bg-red-400" />
            <span className="size-2.5 rounded-full bg-yellow-400" />
            <span className="size-2.5 rounded-full bg-green-400" />
          </div>

          {/* Mocked dashboard content */}
          <div className="flex flex-col gap-3 p-5">
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Coaches", value: "1,820" },
                { label: "Sent", value: "42" },
                { label: "Opened", value: "18" },
                { label: "Replied", value: "5" },
              ].map((stat) => (
                <div key={stat.label} className="glass-card rounded-xl px-3 py-2.5">
                  <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                  <div className="text-lg font-semibold">{stat.value}</div>
                </div>
              ))}
            </div>

            <div className="glass-card flex h-28 items-end gap-1.5 rounded-xl p-4">
              {[40, 65, 35, 80, 55, 70, 50].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm bg-primary/70 transition-smooth"
                  style={{ height: visible ? `${h}%` : "4%" }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Laptop base */}
      <div className="mx-auto h-3 w-2/3 rounded-b-xl bg-foreground/10" />
    </div>
  );
}
