"use client";

import { useCallback, useEffect, useState } from "react";
import Topbar from "@/components/dashboard/Topbar";
import StatCard from "@/components/dashboard/StatCard";
import { IconBuilding, IconOrders, IconTransactions, IconSparkles } from "@/components/Icons";

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);

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
              <div className="rounded-3xl bg-purple p-6 text-white shadow-lift">
                <div className="flex items-center gap-2 mb-2">
                  <IconOrders className="h-5 w-5 text-purple-tint" />
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-tint">Platform Orders</p>
                </div>
                <p className="font-mono text-4xl font-bold tabular-nums">{data.allOrders}</p>
                <p className="mt-2 text-xs font-semibold text-white/70">Total processed across all venues</p>
              </div>

              <div className="rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-soft border border-purple-50">
                <div className="flex items-center gap-2 mb-2">
                  <IconTransactions className="h-5 w-5 text-veg" />
                  <p className="text-xs font-bold uppercase tracking-wider text-veg">Gross Venue Sales</p>
                </div>
                <p className="font-mono text-3xl font-bold tabular-nums text-ink">
                  ₹{data.restaurantsEarning.toFixed(2)}
                </p>
                <p className="mt-2 text-xs font-semibold text-ink2">Total customer payment volume</p>
              </div>

              <div className="rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-soft border border-purple-50">
                <div className="flex items-center gap-2 mb-2">
                  <IconSparkles className="h-5 w-5 text-purple" />
                  <p className="text-xs font-bold uppercase tracking-wider text-purple">Platform Commission</p>
                </div>
                <p className="font-mono text-3xl font-bold tabular-nums text-purple">
                  ₹{data.yourCommission.toFixed(2)}
                </p>
                <p className="mt-2 text-xs font-semibold text-ink2">Commercial SaaS platform share</p>
              </div>
            </div>

            {/* VENUE METRICS */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard label="Total Venues" value={data.noOfRestaurants} accent="purple" />
              <StatCard label="Active Venues" value={data.active} accent="veg" />
              <StatCard label="Suspended Venues" value={data.suspended} accent="nonveg" />
            </div>

            {/* LIVE VENUE BREAKDOWN TABLE */}
            <div className="rounded-3xl bg-white dark:bg-slate-800 shadow-soft p-6 border border-purple-50">
              <div className="flex items-center justify-between border-b border-purple-50 pb-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-ink">Live Venue Overview</h2>
                  <p className="text-xs font-semibold text-ink2">Real-time stats per onboarded restaurant venue.</p>
                </div>
                <span className="font-mono text-xs font-bold text-purple bg-purple-50 dark:bg-slate-700 px-3 py-1.5 rounded-full">
                  ● Real-time Live
                </span>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-purple-50 text-[11px] uppercase tracking-wider text-ink2">
                      <th className="px-4 py-3 font-bold">Venue ID</th>
                      <th className="px-4 py-3 font-bold">Venue Name</th>
                      <th className="px-4 py-3 font-bold">Orders</th>
                      <th className="px-4 py-3 font-bold">Gross Sales</th>
                      <th className="px-4 py-3 font-bold">Platform Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-50">
                    {data.restaurants.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-xs text-ink2">
                          No venues onboarded yet.
                        </td>
                      </tr>
                    ) : (
                      data.restaurants.map((r) => (
                        <tr key={r.id} className="hover:bg-purple-50/30 transition-colors">
                          <td className="px-4 py-3.5 font-bold text-purple">
                            #{r.id.slice(-6).toUpperCase()}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-ink flex items-center gap-2">
                            <span>{r.name}</span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                r.status === "ACTIVE" ? "bg-veg-tint text-veg" : "bg-nonveg-tint text-nonveg"
                              }`}
                            >
                              {r.status === "ACTIVE" ? "ACTIVE" : "SUSPENDED"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-bold tabular-nums text-ink">
                            {r.orders}
                          </td>
                          <td className="px-4 py-3.5 font-bold tabular-nums text-ink2">
                            ₹{r.earnings.toFixed(2)}
                          </td>
                          <td className="px-4 py-3.5 font-bold tabular-nums text-purple">
                            ₹{r.commission.toFixed(2)}{" "}
                            <span className="text-[10px] text-ink2">({r.commissionPercent}%)</span>
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
    </>
  );
}
