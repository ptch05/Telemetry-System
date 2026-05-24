export type Theme = "light" | "dark";

const STORAGE_KEY = "fs-ev-theme";

export function getStoredTheme(): Theme | null {
  const value = localStorage.getItem(STORAGE_KEY);
  if (value === "light" || value === "dark") return value;
  return null;
}

export function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function resolveTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function setTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}

export function initTheme() {
  applyTheme(resolveTheme());
}
