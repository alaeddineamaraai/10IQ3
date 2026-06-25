import type { DashboardStats } from "@/lib/types/dashboard";

export function OutboundFunnel({ stats }: { stats: DashboardStats }) {
  const stages = [
    { label: "Sent", value: stats.sent },
    { label: "Opened", value: stats.opened },
    { label: "Replied", value: stats.replied },
  ];
  const max = Math.max(stats.sent, 1);

  return (
    <div className="flex flex-col gap-3">
      {stages.map((stage) => (
        <div key={stage.label} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">{stage.label}</span>
            <span className="text-muted-foreground">{stage.value}</span>
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
