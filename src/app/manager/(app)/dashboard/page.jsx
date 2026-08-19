"use client";

import { useCallback, useEffect, useState } from "react";
import Topbar from "@/components/dashboard/Topbar";
import StatCard from "@/components/dashboard/StatCard";

const STATUS_LABEL = { CONFIRMED: "CONFIRMED", PREPARING: "PREPARING", READY: "READY" };
const NEXT_ACTION_LABEL = { CONFIRMED: "Mark Preparing", PREPARING: "Mark Ready", READY: "Mark Served" };
const CALL_LABEL = { WAITER: "🙋 Call Waiter", WATER: "💧 Request Water", HELP: "🆘 Need Help", BILL: "🧾 Bill Requested", CASH_BILL: "💵 Cash Payment" };

function timeAgo(iso) {
  if (!iso) return "just now";
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  return `${mins} mins ago`;
}

function KotModal({ order, restaurantName, onClose }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-lift border border-purple-50">
        <div className="flex items-center justify-between border-b border-purple-50 pb-3">
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-purple">
              ALPHAY THERMAL KOT TOKEN
            </span>
            <h3 className="font-display text-xl font-bold text-ink">{restaurantName || "ALPHAY Restaurant"}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-ink2 hover:bg-purple-100">✕</button>
        </div>

        {/* Thermal Slip View */}
        <div className="printable-kot mt-4 rounded-2xl border border-purple-100 bg-purple-50/30 p-5 font-mono text-xs text-ink space-y-3">
          <div className="text-center pb-2 border-b border-dashed border-purple-200">
            <p className="font-bold text-base">ALPHAY KITCHEN TICKET</p>
            <p className="text-[11px] text-ink2">{restaurantName}</p>
          </div>

          <div className="flex justify-between font-bold text-sm">
            <span>ORDER #: {order.id.slice(-6).toUpperCase()}</span>
            <span className="text-purple">TABLE: {order.table}</span>
          </div>

          <p className="text-[11px] text-ink2">
            Time: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>

          <div className="ticket-divider pt-2">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-dashed border-purple-200 text-[10px] uppercase text-ink2">
                  <th className="pb-1 font-bold">QTY</th>
                  <th className="pb-1 font-bold">ITEM</th>
                  <th className="pb-1 text-right font-bold">AMT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {order.items.map((it, i) => (
                  <tr key={i}>
                    <td className="py-1.5 font-bold text-purple">{it.quantity}x</td>
                    <td className="py-1.5 font-semibold text-ink">{it.name}</td>
                    <td className="py-1.5 text-right font-bold text-ink2">₹{(it.price * it.quantity).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-3 border-t border-dashed border-purple-200 flex justify-between font-bold text-sm">
            <span>GRAND TOTAL</span>
            <span>₹{order.total.toFixed(0)}</span>
          </div>

          <div className="text-center pt-2 text-[10px] text-ink2 font-semibold">
            TABLE SESSION KOT ✓
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-purple-50 px-5 py-2.5 text-xs font-bold text-ink2 hover:bg-purple-100"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-2xl bg-purple px-6 py-2.5 text-xs font-bold text-white shadow-lift hover:bg-purple-deep transition-all"
          >
            🖨 Print Token Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManagerDashboardPage() {
  const [data, setData] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/manager/dashboard");
      if (res.status === 401) {
        window.location.href = "/manager/login";
        return;
      }
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error("Dashboard error:", err);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [load]);

  const resolveCall = async (id) => {
    setBusyId(id);
    try {
      await fetch(`/api/manager/staff-calls/${id}/resolve`, { method: "POST" });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const sendBill = async (sessionId) => {
    setBusyId(sessionId);
    try {
      await fetch(`/api/manager/sessions/${sessionId}/send-bill`, { method: "POST" });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const markPaid = async (sessionId, paymentMethod = "CASH") => {
    setBusyId(sessionId);
    try {
      await fetch(`/api/manager/sessions/${sessionId}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod }),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <Topbar title="Manager Dashboard" />
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8 text-slate-900 dark:text-white">
        {!data ? (
          <div className="animate-pulse space-y-4">
            <div className="h-28 w-full rounded-3xl bg-white dark:bg-slate-900 border border-amber-500/20" />
            <div className="h-64 w-full rounded-3xl bg-white dark:bg-slate-900 border border-amber-500/20" />
          </div>
        ) : (
          <>
            {/* TOP URGENT SOS HELP BANNER IF ANY SOS CALL IS ACTIVE */}
            {data.staffCalls?.some((c) => c.type === "HELP") && (
              <div className="rounded-3xl bg-rose-600 p-4 text-white shadow-2xl border-2 border-rose-400 animate-pulse flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl animate-bounce">🚨</span>
                  <div>
                    <h3 className="font-['Cinzel'] text-sm font-black uppercase tracking-wider">URGENT SOS HELP REQUESTED</h3>
                    <p className="text-xs font-semibold text-rose-100">
                      Table(s) {data.staffCalls.filter((c) => c.type === "HELP").map((c) => `#${c.table}`).join(", ")} requested emergency assistance!
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {data.staffCalls.filter((c) => c.type === "HELP").map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => resolveCall(c.id)}
                      disabled={busyId === c.id}
                      className="rounded-xl bg-white text-rose-700 hover:bg-rose-100 px-3 py-1.5 text-xs font-black font-['Cinzel'] shadow-md cursor-pointer"
                    >
                      Resolve Table #{c.table} ✓
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4 MAIN STAT CARDS */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Today's Sales" value={`₹${data.todayEarnings.toFixed(0)}`} accent="gold" />
              <StatCard label="Today's Orders" value={data.todayOrders} />
              <StatCard label="Active Table Sessions" value={data.activeSessions?.length || 0} accent="purple" />
              <StatCard label="Completed Orders" value={data.completedToday} accent="veg" />
            </div>

            {/* ACTIVE DINING SESSIONS & BILL MANAGEMENT */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-['Cinzel'] text-xl font-extrabold text-slate-900 dark:text-white tracking-wide">
                    Active Table Sessions ({data.activeSessions?.length || 0})
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tokens & selected items show automatically when customers order.</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-900 px-3.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30 font-['Cinzel'] shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  Live Table Tokens
                </span>
              </div>

              {(!data.activeSessions || data.activeSessions.length === 0) ? (
                <div className="rounded-3xl bg-white dark:bg-slate-900 p-10 text-center shadow-xl border border-amber-500/30">
                  <p className="text-3xl mb-2">🍽️</p>
                  <p className="font-['Cinzel'] text-base font-extrabold text-slate-900 dark:text-white">No Active Customer Orders</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Table tokens appear here automatically when guests select and place dishes.</p>
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {data.activeSessions.map((sess) => {
                    const isBillRequested = sess.status === "BILL_REQUESTED";
                    const isBillSent = sess.status === "BILL_SENT";
                    const isOnlinePaid = sess.paymentStatus === "PAID" && sess.paymentMethod === "ONLINE";

                    // Check if customer clicked "Call Waiter" or requested assistance for this table
                    const pendingCall = data.staffCalls?.find((c) => String(c.table) === String(sess.tableNumber));
                    const isSosCall = pendingCall?.type === "HELP";

                    return (
                      <div
                        key={sess.id}
                        className={`rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all ${
                          isSosCall
                            ? "bg-rose-500/15 dark:bg-rose-950/90 border-4 border-rose-600 dark:border-rose-500 animate-pulse ring-4 ring-rose-500/40 shadow-2xl shadow-rose-500/50"
                            : pendingCall
                            ? "bg-amber-500/15 dark:bg-amber-950/80 border-4 border-amber-500 dark:border-amber-400 animate-pulse ring-4 ring-amber-500/30 shadow-2xl shadow-amber-500/40"
                            : "bg-white dark:bg-slate-900 border border-amber-500/30"
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between border-b border-amber-500/20 pb-3">
                            <div>
                              <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400">
                                TABLE #{sess.tableNumber}
                              </span>
                              <h3 className="font-['Cinzel'] text-base font-extrabold text-slate-900 dark:text-white">
                                Token #{sess.id.slice(-6).toUpperCase()}
                              </h3>
                              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                Started {timeAgo(sess.createdAt)} · {sess.ordersCount} Order List{sess.ordersCount === 1 ? "" : "s"}
                              </p>
                            </div>

                            {/* SESSION STATUS BADGE */}
                            {isSosCall ? (
                              <span className="rounded-full bg-rose-600 px-3 py-1 text-xs font-black text-white border border-rose-400 animate-bounce shadow-md">
                                🚨 SOS HELP
                              </span>
                            ) : isOnlinePaid ? (
                              <span className="rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-400 px-3 py-1 text-xs font-black border border-emerald-400 dark:border-emerald-500/40">
                                PAID (ONLINE) ✓
                              </span>
                            ) : isBillSent ? (
                              <span className="rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 px-3 py-1 text-xs font-black border border-amber-400 dark:border-amber-500/40">
                                BILL SENT 🧾
                              </span>
                            ) : isBillRequested ? (
                              <span className="rounded-full bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-300 px-3 py-1 text-xs font-black border border-rose-400 dark:border-rose-500/40 animate-pulse">
                                BILL REQUESTED ⏳
                              </span>
                            ) : (
                              <span className="rounded-full bg-amber-50 text-amber-900 dark:bg-slate-950 dark:text-amber-400 px-3 py-1 text-xs font-bold border border-amber-300 dark:border-amber-500/30 font-['Cinzel']">
                                DINING 🟢
                              </span>
                            )}
                          </div>

                          {/* Itemized Order List */}
                          <div className="mt-3">
                            <p className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1.5 font-['Cinzel']">Selected Items</p>
                            <ul className="space-y-2 text-xs font-semibold text-slate-800 dark:text-white divide-y divide-amber-100 dark:divide-slate-800 max-h-40 overflow-y-auto pr-1">
                              {sess.items.map((it, idx) => (
                                <li key={idx} className="pt-2 flex justify-between">
                                  <span className="font-['Cinzel']"><strong className="text-amber-600 dark:text-amber-400 font-mono">{it.quantity}x</strong> {it.name}</span>
                                  <span className="font-mono text-amber-700 dark:text-amber-300 font-bold">₹{(it.price * it.quantity).toFixed(0)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Footer Total & Actions */}
                        <div className="mt-5 pt-3 border-t border-amber-500/20 space-y-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 font-['Cinzel']">Total Session Bill</p>
                              <p className="font-mono text-lg font-black text-amber-600 dark:text-amber-400 tabular-nums">
                                ₹{sess.totalAmount.toFixed(2)}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => markPaid(sess.id, sess.paymentMethod || "CASH")}
                              disabled={busyId === sess.id}
                              className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 px-4 py-2.5 text-xs font-black text-slate-950 shadow-md font-['Cinzel'] transition-all cursor-pointer disabled:opacity-50"
                              title="Mark session as Paid and clear active table session"
                            >
                              {busyId === sess.id ? "Processing..." : "Paid ✓"}
                            </button>
                          </div>

                          {/* LEFT BOTTOM BLINKING CALL BADGE (RED FOR SOS, GOLD FOR CALL WAITER) */}
                          {pendingCall && (
                            <div className={`flex items-center justify-between pt-2 border-t ${isSosCall ? "border-rose-400/60" : "border-amber-400/40"}`}>
                              {isSosCall ? (
                                <span className="flex items-center gap-1.5 rounded-xl bg-rose-600 text-white px-3 py-1.5 text-xs font-black font-['Cinzel'] shadow-md animate-pulse">
                                  🚨 SOS HELP
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 rounded-xl bg-amber-400 text-slate-950 px-3 py-1.5 text-xs font-black font-['Cinzel'] shadow-md">
                                  🔔 CALL WAITER
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => resolveCall(pendingCall.id)}
                                disabled={busyId === pendingCall.id}
                                className={`rounded-xl px-3 py-1 text-[11px] font-bold font-['Cinzel'] cursor-pointer ${
                                  isSosCall
                                    ? "bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
                                    : "bg-amber-500/20 px-3 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-slate-950"
                                }`}
                              >
                                Resolve ✓
                              </button>
                            </div>
                          )}

                          {isBillRequested && (
                            <button
                              type="button"
                              onClick={() => sendBill(sess.id)}
                              disabled={busyId === sess.id}
                              className="w-full rounded-2xl bg-amber-500 hover:bg-amber-400 py-2.5 text-xs font-black text-slate-950 transition-all cursor-pointer shadow-md font-['Cinzel']"
                            >
                              🧾 Send Bill to Customer Device
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}
