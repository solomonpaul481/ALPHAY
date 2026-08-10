"use client";

import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const RANGES = [
  { key: "day", label: "Today vs. this month" },
  { key: "month", label: "This month vs. this year" },
  { key: "year", label: "Year over year" },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-slate-900 border border-amber-500/30 px-3 py-2 text-xs text-white shadow-2xl">
      <p className="font-semibold text-amber-300">{label}</p>
      <p className="font-mono tabular-nums text-sm font-bold text-white">₹{payload[0].value.toFixed(0)}</p>
    </div>
  );
}

export default function RevenueBarChart({ range, onRangeChange, series }) {
  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-soft border border-purple-50 dark:border-slate-800 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-base font-bold text-ink dark:text-white">Revenue Comparison</h3>
        <div className="flex gap-1.5 rounded-full bg-cream dark:bg-slate-950 p-1 border border-purple-50 dark:border-slate-800">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => onRangeChange(r.key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                range === r.key
                  ? "bg-purple text-white shadow-soft"
                  : "text-ink2 dark:text-slate-400 hover:text-ink dark:hover:text-white"
              }`}
            >
              {r.key === "day" ? "Days" : r.key === "month" ? "Months" : "Years"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={series} margin={{ left: -15, right: 10, top: 20, bottom: 5 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fontWeight: 700, fill: "currentColor" }}
              className="text-slate-600 dark:text-slate-300"
              axisLine={{ stroke: "#EDE7FD" }}
              tickLine={false}
              interval={range === "day" ? 2 : 0}
            />
            <YAxis
              tick={{ fontSize: 11, fontWeight: 700, fill: "currentColor" }}
              className="text-slate-600 dark:text-slate-300"
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(109, 40, 217, 0.08)" }} />
            <Bar dataKey="total" fill="#8B5CF6" radius={[8, 8, 0, 0]} maxBarSize={32}>
              <LabelList
                dataKey="total"
                position="top"
                formatter={(val) => (val > 0 ? (val >= 1000 ? `₹${(val / 1000).toFixed(1)}k` : `₹${val.toFixed(0)}`) : "")}
                style={{ fill: "currentColor", fontSize: "10px", fontWeight: "800" }}
                className="text-purple-700 dark:text-amber-300"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
