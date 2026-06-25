import * as React from "react";

import { cn } from "@/lib/utils";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function GlassCard({
  className,
  strong,
  ...props
}: React.ComponentProps<"div"> & { strong?: boolean }) {
  return (
    <Card
      className={cn(
        "transition-smooth ring-0",
        strong ? "glass-card-strong" : "glass-card",
        className
      )}
      {...props}
    />
  );
}

export {
  GlassCard,
  CardHeader as GlassCardHeader,
  CardTitle as GlassCardTitle,
  CardDescription as GlassCardDescription,
  CardAction as GlassCardAction,
  CardContent as GlassCardContent,
  CardFooter as GlassCardFooter,
};
