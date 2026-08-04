"use client";

import { useEffect, useState } from "react";

/**
 * Animates a stat value counting up when it scrolls into view.
 * Handles formatted values like "1,800+", "10k+", "$0" — the numeric part
 * animates, prefix/suffix render as-is. Non-numeric values render statically.
 */
export function CountUp({ value, duration = 1200 }: { value: string; duration?: number }) {
  const parsed = value.match(/^([^0-9]*)([\d,]+)(.*)$/);
  // Only animate whole-number values >= 10 — decimals (e.g. "13.2") split
  // incorrectly (integer animated, ".2" becomes a static suffix that makes
  // the counter start at "0.2"), so skip animation for those.
  const hasDecimal = parsed ? parsed[3].startsWith(".") : false;
  const match =
    parsed && !hasDecimal && parseInt(parsed[2].replace(/,/g, ""), 10) >= 10 ? parsed : null;
  const [display, setDisplay] = useState(match ? "0" : value);

  useEffect(() => {
    if (!match) return;
    const target = parseInt(match[2].replace(/,/g, ""), 10);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || target === 0) {
      setDisplay(match[2]);
      return;
    }

    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(target * eased).toLocaleString("en-US"));
      if (t < 1) { raf = requestAnimationFrame(tick); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!match) return <span>{value}</span>;

  return (
    <span className="tabular-nums">
      {match[1]}
      {display}
      {match[3]}
    </span>
  );
}
