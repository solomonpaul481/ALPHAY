"use client";

import { useEffect, useState, useRef } from "react";
import Topbar from "@/components/dashboard/Topbar";
import {
  IconOrders,
  IconTransactions,
  IconClock,
  IconCheck,
  IconChef,
} from "@/components/Icons";

export default function ManagerDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [busySessionId, setBusySessionId] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/manager/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 3000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const advanceOrderStatus = async (orderId) => {
    setBusyOrderId(orderId);
    try {
      const res = await fetch(`/api/manager/orders/${orderId}/advance`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error("Failed to advance order:", err);
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleSendBill = async (sessionId) => {
    setBusySessionId(sessionId);
    try {
      const res = await fetch(`/api/manager/sessions/${sessionId}/send-bill`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error("Failed to send bill:", err);
    } finally {
      setBusySessionId(null);
    }
  };

  const handleMarkPaid = async (sessionId, paymentMethod = "CASH") => {
    if (!confirm(`Mark Table Session as PAID (${paymentMethod}) and complete dining?`)) return;
    setBusySessionId(sessionId);
    try {
      const res = await fetch(`/api/manager/sessions/${sessionId}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod }),
      });
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error("Failed to mark session as paid:", err);
    } finally {
      setBusySessionId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 px-3 py-1 text-xs font-black border border-amber-400 dark:border-amber-500/40 animate-pulse font-['Cinzel']">
            CONFIRMED ⏳
          </span>
        );
      case "PREPARING":
        return (
          <span className="rounded-full bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:text-blue-300 px-3 py-1 text-xs font-black border border-blue-400 dark:border-blue-500/40 animate-pulse font-['Cinzel']">
            PREPARING 🍳
          </span>
        );
      case "READY":
        return (
          <span className="rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 px-3 py-1 text-xs font-black border border-emerald-400 dark:border-emerald-500/40 font-['Cinzel']">
            READY FOR SERVING 🔔
          </span>
        );
      case "SERVED":
        return (
          <span className="rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 px-3 py-1 text-xs font-bold font-['Cinzel']">
            SERVED ✓
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-amber-50 text-amber-900 dark:bg-slate-900 dark:text-amber-400 px-3 py-1 text-xs font-bold border border-amber-300 dark:border-amber-500/30 font-['Cinzel']">
            {status}
          </span>
        );
    }
  };

  const getNextActionButton = (orderId, status) => {
    let label = "";
    let btnStyle = "";

    if (status === "CONFIRMED") {
      label = "Start Preparing 🍳";
      btnStyle = "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white";
    } else if (status === "PREPARING") {
      label = "Mark Ready 🔔";
      btnStyle = "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black";
    } else if (status === "READY") {
      label = "Mark Served ✓";
      btnStyle = "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black";
    } else {
      return null;
    }

    return (
      <button
        type="button"
        onClick={() => advanceOrderStatus(orderId)}
        disabled={busyOrderId === orderId}
        className={`rounded-2xl px-4 py-2 text-xs font-bold shadow-md transition-all font-['Cinzel'] cursor-pointer disabled:opacity-50 ${btnStyle}`}
      >
        {busyOrderId === orderId ? "Updating..." : label}
      </button>
    );
  };

  const activeSessionsList = data?.activeSessions || [];
  const billRequestedSessions = activeSessionsList.filter(
    (s) => s.status === "BILL_REQUESTED" || s.status === "BILL_SENT"
  );

  return (
    <>
      <Topbar title="DASHBOARD" />

      <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        {/* TOP OF THE PAGE: NO. OF ORDERS & TODAY'S EARNING */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/20 dark:via-amber-500/10 p-6 border border-amber-500/30 shadow-xl transition-all hover:border-amber-500/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 font-['Cinzel']">
                  No. of Orders
                </p>
                <h3 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                  {loading ? "..." : data?.todayOrders ?? 0}
                </h3>
                <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Total incoming customer orders placed today
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 shadow-lg">
                <IconOrders className="h-7 w-7" />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/20 dark:via-emerald-500/10 p-6 border border-emerald-500/30 shadow-xl transition-all hover:border-emerald-500/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-['Cinzel']">
                  Today's Earning
                </p>
                <h3 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                  {loading ? "..." : `₹${(data?.todayEarnings ?? 0).toLocaleString("en-IN")}`}
                </h3>
                <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Total revenue generated today (Razorpay & Cash)
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-slate-950 shadow-lg">
                <IconTransactions className="h-7 w-7" />
              </div>
            </div>
          </div>
        </section>

        {/* METRIC BOXES */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-5 border border-amber-500/20 shadow-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-400 border border-amber-400/40">
                <IconClock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 font-['Cinzel']">
                  Active Orders
                </p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {loading ? "..." : data?.active ?? 0}
                </p>
              </div>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-5 border border-amber-500/20 shadow-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-400/40">
                <IconCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 font-['Cinzel']">
                  Completed
                </p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {loading ? "..." : data?.completedToday ?? 0}
                </p>
              </div>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-5 border border-amber-500/20 shadow-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-400 border border-rose-400/40">
                <span className="text-base">🧾</span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 font-['Cinzel']">
                  Bill Requests
                </p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {billRequestedSessions.length}
                </p>
              </div>
            </div>
            {billRequestedSessions.length > 0 && <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />}
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-5 border border-amber-500/20 shadow-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <span className="text-base">🪑</span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 font-['Cinzel']">
                  Occupied Tables
                </p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {activeSessionsList.length}
                </p>
              </div>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          </div>
        </section>

        {/* ACTIVE DINING TABLES & BILL REQUESTS (MANAGER ACTIONS) */}
        <section className="rounded-3xl bg-white dark:bg-slate-900 p-6 border border-amber-500/30 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xl">
                🧾
              </div>
              <div>
                <h2 className="text-lg font-extrabold font-['Cinzel'] text-slate-900 dark:text-white tracking-wide flex items-center gap-2">
                  Active Dining Tables & Bill Requests
                  {billRequestedSessions.length > 0 && (
                    <span className="rounded-full bg-rose-500 text-white px-2.5 py-0.5 text-[10px] font-black animate-pulse">
                      {billRequestedSessions.length} BILL{billRequestedSessions.length === 1 ? "" : "S"} REQUESTED
                    </span>
                  )}
                </h2>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Review itemized orders, send bills, and collect Cash / Razorpay payments
                </p>
              </div>
            </div>

            <div className="text-xs font-mono text-amber-500 font-bold">
              {activeSessionsList.length} Active Table{activeSessionsList.length === 1 ? "" : "s"}
            </div>
          </div>

          {activeSessionsList.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-3xl">🍽️</p>
              <h4 className="text-sm font-extrabold text-slate-700 dark:text-slate-300 font-['Cinzel']">
                No Active Dining Sessions Right Now
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                When customers scan table QR codes and order dishes, active tables and bill requests will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeSessionsList.map((sess) => {
                const isBillReq = sess.status === "BILL_REQUESTED";
                const isBillSent = sess.status === "BILL_SENT";

                return (
                  <div
                    key={sess.id}
                    className={`rounded-2xl p-5 border shadow-lg flex flex-col justify-between space-y-4 transition-all ${isBillReq
                        ? "bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/50 shadow-rose-500/10"
                        : "bg-slate-50 dark:bg-slate-950 border-amber-500/20 hover:border-amber-500/40"
                      }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-amber-500/10 pb-3">
                        <div>
                          <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 font-['Cinzel']">
                            Dining Table
                          </span>
                          <h4 className="text-lg font-black text-slate-900 dark:text-white font-mono">
                            Table #{sess.tableNumber}
                          </h4>
                        </div>

                        <div>
                          {isBillReq ? (
                            <span className="rounded-full bg-rose-500 text-white px-3 py-1 text-[11px] font-black animate-pulse font-['Cinzel']">
                              BILL REQUESTED 🔔
                            </span>
                          ) : isBillSent ? (
                            <span className="rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 px-3 py-1 text-[11px] font-bold font-['Cinzel']">
                              BILL SENT 📄
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-1 text-[11px] font-bold font-['Cinzel']">
                              DINING ACTIVE 🍽️
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Items summary */}
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 font-['Cinzel']">
                          Dishes Ordered ({sess.items.reduce((acc, i) => acc + i.quantity, 0)})
                        </p>
                        <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                          {sess.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs font-semibold text-slate-800 dark:text-slate-200">
                              <span className="truncate pr-2">
                                <span className="text-amber-500 font-mono font-bold mr-1">{it.quantity}x</span>
                                {it.name}
                              </span>
                              <span className="font-mono text-slate-400 whitespace-nowrap">
                                ₹{(it.price * it.quantity).toFixed(0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-amber-500/10 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400 font-['Cinzel']">Total Bill:</span>
                        <span className="font-mono text-xl font-black text-amber-600 dark:text-amber-400">
                          ₹{sess.totalAmount.toFixed(2)}
                        </span>
                      </div>

                      {/* Manager Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleSendBill(sess.id)}
                          disabled={busySessionId === sess.id}
                          className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-500/30 py-2.5 px-2 text-[11px] font-extrabold text-amber-300 font-['Cinzel'] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          📄 Send Bill
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMarkPaid(sess.id, "CASH")}
                          disabled={busySessionId === sess.id}
                          className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 py-2.5 px-2 text-[11px] font-black text-slate-950 font-['Cinzel'] transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          💵 Cash Received
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* PARCEL & TAKEAWAY ORDERS FEED */}
        <section className="rounded-3xl bg-white dark:bg-slate-900 p-6 border border-amber-500/30 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xl">
                📦
              </div>
              <div>
                <h2 className="text-lg font-extrabold font-['Cinzel'] text-slate-900 dark:text-white tracking-wide flex items-center gap-2">
                  Parcel & Takeaway Orders
                  <span className="flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 px-2.5 py-0.5 text-[10px] font-black border border-amber-400/40 shadow-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    LIVE COUNTER
                  </span>
                </h2>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Real-time takeaway parcel queue, packaging status, and customer pickup dispatch
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-2 rounded-2xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer border ${autoRefresh
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/40"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700"
                  }`}
              >
                <span className={`h-2 w-2 rounded-full ${autoRefresh ? "bg-emerald-500 animate-ping" : "bg-slate-400"}`} />
                <span className="font-['Cinzel']">
                  Auto-Refresh: {autoRefresh ? "ON (3s)" : "OFF"}
                </span>
              </button>

              <button
                type="button"
                onClick={fetchDashboardData}
                className="rounded-2xl bg-amber-500 hover:bg-amber-400 px-3.5 py-1.5 text-xs font-black text-slate-950 shadow-md font-['Cinzel'] transition-all cursor-pointer active:scale-95"
              >
                Refresh Now 🔄
              </button>
            </div>
          </div>

          {loading && !data ? (
            <div className="py-12 text-center text-xs font-mono text-slate-400">
              Fetching live parcel orders...
            </div>
          ) : !data?.liveOrders || data.liveOrders.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-3xl">📦</p>
              <h4 className="text-sm font-extrabold text-slate-700 dark:text-slate-300 font-['Cinzel']">
                No Active Parcel Orders Right Now
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                New incoming takeaway parcel orders will automatically appear here live.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.liveOrders.map((order) => {
                const isParcel =
                  String(order.table).toUpperCase().includes("PARCEL") ||
                  String(order.table).toUpperCase() === "P";

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-4 border border-amber-500/20 shadow-md flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-amber-500/10 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-500 text-xs">
                            📦
                          </span>
                          <div>
                            <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 font-['Cinzel']">
                              {isParcel ? "Parcel Counter" : "Table Order"}
                            </span>
                            <h4 className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                              {isParcel ? "PARCEL" : `Table #${order.table}`}
                            </h4>
                          </div>
                        </div>
                        <div>{getStatusBadge(order.status)}</div>
                      </div>

                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 font-['Cinzel']">
                          Parcel Items ({order.items.reduce((acc, i) => acc + i.quantity, 0)})
                        </p>
                        <ul className="space-y-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {order.items.map((item, idx) => (
                            <li key={idx} className="flex justify-between items-center">
                              <span className="font-['Cinzel']">
                                <strong className="text-amber-600 dark:text-amber-400 font-mono mr-1">
                                  {item.quantity}x
                                </strong>
                                {item.name}
                              </span>
                              <span className="font-mono text-amber-700 dark:text-amber-300 font-bold">
                                ₹{(item.price * item.quantity).toFixed(0)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-amber-500/10 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 font-['Cinzel']">
                          Total
                        </span>
                        <p className="font-mono text-base font-black text-amber-600 dark:text-amber-400">
                          ₹{order.total.toFixed(2)}
                        </p>
                      </div>

                      <div>
                        {getNextActionButton(order.id, order.status)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
