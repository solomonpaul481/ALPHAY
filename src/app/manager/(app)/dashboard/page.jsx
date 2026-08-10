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
              ALPHAX THERMAL KOT TOKEN
            </span>
            <h3 className="font-display text-xl font-bold text-ink">{restaurantName || "ALPHAX Restaurant"}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-ink2 hover:bg-purple-100">✕</button>
        </div>

        {/* Thermal Slip View */}
        <div className="printable-kot mt-4 rounded-2xl border border-purple-100 bg-purple-50/30 p-5 font-mono text-xs text-ink space-y-3">
          <div className="text-center pb-2 border-b border-dashed border-purple-200">
            <p className="font-bold text-base">ALPHAX KITCHEN TICKET</p>
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
  const [printingOrder, setPrintingOrder] = useState(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/manager/dashboard");
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [load]);

  const advanceOrder = async (orderId) => {
    setBusyId(orderId);
    try {
      await fetch(`/api/manager/orders/${orderId}/advance`, { method: "POST" });
      await load();
    } finally {
      setBusyId(null);
    }
  };

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
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {!data ? (
          <div className="animate-pulse space-y-4">
            <div className="h-28 w-full rounded-3xl bg-purple-50" />
            <div className="h-64 w-full rounded-3xl bg-purple-50" />
          </div>
        ) : (
          <>
            {/* 4 MAIN STAT CARDS */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Today's Sales" value={`₹${data.todayEarnings.toFixed(0)}`} accent="gold" />
              <StatCard label="Today's Orders" value={data.todayOrders} />
              <StatCard label="Active Sessions" value={data.activeSessions?.length || 0} accent="purple" />
              <StatCard label="Completed Orders" value={data.completedToday} accent="veg" />
            </div>

            {/* ASSISTANCE & BILL REQUEST NOTIFICATIONS */}
            {data.staffCalls.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🔔</span>
                  <h2 className="font-display text-lg font-bold text-ink">Customer Requests & Alerts</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  {data.staffCalls.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-soft border border-purple-50"
                    >
                      <div>
                        <p className="text-xs font-bold text-ink">{CALL_LABEL[c.type] || c.type}</p>
                        <p className="text-[11px] font-semibold text-ink2">
                          Table {c.table} · {timeAgo(c.createdAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => resolveCall(c.id)}
                        disabled={busyId === c.id}
                        className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple hover:bg-purple hover:text-white transition-all disabled:opacity-50"
                      >
                        Resolve
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ACTIVE DINING SESSIONS & BILL MANAGEMENT */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-ink">
                    Active Dining Tables & Sessions ({data.activeSessions?.length || 0})
                  </h2>
                  <p className="text-xs font-semibold text-ink2">Review session bills, send bills to customer, and confirm payments.</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  Live Tables
                </span>
              </div>

              {(!data.activeSessions || data.activeSessions.length === 0) ? (
                <div className="rounded-3xl bg-white p-8 text-center shadow-soft border border-purple-50">
                  <p className="text-3xl mb-2">🍽️</p>
                  <p className="font-display text-base font-bold text-ink">No Active Table Sessions</p>
                  <p className="text-xs text-ink2 mt-1">When customers scan table QR codes, active sessions will appear here.</p>
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {data.activeSessions.map((sess) => {
                    const isBillRequested = sess.status === "BILL_REQUESTED";
                    const isBillSent = sess.status === "BILL_SENT";
                    const isOnlinePaid = sess.paymentStatus === "PAID" && sess.paymentMethod === "ONLINE";

                    return (
                      <div key={sess.id} className="rounded-3xl bg-white p-6 shadow-soft border border-purple-50 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between border-b border-purple-50 pb-3">
                            <div>
                              <span className="font-mono text-xs font-bold text-purple">
                                TABLE #{sess.tableNumber}
                              </span>
                              <h3 className="font-display text-lg font-bold text-ink">
                                Session #{sess.id.slice(-6).toUpperCase()}
                              </h3>
                              <p className="text-[11px] font-semibold text-ink2 mt-0.5">
                                Started {timeAgo(sess.createdAt)} · {sess.ordersCount} Order{sess.ordersCount === 1 ? "" : "s"}
                              </p>
                            </div>

                            {/* SESSION STATUS BADGE */}
                            {isOnlinePaid ? (
                              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800 border border-emerald-300">
                                PAID (ONLINE) ✓
                              </span>
                            ) : isBillSent ? (
                              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800 border border-amber-300">
                                BILL SENT 🧾
                              </span>
                            ) : isBillRequested ? (
                              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-800 border border-rose-300 animate-pulse">
                                BILL REQUESTED ⏳
                              </span>
                            ) : (
                              <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple">
                                DINING 🟢
                              </span>
                            )}
                          </div>

                          {/* Itemized Order List */}
                          <div className="mt-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-ink2 mb-1">Session Dishes</p>
                            <ul className="space-y-1.5 text-xs font-semibold text-ink divide-y divide-purple-50/50 max-h-36 overflow-y-auto pr-1">
                              {sess.items.map((it, idx) => (
                                <li key={idx} className="pt-1.5 flex justify-between">
                                  <span><strong className="text-purple">{it.quantity}x</strong> {it.name}</span>
                                  <span className="font-mono text-ink2">₹{(it.price * it.quantity).toFixed(0)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Footer Total & Actions */}
                        <div className="mt-5 pt-3 border-t border-purple-50 space-y-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-[10px] font-bold uppercase text-ink2">Total Session Bill</p>
                              <p className="font-mono text-lg font-black text-purple tabular-nums">
                                ₹{sess.totalAmount.toFixed(2)}
                              </p>
                            </div>

                            {/* MANUAL PAID BUTTON OR AUTOMATIC ONLINE PAID */}
                            <button
                              type="button"
                              onClick={() => markPaid(sess.id, sess.paymentMethod || "CASH")}
                              disabled={busyId === sess.id}
                              className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-soft hover:bg-emerald-700 transition-all cursor-pointer disabled:opacity-50"
                              title="Mark session as Paid and clear active table session"
                            >
                              {busyId === sess.id ? "Processing..." : "✓ Paid"}
                            </button>
                          </div>

                          {/* SEND BILL BUTTON IF REQUESTED */}
                          {isBillRequested && (
                            <button
                              type="button"
                              onClick={() => sendBill(sess.id)}
                              disabled={busyId === sess.id}
                              className="w-full rounded-2xl bg-amber-500 hover:bg-amber-400 py-2 text-xs font-extrabold text-slate-950 transition-all cursor-pointer shadow-soft"
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

            {/* LIVE ORDERS */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-ink">
                    Kitchen Live Orders ({data.liveOrders.length})
                  </h2>
                  <p className="text-xs font-semibold text-ink2">All kitchen items across dining sessions.</p>
                </div>
              </div>

              {data.liveOrders.length === 0 ? (
                <div className="rounded-3xl bg-white p-8 text-center shadow-soft border border-purple-50">
                  <p className="text-3xl mb-2">👨‍🍳</p>
                  <p className="font-display text-base font-bold text-ink">No Kitchen Orders Pending</p>
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {data.liveOrders.map((order) => (
                    <div key={order.id} className="relative rounded-3xl bg-white p-6 shadow-soft border border-purple-50 flex flex-col justify-between">
                      <div>
                        {/* Top Bar */}
                        <div className="flex items-start justify-between border-b border-purple-50 pb-3">
                          <div>
                            <span className="font-mono text-xs font-bold text-purple">
                              ORDER #{order.id.slice(-6).toUpperCase()}
                            </span>
                            <h3 className="font-display text-xl font-bold text-ink">Table {order.table}</h3>
                            <p className="text-[11px] font-semibold text-ink2 mt-0.5">{timeAgo(order.createdAt)}</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setPrintingOrder(order)}
                            className="rounded-xl bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple hover:bg-purple hover:text-white transition-all shadow-xs flex items-center gap-1.5"
                            title="Print KOT Token"
                          >
                            <span>🖨</span>
                            <span>Print Token</span>
                          </button>
                        </div>

                        {/* Status badge */}
                        <div className="mt-3 flex items-center gap-2">
                          <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple">
                            {STATUS_LABEL[order.status] || order.status}
                          </span>
                        </div>

                        {/* Items list */}
                        <ul className="mt-4 space-y-2 text-xs font-semibold text-ink border-t border-purple-50/60 pt-3">
                          {order.items.map((it, i) => (
                            <li key={i} className="flex justify-between items-center">
                              <span>
                                <span className="font-bold text-purple mr-1">{it.quantity}×</span>
                                {it.name}
                              </span>
                              <span className="font-mono text-ink2">₹{(it.price * it.quantity).toFixed(0)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-6 pt-3 border-t border-purple-50 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-ink2">Order Amount</p>
                          <p className="font-mono text-base font-bold text-purple tabular-nums">
                            ₹{order.total.toFixed(0)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => advanceOrder(order.id)}
                          disabled={busyId === order.id}
                          className="rounded-2xl bg-purple px-5 py-2.5 text-xs font-bold text-white shadow-lift hover:bg-purple-deep transition-all active:scale-95 disabled:opacity-50"
                        >
                          {NEXT_ACTION_LABEL[order.status] || "Advance"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {printingOrder && (
        <KotModal
          order={printingOrder}
          restaurantName={data?.restaurantName}
          onClose={() => setPrintingOrder(null)}
        />
      )}
    </>
  );
}
