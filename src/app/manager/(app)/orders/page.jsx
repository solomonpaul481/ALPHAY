"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/dashboard/Topbar";

export default function ManagerOrdersPage() {
  const [data, setData] = useState(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    const res = await fetch("/api/manager/dashboard");
    if (res.ok) setData(await res.json());
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const advanceOrder = async (orderId) => {
    setBusyId(orderId);
    try {
      await fetch(`/api/manager/orders/${orderId}/advance`, { method: "POST" });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const filteredOrders = (data?.liveOrders || []).filter((o) => {
    if (filterStatus === "ALL") return true;
    return o.status === filterStatus;
  });

  return (
    <>
      <Topbar title="Live Orders Management" />
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Status Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl shadow-soft border border-purple-50">
          <div className="flex flex-wrap gap-2">
            {["ALL", "CONFIRMED", "PREPARING", "READY"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`rounded-2xl px-4 py-2 text-xs font-bold transition-all ${
                  filterStatus === st
                    ? "bg-purple text-white shadow-soft"
                    : "bg-purple-50 text-ink2 hover:bg-purple-100"
                }`}
              >
                {st === "ALL" ? "All Orders" : st}
              </button>
            ))}
          </div>

          <span className="text-xs font-semibold text-ink2 font-mono">
            Showing {filteredOrders.length} orders
          </span>
        </div>

        {/* Orders Grid */}
        {!data ? (
          <div className="animate-pulse text-sm text-ink2">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center text-sm font-semibold text-ink2 shadow-soft border border-purple-50">
            No orders match the selected filter.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredOrders.map((order) => (
              <div key={order.id} className="rounded-3xl bg-white p-6 shadow-soft border border-purple-50 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start border-b border-purple-50 pb-3">
                    <div>
                      <p className="font-mono text-xs font-bold text-purple">
                        ORDER #{order.id.slice(-6).toUpperCase()}
                      </p>
                      <h3 className="font-display text-xl font-bold text-ink">Table {order.table}</h3>
                    </div>
                    <span className="rounded-full bg-veg-tint px-2.5 py-0.5 text-xs font-bold text-veg">
                      PAID ✓
                    </span>
                  </div>

                  <div className="mt-3">
                    <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple">
                      Status: {order.status}
                    </span>
                  </div>

                  <ul className="mt-4 space-y-2 text-xs font-semibold text-ink divide-y divide-purple-50/50">
                    {order.items.map((it, idx) => (
                      <li key={idx} className="pt-2 flex justify-between">
                        <span><strong className="text-purple">{it.quantity}x</strong> {it.name}</span>
                        <span className="font-mono text-ink2">₹{(it.price * it.quantity).toFixed(0)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-3 border-t border-purple-50 flex justify-between items-center">
                  <span className="font-mono text-base font-bold text-purple">₹{order.total.toFixed(0)}</span>
                  {order.status !== "SERVED" && (
                    <button
                      type="button"
                      onClick={() => advanceOrder(order.id)}
                      disabled={busyId === order.id}
                      className="rounded-2xl bg-purple px-4 py-2 text-xs font-bold text-white shadow-soft hover:bg-purple-deep transition-all disabled:opacity-50"
                    >
                      Advance Status →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
