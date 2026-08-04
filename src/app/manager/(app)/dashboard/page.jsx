"use client";

import { useCallback, useEffect, useState } from "react";
import Topbar from "@/components/dashboard/Topbar";
import StatCard from "@/components/dashboard/StatCard";

const STATUS_LABEL = { CONFIRMED: "Confirmed", PREPARING: "Preparing", READY: "Ready" };
const NEXT_ACTION_LABEL = { CONFIRMED: "Start Preparing", PREPARING: "Mark Ready", READY: "Mark Served" };
const CALL_LABEL = { WAITER: "🙋 Call Waiter", WATER: "💧 Request Water", HELP: "🆘 Need Help" };

function timeAgo(iso) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-card bg-white p-6 shadow-lift">
        <div className="flex items-center justify-between border-b border-purple-50 pb-3">
          <div>
            <span className="font-mono text-xs font-bold uppercase text-purple">KITCHEN ORDER TICKET (KOT)</span>
            <h3 className="font-display text-lg font-medium text-ink">{restaurantName || "ALPHAY"}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-sm font-semibold text-ink2">✕</button>
        </div>

        {/* Printable Ticket Slip */}
        <div className="printable-kot mt-4 rounded-xl border border-purple-50 bg-cream p-4">
          <div className="flex justify-between font-mono text-xs text-ink">
            <span><strong>ORDER #:</strong> {order.id.slice(-6).toUpperCase()}</span>
            <span><strong>TABLE:</strong> {order.table}</span>
          </div>
          <p className="mt-1 font-mono text-[11px] text-ink2">
            Time: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>

          <div className="ticket-divider mt-3 pt-3">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-purple-50 text-[10px] uppercase text-ink2">
                  <th className="pb-1 font-bold">QTY</th>
                  <th className="pb-1 font-bold">ITEM</th>
                  <th className="pb-1 text-right font-bold">AMT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50/50">
                {order.items.map((it, i) => (
                  <tr key={i}>
                    <td className="py-1.5 font-bold text-purple">{it.quantity}x</td>
                    <td className="py-1.5 font-medium text-ink">{it.name}</td>
                    <td className="py-1.5 text-right text-ink2">₹{(it.price * it.quantity).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ticket-divider mt-3 flex justify-between pt-3 font-mono text-xs font-bold text-ink">
            <span>TOTAL</span>
            <span>₹{order.total.toFixed(0)}</span>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-cream px-4 py-2.5 text-xs font-semibold text-ink2"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-xl bg-purple px-5 py-2.5 text-xs font-semibold text-white shadow-soft"
          >
            🖨 Print Ticket Now
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
    const interval = setInterval(load, 6000);
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

  return (
    <>
      <Topbar title="Manager Dashboard" />
      <div className="p-6">
        {!data ? (
          <div className="animate-pulse text-sm text-ink2">Loading…</div>
        ) : (
          <>
            {/* EXACTLY 5 STAT BOXES */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <StatCard label="Orders Today" value={data.todayOrders} />
              <StatCard label="Earnings Today" value={`₹${data.todayEarnings.toFixed(0)}`} accent="gold" />
              <StatCard label="Active Orders" value={data.active} accent="purple" />
              <StatCard label="Ready Orders" value={data.ready} accent="veg" />
              <StatCard label="Completed Orders" value={data.completedToday} accent="veg" />
            </div>

            {/* ASSISTANCE REQUESTS */}
            {data.staffCalls.length > 0 && (
              <section className="mt-6">
                <h2 className="font-display text-lg font-medium text-ink">Assistance Requests</h2>
                <div className="mt-3 flex flex-wrap gap-3">
                  {data.staffCalls.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-soft"
                    >
                      <div>
                        <p className="text-sm font-semibold text-ink">{CALL_LABEL[c.type]}</p>
                        <p className="text-xs text-ink2">
                          Table {c.table} · {timeAgo(c.createdAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => resolveCall(c.id)}
                        disabled={busyId === c.id}
                        className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple disabled:opacity-50"
                      >
                        Resolve
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* LIVE ORDERS WITH KOT PRINT AT TOP RIGHT CORNER OF TOKEN */}
            <section className="mt-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-medium text-ink">
                  Live Orders ({data.liveOrders.length})
                </h2>
                <span className="text-xs font-mono text-ink2">Auto-refreshing live</span>
              </div>

              {data.liveOrders.length === 0 ? (
                <p className="mt-3 rounded-card bg-white p-6 text-center text-sm text-ink2 shadow-soft">
                  No active orders right now.
                </p>
              ) : (
                <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {data.liveOrders.map((order) => (
                    <div key={order.id} className="relative rounded-card bg-white p-5 shadow-soft border border-purple-50">
                      {/* TOP RIGHT CORNER: PRINT KOT TOKEN BUTTON */}
                      <button
                        type="button"
                        onClick={() => setPrintingOrder(order)}
                        className="absolute top-4 right-4 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple hover:bg-purple hover:text-white transition-all shadow-sm flex items-center gap-1"
                        title="Print KOT Token"
                      >
                        <span>🖨</span>
                        <span>Print KOT</span>
                      </button>

                      <div className="pr-24">
                        <p className="font-mono text-xs uppercase tracking-wide text-ink2">
                          Order #{order.id.slice(-6).toUpperCase()}
                        </p>
                        <p className="font-display text-lg font-medium text-ink">Table {order.table}</p>
                      </div>

                      <div className="mt-2">
                        <span className="inline-block rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple">
                          {STATUS_LABEL[order.status]}
                        </span>
                      </div>

                      <ul className="mt-4 space-y-1.5 text-sm text-ink2 border-t border-purple-50/60 pt-3">
                        {order.items.map((it, i) => (
                          <li key={i} className="flex justify-between">
                            <span className="font-medium text-ink">
                              <span className="font-bold text-purple">{it.quantity}×</span> {it.name}
                            </span>
                            <span className="font-mono text-xs">₹{(it.price * it.quantity).toFixed(0)}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="ticket-divider mt-4 flex items-center justify-between pt-3">
                        <div>
                          <p className="font-mono text-sm font-bold tabular-nums text-ink">
                            ₹{order.total.toFixed(0)}
                          </p>
                          <p className="text-xs text-ink2">{timeAgo(order.createdAt)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => advanceOrder(order.id)}
                          disabled={busyId === order.id}
                          className="rounded-xl bg-purple px-4 py-2 text-xs font-semibold text-white shadow-soft active:scale-95 disabled:opacity-50"
                        >
                          {NEXT_ACTION_LABEL[order.status]}
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
