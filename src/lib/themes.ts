export const THEMES = [
  { id: "white", label: "Light",  bg: "#f4f4f4", accent: "#197a48", premium: false },
  { id: "dark",  label: "Dark",   bg: "#0f1a11", accent: "#2dd072", premium: false },
  { id: "black", label: "Black",  bg: "#0b0b0b", accent: "#2dd072", premium: false },
  { id: "beige", label: "Beige",  bg: "#f2ecdd", accent: "#b8863f", premium: true  },
  { id: "brown", label: "Brown",  bg: "#2e2a24", accent: "#d9bd93", premium: true  },
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
