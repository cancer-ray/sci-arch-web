import { createContext, useContext, useEffect, useState } from "react";

// Curated accent palette. "cobalt" is the default and needs no CSS override
// (see index.css) since it matches the base --primary/--ring values.
export const ACCENTS = [
  { id: "cobalt", label: "Cobalt", swatch: "hsl(224, 76%, 40%)" },
  { id: "forest", label: "Forest", swatch: "hsl(152, 48%, 30%)" },
  { id: "clay", label: "Clay", swatch: "hsl(14, 58%, 42%)" },
  { id: "plum", label: "Plum", swatch: "hsl(280, 38%, 42%)" },
  { id: "crimson", label: "Crimson", swatch: "hsl(352, 60%, 38%)" },
  { id: "amber", label: "Amber", swatch: "hsl(38, 70%, 38%)" },
  { id: "teal", label: "Teal", swatch: "hsl(180, 45%, 32%)" },
  { id: "indigo", label: "Indigo", swatch: "hsl(243, 45%, 45%)" },
  { id: "rose", label: "Rose", swatch: "hsl(340, 50%, 45%)" },
  { id: "olive", label: "Olive", swatch: "hsl(72, 35%, 32%)" },
];

const ThemeContext = createContext({
  theme: "light",
  toggle: () => {},
  accent: "cobalt",
  setAccent: () => {},
  lightweight: false,
  setLightweight: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage.getItem("sciarch_theme");
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const [accent, setAccent] = useState(() => {
    if (typeof window === "undefined") return "cobalt";
    const stored = window.localStorage.getItem("sciarch_accent");
    return ACCENTS.some((a) => a.id === stored) ? stored : "cobalt";
  });

  const [lightweight, setLightweight] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("sciarch_lightweight") === "1";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    window.localStorage.setItem("sciarch_theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.accent = accent;
    window.localStorage.setItem("sciarch_accent", accent);
  }, [accent]);

  useEffect(() => {
    window.localStorage.setItem("sciarch_lightweight", lightweight ? "1" : "0");
  }, [lightweight]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggle, accent, setAccent, lightweight, setLightweight }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
