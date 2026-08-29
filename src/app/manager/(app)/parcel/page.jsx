"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/dashboard/Topbar";
import { IconCheck, IconClock, IconSparkles } from "@/components/Icons";

const RANGE_LABELS = {
  today: "Today",
  yesterday: "Yesterday",
  week: "This Week",
  month: "This Month",
};

export default function ManagerParcelOrdersPage() {
  const [range, setRange] = useState("today");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | PENDING | PREPARING | READY | COMPLETED
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
      console.error("Failed to load parcel orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadOrders();
    const interval = setInterval(loadOrders, 4000);
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
  
  // Filter exclusively for Parcel orders (table is PARCEL / isParcelCounter)
  const parcelOrders = allOrders.filter((o) => {
    return (
      String(o.tableNumber).toUpperCase().includes("PARCEL") ||
      String(o.tableNumber).toUpperCase() === "P" ||
      o.table?.isParcelCounter ||
      o.isParcel
    );
  });

  const displayList = parcelOrders;

  const filteredOrders = displayList.filter((o) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "PENDING") return o.status === "PENDING" || o.status === "CONFIRMED";
    if (statusFilter === "PREPARING") return o.status === "PREPARING" || o.status === "COOKING";
    if (statusFilter === "READY") return o.status === "READY" || o.status === "READY_FOR_PICKUP";
    if (statusFilter === "COMPLETED") return o.status === "COMPLETED" || o.status === "SERVED" || o.status === "PAID";
    return true;
  });

  const pendingCount = displayList.filter((o) => o.status === "PENDING" || o.status === "CONFIRMED").length;
  const preparingCount = displayList.filter((o) => o.status === "PREPARING" || o.status === "COOKING").length;
  const readyCount = displayList.filter((o) => o.status === "READY" || o.status === "READY_FOR_PICKUP").length;
  const completedCount = displayList.filter((o) => o.status === "COMPLETED" || o.status === "SERVED" || o.status === "PAID").length;

  return (
    <>
      <Topbar title="Parcel Orders" />
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-900 dark:text-white">
        {/* HEADER & METRIC STATS */}
        <div className="rounded-3xl bg-slate-900/90 border border-amber-500/30 p-6 shadow-2xl backdrop-blur-xl text-white space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 text-2xl font-black shadow-lg shadow-amber-500/20">
                📦
              </div>
              <div>
                <h2 className="font-['Cinzel'] text-xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100">
                  Parcel & Takeaway Counter
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Live parcel orders, takeaway packaging queue, and customer pickup management.
                </p>
              </div>
            </div>

            {/* DATE RANGE FILTERS */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-slate-950/80 p-1.5 border border-amber-500/30 shadow-inner">
              <span className="text-[11px] font-black text-amber-400 px-2 font-['Cinzel'] uppercase">Time:</span>
              {["today", "yesterday", "week", "month"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-black transition-all cursor-pointer font-['Cinzel'] ${
                    range === r
                      ? "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 shadow-md"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {RANGE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          {/* PARCEL PIPELINE METRIC BOXES */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => setStatusFilter("PENDING")}
              className={`rounded-2xl p-4 border text-left transition-all cursor-pointer ${
                statusFilter === "PENDING"
                  ? "bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/30 shadow-lg"
                  : "bg-slate-950/60 border-amber-500/20 hover:border-amber-500/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 font-['Cinzel']">
                  ⏳ New / Pending
                </span>
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              </div>
              <p className="mt-2 font-mono text-2xl font-black text-white">{pendingCount}</p>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("PREPARING")}
              className={`rounded-2xl p-4 border text-left transition-all cursor-pointer ${
                statusFilter === "PREPARING"
                  ? "bg-indigo-500/20 border-indigo-400 ring-2 ring-indigo-400/30 shadow-lg"
                  : "bg-slate-950/60 border-amber-500/20 hover:border-amber-500/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 font-['Cinzel']">
                  👨‍🍳 Packing / Cooking
                </span>
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
              </div>
              <p className="mt-2 font-mono text-2xl font-black text-white">{preparingCount}</p>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("READY")}
              className={`rounded-2xl p-4 border text-left transition-all cursor-pointer ${
                statusFilter === "READY"
                  ? "bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-400/30 shadow-lg"
                  : "bg-slate-950/60 border-amber-500/20 hover:border-amber-500/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 font-['Cinzel']">
                  🛍️ Ready for Pickup
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>
              <p className="mt-2 font-mono text-2xl font-black text-white">{readyCount}</p>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("COMPLETED")}
              className={`rounded-2xl p-4 border text-left transition-all cursor-pointer ${
                statusFilter === "COMPLETED"
                  ? "bg-slate-800 border-amber-400 ring-2 ring-amber-400/30 shadow-lg"
                  : "bg-slate-950/60 border-amber-500/20 hover:border-amber-500/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-['Cinzel']">
                  ✓ Handed Over
                </span>
                <span className="h-2 w-2 rounded-full bg-slate-600" />
              </div>
              <p className="mt-2 font-mono text-2xl font-black text-slate-300">{completedCount}</p>
            </button>
          </div>
        </div>

        {/* STATUS FILTER PILLS */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "ALL", label: "All Parcel Orders" },
              { id: "PENDING", label: "⏳ Pending" },
              { id: "PREPARING", label: "👨‍🍳 Kitchen Preparing" },
              { id: "READY", label: "🛍️ Ready for Pickup" },
              { id: "COMPLETED", label: "✓ Handed Over" },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer font-['Cinzel'] ${
                  statusFilter === st.id
                    ? "bg-amber-500 text-slate-950 font-black shadow-md"
                    : "bg-slate-900/80 text-slate-300 border border-amber-500/20 hover:border-amber-500/50"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <span className="text-xs font-mono text-amber-400 font-bold">
            Showing {filteredOrders.length} Parcel Order{filteredOrders.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* PARCEL ORDERS LIST */}
        {loading && !ordersData ? (
          <div className="animate-pulse text-xs font-bold text-amber-400 p-12 text-center font-['Cinzel'] rounded-3xl bg-slate-900/90 border border-amber-500/30">
            Loading live parcel orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-3xl bg-slate-900/90 p-12 text-center text-xs font-bold text-slate-400 shadow-xl border border-amber-500/30 font-['Cinzel'] space-y-2">
            <p className="text-3xl">📦</p>
            <h3 className="text-sm font-extrabold text-white">No Parcel Orders in this queue</h3>
            <p className="text-[11px] text-slate-500">
              When customers scan the Parcel Takeaway QR or place parcel orders, they will appear live here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isExpanded = !!expandedOrderIds[order.id];
              const totalItems = (order.items || []).reduce((acc, it) => acc + it.quantity, 0);

              return (
                <div
                  key={order.id}
                  onClick={() => toggleExpand(order.id)}
                  className={`rounded-3xl bg-slate-900/90 backdrop-blur-xl p-5 shadow-2xl border transition-all cursor-pointer ${
                    isExpanded
                      ? "border-amber-400 ring-2 ring-amber-400/20"
                      : "border-amber-500/30 hover:border-amber-500/60"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-12 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-xs font-black shadow-inner">
                        #{String(order.orderSeq || order.orderNumber || "1024").slice(-4).padStart(4, "0")}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-black text-amber-400">
                            Token #{String(order.orderSeq || order.orderNumber || "1024").slice(-4).padStart(4, "0")}
                          </span>
                          <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-400 border border-amber-500/30 font-['Cinzel']">
                            Takeaway Parcel
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                              order.status === "READY"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : order.status === "PREPARING"
                                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            }`}
                          >
                            {order.status || "CONFIRMED"}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-400 mt-1">
                          Placed at {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {totalItems} item{totalItems === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase font-['Cinzel']">Total Amount</p>
                        <p className="font-mono text-lg font-black text-amber-400">
                          ₹{(order.total || 0).toFixed(2)}
                        </p>
                      </div>

                      {/* QUICK ACTION BUTTON */}
                      <button
                        type="button"
                        onClick={(e) => advanceOrder(order.id, e)}
                        disabled={busyId === order.id}
                        className="rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-4 py-2.5 text-xs font-black text-slate-950 shadow-md font-['Cinzel'] cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                      >
                        {busyId === order.id
                          ? "Updating..."
                          : order.status === "PENDING"
                          ? "👨‍🍳 Start Preparing"
                          : order.status === "PREPARING"
                          ? "🛍️ Mark Ready"
                          : order.status === "READY"
                          ? "📦 Mark as Parceled"
                          : "Advance Order →"}
                      </button>
                    </div>
                  </div>

                  {/* EXPANDED ITEM DETAILS */}
                  {isExpanded && (
                    <div className="mt-5 pt-4 border-t border-slate-800 space-y-3">
                      <h4 className="text-xs font-black uppercase text-amber-400 font-['Cinzel'] tracking-wider">
                        Itemized Parcel Contents
                      </h4>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {order.items?.map((it) => (
                          <div
                            key={it.id}
                            className="rounded-2xl bg-slate-950/80 border border-amber-500/20 p-3 flex items-center justify-between"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-black text-amber-400">{it.quantity}×</span>
                                <span className="text-xs font-bold text-white font-['Cinzel']">{it.name}</span>
                              </div>
                              {it.notes && (
                                <p className="text-[10px] text-slate-400 italic pl-5 mt-0.5">Note: {it.notes}</p>
                              )}
                            </div>
                            <span className="font-mono text-xs font-bold text-slate-300">
                              ₹{((it.price || 0) * it.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.specialInstructions && (
                        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-200">
                          <strong>Parcel Instructions:</strong> {order.specialInstructions}
                        </div>
                      )}
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
