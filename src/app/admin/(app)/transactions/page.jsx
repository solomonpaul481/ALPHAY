"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/dashboard/Topbar";
import { IconSparkles, IconTransactions } from "@/components/Icons";

export default function AdminTransactionsPage() {
  const [data, setData] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    const res = await fetch("/api/admin/transactions");
    if (res.ok) setData(await res.json());
  };

  useEffect(() => {
    load();
  }, []);

  const togglePaymentStatus = async (r) => {
    const isCurrentlyDone = ["DONE", "PAID", "ACTIVE"].includes(r.billingStatus);
    const nextStatus = isCurrentlyDone ? "PENDING" : "DONE";
    setBusyId(r.id);
    try {
      const res = await fetch(`/api/admin/transactions/${r.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to update payment status.");
        return;
      }
      await load();
    } catch (err) {
      alert("Error updating payment status.");
    } finally {
      setBusyId(null);
    }
  };

  const sendReminder = async (r) => {
    setBusyId(r.id);
    try {
      await fetch(`/api/admin/transactions/${r.id}/remind`, { method: "POST" });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const toggleRestaurantStatus = async (r) => {
    const verb = r.status === "ACTIVE" ? "suspend" : "reactivate";
    if (!confirm(`${verb.charAt(0).toUpperCase() + verb.slice(1)} ${r.name}?`)) return;
    setBusyId(r.id);
    try {
      await fetch(`/api/admin/restaurants/${r.id}/toggle-status`, { method: "POST" });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const summary = data?.summary || {
    dailyEarnings: 0,
    dailyFee: 0,
    monthlyEarnings: 0,
    monthlyFee: 0,
    yearlyEarnings: 0,
    yearlyFee: 0,
  };

  const rows = data?.transactions || null;

  return (
    <>
      <Topbar title="Transactions & Financials" />
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Daily, Monthly, Yearly Earnings & Platform Fee Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Daily Card */}
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-sm border border-slate-200 dark:border-zinc-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <span className="text-xs font-black uppercase text-slate-500 dark:text-zinc-400">Daily Earnings</span>
              <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600">Today</span>
            </div>
            <p className="mt-3 font-mono text-3xl font-black text-slate-900 dark:text-white tabular-nums">
              ₹{summary.dailyEarnings.toFixed(2)}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <IconSparkles className="h-3.5 w-3.5" /> ALPHAY Platform Fee
              </span>
              <span className="font-mono text-sm font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                ₹{summary.dailyFee.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Monthly Card */}
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-sm border border-slate-200 dark:border-zinc-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <span className="text-xs font-black uppercase text-slate-500 dark:text-zinc-400">Monthly Earnings</span>
              <span className="rounded-full bg-indigo-50 dark:bg-zinc-800 px-2.5 py-0.5 text-[11px] font-bold text-indigo-600">This Month</span>
            </div>
            <p className="mt-3 font-mono text-3xl font-black text-slate-900 dark:text-white tabular-nums">
              ₹{summary.monthlyEarnings.toFixed(2)}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <IconSparkles className="h-3.5 w-3.5" /> ALPHAY Platform Fee
              </span>
              <span className="font-mono text-sm font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                ₹{summary.monthlyFee.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Yearly Card */}
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-sm border border-slate-200 dark:border-zinc-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <span className="text-xs font-black uppercase text-slate-500 dark:text-zinc-400">Yearly Earnings</span>
              <span className="rounded-full bg-indigo-50 dark:bg-zinc-800 px-2.5 py-0.5 text-[11px] font-bold text-indigo-600">This Year</span>
            </div>
            <p className="mt-3 font-mono text-3xl font-black text-slate-900 dark:text-white tabular-nums">
              ₹{summary.yearlyEarnings.toFixed(2)}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <IconSparkles className="h-3.5 w-3.5" /> ALPHAY Platform Fee
              </span>
              <span className="font-mono text-sm font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                ₹{summary.yearlyFee.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto rounded-3xl bg-white dark:bg-zinc-900 shadow-sm border border-slate-200 dark:border-zinc-800">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                <th className="px-6 py-4">Venue Name</th>
                <th className="px-6 py-4">Gross Sales</th>
                <th className="px-6 py-4">Platform Fee (Commission)</th>
                <th className="px-6 py-4">Venue Status</th>
                <th className="px-6 py-4">Settlement Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {rows === null ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-xs font-bold text-slate-500">
                    Loading financials...
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const isDone = ["DONE", "PAID", "ACTIVE"].includes(r.billingStatus);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{r.name}</td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white tabular-nums">
                        ₹{r.sales.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                        ₹{r.commission.toFixed(2)}{" "}
                        <span className="text-[10px] text-slate-400 font-normal">({r.commissionPercent}%)</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            r.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                          }`}
                        >
                          {r.status === "ACTIVE" ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => togglePaymentStatus(r)}
                          disabled={busyId === r.id}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer ${
                            isDone
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              : "bg-amber-50 text-amber-600 border border-amber-200"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${isDone ? "bg-emerald-600" : "bg-amber-600"}`} />
                          {isDone ? "Settled ✓" : "Pending"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 items-center">
                          <button
                            type="button"
                            onClick={() => togglePaymentStatus(r)}
                            disabled={busyId === r.id}
                            className="rounded-xl bg-slate-100 dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-200"
                          >
                            {isDone ? "Mark Pending" : "Mark Settled"}
                          </button>
                          <button
                            type="button"
                            onClick={() => sendReminder(r)}
                            disabled={busyId === r.id}
                            className="rounded-xl bg-indigo-50 dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100"
                          >
                            Send Reminder
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleRestaurantStatus(r)}
                            disabled={busyId === r.id}
                            className="rounded-xl bg-red-50 dark:bg-red-950/40 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100"
                          >
                            {r.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
