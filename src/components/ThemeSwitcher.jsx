"use client";

import { useEffect, useState } from "react";

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState("dark");
  const [mounted, setMounted] = useState(false);

  const applyTheme = (mode) => {
    document.documentElement.classList.remove("dark", "aquarium");
    document.documentElement.removeAttribute("data-theme");

    if (mode === "light") {
      // Light Mode (White & Gold)
      document.documentElement.setAttribute("data-theme", "light");
    } else if (mode === "aquarium") {
      // Aquarium Theme
      document.documentElement.setAttribute("data-theme", "aquarium");
      document.documentElement.classList.add("aquarium");
    } else {
      // Default: Black & Gold (Dark)
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.classList.add("dark");
    }
  };

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("alphay_theme_mode") || "dark";
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const cycleTheme = () => {
    let nextTheme = "dark";
    if (theme === "dark") nextTheme = "light";
    else if (theme === "light") nextTheme = "aquarium";
    else if (theme === "aquarium") nextTheme = "dark";

    setTheme(nextTheme);
    localStorage.setItem("alphay_theme_mode", nextTheme);
    applyTheme(nextTheme);
  };

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-50 dark:bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white shadow-sm hover:border-amber-500 transition-all active:scale-95 cursor-pointer font-['Cinzel']"
      title={`Current Theme: ${theme.toUpperCase()} (Click to switch)`}
    >
      {theme === "dark" && (
        <>
          <span className="text-amber-400 font-extrabold">👑</span>
          <span className="text-amber-300 font-extrabold">Black & Gold</span>
        </>
      )}
      {theme === "light" && (
        <>
          <span className="text-amber-600 font-extrabold">☀️</span>
          <span className="text-amber-700 font-extrabold">White & Gold</span>
        </>
      )}
      {theme === "aquarium" && (
        <>
          <span className="text-cyan-400 font-extrabold">🐠</span>
          <span className="text-cyan-300 font-extrabold">Aquarium Theme</span>
        </>
      )}
    </button>
  );
}
