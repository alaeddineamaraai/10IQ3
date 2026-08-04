import { cn } from "@/lib/utils";
import type { DashboardRates } from "@/lib/types/dashboard";

const BENCHMARKS: Record<string, { avg: number; label: string }> = {
  "Open rate":  { avg: 40, label: "avg ~40%" },
  "Reply rate": { avg: 8,  label: "avg ~8%"  },
};

function barClass(value: number, bench?: { avg: number }): string {
  if (value === 0) return "bg-muted-foreground/25";
  if (!bench) return "bg-primary";
  const ratio = value / bench.avg;
  if (ratio >= 0.8) return "bg-emerald-500";
  if (ratio >= 0.4) return "bg-amber-500";
  return "bg-red-400";
}

function contextHint(label: string, value: number, bench?: { avg: number }): string | null {
  if (value === 0) {
    if (label === "Sent rate") return "Contact coaches to see this metric";
    return "Will populate once you send emails";
  }
  if (bench && value < bench.avg * 0.5) {
    return "Below average — try personalizing your subject line";
  }
  if (bench && value >= bench.avg) {
    return "At or above benchmark — great work";
  }
  return null;
}

export function PerformanceMetrics({ rates }: { rates: DashboardRates }) {
  const metrics = [
    { label: "Sent rate",  value: rates.sentRate,  hint: "of available coaches" },
    { label: "Open rate",  value: rates.openRate,  hint: "of emails sent" },
    { label: "Reply rate", value: rates.replyRate, hint: "of emails sent" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {metrics.map((metric) => {
        const bench = BENCHMARKS[metric.label];
        const hint = contextHint(metric.label, metric.value, bench);
        return (
          <div key={metric.label} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium">{metric.label}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-muted-foreground">
                  {metric.value.toFixed(1)}%{" "}
                  <span className="text-xs">{metric.hint}</span>
                </span>
                {bench && (
                  <span className="text-[11px] text-muted-foreground/50">{bench.label}</span>
                )}
              </div>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", barClass(metric.value, bench))}
                style={{ width: `${Math.min(metric.value, 100)}%` }}
              />
              {bench && (
                <div
                  className="absolute top-0 h-full w-px bg-muted-foreground/30"
                  style={{ left: `${Math.min(bench.avg, 100)}%` }}
                />
              )}
            </div>
            {hint && (
              <p className={cn(
                "text-[11px]",
                metric.value > 0 && bench && metric.value >= bench.avg
                  ? "text-emerald-600 dark:text-emerald-400"
                  : metric.value > 0 && bench && metric.value < bench.avg * 0.5
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground"
              )}>
                {hint}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
