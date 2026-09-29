import { useState, useCallback, useEffect } from "react";

const KEY = "portfolio.theme";

// Reflects the theme applied to <html data-theme>. The initial value is set
// before React mounts by an inline script in index.html (avoids a flash), so
// here we just read it back and keep it in sync on toggle.
export function useTheme() {
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute("data-theme") || "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* ignore private-mode write errors */
    }
  }, [theme]);

  const toggle = useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    []
  );

  // Set an explicit theme; ignores unknown values.
  const set = useCallback((next) => {
    if (next === "dark" || next === "light") setTheme(next);
  }, []);

  return { theme, toggle, set };
}
