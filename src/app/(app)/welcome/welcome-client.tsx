"use client";

import { useEffect } from "react";

import { useTour } from "@/components/welcome/tour-context";

/** Landing at /welcome kicks off the hybrid product tour. The tour overlay and
 * state live in the (app) layout's TourRoot, so the tour keeps running as it
 * navigates through the real app pages after this route unmounts. */
export function WelcomeClient() {
  const { start } = useTour();
  useEffect(() => {
    start();
  }, [start]);
  return null;
}
