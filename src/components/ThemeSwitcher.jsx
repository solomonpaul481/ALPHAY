"use client";

import { useEffect, useState } from "react";

export default function ThemeSwitcher() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-full border border-purple/20 bg-white dark:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-ink shadow-soft hover:bg-purple-50 dark:hover:bg-slate-700 transition-all active:scale-95 cursor-pointer"
      title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
      aria-label={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
    >
      {isDark ? (
        <>
          <svg className="h-4 w-4 text-amber-400 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span className="text-slate-200">Light Mode</span>
        </>
      ) : (
        <>
          <svg className="h-4 w-4 text-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          <span className="text-ink">Dark Mode</span>
        </>
      )}
    </button>
  );
}
