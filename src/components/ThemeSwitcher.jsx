"use client";

import { useEffect, useState } from "react";

export default function ThemeSwitcher() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("alphay_theme_mode");
    if (saved === "dark") {
      setIsDark(true);
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      setIsDark(false);
      document.documentElement.removeAttribute("data-theme");
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      setIsDark(false);
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("alphay_theme_mode", "light");
    } else {
      setIsDark(true);
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("alphay_theme_mode", "dark");
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex items-center gap-1.5 rounded-full border border-purple/20 bg-cream px-3 py-1.5 text-xs font-semibold text-ink shadow-soft hover:bg-purple-50 transition-all active:scale-95 cursor-pointer"
      title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
    >
      <span>{isDark ? "🌙 Dark" : "☀️ Light"}</span>
    </button>
  );
}
