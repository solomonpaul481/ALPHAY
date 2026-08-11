"use client";

import { useState } from "react";
import { Bar, BarChart, Line, LineChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

const RANGES = [
  { key: "day", label: "Days" },
  { key: "month", label: "Months" },
  { key: "year", label: "Years" },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl bg-slate-950 border border-amber-500/40 px-3.5 py-2.5 text-xs text-white shadow-2xl">
      <p className="font-bold text-amber-400 font-['Cinzel']">{label}</p>
      <p className="font-mono tabular-nums text-sm font-black text-amber-300">
        ₹{payload[0].value.toFixed(2)}
      </p>
    </div>
  );
}

export default function RevenueBarChart({ range, onRangeChange, series }) {
  const [chartType, setChartType] = useState("line"); // "line" = Income Line Graph | "bar" = Revenue Bar Chart

  return (
    <div className="rounded-3xl bg-slate-900 p-6 shadow-2xl border border-amber-500/20 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
        <div>
          <h3 className="font-['Cinzel'] text-lg font-extrabold text-white flex items-center gap-2">
            <span>📈</span>
            <span>Income & Revenue Chart ({chartType === "line" ? "Line Graph" : "Bar Chart"})</span>
          </h3>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">
            Real-time income progression over selected timeframes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* CHART TYPE SWITCHER: LINE GRAPH vs BAR CHART */}
          <div className="flex gap-1 rounded-2xl bg-slate-950 p-1 border border-amber-500/30">
            <button
              type="button"
              onClick={() => setChartType("line")}
              className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-black transition-all cursor-pointer font-['Cinzel'] ${
                chartType === "line"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>📈</span>
              <span>Income Line</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType("bar")}
              className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-black transition-all cursor-pointer font-['Cinzel'] ${
                chartType === "bar"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>📊</span>
              <span>Bar Chart</span>
            </button>
          </div>

          {/* TIMEFRAME SWITCHER */}
          <div className="flex gap-1 rounded-2xl bg-slate-950 p-1 border border-amber-500/30">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => onRangeChange(r.key)}
                className={`rounded-xl px-3 py-1.5 text-xs font-black transition-all cursor-pointer font-['Cinzel'] ${
                  range === r.key
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            <LineChart data={series} margin={{ left: -10, right: 15, top: 25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fontWeight: 700, fill: "#94A3B8" }}
                axisLine={{ stroke: "#475569" }}
                tickLine={false}
                interval={range === "day" ? 2 : 0}
              />
              <YAxis
                tick={{ fontSize: 11, fontWeight: 700, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#F59E0B"
                strokeWidth={3}
                dot={{ r: 4, fill: "#F59E0B", strokeWidth: 2, stroke: "#020617" }}
                activeDot={{ r: 7, fill: "#FBBF24", stroke: "#F59E0B" }}
              >
                <LabelList
                  dataKey="total"
                  position="top"
                  formatter={(val) => (val > 0 ? (val >= 1000 ? `₹${(val / 1000).toFixed(1)}k` : `₹${val.toFixed(0)}`) : "")}
                  style={{ fill: "#FBBF24", fontSize: "10px", fontWeight: "800" }}
                />
              </Line>
            </LineChart>
          ) : (
            <BarChart data={series} margin={{ left: -10, right: 15, top: 25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fontWeight: 700, fill: "#94A3B8" }}
                axisLine={{ stroke: "#475569" }}
                tickLine={false}
                interval={range === "day" ? 2 : 0}
              />
              <YAxis
                tick={{ fontSize: 11, fontWeight: 700, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(245, 158, 11, 0.1)" }} />
              <Bar dataKey="total" fill="#F59E0B" radius={[8, 8, 0, 0]} maxBarSize={36}>
                <LabelList
                  dataKey="total"
                  position="top"
                  formatter={(val) => (val > 0 ? (val >= 1000 ? `₹${(val / 1000).toFixed(1)}k` : `₹${val.toFixed(0)}`) : "")}
                  style={{ fill: "#FBBF24", fontSize: "10px", fontWeight: "800" }}
                />
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
