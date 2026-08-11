"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

function playOrderSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "triangle";

    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5

    osc2.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.6);
    osc2.stop(ctx.currentTime + 0.6);
  } catch (err) {
    // Audio context may require initial click interaction
  }
}

function timeAgo(iso) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "Just now";
  if (mins === 1) return "1m ago";
  return `${mins}m ago`;
}

export default function KitchenDisplayPage() {
  const { restaurantId } = useParams();
  const [data, setData] = useState(null);
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const knownOrderIds = useRef(new Set());
  const isInitialLoad = useRef(true);

  const fetchOrders = useCallback(async () => {
    try {
      const url = restaurantId
        ? `/api/kitchen/orders?restaurantId=${restaurantId}`
        : "/api/kitchen/orders";
      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      const currentOrders = json.orders || [];

      // Check for new orders
      const newIds = new Set(currentOrders.map((o) => o.id));
      let brandNewOrder = null;

      for (const order of currentOrders) {
        if (!knownOrderIds.current.has(order.id) && order.status === "CONFIRMED") {
          brandNewOrder = order;
          break;
        }
      }

      knownOrderIds.current = newIds;

      if (brandNewOrder && !isInitialLoad.current) {
        if (audioEnabled) playOrderSound();
        setNewOrderAlert(brandNewOrder);
        setTimeout(() => setNewOrderAlert(null), 6000);
      }

      isInitialLoad.current = false;
      setData(json);
    } catch (err) {
      console.warn("KDS poll error:", err);
    }
  }, [restaurantId, audioEnabled]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await fetch(`/api/kitchen/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchOrders();
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const newOrders = (data?.orders || []).filter((o) => o.status === "CONFIRMED");
  const preparingOrders = (data?.orders || []).filter((o) => o.status === "PREPARING");
  const readyOrders = (data?.orders || []).filter((o) => o.status === "READY");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Sound enablement / user interaction trigger overlay if browser audio blocked */}
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl bg-amber-500 text-slate-950 px-6 py-4 shadow-2xl border-2 border-amber-300 font-bold"
          >
            <span className="text-3xl animate-bounce">🔔</span>
            <div>
              <p className="text-lg uppercase tracking-wider">NEW ORDER ARRIVED!</p>
              <p className="text-sm font-mono">
                ORDER #{newOrderAlert.orderNumber} · TABLE {newOrderAlert.tableNumber}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* High-Contrast KDS Top Bar */}
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-2xl text-white font-bold shadow-lg">
            👨‍🍳
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wide text-white">
              {data?.restaurant?.name || "ALPHAY"} — KITCHEN DISPLAY SYSTEM
            </h1>
            <p className="text-xs font-mono font-bold text-emerald-400">
              ● REAL-TIME LIVE SYNC ACTIVE
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all border ${
              audioEnabled
                ? "bg-purple-900/60 text-purple-300 border-purple-500"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            <span>{audioEnabled ? "🔊 Sound Alert On" : "🔇 Muted"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              } else {
                document.exitFullscreen().catch(() => {});
              }
            }}
            className="rounded-2xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 border border-slate-700"
          >
            ⛶ Fullscreen
          </button>
        </div>
      </header>

      {/* Main 3 Column KDS Layout */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 p-6 overflow-hidden">
        {/* COLUMN 1: NEW */}
        <section className="flex flex-col rounded-3xl bg-slate-900/80 border-2 border-red-500/40 p-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-red-500/30 pb-3 mb-4">
            <h2 className="text-xl font-black text-red-400 tracking-wider flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full bg-red-500 animate-ping" />
              NEW ORDERS ({newOrders.length})
            </h2>
            <span className="text-xs font-mono font-bold bg-red-950/80 text-red-300 px-3 py-1 rounded-full border border-red-800">
              ACTION REQUIRED
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
            {newOrders.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-slate-600 font-bold text-sm">
                No new incoming orders
              </div>
            ) : (
              newOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl bg-slate-950 p-5 border-2 border-red-500/60 shadow-2xl flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                      <div>
                        <span className="font-mono text-xs font-bold text-red-400">
                          ORDER #{order.orderNumber}
                        </span>
                        <h3 className="text-3xl font-black text-white mt-0.5">
                          TABLE {order.tableNumber}
                        </h3>
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg">
                        {timeAgo(order.createdAt)}
                      </span>
                    </div>

                    {order.specialInstructions && (
                      <div className="mt-3 rounded-xl bg-amber-950/80 border border-amber-500/60 p-3 text-amber-300 text-xs font-bold">
                        ⚠️ SPECIAL: {order.specialInstructions}
                      </div>
                    )}

                    <ul className="mt-4 space-y-2 font-mono text-base font-bold text-slate-100 divide-y divide-slate-900">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="pt-2 flex items-start gap-2">
                          <span className="text-emerald-400 font-black text-xl leading-none">
                            {item.quantity}×
                          </span>
                          <span className="text-white text-lg font-sans font-bold leading-tight">
                            {item.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => updateStatus(order.id, "PREPARING")}
                    className="w-full rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 py-4 text-lg font-black tracking-wider uppercase shadow-xl transition-all active:scale-95 cursor-pointer"
                  >
                    ▶ START PREPARING
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* COLUMN 2: PREPARING */}
        <section className="flex flex-col rounded-3xl bg-slate-900/80 border-2 border-amber-500/40 p-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-amber-500/30 pb-3 mb-4">
            <h2 className="text-xl font-black text-amber-400 tracking-wider flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full bg-amber-500" />
              PREPARING ({preparingOrders.length})
            </h2>
            <span className="text-xs font-mono font-bold bg-amber-950/80 text-amber-300 px-3 py-1 rounded-full border border-amber-800">
              IN KITCHEN
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
            {preparingOrders.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-slate-600 font-bold text-sm">
                No orders currently preparing
              </div>
            ) : (
              preparingOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl bg-slate-950 p-5 border-2 border-amber-500/60 shadow-2xl flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                      <div>
                        <span className="font-mono text-xs font-bold text-amber-400">
                          ORDER #{order.orderNumber}
                        </span>
                        <h3 className="text-3xl font-black text-white mt-0.5">
                          TABLE {order.tableNumber}
                        </h3>
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg">
                        {timeAgo(order.createdAt)}
                      </span>
                    </div>

                    {order.specialInstructions && (
                      <div className="mt-3 rounded-xl bg-amber-950/80 border border-amber-500/60 p-3 text-amber-300 text-xs font-bold">
                        ⚠️ SPECIAL: {order.specialInstructions}
                      </div>
                    )}

                    <ul className="mt-4 space-y-2 font-mono text-base font-bold text-slate-100 divide-y divide-slate-900">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="pt-2 flex items-start gap-2">
                          <span className="text-amber-400 font-black text-xl leading-none">
                            {item.quantity}×
                          </span>
                          <span className="text-white text-lg font-sans font-bold leading-tight">
                            {item.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => updateStatus(order.id, "READY")}
                    className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-4 text-lg font-black tracking-wider uppercase shadow-xl transition-all active:scale-95 cursor-pointer"
                  >
                    ✓ MARK READY
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* COLUMN 3: READY */}
        <section className="flex flex-col rounded-3xl bg-slate-900/80 border-2 border-emerald-500/40 p-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3 mb-4">
            <h2 className="text-xl font-black text-emerald-400 tracking-wider flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full bg-emerald-500" />
              READY ({readyOrders.length})
            </h2>
            <span className="text-xs font-mono font-bold bg-emerald-950/80 text-emerald-300 px-3 py-1 rounded-full border border-emerald-800">
              TO SERVE
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
            {readyOrders.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-slate-600 font-bold text-sm">
                No orders waiting for pickup
              </div>
            ) : (
              readyOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl bg-slate-950 p-5 border-2 border-emerald-500/60 shadow-2xl flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                      <div>
                        <span className="font-mono text-xs font-bold text-emerald-400">
                          ORDER #{order.orderNumber}
                        </span>
                        <h3 className="text-3xl font-black text-white mt-0.5">
                          TABLE {order.tableNumber}
                        </h3>
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg">
                        {timeAgo(order.createdAt)}
                      </span>
                    </div>

                    <ul className="mt-4 space-y-2 font-mono text-base font-bold text-slate-100 divide-y divide-slate-900">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="pt-2 flex items-start gap-2">
                          <span className="text-emerald-400 font-black text-xl leading-none">
                            {item.quantity}×
                          </span>
                          <span className="text-white text-lg font-sans font-bold leading-tight">
                            {item.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => updateStatus(order.id, "SERVED")}
                    className="w-full rounded-2xl bg-purple-600 hover:bg-purple-500 text-white py-4 text-lg font-black tracking-wider uppercase shadow-xl transition-all active:scale-95 cursor-pointer"
                  >
                    🍽️ MARK SERVED
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
