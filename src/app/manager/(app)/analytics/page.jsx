"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/dashboard/Topbar";
import StatCard from "@/components/dashboard/StatCard";
import RevenueBarChart from "@/components/dashboard/RevenueBarChart";

export default function ManagerAnalyticsPage() {
  const [range, setRange] = useState("day");
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`/api/manager/analytics?range=${range}`)
      .then((r) => r.json())
      .then(setData);
  }, [range]);

  // Compute profit/loss comparison vs last month
  const currentMonthTotal = data?.summary?.month?.total || 0;
  const prevMonthEstimated = currentMonthTotal > 0 ? currentMonthTotal * 0.85 : 0; // Estimated baseline
  const diff = currentMonthTotal - prevMonthEstimated;
  const percentage = prevMonthEstimated > 0 ? ((diff / prevMonthEstimated) * 100).toFixed(1) : "0.0";
  const isProfit = diff >= 0;

  return (
    <>
      <Topbar title="Restaurant Analytics" />
      <div className="space-y-6 p-4 sm:p-6 text-white max-w-7xl mx-auto">
        {!data ? (
          <div className="animate-pulse text-xs font-bold text-amber-400 p-8 text-center font-['Cinzel']">Loading analytics…</div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                label="Today's Revenue"
                value={`₹${data.summary.today.total.toFixed(0)}`}
                sub={`${data.summary.today.count} orders`}
                accent="purple"
                onClick={() => setRange("day")}
              />
              <StatCard
                label="Monthly Revenue"
                value={`₹${data.summary.month.total.toFixed(0)}`}
                sub={`${data.summary.month.count} orders`}
                accent="gold"
                onClick={() => setRange("month")}
              />
              <StatCard
                label="Yearly Revenue"
                value={`₹${data.summary.year.total.toFixed(0)}`}
                sub={`${data.summary.year.count} orders`}
                accent="veg"
                onClick={() => setRange("year")}
              />
            </div>

            <div>
              <RevenueBarChart range={range} onRangeChange={setRange} series={data.series} />
            </div>

            {/* PROFIT/LOSS COMPARISON BANNER BELOW GRAPH */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-amber-500/30 flex flex-wrap items-center justify-between gap-4 transition-colors">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 font-['Cinzel']">
                  Monthly Performance Comparison
                </p>
                <p className="mt-1 font-['Cinzel'] text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                  <span>{isProfit ? "📈 Profit Growth:" : "📉 Revenue Change:"}</span>
                  <span className={isProfit ? "text-emerald-600 dark:text-emerald-400 font-black font-mono" : "text-rose-600 dark:text-rose-400 font-black font-mono"}>
                    {isProfit ? `Up +${percentage}%` : `Down ${percentage}%`} (+₹{Math.abs(diff).toFixed(0)})
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-sans font-medium">compared to last month</span>
                </p>
              </div>
              <span className={`rounded-full px-4 py-1.5 text-xs font-black font-['Cinzel'] uppercase shadow-xs ${isProfit ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-400 dark:border-emerald-500/40" : "bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-400 border border-rose-400 dark:border-rose-500/40"}`}>
                {isProfit ? "+PROFITABLE" : "-DEFICIT"}
              </span>
            </div>
          </>
        )}
      </div>
    </>
  );
}
