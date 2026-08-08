"use client";

import { useEffect, useState } from "react";
import ThemeSwitcher from "@/components/ThemeSwitcher";

export default function Topbar({ title, right }) {
  const [managerInfo, setManagerInfo] = useState(null);

  useEffect(() => {
    fetch("/api/manager/dashboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setManagerInfo({
            name: data.managerName || "Manager",
            restaurantName: data.restaurantName || "ALPHAX Restaurant",
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between border-b border-purple-50 bg-white/90 px-6 py-3.5 backdrop-blur-md transition-colors shadow-soft">
      <div>
        <h1 className="font-display text-xl font-bold text-ink">{title}</h1>
        {managerInfo?.restaurantName && (
          <p className="text-xs font-semibold text-purple">
            {managerInfo.restaurantName}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Online Status Badge */}
        <div className="flex items-center gap-1.5 rounded-full bg-veg-tint px-3 py-1 text-xs font-bold text-veg border border-veg/20">
          <span className="h-2 w-2 rounded-full bg-veg animate-pulse" />
          <span>ONLINE</span>
        </div>

        {/* Manager Avatar Badge */}
        <div className="flex items-center gap-2 rounded-2xl bg-purple-50 px-3 py-1.5 border border-purple-100">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple text-xs font-bold text-white">
            👨‍💼
          </div>
          <span className="text-xs font-bold text-ink hidden sm:inline">
            {managerInfo?.name || "Manager"}
          </span>
        </div>

        <ThemeSwitcher />
        {right}
      </div>
    </header>
  );
}
