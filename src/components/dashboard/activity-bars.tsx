"use client";

import { useState } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import type { ActivityPoint } from "@/lib/types/dashboard";

type Metric = "sent" | "opened" | "replied";

const METRICS: { key: Metric; label: string }[] = [
  { key: "sent", label: "Sent" },
  { key: "opened", label: "Opened" },
  { key: "replied", label: "Replied" },
];

/**
 * Seven-day column chart in the flat style: full-height rounded pill tracks,
 * filled proportionally. Days with no activity render as a hatched track
 * rather than an empty gap, so the week always reads as a complete row.
 */
export function ActivityBars({ data }: { data: ActivityPoint[] }) {
  const [metric, setMetric] = useState<Metric>("sent");
  const [hovered, setHovered] = useState<number | null>(null);

  const values = data.map((d) => Number(d[metric] ?? 0));
  const max = Math.max(...values, 1);
  const total = values.reduce((sum, v) => sum + v, 0);

  // Default the callout to the best day so the chart is never inert.
  const peakIndex = values.indexOf(Math.max(...values));
  const activeIndex = hovered ?? (total > 0 ? peakIndex : null);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-1.5">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={cn(
              "touch-manipulation select-none rounded-full px-3 py-1 text-[11px] font-medium transition-smooth",
              metric === m.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex h-[210px] items-end gap-2 sm:gap-3">
        {data.map((point, i) => {
          const value = values[i];
          const isActive = activeIndex === i;
          const share = total > 0 ? Math.round((value / total) * 100) : 0;
          // Floor the visible fill so a non-zero day is never invisible.
          const heightPct = value > 0 ? Math.max((value / max) * 100, 8) : 0;

          return (
            <div
              key={point.label}
              className="group flex h-full flex-1 flex-col items-center gap-2"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="relative flex w-full flex-1 items-end justify-center">
                {isActive && value > 0 && (
                  <div className="absolute -top-1 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-1.5 py-0.5 text-[10px] font-semibold tabular-nums shadow-[var(--shadow-card)]">
                    {share}%
                  </div>
                )}

                {/* Track — hatched, always full height */}
                <div className="fill-hatch relative flex h-full w-full max-w-[46px] items-end overflow-hidden rounded-full">
                  {/* Fill */}
                  {value > 0 && (
                    <div
                      className="bar-fill-y w-full rounded-full transition-smooth"
                      style={{
                        height: `${heightPct}%`,
                        background: isActive
                          ? "var(--chart-1)"
                          : "color-mix(in srgb, var(--chart-1) 55%, transparent)",
                      }}
                    />
                  )}
                </div>
              </div>

              <span
                className={cn(
                  "text-[10px] tabular-nums transition-smooth",
                  isActive ? "font-semibold text-foreground" : "text-muted-foreground"
                )}
              >
                {point.label.slice(0, 3)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold tabular-nums">{total}</span>
          <span className="text-xs text-muted-foreground">
            {METRICS.find((m) => m.key === metric)?.label.toLowerCase()} in the last 7 days
          </span>
        </div>
        {total === 0 && (
          <Link href="/compose" className="text-xs font-medium text-primary transition-colors hover:underline">
            Send first email →
          </Link>
        )}
      </div>
    </div>
  );
}
