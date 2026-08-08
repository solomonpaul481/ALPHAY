"use client";

import { useEffect, useState } from "react";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import FullscreenButton from "@/components/FullscreenButton";
import { IconUser } from "@/components/Icons";

export default function Topbar({ title, right }) {
  const [managerInfo, setManagerInfo] = useState(null);

  useEffect(() => {
    fetch("/api/manager/dashboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setManagerInfo({
            name: data.managerName || "Manager",
            restaurantName: data.restaurantName || "ALPHAX Dining",
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 px-6 py-3.5 backdrop-blur-md transition-colors shadow-xs">
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h1>
        {managerInfo?.restaurantName && (
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
            {managerInfo.restaurantName}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Online Status Badge */}
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>ONLINE</span>
        </div>

        {/* Manager Avatar Badge */}
        <div className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-zinc-800 px-3 py-1.5 border border-slate-200 dark:border-zinc-700">
          <IconUser className="h-4 w-4 text-slate-700 dark:text-zinc-300" />
          <span className="text-xs font-extrabold text-slate-900 dark:text-white hidden sm:inline">
            {managerInfo?.name || "Manager"}
          </span>
        </div>

        <ThemeSwitcher />
        {right}
      </div>
    </header>
  );
}
