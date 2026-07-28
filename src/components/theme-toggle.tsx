"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

/** Pill-shaped light/dark switch, styled like the glass dock. */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Render a placeholder until mounted so SSR markup matches the client
  if (!mounted) {
    return <div className={cn("h-8 w-[104px]", className)} aria-hidden />;
  }

  const isDark = resolvedTheme === "dark";

  function switchTheme(next: "light" | "dark") {
    document.documentElement.classList.add("theme-transition");
    setTheme(next);
    window.setTimeout(
      () => document.documentElement.classList.remove("theme-transition"),
      450
    );
  }

  return (
    <div
      className={cn(
        "flex h-8 items-center gap-0.5 rounded-full border border-glass-border bg-[var(--glass-bg)] p-0.5 backdrop-blur-xl",
        className
      )}
      style={{ borderColor: "var(--glass-border)" }}
      role="group"
      aria-label="Color theme"
    >
      <button
        type="button"
        onClick={() => switchTheme("light")}
        aria-pressed={!isDark}
        className={cn(
          "flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-smooth",
          !isDark
            ? "bg-[var(--glass-bg-strong)] shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Sun className="size-3.5 text-amber-500" />
        <span className="hidden sm:inline">Light</span>
      </button>
      <button
        type="button"
        onClick={() => switchTheme("dark")}
        aria-pressed={isDark}
        className={cn(
          "flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-smooth",
          isDark
            ? "bg-[var(--glass-bg-strong)] shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Moon className="size-3.5 text-[#c4ab7e]" />
        <span className="hidden sm:inline">Dark</span>
      </button>
    </div>
  );
}
