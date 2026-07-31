export const THEMES = [
  { id: "white", label: "Light", bg: "#f4f4f4", accent: "#197a48" },
  { id: "beige", label: "Beige", bg: "#f2ecdd", accent: "#b8863f" },
  { id: "dark",  label: "Brown", bg: "#2e2a24", accent: "#d9bd93" },
  { id: "blue",  label: "Blue",  bg: "#0d1625", accent: "#6aacf5" },
  { id: "black", label: "Black", bg: "#0b0b0b", accent: "#e5e5e5" },
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
