"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates a stat value counting up when it scrolls into view.
 * Handles formatted values like "1,800+", "10k+", "$0" — the numeric part
 * animates, prefix/suffix render as-is. Non-numeric values render statically.
 */
export function CountUp({ value, duration = 1200 }: { value: string; duration?: number }) {
  const parsed = value.match(/^([^0-9]*)([\d,]+)(.*)$/);
  // Only animate meaningful magnitudes — "D1" or "$0" counting up looks broken
  const match =
    parsed && parseInt(parsed[2].replace(/,/g, ""), 10) >= 10 ? parsed : null;
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(match ? "0" : value);
  const started = useRef(false);

  useEffect(() => {
    if (!match || !ref.current) return;
    const target = parseInt(match[2].replace(/,/g, ""), 10);
    const el = ref.current;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started.current) return;
        started.current = true;
        observer.disconnect();

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || target === 0) {
          setDisplay(match[2]);
          return;
        }

        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(Math.round(target * eased).toLocaleString("en-US"));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!match) return <span>{value}</span>;

  return (
    <span ref={ref} className="tabular-nums">
      {match[1]}
      {display}
      {match[3]}
    </span>
  );
}
