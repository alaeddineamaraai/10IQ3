import Link from "next/link";

export function EmailQuotaBar({
  used,
  limit,
}: {
  used: number;
  limit: number;
}) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const left = Math.max(0, limit - used);
  const isExhausted = used >= limit;

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {isExhausted ? "Free email limit reached" : `${used} of ${limit} free emails used`}
        </span>
        <Link
          href="/paywall"
          className="text-xs font-semibold text-primary hover:underline"
        >
          Upgrade to Pro →
        </Link>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: isExhausted ? "hsl(var(--destructive))" : pct >= 80 ? "#f59e0b" : "hsl(var(--primary))",
          }}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {isExhausted
          ? "Upgrade to Pro for unlimited emails to every coach in the database."
          : `${left} email${left === 1 ? "" : "s"} remaining on the free plan.`}
      </p>
    </div>
  );
}
