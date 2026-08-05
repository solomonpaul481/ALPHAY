"use client";

import { Suspense, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { createApiClient } from "@/lib/api-client";

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 45; // ~90 seconds — generous for a webhook round trip

function ProcessingContent() {
  const { restaurantId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const api = createApiClient(restaurantId);
  const orderId = searchParams.get("orderId");
  const paymentId = searchParams.get("paymentId");
  const signature = searchParams.get("signature");
  const razorpayOrderId = searchParams.get("razorpayOrderId");
  const pollCount = useRef(0);
  const verifyingRef = useRef(false);

  useEffect(() => {
    if (!orderId) {
      router.replace(`/r/${restaurantId}/menu`);
      return;
    }

    let cancelled = false;

    const runVerificationAndPoll = async () => {
      // 1. First, attempt immediate signature verification if client params are available
      if (paymentId && signature && !verifyingRef.current) {
        verifyingRef.current = true;
        try {
          const res = await api.verifyPayment(orderId, {
            razorpayPaymentId: paymentId,
            razorpayOrderId: razorpayOrderId || "",
            razorpaySignature: signature,
          });
          if (res.success || res.status === "CONFIRMED") {
            router.replace(`/r/${restaurantId}/payment/success?orderId=${orderId}`);
            return;
          }
        } catch (err) {
          console.warn("Direct signature verification warning:", err);
        }
      }

      // 2. Poll backend for order status update
      const poll = async () => {
        try {
          const order = await api.getOrder(orderId);
          if (cancelled) return;

          if (
            order.status === "CONFIRMED" ||
            order.status === "PREPARING" ||
            order.status === "READY" ||
            order.status === "SERVED"
          ) {
            router.replace(`/r/${restaurantId}/payment/success?orderId=${orderId}`);
            return;
          }
          if (order.status === "PAYMENT_FAILED" || order.status === "CANCELLED") {
            router.replace(`/r/${restaurantId}/payment/failure?orderId=${orderId}`);
            return;
          }

          pollCount.current += 1;
          if (pollCount.current >= MAX_POLLS) {
            router.replace(`/r/${restaurantId}/payment/failure?orderId=${orderId}&timeout=1`);
            return;
          }
          setTimeout(poll, POLL_INTERVAL_MS);
        } catch (err) {
          if (cancelled) return;
          pollCount.current += 1;
          if (pollCount.current >= MAX_POLLS) {
            router.replace(`/r/${restaurantId}/payment/failure?orderId=${orderId}`);
            return;
          }
          setTimeout(poll, POLL_INTERVAL_MS);
        }
      };

      poll();
    };

    runVerificationAndPoll();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, paymentId, signature]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
        className="h-14 w-14 rounded-full border-4 border-purple-100 border-t-purple"
      />
      <h1 className="mt-6 font-display text-xl font-medium text-ink">Checking Payment…</h1>
      <p className="mt-2 text-sm text-ink2">Please wait.</p>
      <p className="mt-1 text-sm font-semibold text-ink">Do not close this page.</p>
    </main>
  );
}

export default function PaymentProcessingPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center text-sm text-ink2">
        Loading…
      </main>
    }>
      <ProcessingContent />
    </Suspense>
  );
}
