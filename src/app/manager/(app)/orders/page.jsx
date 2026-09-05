"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/dashboard/Topbar";

const RANGE_LABELS = {
  today: "Today",
  yesterday: "Yesterday",
  week: "This Week",
  month: "This Month",
};

export default function ManagerOrdersPage() {
  const [range, setRange] = useState("today"); // today | yesterday | week | month
  const [categoryFilter, setCategoryFilter] = useState("ALL"); // ALL | DINEIN | PARCEL
  const [ordersData, setOrdersData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [expandedOrderIds, setExpandedOrderIds] = useState({});

  const loadOrders = async () => {
    try {
      const res = await fetch(`/api/manager/orders?range=${range}`);
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
  }, [range]);

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

  const allOrders = ordersData?.orders || [];
  const ordersList = allOrders.filter((o) => {
    const isP = Boolean(
      o.isParcel ||
      String(o.tableNumber).toUpperCase().includes("PARCEL") ||
      String(o.tableNumber).toUpperCase() === "P" ||
      o.table?.isParcelCounter
    );
    if (categoryFilter === "DINEIN") return !isP;
    if (categoryFilter === "PARCEL") return isP;
    return true;
  });

  return (
    <>
      <Topbar title="Orders" />
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-900 dark:text-white">
        {/* HEADER & DATE RANGE FILTER BAR */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-xl border border-amber-500/30 space-y-4 transition-colors">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
            <div>
              <h2 className="font-['Cinzel'] text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 tracking-wide">
                <span>📋</span>
                <span>Orders Management</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Customer dining and parcel orders grouped by session. Click any order to expand breakdown.
              </p>
            </div>

            {/* TOP RIGHT DATE RANGE FILTERS */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-amber-50/50 dark:bg-slate-950 p-1.5 border border-amber-500/30 shadow-inner">
              <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 px-2 font-['Cinzel'] uppercase">Time:</span>
              {["today", "yesterday", "week", "month"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-black transition-all cursor-pointer font-['Cinzel'] ${
                    range === r
                      ? "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 shadow-md"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-amber-100 dark:hover:bg-slate-900"
                  }`}
                >
                  {RANGE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono font-bold">
            {/* CATEGORY FILTER BUTTONS */}
            <div className="flex items-center gap-2 font-['Cinzel']">
              <button
                type="button"
                onClick={() => setCategoryFilter("ALL")}
                className={`rounded-xl px-3 py-1.5 transition-all cursor-pointer ${
                  categoryFilter === "ALL"
                    ? "bg-amber-500 text-slate-950 font-black shadow-md"
                    : "bg-amber-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300 border border-amber-500/20"
                }`}
              >
                All Orders ({allOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("DINEIN")}
                className={`rounded-xl px-3 py-1.5 transition-all cursor-pointer ${
                  categoryFilter === "DINEIN"
                    ? "bg-amber-500 text-slate-950 font-black shadow-md"
                    : "bg-amber-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300 border border-amber-500/20"
                }`}
              >
                🍽️ Dine-In Tables
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("PARCEL")}
                className={`rounded-xl px-3 py-1.5 transition-all cursor-pointer ${
                  categoryFilter === "PARCEL"
                    ? "bg-amber-500 text-slate-950 font-black shadow-md"
                    : "bg-amber-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300 border border-amber-500/20"
                }`}
              >
                📦 Takeaway Parcels
              </button>
            </div>

            <span className="text-amber-600 dark:text-amber-400">
              Showing {ordersList.length} Order{ordersList.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {/* ORDERS LIST */}
        {loading && !ordersData ? (
          <div className="animate-pulse text-xs font-bold text-amber-600 dark:text-amber-400 p-8 text-center font-['Cinzel']">
            Loading orders data...
          </div>
        ) : ordersList.length === 0 ? (
          <div className="rounded-3xl bg-white dark:bg-slate-900 p-10 text-center text-xs font-bold text-slate-500 dark:text-slate-400 shadow-xl border border-amber-500/30 font-['Cinzel']">
            No orders found for {RANGE_LABELS[range]} in this category.
          </div>
        ) : (
          <div className="space-y-3.5">
            {ordersList.map((order) => {
              const isExpanded = !!expandedOrderIds[order.id];
              const totalItems = order.items.reduce((acc, it) => acc + it.quantity, 0);
              const isParcel = Boolean(
                order.isParcel ||
                String(order.tableNumber).toUpperCase().includes("PARCEL") ||
                String(order.tableNumber).toUpperCase() === "P" ||
                order.table?.isParcelCounter
              );
              const parcelToken = order.token || String(order.orderSeq || order.orderNumber || "").slice(-4).padStart(4, "0");

              return (
                <div
                  key={order.id}
                  onClick={() => toggleExpand(order.id)}
                  className={`rounded-3xl bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xl border transition-all cursor-pointer ${
                    isExpanded
                      ? "border-amber-500 ring-2 ring-amber-500/20"
                      : "border-amber-500/30 hover:border-amber-500/60"
                  }`}
                >
                  {/* COMPACT HEADER CARD */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-11 ${isParcel ? "px-3" : "w-11"} items-center justify-center rounded-2xl font-mono text-xs font-black shadow-xs ${
                          isParcel
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                            : "bg-amber-100 text-amber-900 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 dark:text-amber-300"
                        }`}
                      >
                        {isParcel ? `📦 #${parcelToken}` : `T#${order.tableNumber}`}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400">
                            {isParcel ? `TOKEN #${parcelToken}` : order.orderNumber}
                          </span>
                          {isParcel && (
                            <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-400 border border-amber-500/30 font-['Cinzel']">
                              Takeaway Parcel
                            </span>
                          )}
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                            order.paymentStatus === "PAID"
                              ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-400 dark:border-emerald-500/30"
                              : "bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-400 dark:border-amber-500/30"
                          }`}>
                            {order.paymentStatus === "PAID" ? "PAID ✓" : "UNPAID"}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          · {totalItems} item{totalItems === 1 ? "" : "s"} ordered
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 font-['Cinzel']">Total Bill</p>
                        <p className="font-mono text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 tabular-nums">
                          ₹{order.total.toFixed(2)}
                        </p>
                      </div>

                      {/* Expand Chevron Icon */}
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 dark:bg-slate-950 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-transform duration-200 ${
                        isExpanded ? "rotate-180 bg-amber-500 text-slate-950" : ""
                      }`}>
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* EXPANDED DETAILED ITEMS BREAKDOWN */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-amber-500/20 animate-in fade-in duration-200 space-y-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-amber-400 mb-2 font-['Cinzel']">
                          Itemized Customer Orders List
                        </p>
                        <div className="rounded-2xl bg-slate-950 p-3 sm:p-4 border border-amber-500/20">
                          <table className="w-full text-left text-xs font-medium text-white">
                            <thead>
                              <tr className="border-b border-slate-800 text-[10px] font-black uppercase text-amber-400/80 font-['Cinzel']">
                                <th className="pb-2">Qty</th>
                                <th className="pb-2">Dish Item</th>
                                <th className="pb-2 text-right">Price</th>
                                <th className="pb-2 text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-semibold">
                              {order.items.map((it) => (
                                <tr key={it.id}>
                                  <td className="py-2.5 text-amber-400 font-mono font-bold">{it.quantity}x</td>
                                  <td className="py-2.5">
                                    <span className="font-['Cinzel'] font-bold text-white">{it.name}</span>
                                    {it.notes && (
                                      <span className="block text-[10px] text-slate-400 font-normal">Note: {it.notes}</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 text-right font-mono text-slate-300">₹{it.price.toFixed(2)}</td>
                                  <td className="py-2.5 text-right font-mono text-amber-300 font-black">₹{(it.price * it.quantity).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {order.specialInstructions && (
                        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs font-bold text-amber-200">
                          <span className="font-black uppercase tracking-wider text-[10px] text-amber-400 block font-['Cinzel']">Instructions:</span>
                          {order.specialInstructions}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <div className="text-xs font-mono font-bold text-slate-400 space-x-3">
                          <span>Subtotal: ₹{order.subtotal.toFixed(2)}</span>
                          <span>GST: ₹{order.gstAmount.toFixed(2)}</span>
                          <span className="font-black text-amber-400">Total: ₹{order.total.toFixed(2)}</span>
                        </div>

                        {order.status !== "SERVED" && (
                          <button
                            type="button"
                            onClick={(e) => advanceOrder(order.id, e)}
                            disabled={busyId === order.id}
                            className="rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-4 py-2 text-xs font-black text-slate-950 shadow-md font-['Cinzel'] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
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
