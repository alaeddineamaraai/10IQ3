import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { GlassCard, GlassCardContent } from "@/components/glass-card";

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: { value: string; positive?: boolean };
  cta?: { label: string; href: string };
  accent?: string;
  className?: string;
};

export function StatCard({ label, value, icon: Icon, trend, cta, accent, className }: StatCardProps) {
  const iconStyle = accent
    ? { backgroundColor: `${accent}18`, color: accent }
    : undefined;
  const valueStyle = accent ? { color: accent } : undefined;

  return (
    <GlassCard className={cn("p-0", className)}>
      <GlassCardContent className="flex items-center justify-between gap-4 px-5 py-5">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <span className="text-2xl font-semibold tracking-tight" style={valueStyle}>{value}</span>
          {trend && (
            <span
              className={cn(
                "text-xs font-medium",
                trend.positive ? "text-emerald-600" : "text-muted-foreground"
              )}
            >
              {trend.value}
            </span>
          )}
          {cta && (
            <a
              href={cta.href}
              className="mt-0.5 text-xs font-medium hover:underline"
              style={{ color: accent ?? "var(--primary)" }}
            >
              {cta.label}
            </a>
          )}
        </div>
        {Icon && (
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
            style={iconStyle}
          >
            <Icon className="size-5" />
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}
