import React, { useEffect } from "react";

export const useOutsideClick = (
  ref: React.RefObject<HTMLDivElement | null>,
  callback: (event: MouseEvent | TouchEvent) => void
) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      callback(event);
    };

    // Delay by one frame so the touchstart/mousedown that triggered the
    // modal to open is already processed and won't immediately close it.
    let rafId: number;
    let unlisten: (() => void) | undefined;
    rafId = requestAnimationFrame(() => {
      document.addEventListener("mousedown", listener);
      document.addEventListener("touchstart", listener, { passive: true });
      unlisten = () => {
        document.removeEventListener("mousedown", listener);
        document.removeEventListener("touchstart", listener);
      };
    });

    return () => {
      cancelAnimationFrame(rafId);
      unlisten?.();
    };
  }, [ref, callback]);
};
