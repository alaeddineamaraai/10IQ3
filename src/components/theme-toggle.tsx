"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import { THEMES, applyTheme, type ThemeId } from "@/lib/themes";

interface ThemeToggleProps {
  className?: string;
  /** compact: colored dots in a pill (default). grid: labeled swatches. */
  variant?: "compact" | "grid";
  /** Current user plan — premium themes are locked for "free" users. */
  plan?: string;
}

/** Theme picker — compact pill for nav/header, labeled grid for settings. */
export function ThemeToggle({ className, variant = "compact", plan }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return variant === "grid"
      ? <div className={cn("h-14 w-full", className)} aria-hidden />
      : <div className={cn("h-8 w-52", className)} aria-hidden />;
  }

  const active = resolvedTheme as ThemeId | undefined;
  const isPaid = plan && plan !== "free";

  if (variant === "grid") {
    return (
      <div
        className={cn("flex flex-wrap gap-2", className)}
        role="group"
        aria-label="Color theme"
      >
        {THEMES.map((t) => {
          const isActive = active === t.id;
          const locked = t.premium && !isPaid;
          return locked ? (
            <Link
              key={t.id}
              href="/paywall"
              title="Upgrade to unlock"
              className={cn(
                "relative flex flex-col items-center gap-1.5 rounded-xl px-3 py-2 opacity-60 transition-smooth hover:opacity-80"
              )}
            >
              <div className="relative size-7">
                <div
                  className="size-7 rounded-full border border-black/10"
                  style={{ backgroundColor: t.bg }}
                />
                <Lock className="absolute -bottom-0.5 -right-0.5 size-3 text-muted-foreground" />
              </div>
              <span className="text-xs font-medium">{t.label}</span>
            </Link>
          ) : (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTheme(setTheme, t.id)}
              aria-pressed={isActive}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl px-3 py-2 transition-smooth",
                isActive
                  ? "bg-[var(--glass-bg-strong)] ring-1 ring-[var(--glass-border)] shadow-sm"
                  : "hover:bg-[var(--glass-bg)]"
              )}
            >
              <div
                className="size-7 rounded-full border border-black/10"
                style={{ backgroundColor: t.bg }}
              />
              <span className="text-xs font-medium">{t.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-8 items-center gap-0.5 rounded-full border p-0.5 backdrop-blur-xl",
        className
      )}
      style={{ borderColor: "var(--glass-border)", backgroundColor: "var(--glass-bg)" }}
      role="group"
      aria-label="Color theme"
    >
      {THEMES.map((t) => {
        const isActive = active === t.id;
        const locked = t.premium && !isPaid;
        const inner = (
          <div className="relative">
            <div
              className="size-3.5 rounded-full border border-black/10"
              style={{ backgroundColor: t.bg }}
            />
            {locked && <Lock className="absolute -bottom-0.5 -right-0.5 size-2.5 text-muted-foreground" />}
          </div>
        );
        return locked ? (
          <Link
            key={t.id}
            href="/paywall"
            title={`${t.label} — upgrade to unlock`}
            className="flex h-7 w-7 items-center justify-center rounded-full opacity-55 transition-smooth hover:opacity-80"
          >
            {inner}
          </Link>
        ) : (
          <button
            key={t.id}
            type="button"
            title={t.label}
            onClick={() => applyTheme(setTheme, t.id)}
            aria-pressed={isActive}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full transition-smooth",
              isActive ? "bg-[var(--glass-bg-strong)] shadow-sm" : "hover:bg-[var(--glass-bg-strong)]/50"
            )}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
}
