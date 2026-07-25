"use client";

import { TourProvider } from "./tour-context";
import { AppTour } from "./app-tour";

/** Client boundary mounted in the (app) layout: provides tour state to every
 * page in the group and mounts the overlay that drives the real-app tour. */
export function TourRoot({ children }: { children: React.ReactNode }) {
  return (
    <TourProvider>
      {children}
      <AppTour />
    </TourProvider>
  );
}
