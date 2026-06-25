import { Progress } from "@/components/ui/progress";
import type { DashboardRates } from "@/lib/types/dashboard";

export function PerformanceMetrics({ rates }: { rates: DashboardRates }) {
  const metrics = [
    { label: "Sent rate", value: rates.sentRate, hint: "of all coaches" },
    { label: "Open rate", value: rates.openRate, hint: "of emails sent" },
    { label: "Reply rate", value: rates.replyRate, hint: "of emails sent" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {metrics.map((metric) => (
        <div key={metric.label} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">{metric.label}</span>
            <span className="text-muted-foreground">
              {metric.value.toFixed(1)}%{" "}
              <span className="text-xs">{metric.hint}</span>
            </span>
          </div>
          <Progress value={Math.min(metric.value, 100)} />
        </div>
      ))}
    </div>
  );
}
