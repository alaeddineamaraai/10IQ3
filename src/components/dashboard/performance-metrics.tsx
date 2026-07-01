import { Progress } from "@/components/ui/progress";
import type { DashboardRates } from "@/lib/types/dashboard";

const BENCHMARKS: Record<string, { avg: number; label: string }> = {
  "Open rate":  { avg: 40, label: "avg ~40%" },
  "Reply rate": { avg: 8,  label: "avg ~8%"  },
};

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
              <Progress value={Math.min(metric.value, 100)} className="h-full" />
              {bench && (
                <div
                  className="absolute top-0 h-full w-px bg-muted-foreground/30"
                  style={{ left: `${Math.min(bench.avg, 100)}%` }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
