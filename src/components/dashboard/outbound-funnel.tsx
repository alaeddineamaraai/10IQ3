import type { DashboardStats } from "@/lib/types/dashboard";

function pct(value: number, of: number) {
  if (of <= 0) return null;
  return (value / of) * 100;
}

export function OutboundFunnel({ stats }: { stats: DashboardStats }) {
  const stages = [
    { label: "Sent", value: stats.sent, conversion: null },
    { label: "Opened", value: stats.opened, conversion: pct(stats.opened, stats.sent) },
    { label: "Replied", value: stats.replied, conversion: pct(stats.replied, stats.opened) },
  ];
  const max = Math.max(stats.sent, 1);

  return (
    <div className="flex flex-col gap-3">
      {stages.map((stage) => (
        <div key={stage.label} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">{stage.label}</span>
            <span className="text-muted-foreground">
              {stage.value}
              {stage.conversion != null && (
                <span className="ml-1.5 text-xs">
                  ({stage.conversion.toFixed(0)}% of {stage.label === "Opened" ? "sent" : "opened"})
                </span>
              )}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-smooth"
              style={{ width: `${Math.max((stage.value / max) * 100, stage.value > 0 ? 4 : 0)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
