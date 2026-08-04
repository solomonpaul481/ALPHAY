"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const RANGES = [
  { key: "day", label: "Today vs. this month" },
  { key: "month", label: "This month vs. this year" },
  { key: "year", label: "Year over year" },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-ink px-3 py-2 text-xs text-white shadow-lift">
      <p className="font-semibold">{label}</p>
      <p className="font-mono tabular-nums">₹{payload[0].value.toFixed(0)}</p>
    </div>
  );
}

export default function RevenueBarChart({ range, onRangeChange, series }) {
  return (
    <div className="rounded-card bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-base font-medium text-ink">Revenue Comparison</h3>
        <div className="flex gap-1.5 rounded-full bg-cream p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => onRangeChange(r.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                range === r.key ? "bg-purple text-white" : "text-ink2"
              }`}
            >
              {r.key === "day" ? "Days" : r.key === "month" ? "Months" : "Years"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={series} margin={{ left: -20, right: 8, top: 8 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#5B5468" }}
              axisLine={{ stroke: "#EDE7FD" }}
              tickLine={false}
              interval={range === "day" ? 2 : 0}
            />
            <YAxis tick={{ fontSize: 11, fill: "#5B5468" }} axisLine={false} tickLine={false} width={44} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F5F2FE" }} />
            <Bar dataKey="total" fill="#6D28D9" radius={[6, 6, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
