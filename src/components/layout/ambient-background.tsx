"use client";

import { useEffect, useRef } from "react";

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
        className="absolute h-[500px] w-[500px] rounded-full opacity-30 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, var(--brand) 0%, transparent 70%)",
        }}
      />

      <div
        className="absolute -left-32 top-20 h-[420px] w-[420px] rounded-full opacity-25 blur-[90px]"
        style={{
          background:
            "radial-gradient(circle, var(--brand) 0%, transparent 70%)",
          animation: "orb-drift-1 26s ease-in-out infinite",
        }}
      />
      <div
        className="absolute right-[-10%] top-[10%] h-[380px] w-[380px] rounded-full opacity-20 blur-[90px]"
        style={{
          background: "radial-gradient(circle, #7aa6f8 0%, transparent 70%)",
          animation: "orb-drift-2 32s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-[-10%] left-[30%] h-[460px] w-[460px] rounded-full opacity-20 blur-[100px]"
        style={{
          background: "radial-gradient(circle, #a9c5fb 0%, transparent 70%)",
          animation: "orb-drift-3 38s ease-in-out infinite",
        }}
      />
    </div>
  );
}
