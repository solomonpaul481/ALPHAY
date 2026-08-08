"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createApiClient } from "@/lib/api-client";
import Timeline from "@/components/Timeline";
import CallStaffButton from "@/components/CallStaffButton";

const POLL_INTERVAL_MS = 3000;

const STATUS_MESSAGE = {
  CONFIRMED: "✓ Order Confirmed by Kitchen",
  PREPARING: "👨‍🍳 Chef is Preparing Your Food",
  READY: "🔔 Your Order is Ready to Serve!",
  SERVED: "🍽️ Order Served! Enjoy your meal",
};

export default function TrackOrderPage() {
  const { restaurantId, orderId } = useParams();
  const router = useRouter();
  const api = createApiClient(restaurantId);

  const [order, setOrder] = useState(null);
  const [toast, setToast] = useState(null);
  const lastStatus = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const data = await api.getOrder(orderId);
        if (cancelled) return;
        setOrder(data);

        if (lastStatus.current && lastStatus.current !== data.status && STATUS_MESSAGE[data.status]) {
          setToast(STATUS_MESSAGE[data.status]);
          setTimeout(() => setToast(null), 4000);
        }
        lastStatus.current = data.status;

        if (data.status !== "SERVED" && data.status !== "CANCELLED") {
          setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch (err) {
        if (!cancelled) setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (!order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-100 border-t-purple" />
          <p className="text-xs font-semibold text-ink2">Retrieving Live Order Details...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-4 pb-24 pt-6">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed inset-x-4 top-4 z-50 mx-auto max-w-sm rounded-2xl bg-purple px-5 py-3.5 text-center text-sm font-bold text-white shadow-lift"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-md space-y-6">
        {/* Order Header Card */}
        <div className="rounded-3xl bg-white p-6 shadow-soft border border-purple-50">
          <div className="flex items-center justify-between border-b border-purple-50 pb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink2">Order Number</p>
              <p className="font-mono text-2xl font-bold text-purple tabular-nums">
                #{order.id.slice(-6).toUpperCase()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink2">Table</p>
              <p className="font-mono text-2xl font-bold text-ink tabular-nums">
                {order.tableNumber}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-veg-tint px-3 py-1 text-xs font-bold text-veg">
              <span>✓</span> Payment Verified
            </span>
            <span className="font-mono text-xs font-semibold text-ink2">
              Total: ₹{order.total?.toFixed(2) || "0.00"}
            </span>
          </div>

          {order.estimatedPrepMinutes && order.status === "PREPARING" && (
            <div className="mt-4 rounded-2xl bg-purple-50 p-3.5 text-center">
              <p className="text-xs font-semibold text-purple">
                ⏱ Estimated Prep Time: ~{order.estimatedPrepMinutes} mins
              </p>
            </div>
          )}
        </div>

        {/* Live Timeline Tracker */}
        <div className="rounded-3xl bg-white p-6 shadow-soft border border-purple-50">
          <h2 className="font-display text-base font-bold text-ink mb-4">Live Order Progress</h2>
          <Timeline status={order.status} />
        </div>

        {/* Items Summary */}
        <div className="rounded-3xl bg-white p-6 shadow-soft border border-purple-50">
          <h2 className="font-display text-base font-bold text-ink mb-3">Order Items</h2>
          <div className="divide-y divide-purple-50">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between py-2.5 text-xs font-semibold text-ink">
                <span>
                  <strong className="text-purple">{item.quantity}×</strong> {item.name}
                </span>
                <span className="font-mono tabular-nums text-ink2">₹{(item.price * item.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>

        {order.status === "SERVED" && (
          <button
            type="button"
            onClick={() => router.push(`/r/${restaurantId}/rate/${orderId}`)}
            className="w-full rounded-2xl bg-purple py-4 text-sm font-bold text-white shadow-lift hover:bg-purple-deep transition-all"
          >
            Rate Your Dining Experience ⭐
          </button>
        )}
      </div>

      <CallStaffButton restaurantId={restaurantId} />
    </main>
  );
}
