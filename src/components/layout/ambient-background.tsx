"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

export function AmbientBackground() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    function onMouseMove(e: MouseEvent) {
      targetX = e.clientX;
      targetY = e.clientY;
    }

    function tick() {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${currentX - 250}px, ${currentY - 250}px, 0)`;
      }
      frame = requestAnimationFrame(tick);
    }

    window.addEventListener("mousemove", onMouseMove);
    frame = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      <div className="bg-noise absolute inset-0 opacity-60" />

      <div
        ref={glowRef}
        className="absolute h-[600px] w-[600px] rounded-full opacity-40 blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, var(--brand) 0%, transparent 70%)",
        }}
      />

      <div
        className={cn(
          "pointer-events-none absolute -inset-[10px] overflow-hidden opacity-50 blur-[40px] will-change-transform",
          "[mask-image:radial-gradient(ellipse_at_50%_0%,black_30%,transparent_75%)]"
        )}
        style={{
          backgroundImage:
            "repeating-linear-gradient(100deg, var(--chart-1) 10%, var(--chart-4) 15%, var(--chart-3) 20%, var(--chart-5) 25%, var(--chart-2) 30%)",
          backgroundSize: "200% 100%",
          animation: "aurora 60s linear infinite",
        }}
      />
    </div>
  );
}
