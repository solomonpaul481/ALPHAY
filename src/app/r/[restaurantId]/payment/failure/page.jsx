"use client";

import { Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

function FailureContent() {
  const { restaurantId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const timedOut = searchParams.get("timeout") === "1";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-nonveg-tint text-4xl"
      >
        ✕
      </motion.div>

      <h1 className="mt-5 font-display text-2xl font-medium text-ink">Payment Failed</h1>
      <p className="mt-1 max-w-xs text-sm text-ink2">
        {timedOut
          ? "We couldn't confirm your payment in time. If money was deducted, it will be refunded automatically."
          : "Your payment didn't go through. No order has been placed and you haven't been charged."}
      </p>

      <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
        <button
          type="button"
          onClick={() => router.push(`/r/${restaurantId}/payment`)}
          className="rounded-xl bg-purple py-3.5 text-sm font-semibold text-white shadow-soft transition-transform active:scale-[0.98]"
        >
          Retry Payment
        </button>
        <button
          type="button"
          onClick={() => router.push(`/r/${restaurantId}/cart`)}
          className="rounded-xl bg-white py-3.5 text-sm font-semibold text-ink shadow-soft transition-transform active:scale-[0.98]"
        >
          Return to Cart
        </button>
      </div>
    </main>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center text-sm text-ink2">
        Loading…
      </main>
    }>
      <FailureContent />
    </Suspense>
  );
}
