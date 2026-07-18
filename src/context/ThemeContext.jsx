import { createContext, useContext, useEffect, useState } from "react";

// Theme preference: "light" | "dark" | "system". The chosen value persists in
// localStorage; "system" tracks the OS setting live via matchMedia. The .dark
// class on <html> drives the CSS-variable overrides in index.css (an inline
// script in index.html applies it before first paint to avoid a flash).
const ThemeContext = createContext(null);
const STORAGE_KEY = "tendly-theme";

function applyTheme(theme) {
  const dark =
    theme === "dark" ||
    (theme !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEY) || "system");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
