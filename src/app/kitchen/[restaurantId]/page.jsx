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

function playCancellationWarningSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(350, ctx.currentTime);
    osc.frequency.setValueAtTime(180, ctx.currentTime + 0.15);
    osc.frequency.setValueAtTime(350, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (err) {
    // Audio context may require click
  }
}

function KitchenOrderCard({ order, currentStatus, onUpdateStatus }) {
  const isParcel = order.isParcel || String(order.tableNumber).toUpperCase().includes("PARCEL");
  const isNew = currentStatus === "CONFIRMED";
  const isPrep = currentStatus === "PREPARING";
  const isReady = currentStatus === "READY";

  const borderColor = isNew
    ? "border-red-500/60"
    : isPrep
    ? "border-amber-500/60"
    : "border-emerald-500/60";

  return (
    <div
      className={`rounded-2xl bg-slate-950 p-5 border-2 ${borderColor} shadow-2xl flex flex-col justify-between space-y-4 transition-all hover:border-slate-400/50`}
    >
      <div>
        <div className="flex justify-between items-start border-b border-slate-800 pb-3">
          <div>
            <span
              className={`font-mono text-xs font-bold ${
                isNew ? "text-red-400" : isPrep ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              {order.isCafeteria ? "CAFETERIA TOKEN" : (isParcel ? "PARCEL TAKEAWAY" : `ORDER #${order.orderNumber}`)}
            </span>
            {order.isCafeteria || isParcel ? (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center rounded-lg bg-amber-500/20 px-2 py-0.5 text-xs font-black uppercase tracking-wider text-amber-400 border border-amber-500/40 font-mono">
                  {order.isCafeteria ? "☕ TOKEN" : "📦 PARCEL"}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
                  #{order.token || order.orderNumber}
                </h3>
              </div>
            ) : (
              <h3 className="text-3xl font-black text-white mt-0.5">
                TABLE {order.tableNumber}
              </h3>
            )}
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
              <span
                className={`font-black text-xl leading-none ${
                  isNew ? "text-emerald-400" : isPrep ? "text-amber-400" : "text-emerald-400"
                }`}
              >
                {item.quantity}×
              </span>
              <span className="text-white text-lg font-sans font-bold leading-tight">
                {item.name}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* QUICK SHIFT CONTROLS & PRIMARY ACTION */}
      <div className="space-y-3 pt-2 border-t border-slate-900">
        {/* FAST SHIFT PILLS BAR: Allows instantaneous jumping between carts */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
            <span className="flex items-center gap-1 text-amber-400">
              <span>⚡</span> Fast Shift Cart:
            </span>
            <span className="text-slate-500">1-Tap Direct Move</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
            <button
              type="button"
              disabled={isNew}
              onClick={() => onUpdateStatus(order.id, "CONFIRMED")}
              className={`rounded-lg py-1.5 text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                isNew
                  ? "bg-red-500 text-white shadow-md ring-2 ring-red-400/50 cursor-default"
                  : "bg-slate-950 text-slate-300 hover:bg-red-950/80 hover:text-red-300 hover:border-red-500/50 border border-slate-800 active:scale-95"
              }`}
              title={isNew ? "Currently in New Orders" : "Shift to New Orders"}
            >
              <span>🔴</span>
              <span>New</span>
            </button>

            <button
              type="button"
              disabled={isPrep}
              onClick={() => onUpdateStatus(order.id, "PREPARING")}
              className={`rounded-lg py-1.5 text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                isPrep
                  ? "bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/50 cursor-default"
                  : "bg-slate-950 text-slate-300 hover:bg-amber-950/80 hover:text-amber-300 hover:border-amber-500/50 border border-slate-800 active:scale-95"
              }`}
              title={isPrep ? "Currently Preparing" : "Shift to Preparing"}
            >
              <span>🟡</span>
              <span>Prep</span>
            </button>

            <button
              type="button"
              disabled={isReady}
              onClick={() => onUpdateStatus(order.id, "READY")}
              className={`rounded-lg py-1.5 text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                isReady
                  ? "bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-400/50 cursor-default"
                  : "bg-slate-950 text-slate-300 hover:bg-emerald-950/80 hover:text-emerald-300 hover:border-emerald-500/50 border border-slate-800 active:scale-95"
              }`}
              title={isReady ? "Currently Ready" : "Shift to Ready"}
            >
              <span>🟢</span>
              <span>Ready</span>
            </button>

            <button
              type="button"
              onClick={() => onUpdateStatus(order.id, "SERVED")}
              className="rounded-lg py-1.5 text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 bg-slate-950 text-slate-300 hover:bg-purple-900/80 hover:text-purple-200 hover:border-purple-500/50 border border-slate-800 active:scale-95"
              title="Mark as Served / Done"
            >
              <span>🍽️</span>
              <span>Done</span>
            </button>
          </div>
        </div>

        {/* PRIMARY BIG ACTION BUTTON */}
        {isNew && (
          <button
            type="button"
            onClick={() => onUpdateStatus(order.id, "PREPARING")}
            className="w-full rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 py-3.5 text-base sm:text-lg font-black tracking-wider uppercase shadow-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>▶</span>
            <span>START PREPARING</span>
          </button>
        )}

        {isPrep && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onUpdateStatus(order.id, "READY")}
              className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3.5 text-base sm:text-lg font-black tracking-wider uppercase shadow-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>✓</span>
              <span>MARK READY</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdateStatus(order.id, "CONFIRMED")}
              className="w-full py-1 text-xs font-bold text-slate-400 hover:text-red-300 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>◀</span>
              <span>Rewind to New Orders</span>
            </button>
          </div>
        )}

        {isReady && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onUpdateStatus(order.id, "SERVED")}
              className="w-full rounded-2xl bg-purple-600 hover:bg-purple-500 text-white py-3.5 text-base sm:text-lg font-black tracking-wider uppercase shadow-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{isParcel ? "📦" : "🍽️"}</span>
              <span>{isParcel ? "MARK AS PARCELED" : "MARK SERVED"}</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdateStatus(order.id, "PREPARING")}
              className="w-full py-1 text-xs font-bold text-slate-400 hover:text-amber-300 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>◀</span>
              <span>Return to Preparing</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function KitchenDisplayPage() {
  const { restaurantId } = useParams();
  const [data, setData] = useState(null);
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const [cancelAlert, setCancelAlert] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const knownOrderIds = useRef(new Set());
  const knownCancelledIds = useRef(new Set());
  const isInitialLoad = useRef(true);
  const clearedCancelledIdsRef = useRef(new Set());

  // Load previously cleared cancelled items from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`alphay_kds_cleared_${restaurantId || "default"}`);
        if (stored) {
          clearedCancelledIdsRef.current = new Set(JSON.parse(stored));
        }
      } catch {}
    }
  }, [restaurantId]);

  const fetchOrders = useCallback(async () => {
    try {
      const url = restaurantId
        ? `/api/kitchen/orders?restaurantId=${restaurantId}`
        : "/api/kitchen/orders";
      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      const currentOrders = json.orders || [];
      const rawCancelled = json.cancelledItems || [];

      // Filter out items already marked 'Done' by the chef
      const cancelledItems = rawCancelled.filter(
        (item) => !clearedCancelledIdsRef.current.has(item.id)
      );
      json.cancelledItems = cancelledItems;

      // Check for new incoming orders
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

      // Check for newly cancelled items / orders
      const newCancelledIds = new Set(cancelledItems.map((c) => c.id));
      let newlyCancelled = null;

      for (const item of cancelledItems) {
        if (!knownCancelledIds.current.has(item.id)) {
          newlyCancelled = item;
          break;
        }
      }

      knownCancelledIds.current = newCancelledIds;

      if (newlyCancelled && !isInitialLoad.current) {
        if (audioEnabled) playCancellationWarningSound();
        setCancelAlert(newlyCancelled);
        setTimeout(() => setCancelAlert(null), 7000);
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

  // Fast optimistic status shifter: immediately moves order to target cart in UI!
  const updateStatus = async (orderId, newStatus) => {
    // 1. Optimistic instant UI update
    setData((prev) => {
      if (!prev || !prev.orders) return prev;
      if (newStatus === "SERVED" || newStatus === "CANCELLED") {
        return {
          ...prev,
          orders: prev.orders.filter((o) => o.id !== orderId),
        };
      }
      return {
        ...prev,
        orders: prev.orders.map((o) =>
          o.id === orderId ? { ...o, status: newStatus } : o
        ),
      };
    });

    // 2. Perform background server update
    try {
      await fetch(`/api/kitchen/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      // Silently re-sync with server
      await fetchOrders();
    } catch (err) {
      console.error("Status update error:", err);
      await fetchOrders();
    }
  };

  // Chef clicked "Done" on a cancelled item: clear that item and refresh carts
  const markCancelledItemDone = async (item) => {
    const itemId = item.id;

    // 1. Optimistically clear from displayed list
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        cancelledItems: (prev.cancelledItems || []).filter((c) => c.id !== itemId),
      };
    });

    // 2. Persist in local storage so subsequent polls won't show it
    clearedCancelledIdsRef.current.add(itemId);
    try {
      localStorage.setItem(
        `alphay_kds_cleared_${restaurantId || "default"}`,
        JSON.stringify(Array.from(clearedCancelledIdsRef.current))
      );
    } catch {}

    // 3. Notify backend API to acknowledge cancelled item
    try {
      await fetch("/api/kitchen/orders/acknowledge-cancelled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: item.orderId,
          orderItemId: item.orderItemId,
        }),
      });
    } catch (err) {
      console.warn("Backend acknowledge notice:", err);
    }

    // 4. Immediately refresh cart & orders
    await fetchOrders();
  };

  // Chef clicked "Clear All Done"
  const markAllCancelledDone = async () => {
    const current = data?.cancelledItems || [];
    if (current.length === 0) return;

    // 1. Optimistically clear all
    setData((prev) => {
      if (!prev) return prev;
      return { ...prev, cancelledItems: [] };
    });

    // 2. Persist
    current.forEach((item) => {
      clearedCancelledIdsRef.current.add(item.id);
    });
    try {
      localStorage.setItem(
        `alphay_kds_cleared_${restaurantId || "default"}`,
        JSON.stringify(Array.from(clearedCancelledIdsRef.current))
      );
    } catch {}

    // 3. Notify backend
    await Promise.all(
      current.map((item) =>
        fetch("/api/kitchen/orders/acknowledge-cancelled", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: item.orderId,
            orderItemId: item.orderItemId,
          }),
        }).catch(() => {})
      )
    );

    // 4. Refresh cart & orders
    await fetchOrders();
  };

  const newOrders = (data?.orders || []).filter((o) => o.status === "CONFIRMED");
  const preparingOrders = (data?.orders || []).filter((o) => o.status === "PREPARING");
  const readyOrders = (data?.orders || []).filter((o) => o.status === "READY");
  const cancelledItems = data?.cancelledItems || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Sound enablement / alerts overlay */}
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
                {newOrderAlert.isParcel || String(newOrderAlert.tableNumber).toUpperCase().includes("PARCEL")
                  ? `📦 PARCEL TAKEAWAY · TOKEN #${newOrderAlert.token || newOrderAlert.orderNumber}`
                  : `ORDER #${newOrderAlert.orderNumber} · TABLE ${newOrderAlert.tableNumber}`}
              </p>
            </div>
          </motion.div>
        )}

        {cancelAlert && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl bg-rose-600 text-white px-6 py-4 shadow-2xl border-2 border-rose-300 font-bold animate-pulse"
          >
            <span className="text-3xl">⚠️</span>
            <div>
              <p className="text-lg uppercase tracking-wider">ITEM CANCELLED BY CUSTOMER!</p>
              <p className="text-sm font-mono">
                {cancelAlert.isParcel || String(cancelAlert.tableNumber).toUpperCase().includes("PARCEL")
                  ? `📦 PARCEL TOKEN #${cancelAlert.token || cancelAlert.orderNumber}`
                  : `TABLE #${cancelAlert.tableNumber}`} · {cancelAlert.quantity}× {cancelAlert.name}
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
            className="rounded-2xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 border border-slate-700 cursor-pointer"
          >
            ⛶ Fullscreen
          </button>
        </div>
      </header>

      {/* Main 4 Column KDS Layout */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 overflow-hidden">
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
                <KitchenOrderCard
                  key={order.id}
                  order={order}
                  currentStatus="CONFIRMED"
                  onUpdateStatus={updateStatus}
                />
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
                <KitchenOrderCard
                  key={order.id}
                  order={order}
                  currentStatus="PREPARING"
                  onUpdateStatus={updateStatus}
                />
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
                <KitchenOrderCard
                  key={order.id}
                  order={order}
                  currentStatus="READY"
                  onUpdateStatus={updateStatus}
                />
              ))
            )}
          </div>
        </section>

        {/* COLUMN 4: CANCELLED ITEMS TABLE */}
        <section className="flex flex-col rounded-3xl bg-slate-900/80 border-2 border-rose-500/40 p-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-rose-500/30 pb-3 mb-4">
            <div>
              <h2 className="text-xl font-black text-rose-400 tracking-wider flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full bg-rose-500 animate-pulse" />
                CANCELLED ITEMS ({cancelledItems.length})
              </h2>
              <span className="text-[11px] font-mono font-bold text-rose-300">
                DO NOT PREPARE
              </span>
            </div>
            {cancelledItems.length > 1 && (
              <button
                type="button"
                onClick={markAllCancelledDone}
                className="text-[11px] font-mono font-bold bg-rose-950 hover:bg-rose-900 text-rose-200 px-3 py-1.5 rounded-xl border border-rose-700 transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                ✓ Clear All Done
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
            {cancelledItems.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center text-slate-500 font-bold text-xs space-y-1">
                <span className="text-2xl">✓</span>
                <span>No active cancelled items</span>
                <span className="text-[10px] text-slate-600">Items cleared after chef confirmation</span>
              </div>
            ) : (
              cancelledItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl bg-rose-950/40 p-4 border border-rose-500/50 shadow-md space-y-3 transition-all"
                >
                  <div className="flex justify-between items-start border-b border-rose-900/60 pb-2">
                    <div>
                      <span className="font-mono text-[11px] font-bold text-rose-300">
                        {item.isParcel || String(item.tableNumber).toUpperCase().includes("PARCEL")
                          ? `📦 PARCEL TOKEN #${item.token || item.orderNumber}`
                          : `TABLE #${item.tableNumber} · ${item.orderNumber}`}
                      </span>
                      <p className="text-base font-black text-rose-200">
                        {item.quantity}× {item.name}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-rose-400 bg-rose-950 px-2 py-0.5 rounded-md border border-rose-800">
                      {timeAgo(item.cancelledAt)}
                    </span>
                  </div>

                  <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400 font-mono">
                    ⚠️ CANCELLED BY GUEST — REMOVED FROM ORDER
                  </div>

                  {/* DONE BUTTON: CLEARS ITEM AND REFRESHES CART */}
                  <button
                    type="button"
                    onClick={() => markCancelledItemDone(item)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-2.5 px-3 text-xs font-black uppercase tracking-wider shadow-lg transition-all active:scale-95 cursor-pointer border border-emerald-400/40"
                  >
                    <span>✓</span>
                    <span>DONE — CLEAR & REFRESH CART</span>
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
