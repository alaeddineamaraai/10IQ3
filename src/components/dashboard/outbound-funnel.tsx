import type { DashboardStats } from "@/lib/types/dashboard";

export function OutboundFunnel({ stats }: { stats: DashboardStats }) {
  const max = Math.max(stats.sent, 1);

  // Always compute rates relative to sent to avoid misleading
  // edge cases (e.g. 100% reply rate when opened=0 due to tracking gaps).
  const openPct  = stats.sent  > 0 ? (stats.opened  / stats.sent)  * 100 : null;
  const replyPct = stats.sent  > 0 ? (stats.replied / stats.sent)  * 100 : null;

  const stages = [
    { label: "Sent",    value: stats.sent,    pct: null,     hint: null,      color: "var(--chart-1)" },
    { label: "Opened",  value: stats.opened,  pct: openPct,  hint: "of sent", color: "var(--chart-4)" },
    { label: "Replied", value: stats.replied, pct: replyPct, hint: "of sent", color: "var(--chart-2)" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {stages.map((stage) => (
        <div key={stage.label} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">{stage.label}</span>
            <span className="text-muted-foreground">
              {stage.value}
              {stage.pct != null && (
                <span className="ml-1.5 text-xs">
                  ({stage.pct.toFixed(0)}% {stage.hint})
                </span>
              )}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="bar-fill h-full rounded-full transition-smooth"
              style={{
                width: `${Math.max((stage.value / max) * 100, stage.value > 0 ? 4 : 0)}%`,
                backgroundImage: `linear-gradient(90deg, ${stage.color}, color-mix(in srgb, ${stage.color} 72%, white))`,
              }}
            />
          </div>
        </div>
      ))}

      <p className="mt-1 text-[11px] text-muted-foreground/60">
        Benchmarks: ~40% open rate · ~8% reply rate
      </p>
    </div>
  );
}
