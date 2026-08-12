"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/dashboard/Topbar";

export default function ManagerSettingsPage() {
  const [data, setData] = useState(null);
  const [activeTheme, setActiveTheme] = useState("dark");

  useEffect(() => {
    fetch("/api/manager/dashboard")
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .catch(() => {});

    const saved = localStorage.getItem("alphay_theme_mode") || "dark";
    setActiveTheme(saved);
  }, []);

  const selectTheme = (mode) => {
    setActiveTheme(mode);
    localStorage.setItem("alphay_theme_mode", mode);

    document.documentElement.classList.remove("dark", "aquarium");
    document.documentElement.removeAttribute("data-theme");

    if (mode === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else if (mode === "aquarium") {
      document.documentElement.setAttribute("data-theme", "aquarium");
      document.documentElement.classList.add("aquarium");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.classList.add("dark");
    }
  };

  return (
    <>
      <Topbar title="Restaurant Settings" />
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 text-slate-900 dark:text-white">
        {/* THEME SELECTION CARD */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-amber-500/30 space-y-4 transition-colors">
          <div className="flex items-center gap-3 border-b border-amber-500/20 pb-3">
            <span className="text-2xl">🎨</span>
            <div>
              <h2 className="font-['Cinzel'] text-lg font-extrabold text-slate-900 dark:text-white">
                Manager Portal Display Theme
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Select your preferred interface theme. Default is constant Black & Gold.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 pt-2">
            {/* BLACK & GOLD THEME (DEFAULT) */}
            <button
              type="button"
              onClick={() => selectTheme("dark")}
              className={`rounded-2xl p-4 border text-left transition-all cursor-pointer ${
                activeTheme === "dark"
                  ? "border-amber-400 bg-slate-950 ring-2 ring-amber-400/40 shadow-lg"
                  : "border-slate-800 bg-slate-900 hover:border-amber-500/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-['Cinzel'] text-sm font-black text-amber-400">👑 Black & Gold</span>
                {activeTheme === "dark" && <span className="text-xs text-amber-400 font-bold">Active ✓</span>}
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">
                Constant dark theme with deep pitch black background and shiny gold accents.
              </p>
            </button>

            {/* WHITE & GOLD THEME */}
            <button
              type="button"
              onClick={() => selectTheme("light")}
              className={`rounded-2xl p-4 border text-left transition-all cursor-pointer ${
                activeTheme === "light"
                  ? "border-amber-500 bg-amber-50 ring-2 ring-amber-500/40 shadow-lg"
                  : "border-amber-300/40 bg-white hover:border-amber-500"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-['Cinzel'] text-sm font-black text-amber-700">☀️ White & Gold</span>
                {activeTheme === "light" && <span className="text-xs text-amber-700 font-bold">Active ✓</span>}
              </div>
              <p className="text-[11px] text-slate-600 mt-2 font-medium">
                Clean light mode theme with pure white background and gold borders.
              </p>
            </button>

            {/* AQUARIUM THEME */}
            <button
              type="button"
              onClick={() => selectTheme("aquarium")}
              className={`rounded-2xl p-4 border text-left transition-all cursor-pointer ${
                activeTheme === "aquarium"
                  ? "border-cyan-400 bg-cyan-950/80 ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-500/20"
                  : "border-cyan-900/60 bg-slate-900 hover:border-cyan-400/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-['Cinzel'] text-sm font-black text-cyan-300">🐠 Aquarium Theme</span>
                {activeTheme === "aquarium" && <span className="text-xs text-cyan-400 font-bold">Active ✓</span>}
              </div>
              <p className="text-[11px] text-cyan-200/80 mt-2 font-medium">
                Oceanic gradient with crystal transparent glassmorphic tables & glowing cyan text.
              </p>
            </button>
          </div>
        </div>

        {/* RESTAURANT INFO CARD */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-amber-500/30 space-y-6 transition-colors">
          <div className="flex items-center gap-4 border-b border-amber-500/20 pb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-2xl text-slate-950 font-black shadow-md">
              🍽️
            </div>
            <div>
              <h2 className="font-['Cinzel'] text-xl font-bold text-slate-900 dark:text-white">
                {data?.restaurantName || "ALPHAY Restaurant"}
              </h2>
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Commercial SaaS Restaurant Account</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 font-['Cinzel']">Restaurant Status</label>
              <div className="mt-1 flex items-center gap-2 rounded-2xl bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-400 p-3 text-xs font-bold border border-emerald-400 dark:border-emerald-500/30">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>ACTIVE & ACCEPTING ORDERS</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 font-['Cinzel']">Standard GST Rate</label>
              <div className="mt-1 rounded-2xl bg-amber-50 dark:bg-slate-950 p-3 text-xs font-bold text-slate-900 dark:text-white border border-amber-500/30">
                {data?.gstPercent ?? 5}% GST Applicable
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 font-['Cinzel']">Geofence Ordering Radius</label>
              <div className="mt-1 rounded-2xl bg-amber-50 dark:bg-slate-950 p-3 text-xs font-bold text-slate-900 dark:text-white border border-amber-500/30 flex items-center gap-2">
                <span>📍</span>
                <span>{data?.geofenceRadiusMeters ?? 150} Meters GPS Radius</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 font-['Cinzel']">Payment Gateway</label>
              <div className="mt-1 rounded-2xl bg-amber-50 dark:bg-slate-950 p-3 text-xs font-bold text-slate-900 dark:text-white border border-amber-500/30 flex items-center gap-2">
                <span>💳</span>
                <span>Razorpay Automatic Online Verification</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 font-['Cinzel']">KDS Integration</label>
              <div className="mt-1 rounded-2xl bg-amber-50 dark:bg-slate-950 p-3 text-xs font-bold text-slate-900 dark:text-white border border-amber-500/30 flex items-center gap-2">
                <span>👨‍🍳</span>
                <span>Kitchen Display System Enabled (`/kitchen`)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

