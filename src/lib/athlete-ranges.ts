const CURRENT_YEAR = new Date().getFullYear();

export type AthleteNumericField = "grad_year" | "gpa" | "utr" | "wtn" | "rank";

// Real-world bounds for each stat — UTR tops out at 16, WTN at 40, GPA is
// on a standard (occasionally weighted) 0-5 scale, grad years only make
// sense a few years out. Shared by onboarding and profile edit so the two
// forms can't drift apart.
export const ATHLETE_RANGES: Record<AthleteNumericField, { min: number; max: number }> = {
  grad_year: { min: CURRENT_YEAR, max: CURRENT_YEAR + 6 },
  gpa: { min: 0, max: 5 },
  utr: { min: 1, max: 16 },
  wtn: { min: 1, max: 40 },
  rank: { min: 1, max: 10000 },
};

export const REGIONS = ["Northeast", "Southeast", "Midwest", "Southwest", "West", "No preference"];

export function clampToRange(field: AthleteNumericField, value: number): number {
  const { min, max } = ATHLETE_RANGES[field];
  return Math.min(max, Math.max(min, value));
}

export function rangeHint(field: AthleteNumericField): string {
  const { min, max } = ATHLETE_RANGES[field];
  if (field === "gpa") return `${min.toFixed(1)}–${max.toFixed(1)}`;
  return `${min}–${max}`;
}
