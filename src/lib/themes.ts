export const THEMES = [
  { id: "white", label: "Light", bg: "#f4f4f4", accent: "#197a48", premium: false },
  { id: "dark",  label: "Dark",  bg: "#000000", accent: "#197a48", premium: false },
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
