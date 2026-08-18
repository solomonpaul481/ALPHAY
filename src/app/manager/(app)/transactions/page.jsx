"use client";

import { useCallback, useEffect, useState } from "react";
import Topbar from "@/components/dashboard/Topbar";

export default function ManagerTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("all"); // all | today | yesterday | this_week | this_month | custom
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ filter, q: search });
      if (filter === "custom" && startDate && endDate) {
        params.set("start", startDate);
        params.set("end", endDate);
      }
      const res = await fetch(`/api/manager/transactions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } finally {
      setLoading(false);
    }
  }, [filter, search, startDate, endDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const totalAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <>
      <Topbar title="Transactions History" />
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-900 dark:text-white">
        {/* Top Filter and Search Bar */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-xl border border-amber-500/30 space-y-4 transition-colors">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "All Time" },
                { id: "today", label: "Today" },
                { id: "yesterday", label: "Yesterday" },
                { id: "this_week", label: "This Week" },
                { id: "this_month", label: "This Month" },
                { id: "custom", label: "Custom Range" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`rounded-2xl px-4 py-2 text-xs font-black transition-all cursor-pointer font-['Cinzel'] ${
                    filter === f.id
                      ? "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 shadow-md"
                      : "bg-amber-50 text-slate-700 border border-amber-400/30 hover:bg-amber-100 hover:text-slate-900 dark:bg-slate-950 dark:text-slate-400 dark:border-amber-500/20 dark:hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Order ID, Txn ID, Table..."
                className="w-full rounded-2xl border border-amber-500/30 bg-amber-50/50 dark:bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Custom Date Inputs if active */}
          {filter === "custom" && (
            <div className="flex items-center gap-3 pt-3 border-t border-amber-500/20">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={fetchTransactions}
                className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-1.5 text-xs font-black text-slate-950 shadow-md font-['Cinzel'] cursor-pointer"
              >
                Apply
              </button>
            </div>
          )}
        </div>

        {/* Transactions Summary Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white dark:bg-slate-900 p-6 text-slate-900 dark:text-white shadow-xl border border-amber-500/30 transition-colors">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 font-['Cinzel']">Filtered Transactions Total</p>
            <p className="mt-1 font-mono text-3xl font-black text-amber-600 dark:text-amber-300 tabular-nums">₹{totalAmount.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 font-['Cinzel']">Total Count</p>
            <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{transactions.length} Verified Payments</p>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 shadow-xl border border-amber-500/30 overflow-hidden transition-colors">
          {loading ? (
            <div className="p-8 text-center text-xs font-bold text-amber-600 dark:text-amber-400 font-['Cinzel']">Loading transactions data...</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
              No verified transactions found matching your criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-amber-200 dark:border-slate-800 bg-amber-50/90 dark:bg-slate-950/80 font-['Cinzel'] text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-400">
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Table</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Transaction ID</th>
                    <th className="px-6 py-4">Payment Method</th>
                    <th className="px-6 py-4">Payment Status</th>
                    <th className="px-6 py-4">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100 dark:divide-slate-800/80 font-semibold">
                  {transactions.map((t) => {
                    const isCash = t.isCash || t.paymentStatus?.includes("CASH") || t.paymentMethod?.includes("Cash") || t.cashfreePaymentId === "Cash";
                    return (
                      <tr key={t.id} className="hover:bg-amber-50/50 dark:hover:bg-slate-950/40 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white font-mono">{t.orderNumber}</td>
                        <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">Table #{t.tableNumber}</td>
                        <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">₹{t.amount.toFixed(2)}</td>
                        <td className="px-6 py-4 font-bold text-amber-700 dark:text-amber-300 font-mono">
                          {isCash ? (
                            <span className="inline-block rounded-lg bg-amber-100 dark:bg-amber-950/60 px-2.5 py-1 text-[11px] font-black text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                              Cash
                            </span>
                          ) : (
                            t.cashfreePaymentId
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 font-sans">{t.paymentMethod}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider font-['Cinzel'] ${
                            isCash
                              ? "bg-amber-100 text-amber-900 border border-amber-400 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-500/40"
                              : "bg-emerald-100 text-emerald-900 border border-emerald-400 dark:bg-emerald-950/80 dark:text-emerald-400 dark:border-emerald-500/40"
                          }`}>
                            {t.paymentStatus} ✓
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400 font-sans">
                          {new Date(t.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
