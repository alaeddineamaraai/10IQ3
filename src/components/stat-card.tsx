import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { CountUp } from "@/components/count-up";

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: { value: string; positive?: boolean };
  cta?: { label: string; href: string };
  /** Small caption under the figure when there's no trend or CTA. */
  caption?: string;
  /** Target for the corner arrow. Falls back to `cta.href`. */
  href?: string;
  /** Fills the card with the theme accent — use for one hero stat per row. */
  featured?: boolean;
  accent?: string;
  className?: string;
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  cta,
  caption,
  href,
  featured,
  accent,
  className,
}: StatCardProps) {
  const arrowHref = href ?? cta?.href;

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between gap-4 p-4 transition-smooth",
        featured
          ? "surface-card-accent"
          : "surface-card hover:shadow-[var(--shadow-card-hover)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "text-sm font-medium",
            featured ? "text-primary-foreground/90" : "text-foreground/80"
          )}
        >
          {label}
        </span>

        {arrowHref ? (
          <Link
            href={arrowHref}
            aria-label={`${label} — view details`}
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full border transition-smooth group-hover:scale-105",
              featured
                ? "border-white/35 bg-white/15 text-primary-foreground hover:bg-white/25"
                : "border-border text-muted-foreground hover:border-foreground/25 hover:text-foreground"
            )}
          >
            <ArrowUpRight className="size-3.5" />
          </Link>
        ) : (
          Icon && (
            <div
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full",
                featured ? "bg-white/15 text-primary-foreground" : "text-muted-foreground"
              )}
              style={!featured && accent ? { color: accent } : undefined}
            >
              <Icon className="size-4" />
            </div>
          )
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span
          className={cn(
            "text-3xl font-semibold tracking-tight tabular-nums",
            featured && "text-primary-foreground"
          )}
        >
          <CountUp value={String(value)} duration={900} />
        </span>

        {trend ? (
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                featured
                  ? "bg-white/20 text-primary-foreground"
                  : trend.positive
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {trend.positive ? "▲" : "▼"} {trend.value}
            </span>
            <span
              className={cn(
                "truncate text-xs",
                featured ? "text-primary-foreground/80" : "text-muted-foreground"
              )}
            >
              {trend.positive ? "up from last month" : "from last month"}
            </span>
          </div>
        ) : cta ? (
          <Link
            href={cta.href}
            className={cn(
              "text-xs font-medium transition-smooth hover:underline",
              featured ? "text-primary-foreground/90" : "text-primary"
            )}
          >
            {cta.label}
          </Link>
        ) : caption ? (
          <span
            className={cn(
              "text-xs",
              featured ? "text-primary-foreground/80" : "text-muted-foreground"
            )}
          >
            {caption}
          </span>
        ) : null}
      </div>
    </div>
  );
}
