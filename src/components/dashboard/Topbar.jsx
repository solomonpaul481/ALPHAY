"use client";

import { useEffect, useState } from "react";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { IconUser, IconBuilding, IconSettings, IconSparkles } from "@/components/Icons";

function ManagerProfileModal({ data, onClose }) {
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white font-bold text-xl shadow-md">
              <IconUser className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold">{data.managerName || "Manager Profile"}</h3>
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{data.managerEmail}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 dark:bg-zinc-800 p-2 text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-zinc-700"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-3 font-mono text-xs">
          <div className="rounded-2xl bg-slate-50 dark:bg-zinc-800/60 p-4 border border-slate-200 dark:border-zinc-800 space-y-2">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Restaurant Details</p>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Venue Name:</span>
              <span className="font-bold text-slate-900 dark:text-white">{data.restaurantName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Venue ID:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">#{data.restaurantId?.slice(-6).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Venue Status:</span>
              <span className="font-bold text-emerald-600">{data.restaurantStatus}</span>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-zinc-800/60 p-4 border border-slate-200 dark:border-zinc-800 space-y-2">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Configuration & Rates</p>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">GPS Geofence Radius:</span>
              <span className="font-bold text-slate-900 dark:text-white">{data.geofenceRadiusMeters} meters</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">GST Tax Rate:</span>
              <span className="font-bold text-slate-900 dark:text-white">{data.gstPercent}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">ALPHAY Platform Commission:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{data.commissionPercent}%</span>
            </div>
            {data.latitude && (
              <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-zinc-700">
                <span className="text-slate-500 font-sans">Coordinates:</span>
                <span className="font-bold text-slate-700 dark:text-zinc-300">{data.latitude?.toFixed(4)}, {data.longitude?.toFixed(4)}</span>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 py-3 text-xs font-bold text-white shadow-md cursor-pointer"
        >
          Close Profile
        </button>
      </div>
    </div>
  );
}

export default function Topbar({ title, right }) {
  const [managerData, setManagerData] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    fetch("/api/manager/dashboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setManagerData(data);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 px-6 py-3.5 backdrop-blur-md transition-colors shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h1>
          {managerData?.restaurantName && (
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              {managerData.restaurantName}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Online Status Badge */}
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ONLINE</span>
          </div>

          {/* Interactive Manager Avatar Badge */}
          <button
            type="button"
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-zinc-800 px-3 py-1.5 border border-slate-200 dark:border-zinc-700 hover:border-indigo-500 transition-all cursor-pointer"
            title="Click to view Manager & Venue Profile"
          >
            <IconUser className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-extrabold text-slate-900 dark:text-white hidden sm:inline">
              {managerData?.managerName || "Manager"}
            </span>
          </button>

          <ThemeSwitcher />
          {right}
        </div>
      </header>

      {showProfile && (
        <ManagerProfileModal data={managerData} onClose={() => setShowProfile(false)} />
      )}
    </>
  );
}
