"use client";

import { Check, X } from "lucide-react";

import { PASSWORD_RULES } from "@/lib/password";
import { cn } from "@/lib/utils";

export function PasswordRequirements({ password }: { password: string }) {
  return (
    <ul className="flex flex-col gap-1 pt-1">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <li
            key={rule.key}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-smooth",
              met ? "text-primary" : "text-muted-foreground"
            )}
          >
            {met ? <Check className="size-3 shrink-0" /> : <X className="size-3 shrink-0" />}
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
