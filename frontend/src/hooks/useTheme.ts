import { useCallback, useEffect, useState } from "react";
import {
  applyTheme,
  getStoredTheme,
  getSystemTheme,
  setTheme,
  type Theme,
} from "@/lib/theme";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    return getStoredTheme() ?? getSystemTheme();
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (!getStoredTheme()) {
        const next = media.matches ? "dark" : "light";
        setThemeState(next);
        applyTheme(next);
      }
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === "dark" ? "light" : "dark";
      setTheme(next);
      return next;
    });
  }, []);

  const setThemePreference = useCallback((next: Theme) => {
    setTheme(next);
    setThemeState(next);
  }, []);

  return {
    theme,
    setTheme: setThemePreference,
    toggleTheme,
    isDark: theme === "dark",
  };
}
