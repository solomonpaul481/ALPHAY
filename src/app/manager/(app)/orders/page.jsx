"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/dashboard/Topbar";

const TIMEFRAME_LABELS = {
  today: "Today",
  month: "This Month",
  year: "This Year",
};

export default function ManagerOrdersPage() {
  const [timeframe, setTimeframe] = useState("today"); // today | month | year
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [ordersData, setOrdersData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [expandedOrderIds, setExpandedOrderIds] = useState({});

  const loadOrders = async () => {
    try {
      const res = await fetch(`/api/manager/orders?timeframe=${timeframe}&status=${filterStatus}`);
      if (res.ok) {
        const json = await res.json();
        setOrdersData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeframe, filterStatus]);

  const toggleExpand = (orderId) => {
    setExpandedOrderIds((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const advanceOrder = async (orderId, e) => {
    e.stopPropagation();
    setBusyId(orderId);
    try {
      await fetch(`/api/manager/orders/${orderId}/advance`, { method: "POST" });
      await loadOrders();
    } finally {
      setBusyId(null);
    }
  };

  const ordersList = ordersData?.orders || [];

  return (
    <>
      <Topbar title="Live & All Orders Management" />
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* TIMEFRAME & ALL ORDERS FILTER BAR */}
        <div className="bg-white p-5 rounded-3xl shadow-soft border border-purple-50 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-50 pb-3">
            <div>
              <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                <span>📦</span>
                <span>All Orders Overview</span>
              </h2>
              <p className="text-xs text-ink2 font-medium">
                Filter orders by timeframe and click any order box to expand full details.
              </p>
            </div>

            {/* TIMEFRAME BUTTONS: TODAY | THIS MONTH | THIS YEAR */}
            <div className="flex items-center gap-1.5 rounded-2xl bg-purple-50/70 p-1.5 border border-purple-100">
              <span className="text-xs font-bold text-purple px-2 font-mono uppercase">Timeframe:</span>
              {["today", "month", "year"].map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                    timeframe === tf
                      ? "bg-purple text-white shadow-soft"
                      : "text-ink2 hover:bg-purple-100"
                  }`}
                >
                  {TIMEFRAME_LABELS[tf]}
                </button>
              ))}
            </div>
          </div>

          {/* STATUS FILTERS */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {["ALL", "CONFIRMED", "PREPARING", "READY", "SERVED"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`rounded-2xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                    filterStatus === st
                      ? "bg-purple text-white shadow-soft"
                      : "bg-purple-50 text-ink2 hover:bg-purple-100"
                  }`}
                >
                  {st === "ALL" ? "All Statuses" : st}
                </button>
              ))}
            </div>

            <span className="text-xs font-bold text-purple font-mono">
              Showing {ordersList.length} orders ({TIMEFRAME_LABELS[timeframe]})
            </span>
          </div>
        </div>

        {/* ORDERS LIST: SMALL COMPACT BOXES WITH CLICK-TO-EXPAND */}
        {loading && !ordersData ? (
          <div className="animate-pulse text-sm text-ink2 p-6 text-center">Loading orders data...</div>
        ) : ordersList.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center text-sm font-semibold text-ink2 shadow-soft border border-purple-50">
            No orders found for {TIMEFRAME_LABELS[timeframe]} with status "{filterStatus}".
          </div>
        ) : (
          <div className="space-y-3">
            {ordersList.map((order) => {
              const isExpanded = !!expandedOrderIds[order.id];
              const totalItems = order.items.reduce((acc, it) => acc + it.quantity, 0);

              return (
                <div
                  key={order.id}
                  onClick={() => toggleExpand(order.id)}
                  className={`rounded-2xl bg-white p-4 shadow-soft border transition-all cursor-pointer ${
                    isExpanded
                      ? "border-purple ring-2 ring-purple/10"
                      : "border-purple-50 hover:border-purple-200"
                  }`}
                >
                  {/* SMALL COMPACT HEADER CARD (ALWAYS VISIBLE) */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 font-mono text-xs font-black text-purple">
                        T#{order.tableNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-purple">
                            #{order.orderNumber}
                          </span>
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                            order.status === "SERVED"
                              ? "bg-veg-tint text-veg"
                              : order.status === "READY"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-purple-50 text-purple"
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-ink2 mt-0.5">
                          {new Date(order.createdAt).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          · {totalItems} item{totalItems === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-ink2">Total Bill</p>
                        <p className="font-mono text-base font-black text-purple tabular-nums">
                          ₹{order.total.toFixed(2)}
                        </p>
                      </div>

                      {/* Expand Chevron Icon */}
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-purple-50 text-purple transition-transform duration-200 ${
                        isExpanded ? "rotate-180 bg-purple text-white" : ""
                      }`}>
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* EXPANDABLE DETAILED DETAILS SECTION */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-purple-50/80 animate-in fade-in duration-200 space-y-4">
                      {/* Itemized Breakdown Table */}
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-purple mb-2 font-mono">
                          Itemized Order Breakdown
                        </p>
                        <div className="rounded-xl bg-purple-50/40 p-3">
                          <table className="w-full text-left text-xs font-medium text-ink">
                            <thead>
                              <tr className="border-b border-purple-100 text-[10px] font-bold uppercase text-ink2">
                                <th className="pb-1.5">Qty</th>
                                <th className="pb-1.5">Item Name</th>
                                <th className="pb-1.5 text-right">Price</th>
                                <th className="pb-1.5 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-purple-50 font-semibold">
                              {order.items.map((it) => (
                                <tr key={it.id}>
                                  <td className="py-2 text-purple font-bold">{it.quantity}x</td>
                                  <td className="py-2">
                                    {it.name}
                                    {it.notes && (
                                      <span className="block text-[10px] text-ink2 font-normal">Note: {it.notes}</span>
                                    )}
                                  </td>
                                  <td className="py-2 text-right font-mono text-ink2">₹{it.price.toFixed(2)}</td>
                                  <td className="py-2 text-right font-mono text-ink">₹{(it.price * it.quantity).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Notes & Special Instructions */}
                      {order.specialInstructions && (
                        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs font-semibold text-amber-900">
                          <span className="font-bold uppercase tracking-wider text-[10px] text-amber-700 block">Kitchen Instructions:</span>
                          {order.specialInstructions}
                        </div>
                      )}

                      {/* Financials & Status Advance Button */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <div className="text-xs font-mono font-semibold text-ink2 space-x-3">
                          <span>Subtotal: ₹{order.subtotal.toFixed(2)}</span>
                          <span>GST: ₹{order.gstAmount.toFixed(2)}</span>
                          <span className="font-bold text-purple">Grand Total: ₹{order.total.toFixed(2)}</span>
                        </div>

                        {order.status !== "SERVED" && (
                          <button
                            type="button"
                            onClick={(e) => advanceOrder(order.id, e)}
                            disabled={busyId === order.id}
                            className="rounded-2xl bg-purple px-4 py-2 text-xs font-extrabold text-white shadow-soft hover:bg-purple-deep transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                          >
                            {busyId === order.id ? "Updating..." : "Advance Status →"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
