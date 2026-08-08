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
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Top Filter and Search Bar */}
        <div className="rounded-3xl bg-white p-5 shadow-soft border border-purple-50 space-y-4">
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
                  className={`rounded-2xl px-4 py-2 text-xs font-bold transition-all ${
                    filter === f.id
                      ? "bg-purple text-white shadow-soft"
                      : "bg-purple-50 text-ink2 hover:bg-purple-100"
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
                className="w-full rounded-2xl border border-purple/20 bg-purple-50/40 px-4 py-2 text-xs font-semibold text-ink placeholder:text-ink2/50 focus:border-purple focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple/10"
              />
            </div>
          </div>

          {/* Custom Date Inputs if active */}
          {filter === "custom" && (
            <div className="flex items-center gap-3 pt-2 border-t border-purple-50">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl border border-purple/20 px-3 py-1.5 text-xs font-semibold text-ink"
              />
              <span className="text-xs text-ink2">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl border border-purple/20 px-3 py-1.5 text-xs font-semibold text-ink"
              />
              <button
                type="button"
                onClick={fetchTransactions}
                className="rounded-xl bg-purple px-4 py-1.5 text-xs font-bold text-white shadow-soft"
              >
                Apply
              </button>
            </div>
          )}
        </div>

        {/* Transactions Summary Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-purple p-6 text-white shadow-lift">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/70">Filtered Transactions Total</p>
            <p className="mt-1 font-mono text-3xl font-bold tabular-nums">₹{totalAmount.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-white/70">Total Count</p>
            <p className="mt-1 font-mono text-2xl font-bold tabular-nums">{transactions.length} Verified Payments</p>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="rounded-3xl bg-white shadow-soft border border-purple-50 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-xs font-semibold text-ink2">Loading transactions data...</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-xs font-semibold text-ink2">
              No verified transactions found matching your criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-purple-50 bg-purple-50/40 text-[11px] font-bold uppercase tracking-wider text-ink2">
                    <th className="px-6 py-4">Transaction ID</th>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Table</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Payment Method</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-purple">{t.razorpayPaymentId}</td>
                      <td className="px-6 py-4 font-bold text-ink">#{t.orderNumber}</td>
                      <td className="px-6 py-4 font-bold text-ink">Table {t.tableNumber}</td>
                      <td className="px-6 py-4 font-bold text-ink tabular-nums">₹{t.amount.toFixed(2)}</td>
                      <td className="px-6 py-4 font-medium text-ink2">{t.paymentMethod}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block rounded-full bg-veg-tint px-2.5 py-0.5 text-[11px] font-bold text-veg">
                          {t.paymentStatus} ✓
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-ink2">
                        {new Date(t.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
