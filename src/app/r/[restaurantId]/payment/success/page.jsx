"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { createApiClient } from "@/lib/api-client";
import TicketCard from "@/components/TicketCard";

function SuccessContent() {
  const { restaurantId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const api = createApiClient(restaurantId);
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!orderId) return;
    api.getOrder(orderId).then(setOrder).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-veg-tint text-4xl"
      >
        ✅
      </motion.div>

      <h1 className="mt-5 font-display text-2xl font-medium text-ink">Payment Successful</h1>
      <p className="mt-1 text-sm text-ink2">Your order has been confirmed.</p>

      <div className="mt-6 w-full max-w-sm">
        <TicketCard
          header={
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/70">Order No.</p>
                <p className="font-mono text-lg font-semibold tabular-nums">
                  {order ? order.id.slice(-6).toUpperCase() : "…"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-white/70">Table</p>
                <p className="font-mono text-lg font-semibold tabular-nums">
                  {order?.tableNumber ?? "…"}
                </p>
              </div>
            </div>
          }
        >
          <div className="space-y-2">
            {order?.items?.map((item, i) => (
              <div key={i} className="flex justify-between text-sm text-ink2">
                <span>
                  {item.quantity} × {item.name}
                </span>
                <span className="font-mono tabular-nums">₹{(item.price * item.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>
          <div className="ticket-divider mt-3 flex justify-between pt-3 text-sm text-ink2">
            <span>Transaction ID</span>
            <span className="font-mono text-xs">{order?.cashfreePaymentId || "—"}</span>
          </div>
          <div className="mt-2 flex justify-between font-display text-base font-medium text-ink">
            <span>Amount Paid</span>
            <span className="font-mono tabular-nums">₹{order ? order.total.toFixed(2) : "—"}</span>
          </div>
        </TicketCard>
      </div>

      <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
        <button
          type="button"
          onClick={() => router.push(`/r/${restaurantId}/track/${orderId}`)}
          className="rounded-xl bg-purple py-3.5 text-sm font-semibold text-white shadow-soft transition-transform active:scale-[0.98]"
        >
          Track Order
        </button>
        <button
          type="button"
          onClick={() => router.push(`/r/${restaurantId}/menu`)}
          className="rounded-xl bg-white py-3.5 text-sm font-semibold text-ink shadow-soft transition-transform active:scale-[0.98]"
        >
          Back to Menu
        </button>
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center text-sm text-ink2">
        Loading…
      </main>
    }>
      <SuccessContent />
    </Suspense>
  );
}
