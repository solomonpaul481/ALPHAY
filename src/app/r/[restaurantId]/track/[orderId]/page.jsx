"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createApiClient } from "@/lib/api-client";
import Timeline from "@/components/Timeline";
import CallStaffButton from "@/components/CallStaffButton";

const POLL_INTERVAL_MS = 4000;

const STATUS_MESSAGE = {
  CONFIRMED: "Order Accepted",
  PREPARING: "Preparing Your Food",
  READY: "Order Ready",
  SERVED: "Served",
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
          setTimeout(() => setToast(null), 3500);
        }
        lastStatus.current = data.status;

        if (data.status !== "SERVED") {
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
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-100 border-t-purple" />
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 pb-16 pt-6">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed inset-x-4 top-4 z-50 mx-auto max-w-sm rounded-xl bg-ink px-4 py-3 text-center text-sm font-semibold text-white shadow-lift"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink2">Order No.</p>
            <p className="font-mono text-lg font-semibold text-ink tabular-nums">
              {order.id.slice(-6).toUpperCase()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-ink2">Table</p>
            <p className="font-mono text-lg font-semibold text-ink tabular-nums">{order.tableNumber}</p>
          </div>
        </div>

        {order.queuePosition != null && order.status !== "READY" && order.status !== "SERVED" && (
          <motion.div
            key={order.queuePosition}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-5 rounded-card bg-purple px-5 py-4 text-center text-white shadow-lift"
          >
            <p className="text-xs uppercase tracking-wide text-white/70">You are on the queue</p>
            <p className="mt-1 font-mono text-3xl font-bold tabular-nums">No. {order.queuePosition}</p>
          </motion.div>
        )}

        {order.estimatedPrepMinutes != null && order.status === "PREPARING" && (
          <p className="mt-3 text-center text-sm text-ink2">
            Estimated preparation time: ~{order.estimatedPrepMinutes} mins
          </p>
        )}

        <div className="mt-8 rounded-card bg-white p-5 shadow-soft">
          <Timeline status={order.status} />
        </div>

        {order.status === "SERVED" && (
          <button
            type="button"
            onClick={() => router.push(`/r/${restaurantId}/rate/${orderId}`)}
            className="mt-6 w-full rounded-xl bg-purple py-3.5 text-sm font-semibold text-white shadow-soft transition-transform active:scale-[0.98]"
          >
            Rate Your Experience
          </button>
        )}
      </div>

      <CallStaffButton restaurantId={restaurantId} />
    </main>
  );
}
