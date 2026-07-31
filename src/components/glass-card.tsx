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

/**
 * Flat surface card. The name is historical — this used to render
 * glassmorphism, and every page imports it under these names, so the API is
 * kept stable while the visual treatment moved to solid fills + soft shadows.
 *
 * `strong` is now a no-op modifier retained for call-site compatibility;
 * there is only one card weight in the flat system. `accent` fills the card
 * with the theme accent for the one hero stat per group.
 */
function GlassCard({
  className,
  strong: _strong,
  accent,
  ...props
}: React.ComponentProps<"div"> & { strong?: boolean; accent?: boolean }) {
  return (
    <Card
      className={cn(
        "transition-smooth ring-0",
        accent ? "surface-card-accent" : "surface-card",
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
