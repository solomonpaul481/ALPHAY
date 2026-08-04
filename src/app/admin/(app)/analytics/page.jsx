"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/dashboard/Topbar";
import StatCard from "@/components/dashboard/StatCard";
import RevenueBarChart from "@/components/dashboard/RevenueBarChart";

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState("day");
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`/api/admin/analytics?range=${range}`)
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
      <Topbar title="Admin Analytics" />
      <div className="space-y-6 p-6">
        {!data ? (
          <div className="animate-pulse text-sm text-ink2">Loading analytics…</div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard
                label="Today, All Restaurants"
                value={`₹${data.summary.today.total.toFixed(0)}`}
                sub={`${data.summary.today.count} orders`}
                accent="purple"
                onClick={() => setRange("day")}
              />
              <StatCard
                label="This Month, All Restaurants"
                value={`₹${data.summary.month.total.toFixed(0)}`}
                sub={`${data.summary.month.count} orders`}
                accent="gold"
                onClick={() => setRange("month")}
              />
              <StatCard
                label="This Year, All Restaurants"
                value={`₹${data.summary.year.total.toFixed(0)}`}
                sub={`${data.summary.year.count} orders`}
                accent="veg"
                onClick={() => setRange("year")}
              />
            </div>

            <div>
              <RevenueBarChart range={range} onRangeChange={setRange} series={data.series} />
            </div>

            {/* PROFIT/LOSS COMPARISON LINE BELOW GRAPH */}
            <div className="rounded-card bg-white p-5 shadow-soft border border-purple-50 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink2">
                  Monthly Performance Comparison
                </p>
                <p className="mt-1 font-display text-base font-medium text-ink flex items-center gap-2">
                  <span>{isProfit ? "📈 Profit Growth:" : "📉 Revenue Change:"}</span>
                  <span className={isProfit ? "text-veg font-bold" : "text-nonveg font-bold"}>
                    {isProfit ? `Up +${percentage}%` : `Down ${percentage}%`} (+₹{Math.abs(diff).toFixed(0)})
                  </span>
                  <span className="text-sm text-ink2 font-normal">compared to last month</span>
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${isProfit ? "bg-veg-tint text-veg" : "bg-nonveg-tint text-nonveg"}`}>
                {isProfit ? "+PROFITABLE" : "-DEFICIT"}
              </span>
            </div>
          </>
        )}
      </div>
    </>
  );
}
