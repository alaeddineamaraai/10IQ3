export const THEMES = [
  { id: "beige", label: "Beige", bg: "#eae4d3", accent: "#26211a" },
  { id: "dark",  label: "Brown", bg: "#2e2a24", accent: "#ece5d3" },
  { id: "blue",  label: "Blue",  bg: "#0d1625", accent: "#6aacf5" },
  { id: "black", label: "Black", bg: "#080808", accent: "#e5e5e5" },
  { id: "white", label: "White", bg: "#f8f8f8", accent: "#111111" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export function applyTheme(setTheme: (id: string) => void, id: ThemeId) {
  document.documentElement.classList.add("theme-transition");
  setTheme(id);
  window.setTimeout(
    () => document.documentElement.classList.remove("theme-transition"),
    450
  );
}
