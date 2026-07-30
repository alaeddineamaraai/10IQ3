"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="black"
      enableSystem={false}
      themes={["beige", "dark", "blue", "black", "white"]}
    >
      {children}
    </NextThemesProvider>
  );
}
