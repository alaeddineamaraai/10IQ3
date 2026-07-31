import type { DashboardStats } from "@/lib/types/dashboard";

const R = 78;
const CX = 100;
const CY = 96;
const ARC_LENGTH = Math.PI * R;
/** Semicircle, left to right over the top. */
const ARC_PATH = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;

type Segment = { label: string; value: number; fill: string; hatched?: boolean };

/**
 * Semicircular gauge summarising what happened to everything sent: replied,
 * opened-but-silent, and still-waiting. The headline figure is reply rate,
 * since that's the number that actually matters for recruiting.
 */
export function ProgressGauge({ stats }: { stats: DashboardStats }) {
  const sent = stats.sent;
  const replied = stats.replied;
  const openedOnly = Math.max(stats.opened - replied, 0);
  const silent = Math.max(sent - replied - openedOnly, 0);

  const replyRate = sent > 0 ? (replied / sent) * 100 : 0;

  const segments: Segment[] = [
    { label: "Replied", value: replied, fill: "var(--chart-1)" },
    { label: "Opened", value: openedOnly, fill: "var(--chart-2)" },
    { label: "No response", value: silent, fill: "transparent", hatched: true },
  ];

  // Lay the segments end to end around the arc. Caps are butt, not round —
  // a round cap on a 22px stroke adds ~11px past each end, which makes short
  // segments overrun their neighbours. A small gap separates them instead.
  const GAP = 4;
  let consumed = 0;
  const drawn = segments.map((seg) => {
    const fraction = sent > 0 ? seg.value / sent : 0;
    const full = fraction * ARC_LENGTH;
    const offset = consumed;
    consumed += full;
    // Trim the gap off the drawn length, but never below zero.
    return { ...seg, length: Math.max(full - GAP, 0), offset };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-[240px]">
        <svg viewBox="0 0 200 112" className="w-full overflow-visible">
          <defs>
            <pattern
              id="gauge-hatch"
              width="6"
              height="6"
              patternTransform="rotate(-45)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--hatch)" strokeWidth="2.5" />
            </pattern>
          </defs>

          {/* Base track — also the empty state when nothing has been sent */}
          <path
            d={ARC_PATH}
            fill="none"
            stroke="url(#gauge-hatch)"
            strokeWidth="22"
            strokeLinecap="round"
          />

          {sent > 0 &&
            drawn.map((seg) =>
              seg.hatched || seg.length <= 0 ? null : (
                <path
                  key={seg.label}
                  d={ARC_PATH}
                  fill="none"
                  stroke={seg.fill}
                  strokeWidth="22"
                  strokeLinecap="butt"
                  strokeDasharray={`${seg.length} ${ARC_LENGTH}`}
                  strokeDashoffset={-seg.offset}
                />
              )
            )}
        </svg>

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <span className="text-3xl font-semibold tabular-nums">
            {replyRate.toFixed(0)}%
          </span>
          <span className="text-xs text-muted-foreground">Reply rate</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <span
              className={seg.hatched ? "fill-hatch size-2.5 rounded-full" : "size-2.5 rounded-full"}
              style={seg.hatched ? undefined : { background: seg.fill }}
            />
            <span className="text-xs text-muted-foreground">
              {seg.label}
              <span className="ml-1 font-medium tabular-nums text-foreground">{seg.value}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
