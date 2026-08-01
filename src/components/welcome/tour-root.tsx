"use client";

import { TourProvider } from "./tour-context";

export function TourRoot({ children }: { children: React.ReactNode }) {
  return <TourProvider>{children}</TourProvider>;
}
