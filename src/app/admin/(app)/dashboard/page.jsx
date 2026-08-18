"use client";

import { useCallback, useEffect, useState } from "react";
import Topbar from "@/components/dashboard/Topbar";
import StatCard from "@/components/dashboard/StatCard";
import { IconBuilding, IconOrders, IconTransactions, IconSparkles } from "@/components/Icons";

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [selectedVenue, setSelectedVenue] = useState(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/dashboard");
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <>
      <Topbar title="Platform Admin Overview" />
      <div className="space-y-8 p-6 max-w-7xl mx-auto">
        {!data ? (
          <div className="animate-pulse space-y-4">
            <div className="h-28 w-full rounded-3xl bg-purple-50" />
            <div className="h-64 w-full rounded-3xl bg-purple-50" />
          </div>
        ) : (
          <>
            {/* TOP ROW STAT CARDS */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 p-6 text-slate-950 shadow-xl font-['Cinzel']">
                <div className="flex items-center gap-2 mb-2">
                  <IconOrders className="h-5 w-5 text-slate-950" />
                  <p className="text-xs font-black uppercase tracking-wider text-slate-950">Platform Orders</p>
                </div>
                <p className="font-mono text-4xl font-black tabular-nums">{data.allOrders}</p>
                <p className="mt-2 text-xs font-bold text-slate-900">Total processed across all venues</p>
              </div>

              <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-amber-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <IconTransactions className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-['Cinzel']">Gross Venue Sales</p>
                </div>
                <p className="font-mono text-3xl font-black tabular-nums text-slate-900 dark:text-white">
                  ₹{data.restaurantsEarning.toFixed(2)}
                </p>
                <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Total customer payment volume</p>
              </div>

              <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-amber-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <IconSparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 font-['Cinzel']">Platform Commission</p>
                </div>
                <p className="font-mono text-3xl font-black tabular-nums text-amber-600 dark:text-amber-300">
                  ₹{data.yourCommission.toFixed(2)}
                </p>
                <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Commercial SaaS platform share</p>
              </div>
            </div>

            {/* VENUE METRICS */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard label="Total Venues" value={data.noOfRestaurants} accent="purple" />
              <StatCard label="Active Venues" value={data.active} accent="veg" />
              <StatCard label="Suspended Venues" value={data.suspended} accent="nonveg" />
            </div>

            {/* LIVE VENUE BREAKDOWN TABLE */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 shadow-xl p-6 border border-amber-500/30">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
                <div>
                  <h2 className="font-['Cinzel'] text-lg font-bold text-slate-900 dark:text-white">Live Venue Overview</h2>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Real-time stats per onboarded restaurant venue.</p>
                </div>
                <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-slate-950 px-3 py-1.5 rounded-full border border-amber-500/30">
                  ● Real-time Live
                </span>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-amber-500/20 bg-amber-50/80 dark:bg-slate-950/80 font-['Cinzel'] text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      <th className="px-4 py-3 font-bold">Venue ID</th>
                      <th className="px-4 py-3 font-bold">Venue Name</th>
                      <th className="px-4 py-3 font-bold">Orders</th>
                      <th className="px-4 py-3 font-bold">Gross Sales</th>
                      <th className="px-4 py-3 font-bold">Platform Fee</th>
                      <th className="px-4 py-3 font-bold text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100 dark:divide-slate-800 text-slate-900 dark:text-white font-semibold">
                    {data.restaurants.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                          No venues onboarded yet.
                        </td>
                      </tr>
                    ) : (
                      data.restaurants.map((r) => (
                        <tr key={r.id} className="hover:bg-amber-50/40 dark:hover:bg-slate-950/40 transition-colors">
                          <td className="px-4 py-3.5 font-bold text-amber-600 dark:text-amber-300">
                            #{r.id.slice(-6).toUpperCase()}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{r.name}</span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                r.status === "ACTIVE"
                                  ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-400"
                                  : "bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-400"
                              }`}
                            >
                              {r.status === "ACTIVE" ? "ACTIVE" : "SUSPENDED"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-bold tabular-nums text-slate-900 dark:text-white">
                            {r.orders}
                          </td>
                          <td className="px-4 py-3.5 font-bold tabular-nums text-slate-700 dark:text-slate-300">
                            ₹{r.earnings.toFixed(2)}
                          </td>
                          <td className="px-4 py-3.5 font-bold tabular-nums text-amber-600 dark:text-amber-300">
                            ₹{r.commission.toFixed(2)}{" "}
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">({r.commissionPercent}%)</span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedVenue(r)}
                              className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/40 text-amber-400 font-bold text-xs transition-all ml-auto cursor-pointer"
                              title="View Manager & Address Details"
                            >
                              ⋮
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedVenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-amber-500/40 text-slate-900 dark:text-white space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/30 text-2xl font-black">
                  🍽️
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 font-['Cinzel']">
                    Venue & Manager Details
                  </span>
                  <h2 className="font-['Cinzel'] text-xl font-extrabold text-slate-900 dark:text-white">
                    {selectedVenue.name}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVenue(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 dark:bg-slate-950 text-xs font-bold text-slate-500 dark:text-slate-400 border border-amber-500/20 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* MANAGER ACCOUNT DETAILS */}
            <div className="rounded-2xl bg-amber-50/70 dark:bg-slate-950/80 p-4 border border-amber-500/30 space-y-2.5">
              <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2">
                <span className="text-base">👑</span>
                <h3 className="font-['Cinzel'] text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Manager Account Credentials
                </h3>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 text-xs font-mono">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase font-sans">Manager Name</p>
                  <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {selectedVenue.managerName || "Restaurant Manager"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase font-sans">Manager Email</p>
                  <p className="font-extrabold text-slate-900 dark:text-white mt-0.5 select-all">
                    📧 {selectedVenue.managerEmail}
                  </p>
                </div>
                <div className="sm:col-span-2 pt-1 border-t border-amber-500/10">
                  <p className="text-[10px] font-bold text-slate-400 uppercase font-sans">Manager Password</p>
                  <p className="font-extrabold text-amber-700 dark:text-amber-300 mt-0.5 select-all bg-amber-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-amber-500/20 text-xs inline-block">
                    🔑 {selectedVenue.managerPassword || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* RESTAURANT ADDRESS & LOCATION DETAILS */}
            <div className="rounded-2xl bg-amber-50/70 dark:bg-slate-950/80 p-4 border border-amber-500/30 space-y-2.5">
              <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2">
                <span className="text-base">📍</span>
                <h3 className="font-['Cinzel'] text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Restaurant Address & Location
                </h3>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 text-xs font-mono">
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase font-sans">GPS Address Coordinates</p>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5 bg-amber-100/60 dark:bg-slate-900 px-3 py-2 rounded-xl border border-amber-500/20">
                    📍 Latitude: <strong className="text-amber-600 dark:text-amber-300">{selectedVenue.latitude}</strong>, Longitude: <strong className="text-amber-600 dark:text-amber-300">{selectedVenue.longitude}</strong>
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase font-sans">Geofence Ordering Radius</p>
                  <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {selectedVenue.geofenceRadiusMeters || 150} meters
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase font-sans">GST Rate Applicable</p>
                  <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {selectedVenue.gstPercent ?? 5}% GST
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-amber-500/20">
              <button
                type="button"
                onClick={() => setSelectedVenue(null)}
                className="rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2 text-xs font-extrabold text-slate-950 font-['Cinzel'] cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
