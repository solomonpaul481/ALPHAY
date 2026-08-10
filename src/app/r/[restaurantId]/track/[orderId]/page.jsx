"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createApiClient } from "@/lib/api-client";
import Timeline from "@/components/Timeline";
import CallStaffButton from "@/components/CallStaffButton";
import { IconCheck, IconClock } from "@/components/Icons";

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
    if (!restaurantId || !orderId) return;
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
  }, [restaurantId, orderId]);

  if (!order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
          <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">Loading Order Progress...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 px-4 pb-28 pt-6 text-slate-900 dark:text-white">
      {toast && (
        <div className="fixed inset-x-4 top-4 z-50 mx-auto max-w-sm rounded-2xl bg-indigo-600 px-5 py-3.5 text-center text-xs font-extrabold text-white shadow-xl">
          {toast}
        </div>
      )}

      <div className="mx-auto max-w-md space-y-6">
        {/* Order Header Card */}
        <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-sm border border-slate-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-4">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Order Number</p>
              <p className="font-mono text-2xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                #{order.id.slice(-6).toUpperCase()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Table</p>
              <div className="mt-0.5 inline-flex rounded-md bg-indigo-600 px-3 py-1 text-sm font-black text-white">
                TABLE #{order.tableNumber}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs font-bold flex-wrap gap-2">
            {order.payment?.status === "CASH_PENDING" || order.paymentMethod === "CASH" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 px-3 py-1 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                💵 Pay Cash at Counter
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <IconCheck className="h-3.5 w-3.5" /> Payment Verified
              </span>
            )}
            <span className="font-mono text-slate-900 dark:text-white">
              Total: ₹{order.total?.toFixed(2) || "0.00"}
            </span>
          </div>

          {order.estimatedPrepMinutes && order.status === "PREPARING" && (
            <div className="mt-4 rounded-2xl bg-indigo-50 dark:bg-zinc-800 p-3.5 text-center flex items-center justify-center gap-2 text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
              <IconClock className="h-4 w-4" />
              <span>Estimated Prep Time: ~{order.estimatedPrepMinutes} mins</span>
            </div>
          )}
        </div>

        {/* Live Timeline Tracker */}
        <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-sm border border-slate-200 dark:border-zinc-800">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">Live Order Progress</h2>
          <Timeline status={order.status} />
        </div>

        {/* Items Summary */}
        <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-sm border border-slate-200 dark:border-zinc-800">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-3">Order Items</h2>
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between py-2.5 text-xs font-bold text-slate-900 dark:text-white">
                <span>
                  <strong className="text-indigo-600 dark:text-indigo-400 mr-1.5">{item.quantity}×</strong>
                  {item.name}
                </span>
                <span className="font-mono tabular-nums text-slate-500 dark:text-zinc-400">
                  ₹{(item.price * item.quantity).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {order.status === "SERVED" && (
          <button
            type="button"
            onClick={() => router.push(`/r/${restaurantId}/rate/${orderId}`)}
            className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 py-4 text-xs font-extrabold text-white shadow-md transition-all cursor-pointer"
          >
            Rate Your Dining Experience ⭐
          </button>
        )}
      </div>

      <CallStaffButton restaurantId={restaurantId} />
    </main>
  );
}
